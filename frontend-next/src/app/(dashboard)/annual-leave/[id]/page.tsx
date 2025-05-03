"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, PenLine, Trash2, Calendar, User, Clock, FileText, Check, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { deleteAnnualLeave, getAnnualLeaveById } from "@/services/annualLeaveService";
import { getEmployeeById } from "@/services/employeeService";
import { AnnualLeave, LeaveStatus } from "@/types/annualLeave";
import { Employee } from "@/types/employee";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AnnualLeaveDetailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [leave, setLeave] = useState<AnnualLeave | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // İzin kaydını al
        const leaveData = await getAnnualLeaveById(id);
        setLeave(leaveData);
        
        // Personel bilgilerini al
        if (leaveData.employeeId) {
          const employeeData = await getEmployeeById(leaveData.employeeId);
          setEmployee(employeeData);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        toast.error("İzin kaydı yüklenemedi.");
        router.push('/annual-leave');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleDelete = async () => {
    try {
      const loadingToast = toast.loading("İzin kaydı siliniyor...");
      await deleteAnnualLeave(id);
      toast.dismiss(loadingToast);
      toast.success("İzin kaydı başarıyla silindi.");
      router.push('/annual-leave');
    } catch (error) {
      console.error("İzin kaydı silinirken hata:", error);
      toast.error("İzin kaydı silinemedi. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // İzin durumuna göre renk ve ikon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return { 
          color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", 
          icon: <Check className="h-4 w-4 mr-1" />,
          text: "Onaylandı"
        };
      case LeaveStatus.REJECTED:
        return { 
          color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400", 
          icon: <X className="h-4 w-4 mr-1" />,
          text: "Reddedildi"
        };
      default:
        return { 
          color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400", 
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          text: "Beklemede"
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            İzin Detayları
          </h1>
        </div>
        
        {!isLoading && leave && (
          <div className="flex space-x-2">
            <Link href={`/annual-leave/edit/${id}`}>
              <Button variant="outline" size="sm" className="flex items-center">
                <PenLine className="h-4 w-4 mr-1" />
                Düzenle
              </Button>
            </Link>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bu izin kaydını silmek istediğinize emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Bu işlem, izin kaydını kalıcı olarak sistemden kaldıracaktır.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Evet, Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : leave ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">İzin Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Personel</div>
                    <div className="font-medium flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {employee ? `${employee.name} ${employee.surname}` : "-"}
                      {employee?.department?.name && (
                        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          {employee.department.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Durum</div>
                    <div className="font-medium mt-1">
                      <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusInfo(leave.status).color}`}>
                        {getStatusInfo(leave.status).icon}
                        {getStatusInfo(leave.status).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Başlangıç Tarihi</div>
                    <div className="font-medium flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {leave.startDate ? format(new Date(leave.startDate), "d MMMM yyyy", { locale: tr }) : "-"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Bitiş Tarihi</div>
                    <div className="font-medium flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {leave.endDate ? format(new Date(leave.endDate), "d MMMM yyyy", { locale: tr }) : "-"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Toplam İş Günü</div>
                    <div className="font-medium flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {leave.totalDays} gün
                    </div>
                  </div>
                </div>

                {leave.reason && (
                  <div className="pt-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">İzin Sebebi</div>
                    <div className="font-medium flex items-start mt-1">
                      <FileText className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <p className="text-gray-800 dark:text-gray-200">{leave.reason}</p>
                    </div>
                  </div>
                )}

                {leave.notes && (
                  <div className="pt-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Notlar</div>
                    <div className="font-medium flex items-start mt-1">
                      <FileText className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <p className="text-gray-800 dark:text-gray-200">{leave.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {leave.status === LeaveStatus.APPROVED && leave.approvedBy && (
              <Card>
                <CardContent className="pt-6">
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Onaylayan</div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 mt-1">{leave.approvedBy}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/annual-leave/edit/${id}`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <PenLine className="h-4 w-4 mr-2" />
                    İzni Düzenle
                  </Button>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      İzni Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bu izin kaydını silmek istediğinize emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem geri alınamaz. Bu işlem, izin kaydını kalıcı olarak sistemden kaldıracaktır.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Evet, Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Link href="/annual-leave" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    İzin Listesine Dön
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            <p>İzin kaydı bulunamadı. İzin silinmiş veya erişim yetkiniz bulunmuyor olabilir.</p>
          </div>
        </div>
      )}
    </div>
  );
} 