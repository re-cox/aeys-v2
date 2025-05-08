// console.error("!!! API.TS DOSYASI KESİNLİKLE BU OLMALI - YENİ YOL /test-raporlar !!!"); // Daha dikkat çekici log
console.log('[API Service] API dosyası yüklendi, test-raporlar yolu kullanılıyor');
// console.log('>>>> DEBUG: api.ts MODIFIED AND LOADED - Path should be /test-raporlar <<<<');
import axios, { AxiosError } from 'axios';
import { TeknisyenRaporu, TeknisyenRaporuDurum, Personel, TeknisyenDokuman } from '@/types/teknisyen';
import { toast } from "sonner";

// API_URL yapısını düzenliyoruz
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
console.log('API_URL değeri:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const handleApiError = (error: unknown, context: string): void => {
    console.error(`API Hatası (${context}):`, error);
    let errorMessage = `İşlem sırasında bir hata oluştu (${context}).`;
    if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<{ message?: string }>;
        if (serverError.response?.data?.message) {
            errorMessage = serverError.response.data.message;
        } else if (serverError.message) {
             errorMessage = serverError.message;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
};

// Add a request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] İstek: ${config.method?.toUpperCase()} ${config.url}`, config.data ? 'veri var' : 'veri yok');
    
    // Log request data for debugging (don't log passwords in production)
    if (process.env.NODE_ENV === 'development' && config.data) {
      if (config.url?.includes('login')) {
        // Don't log password
        const { password, ...safeData } = config.data;
        console.log('[API] İstek verisi:', { ...safeData, password: '******' });
      } else {
        console.log('[API] İstek verisi:', config.data);
      }
    }
    
    // LocalStorage'dan token al ve isteğe ekle
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log('[API] Token otomatik olarak eklendi');
      } else {
        // console.log('[API] Token bulunamadı, istekte yetkilendirme yok');
      }
    } catch (tokenError) {
      console.warn('[API] Token erişim hatası:', tokenError);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] İstek hatası:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    // console.log(`[API] Yanıt: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Add detailed logging for debugging API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('[API] Hata Yanıtı:', {
        status: error.response.status,
        headers: error.response.headers,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        // Unauthorized - token might be expired
        console.warn('[API] 401 Yetkisiz erişim - oturum sonlandırılıyor');
        
        // Oturum bilgilerini temizle, ancak aynı sayfa üzerinde kalırsa sonsuz döngü olmasın
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath === '/login' || currentPath === '/auth/login';
        
        if (!isLoginPage) {
          // Önce temizle
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Sonra yönlendir - bu sıra önemli
          console.log('[API] Kullanıcı giriş sayfasına yönlendiriliyor');
          window.location.href = '/login';
        } else {
          console.log('[API] Kullanıcı zaten giriş sayfasında, yönlendirme atlanıyor');
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] İstek Hatası (yanıt alınamadı):', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API] İstek Kurulum Hatası:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// --- Teknisyen Raporları API Fonksiyonları ---

/**
 * Teknisyen raporlarını getirir. Duruma göre filtreleme yapılabilir.
 */
export const getTeknisyenRaporlari = async (durum?: TeknisyenRaporuDurum): Promise<TeknisyenRaporu[]> => {
  const context = 'Raporlar Getirilirken';
  try {
    console.log(`API Çağrısı: getTeknisyenRaporlari (durum: ${durum})`);
    const params = durum ? { durum } : {};
    const response = await apiClient.get('/test-raporlar', { params });
    // TODO: API'den dönen tarih string'lerini Date nesnesine çevir (gerekirse)
    return response.data as TeknisyenRaporu[];

    // Simülasyon kaldırıldı

  } catch (error) {
    handleApiError(error, context);
    return [];
  }
};

/**
 * Belirli bir ID'ye sahip teknisyen raporunu getirir.
 */
export const getTeknisyenRaporu = async (id: string): Promise<TeknisyenRaporu | null> => {
    const context = `Rapor Getirilirken (ID: ${id})`;
    try {
        console.log(`API Çağrısı: getTeknisyenRaporu (id: ${id})`);
        const response = await apiClient.get(`/teknisyen-raporlari/${id}`);
        // TODO: API'den dönen tarih string'lerini Date nesnesine çevir (gerekirse)
        return response.data as TeknisyenRaporu;

        // Simülasyon kaldırıldı

    } catch (error) {
         if (axios.isAxiosError(error) && error.response?.status === 404) {
             console.warn(`Rapor bulunamadı (ID: ${id})`);
             toast.warning("İstenen rapor bulunamadı.");
             return null;
         }
        handleApiError(error, context);
        return null;
    }
};

/**
 * Yeni bir teknisyen raporu oluşturur.
 */
export const createTeknisyenRaporu = async (raporData: Omit<TeknisyenRaporu, 'id' | 'createdAt' | 'updatedAt' | 'dokumanlar'>): Promise<TeknisyenRaporu | null> => {
  const context = "Rapor Oluşturulurken";
  try {
    console.log("API Çağrısı: createTeknisyenRaporu");
    // FormData yerine JSON gönderilecekse Content-Type değiştirilmeli
    const response = await apiClient.post('/teknisyen-raporlari', raporData, {
      // headers: { 'Content-Type': 'multipart/form-data' } // Eğer dosya yükleme varsa
    });
    toast.success("Teknisyen raporu başarıyla oluşturuldu!");
    return response.data as TeknisyenRaporu;

    // Simülasyon kaldırıldı

  } catch (error) {
    handleApiError(error, context);
    return null;
  }
};

/**
 * Mevcut bir teknisyen raporunu günceller.
 */
export const updateTeknisyenRaporu = async (id: string, raporData: Partial<Omit<TeknisyenRaporu, 'id' | 'createdAt' | 'updatedAt' | 'dokumanlar'>>): Promise<TeknisyenRaporu | null> => {
    const context = `Rapor Güncellenirken (ID: ${id})`;
    try {
        console.log(`API Çağrısı: updateTeknisyenRaporu (id: ${id})`);
        // FormData yerine JSON gönderilecekse Content-Type değiştirilmeli
        const response = await apiClient.put(`/teknisyen-raporlari/${id}`, raporData, {
            // headers: { 'Content-Type': 'multipart/form-data' } // Eğer dosya yükleme varsa
        });
        toast.success("Teknisyen raporu başarıyla güncellendi!");
        return response.data as TeknisyenRaporu;

       // Simülasyon kaldırıldı

    } catch (error) {
         if (axios.isAxiosError(error) && error.response?.status === 404) {
             console.warn(`Rapor bulunamadı (ID: ${id})`);
             toast.warning("Güncellenecek rapor bulunamadı.");
             return null;
         }
        handleApiError(error, context);
        return null;
    }
};

/**
 * Bir teknisyen raporunu siler.
 */
export const deleteTeknisyenRaporu = async (id: string): Promise<boolean> => {
    const context = `Rapor Silinirken (ID: ${id})`;
    try {
        console.log(`API Çağrısı: deleteTeknisyenRaporu (id: ${id})`);
        await apiClient.delete(`/teknisyen-raporlari/${id}`);
        toast.success("Rapor başarıyla silindi.");
        return true;

        // Simülasyon kaldırıldı

    } catch (error) {
        handleApiError(error, context);
        return false;
    }
};

/**
 * Belirli bir teknisyen raporuna ait dökümanları getirir.
 */
export const getTeknisyenDokumanlar = async (raporId: string): Promise<TeknisyenDokuman[]> => {
    const context = `Dökümanlar Getirilirken (Rapor ID: ${raporId})`;
    try {
        console.log(`API Çağrısı: getTeknisyenDokumanlar (raporId: ${raporId})`);
        const response = await apiClient.get(`/teknisyen-raporlari/${raporId}/dokumanlar`);
         // TODO: API'den dönen tarih string'lerini Date nesnesine çevir (gerekirse)
        return response.data as TeknisyenDokuman[];

        // Simülasyon kaldırıldı

    } catch (error) {
        handleApiError(error, context);
        return [];
    }
};

/**
 * Bir teknisyen raporuna döküman ekler (Örnek - Gerçek endpoint backend'de tanımlanmalı)
 */
export const addTeknisyenDokuman = async (raporId: string, dokumanData: FormData): Promise<TeknisyenDokuman | null> => {
    const context = `Döküman Eklenirken (Rapor ID: ${raporId})`;
    try {
        console.log(`API Çağrısı: addTeknisyenDokuman (raporId: ${raporId})`);
        const response = await apiClient.post(`/teknisyen-raporlari/${raporId}/dokumanlar`, dokumanData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        toast.success("Döküman başarıyla eklendi.");
        return response.data as TeknisyenDokuman;
    } catch (error) {
        handleApiError(error, context);
        return null;
    }
};

/**
 * Bir teknisyen raporundan belirli bir dökümanı siler.
 */
export const deleteTeknisyenDokuman = async (raporId: string, dokumanId: string): Promise<boolean> => {
    const context = `Döküman Silinirken (Rapor ID: ${raporId}, Döküman ID: ${dokumanId})`;
    try {
        console.log(`API Çağrısı: deleteTeknisyenDokuman (raporId: ${raporId}, dokumanId: ${dokumanId})`);
        await apiClient.delete(`/teknisyen-raporlari/${raporId}/dokumanlar/${dokumanId}`);
        toast.success("Döküman başarıyla silindi.");
        return true;

        // Simülasyon kaldırıldı

    } catch (error) {
        handleApiError(error, context);
        return false;
    }
};

/**
 * Personelleri (User) getirir.
 */
export const getPersoneller = async (): Promise<Personel[]> => {
    const context = "Personeller Getirilirken";
    try {
        console.log("API Çağrısı: getPersoneller (Users)");
        // Sadece gerekli alanları seçmek için query param ekle (backend destekliyorsa)
        const response = await apiClient.get('/users?select=id,name,surname,email');
        // API'den dönen User[] verisini Personel[] tipine map et (gerekirse)
        return response.data as Personel[]; 

       // Simülasyon kaldırıldı

    } catch (error) {
        handleApiError(error, context);
        return [];
    }
}; 