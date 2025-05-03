"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, XCircle, Clock, PlusCircle, Search, Loader2, Star, ChevronRight, SearchIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Bildirim adımları
export enum BedasNotificationType {
  PROJE = "PROJE",
  BAGLANTI_GORUSU = "BAGLANTI_GORUSU",
  DAGITIM_BAGLANTI_ANLASMASI = "DAGITIM_BAGLANTI_ANLASMASI",
  TESISIN_TAMAMLANMASI = "TESISIN_TAMAMLANMASI",
  FEN_MUAYENE = "FEN_MUAYENE"
}

// Adım isimleri
export const STEP_NAMES: Record<BedasNotificationType, string> = {
  [BedasNotificationType.PROJE]: "Proje",
  [BedasNotificationType.BAGLANTI_GORUSU]: "Bağlantı Görüşü",
  [BedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI]: "Dağıtım Bağlantı Anlaşması",
  [BedasNotificationType.TESISIN_TAMAMLANMASI]: "Tesisin Tamamlanması",
  [BedasNotificationType.FEN_MUAYENE]: "Fen Muayene"
};

// STEP_ORDER sabitini ekleyelim
export const STEP_ORDER = [
  "PROJE",
  "BAGLANTI_GORUSU",
  "DAGITIM_BAGLANTI_ANLASMASI",
  "TESISIN_TAMAMLANMASI",
  "FEN_MUAYENE"
];

// Adım durumu için renk sınıfları
function getStepStatusClasses(status: string, isActive: boolean = false): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-300";
    case "PENDING":
    default:
      return isActive 
        ? "bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400"
        : "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function BedasNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Silme işlemi için state'ler
  const [notificationToDelete, setNotificationToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bildirimleri yükleme
  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("[BEDAS Frontend] Bildirimler yükleniyor...");
        const response = await fetch("/api/edas/bedas/notifications");
        
        if (!response.ok) {
          console.error(`[BEDAS Frontend] API hatası: ${response.status} ${response.statusText}`);
          const errorData = await response.json().catch(() => ({}));
          console.error("[BEDAS Frontend] API hata detayları:", errorData);
          
          // Detaylı hata mesajını göster
          throw new Error(
            errorData.message || 
            errorData.error || 
            `API yanıt hatası: ${response.status} ${response.statusText}`
          );
        }
        
        const data = await response.json();
        console.log("[BEDAS Frontend] API cevabı:", data);
        
        if (data.success) {
          setNotifications(data.data);
          console.log(`[BEDAS Frontend] ${data.data.length} bildirim yüklendi.`);
        } else {
          throw new Error(data.message || data.error || "Bildirimler getirilirken bir hata oluştu.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
        console.error("[BEDAS Frontend] Bildirimler getirilirken hata:", err);
        console.error("[BEDAS Frontend] Hata detayı:", errorMessage);
        
        setError(`Bildirimler yüklenirken bir hata oluştu: ${errorMessage}`);
        toast.error(`Bildirimler yüklenirken bir hata oluştu: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchNotifications();
  }, []);
  
  // Arama filtreleme
  const filteredNotifications = searchQuery 
    ? notifications.filter(notification => 
        notification.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notifications;
  
  // Yeni bildirim oluşturma sayfasına yönlendirme
  const handleCreateNotification = () => {
    router.push("/edas/bedas/yeni-bildirim");
  };
  
  // Silme işlemini gerçekleştirme
  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    setIsDeleting(true);
    const notificationId = notificationToDelete.id; // ID'yi sakla, state temizlenebilir
    const notificationRefNo = notificationToDelete.refNo; // refNo'yu sakla

    try {
      console.log(`[BEDAS Frontend] ${notificationId} ID'li bildirim silme isteği gönderiliyor...`);
      
      const response = await fetch(`/api/edas/bedas/notifications/${notificationId}`, {
        method: "DELETE",
        // DELETE için Content-Type göndermeye gerek yok
      });
      
      console.log(`[BEDAS Frontend] API yanıtı alındı: ${response.status} ${response.statusText}`);
      
      if (response.ok) { // Başarılı durum kodları (200-299)
        console.log(`[BEDAS Frontend] Bildirim (${notificationRefNo}) başarıyla silindi (Durum: ${response.status}).`);
        // UI Güncellemesi
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setNotificationToDelete(null); // Dialog'u kapatmak için state'i temizle
        toast.success(`Bildirim (${notificationRefNo}) başarıyla silindi.`);
        // 204 dışındaki başarılı durumlar için (eğer API bir body dönerse) JSON parse etmeye gerek yok,
        // çünkü sadece silme işleminin başarısını teyit etmek istiyoruz.
        
      } else { // Hatalı durum kodları (4xx, 5xx)
        console.error(`[BEDAS Frontend] API Hata Durumu: ${response.status}`);
        let errorMessage = `Bildirim silinirken bir sunucu hatası oluştu (${response.status})`;
        try {
          // Hata mesajını JSON olarak almaya çalışalım
          const errorResult = await response.json();
          console.log(`[BEDAS Frontend] API Hata İçeriği:`, errorResult);
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (jsonError) {
          // JSON değilse text olarak alalım
          try {
             const errorText = await response.text();
             if (errorText) errorMessage = errorText;
             console.log(`[BEDAS Frontend] API Hata Metni:`, errorText);
          } catch (textError) {
              console.error("[BEDAS Frontend] Hata metni okunurken hata:", textError);
          }
        }
        // Hata oluştuğu için throw et, catch bloğu yakalasın
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Bildirim silinirken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
      toast.error(`Bildirim silinirken bir hata oluştu: ${errorMessage}`);
      // Hata durumunda dialog açık kalabilir veya kapatılabilir, şimdilik kapatıyoruz.
      setNotificationToDelete(null); 
    } finally {
      setIsDeleting(false);
      // State'in tekrar temizlendiğinden emin ol (race condition önlemi)
      // if (!isDeleting) { // Bu kontrol finally içinde güvenilir olmayabilir
      //    setNotificationToDelete(null);
      // }
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Üst Bar: Arama ve Yeni Bildirim Butonu */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px] flex-1 max-w-xl">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Bildirim Numarası, Proje Adı, Müşteri Adı..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Sorgula</Button>
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Filtrele</Button>
          <Button variant="outline" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500">Filtreleri Kaldır</Button>
          <Button onClick={handleCreateNotification}>Yeni Bildirim</Button>
        </div>
      </div>
      
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
                
                <div className="flex flex-wrap gap-x-6 items-center">
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
                  {/* Silme Butonu ve Dialog'u (MAP İÇİNDE) */} 
                  <AlertDialog onOpenChange={(open) => !open && setNotificationToDelete(null)}> 
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setNotificationToDelete(notification)} // Sadece state'i set et
                        className="text-red-300 hover:text-red-100 hover:bg-red-900/20 px-2 py-1 h-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    {/* Dialog içeriği sadece ilgili bildirim seçiliyse render edilebilir (opsiyonel optimizasyon) */} 
                    {/* Veya her zaman render edilir, içerik state'e göre dolar */} 
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bildirimi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlemi geri alamazsınız. "{notification?.refNo}" referans numaralı bildirimi ve ilişkili tüm verilerini (adımlar, belgeler) kalıcı olarak silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNotificationToDelete(null)} disabled={isDeleting}>
                          İptal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteNotification} 
                          disabled={isDeleting || !notificationToDelete || notificationToDelete.id !== notification.id} // Doğru bildirim için kontrol
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {/* Spinner'ı sadece işlem yapılan dialog için göster */}
                          {isDeleting && notificationToDelete?.id === notification.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isDeleting && notificationToDelete?.id === notification.id ? "Siliniyor..." : "Sil"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {/* Kart İçeriği */}
              <div className="p-4">
                {/* Adım Göstergeleri */}
                <div className="flex flex-wrap justify-between gap-2 mb-4">
                  {STEP_ORDER.map((stepType, index) => {
                    const stepData = notification.steps?.find((s: any) => s.stepType === stepType);
                    const status = stepData?.status || (index < currentStepIndex ? "APPROVED" : index === currentStepIndex ? "PENDING" : "PENDING");
                    const isActive = index === currentStepIndex;
                    const stepClasses = getStepStatusClasses(status, isActive); 
                    
                    // Her adım için referans numarası oluştur (örnek olarak)
                    // Gerçek uygulamada bu veriler API'den gelmeli
                    const stepRefNo = stepData?.refNo || 
                      `${notification.refNo}-${stepType.substring(0, 3)}`;
                    
                    return (
                      <div 
                        key={stepType} 
                        className={cn(
                          "flex-1 min-w-[100px] text-center px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                          stepClasses
                        )}
                      >
                        <div className="mb-1">{STEP_NAMES[stepType as BedasNotificationType]}</div>
                        <div className="text-[10px] opacity-80">No: {stepRefNo}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Bildirim Numaraları Tablosu (KALDIRILDI) */}
                {/* 
                <div className="mt-6 mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <h4 className="text-sm font-medium text-slate-800 mb-2">Adım Bildirim Numaraları</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STEP_ORDER.map((stepType) => {
                      const stepData = notification.steps?.find((s: any) => s.stepType === stepType);
                      // Gerçek uygulamada bu veriler API'den gelmeli
                      const stepRefNo = stepData?.refNo || 
                        `${notification.refNo}-${stepType.substring(0, 3)}`;
                      
                      return (
                        <div key={stepType} className="flex items-center text-xs">
                          <span className="text-slate-500 mr-2">{STEP_NAMES[stepType as BedasNotificationType]}:</span>
                          <span className="font-medium">{stepRefNo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                */}
                
                {/* Mevcut Aşama ve Detay Linki */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Bağlantı Başvurusu Aşaması: 
                    <span className="font-semibold ml-1">
                      {(() => {
                        const approvedSteps = notification.steps?.filter((s: any) => s.status === "APPROVED") || [];
                        if (approvedSteps.length === 0) {
                          return STEP_NAMES[notification.currentStep as BedasNotificationType];
                        }
                        const approvedStepIndices = approvedSteps.map((step: any) => STEP_ORDER.indexOf(step.stepType)).filter((index: number) => index !== -1);
                        const lastApprovedIndex = Math.max(...approvedStepIndices);
                        const nextStepIndex = lastApprovedIndex + 1;
                        if (nextStepIndex < STEP_ORDER.length) {
                          return STEP_NAMES[STEP_ORDER[nextStepIndex] as BedasNotificationType];
                        } else {
                          return STEP_NAMES[notification.currentStep as BedasNotificationType];
                        }
                      })()}
                    </span>
                  </p>
                  <Button
                    variant="link"
                    className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                    onClick={() => router.push(`/edas/bedas/bildirim/${notification.id}`)}
                  >
                    Detayları Gör
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 