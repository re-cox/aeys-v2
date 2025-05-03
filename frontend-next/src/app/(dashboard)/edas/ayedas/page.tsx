"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, InfoIcon, SearchIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn/ui'dan gelen yardımcı fonksiyon

// --- Tipler ve Sabitler ---

// Bildirim adımlarının sırası (fotoğraftaki sekmeler)
export const STEP_ORDER = [
  "IC_TESISAT_PROJESI",
  "BAGLANTI_GORUSU",
  "BAGLANTI_HATTI_TESISI",
  "BAGLANTI_BEDELI", 
  "DAGITIM_BAGLANTI_ANLASMASI",
  "SAYAC_MONTAJ_BEDELI",
  "GECICI_KABUL",
  "TESISAT_MUAYENE",
  "TESISAT"
];

// Adım isimleri
export const STEP_NAMES: Record<string, string> = {
  "IC_TESISAT_PROJESI": "İç Tesisat Projesi",
  "BAGLANTI_GORUSU": "Bağlantı Görüşü",
  "BAGLANTI_HATTI_TESISI": "Bağlantı Hattı Tesisi (EDAS)",
  "BAGLANTI_BEDELI": "Bağlantı Bedeli",
  "DAGITIM_BAGLANTI_ANLASMASI": "Dağıtım Bağlantı Anlaşması",
  "SAYAC_MONTAJ_BEDELI": "Sayaç Montaj Bedeli",
  "GECICI_KABUL": "Geçici Kabul",
  "TESISAT_MUAYENE": "Tesisat Muayene",
  "TESISAT": "Tesisat"
};

// Başvuru tipleri
const APPLICATION_TYPES = [
  { value: "NIHAI_BAGLANTI", label: "Nihai Bağlantı" },
  { value: "SANTIYE", label: "Şantiye" }
];

// Tip tanımlamaları
type NotificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface NotificationStep {
  id: string;
  stepType: string;
  status: NotificationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
}

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  documentType: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface Notification {
  id: string;
  refNo: string;
  projectName?: string;
  applicationType: string;
  customerName: string;
  city?: string;
  district?: string;
  parcelBlock?: string;
  parcelNo?: string;
  company: string;
  currentStep: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  steps: NotificationStep[];
}

interface NewNotificationData {
  refNo: string;
  projectName: string;
  applicationType: string;
  customerName: string;
  city: string;
  district: string;
  parcelBlock: string;
  parcelNo: string;
}

// Durum renklerini belirleme helper fonksiyonu
function getStepStatusClasses(status: NotificationStatus, isActive: boolean): string {
  if (status === "APPROVED") {
    return "bg-green-100 text-green-800 border border-green-200";
  } else if (status === "REJECTED") {
    return "bg-red-100 text-red-800 border border-red-200";
  } else if (isActive) {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  } else {
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

// Ana bileşen
export default function AyedasPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Silme işlemi için state'ler
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  
  // Yeni bildirim için dialog state'i ve form değerleri
  const [newNotificationData, setNewNotificationData] = useState<NewNotificationData>({
    refNo: "", projectName: "", applicationType: APPLICATION_TYPES[0].value,
    customerName: "", city: "", district: "", parcelBlock: "", parcelNo: ""
  });
  
  // Bildirimleri API'den çekme
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Bildirimleri API'den çekme fonksiyonu
  async function fetchNotifications() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/edas/ayedas/notifications");
      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.data);
      } else {
        throw new Error(result.message || "Bildirimler yüklenemedi.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bildirimler yüklenirken bilinmeyen bir hata oluştu.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Arama fonksiyonu
  const filteredNotifications = notifications.filter((notification) => {
    const searchTermLower = searchQuery.toLowerCase();
    return (
      notification.refNo.toLowerCase().includes(searchTermLower) ||
      notification.customerName.toLowerCase().includes(searchTermLower) ||
      notification.projectName?.toLowerCase().includes(searchTermLower) ||
      (notification.city && notification.district &&
        `${notification.city}/${notification.district}`.toLowerCase().includes(searchTermLower))
    );
  });
  
  // Form değişiklik handler'ı
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewNotificationData(prev => ({ ...prev, [name]: value }));
  };
  
  // Yeni bildirim oluşturma fonksiyonu
  async function handleCreateNotification() {
    try {
      const payload = { 
        ...newNotificationData,
        company: "AYEDAŞ",
        status: "PENDING" 
      };
      
      const response = await fetch("/api/edas/ayedas/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();

      if (result.success) {
        setNotifications(prev => [result.data, ...prev]);
        toast.success("Yeni bildirim başarıyla oluşturuldu!");
        setNewNotificationData({
          refNo: "", projectName: "", applicationType: APPLICATION_TYPES[0].value,
          customerName: "", city: "", district: "", parcelBlock: "", parcelNo: ""
        });
      } else {
        throw new Error(result.message || "Bildirim oluşturulamadı.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Bildirim oluşturulurken bir hata oluştu.";
      toast.error(errorMessage);
    }
  }
  
  // Bildirim silme işlemi
  async function handleDeleteNotification() {
    if (!notificationToDelete) return;

    const notificationId = notificationToDelete.id;
    const originalNotifications = [...notifications]; 
    
    setIsDeleteDialogOpen(false);
    setNotificationToDelete(null); 
    
    // Önce UI'dan kaldır (optimistik UI)
    setNotifications(prev => prev.filter(n => n.id !== notificationId)); 
    toast.info(`Bildirim (${notificationToDelete.refNo}) siliniyor...`);

    try {
      const response = await fetch(`/api/edas/ayedas/notifications/${notificationId}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || "Bildirim başarıyla silindi!");
      } else {
        // Hata durumunda eski listeyi geri yükle
        setNotifications(originalNotifications);
        toast.error(result.message || "Bildirim silinirken bir hata oluştu.");
      }
    } catch (err: unknown) {
      // Hata durumunda eski listeyi geri yükle
      setNotifications(originalNotifications);
      const errorMessage = err instanceof Error ? err.message : "Bildirim silinirken bir sunucu hatası oluştu.";
      toast.error(errorMessage);
    }
  }
  
  // Silme dialog'unu açan fonksiyon
  function openDeleteDialog(notification: Notification) {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  }
  
  // Select değişikliğini handle etme
  const handleSelectChange = (value: string) => {
    setNewNotificationData(prev => ({ ...prev, applicationType: value }));
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Üst Bar: Arama ve Yeni Bildirim Butonu */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px] flex-1 max-w-xl">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Bildirim Numarası, Proje Adı, İl, İlçe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Sorgula</Button>
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Filtrele</Button>
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Filtreleri Kaldır</Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>Yeni Bildirim</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Yeni AYEDAŞ Bildirimi Oluştur</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="refNo">Bildirim Numarası *</Label>
                    <Input id="refNo" name="refNo" value={newNotificationData.refNo} onChange={handleFormChange} required />
                  </div>
                  <div>
                    <Label htmlFor="projectName">Başvuru Proje Adı</Label>
                    <Input id="projectName" name="projectName" value={newNotificationData.projectName} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="applicationType">Başvuru Tipi *</Label>
                    <Select name="applicationType" value={newNotificationData.applicationType} onValueChange={handleSelectChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customerName">Müşteri Adı Soyadı/Unvanı *</Label>
                    <Input id="customerName" name="customerName" value={newNotificationData.customerName} onChange={handleFormChange} required />
                  </div>
                  <div>
                    <Label htmlFor="city">İl</Label>
                    <Input id="city" name="city" value={newNotificationData.city} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe</Label>
                    <Input id="district" name="district" value={newNotificationData.district} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="parcelBlock">Ada</Label>
                    <Input id="parcelBlock" name="parcelBlock" value={newNotificationData.parcelBlock} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="parcelNo">Parsel</Label>
                    <Input id="parcelNo" name="parcelNo" value={newNotificationData.parcelNo} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
                <Button 
                  type="button" 
                  onClick={handleCreateNotification} 
                  disabled={!newNotificationData.refNo || !newNotificationData.customerName || !newNotificationData.applicationType}
                >
                  Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bildirim Listeleme Bölümü */}
      <div className="space-y-6">
        {isLoading && <div className="text-center py-10">Yükleniyor...</div>}
        {error && <div className="text-center py-10 text-red-600">Hata: {error}</div>}
        {!isLoading && !error && filteredNotifications.length === 0 && (
          <div className="text-center py-10 text-gray-500">Bildirim bulunamadı.</div>
        )}
        
        {!isLoading && !error && filteredNotifications.map((notification) => {
          // Aktif adımın indeksini bul
          const currentStepIndex = STEP_ORDER.indexOf(notification.currentStep);
          
          return (
            <div key={notification.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
              {/* Kart Başlığı */}
              <div className="bg-slate-800 text-white p-3 px-4 flex flex-wrap justify-between items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-x-4 shrink-0">
                  <button className="text-amber-400 hover:text-amber-200">
                    <Star className="h-5 w-5" />
                  </button>
                  <div>
                    <span className="text-slate-400">Bildirim Numarası: </span>
                    <span className="font-semibold">{notification.refNo}</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <span className="text-slate-400">Başvuru Tipi: </span>
                    <span>{notification.applicationType === "NIHAI_BAGLANTI" ? "Nihai Bağlantı" : "Şantiye"}</span>
                  </div>
                  
                  {notification.city && notification.district && (
                    <div>
                      <span className="text-slate-400">İl/İlçe: </span>
                      <span>{notification.city}/{notification.district}</span>
                    </div>
                  )}
                  
                  {notification.parcelBlock && notification.parcelNo && (
                    <div>
                      <span className="text-slate-400">Ada/Parsel: </span>
                      <span>{notification.parcelBlock}/{notification.parcelNo}</span>
                    </div>
                  )}
                </div>
                
                <div className="shrink-0">
                  <button 
                    onClick={() => openDeleteDialog(notification)}
                    className="text-red-300 hover:text-red-100 px-2 py-1 rounded transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>
              
              {/* Kart İçeriği: Adımlar ve Detay Linki */}
              <div className="p-4">
                {/* Adım Göstergeleri */}
                <div className="flex flex-wrap justify-between gap-2 mb-4">
                  {STEP_ORDER.map((stepType, index) => {
                    const stepData = notification.steps?.find(s => s.stepType === stepType);
                    const status = stepData?.status || (index < currentStepIndex ? "APPROVED" : index === currentStepIndex ? "PENDING" : "PENDING");
                    const isActive = index === currentStepIndex;
                    const stepClasses = getStepStatusClasses(status, isActive); 
                    
                    return (
                      <div 
                        key={stepType} 
                        className={cn(
                          "flex-1 min-w-[100px] text-center px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                          stepClasses
                        )}
                      >
                        {STEP_NAMES[stepType]}
                      </div>
                    );
                  })}
                </div>
                
                {/* Mevcut Aşama ve Detay Linki */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Bağlantı Başvurusu Aşaması: 
                    <span className="font-semibold ml-1">
                      {(() => {
                        const approvedSteps = notification.steps?.filter(s => s.status === "APPROVED") || [];
                        if (approvedSteps.length === 0) {
                          return STEP_NAMES[notification.currentStep];
                        }
                        const approvedStepIndices = approvedSteps.map(step => STEP_ORDER.indexOf(step.stepType)).filter(index => index !== -1);
                        const lastApprovedIndex = Math.max(...approvedStepIndices);
                        const nextStepIndex = lastApprovedIndex + 1;
                        if (nextStepIndex < STEP_ORDER.length) {
                          return STEP_NAMES[STEP_ORDER[nextStepIndex]];
                        } else {
                          return STEP_NAMES[notification.currentStep];
                        }
                      })()}
                    </span>
                  </p>
                  <Link href={`/edas/ayedas/bildirim/${notification.id}`}>
                    <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto">
                      Detayları Gör
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Silme Onay Dialog'u */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu bildirimi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {notificationToDelete && (
                <>
                  <p>Bildirim Numarası: <strong>{notificationToDelete.refNo}</strong></p>
                  <p>Müşteri Adı: <strong>{notificationToDelete.customerName}</strong></p>
                </>
              )}
              <p className="mt-2 text-red-500">Bu işlem geri alınamaz ve tüm adımlar ve belgeler silinecektir.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteNotification}>
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 