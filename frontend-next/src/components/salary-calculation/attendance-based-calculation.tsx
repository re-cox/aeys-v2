"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calculator, Info, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { calculateEmployeeSalary } from "@/services/salaryCalculationService";
import { SalaryCalculationResult } from "@/types/salaryCalculation";
import { Employee } from "@/types/employee";
import { AttendanceRecord } from "@/types/attendance";
import { getAllEmployees } from "@/services/employeeService";
import { apiClient } from "@/services/api";

// Türkçe ay adları
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export function AttendanceBasedCalculation() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [calculationResults, setCalculationResults] = useState<SalaryCalculationResult[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Yılları oluştur (örneğin, son 5 yıl)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Tarih formatlama fonksiyonu
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Çalışanları yükle
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      setErrorMessage(null);
      try {
        const data = await getAllEmployees(true);
        setEmployees(data);
        if (data.length === 0) {
             setErrorMessage("Sistemde kayıtlı çalışan bulunamadı.");
        }
      } catch (error) {
        console.error("Çalışanlar yüklenirken hata:", error);
        const message = error instanceof Error ? error.message : 'Çalışan yüklenirken bilinmeyen hata';
        setErrorMessage(`Çalışanlar yüklenemedi: ${message}`);
        toast.error(`Çalışanlar yüklenemedi: ${message}`);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Puantaj verilerini yükle (ay/yıl değiştiğinde)
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      setLoadingAttendance(true);
      setErrorMessage('');
      
      const startOfMonth = new Date(Number(selectedYear), Number(selectedMonth) - 1, 1);
      const endOfMonth = new Date(Number(selectedYear), Number(selectedMonth), 0);
      
      const startDateFormatted = formatDate(startOfMonth);
      const endDateFormatted = formatDate(endOfMonth);
      
      console.log(`Fetching attendance for period: ${startDateFormatted} to ${endDateFormatted}`);
      
      setCalculationResults([]);
      setAllAttendance([]);
      
      const fetchAttendance = async () => {
        try {
          const response = await apiClient.get<AttendanceRecord[]>(
            `/attendances?startDate=${startDateFormatted}&endDate=${endDateFormatted}`
          );
          console.log(`Received ${response.data.length} attendance records for ${selectedYear}-${selectedMonth}`);
          setAllAttendance(response.data);
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            setErrorMessage(`Puantaj kayıtları yüklenirken hata oluştu: ${message}`);
            toast.error(`Puantaj kayıtları yüklenirken hata oluştu: ${message}`);
            setAllAttendance([]);
        } finally {
            setLoadingAttendance(false);
        }
      };

      fetchAttendance();

    }
  }, [selectedYear, selectedMonth]);

  // Otomatik Hesaplama Tetikleyicisi
  useEffect(() => {
    // Çalışanlar ve o aya ait puantaj verisi yüklendiyse ve hesaplama yapılmıyorsa
    if (employees.length > 0 && allAttendance.length > 0 && !loadingEmployees && !loadingAttendance && !calculating) {
      handleCalculateSalaries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [employees, allAttendance, loadingEmployees, loadingAttendance]); // calculating'i bağımlılıklara eklemeyin, sonsuz döngüye girer

  // Maaşları Hesapla (Artık useEffect tarafından tetikleniyor)
  const handleCalculateSalaries = () => {
    // Veri kontrolleri başa taşındı, useEffect içinde zaten kontrol ediliyor ama burada da kalabilir.
    if (!employees.length || !allAttendance.length) {
      // toast.info("Hesaplama için gerekli veriler eksik."); // Otomatik çalıştığı için bu toast gereksiz olabilir.
      return;
    }

    setCalculating(true);
    console.log(`${selectedYear}-${selectedMonth} ayı için maaş hesaplama başlatılıyor...`);
    
    try {
      const results: SalaryCalculationResult[] = employees
        .map(emp => {
          if (typeof emp.salary !== 'number' || emp.salary <= 0) {
            // console.warn(`${emp.name} ${emp.surname} için maaş bilgisi eksik, hesaplama atlanıyor.`);
            return null; 
          }
          const employeeAttendance = allAttendance.filter(att => att.userId === emp.id);
          
          // Seçilen aya ait puantaj bilgilerini kullandığımızdan emin olalım
          console.log(`${emp.name} için ${employeeAttendance.length} puantaj kaydı bulundu (${selectedYear}-${selectedMonth})`);
          
          return calculateEmployeeSalary(
            emp, 
            employeeAttendance, 
            parseInt(selectedYear),
            parseInt(selectedMonth)
          );
        })
        .filter((result): result is SalaryCalculationResult => result !== null);
      
      setCalculationResults(results);
      console.log(`${selectedYear}-${selectedMonth} ayı için ${results.length} çalışanın maaşı hesaplandı.`);
    } catch (error) {
      console.error(`${selectedYear}-${selectedMonth} ayı için maaş hesaplama hatası:`, error);
      toast.error("Maaşlar hesaplanırken bir hata oluştu.");
    } finally {
      setCalculating(false);
    }
  };

  // Sonuç Tablosunu Render Et
  const renderResultsTable = () => {
    if (loadingEmployees || loadingAttendance) {
        return <div className="text-center p-4 text-gray-500">Veriler yükleniyor...</div>;
    }
    if (calculating) {
        return <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /> Hesaplama yapılıyor...</div>;
    }
    if (!calculationResults.length) {
      // Eğer veri yüklendi ama sonuç yoksa (örn. hiç geçerli maaş yoksa) bilgi ver
      return <div className="text-center p-4 text-gray-500">Hesaplanacak veri bulunamadı.</div>; 
    }
    
    return (
      <div className="overflow-x-auto mt-6 border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead className="sticky left-0 bg-inherit z-10 min-w-[150px] px-2">Personel</TableHead>
              <TableHead className="px-1 text-right">Maaş</TableHead>
              <TableHead className="px-1 text-center w-16">Geldiği Gün</TableHead>
              <TableHead className="px-1 text-center w-16">Yarım Gün</TableHead>
              <TableHead className="px-1 text-center w-16">İzinli Gün</TableHead>
              <TableHead className="px-1 text-center w-16">Raporlu Gün</TableHead>
              <TableHead className="px-1 text-center w-16">Gelmediği Gün</TableHead>
              <TableHead className="px-1 text-center w-24">H.İçi Mesai <br/>(Saat)</TableHead>
              <TableHead className="px-1 text-center w-24">H.Sonu Mesai <br/>(Saat)</TableHead>
              <TableHead className="px-1 text-center w-24">R.Tatil Mesai <br/>(Saat)</TableHead>
              <TableHead className="px-1 text-right">Hesaplanan Maaş</TableHead>
              <TableHead className="px-1 text-right">Mesai Toplam</TableHead>
              <TableHead className="sticky right-0 bg-inherit z-10 min-w-[150px] px-2 text-right">Toplam Maaş</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculationResults.map((result) => (
              <TableRow key={result.employeeId}>
                <TableCell className="sticky left-0 bg-inherit z-10 font-medium px-2">
                  {result.employeeName} {result.employeeSurname}
                </TableCell>
                <TableCell className="px-1 text-right">{formatCurrency(result.baseSalary)}</TableCell>
                <TableCell className="px-1 text-center">{result.attendanceCounts.fullDays}</TableCell>
                <TableCell className="px-1 text-center">{result.attendanceCounts.halfDays}</TableCell>
                <TableCell className="px-1 text-center">{result.attendanceCounts.leaveDays}</TableCell>
                <TableCell className="px-1 text-center">{result.attendanceCounts.reportDays}</TableCell>
                <TableCell className="px-1 text-center">{result.attendanceCounts.absentDays}</TableCell>
                <TableCell className="px-1 text-center">{result.overtimeDetails.weekdayHours.toFixed(1)}</TableCell>
                <TableCell className="px-1 text-center">{result.overtimeDetails.weekendHours.toFixed(1)}</TableCell>
                <TableCell className="px-1 text-center">{result.overtimeDetails.holidayHours.toFixed(1)}</TableCell>
                <TableCell className="px-1 text-right">{formatCurrency(result.calculatedSalary)}</TableCell>
                <TableCell className="px-1 text-right">{formatCurrency(result.overtimeDetails.totalOvertimePay)}</TableCell>
                <TableCell className="sticky right-0 bg-inherit z-10 font-semibold px-2 text-right">
                  {formatCurrency(result.totalPayable)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Puantaj Tabanlı Maaş Özeti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Hesaplama Parametreleri */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="year-select">Yıl:</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={loadingAttendance || calculating}>
                <SelectTrigger id="year-select" className="w-[100px]">
                  <SelectValue placeholder="Yıl" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="month-select">Ay:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={loadingAttendance || calculating}>
                <SelectTrigger id="month-select" className="w-[100px]">
                  <SelectValue placeholder="Ay" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={month.toString()}>{MONTHS_TR[index]}</SelectItem> 
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Sonuçlar */}
          {renderResultsTable()}
          
          {/* Bilgi Metni */}
          {!loadingEmployees && !loadingAttendance && !calculating && calculationResults.length === 0 && (
            <div className="flex items-start p-4 text-sm rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 mt-4">
              <Info className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Seçili ay ve yıl için maaşlar otomatik olarak hesaplanacaktır. Hesaplama, kaydedilmiş puantaj verilerine ve personellerin maaş bilgilerine göre yapılır. Henüz veri yükleniyor veya hesaplanacak veri bulunamıyor olabilir.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 