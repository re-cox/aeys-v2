import axios from 'axios';
import { Document, DocumentFormData, Folder, FolderFormData, UploadResponse } from '@/types/document';

// API_BASE_URL sabitini tanımla
const API_BASE_URL = 'http://localhost:5001';
console.log('[Document Service] API_BASE_URL:', API_BASE_URL);

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Tüm dokümanları getir
 * @param folderId Optional klasör filtresi
 * @param search Optional arama sorgusu
 */
export async function getAllDocuments(folderId?: string, search?: string): Promise<Document[]> {
  try {
    const params = new URLSearchParams();
    if (folderId) {
      params.append('folderId', folderId);
    }
    if (search) {
      params.append('search', search);
    }

    console.log(`[Document Service] Dokümanlar alınıyor: ${API_BASE_URL}/api/documents${params.toString() ? `?${params.toString()}` : ''}`);
    
    const response = await api.get(`/api/documents${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Dokümanlar alınırken hata oluştu:', error);
    throw error;
  }
}

/**
 * Belirli bir dokümanın detaylarını getir
 * @param id Doküman ID'si
 */
export async function getDocumentById(id: string): Promise<Document> {
  try {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Doküman bilgileri alınırken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Yeni doküman oluştur
 * @param data Doküman verileri
 */
export async function createDocument(data: DocumentFormData): Promise<Document> {
  try {
    const response = await api.post('/api/documents', data);
    return response.data;
  } catch (error) {
    console.error('Doküman oluşturulurken hata oluştu:', error);
    throw error;
  }
}

/**
 * Dokümanı güncelle
 * @param id Doküman ID'si
 * @param data Güncellenecek veriler
 */
export async function updateDocument(id: string, data: Partial<DocumentFormData>): Promise<Document> {
  try {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Doküman güncellenirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Dokümanı sil
 * @param id Doküman ID'si
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    await api.delete(`/api/documents/${id}`);
  } catch (error) {
    console.error(`Doküman silinirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Fetch all folders, optionally filtered by parent folder ID
 */
export const getAllFolders = async (parentId?: string): Promise<Folder[]> => {
  try {
    const params = new URLSearchParams();
    if (parentId) {
      params.append('parentId', parentId);
    }

    const url = `${API_BASE_URL}/api/folders${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);

    if (!Array.isArray(response.data)) {
      console.error('API did not return folders array:', response.data);
      throw new Error('API klasör dizisi döndürmedi');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Klasör verileri alınamadı:', error.response?.data || error.message);
    } else {
      console.error('Klasör verileri alınamadı:', error);
    }
    throw new Error('Klasör verileri alınamadı');
  }
};

/**
 * Get a folder by ID
 */
export const getFolderById = async (id: string): Promise<Folder> => {
  try {
    const response = await api.get(`/api/folders/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Klasör verileri alınamadı (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Klasör verileri alınamadı (ID: ${id}):`, error);
    }
    throw new Error('Klasör verileri alınamadı');
  }
};

/**
 * Create a new folder
 */
export const createFolder = async (data: FolderFormData): Promise<Folder> => {
  try {
    const response = await api.post('/api/folders', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Klasör oluşturulurken hata oluştu:', error.response?.data || error.message);
    } else {
      console.error('Klasör oluşturulurken hata oluştu:', error);
    }
    throw new Error('Klasör oluşturulurken hata oluştu');
  }
};

/**
 * Dokümanı indir
 * @param id Doküman ID'si
 * @param filename Dosya adı
 */
export async function downloadDocument(id: string, filename: string): Promise<void> {
  try {
    const response = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    });
    
    // Dosyayı indir
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error(`Doküman indirilirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Update an existing folder
 */
export const updateFolder = async (id: string, data: Partial<Folder>): Promise<Folder> => {
  try {
    const response = await api.patch(`/api/folders/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Klasör güncellenirken hata oluştu (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Klasör güncellenirken hata oluştu (ID: ${id}):`, error);
    }
    throw new Error('Klasör güncellenirken hata oluştu');
  }
};

/**
 * Delete a folder
 */
export const deleteFolder = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/folders/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Klasör silinirken hata oluştu (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Klasör silinirken hata oluştu (ID: ${id}):`, error);
    }
    throw new Error('Klasör silinirken hata oluştu');
  }
};

/**
 * Dosya yükle
 * @param file Yüklenecek dosya
 * @param onProgress İlerleme callback fonksiyonu (opsiyonel)
 */
export async function uploadFile(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Dosya yüklenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * Doküman yükle
 * @param formData Form verisi (dosya ve doküman bilgileri)
 */
export async function uploadDocument(formData: FormData): Promise<Document> {
  try {
    console.log('[Document Service] Doküman yükleme isteği yapılıyor:', `${API_BASE_URL}/api/documents/upload`);
    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('[Document Service] Doküman yükleme başarılı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Doküman yüklenirken hata oluştu:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Hata detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    throw error;
  }
}

export default {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getAllFolders,
  getFolderById,
  createFolder,
  downloadDocument,
  updateFolder,
  deleteFolder,
  uploadFile,
  uploadDocument,
}; 