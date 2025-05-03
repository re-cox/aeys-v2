/**
 * Hakediş (İlerleme Ödemesi) servisi
 * API ile iletişim kurarak hakediş verilerini yönetir
 */

import { 
  ProgressPayment, 
  ProgressPaymentInput, 
  ProgressPaymentStatusUpdate,
  ProjectFinancialSummary
} from '@/types/progressPayment';

/**
 * Belirli bir projeye ait tüm hakedişleri getirir
 * @param projectId Proje ID'si
 * @returns Hakediş listesi
 */
export async function getProjectProgressPayments(projectId: string): Promise<ProgressPayment[]> {
  try {
    const response = await fetch(`/api/progress-payments?projectId=${projectId}`);
    
    if (!response.ok) {
      throw new Error('Hakediş verileri alınamadı');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Hakediş verileri alınırken hata:', error);
    throw error;
  }
}

/**
 * Tüm projelere ait hakedişleri getirir
 * @returns Hakediş listesi
 */
export async function getAllProgressPayments(): Promise<ProgressPayment[]> {
  try {
    const response = await fetch('/api/progress-payments');
    
    if (!response.ok) {
      throw new Error('Hakediş verileri alınamadı');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Hakediş verileri alınırken hata:', error);
    throw error;
  }
}

/**
 * Belirli bir hakediş detayını getirir
 * @param id Hakediş ID'si
 * @returns Hakediş detayı
 */
export async function getProgressPaymentById(id: string): Promise<ProgressPayment> {
  try {
    const response = await fetch(`/api/progress-payments/${id}`);
    
    if (!response.ok) {
      throw new Error('Hakediş detayı alınamadı');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Hakediş detayı alınırken hata:', error);
    throw error;
  }
}

/**
 * Yeni bir hakediş oluşturur
 * @param paymentData Hakediş verileri
 * @returns Oluşturulan hakediş
 */
export async function createProgressPayment(paymentData: ProgressPaymentInput): Promise<ProgressPayment> {
  try {
    const response = await fetch('/api/progress-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      throw new Error('Hakediş oluşturulamadı');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Hakediş oluşturulurken hata:', error);
    throw error;
  }
}

/**
 * Mevcut bir hakediş kaydını günceller
 * @param id Hakediş ID'si
 * @param paymentData Güncellenecek hakediş verileri
 * @returns Güncellenen hakediş
 */
export async function updateProgressPayment(id: string, paymentData: Partial<ProgressPaymentInput>): Promise<ProgressPayment> {
  try {
    const response = await fetch(`/api/progress-payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      throw new Error('Hakediş güncellenemedi');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Hakediş güncellenirken hata:', error);
    throw error;
  }
}

/**
 * Hakediş durumunu günceller
 * @param statusData Durum güncelleme verileri
 * @returns Güncellenen hakediş
 */
export async function updateProgressPaymentStatus(statusData: ProgressPaymentStatusUpdate): Promise<ProgressPayment> {
  try {
    const response = await fetch(`/api/progress-payments/${statusData.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });
    
    if (!response.ok) {
      throw new Error('Hakediş durumu güncellenemedi');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Hakediş durumu güncellenirken hata:', error);
    throw error;
  }
}

/**
 * Hakediş kaydını siler
 * @param id Hakediş ID'si
 * @returns İşlem başarılı mı
 */
export async function deleteProgressPayment(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/progress-payments/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Hakediş silinemedi');
    }
    
    return true;
  } catch (error) {
    console.error('Hakediş silinirken hata:', error);
    throw error;
  }
}

/**
 * Belirli bir projeye ait finansal özeti getirir
 * @param projectId Proje ID'si
 * @returns Proje finansal özeti
 */
export async function getProjectFinancialSummary(projectId: string): Promise<ProjectFinancialSummary> {
  try {
    const response = await fetch(`/api/projects/${projectId}/financial-summary`);
    
    if (!response.ok) {
      throw new Error('Proje finansal özeti alınamadı');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Proje finansal özeti alınırken hata:', error);
    throw error;
  }
}

/**
 * Hakediş durumunu Türkçe olarak döndürür
 * @param status Hakediş durumu
 * @returns Türkçe durum metni
 */
export function translateProgressPaymentStatus(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Hazırlanıyor';
    case 'SUBMITTED': return 'Gönderildi';
    case 'PENDING': return 'Onay Bekliyor';
    case 'APPROVED': return 'Onaylandı';
    case 'PAID': return 'Ödendi';
    case 'PARTIALLY_PAID': return 'Kısmi Ödendi';
    case 'REJECTED': return 'Reddedildi';
    default: return status;
  }
}

/**
 * Hakediş durumuna göre renk sınıfını döndürür
 * @param status Hakediş durumu
 * @returns CSS renk sınıfı
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
    case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300';
    case 'PARTIALLY_PAID': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300';
    case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  }
}