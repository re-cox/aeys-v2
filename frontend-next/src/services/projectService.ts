import { AxiosError } from 'axios';
import { Project } from '@/types/project';
import { api } from '@/lib/api'; // api nesnesini import et

// const API_URL = '/api'; // Eski URL
const TIMEOUT = 30000; // Timeout hala kullanılabilir, ancak apiClient bunu zaten yönetiyor olabilir.

/**
 * Tüm projeleri getirir
 */
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    console.log('[projectService] Fetching all projects using apiClient...');
    // axios.get yerine apiClient.projects.getAll() kullan
    const response = await api.projects.getAll(); 
    
    // Başarılı yanıt işleme (api.ts zaten data.data veya data döndürecek şekilde ayarlı olmalı)
    // Bu kısım api.ts'deki dönüş formatına göre basitleştirilebilir.
    if (response && Array.isArray(response)) { // Eğer doğrudan dizi dönüyorsa
      console.log(`[projectService] Fetched ${response.length} projects`);
      return response;
    }
    // Eğer { success: true, data: [] } formatında dönüyorsa (api.ts genelde böyle döner)
    if (response && typeof response === 'object' && response.hasOwnProperty('data') && Array.isArray(response.data)) {
        console.log(`[projectService] Fetched ${response.data.length} projects`);
        return response.data;
    }
    
    console.error('[projectService] API proje dizisi döndürmedi:', response);
    throw new Error('API proje dizisi döndürmedi');
  } catch (error) {
    // AxiosError kontrolü apiClient tarafından yönetiliyor olabilir, ama yine de loglama için tutabiliriz.
    if (error instanceof Error && (error as any).isAxiosError) {
      const axiosError = error as AxiosError;
      console.error('[projectService] Proje veri hatası (Axios):', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      });
    } else {
      console.error('[projectService] Proje veri hatası:', error);
    }
    
    // api.ts içindeki hata yönetimi burayı gereksiz kılabilir.
    // Hata mesajını doğrudan error.message'dan almak daha iyi olabilir.
    throw new Error( (error as Error).message || 'Proje verileri alınamadı');
  }
}; 