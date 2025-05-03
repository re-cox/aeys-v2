// import { Assignment, Asset, Employee } from '@prisma/client'; // Kaldırıldı
import { NewAssignmentData, UpdateAssignmentData, AssignmentQueryParams, AssignmentWithIncludes } from '@/types/asset'; // Tipler asset.ts içinde olacak

const API_URL = '/api/assignments';

// Tüm zimmetleri getir (filtreli)
export async function getAllAssignments(params?: AssignmentQueryParams): Promise<AssignmentWithIncludes[]> {
  try {
    let url = API_URL;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.assetId) queryParams.append('assetId', params.assetId);
      if (params.status) queryParams.append('status', params.status);
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
      throw new Error(`Zimmetler yüklenirken hata: ${errorMessage} (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('Zimmetler yüklenirken hata:', error);
    throw error;
  }
}

// ID'ye göre zimmet getir
export async function getAssignmentById(id: string): Promise<AssignmentWithIncludes> {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Zimmet kaydı bulunamadı.');
      }
      throw new Error(`Zimmet yüklenirken hata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Zimmet (ID: ${id}) yüklenirken hata:`, error);
    throw error;
  }
}

// Yeni zimmet oluştur
export async function createAssignment(data: NewAssignmentData): Promise<AssignmentWithIncludes> {
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
      throw new Error(`Zimmet oluşturulurken hata: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Zimmet oluşturulurken hata:', error);
    throw error;
  }
}

// Zimmeti güncelle/sonlandır (Özellikle iade tarihi ve notlar için)
export async function updateAssignment(id: string, data: UpdateAssignmentData): Promise<AssignmentWithIncludes> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      // Sadece izin verilen alanları gönder (örn: returnDate, notes)
      body: JSON.stringify(data), 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Zimmet güncellenirken hata: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Zimmet (ID: ${id}) güncellenirken hata:`, error);
    throw error;
  }
}

// Zimmeti iade et (updateAssignment için özel bir kullanım)
export async function returnAssignment(id: string, returnDate: string, notes?: string): Promise<AssignmentWithIncludes> {
  return updateAssignment(id, { returnDate, notes });
}

// Zimmet kaydını sil (Genellikle önerilmez)
export async function deleteAssignment(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Zimmet silinirken hata: ${errorData.message || response.statusText}`);
    }
  } catch (error) {
    console.error(`Zimmet (ID: ${id}) silinirken hata:`, error);
    throw error;
  }
} 