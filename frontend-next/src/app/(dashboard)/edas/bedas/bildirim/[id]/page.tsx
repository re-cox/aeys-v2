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
import { FileIcon, UploadIcon, XIcon, CheckIcon, AlertTriangleIcon, ArrowLeftIcon, PlusIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// BedasNotificationType enum
export enum BedasNotificationType {
  PROJE = "PROJE",
  BAGLANTI_GORUSU = "BAGLANTI_GORUSU",
  DAGITIM_BAGLANTI_ANLASMASI = "DAGITIM_BAGLANTI_ANLASMASI",
  TESISIN_TAMAMLANMASI = "TESISIN_TAMAMLANMASI",
  FEN_MUAYENE = "FEN_MUAYENE"
}

// Adım sırası
export const STEP_ORDER = [
  BedasNotificationType.PROJE,
  BedasNotificationType.BAGLANTI_GORUSU,
  BedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI,
  BedasNotificationType.TESISIN_TAMAMLANMASI,
  BedasNotificationType.FEN_MUAYENE
];

// Adım isimleri
export const STEP_NAMES: Record<BedasNotificationType, string> = {
  [BedasNotificationType.PROJE]: "Proje",
  [BedasNotificationType.BAGLANTI_GORUSU]: "Bağlantı Görüşü",
  [BedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI]: "Dağıtım Bağlantı Anlaşması",
  [BedasNotificationType.TESISIN_TAMAMLANMASI]: "Tesisin Tamamlanması",
  [BedasNotificationType.FEN_MUAYENE]: "Fen Muayene"
};

// Adımlar için gerekli belgeler
export const REQUIRED_DOCUMENTS: Record<BedasNotificationType, string[]> = {
  [BedasNotificationType.PROJE]: [
    "Proje Başvuru Dilekçesi",
    "Tapu Senedi",
    "Vekaletname",
    "Daimi Proje (dwg)",
    "Daimi Proje (pdf)",
    "Daimi Proje Kapağı (pdf/jpg)",
    "Yapı Ruhsatı",
    "Beyan ve Yükümlülük Taahhütnamesi",
    "Şirket İmza Sirküsü",
    "Başvuru Sahibi Vergi Levhası",
    "Diğer"
  ],
  [BedasNotificationType.BAGLANTI_GORUSU]: [
    "Enerji Talep Dilekçesi",
    "Harici Kroki",
    "Diğer"
  ],
  [BedasNotificationType.DAGITIM_BAGLANTI_ANLASMASI]: [
    "Bağlantı Anlaşması Talep Formu",
    "İşe Başlama Tutanağı",
    "Diğer"
  ],
  [BedasNotificationType.TESISIN_TAMAMLANMASI]: [
    "AG Tesis Projesi",
    "Kofranın Yapı Dışında Olduğu ve Yerden Yüksekliğini Gösteren Kofra Fotografları",
    "Yetkili Fen Adamı Tarafından Doldurulmuş ve Fen Adamı Tarafından İmzalanmış AG Geçici Kabul Tutanağı",
    "Kablo Kanalı Fotografı",
    "Kablo Montajını Gösteren Fotograf",
    "Kablo Üzerine İnce Kumu Gösteren Fotograf",
    "Kablo Üzerine Tuğla Yerleşimini Gösteren Fotograf",
    "Kablo İkaz Şeridini Gösteren Fotograf",
    "Kablo Kanalı Kapatma Fotografı",
    "Belediyeden Alınan Kazı Ruhsatı",
    "Diğer"
  ],
  [BedasNotificationType.FEN_MUAYENE]: [
    "İskan",
    "İş Bitirme Tutanağı",
    "Tesis Yapım Sözleşmesi",
    "Topraklama Ölçüm Raporu",
    "Akım Trafosu Muayene Raporu",
    "Meger Cihazı Kalibrasyon Testi",
    "Topraklama Yetki Belgesi",
    "İç Tesisat Uygunluk Belgesi",
    "Pano Sayaç Fotografları",
    "Diğer"
  ]
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

// Ana bileşen
export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  const [activeTab, setActiveTab] = useState<BedasNotificationType>(BedasNotificationType.PROJE);
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
  
  // Referans numarası düzenleme state'leri
  const [stepRefNos, setStepRefNos] = useState<Record<string, string>>({});
  const [isEditingRefNo, setIsEditingRefNo] = useState<string | null>(null);
  const [editingRefNoValue, setEditingRefNoValue] = useState("");
  
  // Bildirimi getir
  useEffect(() => {
    async function fetchNotification() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[BEDAS Detail] ${notificationId} ID'li bildirim detayı isteniyor...`);
        
        // Geçersiz ID kontrolü
        if (!notificationId || notificationId === 'undefined') {
          throw new Error('Geçersiz bildirim ID\'si');
        }
        
        const response = await fetch(`/api/edas/bedas/notifications/${notificationId}`);
        console.log(`[BEDAS Detail] API yanıtı alındı: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.error(`[BEDAS Detail] API hatası: ${response.status} ${response.statusText}`);
          throw new Error(`${response.status} ${response.statusText}`);
        }
        
        const result = await response.json().catch(error => {
          console.error(`[BEDAS Detail] JSON parse hatası:`, error);
          throw new Error("API yanıtı işlenirken hata oluştu");
        });
        
        console.log(`[BEDAS Detail] API yanıt içeriği:`, result);
        
        if (result.success) {
          setNotification(result.data);
          
          // Adımları kontrol et ve oluştur
          const existingSteps = result.data.steps || [];
          const allSteps = [...existingSteps];
          
          // Mevcut adımları kontrol et ve eksik olanları ekle
          STEP_ORDER.forEach((stepType) => {
            const stepExists = existingSteps.some((step: any) => step.stepType === stepType);
            if (!stepExists) {
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
            const aIndex = STEP_ORDER.indexOf(a.stepType as BedasNotificationType);
            const bIndex = STEP_ORDER.indexOf(b.stepType as BedasNotificationType);
            return aIndex - bIndex;
          });
          
          setSteps(sortedSteps);
          
          // Referans numaralarını hazırla
          const refNosObj: Record<string, string> = {};
          sortedSteps.forEach(step => {
            if (step.stepType === BedasNotificationType.PROJE) {
              // Proje adımı için: API'den geleni veya ana refNo'yu kullan
              refNosObj[step.stepType] = step.refNo || result.data.refNo || ""; 
            } else {
              // Diğer adımlar için: Sadece API'den geleni kullan, yoksa boş bırak
              refNosObj[step.stepType] = step.refNo || ""; 
            }
          });
          setStepRefNos(refNosObj);
          
          // Aktif sekmeyi mevcut adıma ayarla
          if (result.data.currentStep) {
            setActiveTab(result.data.currentStep as BedasNotificationType);
          }
        } else {
          throw new Error(result.message || result.error || "Bildirim detayı getirilirken bir hata oluştu.");
        }
      } catch (err) {
        console.error("Bildirim detayları getirilirken hata:", err);
        const errorMessage = err instanceof Error ? err.message : "Bilinmeyen bir hata";
        setError(`Bildirim detayları yüklenirken bir hata oluştu: ${errorMessage}`);
        toast.error(`Bildirim detayları yüklenirken bir hata oluştu: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (notificationId) {
      fetchNotification();
    }
  }, [notificationId]);
  
  // Referans numarası düzenleme işlemleri
  const startEditingRefNo = (stepType: string) => {
    setIsEditingRefNo(stepType);
    setEditingRefNoValue(stepRefNos[stepType] || "");
  };
  
  const cancelEditingRefNo = () => {
    setIsEditingRefNo(null);
    setEditingRefNoValue("");
  };
  
  const saveRefNo = async (stepType: string) => {
    if (!editingRefNoValue.trim()) {
      toast.error("Referans numarası boş olamaz");
      return;
    }
    
    try {
      console.log("Referans numarası güncelleme isteği gönderiliyor:", {
        id: notificationId,
        stepType,
        refNo: editingRefNoValue
      });
      
      // API'ye güncelleme isteği gönder
      const response = await fetch(`/api/edas/bedas/notifications/${notificationId}/steps/${stepType}/ref-no`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refNo: editingRefNoValue }),
      });
      
      const result = await response.json();
      console.log("API yanıtı:", result);
      
      if (result.success) {
        // State'i güncelle
        setStepRefNos(prev => ({
          ...prev,
          [stepType]: editingRefNoValue
        }));
        toast.success("Referans numarası güncellendi");
      } else {
        throw new Error(result.message || result.error || "Referans numarası güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Referans numarası güncellenirken hata:", error);
      toast.error((error as Error).message || "Referans numarası güncellenirken bir hata oluştu.");
    } finally {
      setIsEditingRefNo(null);
      setEditingRefNoValue("");
    }
  };
  
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
    if (!documentType) {
      toast.error("Lütfen yüklenecek belge türünü seçin.");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Lütfen en az bir dosya seçin.");
      return;
    }

    // Mevcut adımı bul
    const currentStepData = steps.find(step => step.stepType === activeTab);

    if (!currentStepData) {
        toast.error("Aktif adım bilgisi bulunamadı.");
        return;
    }

    // Adım geçici mi kontrol et
    const isTemporary = currentStepData.id?.startsWith('temp-');
    if (isTemporary) {
        toast.error("Lütfen önce bu adımın durumunu kaydedin (oluşturun), sonra belge yükleyin.");
        return;
    }

    // Geçerli adım ID'sini al
    const stepId = currentStepData.id;

    setUploadingStatus("loading");

    const formData = new FormData();
    formData.append("documentType", documentType);
    selectedFiles.forEach((file) => {
      formData.append("files", file); // Backend upload.array('files') bekliyor
    });

    try {
      // API URL'ini stepId ile oluştur
      const apiUrl = `/api/edas/bedas/notifications/${notificationId}/steps/${stepId}/documents`;
      console.log(`[BEDAS Upload] İstek gönderiliyor: ${apiUrl}`);
      console.log(`[BEDAS Upload] documentType:`, documentType);
      // FormData içeriğini loglamak tarayıcı konsolunda doğrudan mümkün olmayabilir,
      // ancak anahtarları kontrol edebiliriz:
      console.log(`[BEDAS Upload] FormData keys:`, Array.from(formData.keys()));


      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        // Content-Type header'ını manuel ayarlama, browser FormData ile kendi yapar
      });

      console.log(`[BEDAS Upload] API Yanıt Durumu: ${response.status} ${response.statusText}`);

      const result = await response.json().catch(async (parseError) => {
        console.error("[BEDAS Upload] JSON parse hatası:", parseError);
        const textResponse = await response.text();
        console.error("[BEDAS Upload] API Yanıt Metni:", textResponse);
        throw new Error(`API yanıtı işlenemedi: ${response.statusText}. Yanıt: ${textResponse.substring(0, 100)}...`);
      });

      console.log("[BEDAS Upload] API Yanıtı:", result);

      if (result.success) {
        setUploadingStatus("success");
        // Backend artık data: { documents: [...] } yapısında dönüyor
        const uploadedDocs = result.data?.documents || [];
        if (uploadedDocs.length > 0) {
             toast.success(`${uploadedDocs.length} belge başarıyla yüklendi!`);
        } else {
             toast.warning("Belgeler yüklendi ancak sunucudan geçerli veri alınamadı.");
        }

        // State'i güncelle: Yüklenen belgeleri mevcut adıma ekle
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId // Artık stepId ile karşılaştırıyoruz
              ? {
                  ...step,
                  documents: [...(step.documents || []), ...uploadedDocs]
                }
              : step
          )
        );

        // Dialog'u kapat ve formu sıfırla
        setUploadDialogOpen(false);
        setSelectedFiles([]);
        setDocumentType("");

        // Kısa bir süre sonra durumu idle yap (başka yükleme için)
        setTimeout(() => setUploadingStatus("idle"), 2000);

      } else {
        setUploadingStatus("error");
        throw new Error(result.message || result.error || "Belgeler yüklenirken bir hata oluştu.");
      }
    } catch (error) {
      setUploadingStatus("error");
      console.error("Belge yüklenirken hata:", error);
      toast.error((error as Error).message || "Belgeler yüklenirken bir hata oluştu.");
      setTimeout(() => setUploadingStatus("idle"), 3000);
    }
  };
  
  // Adım durumu güncelleme
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault(); // Formun varsayılan gönderimini engelle

    // Aktif adıma ait veriyi bul
    const currentStepData = steps.find(step => step.stepType === activeTab);

    if (!currentStepData) {
      toast.error("Güncellenecek adım verisi bulunamadı.");
      return;
    }

    const isTemporary = currentStepData.id?.startsWith('temp-');
    console.log(`[BEDAS Status Update] Adım ${activeTab}, Geçici mi: ${isTemporary}`);

    try {
      let response: Response;
      let requestBody = JSON.stringify({
        status: newStatus,
        notes: statusNotes,
        stepType: activeTab // POST isteği için stepType gerekli olabilir
      });

      if (isTemporary) {
        // Geçici adım: Yeni adım oluştur (POST)
        const createUrl = `/api/edas/bedas/notifications/${notificationId}/steps`;
        console.log("[BEDAS Status Update] Geçici adım, POST isteği gönderiliyor:", createUrl);
        response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
        });
      } else {
        // Mevcut adım: Adımı güncelle (PUT)
        const stepId = currentStepData.id;
        const updateUrl = `/api/edas/bedas/notifications/${notificationId}/steps/${stepId}`;
        console.log("[BEDAS Status Update] Mevcut adım, PUT isteği gönderiliyor:", updateUrl);
        response = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // PUT isteğinde sadece status ve notes gönderilmesi yeterli olabilir
          body: JSON.stringify({ status: newStatus, notes: statusNotes }),
        });
      }

      console.log("[BEDAS Status Update] API Yanıt Durumu:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[BEDAS Status Update] API Hatası:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || errorJson.error || `HTTP Durum: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Adım durumu güncellenemedi. HTTP Durum: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      }

      const result = await response.json();
      console.log("[BEDAS Status Update] API Yanıtı:", result);

      if (result.success) {
        toast.success(`BEDAŞ Adım durumu başarıyla güncellendi.`);
        setStatusDialogOpen(false);

        // Sayfayı yeniden yükleyerek güncel verileri alalım (en basit yöntem)
        // Daha iyisi: state'i API yanıtına göre güncellemek
        // fetchNotification(); // Bu fonksiyonu tekrar çağırabiliriz
        window.location.reload(); // Şimdilik sayfayı yenileyelim

      } else {
        throw new Error(result.message || "Adım durumu güncellenirken bir hata oluştu.");
      }
    } catch (error: any) {
      console.error("Adım durumu güncellenirken hata:", error);
      toast.error(error.message || "Adım durumu güncellenirken bir hata oluştu.");
    }
  };
  
  // Belge indirme
  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    // Aktif sekmenin adım ID'sini al
    const currentStepData = steps.find(step => step.stepType === activeTab);
    if (!currentStepData || currentStepData.id?.startsWith('temp-')) {
        toast.error("İndirme için geçerli adım bulunamadı.");
        return;
    }
    const stepId = currentStepData.id;

    try {
      // Doğru API endpoint'ini kullan (stepId dahil)
      const apiUrl = `/api/edas/bedas/notifications/${notificationId}/steps/${stepId}/documents/${documentId}`;
      console.log(`[BEDAS Download] İstek gönderiliyor: ${apiUrl}`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status} ${response.statusText}`}));
         console.error("[BEDAS Download] API Hatası:", errorData);
        throw new Error(errorData.message || "Belge indirilemedi.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Belge indirme başladı.");
    } catch (err: any) {
      console.error("Belge indirilirken hata:", err);
      toast.error(err.message || "Belge indirilemedi.");
    }
  };

  // Belge Görüntüleme
  const handleViewDocument = (document: any) => {
    if (!document.fileUrl) {
        toast.error('Görüntülenecek dosya URL\'si bulunamadı.');
        return;
    }

    // fileUrl'nin geçerli bir URL olduğundan emin ol (örn. /uploads/... ile başlamalı)
    // Güvenlik için basit bir kontrol
    if (!document.fileUrl.startsWith('/uploads/')) {
        console.error("Geçersiz dosya URL'si:", document.fileUrl);
        toast.error('Dosya URL\'si geçersiz.');
        return;
    }

    // Dosya tipini kontrol et (mimeType daha güvenilir)
    const mimeType = document.fileType?.toLowerCase();
    const isViewable = mimeType === 'application/pdf' || mimeType?.startsWith('image/');

    if (!isViewable) {
        toast.info('Bu dosya türü tarayıcıda doğrudan görüntülenemez.');
        return;
    }

    // Backend URL'sini al (Statik dosya sunumu için)
    // Bu URL'nin backend'in çalıştığı adres olması lazım
    // Örn: http://localhost:5001
    // Güvenli yol: environment variable kullanmak
    const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'; 
    const viewUrl = `${backendBaseUrl}${document.fileUrl}`; 

    console.log(`[BEDAS View] Dosya açılıyor: ${viewUrl}`);
    window.open(viewUrl, '_blank');
  };

  // Belge silme
  const handleDeleteDocument = async (documentId: string) => {
     // Aktif sekmenin adım ID'sini al
    const currentStepData = steps.find(step => step.stepType === activeTab);
    if (!currentStepData || currentStepData.id?.startsWith('temp-')) {
        toast.error("Silme için geçerli adım bulunamadı.");
        return;
    }
    const stepId = currentStepData.id;

    // Silme onayı isteyebiliriz (AlertDialog ile)
    // Şimdilik doğrudan siliyoruz

    try {
      // Doğru API endpoint'ini kullan (stepId dahil)
      const apiUrl = `/api/edas/bedas/notifications/${notificationId}/steps/${stepId}/documents/${documentId}`;
      console.log(`[BEDAS Delete] İstek gönderiliyor: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      const result = await response.json().catch(async (parseError) => {
          console.error("[BEDAS Delete] JSON parse hatası:", parseError);
          const textResponse = await response.text();
          console.error("[BEDAS Delete] API Yanıt Metni:", textResponse);
          throw new Error(`API yanıtı işlenemedi: ${response.statusText}. Yanıt: ${textResponse.substring(0, 100)}...`);
      });

      console.log("[BEDAS Delete] API Yanıtı:", result);

      if (result.success) {
        toast.success("Belge başarıyla silindi!");

        // Adımları güncelle (State'den belgeyi kaldır)
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  documents: step.documents?.filter((doc: any) => doc.id !== documentId) || []
                }
              : step
          )
        );
      } else {
        throw new Error(result.message || "Belge silinemedi.");
      }
    } catch (err: any) {
      console.error("Belge silinirken hata:", err);
      toast.error(err.message || "Belge silinirken bir hata oluştu.");
    }
  };
  
  // İlgili adımın referans numarasını görüntüleyen komponent
  const StepRefNoDisplay = ({ stepType }: { stepType: BedasNotificationType }) => {
    const isEditing = isEditingRefNo === stepType;
    const currentRefNo = stepRefNos[stepType];
    
    return (
      <div className="flex items-center justify-between mt-4 mb-6 p-3 bg-slate-50 rounded-md border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Başvuru Numarası</span>
          {isEditing ? (
            <div className="flex items-center mt-1">
              <Input 
                value={editingRefNoValue}
                onChange={(e) => setEditingRefNoValue(e.target.value)}
                className="h-7 text-sm"
                placeholder="Başvuru numarası girin"
              />
              <div className="flex space-x-2 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveRefNo(stepType)}
                  className="h-7 text-xs px-2"
                >
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditingRefNo}
                  className="h-7 text-xs px-2"
                >
                  İptal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center mt-1">
              <span className="font-medium">{currentRefNo || "Belirtilmemiş"}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startEditingRefNo(stepType)}
                className="h-6 ml-2 text-xs"
              >
                {currentRefNo ? "Düzenle" : "Ekle"} 
              </Button>
            </div>
          )}
        </div>
      </div>
    );
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
        <Button onClick={() => router.push("/edas/bedas")}>BEDAŞ Bildirimlerine Dön</Button>
      </div>
    );
  }
  
  // Mevcut adım ve belgeler
  const currentStep = steps.find(step => step.stepType === activeTab);
  const currentDocuments = currentStep?.documents || [];
  
  // Render edilecek içerik
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Geri Dön Butonu */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/edas/bedas")} className="flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          BEDAŞ Bildirimlerine Dön
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
            onValueChange={(value) => setActiveTab(value as BedasNotificationType)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-6">
              {STEP_ORDER.map((stepType) => {
                const step = steps.find(s => s.stepType === stepType);
                return (
                  <TabsTrigger
                    key={stepType}
                    value={stepType}
                    className={cn(
                      "flex flex-col h-auto py-2 px-3 gap-1 relative",
                      step?.status === "APPROVED" && "bg-green-50 hover:bg-green-100 text-green-800",
                      step?.status === "REJECTED" && "bg-red-50 hover:bg-red-100 text-red-800"
                    )}
                    disabled={false}
                  >
                    <span className="text-xs truncate max-w-[80px]">{STEP_NAMES[stepType as BedasNotificationType]}</span>
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
              
              return (
                <TabsContent key={stepType} value={stepType}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{STEP_NAMES[stepType]}</CardTitle>
                        <CardDescription>Bu adımda gerekli evrakları yükleyin ve onay durumunu güncelleyin.</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={step?.status || "PENDING"} />
                        <Dialog open={statusDialogOpen && activeTab === stepType} onOpenChange={(open) => {
                          if (open) {
                            // Dialog açıldığında mevcut durumu ve notları al
                            setNewStatus(step?.status || "PENDING");
                            setStatusNotes(step?.notes || "");
                            setActiveTab(stepType); // Hangi sekmenin dialogunu açtığımızı bilmek için
                            setStatusDialogOpen(true);
                          } else {
                            setStatusDialogOpen(false);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs px-2 h-7">
                              Durumu Değiştir
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adım Durumunu Güncelle</DialogTitle>
                              <DialogDescription>
                                {STEP_NAMES[stepType]} adımının durumunu değiştirin.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateStatus} className="space-y-4 my-4">
                              <div className="space-y-2">
                                <Label htmlFor="status">Durum</Label>
                                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as "PENDING" | "APPROVED" | "REJECTED")}>
                                  <SelectTrigger id="status">
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
                    </CardHeader>
                    
                    <CardContent>
                      <StepRefNoDisplay stepType={stepType as BedasNotificationType} />
                    
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Gerekli Belgeler:</h4>
                          <Dialog open={uploadDialogOpen && activeTab === stepType} onOpenChange={(open) => {
                            if (open) {
                              setActiveTab(stepType);
                              setUploadDialogOpen(true);
                              setSelectedFiles([]);
                              setDocumentType("");
                              setUploadingStatus("idle");
                            } else {
                              setUploadDialogOpen(false);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs px-2 h-7 flex items-center gap-1">
                                <UploadIcon className="h-3 w-3" />
                                Yükle
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Belge Yükle</DialogTitle>
                                <DialogDescription>
                                  {STEP_NAMES[stepType]} adımı için belge yükleyin.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 my-4">
                                <div className="space-y-2">
                                  <Label htmlFor="documentType">Belge Türü *</Label>
                                  <Select value={documentType} onValueChange={handleDocTypeSelect}>
                                    <SelectTrigger id="documentType">
                                      <SelectValue placeholder="Belge türü seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {REQUIRED_DOCUMENTS[stepType as BedasNotificationType]?.map((docType) => (
                                        <SelectItem key={docType} value={docType}>
                                          {docType}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`file-upload-${stepType}`}>Dosya Seçin *</Label>
                                  <div className={cn(
                                    "border-2 border-dashed border-slate-200 rounded-md p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer",
                                    selectedFiles.length > 0 && "border-blue-300 bg-blue-50"
                                  )}>
                                    <Input
                                      id={`file-upload-${stepType}`}
                                      type="file"
                                      multiple
                                      className="hidden"
                                      onChange={handleFileChange}
                                    />
                                    <label htmlFor={`file-upload-${stepType}`} className="cursor-pointer">
                                      <UploadIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                      <p className="text-sm text-slate-500">
                                        Dosyaları sürükleyip bırakın veya{" "}
                                        <span className="font-medium text-blue-600">taramak için tıklayın</span>
                                      </p>
                                      {selectedFiles.length > 0 && (
                                        <p className="text-xs text-slate-600 mt-2">
                                          {selectedFiles.length} dosya seçildi.
                                        </p>
                                      )}
                                    </label>
                                  </div>
                                </div>
                                {selectedFiles.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Seçilen Dosyalar</Label>
                                    <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                                      {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-1 bg-white rounded text-xs">
                                          <div className="flex items-center overflow-hidden mr-2">
                                            <FileIcon className="h-3 w-3 mr-1.5 text-slate-500 flex-shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                          </div>
                                          <Button 
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                            }}
                                            className="h-5 w-5 p-0 text-red-500 hover:bg-red-100"
                                          >
                                            <XIcon className="h-3 w-3" />
                                          </Button>
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
                                  disabled={uploadingStatus === "loading"}
                                >
                                  İptal
                                </Button>
                                <Button
                                  onClick={handleUploadDocuments}
                                  disabled={uploadingStatus === "loading" || !documentType || selectedFiles.length === 0}
                                  className="min-w-[100px]"
                                >
                                  {uploadingStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yükle"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <h4 className="text-sm font-medium mb-2">Yüklenen Belgeler:</h4>
                        {documents.length > 0 ? (
                          <div className="bg-slate-50 rounded-md divide-y divide-slate-200 border border-slate-200">
                            {documents.map((doc: any) => {
                              const mimeType = doc.fileType?.toLowerCase();
                              const isViewable = mimeType === 'application/pdf' || mimeType?.startsWith('image/');
                              return (
                                <div key={doc.id} className="py-3 flex items-center justify-between px-4 gap-2">
                                  <div className="flex items-center min-w-0 flex-1">
                                    <FileIcon className="h-5 w-5 mr-3 text-slate-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-medium truncate" title={doc.originalName || doc.fileName}>{doc.originalName || doc.fileName}</p>
                                      <p className="text-xs text-slate-500 truncate">
                                        {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDocument(doc)}
                                      disabled={!isViewable}
                                      className="text-xs h-7 px-2 hidden sm:inline-flex" // Küçük ekranlarda gizle
                                      title={isViewable ? "Görüntüle" : "Bu dosya türü görüntülenemez"}
                                    >
                                      Görüntüle
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadDocument(doc.id, doc.originalName || doc.fileName)}
                                      className="text-xs h-7 px-2"
                                      title="İndir"
                                    >
                                      İndir
                                    </Button>
                                    {/* Mobil için Görüntüle/İndir Dropdown (Opsiyonel) */} 
                                    {/* Silme Butonu */} 
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 hover:text-red-800 hover:bg-red-50 h-7 w-7 p-0"
                                          title="Sil"
                                        >
                                          <XIcon className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Belgeyi Sil</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            '{doc.originalName || doc.fileName}' adlı belgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-md border border-slate-200">
                            <p className="text-slate-500">Henüz belge yüklenmemiş.</p>
                          </div>
                        )}
                      </div>
                      
                      {step?.notes && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
                          <h4 className="text-sm font-medium mb-2">Notlar:</h4>
                          <p className="text-sm text-slate-700">{step.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 