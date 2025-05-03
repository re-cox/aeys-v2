import axios from 'axios';

// Types for AdditionalWork
export interface AdditionalWorkEmployee {
  id: string;
  name: string;
  surname: string;
  department?: {
    id: string;
    name: string;
  };
}

export type AdditionalWorkPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AdditionalWorkStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AdditionalWork {
  id: string;
  title: string;
  description?: string;
  priority: AdditionalWorkPriority;
  status: AdditionalWorkStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    surname: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    surname: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface AdditionalWorkFormData {
  title: string;
  description?: string;
  priority: AdditionalWorkPriority;
  status: AdditionalWorkStatus;
  startDate: string;
  endDate?: string;
  assignedToId: string;
}

export interface AdditionalWorkFilters {
  status?: AdditionalWorkStatus;
  priority?: AdditionalWorkPriority;
  assignedToId?: string;
  query?: string;
}

/**
 * Fetch all additional work items, optionally filtered
 */
export const getAllAdditionalWorks = async (
  filters?: { status?: string; priority?: string; assignedToId?: string }
): Promise<AdditionalWork[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    
    const url = `/api/additional-works${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get(url);
    
    // Handle response format
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    console.error('API returned unexpected format:', response.data);
    throw new Error('API unexpected response format');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Ek işler yüklenirken hata oluştu:', error.response?.data || error.message);
    } else {
      console.error('Ek işler yüklenirken hata oluştu:', error);
    }
    // Hata fırlatmak yerine boş dizi döndür
    console.error('Returning empty array due to fetch error.');
    return [];
  }
};

/**
 * Get a single additional work by ID
 */
export const getAdditionalWorkById = async (id: string): Promise<AdditionalWork> => {
  try {
    const response = await axios.get(`/api/additional-works/${id}`);
    
    console.log(`ID ${id} için API yanıtı:`, response.data);
    
    if (response.data && response.data.success === true && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // Doğrudan veri döndürülmüş olabilir
      return response.data;
    }
    
    console.error('API returned unexpected format:', response.data);
    throw new Error('API unexpected response format');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Ek iş bulunamadı');
      }
      console.error(`Ek iş verisi alınamadı (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Ek iş verisi alınamadı (ID: ${id}):`, error);
    }
    throw new Error('Ek iş verisi alınamadı');
  }
};

/**
 * Create a new additional work
 */
export const createAdditionalWork = async (data: AdditionalWorkFormData): Promise<AdditionalWork> => {
  try {
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    console.log('token', token);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (!token) {
      console.error('Token bulunamadı - Lütfen önce giriş yapın');
      throw new Error('Oturum bulunamadı: Lütfen tekrar giriş yapın');
    }
    
    headers['Authorization'] = `Bearer ${token}`;
    
    // Veriyi API'nin beklediği formata dönüştür
    const apiData = {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate || null,
      assignedToId: data.assignedToId
    };
    
    console.log('API\'ye gönderilen veri:', apiData);
    
    const response = await axios.post('/api/additional-works', apiData, {
      headers,
    });
    
    console.log('API yanıtı:', response.data);
    
    if (response.data && response.data.success === true && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // Doğrudan veri döndürülmüş olabilir
      return response.data;
    }
    
    console.error('API returned unexpected format:', response.data);
    throw new Error('API unexpected response format');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 401 errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Oturum hatası: Lütfen tekrar giriş yapın');
      }
      
      if (error.response?.data?.success === false) {
        const errorMsg = error.response.data.error || 
                        error.response.data.message || 
                        'Ek iş oluşturulurken bir hata oluştu';
        console.error(`Ek iş oluşturma hatası: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      console.error('Ek iş oluşturulurken hata oluştu:', error.response?.data || error.message);
    } else {
      console.error('Ek iş oluşturulurken hata oluştu:', error);
    }
    throw new Error('Ek iş oluşturulurken hata oluştu');
  }
};

/**
 * Update an existing additional work
 */
export const updateAdditionalWork = async (id: string, data: Partial<AdditionalWorkFormData>): Promise<AdditionalWork> => {
  try {
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (!token) {
      console.error('Token bulunamadı - Lütfen önce giriş yapın');
      throw new Error('Oturum bulunamadı: Lütfen tekrar giriş yapın');
    }
    
    headers['Authorization'] = `Bearer ${token}`;
    
    // Veriyi API'nin beklediği formata dönüştür
    const apiData: any = {};
    
    // Sadece tanımlanmış alanları kopyala
    if (data.title !== undefined) apiData.title = data.title;
    if (data.description !== undefined) apiData.description = data.description || null;
    if (data.status !== undefined) apiData.status = data.status;
    if (data.priority !== undefined) apiData.priority = data.priority;
    if (data.startDate !== undefined) apiData.startDate = data.startDate;
    if (data.endDate !== undefined) apiData.endDate = data.endDate || null;
    if (data.assignedToId !== undefined) apiData.assignedToId = data.assignedToId;
    
    console.log(`Güncelleme (ID: ${id}) için API'ye gönderilen veri:`, apiData);
    
    const response = await axios.patch(`/api/additional-works/${id}`, apiData, {
      headers,
    });
    
    console.log(`ID ${id} için update API yanıtı:`, response.data);
    
    if (response.data && response.data.success === true && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // Doğrudan veri döndürülmüş olabilir
      return response.data;
    }
    
    console.error('API returned unexpected format:', response.data);
    throw new Error('API unexpected response format');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 401 errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Oturum hatası: Lütfen tekrar giriş yapın');
      }
      
      // Handle 404 errors
      if (error.response?.status === 404) {
        throw new Error('Güncellenecek ek iş bulunamadı');
      }
      
      if (error.response?.data?.success === false) {
        const errorMsg = error.response.data.error || 
                        error.response.data.message || 
                        'Ek iş güncellenirken bir hata oluştu';
        console.error(`Ek iş güncelleme hatası: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      console.error(`Ek iş güncellenirken hata oluştu (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Ek iş güncellenirken hata oluştu (ID: ${id}):`, error);
    }
    throw new Error('Ek iş güncellenirken hata oluştu');
  }
};

/**
 * Delete an additional work
 */
export const deleteAdditionalWork = async (id: string): Promise<void> => {
  try {
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (!token) {
      console.error('Token bulunamadı - Lütfen önce giriş yapın');
      throw new Error('Oturum bulunamadı: Lütfen tekrar giriş yapın');
    }
    
    headers['Authorization'] = `Bearer ${token}`;
    
    await axios.delete(`/api/additional-works/${id}`, {
      headers,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 401 errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Oturum hatası: Lütfen tekrar giriş yapın');
      }
      
      // Handle 404 errors
      if (error.response?.status === 404) {
        throw new Error('Silinecek ek iş bulunamadı');
      }
      
      console.error(`Ek iş silinirken hata oluştu (ID: ${id}):`, error.response?.data || error.message);
    } else {
      console.error(`Ek iş silinirken hata oluştu (ID: ${id}):`, error);
    }
    throw new Error('Ek iş silinirken hata oluştu');
  }
};

// Helper function to translate priority to Turkish
export function translatePriority(priority: AdditionalWorkPriority): string {
  const translations = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
    URGENT: 'Acil',
  };
  
  return translations[priority];
}

// Helper function to translate status to Turkish
export function translateStatus(status: AdditionalWorkStatus): string {
  const translations = {
    ASSIGNED: 'Atandı',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  };
  
  return translations[status];
} 