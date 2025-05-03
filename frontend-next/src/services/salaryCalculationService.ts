import { Employee } from '@/types/employee';
import { AttendanceRecord } from '@/types/attendance'; // Varsayım: attendance tipleri burada
import { SalaryCalculationResult, AttendanceCounts, OvertimeDetails, Deductions } from '@/types/salaryCalculation';

/**
 * Verilen tarih ve saate göre mesai süresini saat cinsinden hesaplar.
 * @param start Başlangıç saati (HH:MM)
 * @param end Bitiş saati (HH:MM)
 * @returns Mesai süresi (saat) veya geçersizse 0
 */
function calculateOvertimeHours(start?: string, end?: string): number {
  if (!start || !end) return 0;

  try {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);

    // Eğer bitiş saati başlangıçtan küçükse, ertesi gün varsayımı
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    const diffMs = endTime.getTime() - startTime.getTime();
    if (diffMs <= 0) return 0;

    return diffMs / (1000 * 60 * 60); // Milisaniyeyi saate çevir
  } catch (error) {
    console.error("Mesai saati hesaplama hatası:", start, end, error);
    return 0;
  }
}

/**
 * Verilen tarihin hafta sonu olup olmadığını kontrol eder.
 * @param dateString Tarih (YYYY-MM-DD)
 * @returns Hafta sonu ise true, değilse false
 */
function isWeekend(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Pazar veya Cumartesi
  } catch (error) {
    console.error("Hafta sonu kontrol hatası:", dateString, error);
    return false;
  }
}

/**
 * Bir çalışan için belirtilen ayın maaşını hesaplar.
 * @param employee Çalışan bilgisi (maaş dahil)
 * @param attendanceRecords Çalışanın o aya ait puantaj kayıtları
 * @param year Hesaplama yılı
 * @param month Hesaplama ayı (1-12)
 * @returns Detaylı maaş hesaplama sonucu
 */
export function calculateEmployeeSalary(
  employee: Employee,
  attendanceRecords: AttendanceRecord[],
  year: number,
  month: number
): SalaryCalculationResult {
  const baseSalary = employee.salary ?? 0;
  if (baseSalary <= 0) {
    // Maaş bilgisi olmayan veya 0 olanlar için varsayılan boş sonuç
    console.warn(`${employee.name} ${employee.surname} için maaş bilgisi bulunamadı veya geçersiz.`);
    // Burada boş bir SalaryCalculationResult döndürmek daha iyi olabilir
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = baseSalary / 30;
  const hourlyRate = dailyRate / 8;

  const counts: AttendanceCounts = {
    fullDays: 0,
    halfDays: 0,
    leaveDays: 0,
    reportDays: 0,
    absentDays: 0,
    holidayDays: 0,
    totalWorkingDays: 0,
    totalDaysInMonth: daysInMonth,
  };

  const overtime: OvertimeDetails = {
    weekdayHours: 0,
    weekendHours: 0,
    holidayHours: 0,
    totalHours: 0,
    weekdayPay: 0,
    weekendPay: 0,
    holidayPay: 0,
    totalOvertimePay: 0,
  };

  // Ayın her günü için puantajı işle
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(r => r.date === dateStr);

    // Puantaj durumu sayımı
    if (record) {
      switch (record.status) {
        case 'G': counts.fullDays++; break;
        case 'Y': counts.halfDays++; break;
        case 'İ': counts.leaveDays++; break;
        case 'R': counts.reportDays++; break;
        case 'X': counts.absentDays++; break;
        case 'T': counts.holidayDays++; break;
      }

      // Mesai hesaplama
      if (record.hasOvertime) {
        const hours = calculateOvertimeHours(record.overtimeStart, record.overtimeEnd);
        if (hours > 0) {
          overtime.totalHours += hours;
          if (record.isHoliday) {
            overtime.holidayHours += hours;
            overtime.holidayPay += hourlyRate * 2 * hours; // Resmi Tatil Mesaisi
          } else if (isWeekend(dateStr)) {
            overtime.weekendHours += hours;
            overtime.weekendPay += hourlyRate * 2 * hours; // Hafta Sonu Mesaisi
          } else {
            overtime.weekdayHours += hours;
            overtime.weekdayPay += hourlyRate * 1.5 * hours; // Hafta İçi Mesaisi
          }
        }
      }
    } else {
      // Kayıt yoksa, hafta sonu değilse devamsız sayılabilir (varsayım)
      if (!isWeekend(dateStr)) {
         // counts.absentDays++; // Bu varsayımı isteğe göre aktif edebiliriz
      }
    }
  }

  counts.totalWorkingDays = counts.fullDays + (counts.halfDays * 0.5);
  overtime.totalOvertimePay = overtime.weekdayPay + overtime.weekendPay + overtime.holidayPay;

  // Kesintiler
  const deductions: Deductions = {
    halfDayDeduction: (dailyRate / 2) * counts.halfDays,
    absentDayDeduction: dailyRate * counts.absentDays,
    totalDeductions: 0,
  };
  deductions.totalDeductions = deductions.halfDayDeduction + deductions.absentDayDeduction;

  // Hesaplanan ve Toplam Maaş
  const calculatedSalary = baseSalary - deductions.totalDeductions;
  const totalPayable = calculatedSalary + overtime.totalOvertimePay;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employeeSurname: employee.surname,
    baseSalary,
    month,
    year,
    attendanceCounts: counts,
    overtimeDetails: overtime,
    deductions,
    calculatedSalary,
    totalPayable,
  };
} 