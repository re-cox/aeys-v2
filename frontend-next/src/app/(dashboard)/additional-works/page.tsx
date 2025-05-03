"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus,
  Filter,
  X,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Link from 'next/link';
import { formatDate } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Durum seçenekleri
const STATUS_OPTIONS = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "To Do", label: "Yapılacak" },
  { value: "In Progress", label: "Devam Ediyor" },
  { value: "Done", label: "Tamamlandı" },
  { value: "Cancelled", label: "İptal Edildi" }
];

// Until LoadingSpinner component is available, let's create a placeholder
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  
  return (
    <div className="animate-spin">
      <svg
        className={sizeClasses[size]}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

interface Employee {
  id: string;
  name: string;
  surname: string;
  department?: {
    id: string;
    name: string;
  };
}

interface AdditionalWork {
  id: string;
  title: string;
  technicianNumber?: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: Employee[] | null;
  createdBy: Employee;
  files?: string[];
}

export default function AdditionalWorksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("query") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams?.get("status") || "all");
  const [selectedAssignee, setSelectedAssignee] = useState(searchParams?.get("assignedToId") || "");

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("query", searchQuery);
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedAssignee) params.set("assignedToId", selectedAssignee);
    
    router.push(`/additional-works?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedAssignee("");
    router.push("/additional-works");
  };

  useEffect(() => {
    const fetchAdditionalWorks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Oturum bilgisi bulunamadı.");
          toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
          localStorage.setItem('redirectUrl', window.location.pathname);
          window.location.href = '/login';
          return;
        }

        const params = new URLSearchParams(searchParams?.toString() || "");
        params.delete('priority');
        
        const response = await fetch(`/api/additional-works?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          setError("Oturum sonlanmış olabilir.");
          localStorage.removeItem('token');
          localStorage.setItem('redirectUrl', window.location.pathname);
          toast.error("Oturum sonlanmış olabilir. Lütfen tekrar giriş yapın.");
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ek işler getirilemedi");
        }
        
        const data = await response.json();
        
        // Yanıt formatını kontrol et ve state'i doğru dizi ile güncelle
        if (data && data.success === true && Array.isArray(data.data)) {
          setAdditionalWorks(data.data);
        } else {
          // Beklenmeyen format veya başarısız yanıt
          console.error("API'den beklenmeyen yanıt formatı:", data);
          setError("Veri formatı hatalı veya eksik.");
          setAdditionalWorks([]); // Hata durumunda state'i boş dizi yap
          toast.error("Ek iş verileri alınırken format hatası oluştu.");
        }

      } catch (err) {
        console.error("Ek işler getirilirken hata:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
        toast.error("Ek işler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalWorks();
  }, [searchParams]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "to do":
        return <Badge variant="outline">Yapılacak</Badge>;
      case "in progress":
        return <Badge className="bg-blue-500">Devam Ediyor</Badge>;
      case "done":
        return <Badge className="bg-green-500">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500">İptal Edildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/additional-works/${id}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Ek İşler</h1>
        <Button onClick={() => router.push("/additional-works/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ek İş
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex-1">
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Durum Seç" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 justify-end">
              <Button onClick={applyFilters} className="flex-1 sm:flex-none">
                Uygula
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results - Table View */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : Array.isArray(additionalWorks) ? (
        additionalWorks.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Teknisyen No</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Başlangıç Tarihi</TableHead>
                  <TableHead>Atananlar</TableHead>
                  <TableHead>Oluşturan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additionalWorks.map((work) => (
                  <TableRow 
                    key={work.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(work.id)}
                  >
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>{work.technicianNumber || "-"}</TableCell>
                    <TableCell>{getStatusBadge(work.status)}</TableCell>
                    <TableCell>{formatDate(work.startDate, true)}</TableCell>
                    <TableCell>
                      {work.assignedTo && work.assignedTo.length > 0
                        ? work.assignedTo.map(a => `${a.name} ${a.surname}`).join(", ")
                        : "Atanmamış"}
                    </TableCell>
                    <TableCell>
                      {work.createdBy.name} {work.createdBy.surname}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(work.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Görüntüle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/additional-works/${work.id}/edit`);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Düzenle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Implement delete logic here
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sil</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-500">Filtre kriterlerine uygun ek iş bulunamadı.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-gray-500">Veri işlenirken bir sorun oluştu (filteredWorks dizi değil).</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 