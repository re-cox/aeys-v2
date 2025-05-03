// import axios from 'axios'; // Kaldırıldı
import { apiClient, handleApiError } from './api'; // Paylaşılan apiClient ve handleApiError import edildi
import { Department } from '@/types/department';

// Ortama göre doğru API temel URL'ini belirle - Artık api.ts'den geliyor, buna gerek yok.
// const EFFECTIVE_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'; 
// console.log(`[departmentService] Effective API Base URL: ${EFFECTIVE_API_BASE_URL}`);

// Timeout değeri - Artık api.ts'den geliyor
// const TIMEOUT = 30000;

// Yerel apiClient tanımı kaldırıldı
/*
const apiClient = axios.create({
  baseURL: EFFECTIVE_API_BASE_URL, 
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});
*/

// Backend'den gelen Department tipi
interface BackendDepartment { 
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string; 
  updatedAt: string; 
  parent?: BackendDepartment | null; 
  _count?: { 
    users?: number;
    projects?: number;
  };
}

// Backend /api/departments yanıt tipi
interface DepartmentsApiResponse {
  data: BackendDepartment[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// Backend Department verisini Frontend Department tipine dönüştür
const mapBackendDepartmentToFrontend = (dept: BackendDepartment): Department => {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description || undefined,
    parentId: dept.parentId || undefined,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
    parent: dept.parent ? mapBackendDepartmentToFrontend(dept.parent) : undefined,
    _count: dept._count ? { employees: dept._count.users || 0 } : undefined,
  };
};

/**
 * Tüm departmanları backend API'sinden getirir
 */
export async function getAllDepartments(): Promise<Department[]> {
  const context = "Tüm Departmanları Getir"; // Context eklendi
  console.log("[departmentService] Backend'den tüm departmanlar getiriliyor...");
  try {
    // Artık paylaşılan apiClient kullanılıyor
    const response = await apiClient.get<DepartmentsApiResponse>(`/departments`); 
    console.log(`[departmentService] Backend'den ${response.data.data.length} departman alındı (Toplam: ${response.data.meta.total}).`);
    return response.data.data.map(mapBackendDepartmentToFrontend);
  } catch (error) {
    console.error('[departmentService] Departman verileri alınırken hata oluştu:', error);
    handleApiError(error, context); // handleApiError kullanılıyor
    return []; // Hata durumunda boş dizi dön
    // Eski throw kaldırıldı
  }
}

/**
 * ID'ye göre departmanı backend API'sinden getirir
 */
export async function getDepartmentById(id: string): Promise<Department | null> {
  const context = `Departman Getir (ID: ${id})`; // Context eklendi
  console.log(`[departmentService] Backend'den departman getiriliyor (ID: ${id})`);
  try {
    const response = await apiClient.get<BackendDepartment>(`/departments/${id}`);
    return mapBackendDepartmentToFrontend(response.data);
  } catch (error) {
    console.error(`[departmentService] ID'si ${id} olan departman getirilirken hata oluştu:`, error);
    handleApiError(error, context); // handleApiError kullanılıyor
    return null; // Hata durumunda null dön
    // Eski throw kaldırıldı
  }
}

/**
 * Yeni departman oluşturur (Backend API'sine gönderir)
 */
export async function createDepartment(departmentData: Partial<Department>): Promise<Department | null> { // Null dönebilir
  const context = "Departman Oluştur"; // Context eklendi
  console.log("[departmentService] Backend'e yeni departman gönderiliyor...");
  try {
    const response = await apiClient.post<BackendDepartment>(`/departments`, departmentData);
    return mapBackendDepartmentToFrontend(response.data);
  } catch (error) {
    console.error('[departmentService] Departman oluşturulurken hata oluştu:', error);
    handleApiError(error, context); // handleApiError kullanılıyor
    return null; // Hata durumunda null dön
     // Eski throw kaldırıldı
  }
}

/**
 * Departman bilgilerini günceller (Backend API'sine gönderir)
 */
export async function updateDepartment(id: string, departmentData: Partial<Department>): Promise<Department | null> { // Null dönebilir
  const context = `Departman Güncelle (ID: ${id})`; // Context eklendi
  console.log(`[departmentService] Backend'e departman güncelleme gönderiliyor (ID: ${id})`);
  try {
    const response = await apiClient.put<BackendDepartment>(`/departments/${id}`, departmentData);
    return mapBackendDepartmentToFrontend(response.data);
  } catch (error) {
    console.error(`[departmentService] ID'si ${id} olan departman güncellenirken hata oluştu:`, error);
    handleApiError(error, context); // handleApiError kullanılıyor
    return null; // Hata durumunda null dön
    // Eski throw kaldırıldı
  }
}

/**
 * Departmanı siler (Backend API'sine istek gönderir)
 */
export async function deleteDepartment(id: string): Promise<boolean> {
   const context = `Departman Sil (ID: ${id})`; // Context eklendi
   console.log(`[departmentService] Backend'e departman silme isteği gönderiliyor (ID: ${id})`);
  try {
    await apiClient.delete(`/departments/${id}`);
    return true;
  } catch (error) {
    console.error(`[departmentService] ID'si ${id} olan departman silinirken hata oluştu:`, error);
    handleApiError(error, context); // handleApiError kullanılıyor
    return false; // Hata durumunda false dön
    // Eski throw kaldırıldı
  }
} 