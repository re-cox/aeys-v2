import { Employee } from './employee';

// Puantaj durumlarına göre gün sayıları
export interface AttendanceCounts {
  fullDays: number;       // Tam gün (G)
  halfDays: number;       // Yarım gün (Y)
  leaveDays: number;      // İzinli (İ)
  reportDays: number;     // Raporlu (R)
  absentDays: number;     // Gelmedi (X)
  holidayDays: number;    // Tatil (T) - Puantajda işaretlenenler
  totalWorkingDays: number; // Çalışılan gün (Tam + Yarım * 0.5)
  totalDaysInMonth: number; // Ayın toplam gün sayısı
}

// Mesai saatleri ve tutarları
export interface OvertimeDetails {
  weekdayHours: number;   // Hafta içi mesai saati
  weekendHours: number;   // Hafta sonu mesai saati
  holidayHours: number;   // Resmi tatil mesai saati
  totalHours: number;     // Toplam mesai saati
  weekdayPay: number;     // Hafta içi mesai ödemesi
  weekendPay: number;     // Hafta sonu mesai ödemesi
  holidayPay: number;     // Resmi tatil mesai ödemesi
  totalOvertimePay: number; // Toplam mesai ödemesi
}

// Kesintiler
export interface Deductions {
  halfDayDeduction: number; // Yarım gün kesintisi
  absentDayDeduction: number;// Devamsızlık kesintisi
  totalDeductions: number;  // Toplam kesinti
}

// Ana Maaş Hesaplama Sonucu Arayüzü
export interface SalaryCalculationResult {
  employeeId: string;
  employeeName: string;
  employeeSurname: string;
  baseSalary: number;         // Personelin ana maaşı
  month: number;              // Hesaplama ayı (1-12)
  year: number;               // Hesaplama yılı
  attendanceCounts: AttendanceCounts;
  overtimeDetails: OvertimeDetails;
  deductions: Deductions;
  calculatedSalary: number;   // Kesintiler sonrası hesaplanan maaş
  totalPayable: number;       // Ödenecek Toplam Maaş (Hesaplanan Maaş + Toplam Mesai)
} 