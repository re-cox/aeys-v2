import axios from "axios";
import { Personel, TeknisyenRaporu, TeknisyenDokuman } from "@/types/teknisyen";
import { apiClient } from "@/services/api"; // Doğru import yolunu kullan

// Ortamı tespit et (Sunucu mu, İstemci mi?)
const IS_SERVER = typeof window === 'undefined';

// Ortama göre doğru API temel URL'ini belirle
const API_BASE_URL = IS_SERVER
  ? process.env.API_URL || "http://localhost:5001/api" // Sunucuda tam URL kullan
  : process.env.NEXT_PUBLIC_API_URL || "/api";       // İstemcide göreceli yol kullan

// Hangi URL'in kullanıldığını loglayalım (debugging için)
console.log(`[API Service] Environment: ${IS_SERVER ? 'SERVER' : 'CLIENT'}, API_BASE_URL: ${API_BASE_URL}`);

// TeknisyenRaporları API'den getir
export const getTeknisyenRaporlari = async (): Promise<TeknisyenRaporu[]> => {
  // Dinamik API_BASE_URL kullan
  const url = `/test-raporlar`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
  console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`); // Loglama eklendi
  try {
    const response = await apiClient.get(url); // axios -> apiClient
    return response.data;
  } catch (error) {
    console.error("Teknisyen raporları getirilirken hata:", error);
    // Daha spesifik hata fırlatılabilir veya duruma göre boş dizi dönülebilir.
    throw new Error("Teknisyen raporları yüklenirken bir hata oluştu.");
  }
};

// Belirli bir teknisyen raporunu API'den getir
export const getTeknisyenRaporu = async (id: string): Promise<TeknisyenRaporu> => {
  // Dinamik API_BASE_URL kullan
  const url = `/test-raporlar/${id}`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
  console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`);
  try {
    const response = await apiClient.get(url); // axios -> apiClient
    console.log('Backend\'den gelen ham rapor verisi:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) { // Hata tipini 'any' olarak yakalayalım
    console.error(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] ID'si ${id} olan teknisyen raporu getirilirken hata:`, error);
     // Axios hatalarını ve özellikle 404 durumunu kontrol et
     if (axios.isAxiosError(error) && error.response?.status === 404) {
       console.warn(`Rapor bulunamadı (404), ID: ${id}`);
       // Sayfanın beklediği gibi hata fırlat
       throw new Error(`ID'si ${id} olan teknisyen raporu bulunamadı`);
     }
    // Diğer hatalar için genel bir hata fırlat
    throw new Error(`Teknisyen raporu getirilirken bir hata oluştu (ID: ${id}).`);
  }
};

// Teknisyen raporu oluştur - API'ye gönder
export const createTeknisyenRaporu = async (rapor: Partial<TeknisyenRaporu>): Promise<TeknisyenRaporu> => {
   // Dinamik API_BASE_URL kullan
   const url = `/test-raporlar`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] POST ${url}`);
  try {
     // teknisyenId'nin geçerliliğini kontrol et
     if (!rapor.teknisyenId && !rapor.teknisyenNo) {
       console.error("TeknisyenID veya TeknisyenNo eksik!");
     } else {
       console.log("TeknisyenID/No:", rapor.teknisyenId || rapor.teknisyenNo);
     }
     
     // Foreign key sorunu yaşamamak için her zaman sabit bir admin kullanıcısı ID'si kullanıyoruz
     const ADMIN_USER_ID = "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // Sistemde var olan bir kullanıcı
     
     // Kullanıcının girdiği rapor bilgi numarasını almak için
     const userEnteredTeknisyenId = rapor.teknisyenId || rapor.teknisyenNo || "";
     
     // Bitiş tarihi ve başlangıç saati bilgilerini kontrol edelim
     let bitisTarihiStr = "";
     if (rapor.bitisTarihi) {
       bitisTarihiStr = rapor.bitisTarihi instanceof Date 
         ? rapor.bitisTarihi.toISOString() 
         : rapor.bitisTarihi;
     }
     
     // İlgili personel bilgilerini kontrol edelim  
     let ilgiliPersonelStr = "";
     if (Array.isArray(rapor.personeller) && rapor.personeller.length > 0) {
       ilgiliPersonelStr = rapor.personeller.join(", ");
     }
     
     // Başlangıç tarihi varsa, açıklamada başlangıç saatini de belirtelim
     let baslangicTarihiStr = "";
     const tarihValue = rapor.tarih || rapor.baslangicTarihi;
     if (tarihValue) {
       baslangicTarihiStr = tarihValue instanceof Date 
         ? tarihValue.toISOString() 
         : tarihValue;
     }
     
     // Açıklama alanına gereken tüm bilgileri yerleştiriyoruz
     let enhancedAciklama = `Rapor Bilgi No: ${userEnteredTeknisyenId}`;
     
     if (baslangicTarihiStr) {
       enhancedAciklama += `\nBaşlangıç Tarihi: ${baslangicTarihiStr}`;
     }
     
     if (bitisTarihiStr) {
       enhancedAciklama += `\nBitiş Tarihi: ${bitisTarihiStr}`;
     }
     
     if (ilgiliPersonelStr) {
       enhancedAciklama += `\nİlgili Personel IDs: ${ilgiliPersonelStr}`;
     }
     
     if (rapor.aciklama) {
       enhancedAciklama += `\n\n${rapor.aciklama}`;
     }
     
     // Gönderilecek veriyi tanımla - backend modelindeki alan adlarını kullan
     const payload: any = {
       baslik: rapor.baslik || rapor.isinAdi, // Form'dan gelen isinAdi veya direkt baslik
       aciklama: enhancedAciklama,
       durum: rapor.durum,
       teknisyenId: ADMIN_USER_ID, // Her zaman sabit sistem kullanıcısı ID'si kullanıyoruz
       projeId: rapor.projeId,
       siteId: rapor.siteId,
     };
     
     // Tarih değerini ekle - Date tipini kontrol et
     if (tarihValue) {
       payload.tarih = tarihValue instanceof Date ? tarihValue.toISOString() : tarihValue;
       console.log("Tarih değeri:", payload.tarih, "Orijinal tip:", typeof tarihValue);
     } else {
       console.warn("Tarih değeri bulunamadı!");
     }
    
    console.log('Teknisyen raporu oluşturma payload:', JSON.stringify(payload, null, 2));
    console.log('Orijinal durum değeri:', rapor.durum, 'Tip:', typeof rapor.durum);
    
    // İstek öncesi API URL'ini loglayalım
    console.log('API isteği URL:', `${API_BASE_URL}${url}`);
    
    const response = await apiClient.post(url, payload); // axios -> apiClient
    
    // Başarılı yanıt loglanması
    console.log('API yanıtı başarılı:', response.status);
    return response.data;
  } catch (error) {
    console.error("Teknisyen raporu oluşturulurken hata:", error);
    if (axios.isAxiosError(error)) {
      console.error("[API] Hata Detayları:");
      console.error("- Durum Kodu:", error.response?.status);
      console.error("- Yanıt Verileri:", JSON.stringify(error.response?.data, null, 2));
      console.error("- Hata Mesajı:", error.message);
      
      // Detaylı hata bilgisi
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          console.error("Hata Detayları:", data);
          if (data.details) {
            console.error("- Eksik alanlar:", data.details.missingFields);
            console.error("- Geçersiz değerler:", data.details.invalidValues);
          }
          console.error("- Mesaj:", data.message);
        }
      }
    }
    throw new Error("Teknisyen raporu oluşturulurken bir hata oluştu.");
  }
};

// Teknisyen raporu güncelle - API'ye gönder
export const updateTeknisyenRaporu = async (id: string, rapor: Partial<TeknisyenRaporu>): Promise<TeknisyenRaporu> => {
   // Dinamik API_BASE_URL kullan
   const url = `/test-raporlar/${id}`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] PUT ${url}`);
  try {
     // Güncellenecek veriyi dikkatlice oluştur - backend modelindeki alan adlarını kullan
     const updateData: Partial<TeknisyenRaporu> = {};
     
     // Form'dan veya direkt olarak gelen veriyi doğru alanlara eşleştir
     if (rapor.baslik !== undefined || rapor.isinAdi !== undefined) 
       updateData.baslik = rapor.baslik || rapor.isinAdi;
     
     if (rapor.aciklama !== undefined) 
       updateData.aciklama = rapor.aciklama;
     
     if (rapor.durum !== undefined) 
       updateData.durum = rapor.durum;
     
     if (rapor.teknisyenId !== undefined || rapor.teknisyenNo !== undefined) 
       updateData.teknisyenId = rapor.teknisyenId || rapor.teknisyenNo;
     
     if (rapor.projeId !== undefined) 
       updateData.projeId = rapor.projeId;
     
     if (rapor.siteId !== undefined) 
       updateData.siteId = rapor.siteId;
     
     // tarih için baslangicTarihi veya tarih'i kullan
     if (rapor.tarih !== undefined || rapor.baslangicTarihi !== undefined) {
       const tarihValue = rapor.tarih || rapor.baslangicTarihi;
       // Date tipini ISO string'e çevir, zaten string ise olduğu gibi kullan
       updateData.tarih = tarihValue instanceof Date ? tarihValue.toISOString() : tarihValue;
     }

    console.log('Teknisyen raporu güncelleme payload:', updateData);
    const response = await apiClient.put(url, updateData); // axios -> apiClient
    return response.data;
  } catch (error) {
     console.error(`ID'si ${id} olan teknisyen raporu güncellenirken hata:`, error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details on update:", error.response?.data);
    }
    throw new Error(`Teknisyen raporu güncellenirken bir hata oluştu (ID: ${id}).`);
  }
};

// Teknisyen raporunu sil - API'ye istek gönder
export const deleteTeknisyenRaporu = async (id: string): Promise<void> => {
   // Dinamik API_BASE_URL kullan
   const url = `/test-raporlar/${id}`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] DELETE ${url}`);
  try {
    await apiClient.delete(url); // axios -> apiClient
  } catch (error) {
     console.error(`ID'si ${id} olan teknisyen raporu silinirken hata:`, error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details on delete:", error.response?.data);
    }
    throw new Error(`Teknisyen raporu silinirken bir hata oluştu (ID: ${id}).`);
  }
};

// Personelleri API'den getir
export const getPersoneller = async (): Promise<Personel[]> => {
   // Dinamik API_BASE_URL kullan
   const url = `/test-raporlar/personeller/listele`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`);
  try {
    const response = await apiClient.get(url); // axios -> apiClient
    return response.data;
  } catch (error) {
    console.error("Personel verileri getirilirken hata:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data);
    }
    throw new Error("Personel listesi yüklenirken bir hata oluştu.");
  }
};

// Teknisyen dokümanı yükle - fetch kullanıyor, aynı mantığı uygula
export const uploadTeknisyenDokuman = async (
  raporId: string,
  file: File,
  aciklama: string,
  yuklayanId?: string // Yükleme yapan kullanıcı ID'si, opsiyonel
): Promise<TeknisyenDokuman> => {
  // Genel upload API'sini kullan
  const uploadUrl = `/upload`;
  console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] POST (fetch) ${uploadUrl}`);
  try {
    // 1. Önce dosyayı genel upload API'sine yükle
    const uploadFormData = new FormData();
    uploadFormData.append('files', file); // Genel upload API 'files' parametresi bekliyor
    
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`Dosya yükleniyor: ${file.name}`);
    const fullUploadUrl = `${API_BASE_URL}${uploadUrl}`;
    console.log(`Tam URL: ${fullUploadUrl}`);
    
    const uploadResponse = await fetch(fullUploadUrl, {
      method: 'POST',
      body: uploadFormData,
      headers
    });

    if (!uploadResponse.ok) {
      let errorBody = 'Dosya yükleme hatası detayı alınamadı.';
      try {
        errorBody = await uploadResponse.text();
      } catch (e) { /* ignore */ }
      console.error(`Dosya yükleme başarısız (${uploadResponse.status}): ${errorBody}`);
      throw new Error(`Dosya yükleme işlemi başarısız oldu (HTTP ${uploadResponse.status})`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Dosya yükleme başarılı:', uploadResult);
    
    if (!uploadResult.success || !uploadResult.files || uploadResult.files.length === 0) {
      throw new Error('Dosya yükleme başarılı görünüyor ancak sonuç beklendiği gibi değil');
    }
    
    // Yüklenen ilk dosyanın bilgilerini al
    const uploadedFile = uploadResult.files[0];
    
    // 2. Mock TeknisyenDokuman oluştur (Normalde bu backend'de olurdu)
    // Bu sürüm doğrulama için kullanılıyor, ancak doküman yükleme işleviselliğini göstermek için yeterli
    const mockDokuman: TeknisyenDokuman = {
      id: Date.now().toString(), // Gerçek bir ID olmadan sadece simülasyon
      dosyaAdi: uploadedFile.fileName,
      dosyaUrl: uploadedFile.fileUrl,
      dosyaTipu: uploadedFile.fileType,
      dosyaBoyutu: uploadedFile.fileSize,
      createdAt: new Date().toISOString(),
      raporId: raporId,
      yuklemeTarihi: new Date().toISOString(),
    };
    
    return mockDokuman;
  } catch (error) {
    console.error("Doküman yüklenirken hata:", error);
    if (error instanceof Error && error.message.startsWith('Dosya yükleme işlemi başarısız oldu')) {
      throw error;
    }
    throw new Error("Doküman yüklenirken bir hata oluştu.");
  }
};

// Teknisyen dokümanını sil - fetch kullanıyor, aynı mantığı uygula
export const deleteTeknisyenDokuman = async (dokumentId: string): Promise<void> => {
   // Dinamik API_BASE_URL kullan
  const url = `/test-raporlar/dokuman/${dokumentId}`; // Düzeltildi: `/teknisyen-raporlar` -> `/test-raporlar`
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] DELETE (fetch) ${url}`);
  try {
    // Tam URL oluştur
    const fullUrl = `${API_BASE_URL}${url}`;
    
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
         let errorBody = 'Silme hatası detayı alınamadı.';
         try {
             errorBody = await response.text();
         } catch (e) { /* ignore */ }
         console.error(`Doküman silme başarısız (${response.status}): ${errorBody}`);
      throw new Error(`Doküman silme işlemi başarısız oldu (HTTP ${response.status})`);
    }
     // Başarılı DELETE isteğinde veri beklenmez
  } catch (error) {
     console.error(`ID'si ${dokumentId} olan doküman silinirken hata:`, error);
      if (error instanceof Error && error.message.startsWith('Doküman silme işlemi başarısız oldu')) {
         throw error;
     }
    throw new Error(`Doküman silinirken bir hata oluştu (ID: ${dokumentId}).`);
  }
}; 