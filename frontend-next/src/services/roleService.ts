import { apiClient, handleApiError } from './api';

// Rol verisi için tip tanımı (Merkezi bir types/role.ts dosyasına taşınabilir)
export interface Role {
  id: string;
  name: string;
}

/**
 * Backend'den tüm rolleri getirir.
 * @returns {Promise<Role[]>} Rol listesi veya hata durumunda boş dizi.
 */
export const getAllRoles = async (): Promise<Role[]> => {
  const context = "Roller Getirilirken";
  try {
    console.log("[Role Service] API Çağrısı: getAllRoles");
    const response = await apiClient.get<Role[]>('/roles'); // API endpoint'i /api/roles olduğu için /roles yeterli
    console.log("[Role Service] Roller başarıyla alındı:", response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, context);
    return []; // Hata durumunda boş dizi dön
  }
}; 