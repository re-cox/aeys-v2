"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AnnualLeave, LeaveStatus } from "@/types/annualLeave";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CalendarCheck,
  Calendar,
  CalendarX,
  Check,
  X,
  User,
  Building,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LeaveDetailDialogProps {
  open: boolean;
  onClose: () => void;
  leave: AnnualLeave;
}

export function LeaveDetailDialog({
  open,
  onClose,
  leave,
}: LeaveDetailDialogProps) {
  // Tarih formatını değiştir
  const formatDate = (dateString: string | Date): string => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: tr });
  };

  // İzin durumuna göre badge stilini belirle
  const getStatusBadge = () => {
    switch (leave.status) {
      case LeaveStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Beklemede
          </Badge>
        );
      case LeaveStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <Check className="h-3 w-3 mr-1" />
            Onaylandı
          </Badge>
        );
      case LeaveStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <X className="h-3 w-3 mr-1" />
            Reddedildi
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>İzin Detayları</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            İzin talebinin tüm detayları
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personel Bilgileri */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              Personel Bilgileri
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">İsim:</span>
                <p className="font-medium">{leave.employee?.name} {leave.employee?.surname}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Departman:</span>
                <p className="font-medium flex items-center">
                  <Building className="h-3 w-3 mr-1 text-gray-400" />
                  {leave.employee?.department?.name || "Belirtilmemiş"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* İzin Tarihleri */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              İzin Tarihleri
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Başlangıç:</span>
                <p className="font-medium">{formatDate(leave.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bitiş:</span>
                <p className="font-medium">{formatDate(leave.endDate)}</p>
              </div>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <span className="text-muted-foreground text-xs">Toplam İzin Süresi:</span>
              <p className="font-medium text-sm">{leave.totalDays || "-"} gün</p>
            </div>
          </div>

          <Separator />

          {/* İzin Durumu ve Tarihler */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              İzin Durumu
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Talep Tarihi:</span>
                <p className="font-medium">
                  {leave.requestedAt ? formatDate(leave.requestedAt) : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Onay/Red Tarihi:</span>
                <p className="font-medium">
                  {leave.approvedAt ? formatDate(leave.approvedAt) : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {leave.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Notlar
                </h4>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {leave.notes}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 