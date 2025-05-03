"use client";

import { useState } from "react";
import { AnnualLeave, LeaveStatus } from "@/types/annual-leave";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteAnnualLeave, updateAnnualLeaveStatus } from "@/services/annualLeaveService";
import { format, differenceInBusinessDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Eye,
  Pencil,
  MoreVertical,
  Trash2,
  FileCheck,
  FileX,
  CalendarCheck,
  CalendarX,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LeaveDetailDialog } from "./leave-detail-dialog";
import { EditLeaveDialog } from "./edit-leave-dialog";

interface PendingLeavesProps {
  leaves: AnnualLeave[];
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export default function PendingLeaves({ leaves, onDelete, onUpdate }: PendingLeavesProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<AnnualLeave | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Sadece bekleyen izinleri filtrele
  const pendingLeaves = leaves.filter(
    (leave) => leave.status === LeaveStatus.PENDING
  );

  // İzin bilgilerini göster
  const showLeaveDetails = (leave: AnnualLeave) => {
    setSelectedLeave(leave);
    setDetailOpen(true);
  };

  // Personel bilgilerini göster
  const showEmployeeDetails = (leave: AnnualLeave) => {
    if(leave.user) {
       alert(`Personel: ${leave.user.name} ${leave.user.surname}\nID: ${leave.userId}`);
    } else {
       alert(`Personel bilgisi bulunamadı (ID: ${leave.userId})`);
    }
  };

  // İzni düzenle
  const handleEdit = (leave: AnnualLeave) => {
    setSelectedLeave(leave);
    setEditDialogOpen(true);
    alert('Düzenleme fonksiyonu henüz eklenmedi.');
  };

  // İzni onayla
  const handleApprove = async () => {
    if (!selectedLeave) return;
    const toastId = toast.loading("İzin talebi onaylanıyor...");
    try {
      setProcessing(selectedLeave.id);
      await updateAnnualLeaveStatus(selectedLeave.id, LeaveStatus.APPROVED);
      toast.success("İzin talebi başarıyla onaylandı", { id: toastId });
      onUpdate();
    } catch (error) {
      console.error("İzin onaylama hatası:", error);
      const message = error instanceof Error ? error.message : "İzin talebi onaylanırken bir hata oluştu";
      toast.error(message, { id: toastId });
    } finally {
      setApproveDialogOpen(false);
      setProcessing(null);
    }
  };

  // İzni reddet
  const handleReject = async () => {
    if (!selectedLeave) return;
    const toastId = toast.loading("İzin talebi reddediliyor...");
    try {
      setProcessing(selectedLeave.id);
      await updateAnnualLeaveStatus(selectedLeave.id, LeaveStatus.REJECTED);
      toast.success("İzin talebi reddedildi", { id: toastId });
      onUpdate();
    } catch (error) {
      console.error("İzin reddetme hatası:", error);
      toast.error("İzin talebi reddedilirken bir hata oluştu");
    } finally {
      setRejectDialogOpen(false);
      setProcessing(null);
    }
  };

  // İzni sil
  const handleDelete = async () => {
    if (!selectedLeave) return;
    
    try {
      setProcessing(selectedLeave.id);
      await deleteAnnualLeave(selectedLeave.id);
      toast.success("İzin talebi başarıyla silindi");
      onDelete(selectedLeave.id);
    } catch (error) {
      console.error("İzin silme hatası:", error);
      toast.error("İzin talebi silinirken bir hata oluştu");
    } finally {
      setDeleteDialogOpen(false);
      setProcessing(null);
    }
  };

  // Tarih formatını değiştir
  const formatDate = (dateString: string | Date): string => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
  };

  if (pendingLeaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-1">Bekleyen İzin Talebi Yok</h3>
        <p className="text-muted-foreground mb-4">
          Şu anda bekleyen izin talebi bulunmamaktadır.
        </p>
        <Button
          asChild
          variant="outline"
        >
          <Link href="/annual-leave?create=true">
            Yeni İzin Talebi Oluştur
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {pendingLeaves.map((leave) => (
          <Card key={leave.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
            <CardContent className="p-0">
              <div className="p-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-base cursor-pointer hover:text-blue-500" onClick={() => showEmployeeDetails(leave)}>
                      {leave.user?.name} {leave.user?.surname}
                    </h4>
                    <p className="text-sm text-muted-foreground">ID: {leave.userId}</p>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className="mb-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  >
                    Beklemede
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Başlangıç</span>
                    <span className="font-medium">{formatDate(leave.startDate)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Bitiş</span>
                    <span className="font-medium">{formatDate(leave.endDate)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted-foreground">Süre</span>
                    <span className="font-medium">{ 
                      differenceInBusinessDays(
                        new Date(leave.endDate),
                        new Date(leave.startDate)
                      ) + 1} gün</span>
                  </div>
                </div>
                
                {leave.notes && (
                  <div className="mt-3 p-2 bg-muted rounded-md text-xs">
                    <span className="block text-muted-foreground mb-1">Not:</span>
                    <p className="line-clamp-2">{leave.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-between mt-4 pt-3 border-t">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => showLeaveDetails(leave)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(leave)}
                      disabled={!!processing}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setApproveDialogOpen(true);
                      }}
                      disabled={!!processing}
                    >
                      {processing === leave.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setRejectDialogOpen(true);
                      }}
                      disabled={!!processing}
                    >
                      {processing === leave.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileX className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          disabled={!!processing}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLeave(leave);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* İzin Detay Dialog */}
      {selectedLeave && (
        <LeaveDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          leave={selectedLeave}
        />
      )}

      {/* İzin Düzenleme Dialog */}
      {selectedLeave && (
        <EditLeaveDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onEdited={() => {
            setEditDialogOpen(false);
            onUpdate();
          }}
          leave={selectedLeave}
        />
      )}

      {/* Silme Onay Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İzin Talebini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu izin talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processing}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!processing}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>Sil</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onaylama Onay Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İzin Talebini Onayla</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLeave?.user?.name} {selectedLeave?.user?.surname} adlı personelin{" "}
              {selectedLeave && formatDate(selectedLeave.startDate)} - {selectedLeave && formatDate(selectedLeave.endDate)}{" "}
              tarihleri arasındaki izin talebini onaylamak istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processing}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={!!processing}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 dark:text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Onaylanıyor...
                </>
              ) : (
                <>Onayla</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reddetme Onay Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İzin Talebini Reddet</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLeave?.user?.name} {selectedLeave?.user?.surname} adlı personelin{" "}
              {selectedLeave && formatDate(selectedLeave.startDate)} - {selectedLeave && formatDate(selectedLeave.endDate)}{" "}
              tarihleri arasındaki izin talebini reddetmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processing}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!!processing}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reddediliyor...
                </>
              ) : (
                <>Reddet</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 