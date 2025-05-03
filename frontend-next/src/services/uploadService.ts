import axios from 'axios';

// API_BASE_URL sabitini tanımla
const API_BASE_URL = 'http://localhost:5001';

/**
 * Dosya yükleme servisi
 * Bu servis dosya yükleme işlemlerini gerçekleştirir
 */

/**
 * Dosyayı sunucuya yükler
 * @param file - Yüklenecek dosya
 * @param onProgress - İlerleme durumunu takip etmek için callback
 * @returns Yüklenen dosyanın bilgileri
 */
export const uploadFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ 
  fileUrl: string; 
  originalName: string; 
  size: number; 
  mimeType: string; 
  userId?: string;
}> => {
  try {
    // Form verisi oluştur
    const formData = new FormData();
    formData.append('file', file);
    
    // Token'ı al
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`[Upload Service] Dosya yükleniyor: ${file.name} (${file.size} bytes)`);
    
    // Progress takibi için config oluştur
    const config = {
      headers,
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`[Upload Service] Yükleme ilerlemesi: %${progress}`);
          onProgress(progress);
        }
      }
    };
    
    // Dosyayı yükle
    const response = await axios.post(`${API_BASE_URL}/api/uploads`, formData, config);
    
    console.log(`[Upload Service] Dosya başarıyla yüklendi. Yanıt:`, response.data);
    
    // Eski format kontrolü
    if (response.data && response.data.fileUrl) {
      return response.data;
    }
    
    // Yeni format (success, data nesnesi)
    if (response.data && response.data.success === true && response.data.data) {
      return response.data.data;
    }
    
    console.error('[Upload Service] API beklenmeyen formatta yanıt döndü:', response.data);
    throw new Error('Dosya yüklendi ancak API beklenmeyen bir yanıt döndü');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // API hata mesajı var mı kontrol et
      if (error.response?.data?.error) {
        console.error(`[Upload Service] Yükleme hatası: ${error.response.data.error}`);
        throw new Error(`Dosya yüklenirken hata: ${error.response.data.error}`);
      } else if (error.response?.status === 413) {
        console.error('[Upload Service] Dosya boyutu çok büyük');
        throw new Error('Dosya boyutu çok büyük. Maksimum dosya boyutu 10MB\'dır.');
      } else if (error.response?.status === 401) {
        console.error('[Upload Service] Yetkilendirme hatası. Oturum süresi dolmuş olabilir.');
        throw new Error('Oturum hatası: Lütfen tekrar giriş yapın');
      }
      
      console.error('[Upload Service] Dosya yüklenirken hata:', error.response?.data || error.message);
      throw new Error('Dosya yüklenirken bir hata oluştu');
    } else {
      console.error('[Upload Service] Dosya yüklerken bilinmeyen hata:', error);
      throw new Error('Dosya yüklenirken bilinmeyen bir hata oluştu');
    }
  }
};

/**
 * Belirli bir kategoriye dosya yükler
 * @param file - Yüklenecek dosya
 * @param category - Dosya kategorisi
 * @param onProgress - İlerleme durumunu takip etmek için callback 
 * @returns Yüklenen dosyanın bilgileri
 */
export const uploadFileWithCategory = async (
  file: File,
  category: string,
  onProgress?: (progress: number) => void
): Promise<{ 
  fileUrl: string; 
  fileName: string; 
  originalName: string; 
  mimeType: string; 
  size: number 
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Dosya yüklenirken hata oluştu:', error.response?.data || error.message);
    } else {
      console.error('Dosya yüklenirken hata oluştu:', error);
    }
    throw new Error('Dosya yüklenirken hata oluştu');
  }
}; 