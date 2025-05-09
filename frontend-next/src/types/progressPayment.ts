/**
 * Hakediş (İlerleme Ödemesi) için tip tanımlamaları
 */

// Hakediş durumları
export type ProgressPaymentStatus = 
  | 'DRAFT'       // Hazırlanıyor
  | 'SUBMITTED'   // Gönderildi
  | 'PENDING'     // Onay Bekliyor
  | 'APPROVED'    // Onaylandı
  | 'PAID'        // Ödendi
  | 'REJECTED';   // Reddedildi

// Hakediş belgesi tipi
export interface ProgressPaymentDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  fileSize: number; // bytes cinsinden
}

// Hakediş detayları
export interface ProgressPayment {
  id: string;
  projectId: string;
  projectName: string;
  paymentNumber: number; // Hakediş No
  description: string; // Açıklama/Dönem
  createdAt: string; // Oluşturma/Talep Tarihi
  dueDate: string | null; // Vade Tarihi (Opsiyonel)
  requestedAmount: number; // Talep Edilen Tutar
  approvedAmount: number | null; // Onaylanan Tutar (Varsa)
  paidAmount: number | null; // Ödenen Tutar
  status: ProgressPaymentStatus; // Durum
  paymentDate: string | null; // Ödenme Tarihi (Varsa)
  documents: ProgressPaymentDocument[]; // İlgili belgeler
  notes: string | null; // Notlar
}

// Hakediş oluşturma/güncelleme için girdi
export interface ProgressPaymentInput {
  projectId: string;
  description: string;
  requestedAmount: number;
  dueDate?: string | null;
  notes?: string | null;
}

// Hakediş durum güncelleme için girdi
export interface ProgressPaymentStatusUpdate {
  id: string;
  status: ProgressPaymentStatus;
  approvedAmount?: number;
  paidAmount?: number;
  paymentDate?: string | null;
  notes?: string | null;
}

// Proje finansal özeti
export interface ProjectFinancialSummary {
  projectId: string;
  projectName: string;
  contractAmount: number; // Sözleşme Bedeli
  totalRequestedAmount: number; // Toplam Talep Edilen Hakediş Tutarı
  totalApprovedAmount: number; // Toplam Onaylanan Hakediş Tutarı
  totalPaidAmount: number; // Toplam Ödenen Hakediş Tutarı
  remainingBalance: number; // Proje Kalan Bakiyesi (Sözleşme Bedeli - Ödenen Tutar)
  completionPercentage: number; // Tamamlanma Yüzdesi (Ödenen / Sözleşme Bedeli)
}