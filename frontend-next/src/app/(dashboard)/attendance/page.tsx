"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ChevronLeft, ChevronRight, Clock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { getAllEmployees } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { 
  getAttendanceRecords, 
  addAttendanceRecord,
  updateAttendanceRecord
} from '@/services/attendanceService';
import { AttendanceRecord } from '@/types/attendance';

export type AttendanceStatus = 'G' | 'Y' | 'İ' | 'R' | 'X' | 'T';

// Durum konfigürasyonları
const attendanceStatusConfig: {
  [key in AttendanceStatus]: {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    description: string;
  }
} = {
  'G': {
    label: 'Tam Gün',
    shortLabel: 'G',
    color: 'text-white bg-green-500',
    bgColor: 'bg-green-500 hover:bg-green-600',
    description: 'Personel tam gün işe geldi'
  },
  'Y': {
    label: 'Yarım Gün',
    shortLabel: 'Y',
    color: 'text-white bg-yellow-500',
    bgColor: 'bg-yellow-500 hover:bg-yellow-600',
    description: 'Personel yarım gün işe geldi'
  },
  'İ': {
    label: 'İzinli',
    shortLabel: 'İ',
    color: 'text-white bg-blue-500',
    bgColor: 'bg-blue-500 hover:bg-blue-600',
    description: 'Personel izinli'
  },
  'R': {
    label: 'Raporlu',
    shortLabel: 'R',
    color: 'text-white bg-purple-500',
    bgColor: 'bg-purple-500 hover:bg-purple-600',
    description: 'Personel raporlu'
  },
  'X': {
    label: 'Gelmedi',
    shortLabel: 'X',
    color: 'text-white bg-red-500',
    bgColor: 'bg-red-500 hover:bg-red-600',
    description: 'Personel işe gelmedi'
  },
  'T': {
    label: 'Tatil',
    shortLabel: 'T',
    color: 'text-white bg-gray-500',
    bgColor: 'bg-gray-500 hover:bg-gray-600',
    description: 'Resmi tatil/hafta sonu'
  }
};

// Mesai rengi - kullanıma hazır
const overtimeConfig = {
  label: 'Mesai',
  shortLabel: 'M',
  color: 'text-white bg-orange-500',
  bgColor: 'bg-orange-500 hover:bg-orange-600',
  description: 'Personel mesai yaptı'
};

export default function AttendancePage() {
  // Durum state'leri
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Mesai dialogu için state'ler
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    userId: string;
    date: string;
    status: AttendanceStatus | null;
    hasOvertime?: boolean;
    overtimeStart?: string;
    overtimeEnd?: string;
    isHoliday?: boolean;
    notes?: string | null;
  } | null>(null);

  // Yardımcı değişkenler
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Ayın gün sayısını hesapla
  const daysInMonth = useMemo(() => {
    return new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  }, [currentDate]);

  // Haftasonu kontrolü
  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Pazar, 6 = Cumartesi
  };

  // Bugün kontrolü
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  // Tarih için key oluştur (YYYY-MM-DD formatında)
  const formatDateForKey = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Sonraki ay
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Önceki ay
  const previousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Belirli bir personel ve gün için kayıt getir
  const getAttendanceRecord = (userId: string, day: number) => {
    const dateKey = formatDateForKey(day);
    return attendanceRecords.find(
      record => record.userId === userId && record.date === dateKey
    );
  };

  // Durum metni
  const getAttendanceStatusText = (userId: string, day: number) => {
    const record = attendanceRecords.find(
      record => record.userId === userId && record.date === formatDateForKey(day)
    );
    
    if (!record) {
      return 'Belirtilmemiş';
    }
    
    return attendanceStatusConfig[record.status]?.label || 'Belirtilmemiş';
  };

  // Mesai metni
  const getOvertimeText = (userId: string, day: number) => {
    const record = attendanceRecords.find(
      record => record.userId === userId && record.date === formatDateForKey(day)
    );
    
    if (!record || !record.hasOvertime) {
      return 'Yok';
    }
    
    return `${record.overtimeStart || '??:??'} - ${record.overtimeEnd || '??:??'}`;
  };

  // Mesai durumu sınıf oluşturucu - Mesai olsa bile ana durum rengini göster
  const getAttendanceStatusClass = (userId: string, day: number) => {
    const record = getAttendanceRecord(userId, day);
    
    if (!record) {
      // Kayıt yoksa varsayılan stil
      return 'bg-gray-200 dark:bg-gray-700'; 
    }
    
    // Her zaman ana durumun rengini döndür
    const statusConfig = attendanceStatusConfig[record.status];
    return statusConfig.bgColor;
  };

  // Mesai ve durum birlikte gösterilecek içerik
  const getAttendanceContent = (userId: string, day: number) => {
    const record = getAttendanceRecord(userId, day);
    
    if (!record) {
      return ''; // Kayıt yoksa boş
    }
    
    // Mesai varsa ikonları ekle
    if (record.hasOvertime) {
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Durum Karakteri */} 
          <span className="font-bold">{record.status}</span>
          
          {/* Mesai İkonu ('M') - Sol üst köşe */}
          <span 
            className="absolute -top-0.5 left-0.5 text-[7px] leading-none font-extrabold opacity-80"
            title={overtimeConfig.description} // Tooltip için başlık
          >
            M
          </span>

          {/* Resmi Tatil İkonu (👑) - Sağ üst köşe */} 
          {record.isHoliday && (
            <span 
              className="absolute -top-0.5 right-0.5 text-[7px] leading-none"
              title="Resmi Tatil Mesaisi" // Tooltip için başlık
            >
              👑
            </span>
          )}
        </div>
      );
    }
    
    // Sadece durum karakteri
    return record.status;
  };

  // Mesai diyaloğunu aç
  const openOvertimeDialog = (userId: string, day: number) => {
    const dateKey = formatDateForKey(day);
    
    const existingRecord = attendanceRecords.find(
      record => record.userId === userId && record.date === dateKey
    );

    setSelectedCell({
      userId,
      date: dateKey,
      status: existingRecord?.status || null,
      hasOvertime: existingRecord?.hasOvertime || false,
      overtimeStart: existingRecord?.overtimeStart || '',
      overtimeEnd: existingRecord?.overtimeEnd || '',
      isHoliday: existingRecord?.isHoliday || false,
      notes: existingRecord?.notes || null
    });
    
    setOvertimeDialogOpen(true);
  };

  // Mesai bilgilerini kaydet veya durumu güncelle
  const saveOvertime = async (newStatus?: AttendanceStatus) => {
    if (!selectedCell) return;

    setLoading(true);
    try {
      const { userId, date, overtimeStart, overtimeEnd, notes } = selectedCell;
      const currentStatus = selectedCell.status; // Mevcut durum
      const finalStatus = newStatus || currentStatus; // Yeni durum veya mevcut durum
      const hasOvertime = !!(overtimeStart || overtimeEnd); // Mesai var mı?

      // Backend'e gönderilecek veri objesi
      const recordData: Partial<Omit<AttendanceRecord, 'id'>> = {
        userId,
        date,
        status: finalStatus || undefined, // Eğer finalStatus null ise gönderme
        hasOvertime,
        overtimeStart: hasOvertime ? overtimeStart : null,
        overtimeEnd: hasOvertime ? overtimeEnd : null,
        notes: notes || null,
      };

      // O güne ait kayıt var mı kontrol et
      const existingRecord = attendanceRecords.find(
        record => record.userId === userId && record.date === date
      );

      let savedRecord: AttendanceRecord;

      if (existingRecord) {
        // Kayıt varsa güncelle
        console.log("[AttendancePage] Varolan kayıt güncelleniyor:", existingRecord.id, recordData);

        // Backend'e gönderilecek güncelleme verisi
        const updatePayload: Partial<Omit<AttendanceRecord, 'id'>> = {
          userId,
          date,
          // status alanı aşağıda koşullu olarak eklenecek
          hasOvertime,
          overtimeStart: hasOvertime ? overtimeStart : null,
          overtimeEnd: hasOvertime ? overtimeEnd : null,
          notes: notes || null,
        };

        // Sadece finalStatus geçerli bir değerse payload'a ekle
        if (finalStatus !== undefined && finalStatus !== null) {
          updatePayload.status = finalStatus;
        }

        savedRecord = await updateAttendanceRecord(existingRecord.id, updatePayload);
        // Lokal state'i güncelle
        setAttendanceRecords(prev =>
          prev.map(r => r.id === existingRecord.id ? savedRecord : r)
        );
        toast.success("Puantaj kaydı güncellendi.");
      } else if (finalStatus) { // Yeni kayıt sadece bir durum varsa oluşturulur
        // Kayıt yoksa ve bir durum seçilmişse yeni kayıt oluştur
        // finalStatus zorunlu, type guard için kontrol
        const newRecordData: Omit<AttendanceRecord, 'id'> = {
           userId,
           date,
           status: finalStatus, // finalStatus burada null olamaz
           hasOvertime,
           overtimeStart: hasOvertime ? overtimeStart : null,
           overtimeEnd: hasOvertime ? overtimeEnd : null,
           notes: notes || null,
        };
        console.log("[AttendancePage] Yeni kayıt oluşturuluyor:", newRecordData);
        savedRecord = await addAttendanceRecord(newRecordData);
         // Lokal state'e ekle
        setAttendanceRecords(prev => [...prev, savedRecord]);
        toast.success("Puantaj kaydı eklendi.");
      } else {
        // Kayıt yok ve durum da seçilmemiş (örn. sadece mesai girildi ama durum yok)
        // Bu durumda backend'in varsayılan bir status ataması GEREKEBİLİR
        // Veya kullanıcıya bir durum seçmesi gerektiği uyarısı verilebilir.
        // Şimdilik sadece mesai girildiyse ama status yoksa işlem yapmayalım veya hata verelim.
        toast.warning("Yeni kayıt oluşturmak için lütfen bir durum seçin.");
        console.warn("[AttendancePage] Yeni kayıt oluşturulamadı: Durum belirtilmemiş.");
         setLoading(false);
        setOvertimeDialogOpen(false);
        return; // İşlemi durdur
      }

      // Başarılı kayıt sonrası dialogu kapat ve state'i sıfırla
      setOvertimeDialogOpen(false);
      setSelectedCell(null);

    } catch (error: any) {
      console.error("Puantaj kaydedilirken hata:", error);
      toast.error(`Hata: ${error.message || 'Puantaj kaydedilemedi.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Modal içerisinden durum değişikliği (sadece status günceller, mesaiyi etkilemez)
  const handleModalStatusChange = async (newStatus: AttendanceStatus) => {
    if (!selectedCell) return;
    // Bu fonksiyon saveOvertime'ı çağırarak hem status güncellemesini hem de
    // mevcut mesai bilgilerini koruyarak kaydetmeyi sağlar.
    await saveOvertime(newStatus);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Personel verilerini getir
        console.log("[AttendancePage] Personel verileri alınıyor...");
        const employeeData = await getAllEmployees();
        console.log(`[AttendancePage] ${employeeData.length} personel verisi alındı.`);
        
        if (!Array.isArray(employeeData)) {
          throw new Error('Personel verisi alınamadı (Geçersiz format).');
        }
        
        const sortedEmployees = [...employeeData].sort((a, b) => {
            const nameA = (a.name || '') + ' ' + (a.surname || ''); 
            const nameB = (b.name || '') + ' ' + (b.surname || '');
            return nameA.localeCompare(nameB, 'tr');
        });
        setEmployees(sortedEmployees);
        setFilteredEmployees(sortedEmployees);

        // Puantaj verilerini getir (yeni servisi kullanarak)
        const startDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
        const endDate = formatDateForKey(daysInMonth);
        console.log(`[AttendancePage] Puantaj verileri alınıyor: ${startDate} - ${endDate}`);
        
        // getAttendanceRecords servisini kullan
        const attendanceData = await getAttendanceRecords(startDate, endDate);
        console.log(`[AttendancePage] ${attendanceData.length} puantaj kaydı alındı (servis aracılığıyla).`);
        setAttendanceRecords(attendanceData);

      } catch (error) {
        console.error('[AttendancePage] Veri yükleme hatası:', error);
        toast.error(error instanceof Error ? error.message : "Veriler yüklenirken bir hata oluştu.");
        setEmployees([]);
        setFilteredEmployees([]);
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentDate, daysInMonth]);

  useEffect(() => {
    let result = [...employees];
    
    if (searchTerm && result.length > 0) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.name || '').toLowerCase().includes(searchLower) || 
        (emp.position || '').toLowerCase().includes(searchLower) ||
        (emp.surname || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (departmentFilter && result.length > 0) {
      result = result.filter(emp => emp.department?.name === departmentFilter);
    }
    
    setFilteredEmployees(result);
  }, [employees, searchTerm, departmentFilter]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          Puantaj Yönetimi
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Personel devam ve mesai kayıtları
        </p>
      </div>

      {/* Kontrol Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Tarih Navigasyonu */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tarih Seçimi</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
            <div className="text-center">
              <h2 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="ml-3">
              Bugün
            </Button>
          </CardContent>
        </Card>

        {/* Arama ve Filtreleme */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filtrele</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Personel adı, soyadı veya pozisyon ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-10"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Tüm Departmanlar</option>
              {Array.from(new Set(employees.map(emp => emp.department?.name))).filter(Boolean).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          </CardContent>
        </Card>
      </div>
      
      {/* Durum Kodları */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Durum Kodları</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
        {Object.entries(attendanceStatusConfig).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-1.5 ${value.bgColor.split(' ')[0]}`}></span> 
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{value.label} ({value.shortLabel})</span>
            </div>
          ))}
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-1.5 ${overtimeConfig.bgColor.split(' ')[0]}`}></span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{overtimeConfig.label} ({overtimeConfig.shortLabel})</span>
          </div>
          <div className="flex items-center ml-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400">👑 Resmi Tatil Mesaisi</span>
      </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th 
                    scope="col"
                    className="sticky left-0 z-10 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 min-w-[160px]"
                  >
                    Personel
                  </th>
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    return (
                      <th 
                        key={day} 
                        scope="col"
                        className={`px-0 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-6 
                          ${isWeekend(day) ? 'bg-gray-100 dark:bg-gray-700/50' : ''}
                          ${isToday(day) ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300' : ''}
                        `}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee, empIndex) => (
                  <tr key={employee.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${empIndex % 2 !== 0 ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''}`}>
                    <td 
                      className="sticky left-0 z-10 px-2 py-2 whitespace-nowrap bg-inherit border-r border-gray-200 dark:border-gray-700 min-w-[160px]"
                    >
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.name} {employee.surname}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                          {employee.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const record = getAttendanceRecord(employee.id, day);
                      return (
                        <td 
                          key={day} 
                          className={`px-0 py-1 text-center relative border-l border-gray-200 dark:border-gray-700 w-6 
                            ${isWeekend(day) ? 'bg-gray-100/50 dark:bg-gray-700/30' : ''}
                            ${isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}
                          `}
                        >
                          <div className="flex justify-center items-center gap-0 mx-auto" style={{ minWidth: '32px' }}>
                            {/* Durum dairesini sadece kayıt varsa göster */}
                            {record && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] leading-none hover:opacity-90 transition-opacity duration-150 ${getAttendanceStatusClass(employee.id, day)}`}
                                      onClick={() => openOvertimeDialog(employee.id, day)}
                                    >
                                      <span className="block text-center w-full">{getAttendanceContent(employee.id, day)}</span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="text-xs">
                                      <p className="font-semibold">{employee.name} {employee.surname}</p>
                                      <p>{formatDateForKey(day)}</p>
                                      <p>Durum: {getAttendanceStatusText(employee.id, day)}</p>
                                      <p>Mesai: {getOvertimeText(employee.id, day)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Saat ikonunu sadece kayıt yoksa göster */}
                            {!record && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="flex-shrink-0 h-6 w-6 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-sm p-0 mx-auto"
                                onClick={() => openOvertimeDialog(employee.id, day)}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mesai Diyaloğu */}
      <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesai Bilgisi</DialogTitle>
            <DialogDescription>
              {selectedCell && 
                `${employees.find(e => e.id === selectedCell.userId)?.name || ''} 
                ${employees.find(e => e.id === selectedCell.userId)?.surname || ''} - 
                ${selectedCell.date}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Puantaj Durumları - Grid Yapısı */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'G' ? 'ring-2 ring-offset-2 ring-green-500 shadow-md' : ''} 
                  bg-green-500 hover:bg-green-600`}
                onClick={() => handleModalStatusChange('G')}
              >
                tam gün
              </button>
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'X' ? 'ring-2 ring-offset-2 ring-red-500 shadow-md' : ''} 
                  bg-red-500 hover:bg-red-600`}
                onClick={() => handleModalStatusChange('X')}
              >
                gelmedi
              </button>
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'İ' ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' : ''} 
                  bg-blue-500 hover:bg-blue-600`}
                onClick={() => handleModalStatusChange('İ')}
              >
                izinli
              </button>
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'R' ? 'ring-2 ring-offset-2 ring-purple-500 shadow-md' : ''} 
                  bg-purple-500 hover:bg-purple-600`}
                onClick={() => handleModalStatusChange('R')}
              >
                Raporlu
              </button>
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'Y' ? 'ring-2 ring-offset-2 ring-yellow-500 shadow-md' : ''} 
                  bg-yellow-500 hover:bg-yellow-600`}
                onClick={() => handleModalStatusChange('Y')}
              >
                yarım gün
              </button>
              <button
                type="button"
                className={`p-2 rounded-md text-white text-sm font-medium 
                  ${selectedCell?.status === 'T' ? 'ring-2 ring-offset-2 ring-gray-500 shadow-md' : ''} 
                  bg-gray-500 hover:bg-gray-600`}
                onClick={() => handleModalStatusChange('T')}
              >
                tatil
              </button>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="hasOvertime" 
                checked={selectedCell?.hasOvertime || false}
                onCheckedChange={(checked) => {
                  if (selectedCell) {
                    setSelectedCell({
                      ...selectedCell,
                      hasOvertime: checked === true
                    });
                  }
                }}
              />
              <Label htmlFor="hasOvertime" className="ml-2">
                Mesai var
              </Label>
            </div>
            
            {selectedCell?.hasOvertime && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="overtimeStart">Başlangıç Saati</Label>
                    <Input 
                      id="overtimeStart" 
                      type="time"
                      value={selectedCell?.overtimeStart || ''}
                      onChange={(e) => {
                        if (selectedCell) {
                          setSelectedCell({
                            ...selectedCell,
                            overtimeStart: e.target.value
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="overtimeEnd">Bitiş Saati</Label>
                    <Input 
                      id="overtimeEnd" 
                      type="time"
                      value={selectedCell?.overtimeEnd || ''}
                      onChange={(e) => {
                        if (selectedCell) {
                          setSelectedCell({
                            ...selectedCell,
                            overtimeEnd: e.target.value
                          });
                        }
                      }}
                    />
            </div>
          </div>
                
                <div className="flex items-center">
                  <Checkbox 
                    id="isHoliday" 
                    checked={selectedCell?.isHoliday || false}
                    onCheckedChange={(checked) => {
                      if (selectedCell) {
                        setSelectedCell({
                          ...selectedCell,
                          isHoliday: checked === true
                        });
                      }
                    }}
                  />
                  <Label htmlFor="isHoliday" className="ml-2">
                    Resmi Tatil
                  </Label>
        </div>
              </>
            )}
          </div>
          
          {/* Notlar Input Alanı (YENİ) */}
          <div className="flex flex-col space-y-2 mt-4">
            <Label htmlFor="notes">Notlar</Label>
            <Input 
              id="notes" 
              placeholder="Puantaj ile ilgili notlar..."
              value={selectedCell?.notes || ''}
              onChange={(e) => {
                if (selectedCell) {
                  setSelectedCell({
                    ...selectedCell,
                    notes: e.target.value || null
                  });
                }
              }}
            />
          </div>
            
          <DialogFooter>
            <Button variant="outline" onClick={() => setOvertimeDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => saveOvertime()}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 