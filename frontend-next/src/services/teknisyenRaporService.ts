import axios from "axios";
import { Personel, TeknisyenRaporu, TeknisyenDokuman } from "@/types/teknisyen";

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
  const url = `${API_BASE_URL}/teknisyen-raporlar`;
  console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`); // Loglama eklendi
  try {
    const response = await axios.get(url);
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
  const url = `${API_BASE_URL}/teknisyen-raporlar/${id}`;
  console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`); // Loglama eklendi
  try {
    const response = await axios.get(url);
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
   const url = `${API_BASE_URL}/teknisyen-raporlar`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] POST ${url}`); // Loglama eklendi
  try {
     // Gönderilecek veriyi tanımla
     const payload = {
       isinAdi: rapor.isinAdi,
       teknisyenNo: rapor.teknisyenNo,
       durum: rapor.durum,
       baslangicTarihi: rapor.baslangicTarihi,
       bitisTarihi: rapor.bitisTarihi,
       personeller: rapor.personeller
     };
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    console.error("Teknisyen raporu oluşturulurken hata:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details on create:", error.response?.data);
    }
    throw new Error("Teknisyen raporu oluşturulurken bir hata oluştu.");
  }
};

// Teknisyen raporu güncelle - API'ye gönder
export const updateTeknisyenRaporu = async (id: string, rapor: Partial<TeknisyenRaporu>): Promise<TeknisyenRaporu> => {
   // Dinamik API_BASE_URL kullan
   const url = `${API_BASE_URL}/teknisyen-raporlar/${id}`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] PUT ${url}`); // Loglama eklendi
  try {
     // Güncellenecek veriyi dikkatlice oluştur
     const updateData: Partial<TeknisyenRaporu> = {};
     if (rapor.isinAdi !== undefined) updateData.isinAdi = rapor.isinAdi;
     if (rapor.teknisyenNo !== undefined) updateData.teknisyenNo = rapor.teknisyenNo;
     if (rapor.durum !== undefined) updateData.durum = rapor.durum;
     if (rapor.baslangicTarihi !== undefined) updateData.baslangicTarihi = rapor.baslangicTarihi;
     // bitisTarihi için null gönderilebilmeli
     if (rapor.hasOwnProperty('bitisTarihi')) updateData.bitisTarihi = rapor.bitisTarihi;
     if (rapor.personeller !== undefined) updateData.personeller = rapor.personeller;

    const response = await axios.put(url, updateData);
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
   const url = `${API_BASE_URL}/teknisyen-raporlar/${id}`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] DELETE ${url}`); // Loglama eklendi
  try {
    await axios.delete(url);
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
   const url = `${API_BASE_URL}/teknisyen-raporlar/personeller/listele`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] GET ${url}`); // Loglama eklendi
  try {
    const response = await axios.get(url);
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
  aciklama: string
): Promise<TeknisyenDokuman> => {
   // Dinamik API_BASE_URL kullan
  const url = `${API_BASE_URL}/teknisyen-raporlar/dokuman/yukle`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] POST (fetch) ${url}`); // Loglama eklendi
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('raporId', raporId);
    formData.append('aciklama', aciklama);

    const response = await fetch(url, { // fetch ile dinamik URL kullan
      method: 'POST',
      body: formData,
       // Gerekirse header ekle (örn: authentication)
    });

    if (!response.ok) {
       // Hata detayını response body'den almaya çalış
       let errorBody = 'Yükleme hatası detayı alınamadı.';
       try {
           errorBody = await response.text();
       } catch (e) { /* ignore */ }
       console.error(`Doküman yükleme başarısız (${response.status}): ${errorBody}`);
      throw new Error(`Doküman yükleme işlemi başarısız oldu (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
     // fetch hatalarını (network vb.) ve yukarıda fırlatılan hataları yakala
    console.error("Doküman yüklenirken hata:", error);
     // Eğer zaten spesifik bir hata fırlatılmışsa, tekrar genel hata fırlatma
     if (error instanceof Error && error.message.startsWith('Doküman yükleme işlemi başarısız oldu')) {
         throw error;
     }
    throw new Error("Doküman yüklenirken bir hata oluştu.");
  }
};

// Teknisyen dokümanını sil - fetch kullanıyor, aynı mantığı uygula
export const deleteTeknisyenDokuman = async (dokumentId: string): Promise<void> => {
   // Dinamik API_BASE_URL kullan
  const url = `${API_BASE_URL}/teknisyen-raporlar/dokuman/${dokumentId}`;
   console.log(`[${IS_SERVER ? 'SERVER' : 'CLIENT'}] DELETE (fetch) ${url}`); // Loglama eklendi
  try {
    const response = await fetch(url, { // fetch ile dinamik URL kullan
      method: 'DELETE',
       // Gerekirse header ekle
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