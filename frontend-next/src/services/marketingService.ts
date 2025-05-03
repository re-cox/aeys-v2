import { MarketingActivity, NewMarketingActivityData, UpdateMarketingActivityData, MarketingActivityQueryParams } from '@/types/marketing';
import { apiClient, handleApiError } from './api';

const API_ENDPOINT = 'marketing-activities';

// Tüm pazarlama aktivitelerini getir
export async function getAllActivities(params?: MarketingActivityQueryParams): Promise<MarketingActivity[]> {
  const context = "Pazarlama Aktiviteleri Getirilirken";
  try {
    console.log('[MarketingService] Tüm aktiviteler isteniyor...');
    
    // URL parametrelerini oluştur
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.type) queryParams.type = params.type;
      if (params.status) queryParams.status = params.status;
      if (params.employeeId) queryParams.employeeId = params.employeeId;
      if (params.customerId) queryParams.customerId = params.customerId;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.searchQuery) queryParams.search = params.searchQuery;
    }
    
    const response = await apiClient.get<MarketingActivity[]>(API_ENDPOINT, { params: queryParams });
    console.log(`[MarketingService] ${response.data.length} aktivite başarıyla alındı.`);
    return response.data;
  } catch (error) {
    handleApiError(error, context);
    throw new Error(`Pazarlama aktiviteleri yüklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

// ID'ye göre aktivite getir
export async function getActivityById(id: string): Promise<MarketingActivity> {
  const context = `Aktivite Detayı Getirilirken (ID: ${id})`;
  try {
    console.log(`[MarketingService] ID: ${id} olan aktivite isteniyor...`);
    const response = await apiClient.get<MarketingActivity>(`${API_ENDPOINT}/${id}`);
    console.log(`[MarketingService] ID: ${id} olan aktivite başarıyla alındı.`);
    return response.data;
  } catch (error) {
    handleApiError(error, context);
    throw new Error(`Aktivite yüklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

// Yeni aktivite oluştur
export async function createActivity(data: NewMarketingActivityData): Promise<MarketingActivity> {
  const context = "Yeni Aktivite Oluşturulurken";
  try {
    console.log('[MarketingService] Yeni aktivite oluşturuluyor...', JSON.stringify(data, null, 2));
    
    // Enum değerlerini string'e dönüştür (backend'in beklediği format)
    const payload = {
      ...data,
      type: data.type.toString(),
      status: data.status?.toString() || 'PLANNED'
    };
    
    const response = await apiClient.post<MarketingActivity>(API_ENDPOINT, payload);
    console.log(`[MarketingService] Yeni aktivite başarıyla oluşturuldu, ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, context);
    console.error('[MarketingService] API yanıtı:', error);
    throw new Error(`Aktivite oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

// Aktivite güncelle
export async function updateActivity(data: UpdateMarketingActivityData): Promise<MarketingActivity> {
  const context = `Aktivite Güncellenirken (ID: ${data.id})`;
  try {
    console.log(`[MarketingService] ID: ${data.id} olan aktivite güncelleniyor...`);
    
    // Enum değerlerini string'e dönüştür (backend'in beklediği format)
    const payload = {
      ...data,
      type: data.type?.toString(),
      status: data.status?.toString()
    };
    
    const response = await apiClient.put<MarketingActivity>(`${API_ENDPOINT}/${data.id}`, payload);
    console.log(`[MarketingService] ID: ${data.id} olan aktivite başarıyla güncellendi.`);
    return response.data;
  } catch (error) {
    handleApiError(error, context);
    throw new Error(`Aktivite güncellenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

// Aktivite sil
export async function deleteActivity(id: string): Promise<void> {
  const context = `Aktivite Silinirken (ID: ${id})`;
  try {
    console.log(`[MarketingService] ID: ${id} olan aktivite siliniyor...`);
    await apiClient.delete(`${API_ENDPOINT}/${id}`);
    console.log(`[MarketingService] ID: ${id} olan aktivite başarıyla silindi.`);
  } catch (error) {
    handleApiError(error, context);
    throw new Error(`Aktivite silinirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
} 