import axios from 'axios';
import { apiClient } from './api';
import { AttendanceRecord } from '@/types/attendance';

/**
 * Belirtilen tarih aralığı ve/veya kullanıcı için puantaj kayıtlarını backend'den getirir.
 * @param startDate Başlangıç tarihi (YYYY-MM-DD)
 * @param endDate Bitiş tarihi (YYYY-MM-DD)
 * @param userId Opsiyonel kullanıcı ID
 * @returns Puantaj kayıtları dizisi
 */
export async function getAttendanceRecords(startDate: string, endDate: string, userId?: string): Promise<AttendanceRecord[]> {
  console.log(`[attendanceService] Puantaj kayıtları getiriliyor: ${startDate} - ${endDate}, Kullanıcı: ${userId || 'Tümü'}`);
  try {
    const params: { startDate: string; endDate: string; userId?: string } = {
      startDate,
      endDate,
    };
    if (userId) {
      params.userId = userId;
    }

    // Merkezi api instance ve doğru endpoint (/attendances) kullanılıyor
    const response = await apiClient.get<AttendanceRecord[]>('/attendances', { params });
    console.log(`[attendanceService] ${response.data.length} puantaj kaydı alındı.`);
    return response.data;
  } catch (error: any) {
    console.error('[attendanceService] Puantaj kayıtları getirilirken hata:', error);
    if (axios.isAxiosError(error)) {
      console.error(`[attendanceService] Axios Error: ${error.message}`, error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Puantaj kayıtları alınamadı';
      throw new Error(errorMessage);
    } else {
      throw new Error(`Puantaj kayıtları alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`);
    }
  }
}

/**
 * Yeni bir puantaj kaydı ekler.
 * @param recordData Eklenecek puantaj verisi (id hariç)
 * @returns Eklenen puantaj kaydı
 */
export const addAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
  console.log("[attendanceService] Yeni puantaj kaydı ekleniyor...", recordData);
  try {
    const response = await apiClient.post<AttendanceRecord>('/attendances', recordData);
    console.log('[attendanceService] Puantaj başarıyla eklendi:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[attendanceService] Puantaj kaydı eklenirken hata:', error);
    if (axios.isAxiosError(error)) {
      console.error(`[attendanceService] Axios Error: ${error.message}`, error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Puantaj kaydı eklenemedi';
      throw new Error(errorMessage);
    } else {
      throw new Error(`Puantaj kaydı eklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`);
    }
  }
};

/**
 * Mevcut bir puantaj kaydını günceller.
 * @param id Güncellenecek kaydın ID'si
 * @param updateData Güncelleme verisi (id hariç alanların bir kısmı)
 * @returns Güncellenen puantaj kaydı
 */
export const updateAttendanceRecord = async (id: string, updateData: Partial<Omit<AttendanceRecord, 'id'>>): Promise<AttendanceRecord> => {
  console.log(`[attendanceService] Puantaj kaydı (ID: ${id}) güncelleniyor...`, updateData);
  try {
    const response = await apiClient.put<AttendanceRecord>(`/attendances/${id}`, updateData);
    console.log('[attendanceService] Puantaj başarıyla güncellendi:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[attendanceService] Puantaj kaydı (ID: ${id}) güncellenirken hata:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`[attendanceService] Axios Error: ${error.message}`, error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Puantaj kaydı güncellenemedi';
      throw new Error(errorMessage);
    } else {
      throw new Error(`Puantaj kaydı güncellenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`);
    }
  }
};

/**
 * Belirtilen ID'ye sahip puantaj kaydını siler.
 * @param id Silinecek kaydın ID'si
 */
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  console.log(`[attendanceService] Puantaj kaydı siliniyor (ID: ${id})...`);
  try {
    await apiClient.delete(`/attendances/${id}`);
    console.log(`[attendanceService] Puantaj kaydı (ID: ${id}) başarıyla silindi.`);
  } catch (error: any) {
    console.error(`[attendanceService] Puantaj kaydı (ID: ${id}) silinirken hata:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`[attendanceService] Axios Error: ${error.message}`, error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Puantaj kaydı silinemedi';
      throw new Error(errorMessage);
    } else {
      throw new Error(`Puantaj kaydı silinemedi: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`);
    }
  }
}; 