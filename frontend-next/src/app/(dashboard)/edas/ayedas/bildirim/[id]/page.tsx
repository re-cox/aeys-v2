"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FileIcon, UploadIcon, XIcon, CheckIcon, AlertTriangleIcon, ArrowLeftIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// AyedasNotificationType enum
export enum AyedasNotificationType {
  IC_TESISAT_PROJESI = "IC_TESISAT_PROJESI",
  BAGLANTI_GORUSU = "BAGLANTI_GORUSU",
  BAGLANTI_HATTI_TESISI = "BAGLANTI_HATTI_TESISI",
  BAGLANTI_BEDELI = "BAGLANTI_BEDELI",
  DAGITIM_BAGLANTI_ANLASMASI = "DAGITIM_BAGLANTI_ANLASMASI",
  SAYAC_MONTAJ_BEDELI = "SAYAC_MONTAJ_BEDELI",
  GECICI_KABUL = "GECICI_KABUL",
  TESISAT_MUAYENE = "TESISAT_MUAYENE",
  TESISAT = "TESISAT"
}

// Adım sırası
export const STEP_ORDER = [
  AyedasNotificationType.IC_TESISAT_PROJESI,
  AyedasNotificationType.BAGLANTI_GORUSU,
  AyedasNotificationType.BAGLANTI_HATTI_TESISI,
  AyedasNotificationType.BAGLANTI_BEDELI,
  AyedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI,
  AyedasNotificationType.SAYAC_MONTAJ_BEDELI,
  AyedasNotificationType.GECICI_KABUL,
  AyedasNotificationType.TESISAT_MUAYENE,
  AyedasNotificationType.TESISAT
];

// Adım isimleri
export const STEP_NAMES: Record<AyedasNotificationType, string> = {
  [AyedasNotificationType.IC_TESISAT_PROJESI]: "İç Tesisat Projesi",
  [AyedasNotificationType.BAGLANTI_GORUSU]: "Bağlantı Görüşü",
  [AyedasNotificationType.BAGLANTI_HATTI_TESISI]: "Bağlantı Hattı Tesisi",
  [AyedasNotificationType.BAGLANTI_BEDELI]: "Bağlantı Bedeli",
  [AyedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI]: "Dağıtım Bağlantı Anlaşması",
  [AyedasNotificationType.SAYAC_MONTAJ_BEDELI]: "Sayaç Montaj Bedeli",
  [AyedasNotificationType.GECICI_KABUL]: "Geçici Kabul",
  [AyedasNotificationType.TESISAT_MUAYENE]: "Tesisat Muayene",
  [AyedasNotificationType.TESISAT]: "Tesisat"
};

// Adımlar için gerekli belgeler
export const REQUIRED_DOCUMENTS: Record<AyedasNotificationType, string[]> = {
  [AyedasNotificationType.IC_TESISAT_PROJESI]: ["Projeci ile Mal Sahibi Arasındaki Sözleşme", "Elektrik İç Tesisat Projesi", "Diğer"],
  [AyedasNotificationType.BAGLANTI_GORUSU]: ["Enerji Müsaadesi Başvuru Dilekçesi", "Yapı Ruhsatı veya Yerine Geçen Belge", "Diğer"],
  [AyedasNotificationType.BAGLANTI_HATTI_TESISI]: ["Bağlantı Hattı Tesisi Projesi", "Diğer"],
  [AyedasNotificationType.BAGLANTI_BEDELI]: ["Bağlantı bedeli ödeme dekontu", "Diğer"],
  [AyedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI]: ["Diğer"],
  [AyedasNotificationType.SAYAC_MONTAJ_BEDELI]: ["Diğer"],
  [AyedasNotificationType.GECICI_KABUL]: ["Akım Trafoları Test Raporları", "Yapı Kullanma İzin Belgesi veya Yerine Geçen Belge", "Elektrik İç Tesisleri Muayene Uygunluk Belgesi", "Topraklama Raporu", "Yapı Ruhsatı", "Diğer"],
  [AyedasNotificationType.TESISAT_MUAYENE]: ["Akım Trafoları Test Raporları", "Yapı Kullanma İzin Belgesi veya Yerine Geçen Belge", "Elektrik İç Tesisleri Muayene Uygunluk Belgesi", "Topraklama Raporu", "Yapı Ruhsatı", "Diğer"],
  [AyedasNotificationType.TESISAT]: ["Akım Trafoları Test Raporları", "Yapı Kullanma İzin Belgesi veya Yerine Geçen Belge", "Elektrik İç Tesisleri Muayene Uygunluk Belgesi", "Topraklama Raporu", "Yapı Ruhsatı", "Diğer"]
};

// Durum isimleri
const STATUS_TEXTS: Record<string, string> = {
  "PENDING": "Beklemede",
  "APPROVED": "Onaylandı",
  "REJECTED": "Reddedildi"
};

// Durum için renk sınıfları
function getStatusClasses(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "PENDING":
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
}

// Durum göstergesi komponenti
function StatusBadge({ status }: { status: string }): JSX.Element {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusClasses(status))}>
      {status === "APPROVED" && <CheckIcon className="w-3 h-3 mr-1" />}
      {status === "REJECTED" && <XIcon className="w-3 h-3 mr-1" />}
      {status === "PENDING" && <AlertTriangleIcon className="w-3 h-3 mr-1" />}
      {STATUS_TEXTS[status]}
    </span>
  );
}

const API_BASE_URL = "http://localhost:5001/api"; // Sabit API URL

// Ana bileşen
export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  const [activeTab, setActiveTab] = useState<AyedasNotificationType>(AyedasNotificationType.IC_TESISAT_PROJESI);
  const [notification, setNotification] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Belge yükleme için state'ler
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [uploadingStatus, setUploadingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  // Adım durum değiştirme için state'ler
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [statusNotes, setStatusNotes] = useState("");
  
  // Aktif adıma ait veriyi al (memoized olabilir)
  const currentStepData = React.useMemo(() => {
      if (!steps || steps.length === 0) return null;
      return steps.find(step => step.stepType === activeTab) || null;
  }, [steps, activeTab]);

  // Adımın geçici olup olmadığını kontrol et
  const isCurrentStepTemporary = React.useMemo(() => {
      return !!currentStepData?.id?.startsWith('temp-');
  }, [currentStepData]);
  
  // Fetch bildirim fonksiyonunu tanımla
  const fetchNotification = async () => {
    setIsLoading(true);
    setError(null);
    console.log(`[Fetch] Fetching notification for ID: ${notificationId}`);
    
    try {
      // Backend endpoint'ine tam URL ile istek at
      const response = await fetch(`${API_BASE_URL}/edas/ayedas/notifications/${notificationId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log("[Fetch] Notification data received:", result.data);
        setNotification(result.data);
        
        // Adımları kontrol et ve oluştur
        const existingSteps = result.data.steps || [];
        const allSteps = [...existingSteps];
        const fetchedStepTypes = new Set(existingSteps.map((s: any) => s.stepType));
        
        // Mevcut adımları kontrol et ve eksik olanları ekle
        STEP_ORDER.forEach((stepType) => {
          if (!fetchedStepTypes.has(stepType)) {
             console.log(`[Fetch] Adding temporary step for: ${stepType}`);
            allSteps.push({
              id: `temp-${stepType}`,
              stepType,
              status: "PENDING",
              notificationId,
              documents: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
        
        // Adımları sırala
        const sortedSteps = allSteps.sort((a, b) => {
          const aIndex = STEP_ORDER.indexOf(a.stepType as AyedasNotificationType);
          const bIndex = STEP_ORDER.indexOf(b.stepType as AyedasNotificationType);
          return aIndex - bIndex;
        });
        
        console.log("[Fetch] Final steps state:", sortedSteps);
        setSteps(sortedSteps);
        
        // Aktif sekmeyi mevcut adıma ayarla
        if (result.data.currentStep && STEP_ORDER.includes(result.data.currentStep)) {
           console.log(`[Fetch] Setting active tab to: ${result.data.currentStep}`);
          setActiveTab(result.data.currentStep as AyedasNotificationType);
        } else {
           console.log(`[Fetch] Setting active tab to default: ${STEP_ORDER[0]}`);
            setActiveTab(STEP_ORDER[0]); // Varsayılan sekmeyi ayarla
        }
      } else {
        throw new Error(result.message || "Bildirim getirilirken bir hata oluştu.");
      }
    } catch (err: any) {
      console.error("[Fetch] Error fetching notification details:", err);
      setError("Bildirim detayları yüklenirken bir hata oluştu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Bildirimi getir
  useEffect(() => {
    if (notificationId) {
      fetchNotification();
    }
  }, [notificationId]);
  
  // Belge türü seçme
  const handleDocTypeSelect = (type: string) => {
    setDocumentType(type);
  };
  
  // Dosya seçme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  // Belge yükleme
  const handleUploadDocuments = async () => {
    console.log("[Upload] handleUploadDocuments triggered.");
    console.log("[Upload] Active Tab:", activeTab);
    console.log("[Upload] Current Step Data:", currentStepData);

    if (!documentType || selectedFiles.length === 0) {
      toast.error("Lütfen belge türü seçin ve en az bir dosya ekleyin.");
      return;
    }

    if (!currentStepData) {
      toast.error("Aktif adım verisi bulunamadı. Lütfen sayfayı yenileyin.");
      console.error("[Upload] Error: currentStepData is null or undefined.");
      return;
    }

    setUploadingStatus("loading");

    try {
      // Adım henüz kaydedilmemişse önce adımı kaydet
      let stepId = currentStepData.id;
      
      if (isCurrentStepTemporary) {
        console.log("[Upload] Temporary step detected, creating step first...");
        // Adımı oluşturmak için API çağrısı yap
        const createStepResponse = await fetch(
          `${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              stepType: activeTab,
              status: "PENDING",
              notes: ""
            }),
          }
        );
        
        const createStepResult = await createStepResponse.json();
        console.log("[Upload] Step creation response:", createStepResult);
        
        if (!createStepResponse.ok) {
          throw new Error(`Adım oluşturulamadı. HTTP Durum: ${createStepResponse.status} - ${JSON.stringify(createStepResult)}`);
        }
        
        if (!createStepResult.success) {
          throw new Error(createStepResult.message || "Adım oluşturulamadı.");
        }
        
        // Yeni adım ID'sini al
        stepId = createStepResult.data.id || createStepResult.data.step.id;
        console.log("[Upload] Step created successfully with ID:", stepId);
        
        // Güncel verileri yeniden yükle
        await fetchNotification();
      }

      console.log("[Upload] Using step ID for upload:", stepId);

      // Dosya bilgilerini güvenlik kontrolünden geçir
      const file = selectedFiles[0];
      if (!file) {
        throw new Error("Dosya seçilmedi");
      }

      const fileName = file.name || "document.pdf";
      const fileType = file.type || "application/octet-stream";
      const fileSize = file.size.toString() || "0";

      // FormData nesnesini oluştur
      const formData = new FormData();
      
      // Ana dosyayı ekle
      formData.append("file", file);
      
      // Tüm alanları ayrı ayrı ekle - Backend'in doğrudan bu alanları işleyebilmesi için
      formData.append("stepId", stepId);
      formData.append("documentType", documentType);
      formData.append("fileName", fileName);
      formData.append("fileType", fileType);
      formData.append("fileSize", fileSize);
      
      // Geçici bir fileUrl ekle (Backend muhtemelen bunu override edecek)
      formData.append("fileUrl", "temp-file-url");
      
      // Ayrıca tüm verileri tek bir "data" alanında da gönder (alternatif çözüm)
      const documentData = {
        stepId: stepId,
        documentType: documentType,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        fileUrl: "temp-file-url"
      };
      
      formData.append("data", JSON.stringify(documentData));
      
      // FormData içeriğini detaylı kontrol et
      console.log("[Upload] FormData keys:", [...formData.keys()]);
      console.log("[Upload] FormData values (except file):");
      for (const [key, value] of formData.entries()) {
        if (key !== "file") {
          console.log(`  ${key}: ${value}`);
        } else {
          console.log(`  ${key}: [File Object] name=${file.name}, size=${file.size}, type=${file.type}`);
        }
      }
      
      // Belgeleri yükle
      const uploadUrl = `${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps/${stepId}/documents`;
      console.log("[Upload] Sending POST request to:", uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("[Upload] Response Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Upload] Error response:", errorText);
        
        try {
          // Hata yanıtını JSON olarak parse etmeyi dene
          const errorJson = JSON.parse(errorText);
          throw new Error(`Belge yüklenemedi: ${errorJson.message || errorJson.error || `HTTP Durum: ${response.status}`}`);
        } catch (parseError) {
          // JSON parse edilemezse ham hata metnini kullan
          throw new Error(`Belge yüklenemedi. HTTP Durum: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      }
      
      const result = await response.json();
      console.log("[Upload] Response Body:", result);
      
      if (result.success) {
        setUploadingStatus("success");
        toast.success("Belgeler başarıyla yüklendi.");
        setSelectedFiles([]);
        setDocumentType("");
        setUploadDialogOpen(false);
        
        // Bildirimi ve adımları yeniden yükle
        await fetchNotification();
      } else {
        setUploadingStatus("error");
        throw new Error(result.message || "Belge yüklenirken bir hata oluştu.");
      }
    } catch (error: any) {
      setUploadingStatus("error");
      console.error("[Upload] Error during upload:", error);
      toast.error(`Belge eklenirken bir hata oluştu: ${error.message}`);
    }
  };
  
  // Adım durumunu güncelle
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStepData) {
      toast.error("Adım verisi bulunamadı.");
      return;
    }
    
    try {
      // Adım verilerini hazırla
      const updateData = {
        status: newStatus,
        notes: statusNotes,
        stepType: activeTab // Adım türünü istek gövdesine ekle
      };
      
      console.log("[Status Update] Güncellenecek adım:", currentStepData);
      
      // Adım ID'si - geçici mi yoksa kalıcı mı?
      const isTemporary = currentStepData.id?.startsWith('temp-');
      console.log("[Status Update] Adım geçici mi?", isTemporary);
      
      // Eğer adım geçici ise, önce adımı oluştur
      if (isTemporary) {
        console.log("[Status Update] Geçici adım tespit edildi, önce adım oluşturuluyor...");
        
        // Adım oluşturma için API endpoint'i
        const createUrl = `${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps`;
        console.log("[Status Update] POST isteği gönderiliyor:", createUrl);
        
        const createStepResponse = await fetch(
          createUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );
        
        if (!createStepResponse.ok) {
          const errorText = await createStepResponse.text();
          console.error("[Status Update] Adım oluşturma hatası:", errorText);
          
          try {
            // Hata yanıtını JSON olarak parse etmeyi dene
            const errorJson = JSON.parse(errorText);
            throw new Error(`Adım oluşturulamadı: ${errorJson.message || errorJson.error || `HTTP Durum: ${createStepResponse.status}`}`);
          } catch (parseError) {
            // JSON parse edilemezse ham hata metnini kullan
            throw new Error(`Adım oluşturulamadı. HTTP Durum: ${createStepResponse.status} - ${errorText.substring(0, 100)}`);
          }
        }
        
        const stepData = await createStepResponse.json();
        console.log("[Status Update] Adım başarıyla oluşturuldu:", stepData);
        
        if (!stepData.success) {
          throw new Error(stepData.message || "Adım oluşturulamadı.");
        }
        
        toast.success("Adım başarıyla oluşturuldu ve durumu güncellendi.");
        setStatusDialogOpen(false);
        
        // Güncel verileri yeniden yükle
        await fetchNotification();
        return; // İşlemi burada sonlandır
      }
      
      // Adım geçici değilse, doğrudan adım ID'si ile güncelleme yap
      const stepId = currentStepData.id;
      const updateUrl = `${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps/${stepId}`;
      console.log(`[Status Update] Permanent step update - Sending request to: ${updateUrl}`);
      
      const response = await fetch(
        updateUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Status Update] Error response:", errorText);
        
        try {
          // Hata yanıtını JSON olarak parse etmeyi dene
          const errorJson = JSON.parse(errorText);
          throw new Error(`Durum güncellenemedi: ${errorJson.message || errorJson.error || `HTTP Durum: ${response.status}`}`);
        } catch (parseError) {
          // JSON parse edilemezse ham hata metnini kullan
          throw new Error(`Durum güncellenemedi. HTTP Durum: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      }
      
      const result = await response.json();
      console.log("[Status Update] Kalıcı adım güncelleme yanıtı:", result);
      
      if (result.success) {
        toast.success("Adım durumu başarıyla güncellendi.");
        setStatusDialogOpen(false);
        
        // Bildirimi ve adımları yeniden yükle
        await fetchNotification();
        
        // Durum onaylandıysa ve API yanıtında bir sonraki adım belirtilmişse
        // o adıma geçiş yap
        const newCurrentStep = result.data?.notification?.currentStep;
        if (newStatus === "APPROVED" && newCurrentStep && newCurrentStep !== activeTab) {
          console.log("[Status Update] Aktif sekme değiştiriliyor:", newCurrentStep);
          setActiveTab(newCurrentStep as AyedasNotificationType);
        }
      } else {
        throw new Error(result.message || "Adım durumu güncellenemedi.");
      }
    } catch (error: any) {
      console.error("Adım durumu güncellenirken hata:", error);
      toast.error(error.message || "Adım durumu güncellenirken bir hata oluştu.");
    }
  };
  
  // Belge indirme
  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    // Aktif sekmenin (stepType) ID'sini bulmamız gerekiyor
    const currentStepData = steps.find(step => step.stepType === activeTab);
    if (!currentStepData || currentStepData.id.startsWith('temp-')) {
        toast.error("Geçerli adım bulunamadı veya henüz kaydedilmemiş.");
        return;
    }
    const stepId = currentStepData.id;

    try {
      // Backend endpoint'ine tam URL ile istek at
      const response = await fetch(`${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps/${stepId}/documents/${documentId}`);

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({})); // Hata mesajını almaya çalış
        throw new Error(errorResult.message || "Belge indirilemedi.");
      }

      // Backend'den dosya verisi geliyorsa (indirme simülasyonu için)
      if (response.headers.get("content-type")?.includes("application/json")) {
        const result = await response.json();
        if (result.success && result.data?.fileUrl) {
          // Gerçek indirme senaryosunda bu URL'yi kullanabilirsiniz veya backend doğrudan dosyayı gönderebilir
          console.log("İndirme URL'si (simülasyon):", result.data.fileUrl);
          toast.info(`İndirme simülasyonu: ${fileName}`);
          // Örnek: window.open(result.data.fileUrl, '_blank');
        } else {
          throw new Error(result.message || "Belge bilgileri alınamadı.")
        }
        return; // Simülasyon sonrası çık
      }
      
      // Gerçek dosya indirme (Backend doğrudan dosya gönderiyorsa)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err.message || "Belge indirilemedi.");
    }
  };
  
  // Belge silme
  const handleDeleteDocument = async (documentId: string) => {
    // Aktif sekmenin (stepType) ID'sini bulmamız gerekiyor
    const currentStepData = steps.find(step => step.stepType === activeTab);
    if (!currentStepData || currentStepData.id.startsWith('temp-')) {
        toast.error("Geçerli adım bulunamadı veya henüz kaydedilmemiş.");
        return;
    }
    const stepId = currentStepData.id;

    try {
      // Backend endpoint'ine tam URL ile istek at
      const response = await fetch(`${API_BASE_URL}/edas/ayedas/notifications/${notificationId}/steps/${stepId}/documents/${documentId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Belge başarıyla silindi!");
        
        // Adımları güncelle
        const updatedSteps = [...steps];
        const stepIndex = updatedSteps.findIndex(step => step.stepType === activeTab);
        
        if (stepIndex !== -1) {
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            documents: updatedSteps[stepIndex].documents.filter((doc: any) => doc.id !== documentId)
          };
          
          setSteps(updatedSteps);
        }
      } else {
        throw new Error(result.message || "Belge silinemedi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Belge silinirken bir hata oluştu.");
    }
  };
  
  // Yükleme veya hata durumunda
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-lg">Yükleniyor...</div>
      </div>
    );
  }
  
  if (error || !notification) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="text-red-500 text-xl">{error || "Bildirim bulunamadı."}</div>
        <Button onClick={() => router.push("/edas/ayedas")}>AYEDAŞ Bildirimlerine Dön</Button>
      </div>
    );
  }
  
  // Mevcut adım ve belgeler
  // const currentStep = steps.find(step => step.stepType === activeTab); // Zaten currentStepData olarak var
  const currentDocuments = currentStepData?.documents || [];
  
  // Render edilecek içerik
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Geri Dön Butonu */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/edas/ayedas")} className="flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          AYEDAŞ Bildirimlerine Dön
        </Button>
      </div>
      
      {/* Bildirim Detayları Kartı */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Bildirim Detayları</CardTitle>
              <CardDescription>
                <span className="text-slate-500">Referans No:</span> <span className="font-semibold">{notification.refNo}</span>
              </CardDescription>
            </div>
            <StatusBadge status={notification.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Proje Adı</h3>
              <p className="font-medium">{notification.projectName || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Başvuru Türü</h3>
              <p className="font-medium">
                {notification.applicationType === "NIHAI_BAGLANTI" ? "Nihai Bağlantı" : "Şantiye"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Müşteri Adı/Unvanı</h3>
              <p className="font-medium">{notification.customerName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">İl/İlçe</h3>
              <p className="font-medium">{`${notification.city || "-"} / ${notification.district || "-"}`}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Ada/Parsel</h3>
              <p className="font-medium">{`${notification.parcelBlock || "-"} / ${notification.parcelNo || "-"}`}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Oluşturulma Tarihi</h3>
              <p className="font-medium">{new Date(notification.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Adımlar ve Belgeler */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Adımları</CardTitle>
          <CardDescription>
            Adımları tamamlamak için gerekli belgeleri yükleyin ve durumlarını güncelleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AyedasNotificationType)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 mb-6">
              {STEP_ORDER.map((stepType) => {
                const step = steps.find(s => s.stepType === stepType);
                const isTemporary = step?.id?.startsWith('temp-'); // O anki adımın geçici olup olmadığını kontrol et
                return (
                  <TabsTrigger
                    key={stepType}
                    value={stepType}
                    className={cn(
                      "flex flex-col h-auto py-2 px-3 gap-1 relative",
                      step?.status === "APPROVED" && "bg-green-50 hover:bg-green-100 text-green-800",
                      step?.status === "REJECTED" && "bg-red-50 hover:bg-red-100 text-red-800"
                    )}
                  >
                    <span className="text-xs truncate max-w-[80px]">{STEP_NAMES[stepType as AyedasNotificationType]}</span>
                    {step && (
                      <div className="absolute -top-1 -right-1">
                        {step.status === "APPROVED" && <CheckIcon className="w-3 h-3 text-green-600" />}
                        {step.status === "REJECTED" && <XIcon className="w-3 h-3 text-red-600" />}
                        {step.status === "PENDING" && <AlertTriangleIcon className="w-3 h-3 text-amber-600" />}
                      </div>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {STEP_ORDER.map((stepType) => {
              const step = steps.find(s => s.stepType === stepType);
              const documents = step?.documents || [];
              const isTemporary = step?.id?.startsWith('temp-'); // O anki adımın geçici olup olmadığını kontrol et
              
              return (
                <TabsContent key={stepType} value={stepType} className="mt-0">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {STEP_NAMES[stepType as AyedasNotificationType]}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Durum: <StatusBadge status={step?.status || "PENDING"} />
                         {/* Geçici adımlar için uyarı */}
                         {isTemporary && <span className="ml-2 text-xs text-orange-600">(Kaydedilmedi)</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Belge Yükleme Diyaloğu */}
                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              title="Belge Yükle"
                           >
                            <UploadIcon className="h-4 w-4" />
                            Belge Yükle
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Belge Yükle</DialogTitle>
                            <DialogDescription>
                              {STEP_NAMES[stepType as AyedasNotificationType]} adımı için gerekli belgeleri yükleyin.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 my-4">
                            <div className="space-y-2">
                              <Label htmlFor="documentType">Belge Türü</Label>
                              <Select value={documentType} onValueChange={handleDocTypeSelect}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Belge türü seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REQUIRED_DOCUMENTS[stepType as AyedasNotificationType]?.map((docType) => (
                                    <SelectItem key={docType} value={docType}>
                                      {docType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="files">Dosya Seçin</Label>
                              <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                <Input
                                  id="files"
                                  type="file"
                                  multiple
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                                <label htmlFor="files" className="cursor-pointer">
                                  <UploadIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                  <p className="text-sm text-slate-500">
                                    Dosyaları sürükleyip bırakın veya{" "}
                                    <span className="font-medium text-blue-600">taramak için tıklayın</span>
                                  </p>
                                </label>
                              </div>
                            </div>
                            
                            {/* Seçilen dosyaların listesi */}
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2">
                                <Label>Seçilen Dosyalar</Label>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                      <div className="flex items-center">
                                        <FileIcon className="h-4 w-4 mr-2 text-slate-500" />
                                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <XIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setUploadDialogOpen(false)}
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={handleUploadDocuments}
                              disabled={uploadingStatus === "loading" || !documentType || selectedFiles.length === 0}
                            >
                              {uploadingStatus === "loading" ? "Yükleniyor..." : "Belgeleri Yükle"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Durum Güncelleme Diyaloğu */}
                      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" className="flex items-center gap-2">
                            <CheckIcon className="h-4 w-4" />
                            {isTemporary ? "Adımı Kaydet/Güncelle" : "Durumu Güncelle"} {/* Buton metnini değiştir */}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adım Durumunu Güncelle</DialogTitle>
                            <DialogDescription>
                              {STEP_NAMES[stepType as AyedasNotificationType]} adımının durumunu değiştirin.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <form onSubmit={handleUpdateStatus} className="space-y-4 my-4">
                            <div className="space-y-2">
                              <Label htmlFor="status">Durum</Label>
                              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as "PENDING" | "APPROVED" | "REJECTED")}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Durum seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Beklemede</SelectItem>
                                  <SelectItem value="APPROVED">Onaylandı</SelectItem>
                                  <SelectItem value="REJECTED">Reddedildi</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Durumla ilgili notlar girin..."
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                              />
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => setStatusDialogOpen(false)}
                              >
                                İptal
                              </Button>
                              <Button type="submit">
                                Durumu Güncelle
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="text-sm font-medium mb-2">Gerekli Belgeler:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {REQUIRED_DOCUMENTS[stepType as AyedasNotificationType]?.filter(doc => doc !== "Diğer").map((docType) => (
                        <li key={docType}>{docType}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Yüklenen Belgeler */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Yüklenen Belgeler:</h4>
                    {/* Belgeler listesi */}
                     {documents.length > 0 ? (
                         <div className="bg-slate-50 rounded-md divide-y divide-slate-200 border border-slate-200">
                         {documents.map((doc: any) => (
                           <div key={doc.id} className="py-3 flex items-center justify-between px-4 gap-2">
                             <div className="flex items-center overflow-hidden mr-2">
                               <FileIcon className="h-5 w-5 mr-3 text-slate-500 flex-shrink-0" />
                               <div className="flex-grow overflow-hidden">
                                 <p className="font-medium text-sm truncate" title={doc.fileName}>{doc.fileName}</p>
                                 <p className="text-xs text-slate-500 truncate">
                                   {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB •{" "}
                                   {new Date(doc.createdAt).toLocaleDateString()}
                                 </p>
                               </div>
                             </div>
                             <div className="flex gap-2 flex-shrink-0">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                               >
                                 İndir
                               </Button>
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button
                                     size="sm"
                                     variant="outline"
                                     className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200 hover:border-red-300"
                                     >
                                     <XIcon className="h-4 w-4" />
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Belgeyi Silmeyi Onayla</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       '{doc.fileName}' adlı belgeyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>İptal</AlertDialogCancel>
                                     <AlertDialogAction
                                       onClick={() => handleDeleteDocument(doc.id)}
                                       className="bg-red-600 hover:bg-red-700"
                                     >
                                       Sil
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : ( // Belge yoksa
                       <div className="text-center py-8 bg-slate-50 rounded-md border border-slate-200">
                         <p className="text-slate-500">Henüz belge yüklenmemiş.</p>
                         <Button
                           variant="outline"
                           className="mt-4"
                           onClick={() => setUploadDialogOpen(true)}
                         >
                           <UploadIcon className="h-4 w-4 mr-2" />
                           Belge Yükle
                         </Button>
                       </div>
                     )}
                  </div>
                  
                  {/* Durum notları */}
                  {step?.notes && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
                      <h4 className="text-sm font-medium mb-2">Notlar:</h4>
                      <p className="text-sm text-slate-700">{step.notes}</p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 