"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdditionalWorkForm } from "@/components/forms/AdditionalWorkForm";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { AlertCircle, Calendar, ClipboardEdit, Clock, Download, FileText, Trash2, User } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  surname: string;
  department?: {
    id: string;
    name: string;
  };
}

interface FileData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
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
  files?: FileData[];
}

interface PreparedInitialData {
  id: string;
  title: string;
  technicianNumber?: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  assignedTo: Employee[] | null;
  files?: string[];
  [key: string]: any;
}

const prepareInitialFormData = (work: AdditionalWork | null): PreparedInitialData | undefined => {
  if (!work) return undefined;
  
  return {
    id: work.id,
    title: work.title,
    technicianNumber: work.technicianNumber,
    description: work.description,
    status: work.status,
    startDate: work.startDate,
    endDate: work.endDate,
    assignedTo: work.assignedTo,
    files: work.files ? work.files.map(f => f.fileUrl) : [], 
  };
}

export default function AdditionalWorkDetailPage() {
  const params = useParams();
  const workId = params?.id as string;
  const router = useRouter();
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchAdditionalWork = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`/api/additional-works/${workId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ek iş getirilemedi");
        }
        
        const data = await response.json();
        setAdditionalWork(data);
      } catch (err) {
        console.error("Ek iş getirilirken hata:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    if (workId) {
      fetchAdditionalWork();
    }
  }, [workId]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/additional-works/${workId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ek iş silinemedi");
      }
      
      toast({
        title: "Başarılı",
        description: "Ek iş başarıyla silindi",
      });
      
      router.push("/additional-works");
    } catch (err) {
      console.error("Ek iş silinirken hata:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Ek iş silinemedi",
      });
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

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

  const handleEditSuccess = (updatedWork: AdditionalWork) => {
    setAdditionalWork(updatedWork);
    setIsEditDialogOpen(false);
    toast({
      title: "Başarılı",
      description: "Ek iş başarıyla güncellendi",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Ek İş Yüklenirken Hata</h2>
        <p className="text-gray-500">{error}</p>
        <Button variant="outline" onClick={() => router.push("/additional-works")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  if (!additionalWork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">Ek İş Bulunamadı</h2>
        <Button variant="outline" onClick={() => router.push("/additional-works")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  const initialFormData = prepareInitialFormData(additionalWork);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{additionalWork.title}</h1>
          {additionalWork.technicianNumber && (
            <p className="text-sm text-gray-500 mt-1">Teknisyen No: {additionalWork.technicianNumber}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ClipboardEdit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ek İşi Düzenle</DialogTitle>
                <DialogDescription>
                  Bu ek işin detaylarını güncelleyin
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <AdditionalWorkForm 
                  initialData={initialFormData}
                  onSuccess={handleEditSuccess}
                  mode="edit"
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Silme İşlemini Onaylayın</DialogTitle>
                <DialogDescription>
                  Bu ek işi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <LoadingSpinner size="sm" /> : "Sil"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detaylar</CardTitle>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(additionalWork.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-500">Açıklama</h3>
              <p className="mt-1">{additionalWork.description || "Açıklama girilmemiş."}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  Başlangıç: {formatDate(additionalWork.startDate, true)}
                </span>
              </div>
              
              {additionalWork.endDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">
                    Bitiş: {formatDate(additionalWork.endDate, true)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm">
                Oluşturulma: {formatDate(additionalWork.createdAt)}
                {additionalWork.updatedAt !== additionalWork.createdAt &&
                  ` (Güncelleme: ${formatDate(additionalWork.updatedAt)})`}
              </span>
            </div>
            
            {additionalWork.files && additionalWork.files.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h3 className="font-medium text-gray-500 mb-2">Eklenen Dosyalar</h3>
                <div className="space-y-2">
                  {additionalWork.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <a 
                          href={file.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline truncate max-w-[200px] sm:max-w-xs"
                        >
                          {file.fileName}
                        </a>
                        <span className="text-xs text-gray-500">
                          ({(file.fileSize / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <a href={file.fileUrl} download={file.fileName}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kişiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-500">Oluşturan</h3>
              <p className="mt-1">
                {additionalWork.createdBy.name} {additionalWork.createdBy.surname}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-gray-500">Atanan Personeller</h3>
              {additionalWork.assignedTo && additionalWork.assignedTo.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {additionalWork.assignedTo.map(person => (
                    <div key={person.id} className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p>{person.name} {person.surname}</p>
                        {person.department && (
                          <p className="text-xs text-gray-500">
                            {person.department.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-gray-500">Atanmamış</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={() => router.push("/additional-works")}>
          Listeye Dön
        </Button>
      </div>
    </div>
  );
} 