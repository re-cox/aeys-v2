import axios from 'axios';
import { Folder, FolderFormData, FolderContentsResponse } from '@/types/folder';

// Direkt sabit URL kullan - API path'i doğru şekilde ayarla
const API_BASE_URL = 'http://localhost:5001';
console.log('[Folder Service] API_BASE_URL:', API_BASE_URL);

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - her istekte token ekle ve log'la
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[Folder Service] Token ile istek: ${config.url}`);
      } else {
        console.warn(`[Folder Service] UYARI: Token yok! İstek: ${config.url}`);
      }
    } catch (error) {
      console.error('[Folder Service] Token eklenirken hata:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API cevaplarını loglama
api.interceptors.response.use(
  (response) => {
    console.log(`[Folder Service] Başarılı yanıt: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[Folder Service] Hata: ${error.message}`, error.config?.url);
    if (error.response?.status === 401) {
      console.error('[Folder Service] 401 hatası: Token geçersiz veya eksik');
      // Tarayıcı konsolunda token göster
      console.log('[Folder Service] Token:', localStorage.getItem('token'));
    }
    return Promise.reject(error);
  }
);

/**
 * Tüm klasörleri getir
 * @param parentId Optional parentId filter
 */
export async function getAllFolders(parentId?: string): Promise<Folder[]> {
  try {
    const params = new URLSearchParams();
    if (parentId) {
      params.append('parentId', parentId);
    }
    
    console.log(`[Folder Service] Klasörler alınıyor: ${API_BASE_URL}/api/folders${params.toString() ? `?${params.toString()}` : ''}`);
    
    const response = await api.get(`/api/folders${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Klasörler alınırken hata oluştu:', error);
    throw error;
  }
}

/**
 * Kök klasörün içeriğini getir (root)
 */
export async function getRootContents(): Promise<FolderContentsResponse> {
  try {
    console.log(`[Folder Service] Kök klasör içeriği alınıyor: ${API_BASE_URL}/api/folders/root/contents`);
    const response = await api.get('/api/folders/root/contents');
    return response.data;
  } catch (error) {
    console.error('Kök klasör içeriği alınırken hata oluştu:', error);
    throw error;
  }
}

/**
 * Belirli bir klasörün içeriğini getir
 * @param id Klasör ID'si
 */
export async function getFolderContents(id: string): Promise<FolderContentsResponse> {
  try {
    console.log(`[Folder Service] Klasör içeriği alınıyor: ${API_BASE_URL}/api/folders/${id}/contents`);
    const response = await api.get(`/api/folders/${id}/contents`);
    return response.data;
  } catch (error) {
    console.error(`Klasör içeriği alınırken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Belirli bir klasörün detaylarını getir
 * @param id Klasör ID'si
 */
export async function getFolderById(id: string): Promise<Folder> {
  try {
    const response = await api.get(`/api/folders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Klasör bilgileri alınırken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Yeni klasör oluştur
 * @param data Klasör verileri
 */
export async function createFolder(data: FolderFormData): Promise<Folder> {
  try {
    const response = await api.post('/api/folders', data);
    return response.data;
  } catch (error) {
    console.error('Klasör oluşturulurken hata oluştu:', error);
    throw error;
  }
}

/**
 * Klasörü güncelle
 * @param id Klasör ID'si
 * @param data Güncellenecek veriler
 */
export async function updateFolder(id: string, data: Partial<FolderFormData>): Promise<Folder> {
  try {
    const response = await api.put(`/api/folders/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Klasör güncellenirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Klasörü sil
 * @param id Klasör ID'si
 */
export async function deleteFolder(id: string): Promise<void> {
  try {
    await api.delete(`/api/folders/${id}`);
  } catch (error) {
    console.error(`Klasör silinirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
} 