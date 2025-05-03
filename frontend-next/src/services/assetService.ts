import { Asset /*, AssetStatus, AssetCategory */ } from '@prisma/client'; // Kaldırılanlar yorumlandı
import { NewAssetData, UpdateAssetData, AssetQueryParams, AssetWithAssignments } from '@/types/asset'; // Bu tipleri birazdan oluşturacağız

const API_URL = '/api/assets';

// Tüm demirbaşları getir (filtreli)
export async function getAllAssets(params?: AssetQueryParams): Promise<AssetWithAssignments[]> {
  try {
    let url = API_URL;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.searchQuery) queryParams.append('search', params.searchQuery);
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const response = await fetch(url);
    if (!response.ok) {
      // Hata mesajını detaylı hale getir
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || response.statusText;
      throw new Error(`Demirbaşlar yüklenirken hata: ${errorMessage} (${response.status})`);
    }
    const data = await response.json();
     // API'den dönen Decimal değerlerini string'e çevir (veya number, ihtiyaca göre)
    return data.map((asset: Asset) => ({
      ...asset,
      purchaseCost: asset.purchaseCost ? asset.purchaseCost.toString() : null,
    }));
  } catch (error) {
    console.error('Demirbaşlar yüklenirken hata:', error);
    throw error;
  }
}

// ID'ye göre demirbaş getir
export async function getAssetById(id: string): Promise<AssetWithAssignments> {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Demirbaş bulunamadı.');
      }
      throw new Error(`Demirbaş yüklenirken hata: ${response.statusText}`);
    }
     const data = await response.json();
    return { ...data, purchaseCost: data.purchaseCost ? data.purchaseCost.toString() : null };
  } catch (error) {
    console.error(`Demirbaş (ID: ${id}) yüklenirken hata:`, error);
    throw error;
  }
}

// Yeni demirbaş oluştur
export async function createAsset(data: NewAssetData): Promise<Asset> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Demirbaş oluşturulurken hata: ${errorData.message || response.statusText}`);
    }
      const createdData = await response.json();
      return { ...createdData, purchaseCost: createdData.purchaseCost ? createdData.purchaseCost.toString() : null };
  } catch (error) {
    console.error('Demirbaş oluşturulurken hata:', error);
    throw error;
  }
}

// Demirbaş güncelle
export async function updateAsset(data: UpdateAssetData): Promise<AssetWithAssignments> {
  try {
    const response = await fetch(`${API_URL}/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Demirbaş güncellenirken hata: ${errorData.message || response.statusText}`);
    }
    const updatedData = await response.json();
    return { ...updatedData, purchaseCost: updatedData.purchaseCost ? updatedData.purchaseCost.toString() : null };
  } catch (error) {
    console.error(`Demirbaş (ID: ${data.id}) güncellenirken hata:`, error);
    throw error;
  }
}

// Demirbaş sil
export async function deleteAsset(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Demirbaş silinirken hata: ${errorData.message || response.statusText}`);
    }
  } catch (error) {
    console.error(`Demirbaş (ID: ${id}) silinirken hata:`, error);
    throw error;
  }
} 