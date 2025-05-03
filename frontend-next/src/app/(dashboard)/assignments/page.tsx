"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Icons
import {
  Plus,
  Filter,
  Search,
  Laptop,
  Monitor,
  Phone,
  Car,
  Package,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  Edit,
  RefreshCw,
  Tag,
  User,
  Clock,
  DollarSign,
  BarChart4,
  Info,
  Loader2,
} from "lucide-react";

// Services & Types
import { 
  getAllAssets, 
  createAsset, 
  deleteAsset 
} from "@/services/assetService";
import { 
  getAllAssignments, 
  createAssignment, 
  returnAssignment,
  deleteAssignment
} from "@/services/assignmentService";
import { getAllEmployees } from "@/services/employeeService";
import { 
  AssetStatus, 
  AssetCategory, 
  Asset,
  Employee
} from "@prisma/client";
import {
  AssetWithAssignments,
  AssetQueryParams,
  NewAssetData,
  AssignmentWithIncludes,
  AssignmentQueryParams,
  NewAssignmentData
} from "@/types/asset";
import { Employee as EmployeeType } from "@/types/employee";

// Helper configs
const assetStatusConfig: Record<AssetStatus, { label: string; color: string; icon: React.ElementType }> = {
  [AssetStatus.AVAILABLE]: { label: 'Mevcut', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [AssetStatus.ASSIGNED]: { label: 'Zimmetli', color: 'bg-blue-100 text-blue-800', icon: User },
  [AssetStatus.UNDER_MAINTENANCE]: { label: 'Bakımda', color: 'bg-yellow-100 text-yellow-800', icon: Settings },
  [AssetStatus.DECOMMISSIONED]: { label: 'Kullanım Dışı', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

const assetCategoryConfig: Record<AssetCategory, { label: string; color: string; icon: React.ElementType }> = {
  [AssetCategory.COMPUTER]: { label: 'Bilgisayar', color: 'bg-indigo-100 text-indigo-800', icon: Laptop },
  [AssetCategory.LAPTOP]: { label: 'Laptop', color: 'bg-purple-100 text-purple-800', icon: Laptop },
  [AssetCategory.MONITOR]: { label: 'Monitör', color: 'bg-cyan-100 text-cyan-800', icon: Monitor },
  [AssetCategory.PHONE]: { label: 'Telefon', color: 'bg-green-100 text-green-800', icon: Phone },
  [AssetCategory.VEHICLE]: { label: 'Araç', color: 'bg-red-100 text-red-800', icon: Car },
  [AssetCategory.FURNITURE]: { label: 'Mobilya', color: 'bg-amber-100 text-amber-800', icon: Package },
  [AssetCategory.EQUIPMENT]: { label: 'Ekipman', color: 'bg-blue-100 text-blue-800', icon: Settings },
  [AssetCategory.SOFTWARE]: { label: 'Yazılım', color: 'bg-violet-100 text-violet-800', icon: FileText },
  [AssetCategory.OTHER]: { label: 'Diğer', color: 'bg-gray-100 text-gray-800', icon: Package }
};

// Date format helper
const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy", { locale: tr });
  } catch (e) {
    return "Geçersiz Tarih";
  }
};

// Cost format helper
const formatCost = (cost: any): string => {
  if (cost === null || cost === undefined) return "-";
  // Sayı veya string'i sayıya çevir ve formatla
  const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
  if (isNaN(numCost)) return "-";
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(numCost);
};

// State tipleri
type AssetStatusFilter = AssetStatus | "ALL";
type AssetCategoryFilter = AssetCategory | "ALL";
type AssignmentStatusFilter = "active" | "returned" | "ALL";

// Form veri tipleri (Doğrudan Zod şemalarından türetilebilir veya burada tanımlanabilir)
interface AssetFormData {
  name: string;
  assetTag: string;
  category: AssetCategory;
  // ... diğer asset form alanları
}
interface AssignmentFormData {
  assetId: string;
  employeeId: string;
  assignmentDate: string;
  // ... diğer assignment form alanları
}

export default function AssignmentsPage() {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("assets");

  // Main data states
  const [assets, setAssets] = useState<AssetWithAssignments[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithIncludes[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states - Assets
  const [assetFilters, setAssetFilters] = useState<AssetQueryParams>({});
  const [selectedAssetStatus, setSelectedAssetStatus] = useState<AssetStatusFilter>('ALL');
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<AssetCategoryFilter>('ALL');
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>("");

  // Filter states - Assignments
  const [assignmentFilters, setAssignmentFilters] = useState<AssignmentQueryParams>({});
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState<AssignmentStatusFilter>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState<string>("");

  // Modal states
  const [newAssetModalOpen, setNewAssetModalOpen] = useState<boolean>(false);
  const [newAssignmentModalOpen, setNewAssignmentModalOpen] = useState<boolean>(false);
  const [assetDetailsModalOpen, setAssetDetailsModalOpen] = useState<boolean>(false);
  const [assignmentDetailsModalOpen, setAssignmentDetailsModalOpen] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithAssignments | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithIncludes | null>(null);
  
  // Form states
  const [newAssetForm, setNewAssetForm] = useState<Partial<NewAssetData>>({
    status: AssetStatus.AVAILABLE,
    category: AssetCategory.OTHER
  });
  const [newAssignmentForm, setNewAssignmentForm] = useState<Partial<NewAssignmentData>>({
    assignmentDate: new Date().toISOString().substring(0, 10)
  });
  
  // Modal loading states
  const [savingAsset, setSavingAsset] = useState<boolean>(false);
  const [savingAssignment, setSavingAssignment] = useState<boolean>(false);
  const [deletingAsset, setDeletingAsset] = useState<boolean>(false);
  const [returningAssignment, setReturningAssignment] = useState<boolean>(false);

  // Load assets and assignments data
  const fetchData = useCallback(async () => {
    setLoadingAssets(true);
    setLoadingAssignments(true);
    setError(null);
    try {
      // Filtreleri state'lerden al
      const currentAssetFilters: AssetQueryParams = {
          status: selectedAssetStatus === 'ALL' ? undefined : selectedAssetStatus,
          category: selectedAssetCategory === 'ALL' ? undefined : selectedAssetCategory,
          // searchQuery: assetFilters.searchQuery // Arama terimi varsa ekle
      };
      const currentAssignmentFilters: AssignmentQueryParams = {
          status: selectedAssignmentStatus === 'ALL' ? undefined : selectedAssignmentStatus,
          // employeeId: assignmentFilters.employeeId // Çalışan filtresi varsa ekle
      };

      const [assetsData, assignmentsData, employeesData] = await Promise.all([
        getAllAssets(currentAssetFilters),
        getAllAssignments(currentAssignmentFilters),
        getAllEmployees()
      ]);
      setAssets(assetsData);
      setAssignments(assignmentsData);
      setEmployees(employeesData); 
    } catch (err) {
      const message = err instanceof Error ? err.message : "Veri yüklenirken bilinmeyen bir hata oluştu.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingAssets(false);
      setLoadingAssignments(false);
    }
  }, [selectedAssetStatus, selectedAssetCategory, selectedAssignmentStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (error) {
      // Hata zaten fetchData içinde toast ile gösteriliyor, tekrar göstermeye gerek yok belki?
      // toast.error(error);
    }
  }, [error]);

  // --- Filter handling ---
  
  // Apply asset filters
  const applyAssetFilters = () => {
    const filters: AssetQueryParams = {};
    if (selectedAssetStatus !== "ALL") filters.status = selectedAssetStatus;
    if (selectedAssetCategory !== "ALL") filters.category = selectedAssetCategory;
    if (assetSearchQuery.trim()) filters.searchQuery = assetSearchQuery.trim();
    setAssetFilters(filters);
  };
  
  // Reset asset filters
  const resetAssetFilters = () => {
    setSelectedAssetStatus("ALL");
    setSelectedAssetCategory("ALL");
    setAssetSearchQuery("");
    setAssetFilters({});
  };
  
  // Apply assignment filters
  const applyAssignmentFilters = () => {
    const filters: AssignmentQueryParams = {};
    if (selectedAssignmentStatus !== "ALL") filters.status = selectedAssignmentStatus;
    if (selectedEmployeeId !== "ALL") filters.employeeId = selectedEmployeeId;
    setAssignmentFilters(filters);
  };
  
  // Reset assignment filters
  const resetAssignmentFilters = () => {
    setSelectedAssignmentStatus("ALL");
    setSelectedEmployeeId("ALL");
    setAssignmentSearchQuery("");
    setAssignmentFilters({});
  };
  
  // --- Form handling - Assets ---
  
  // Handle new asset form input change
  const handleAssetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssetForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle asset status selection change
  const handleAssetStatusChange = (value: string) => {
    setNewAssetForm(prev => ({ 
      ...prev, 
      status: value as AssetStatus
    }));
  };
  
  // Handle asset category selection change
  const handleAssetCategoryChange = (value: string) => {
    setNewAssetForm(prev => ({ 
      ...prev, 
      category: value as AssetCategory
    }));
  };
  
  // Create new asset
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssetForm.name || !newAssetForm.assetTag || !newAssetForm.category) {
      toast.error("Lütfen demirbaş adı, etiketi ve kategorisini doldurun.");
      return;
    }
    
    try {
      setSavingAsset(true);
      
      const assetData: NewAssetData = {
        name: newAssetForm.name,
        assetTag: newAssetForm.assetTag,
        category: newAssetForm.category as AssetCategory,
        status: newAssetForm.status as AssetStatus,
        description: newAssetForm.description,
        serialNumber: newAssetForm.serialNumber,
        purchaseDate: newAssetForm.purchaseDate,
        purchaseCost: newAssetForm.purchaseCost,
        warrantyExpiry: newAssetForm.warrantyExpiry,
        location: newAssetForm.location,
        notes: newAssetForm.notes,
      };
      
      const createdAsset = await createAsset(assetData);
      
      // Refresh assets list
      const updatedAssets = await getAllAssets(assetFilters);
      setAssets(updatedAssets);
      
      // Reset form and close modal
      setNewAssetForm({
        status: AssetStatus.AVAILABLE,
        category: AssetCategory.OTHER
      });
      setNewAssetModalOpen(false);
      
      toast.success("Demirbaş başarıyla eklendi.");
    } catch (error) {
      console.error("Demirbaş oluşturma hatası:", error);
      toast.error("Demirbaş eklenirken bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setSavingAsset(false);
    }
  };
  
  // Delete asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!assetId) return;
    
    try {
      setDeletingAsset(true);
      
      await deleteAsset(assetId);
      
      // Refresh assets list
      const updatedAssets = await getAllAssets(assetFilters);
      setAssets(updatedAssets);
      
      // Close modal if open
      setAssetDetailsModalOpen(false);
      setSelectedAsset(null);
      
      toast.success("Demirbaş başarıyla silindi.");
    } catch (error) {
      console.error("Demirbaş silme hatası:", error);
      toast.error("Demirbaş silinirken bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setDeletingAsset(false);
    }
  };
  
  // --- Form handling - Assignments ---
  
  // Handle new assignment form input change
  const handleAssignmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssignmentForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle employee selection change for new assignment
  const handleEmployeeChange = (value: string) => {
    setNewAssignmentForm(prev => ({ ...prev, employeeId: value }));
  };
  
  // Handle asset selection change for new assignment
  const handleAssetSelectChange = (value: string) => {
    setNewAssignmentForm(prev => ({ ...prev, assetId: value }));
  };
  
  // Create new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssignmentForm.assetId || !newAssignmentForm.employeeId || !newAssignmentForm.assignmentDate) {
      toast.error("Lütfen demirbaş, çalışan ve zimmet tarihini seçin.");
      return;
    }
    
    try {
      setSavingAssignment(true);
      
      const assignmentData: NewAssignmentData = {
        assetId: newAssignmentForm.assetId,
        employeeId: newAssignmentForm.employeeId,
        assignmentDate: newAssignmentForm.assignmentDate,
        expectedReturnDate: newAssignmentForm.expectedReturnDate || null,
        notes: newAssignmentForm.notes,
      };
      
      const createdAssignment = await createAssignment(assignmentData);
      
      // Refresh data
      const [updatedAssets, updatedAssignments] = await Promise.all([
        getAllAssets(assetFilters),
        getAllAssignments(assignmentFilters)
      ]);
      
      setAssets(updatedAssets);
      setAssignments(updatedAssignments);
      
      // Reset form and close modal
      setNewAssignmentForm({
        assignmentDate: new Date().toISOString().substring(0, 10)
      });
      setNewAssignmentModalOpen(false);
      
      toast.success("Zimmet kaydı başarıyla oluşturuldu.");
    } catch (error) {
      console.error("Zimmet oluşturma hatası:", error);
      toast.error("Zimmet oluşturulurken bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setSavingAssignment(false);
    }
  };
  
  // Return assignment (end assignment)
  const handleReturnAssignment = async (assignmentId: string) => {
    setReturningAssignment(true);
    try {
      await returnAssignment(assignmentId, format(new Date(), 'yyyy-MM-dd'));
      toast.success("Zimmet başarıyla iade edildi.");
      fetchData();
    } catch (err) {
      console.error("Zimmet iade hatası:", err);
      toast.error("Zimmet iade edilirken bir hata oluştu: " + (err instanceof Error ? err.message : "Bilinmeyen hata"));
    } finally {
      setReturningAssignment(false);
    }
  };
  
  // --- Computed values and filters ---
  
  // Get available assets for assignment (status === AVAILABLE)
  const availableAssets = useMemo(() => {
    return assets.filter(asset => asset.status === AssetStatus.AVAILABLE);
  }, [assets]);
  
  // Get active assignments (returnDate === null)
  const activeAssignments = useMemo(() => {
    return assignments.filter(assignment => assignment.returnDate === null);
  }, [assignments]);
  
  // Filter assets based on search query in the UI (not API)
  const filteredAssets = useMemo(() => {
    if (!assetSearchQuery.trim()) return assets;
    
    const query = assetSearchQuery.toLowerCase().trim();
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(query) ||
      asset.assetTag.toLowerCase().includes(query) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(query)) ||
      (asset.description && asset.description.toLowerCase().includes(query))
    );
  }, [assets, assetSearchQuery]);

  // Filter assignments based on search in the UI (not API)
  const filteredAssignments = useMemo(() => {
    if (!assignmentSearchQuery.trim()) return assignments;
    
    const query = assignmentSearchQuery.toLowerCase().trim();
    return assignments.filter(assignment => 
      (assignment.asset?.name && assignment.asset.name.toLowerCase().includes(query)) ||
      (assignment.asset?.assetTag && assignment.asset.assetTag.toLowerCase().includes(query)) ||
      (assignment.employee?.name && `${assignment.employee.name} ${assignment.employee.surname}`.toLowerCase().includes(query))
    );
  }, [assignments, assignmentSearchQuery]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Zimmet Yönetimi</h1>
      </div>
      
      <Tabs defaultValue="assets" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Demirbaşlar</TabsTrigger>
          <TabsTrigger value="assignments">Zimmet Kayıtları</TabsTrigger>
        </TabsList>
        
        {/* ASSETS TAB */}
        <TabsContent value="assets" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={selectedAssetStatus} onValueChange={(value) => setSelectedAssetStatus(value as AssetStatusFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                  {Object.values(AssetStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {assetStatusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedAssetCategory} onValueChange={(value) => setSelectedAssetCategory(value as AssetCategoryFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kategori Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                  {Object.values(AssetCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {assetCategoryConfig[category].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={applyAssetFilters}
                  title="Filtrele"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetAssetFilters}
                  title="Filtreleri Temizle"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara: Ad, etiket, seri no..."
                  className="pl-8"
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                />
              </div>
              
              <Button onClick={() => setNewAssetModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Demirbaş
              </Button>
            </div>
          </div>
          
          {/* Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Demirbaşlar</CardTitle>
              <CardDescription>
                Toplam {filteredAssets.length} demirbaş | {availableAssets.length} Mevcut, {assets.filter(a => a.status === AssetStatus.ASSIGNED).length} Zimmetli
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssets ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-muted-foreground">Demirbaşlar yükleniyor...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Demirbaş bulunamadı
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Etiket</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Zimmet</TableHead>
                        <TableHead>Satın Alma</TableHead>
                        <TableHead>Seri No</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => {
                        // Get active assignment if any
                        const activeAssignment = asset.assignments?.find(a => a.returnDate === null);
                        
                        return (
                          <TableRow 
                            key={asset.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setAssetDetailsModalOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">{asset.assetTag}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell>
                              <Badge className={assetCategoryConfig[asset.category].color}>
                                <span className="flex items-center">
                                  {React.createElement(assetCategoryConfig[asset.category].icon, { className: "h-3 w-3 mr-1" })}
                                  {assetCategoryConfig[asset.category].label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={assetStatusConfig[asset.status].color}>
                                <span className="flex items-center">
                                  {React.createElement(assetStatusConfig[asset.status].icon, { className: "h-3 w-3 mr-1" })}
                                  {assetStatusConfig[asset.status].label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {activeAssignment ? (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {activeAssignment.employee?.name} {activeAssignment.employee?.surname}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(activeAssignment.assignmentDate)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{formatDate(asset.purchaseDate)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCost(asset.purchaseCost)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {asset.serialNumber || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Pre-fill assignment form with this asset
                                    setNewAssignmentForm({
                                      ...newAssignmentForm,
                                      assetId: asset.id
                                    });
                                    setNewAssignmentModalOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  disabled={asset.status !== AssetStatus.AVAILABLE}
                                  title={asset.status !== AssetStatus.AVAILABLE ? "Bu demirbaş zimmete uygun değil" : "Zimmet Oluştur"}
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAsset(asset);
                                    setAssetDetailsModalOpen(true);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  title="Detaylar"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={selectedAssignmentStatus} onValueChange={(value) => setSelectedAssignmentStatus(value as AssignmentStatusFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif Zimmetler</SelectItem>
                  <SelectItem value="returned">İade Edilenler</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Çalışan Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Çalışanlar</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} {employee.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={applyAssignmentFilters}
                  title="Filtrele"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetAssignmentFilters}
                  title="Filtreleri Temizle"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara: Demirbaş, çalışan..."
                  className="pl-8"
                  value={assignmentSearchQuery}
                  onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                />
              </div>
              
              <Button onClick={() => setNewAssignmentModalOpen(true)} disabled={availableAssets.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Zimmet
              </Button>
            </div>
          </div>
          
          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Zimmet Kayıtları</CardTitle>
              <CardDescription>
                Toplam {filteredAssignments.length} kayıt | {activeAssignments.length} Aktif, {assignments.length - activeAssignments.length} İade Edilmiş
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-muted-foreground">Zimmet kayıtları yükleniyor...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : filteredAssignments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Zimmet kaydı bulunamadı
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Demirbaş</TableHead>
                        <TableHead>Zimmet Alan</TableHead>
                        <TableHead>Zimmet Tarihi</TableHead>
                        <TableHead>İade Tarihi</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Beklenen İade</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((assignment) => (
                        <TableRow 
                          key={assignment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setAssignmentDetailsModalOpen(true);
                          }}
                        >
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{assignment.asset?.name || "Demirbaş Bulunamadı"}</div>
                              <div className="text-xs text-muted-foreground">{assignment.asset?.assetTag || "?"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{assignment.employee?.name} {assignment.employee?.surname}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(assignment.assignmentDate)}</TableCell>
                          <TableCell>{formatDate(assignment.returnDate)}</TableCell>
                          <TableCell>
                            <Badge className={assignment.returnDate ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              <span className="flex items-center">
                                {assignment.returnDate ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    İade Edildi
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Zimmet Devam Ediyor
                                  </>
                                )}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(assignment.expectedReturnDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!assignment.returnDate && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAssignment(assignment);
                                    // Open details modal and handle return there
                                    setAssignmentDetailsModalOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  title="İade Et"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAssignment(assignment);
                                  setAssignmentDetailsModalOpen(true);
                                }}
                                variant="ghost"
                                size="sm"
                                title="Detaylar"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Asset Modal */}
      <Dialog open={newAssetModalOpen} onOpenChange={setNewAssetModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Demirbaş Ekle</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir demirbaş eklemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAsset}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Demirbaş Adı *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newAssetForm.name || ""}
                    onChange={handleAssetInputChange}
                    placeholder="Örn: Dell Latitude 7400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetTag">Demirbaş Etiketi *</Label>
                  <Input
                    id="assetTag"
                    name="assetTag"
                    value={newAssetForm.assetTag || ""}
                    onChange={handleAssetInputChange}
                    placeholder="Örn: IT-LAP-001"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={newAssetForm.category}
                    onValueChange={handleAssetCategoryChange}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategori Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AssetCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {assetCategoryConfig[category].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={newAssetForm.status}
                    onValueChange={handleAssetStatusChange}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Durum Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AssetStatus).map(status => (
                        <SelectItem key={status} value={status}>
                          {assetStatusConfig[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Seri Numarası</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={newAssetForm.serialNumber || ""}
                  onChange={handleAssetInputChange}
                  placeholder="Ürün seri numarası (varsa)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Satın Alma Tarihi</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={newAssetForm.purchaseDate || ""}
                    onChange={handleAssetInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseCost">Satın Alma Maliyeti (₺)</Label>
                  <Input
                    id="purchaseCost"
                    name="purchaseCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAssetForm.purchaseCost || ""}
                    onChange={handleAssetInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Garanti Bitiş Tarihi</Label>
                  <Input
                    id="warrantyExpiry"
                    name="warrantyExpiry"
                    type="date"
                    value={newAssetForm.warrantyExpiry || ""}
                    onChange={handleAssetInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Konum/Lokasyon</Label>
                  <Input
                    id="location"
                    name="location"
                    value={newAssetForm.location || ""}
                    onChange={handleAssetInputChange}
                    placeholder="Örn: Merkez Ofis, 3. Kat"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newAssetForm.description || ""}
                  onChange={handleAssetInputChange}
                  placeholder="Demirbaş ile ilgili ek açıklamalar"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newAssetForm.notes || ""}
                  onChange={handleAssetInputChange}
                  placeholder="Özel notlar veya diğer bilgiler"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewAssetModalOpen(false)}
                disabled={savingAsset}
              >
                İptal
              </Button>
              <Button type="submit" disabled={savingAsset}>
                {savingAsset ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  "Demirbaş Ekle"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* New Assignment Modal */}
      <Dialog open={newAssignmentModalOpen} onOpenChange={setNewAssignmentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Zimmet Oluştur</DialogTitle>
            <DialogDescription>
              Bir demirbaşı bir çalışana zimmetlemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="assetId">Demirbaş *</Label>
                <Select
                  value={newAssignmentForm.assetId}
                  onValueChange={handleAssetSelectChange}
                  required
                >
                  <SelectTrigger id="assetId">
                    <SelectValue placeholder="Demirbaş Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.length === 0 ? (
                      <SelectItem value="no-assets-available" disabled>
                        Zimmete uygun demirbaş bulunamadı
                      </SelectItem>
                    ) : (
                      availableAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.assetTag})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Zimmet Alan Çalışan *</Label>
                <Select
                  value={newAssignmentForm.employeeId}
                  onValueChange={handleEmployeeChange}
                  required
                >
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="Çalışan Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <SelectItem value="no-employees-available" disabled>
                        Çalışan bulunamadı
                      </SelectItem>
                    ) : (
                      employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} {employee.surname}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentDate">Zimmet Tarihi *</Label>
                  <Input
                    id="assignmentDate"
                    name="assignmentDate"
                    type="date"
                    value={newAssignmentForm.assignmentDate || ""}
                    onChange={handleAssignmentInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedReturnDate">Beklenen İade Tarihi</Label>
                  <Input
                    id="expectedReturnDate"
                    name="expectedReturnDate"
                    type="date"
                    value={newAssignmentForm.expectedReturnDate || ""}
                    onChange={handleAssignmentInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newAssignmentForm.notes || ""}
                  onChange={handleAssignmentInputChange}
                  placeholder="Zimmet ile ilgili özel notlar"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewAssignmentModalOpen(false)}
                disabled={savingAssignment}
              >
                İptal
              </Button>
              <Button type="submit" disabled={savingAssignment}>
                {savingAssignment ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  "Zimmet Oluştur"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Asset Details Modal */}
      <Dialog open={assetDetailsModalOpen} onOpenChange={setAssetDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedAsset ? (
            <>
              <DialogHeader>
                <DialogTitle>Demirbaş Detayları</DialogTitle>
                <DialogDescription>
                  {selectedAsset.assetTag} kodlu demirbaşın detaylı bilgileri
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Demirbaş Adı</p>
                    <p className="text-lg font-medium">{selectedAsset.name}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className={assetCategoryConfig[selectedAsset.category].color}>
                      {React.createElement(assetCategoryConfig[selectedAsset.category].icon, { className: "h-3 w-3 mr-1 inline" })}
                      {assetCategoryConfig[selectedAsset.category].label}
                    </Badge>
                    <Badge className={assetStatusConfig[selectedAsset.status].color}>
                      {React.createElement(assetStatusConfig[selectedAsset.status].icon, { className: "h-3 w-3 mr-1 inline" })}
                      {assetStatusConfig[selectedAsset.status].label}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium">Temel Bilgiler</h3>
                    <ul className="mt-2 space-y-2">
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Etiket:</span>
                        <span>{selectedAsset.assetTag}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Seri No:</span>
                        <span>{selectedAsset.serialNumber || "-"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Konum:</span>
                        <span>{selectedAsset.location || "-"}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Finans Bilgileri</h3>
                    <ul className="mt-2 space-y-2">
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Satın Alma:</span>
                        <span>{formatDate(selectedAsset.purchaseDate)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Maliyet:</span>
                        <span>{formatCost(selectedAsset.purchaseCost)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Garanti:</span>
                        <span>{formatDate(selectedAsset.warrantyExpiry)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {selectedAsset.description && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1">Açıklama</h3>
                    <p className="text-sm">{selectedAsset.description}</p>
                  </div>
                )}
                
                {selectedAsset.notes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1">Notlar</h3>
                    <p className="text-sm">{selectedAsset.notes}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Zimmet Geçmişi</h3>
                  {selectedAsset.assignments && selectedAsset.assignments.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Çalışan</TableHead>
                            <TableHead>Zimmet Tarihi</TableHead>
                            <TableHead>İade Tarihi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedAsset.assignments.map(assignment => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                {assignment.employee ? 
                                  `${assignment.employee.name} ${assignment.employee.surname}` : 
                                  "Bilinmiyor"}
                              </TableCell>
                              <TableCell>{formatDate(assignment.assignmentDate)}</TableCell>
                              <TableCell>{formatDate(assignment.returnDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Bu demirbaşın henüz zimmet kaydı yok.</p>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Oluşturulma: {formatDate(selectedAsset.createdAt)}</p>
                  <p>Son Güncelleme: {formatDate(selectedAsset.updatedAt)}</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                {selectedAsset.status === AssetStatus.AVAILABLE && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewAssignmentForm({
                        ...newAssignmentForm,
                        assetId: selectedAsset.id
                      });
                      setAssetDetailsModalOpen(false);
                      setNewAssignmentModalOpen(true);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Zimmetle
                  </Button>
                )}
                
                {selectedAsset.status !== AssetStatus.ASSIGNED && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Bu demirbaşı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                        handleDeleteAsset(selectedAsset.id);
                      }
                    }}
                    disabled={deletingAsset}
                  >
                    {deletingAsset ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Siliniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Assignment Details Modal */}
      <Dialog open={assignmentDetailsModalOpen} onOpenChange={setAssignmentDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedAssignment ? (
            <>
              <DialogHeader>
                <DialogTitle>Zimmet Detayları</DialogTitle>
                <DialogDescription>
                  {selectedAssignment.asset?.name} demirbaşının zimmet bilgileri
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium">Demirbaş Bilgileri</h3>
                    <ul className="mt-2 space-y-2">
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Adı:</span>
                        <span>{selectedAssignment.asset?.name || "-"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Etiket:</span>
                        <span>{selectedAssignment.asset?.assetTag || "-"}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Zimmet Alan</h3>
                    <ul className="mt-2 space-y-2">
                      <li className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Adı:</span>
                        <span>{selectedAssignment.employee?.name} {selectedAssignment.employee?.surname}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium">Zimmet Tarihi</h3>
                    <p className="mt-1">{formatDate(selectedAssignment.assignmentDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">İade Tarihi</h3>
                    <p className="mt-1">
                      {selectedAssignment.returnDate ? 
                        formatDate(selectedAssignment.returnDate) : 
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          İade Edilmedi
                        </Badge>
                      }
                    </p>
                  </div>
                </div>
                
                {selectedAssignment.expectedReturnDate && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Beklenen İade Tarihi</h3>
                    <p className="mt-1">{formatDate(selectedAssignment.expectedReturnDate)}</p>
                  </div>
                )}
                
                {selectedAssignment.notes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Notlar</h3>
                    <p className="mt-1 text-sm">{selectedAssignment.notes}</p>
                  </div>
                )}
                
                {!selectedAssignment.returnDate && (
                  <div className="mb-4 p-4 border rounded-md bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">Zimmeti İade Et</h3>
                    <div className="space-y-2">
                      <Label htmlFor="returnDate">İade Tarihi</Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={new Date().toISOString().substring(0, 10)}
                        disabled={returningAssignment}
                        onChange={(e) => {
                          // Store temporarily in local component state
                          (e.target as HTMLInputElement).dataset.returnDate = e.target.value;
                        }}
                      />
                      <Button
                        disabled={returningAssignment}
                        onClick={() => {
                          // Get return date from input
                          const returnDateInput = document.getElementById("returnDate") as HTMLInputElement;
                          const returnDate = returnDateInput.dataset.returnDate || returnDateInput.value;
                          
                          if (returnDate) {
                            handleReturnAssignment(selectedAssignment.id);
                          } else {
                            toast.error("Lütfen geçerli bir iade tarihi seçin.");
                          }
                        }}
                        className="w-full mt-2"
                      >
                        {returningAssignment ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            İade Ediliyor...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Zimmeti İade Et
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  <p>Zimmet ID: {selectedAssignment.id}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 