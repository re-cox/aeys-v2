"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay, addDays, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  X,
  Users,
  MapPin,
  FileText
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Services & Types
import { getAllWorkSchedules, createWorkSchedule } from "@/services/workScheduleService";
import { getAllEmployees } from "@/services/employeeService";
import { getAllDepartments } from "@/services/departmentService";
import { 
  WorkSchedule, 
  WorkScheduleType, 
  WorkScheduleStatus, 
  WorkSchedulePriority, 
  CalendarViewMode,
  WorkScheduleQueryParams,
  NewWorkScheduleData
} from "@/types/workSchedule";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";
import { toast } from "sonner";

// Yardımcı fonksiyonlar ve konfigürasyon
const typeConfig: Record<WorkScheduleType, { label: string, badgeVariant: "default" | "outline" | "secondary" | "destructive" }> = {
  [WorkScheduleType.MAINTENANCE]: { label: "Bakım", badgeVariant: "default" },
  [WorkScheduleType.MEETING]: { label: "Toplantı", badgeVariant: "secondary" },
  [WorkScheduleType.TRAINING]: { label: "Eğitim", badgeVariant: "outline" },
  [WorkScheduleType.SITE_VISIT]: { label: "Saha Ziyareti", badgeVariant: "default" },
  [WorkScheduleType.INSTALLATION]: { label: "Kurulum", badgeVariant: "secondary" },
  [WorkScheduleType.REPAIR]: { label: "Onarım", badgeVariant: "destructive" },
  [WorkScheduleType.OTHER]: { label: "Diğer", badgeVariant: "outline" },
};

const statusConfig: Record<WorkScheduleStatus, { label: string, badgeVariant: "default" | "outline" | "secondary" | "destructive" }> = {
  [WorkScheduleStatus.PLANNED]: { label: "Planlandı", badgeVariant: "outline" },
  [WorkScheduleStatus.IN_PROGRESS]: { label: "Devam Ediyor", badgeVariant: "default" },
  [WorkScheduleStatus.COMPLETED]: { label: "Tamamlandı", badgeVariant: "secondary" },
  [WorkScheduleStatus.CANCELLED]: { label: "İptal Edildi", badgeVariant: "destructive" },
  [WorkScheduleStatus.POSTPONED]: { label: "Ertelendi", badgeVariant: "secondary" },
};

const priorityConfig: Record<WorkSchedulePriority, { label: string, badgeVariant: "default" | "outline" | "secondary" | "destructive" }> = {
  [WorkSchedulePriority.LOW]: { label: "Düşük", badgeVariant: "outline" },
  [WorkSchedulePriority.MEDIUM]: { label: "Orta", badgeVariant: "secondary" },
  [WorkSchedulePriority.HIGH]: { label: "Yüksek", badgeVariant: "destructive" },
};

// Tarih formatlaması
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "dd.MM.yyyy HH:mm", { locale: tr });
};

// İş Programı Sayfası
export default function CalendarPage() {
  // State tanımlamaları
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Görünüm ve tarih navigasyonu
  const [viewMode, setViewMode] = useState<CalendarViewMode>(CalendarViewMode.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({ 
    start: startOfMonth(currentDate), 
    end: endOfMonth(currentDate) 
  });
  
  // Filtreleme 
  const [filters, setFilters] = useState<WorkScheduleQueryParams>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<WorkScheduleType | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<WorkScheduleStatus | "ALL">("ALL");
  const [selectedPriority, setSelectedPriority] = useState<WorkSchedulePriority | "ALL">("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  
  // Modal state
  const [newScheduleOpen, setNewScheduleOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  
  // Yeni program form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    type: WorkScheduleType;
    status: WorkScheduleStatus;
    priority: WorkSchedulePriority;
    departmentId: string;
    startDate: string;
    endDate: string;
    selectedEmployees: string[];
  }>({
    title: "",
    description: "",
    location: "",
    type: WorkScheduleType.MEETING,
    status: WorkScheduleStatus.PLANNED,
    priority: WorkSchedulePriority.MEDIUM,
    departmentId: "",
    startDate: new Date().toISOString().substring(0, 16),
    endDate: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().substring(0, 16),
    selectedEmployees: []
  });
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchData();
  }, []);
  
  // Görünüm modu veya tarih değiştiğinde tarih aralığını güncelle
  useEffect(() => {
    updateDateRange();
  }, [viewMode, currentDate]);

  // Tarih aralığı veya filtre parametreleri değiştiğinde filtreleri güncelle
  useEffect(() => {
    setFilters({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      searchQuery: searchQuery.trim(),
      type: selectedType === "ALL" ? undefined : selectedType as WorkScheduleType,
      status: selectedStatus === "ALL" ? undefined : selectedStatus as WorkScheduleStatus,
      priority: selectedPriority === "ALL" ? undefined : selectedPriority as WorkSchedulePriority,
      departmentId: selectedDepartment === "ALL" ? undefined : selectedDepartment,
      employeeId: selectedEmployee === "ALL" ? undefined : selectedEmployee,
    });
  }, [
    dateRange, 
    searchQuery, 
    selectedType, 
    selectedStatus, 
    selectedPriority, 
    selectedDepartment, 
    selectedEmployee
  ]);
  
  // Filtreler değiştiğinde iş programlarını yükle
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadWorkSchedules();
    }
  }, [filters]);
  
  // Tüm verileri getir
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Çalışan ve departman verilerini getir
      const [employeesData, departmentsData] = await Promise.all([
        getAllEmployees(),
        getAllDepartments()
      ]);
      
      setEmployees(employeesData);
      setDepartments(departmentsData);
      
      // İş programlarını getir
      await loadWorkSchedules();
      
      setError(null);
    } catch (err) {
      console.error("Veri yükleme hatası:", err);
      setError("Veriler yüklenirken bir hata oluştu.");
      toast.error("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
    } finally {
      setLoading(false);
    }
  };
  
  // İş programlarını getir
  const loadWorkSchedules = async () => {
    try {
      setLoading(true);
      
      // API'den verileri getir
      const apiData = await getAllWorkSchedules(filters);
      
      // LocalStorage'dan kayıtlı iş programlarını al
      const savedSchedules = loadSavedSchedules();
      
      // API ve localStorage'dan gelen verileri birleştir, id'lere göre tekrarları önle
      const combinedSchedules = [...apiData];
      
      // Sadece API'de olmayan programları ekle
      savedSchedules.forEach(savedSchedule => {
        if (!combinedSchedules.some(schedule => schedule.id === savedSchedule.id)) {
          combinedSchedules.push(savedSchedule);
        }
      });
      
      setWorkSchedules(combinedSchedules);
      
    } catch (err) {
      console.error("İş programları yükleme hatası:", err);
      toast.error("İş programları yüklenirken bir hata oluştu.");
      
      // API hata verirse sadece localStorage'dan yükle
      const savedSchedules = loadSavedSchedules();
      setWorkSchedules(savedSchedules);
    } finally {
      setLoading(false);
    }
  };
  
  // LocalStorage'a iş programlarını kaydet
  const saveSchedulesToLocalStorage = (schedules: WorkSchedule[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workSchedules', JSON.stringify(schedules));
    }
  };
  
  // LocalStorage'dan iş programlarını yükle
  const loadSavedSchedules = (): WorkSchedule[] => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('workSchedules');
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error("LocalStorage'dan veri çözümlenirken hata:", e);
        }
      }
    }
    return [];
  };
  
  // Tarih aralığını görünüm moduna göre güncelle
  const updateDateRange = () => {
    let start: Date;
    let end: Date;
    
    switch (viewMode) {
      case CalendarViewMode.MONTH:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case CalendarViewMode.WEEK:
        start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Pazartesi başlangıç
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case CalendarViewMode.DAY:
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        break;
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
    }
    
    setDateRange({ start, end });
  };
  
  // Navigasyon fonksiyonları
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const goToPrevious = () => {
    switch (viewMode) {
      case CalendarViewMode.MONTH:
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case CalendarViewMode.WEEK:
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case CalendarViewMode.DAY:
        setCurrentDate(addDays(currentDate, -1));
        break;
    }
  };
  
  const goToNext = () => {
    switch (viewMode) {
      case CalendarViewMode.MONTH:
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case CalendarViewMode.WEEK:
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case CalendarViewMode.DAY:
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };
  
  // Tarih başlığını formatla
  const formatDateRangeTitle = () => {
    switch (viewMode) {
      case CalendarViewMode.MONTH:
        return format(currentDate, "MMMM yyyy", { locale: tr });
      case CalendarViewMode.WEEK:
        return `${format(dateRange.start, "d MMMM", { locale: tr })} - ${format(dateRange.end, "d MMMM yyyy", { locale: tr })}`;
      case CalendarViewMode.DAY:
        return format(currentDate, "d MMMM yyyy", { locale: tr });
      default:
        return format(currentDate, "MMMM yyyy", { locale: tr });
    }
  };
  
  // Filtreleri temizle
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setSelectedPriority("ALL");
    setSelectedDepartment("ALL");
    setSelectedEmployee("ALL");
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      type: WorkScheduleType.MEETING,
      status: WorkScheduleStatus.PLANNED,
      priority: WorkSchedulePriority.MEDIUM,
      departmentId: "",
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().substring(0, 16),
      selectedEmployees: []
    });
  };
  
  // Form değişikliklerini işle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Çoklu seçim (çalışanlar) için değişiklikleri işle
  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      selectedEmployees: selectedOptions
    }));
  };
  
  // Yeni iş programı oluştur
  const handleCreateWorkSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.departmentId || !formData.startDate || !formData.endDate) {
      toast.error("Lütfen gerekli alanları doldurun.");
      return;
    }
    
    try {
      setFormLoading(true);
      
      const newScheduleData: NewWorkScheduleData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        departmentId: formData.departmentId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        employees: formData.selectedEmployees.map(id => ({
          employeeId: id,
          isResponsible: false
        }))
      };
      
      const createdSchedule = await createWorkSchedule(newScheduleData);
      
      toast.success("İş programı başarıyla oluşturuldu.");
      
      // Oluşturulan programı workSchedules state'ine ekle
      // API ile Prisma modeli arasındaki sorun çözülene kadar yerel olarak verileri yönet
      const selectedDepartment = departments.find(d => d.id === formData.departmentId);
      
      const newWorkSchedule: WorkSchedule = {
        id: createdSchedule.id || `tmp-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        departmentId: formData.departmentId,
        department: selectedDepartment,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employees: formData.selectedEmployees.map(employeeId => ({
          id: `tmp-emp-${employeeId}`,
          employee: employees.find(e => e.id === employeeId),
          employeeId: employeeId,
          workScheduleId: createdSchedule.id || `tmp-${Date.now()}`,
          isResponsible: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      };
      
      // Yeni programı ekleyerek workSchedules state'ini güncelle
      const updatedSchedules = [newWorkSchedule, ...workSchedules];
      setWorkSchedules(updatedSchedules);
      
      // LocalStorage'a kaydet
      saveSchedulesToLocalStorage(updatedSchedules);
      
      // Form ve modalı kapat
      resetForm();
      setNewScheduleOpen(false);
      
    } catch (err) {
      console.error("İş programı oluşturma hatası:", err);
      toast.error("İş programı oluşturulurken bir hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">İş Programı</CardTitle>
              <CardDescription>
                İş ve görevlerinizi planlayın, takip edin ve yönetin
              </CardDescription>
        </div>
            
            <div className="flex items-center gap-2">
              <Tabs 
                value={viewMode} 
                onValueChange={(v) => setViewMode(v as CalendarViewMode)}
                className="border rounded-lg p-1"
              >
                <TabsList className="grid grid-cols-3 w-40">
                  <TabsTrigger value={CalendarViewMode.MONTH}>Ay</TabsTrigger>
                  <TabsTrigger value={CalendarViewMode.WEEK}>Hafta</TabsTrigger>
                  <TabsTrigger value={CalendarViewMode.DAY}>Gün</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                variant="outline" 
                className="ml-2"
                onClick={() => setNewScheduleOpen(true)}
              >
                <Plus size={16} className="mr-1" />
                Yeni Program
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tarih navigasyonu */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="border rounded-lg px-4 py-2 min-w-40 text-center">
                <span className="font-medium">{formatDateRangeTitle()}</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2"
              >
                Bugün
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className={`gap-1 ${Object.values(filters).some(Boolean) ? 'text-blue-600' : 'invisible'}`}
              >
                <X size={14} />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          {/* Filtreleme alanı */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                type="text"
                  placeholder="Program ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
            </div>
            
            <div>
              <Select 
                value={selectedType} 
                onValueChange={(value) => setSelectedType(value as WorkScheduleType | "ALL")}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter size={14} />
                    <span className="truncate">Tür Filtrele</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Türler</SelectItem>
                  {Object.keys(WorkScheduleType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeConfig[type as WorkScheduleType].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as WorkScheduleStatus | "ALL")}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter size={14} />
                    <span className="truncate">Durum Filtrele</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                  {Object.keys(WorkScheduleStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status as WorkScheduleStatus].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={selectedDepartment} 
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter size={14} />
                    <span className="truncate">Departman Filtrele</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Departmanlar</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter size={14} />
                    <span className="truncate">Çalışan Filtrele</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Çalışanlar</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} {employee.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* İş programı tablosu */}
          {loading && !workSchedules.length ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : workSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">İş Programı Bulunamadı</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Bu tarih aralığında veya filtrelere uygun bir iş programı kaydı bulunamadı. Filtrelerinizi değiştirmeyi veya yeni bir program eklemeyi deneyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">PROGRAM</TableHead>
                    <TableHead>TÜR/DURUM</TableHead>
                    <TableHead>TARİH/SAAT</TableHead>
                    <TableHead>DEPARTMAN</TableHead>
                    <TableHead>GÖREVLİLER</TableHead>
                    <TableHead>ÖNCELİK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workSchedules.map((workSchedule) => {
                    const typeInfo = typeConfig[workSchedule.type];
                    const statusInfo = statusConfig[workSchedule.status];
                    const priorityInfo = priorityConfig[workSchedule.priority];
                    
                    return (
                      <TableRow 
                        key={workSchedule.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => window.location.href = `/calendar/${workSchedule.id}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">{workSchedule.title}</span>
                            {workSchedule.location && (
                              <span className="text-xs text-muted-foreground">{workSchedule.location}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={typeInfo.badgeVariant}>
                              {typeInfo.label}
                            </Badge>
                            <Badge variant={statusInfo.badgeVariant}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDateTime(workSchedule.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDateTime(workSchedule.endDate)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {workSchedule.department?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {workSchedule.employees?.map((employee) => (
                              <Badge key={employee.id} variant="outline">
                                {employee.employee?.name} {employee.employee?.surname}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityInfo.badgeVariant}>
                            {priorityInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni İş Programı Modal */}
      <Dialog open={newScheduleOpen} onOpenChange={setNewScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni İş Programı Oluştur</DialogTitle>
            <DialogDescription>
              İş programı detaylarını girin ve oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateWorkSchedule} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Program Başlığı <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Program başlığını girin"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Program Türü <span className="text-red-500">*</span></Label>
                  <Select 
                    name="type" 
                    value={formData.type} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as WorkScheduleType }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Program türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkScheduleType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeConfig[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Departman <span className="text-red-500">*</span></Label>
                  <Select 
                    name="departmentId" 
                    value={formData.departmentId} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, departmentId: val }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Departman seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select 
                    name="priority" 
                    value={formData.priority} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val as WorkSchedulePriority }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkSchedulePriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priorityConfig[priority].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select 
                    name="status" 
                    value={formData.status} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as WorkScheduleStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WorkScheduleStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusConfig[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi <span className="text-red-500">*</span></Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi <span className="text-red-500">*</span></Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Konum</Label>
                <div className="flex items-center border rounded-md">
                  <MapPin className="w-4 h-4 ml-3 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    placeholder="Konum bilgisi (opsiyonel)"
                    value={formData.location}
                    onChange={handleFormChange}
                    className="border-0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <div className="flex items-start border rounded-md">
                  <FileText className="w-4 h-4 ml-3 mt-3 text-gray-400" />
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Program açıklaması (opsiyonel)"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="border-0 min-h-20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selectedEmployees">Görevli Çalışanlar</Label>
                <div className="flex items-center border rounded-md">
                  <Users className="w-4 h-4 ml-3 text-gray-400" />
                  <select 
                    id="selectedEmployees" 
                    name="selectedEmployees" 
                    multiple
                    value={formData.selectedEmployees}
                    onChange={handleEmployeeSelect}
                    className="w-full p-2 border-0 focus:outline-none min-h-24"
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} {employee.surname}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Birden fazla çalışan seçmek için CTRL tuşuna basılı tutarak seçim yapın.</p>
            </div>
          </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewScheduleOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}