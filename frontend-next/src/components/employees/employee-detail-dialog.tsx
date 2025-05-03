"use client";

import { Employee } from "@/types/employee";
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
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  BadgeCheck,
  Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface EmployeeDetailDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}

export function EmployeeDetailDialog({
  open,
  onClose,
  employee,
}: EmployeeDetailDialogProps) {
  // Tarih formatını değiştir
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return "-";
    return format(new Date(dateString), "d MMMM yyyy", { locale: tr });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Personel Bilgileri</DialogTitle>
          <DialogDescription>
            {employee.name} {employee.surname} personeline ait detaylı bilgiler
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Temel Bilgiler */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              Temel Bilgiler
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">İsim:</span>
                <p className="font-medium">{employee.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Soyisim:</span>
                <p className="font-medium">{employee.surname}</p>
              </div>
              <div>
                <span className="text-muted-foreground">E-posta:</span>
                <p className="font-medium flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                  {employee.email || "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefon:</span>
                <p className="font-medium flex items-center">
                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                  {employee.phone || "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Departman ve Pozisyon */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-400" />
              Departman ve Pozisyon
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Departman:</span>
                <p className="font-medium">{employee.department?.name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pozisyon:</span>
                <p className="font-medium">{employee.position || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">İşe Başlama:</span>
                <p className="font-medium">{formatDate(employee.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Çalışma Durumu:</span>
                <p className="font-medium flex items-center">
                  <BadgeCheck className="h-3 w-3 mr-1 text-green-500" />
                  {employee.isActive ? "Aktif" : "Pasif"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Kişisel Bilgiler */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
              Kişisel Bilgiler
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">T.C. Kimlik No:</span>
                <p className="font-medium">{employee.identityNumber || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Doğum Tarihi:</span>
                <p className="font-medium">{formatDate(employee.birthDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Adres:</span>
                <p className="font-medium flex items-start">
                  <MapPin className="h-3 w-3 mr-1 mt-1 text-gray-400" />
                  <span className="flex-1">{employee.address || "-"}</span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Çalışma Saatleri:</span>
                <p className="font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  {employee.workingHours || "09:00 - 18:00"}
                </p>
              </div>
            </div>
          </div>

          {/* Not bölümü */}
          {employee.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notlar</h4>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {employee.notes}
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