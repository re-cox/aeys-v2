// Yıllık İzin API İstekleri İçin Servis
import axios from 'axios'; // axios importu eklendi
import { AnnualLeave, LeaveStatus } from '@/types/annual-leave';
import { apiClient, handleApiError } from './api'; // Paylaşılan apiClient ve handleApiError import edildi
// import api from './api'; // Hatalı default import kaldırıldı
import { AnnualLeaveRequest } from '@/types/annual-leave-types'; // Gerekli tipi import edin

// Yeni LeaveStats Tipi
export interface LeaveStats {
  userId: string;
  employeeName: string;
  departmentName: string;
  totalDaysUsed: number;
  pendingDays: number;
  remainingDays: number;
  totalAnnualAllowance: number;
}

// Güncellenecek İzin Verisi Tipi
export interface UpdateLeaveData {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    reason?: string;
}

/**
 * Filtrelere göre yıllık izin kayıtlarını getirir.
 */
export const getAnnualLeaves = async (filters?: { userId?: string; startDate?: string; endDate?: string }): Promise<AnnualLeaveRequest[]> => {
    try {
        const response = await apiClient.get<AnnualLeaveRequest[]>('/annual-leaves', {
            params: filters
        });
        return response.data;
    } catch (error) {
        console.error("Yıllık izin kayıtları alınırken hata oluştu:", error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', error.response?.data);
            throw new Error(error.response?.data?.message || 'API isteği sırasında bir hata oluştu.');
        } else {
            throw new Error('Yıllık izinler alınamadı.');
        }
    }
};

/**
 * Yeni bir yıllık izin talebi oluşturur.
 */
export async function createAnnualLeave(leaveData: Omit<AnnualLeave, 'id' | 'status' | 'requestedAt' | 'approvedBy' | 'approvedById' | 'approvedAt' | 'user'>): Promise<AnnualLeave> {
    try {
        console.log('[annualLeaveService] Yeni izin talebi gönderiliyor...', leaveData);
        const response = await apiClient.post<AnnualLeave>('/annual-leaves', leaveData);
        console.log('[annualLeaveService] İzin talebi başarıyla oluşturuldu:', response.data);
        return response.data;
    } catch (error) {
         throw handleApiError(error, 'İzin talebi oluşturulamadı');
    }
}

/**
 * Bir iznin durumunu günceller (Onay/Red).
 */
export async function updateAnnualLeaveStatus(id: string, status: LeaveStatus): Promise<AnnualLeave> {
    try {
        console.log(`[annualLeaveService] İzin durumu güncelleniyor (ID: ${id}, Durum: ${status})...`);
        // Backend PUT /:id/status bekliyor
        const response = await apiClient.put<AnnualLeave>(`/annual-leaves/${id}/status`, { status }); 
        console.log('[annualLeaveService] İzin durumu başarıyla güncellendi:', response.data);
        return response.data;
    } catch (error) {
        throw handleApiError(error, 'İzin durumu güncellenemedi');
    }
}

/**
 * Bir iznin detaylarını günceller (Tarih, Sebep vb.).
 * Sadece PENDING durumundaki izinler güncellenebilir (backend kontrolü).
 */
export async function updateAnnualLeave(id: string, updateData: UpdateLeaveData): Promise<AnnualLeave> {
    try {
        console.log(`[annualLeaveService] İzin detayları güncelleniyor (ID: ${id})...`, updateData);
        // Backend PUT /:id bekliyor
        const response = await apiClient.put<AnnualLeave>(`/annual-leaves/${id}`, updateData); 
        console.log('[annualLeaveService] İzin detayları başarıyla güncellendi:', response.data);
        return response.data;
    } catch (error) {
        throw handleApiError(error, 'İzin detayları güncellenemedi');
    }
}

/**
 * ID'ye göre yıllık izin getirir.
 * Backend'de GET /:id rotası VARSAYILIYOR.
 */
export async function getAnnualLeaveById(id: string): Promise<AnnualLeave | null> {
    const context = `İzin Getir (ID: ${id})`; // Context eklendi
    try {
        console.log(`[annualLeaveService] İzin getiriliyor (ID: ${id})...`);
        const response = await apiClient.get<AnnualLeave>(`/annual-leaves/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, context); 
        return null;
    }
}

/**
 * Yıllık izin talebini siler.
 * Backend'de DELETE /:id rotası VARSAYILIYOR.
 */
export async function deleteAnnualLeave(id: string): Promise<boolean> {
    try {
        console.log(`[annualLeaveService] İzin siliniyor (ID: ${id})...`);
        await apiClient.delete(`/annual-leaves/${id}`);
        console.log(`[annualLeaveService] İzin başarıyla silindi (ID: ${id}).`);
        return true;
    } catch (error) {
        throw handleApiError(error, 'İzin silinemedi');
    }
}

/**
 * Backend'den tüm çalışanların yıllık izin istatistiklerini getirir.
 * TODO: Backend'in beklediği parametreler (örn: yıl) eklenebilir.
 */
export const getAnnualLeaveStats = async (/* params?: { year?: number } */): Promise<LeaveStats[]> => {
  const context = "İzin İstatistiklerini Getir"; // Context eklendi
  try {
    console.log("[annualLeaveService] İzin istatistikleri getiriliyor...");
    // Paylaşılan apiClient kullanılıyor ve endpoint /stats yerine /annual-leaves/stats
    const response = await apiClient.get<LeaveStats[]>(`/annual-leaves/stats` /*, { params }*/);
    console.log(`[annualLeaveService] ${response.data.length} personel için istatistik alındı.`);
    return response.data;
  } catch (error) {
    console.error("İzin istatistikleri alınırken hata oluştu:", error); // Log kalsın
    handleApiError(error, context); // handleApiError kullanılıyor
    return []; // Hata durumunda boş dizi dön
  }
};

// --- Kaldırılan veya TODO olarak işaretlenen fonksiyonlar ---
// getAnnualLeavesByStatus: getAnnualLeaves ile filtre kullanarak yapılabilir.
// getEmployeeAnnualLeaves: getAnnualLeaves ile userId filtresi kullanarak yapılabilir.
// getEmployeeLeaveStats: Backend'de ayrı bir endpoint gerektirir.
// calculateAllEmployeesLeaveStats: Bu işlem backend'de yapıldı, getAnnualLeaveStats kullanılıyor. 