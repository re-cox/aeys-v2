import { 
    Proposal, 
    ProposalItem, 
    ProposalStatus, 
    NewProposalData, 
    UpdateProposalData 
} from '@/types/proposal';
// import { Currency } from '@prisma/client'; // Doğrudan kullanılmıyor
import { mapResponseToProposal, mapResponseToProposalItem } from "@/utils/mappers";

// API URL'sini backend'e yönlendir
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api'}/proposals`;

/**
 * Tüm teklifleri API'den getirir.
 * @returns Proposal[] türünde teklif dizisi (hesaplanmış toplamlarla)
 */
export const getAllProposals = async (
  page = 1,
  limit = 10,
  search = "",
  customerId = "",
  status = ""
): Promise<{ proposals: Proposal[], totalCount: number }> => { // Geri dönüş tipi güncellendi
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (customerId) params.append("customerId", customerId);
    if (status) params.append("status", status);

    console.log(`Fetching proposals from: ${API_BASE_URL}?${params.toString()}`);

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.text(); // Hata detayını almayı dene
      console.error("API Error Response:", errorData);
      throw new Error(`Teklifler getirilirken bir hata oluştu: ${response.statusText}`);
    }

    const data = await response.json();

    // API'den gelen verinin yapısını kontrol et
    if (!data || !Array.isArray(data.proposals)) {
        console.error("Beklenmeyen API yanıtı yapısı:", data);
        throw new Error("API'den geçersiz veri formatı alındı.");
    }

    // Gelen veriyi map et ve toplam sayıyı döndür
    return {
        proposals: data.proposals.map(mapResponseToProposal),
        totalCount: data.totalCount || 0 // API'nin toplam sayıyı döndürdüğünü varsayıyoruz
    };

  } catch (error: any) {
    console.error("Teklifleri getirme hatası:", error.message);
    // Hatanın kendisini tekrar fırlatmak yerine, boş bir dizi ve 0 döndürebiliriz veya hatayı yönetebiliriz
    // throw error; // Veya daha kullanıcı dostu bir hata yönetimi yap
     return { proposals: [], totalCount: 0 }; // Hata durumunda boş sonuç
  }
};

/**
 * Belirli bir teklifi ID ile getirir.
 * @param proposalId Getirilecek teklifin ID'si
 * @returns Proposal nesnesi (hesaplanmış toplamlarla) veya null
 */
export const getProposalById = async (id: string): Promise<Proposal | null> => { // Null dönebilir
  try {
     console.log(`Fetching proposal by ID: ${id} from: ${API_BASE_URL}/${id}`);
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
       if (response.status === 404) {
           console.warn(`Teklif bulunamadı: ${id}`);
           return null; // 404 durumunda null dön
       }
      const errorData = await response.text();
      console.error("API Error Response:", errorData);
      throw new Error(`Teklif detayı getirilirken bir hata oluştu: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data) {
        console.error(`API'den ${id} ID'li teklif için boş yanıt alındı.`);
        return null;
    }
    return mapResponseToProposal(data);

  } catch (error: any) {
    console.error(`Teklif detayı getirme hatası (ID: ${id}):`, error.message);
    // throw error; // Veya null dön
    return null; // Hata durumunda null dön
  }
};

/**
 * Yeni bir teklif oluşturur.
 * @param proposalData Yeni teklifin verileri (NewProposalData)
 * @returns Oluşturulan teklif (Proposal, hesaplanmış toplamlarla)
 */
export const createProposal = async (proposalData: NewProposalData): Promise<Proposal> => {
  try {
    console.log("Creating proposal:", proposalData);
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(proposalData), // Gönderilen veri NewProposalData tipinde olmalı
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text()); // JSON veya text olarak hata detayını al
      console.error("API Error Response:", errorData);
      throw new Error(`Teklif oluşturulurken bir hata oluştu: ${response.statusText}. Detay: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Proposal created successfully:", data);
    return mapResponseToProposal(data); // API yanıtını map et
  } catch (error: any) {
    console.error("Teklif oluşturma hatası:", error.message);
    throw error; // Hatanın yukarıya bildirilmesi için tekrar fırlat
  }
};

/**
 * Mevcut bir teklifi günceller.
 * @param proposalId Güncellenecek teklifin ID'si
 * @param proposalData Güncelleme verileri (UpdateProposalData)
 * @returns Güncellenen teklif (Proposal, hesaplanmış toplamlarla)
 */
export const updateProposal = async (id: string, proposalData: UpdateProposalData): Promise<Proposal> => {
  try {
     console.log(`Updating proposal ID: ${id}`, proposalData);
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(proposalData), // Gönderilen veri UpdateProposalData tipinde olmalı
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      console.error("API Error Response:", errorData);
      throw new Error(`Teklif güncellenirken bir hata oluştu: ${response.statusText}. Detay: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
     console.log("Proposal updated successfully:", data);
    return mapResponseToProposal(data); // API yanıtını map et
  } catch (error: any) {
    console.error(`Teklif güncelleme hatası (ID: ${id}):`, error.message);
    throw error; // Hatanın yukarıya bildirilmesi için tekrar fırlat
  }
};

/**
 * Bir teklifi siler.
 * @param proposalId Silinecek teklifin ID'si
 */
export const deleteProposal = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting proposal ID: ${id}`);
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
       const errorData = await response.text();
      console.error("API Error Response:", errorData);
      throw new Error(`Teklif silinirken bir hata oluştu: ${response.statusText}`);
    }
    console.log(`Proposal deleted successfully: ${id}`);
  } catch (error: any) {
    console.error(`Teklif silme hatası (ID: ${id}):`, error.message);
    throw error;
  }
};

// Header fonksiyonu - auth token için
function getHeaders(): HeadersInit { // Geri dönüş tipi HeadersInit olarak güncellendi
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json", // Accept header eklendi
  };

  // Tarayıcıda çalışıyorsa token'ı ekle
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn("Local storage'da token bulunamadı.");
    }
  }

  return headers;
}

// Opsiyonel: Servis fonksiyonlarını bir nesne olarak dışa aktar
const proposalService = {
    getAllProposals,
    getProposalById,
    createProposal,
    updateProposal,
    deleteProposal,
};

export default proposalService; // Varsayılan olarak nesneyi dışa aktar 