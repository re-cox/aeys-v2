// Maaş Hesaplama API İstekleri İçin Servis
import axios from 'axios';
import { 
  SalaryPayment, 
  NewSalaryPayment, 
  UpdateSalaryPayment, 
  SalarySummary,
  PayrollAttendance,
  OvertimeCalculation,
  SalaryCalculationParams
} from '@/types/salaryPayment';

// API URL'ini .env dosyasından al (ancak Next.js içinde /api ile başlayan istekler otomatik olarak API Routes'a yönlendirilir)
const API_URL = '/api';

// Timeout değeri (milliseconds)
const TIMEOUT = 30000;

/**
 * Tüm maaş ödemelerini getirir
 */
export async function getAllSalaryPayments(): Promise<SalaryPayment[]> {
  try {
    const response = await axios.get<SalaryPayment[]>(`${API_URL}/salary-payments`, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error('Maaş ödemesi verileri alınırken hata oluştu:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Sunucu hatası: ${error.response.status} - ${error.response.statusText}`);
        
        // Sunucu yanıtındaki hatayı logla
        if (error.response.data) {
          console.error('Hata yanıtı:', JSON.stringify(error.response.data));
        }
      } else if (error.request) {
        console.error('Sunucu yanıt vermedi, bağlantı hatası olabilir');
      }
    }
    
    throw new Error("Maaş ödemesi verileri alınamadı");
  }
}

/**
 * Belirli bir personele ait maaş ödemelerini getirir
 */
export async function getEmployeeSalaryPayments(employeeId: string): Promise<SalaryPayment[]> {
  try {
    const response = await axios.get<SalaryPayment[]>(`${API_URL}/salary-payments/employee/${employeeId}`, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error(`${employeeId} ID'li personelin maaş ödemesi verileri alınırken hata oluştu:`, error);
    throw new Error("Personelin maaş ödemesi verileri alınamadı");
  }
}

/**
 * ID'ye göre maaş ödemesi getirir
 */
export async function getSalaryPaymentById(id: string): Promise<SalaryPayment> {
  try {
    const response = await axios.get<SalaryPayment>(`${API_URL}/salary-payments/${id}`, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error(`ID'si ${id} olan maaş ödemesi getirilirken hata oluştu:`, error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`${id} ID'sine sahip maaş ödemesi bulunamadı`);
    }
    
    throw new Error("Maaş ödemesi bilgileri alınamadı");
  }
}

/**
 * Personel için maaş özeti getirir
 */
export async function getEmployeeSalarySummary(employeeId: string): Promise<SalarySummary> {
  try {
    const response = await axios.get<SalarySummary>(`${API_URL}/salary-payments/summary/${employeeId}`, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error(`${employeeId} ID'li personelin maaş özeti alınırken hata oluştu:`, error);
    throw new Error("Maaş özeti alınamadı");
  }
}

/**
 * Yeni maaş ödemesi oluşturur
 */
export async function createSalaryPayment(salaryData: NewSalaryPayment): Promise<SalaryPayment> {
  try {
    const response = await axios.post<SalaryPayment>(`${API_URL}/salary-payments`, salaryData, {
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Maaş ödemesi oluşturulurken hata oluştu:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 400) {
        throw new Error('Geçersiz maaş ödemesi bilgileri: ' + 
        (error.response.data.error || 'Lütfen gerekli alanları doldurun'));
      }
    }
    
    throw new Error("Maaş ödemesi oluşturulamadı");
  }
}

/**
 * Maaş ödemesi günceller
 */
export async function updateSalaryPayment(id: string, salaryData: UpdateSalaryPayment): Promise<SalaryPayment> {
  try {
    const response = await axios.put<SalaryPayment>(`${API_URL}/salary-payments/${id}`, salaryData, {
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`ID'si ${id} olan maaş ödemesi güncellenirken hata oluştu:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        throw new Error(`${id} ID'sine sahip maaş ödemesi bulunamadı`);
      }
    }
    
    throw new Error("Maaş ödemesi güncellenemedi");
  }
}

/**
 * Maaş ödemesi siler
 */
export async function deleteSalaryPayment(id: string): Promise<boolean> {
  try {
    await axios.delete(`${API_URL}/salary-payments/${id}`, {
      timeout: TIMEOUT
    });
    return true;
  } catch (error) {
    console.error(`ID'si ${id} olan maaş ödemesi silinirken hata oluştu:`, error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`${id} ID'sine sahip maaş ödemesi bulunamadı`);
    }
    
    throw new Error("Maaş ödemesi silinemedi");
  }
}

/**
 * Puantaj tabanlı maaş hesaplama
 * @param params Hesaplama parametreleri
 * @returns Hesaplanan maaş bilgileri
 */
export function calculateSalaryFromAttendance(params: SalaryCalculationParams): {
  netAmount: number;
  weekdayOvertimePay: number;
  weekendOvertimePay: number;
  holidayOvertimePay: number;
  totalOvertimePay: number;
} {
  const { baseSalary, workingDaysInMonth = 30, dailyWorkingHours = 8, attendanceDetails } = params;
  
  // Saatlik ücret hesaplama
  const hourlyRate = baseSalary / workingDaysInMonth / dailyWorkingHours;
  
  // Farklı mesai türleri için katsayılar
  const overtimeRates: OvertimeCalculation = {
    hourlyRate,
    weekdayOvertimeRate: 1.5, // Hafta içi mesai katsayısı
    weekendOvertimeRate: 2.0, // Hafta sonu mesai katsayısı
    holidayOvertimeRate: 2.0  // Resmi tatil mesai katsayısı
  };
  
  // Mesai ücretlerini hesapla
  const weekdayOvertimePay = calculateOvertimePay(
    overtimeRates.hourlyRate,
    attendanceDetails.weekdayOvertimeHours,
    overtimeRates.weekdayOvertimeRate
  );
  
  const weekendOvertimePay = calculateOvertimePay(
    overtimeRates.hourlyRate,
    attendanceDetails.weekendOvertimeHours,
    overtimeRates.weekendOvertimeRate
  );
  
  const holidayOvertimePay = calculateOvertimePay(
    overtimeRates.hourlyRate,
    attendanceDetails.holidayOvertimeHours,
    overtimeRates.holidayOvertimeRate
  );
  
  // Toplam mesai ücreti
  const totalOvertimePay = weekdayOvertimePay + weekendOvertimePay + holidayOvertimePay;
  
  // Esas maaş hesabı (puantaja göre)
  // Tam gün sayısı tam maaş, yarım gün sayısı yarım maaş alır
  const workingDayRate = (attendanceDetails.fullDayCount + (attendanceDetails.halfDayCount * 0.5)) / workingDaysInMonth;
  const baseSalaryAfterAttendance = baseSalary * workingDayRate;
  
  // Net maaş: Puantaja göre hesaplanan maaş + Mesai ücreti
  const netAmount = baseSalaryAfterAttendance + totalOvertimePay;
  
  return {
    netAmount,
    weekdayOvertimePay,
    weekendOvertimePay,
    holidayOvertimePay,
    totalOvertimePay
  };
}

/**
 * Mesai ücreti hesaplama
 * @param hourlyRate Saatlik ücret
 * @param hours Mesai saati
 * @param rate Mesai katsayısı
 * @returns Hesaplanan mesai ücreti
 */
function calculateOvertimePay(hourlyRate: number, hours: number, rate: number): number {
  return hourlyRate * hours * rate;
}

/**
 * Belirli bir ay için bir personelin puantaj bilgilerini getirir
 * @param employeeId Personel ID
 * @param year Yıl
 * @param month Ay
 * @returns Puantaj özeti
 */
export async function getEmployeeAttendanceSummary(
  employeeId: string, 
  year: number, 
  month: number
): Promise<PayrollAttendance> {
  try {
    // Ayın ilk ve son günleri
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // API'den puantaj verilerini getir
    const response = await axios.get(`${API_URL}/attendance`, {
      params: {
        employeeId,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      },
      timeout: TIMEOUT
    });
    
    const attendanceRecords = response.data;
    
    // Puantaj özetini hesapla
    const summary: PayrollAttendance = {
      fullDayCount: 0,
      halfDayCount: 0,
      leaveCount: 0,
      sickCount: 0,
      absentCount: 0,
      holidayCount: 0,
      weekdayOvertimeHours: 0,
      weekendOvertimeHours: 0,
      holidayOvertimeHours: 0
    };
    
    // Her puantaj kaydını işle
    attendanceRecords.forEach((record: { status: string; notes?: string }) => {
      switch (record.status) {
        case 'G': // Tam gün
          summary.fullDayCount++;
          break;
        case 'Y': // Yarım gün
          summary.halfDayCount++;
          break;
        case 'İ': // İzinli
          summary.leaveCount++;
          break;
        case 'R': // Raporlu
          summary.sickCount++;
          break;
        case 'X': // Gelmedi
          summary.absentCount++;
          break;
        case 'T': // Tatil
          summary.holidayCount = (summary.holidayCount || 0) + 1;
          break;
        case 'M': // Mesai - Bu durumda ek bilgiler (hafta içi/sonu) notes alanından alınabilir
          // Not: Gerçek implementasyonda bu kısım, mesai tipini belirten bir bilgiye göre doldurulmalı
          // Örnek olarak basit bir uygulama:
          if (record.notes?.includes('hafta içi')) {
            summary.weekdayOvertimeHours += parseFloat(record.notes.split(':')[1] || "0");
          } else if (record.notes?.includes('hafta sonu')) {
            summary.weekendOvertimeHours += parseFloat(record.notes.split(':')[1] || "0");
          } else if (record.notes?.includes('tatil')) {
            summary.holidayOvertimeHours += parseFloat(record.notes.split(':')[1] || "0");
          }
          break;
      }
    });
    
    return summary;
    
  } catch (error) {
    console.error('Puantaj özeti alınırken hata oluştu:', error);
    throw new Error("Puantaj verileri alınamadı");
  }
}

/**
 * Ay için maaş hesaplaması yapar
 * @param employeeId Personel ID
 * @param year Yıl
 * @param month Ay
 * @param baseSalary Temel maaş
 * @returns Hesaplanan maaş bilgileri
 */
export async function calculateSalaryForMonth(
  employeeId: string,
  year: number,
  month: number,
  baseSalary: number
): Promise<{
  attendanceDetails: PayrollAttendance;
  calculatedSalary: {
    netAmount: number;
    weekdayOvertimePay: number;
    weekendOvertimePay: number;
    holidayOvertimePay: number;
    totalOvertimePay: number;
  }
}> {
  try {
    // Personelin o ay için puantaj özetini al
    const attendanceDetails = await getEmployeeAttendanceSummary(employeeId, year, month);
    
    // Maaş hesaplaması yap
    const calculatedSalary = calculateSalaryFromAttendance({
      baseSalary,
      workingDaysInMonth: 30, // Varsayılan olarak 30 gün
      dailyWorkingHours: 8,   // Varsayılan olarak 8 saat
      attendanceDetails
    });
    
    return {
      attendanceDetails,
      calculatedSalary
    };
    
  } catch (error) {
    console.error('Maaş hesaplaması yapılırken hata oluştu:', error);
    throw new Error("Maaş hesaplaması yapılamadı");
  }
} 