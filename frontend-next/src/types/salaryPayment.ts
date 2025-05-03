// Maaş Hesaplama Tip Tanımları
import { Employee } from "./employee";

// Ödeme metodları
export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  CHECK = "CHECK",
  OTHER = "OTHER"
}

// Puantaj durumları
export enum AttendanceStatus {
  FULL_DAY = "G", // Tam Gün
  HALF_DAY = "Y", // Yarım Gün
  ABSENT = "X",   // Gelmedi
  LEAVE = "İ",    // İzinli
  SICK = "R",     // Raporlu
  HOLIDAY = "T",  // Tatil
  OVERTIME = "M"  // Mesai
}

// Puantaj tabanlı maaş hesaplama için ek bilgiler
export interface PayrollAttendance {
  fullDayCount: number;     // Tam gün sayısı
  halfDayCount: number;     // Yarım gün sayısı
  leaveCount: number;       // İzinli gün sayısı
  sickCount: number;        // Raporlu gün sayısı
  absentCount: number;      // Gelmediği gün sayısı
  holidayCount?: number;    // Tatil gün sayısı
  weekdayOvertimeHours: number;   // Hafta içi mesai saatleri
  weekendOvertimeHours: number;   // Hafta sonu mesai saatleri
  holidayOvertimeHours: number;   // Resmi tatil mesai saatleri
}

// Temel Maaş Ödemesi Modeli
export interface SalaryPayment {
  id: string;
  employeeId: string;
  paymentDate: string | Date;
  paymentPeriod: string; // "2023-01" formatında yıl-ay
  baseSalary: number;
  overtimePay?: number;
  bonus?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  netAmount: number;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  employee?: Employee;
  
  // Puantaj tabanlı maaş hesaplama için ek alanlar
  attendanceDetails?: PayrollAttendance;
  weekdayOvertimePay?: number;    // Hafta içi mesai ücreti
  weekendOvertimePay?: number;    // Hafta sonu mesai ücreti
  holidayOvertimePay?: number;    // Resmi tatil mesai ücreti
  totalOvertimePay?: number;      // Toplam mesai ücreti
}

// Yeni Ödeme Oluşturma İçin
export interface NewSalaryPayment {
  employeeId: string;
  paymentDate: string | Date;
  paymentPeriod: string;
  baseSalary: number;
  overtimePay?: number;
  bonus?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  netAmount: number;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  
  // Puantaj tabanlı maaş hesaplama için ek alanlar
  attendanceDetails?: PayrollAttendance;
  weekdayOvertimePay?: number;
  weekendOvertimePay?: number;
  holidayOvertimePay?: number;
  totalOvertimePay?: number;
}

// Ödeme Güncelleme İçin
export interface UpdateSalaryPayment {
  id: string;
  paymentDate?: string | Date;
  paymentPeriod?: string;
  baseSalary?: number;
  overtimePay?: number;
  bonus?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  netAmount?: number;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  
  // Puantaj tabanlı maaş hesaplama için ek alanlar
  attendanceDetails?: PayrollAttendance;
  weekdayOvertimePay?: number;
  weekendOvertimePay?: number;
  holidayOvertimePay?: number;
  totalOvertimePay?: number;
}

// Maaş Özeti İçin
export interface SalarySummary {
  totalPaid: number;
  averageMonthly: number;
  lastPayment?: SalaryPayment;
}

// Mesai Hesaplama için yardımcı arayüz
export interface OvertimeCalculation {
  hourlyRate: number;          // Saatlik ücret
  weekdayOvertimeRate: number; // Hafta içi mesai katsayısı (1.5)
  weekendOvertimeRate: number; // Hafta sonu mesai katsayısı (2.0)
  holidayOvertimeRate: number; // Resmi tatil mesai katsayısı (2.0)
}

// Maaş Hesaplama Yardımcı Tipleri
export interface SalaryCalculationParams {
  baseSalary: number;
  workingDaysInMonth: number;    // Aydaki iş günü sayısı (genelde 30)
  dailyWorkingHours: number;     // Günlük çalışma saati (genelde 8)
  attendanceDetails: PayrollAttendance;
} 