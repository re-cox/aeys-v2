"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PayrollAttendance } from "@/types/salaryPayment";
import { AttendanceBasedCalculation } from "@/components/salary-calculation/attendance-based-calculation";

export default function SalaryCalculationPage() {
  const router = useRouter();
  
  // Yeni hesaplama sonucunu işle
  const handleCalculationComplete = (
    employeeId: string, 
    month: string, 
    attendanceData: PayrollAttendance, 
    calculatedSalary: {
      netAmount: number;
      weekdayOvertimePay: number;
      weekendOvertimePay: number;
      holidayOvertimePay: number;
      totalOvertimePay: number;
    }
  ) => {
    console.log("Hesaplama tamamlandı:", {
      employeeId,
      month,
      attendanceData,
      calculatedSalary
    });
  };

  // Kaydedilen maaş ödemesine yönlendir
  const handleSaveComplete = (newPaymentId: string) => {
    // Maaş ödeme sayfasına yönlendir ve listeyi yenile
    toast.success("Maaş ödemesi kaydedildi, yönlendiriliyor...");
    
    // Başarıyla yenilendikten sonra ödeme detayına yönlendir
    router.push(`/salary-calculation/${newPaymentId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Puantaj Tabanlı Maaş Hesaplama
        </h1>
      </div>
      
      <AttendanceBasedCalculation 
        onCalculationComplete={handleCalculationComplete}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
} 