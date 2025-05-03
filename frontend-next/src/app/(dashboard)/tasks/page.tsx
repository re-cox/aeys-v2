"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, X, Pencil, Trash2, Loader2, CheckCircle, AlertCircle, Clock, Ban, ChevronsUpDown, Check, ChevronDown, ChevronRight, Eye } from "lucide-react";
import { getAllTasks, createTask, updateTask, deleteTask } from "@/services/taskService";
import { getAllEmployees } from "@/services/employeeService"; // Çalışanları çekmek için
import { getAllProjects } from "@/services/projectService"; // Projeleri çekmek için
import { toast } from "sonner";
import { Task, NewTaskData, UpdateTaskData } from "@/types/task";
import { Employee } from "@/types/employee";
import { Project } from "@/types/project"; // Project tipini import et
import { TaskStatus, TaskPriority } from "@prisma/client"; // Enumları kullan

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter, 
  SheetClose 
} from "@/components/ui/sheet"; // Form için Sheet kullanacağız
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"; // Çalışan seçimi için Combobox
import { cn } from "@/lib/utils";
import Link from "next/link";
// import { 
//   DatePicker 
// } from "@/components/ui/date-picker"; // Geçici olarak yorum satırı

// Status ve priority yapılandırmaları (ikonlar ve daha iyi renklerle)
const statusConfig: Record<TaskStatus, { color: string; text: string; icon: React.ElementType }> = {
  [TaskStatus.TODO]: { color: 'border-gray-500 text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', text: 'Yapılacak', icon: Clock },
  [TaskStatus.IN_PROGRESS]: { color: 'border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300', text: 'Devam Ediyor', icon: Loader2 }, // Animate spin eklenebilir
  [TaskStatus.REVIEW]: { color: 'border-yellow-500 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300', text: 'İncelemede', icon: Search },
  [TaskStatus.COMPLETED]: { color: 'border-green-500 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300', text: 'Tamamlandı', icon: CheckCircle },
  [TaskStatus.CANCELLED]: { color: 'border-red-500 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300', text: 'İptal', icon: Ban },
};

const priorityConfig: Record<TaskPriority, { color: string; text: string; icon: React.ElementType }> = {
  [TaskPriority.LOW]: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: 'Düşük', icon: ChevronDown },
  [TaskPriority.MEDIUM]: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', text: 'Orta', icon: ChevronRight }, // İkon değiştirilebilir
  [TaskPriority.HIGH]: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', text: 'Yüksek', icon: ChevronRight }, // İkon değiştirilebilir
  [TaskPriority.URGENT]: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', text: 'Acil', icon: AlertCircle },
};

const initialFormData: NewTaskData = {
    title: "",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    assigneeIds: [],
    projectId: null,
};

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); // Employee tipini kullan
  const [projects, setProjects] = useState<Project[]>([]); // Projeler için state
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "">("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<NewTaskData>(initialFormData);
  const [employeeSearch, setEmployeeSearch] = useState(""); // Combobox için
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]); // Birden fazla atanan ID'si

  // Verileri Yükle
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setLoadingError(null);
      try {
        console.log('[TaskPage] Loading initial data...');
        // Promise.all ile paralel yükleme
        const [, employeesData, projectsData] = await Promise.all([
          loadTasks(), // Görevleri ayrı fonksiyonla yükle
          getAllEmployees(),
          getAllProjects()
        ]);
        console.log('[TaskPage] Employees data:', employeesData);
        console.log('[TaskPage] Projects data received:', projectsData);
        
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
        if (Array.isArray(projectsData)) {
          setProjects(projectsData);
          console.log('[TaskPage] Projects state set successfully.');
        } else {
          console.error('[TaskPage] Projects data is not an array! Setting projects to empty array.', projectsData);
          setProjects([]); 
          setLoadingError("Proje verileri alınamadı veya hatalı formatta.");
          toast.error("Proje verileri yüklenirken bir sorun oluştu.");
        }
      } catch (err) {
        // Hata zaten loadTasks içinde veya diğer Promise'larda ele alınmış olabilir,
        // ama genel bir yedek loglama yapabiliriz.
        if (!loadingError) { // Eğer loadTasks'dan hata gelmediyse
          console.error("İlk veri yükleme sırasında genel hata:", err);
          const message = err instanceof Error ? err.message : "Başlangıç verileri yüklenirken bir hata oluştu.";
          setLoadingError(message);
          toast.error(message);
        }
      } finally {
        // setLoading(false) zaten loadTasks içinde yapılıyor olacak
        console.log('[TaskPage] Initial data loading sequence finished.');
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bağımlılıkları kaldırdık, çünkü loadTasks'ı çağırmak yeterli

  // Form değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Select değişikliklerini işle (Status, Priority, Project)
  const handleSelectChange = (name: 'status' | 'priority' | 'projectId') => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "other" || value === "" ? null : value })); // Proje için null kontrolü
  };

  // Durum Filtresi Değişikliğini İşle
  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value === "all" ? "" : value as TaskStatus);
  };

  // Çalışan Combobox değişikliğini işle (Çoklu seçim)
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedAssigneeIds(prevSelectedIds => {
      if (prevSelectedIds.includes(employeeId)) {
        // Zaten seçiliyse kaldır
        return prevSelectedIds.filter(id => id !== employeeId);
      } else {
        // Seçili değilse ekle
        return [...prevSelectedIds, employeeId];
      }
    });
    // Form datasına da yansıt
    setFormData(prev => ({
        ...prev,
        assigneeIds: selectedAssigneeIds.includes(employeeId) 
                     ? selectedAssigneeIds.filter(id => id !== employeeId) 
                     : [...selectedAssigneeIds, employeeId]
    }));
  };
  
  // Çalışan Combobox için seçili isimleri gösteren yardımcı fonksiyon
  const getSelectedAssigneeNames = () => {
    if (selectedAssigneeIds.length === 0) return "Çalışan Seçin";
    const selectedEmployees = employees.filter(e => selectedAssigneeIds.includes(e.id));
    if (selectedEmployees.length === 0) return "Çalışan Seçin";
    if (selectedEmployees.length === 1) {
      const emp = selectedEmployees[0];
      return `${emp.name} ${emp.surname || ''}`;
    }
    return `${selectedAssigneeIds.length} çalışan seçildi`;
  };

  // Formu Resetle (Çoklu seçimi de resetle)
  const resetForm = () => {
      setEditingTask(null);
      setFormData(initialFormData); // initialFormData'da assigneeIds: [] olmalı
      setSelectedAssigneeIds([]); // Seçili ID'leri temizle
      setEmployeeSearch("");
  };

  // Formu Gönder (Ekleme/Güncelleme)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let savedTask: Task;
      const operation = editingTask ? "güncellendi" : "oluşturuldu";

      if (editingTask) {
        // Güncelleme
        const updateData: UpdateTaskData = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate,
          assigneeIds: formData.assigneeIds,
          projectId: formData.projectId,
        };
        savedTask = await updateTask(editingTask.id, updateData);
      } else {
        // Ekleme
        const newTaskData: NewTaskData = { ...formData };
        savedTask = await createTask(newTaskData);
      }
      
      // Başarı mesajını formData'dan alalım
      toast.success(`"${formData.title}" görevi ${operation}.`); 
      setIsSheetOpen(false);
      resetForm();
      
      // Listeyi yeniden yükle (Key hatasını önlemek için)
      await loadTasks();

    } catch (error) {
      console.error(`Görev ${editingTask ? 'güncelleme' : 'oluşturma'} hatası:`, error);
      toast.error(error instanceof Error ? error.message : `Görev ${editingTask ? 'güncellenemedi' : 'oluşturulamadı'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Görevleri yükleme fonksiyonu (ayrı bir fonksiyon olarak)
  const loadTasks = async () => {
    setLoading(true); // Yükleme durumunu tekrar aktif et
    setLoadingError(null);
    try {
      console.log('[TaskPage] Reloading tasks...');
      const tasksData = await getAllTasks();
      console.log('[TaskPage] Tasks reloaded:', tasksData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Görevleri yeniden yükleme hatası:", err);
      const message = err instanceof Error ? err.message : "Görevler yeniden yüklenirken bir hata oluştu.";
      setLoadingError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Görev Silme
  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!confirm(`"${taskTitle}" görevini silmek istediğinizden emin misiniz?`)) return;
    setIsSubmitting(true); 
    try {
      // Gerçek API çağrısı
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success(`"${taskTitle}" görevi silindi.`);
    } catch (error) {
      console.error("Görev silme hatası:", error);
      toast.error(error instanceof Error ? error.message : "Görev silinemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Düzenleme için Sheet'i Aç (Çoklu seçimi ayarla)
  const openEditSheet = (task: Task) => {
    setEditingTask(task);
    const currentAssigneeIds = task.assignees.map(a => a.id);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString()).split('T')[0] : null,
      // assigneeId: task.assigneeId, // Kaldırıldı
      assigneeIds: currentAssigneeIds, // Doğrudan ata
      projectId: task.projectId,
      departmentId: task.departmentId, // Departman ID'sini de ekleyelim
    });
    setSelectedAssigneeIds(currentAssigneeIds); // Seçili ID state'ini de güncelle
    setIsSheetOpen(true);
  };

  // Tarih Formatlama (Mevcut)
  const formatDate = (date: Date | string | null): string => {
    if (!date) return "-";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
    } catch (error) {
        console.error("Date formatting error in formatDate:", error);
        return "Geçersiz Tarih";
    }
  };

  // Date Input için YYYY-MM-DD formatında string döndür
  const getDueDateString = (date: string | Date | null | undefined): string => {
    if (!date) return ''; // null veya undefined ise boş string döndür
    if (typeof date === 'string') {
      // Eğer zaten doğru formatta ise direkt döndür, değilse parse etmeyi dene
      try {
        return date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : new Date(date).toISOString().split('T')[0] || '';
      } catch (e) {
        console.error("Error parsing date string:", date, e);
        return '';
      }
    }
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error converting date object to string:", date, e);
      return ''; // Hata durumunda boş string
    }
  };

  // Filtrelenmiş Görevler
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        (task.title?.toLowerCase() || '').includes(searchLower) ||
        (task.description?.toLowerCase() || '').includes(searchLower) ||
        (task.assignees && task.assignees.length > 0 && task.assignees.some(a => `${a.name || ''} ${a.surname || ''}`.toLowerCase().includes(searchLower)));
      
      const matchesStatus = filterStatus ? task.status === filterStatus : true;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, filterStatus]);


  // --- RENDER --- 
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Başlık ve Yeni Görev Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Başlık Bölümü */}
        <div> 
          <h1 className="text-2xl font-bold tracking-tight">Görev Yönetimi</h1>
          <p className="text-muted-foreground">Proje görevlerini oluşturun, atayın ve takip edin.</p>
        </div>
        
        {/* Yeni Görev Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsSheetOpen(open); }}>
          <SheetTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Görev
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[550px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingTask ? "Görevi Düzenle" : "Yeni Görev Oluştur"}</SheetTitle>
              <SheetDescription>
                {editingTask ? "Görevin detaylarını güncelleyin." : "Yeni bir görev için gerekli bilgileri girin."}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              {/* Form Alanları */}
              <div className="space-y-1">
                <Label htmlFor="title">Görev Başlığı*</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required placeholder="örn: Trafo bakımı" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea id="description" name="description" value={formData.description || ""} onChange={handleInputChange} placeholder="Görevin detayları..." />
              </div>

              {/* Project Selection */}
              <div className="space-y-1">
                <Label htmlFor="projectId">Proje</Label>
                <Select 
                  name="projectId"
                  value={formData.projectId || "other"}
                  onValueChange={handleSelectChange('projectId')}
                  disabled={!Array.isArray(projects) || projects.length === 0} // Proje yoksa veya dizi değilse disable et
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Proje seçin veya Diğer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="other">Diğer (Projesiz)</SelectItem>
                    {/* Güvenlik kontrolü */}
                    {Array.isArray(projects) && projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="status">Durum</Label>
                  <Select name="status" value={formData.status} onValueChange={handleSelectChange('status')}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, { text, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4 opacity-70" /> {text}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select name="priority" value={formData.priority} onValueChange={handleSelectChange('priority')}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, { text, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center"> 
                            <Icon className="mr-2 h-4 w-4 opacity-70" /> {text}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="assigneeIds">Atanan Kişiler</Label> {/* ID değişti */} 
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={true} // Combobox açık/kapalı durumu yönetilmiyorsa true bırakılabilir
                            className={cn(
                              "w-full justify-between",
                              selectedAssigneeIds.length === 0 && "text-muted-foreground"
                            )}
                          >
                            {/* Seçili isimleri göster */}
                            {getSelectedAssigneeNames()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Çalışan ara..." 
                              value={employeeSearch}
                              onValueChange={setEmployeeSearch}
                            />
                            <CommandList>
                              <CommandEmpty>Çalışan bulunamadı.</CommandEmpty>
                              <CommandGroup>
                                {/* "Atanmamış" seçeneğini kaldırabiliriz, boş liste yeterli */}
                                {/* 
                                <CommandItem
                                    key="unassigned"
                                    value=""
                                    onSelect={() => setSelectedAssigneeIds([])} // Tüm seçimi kaldırır
                                >
                                   <Check className={cn("mr-2 h-4 w-4", selectedAssigneeIds.length === 0 ? "opacity-100" : "opacity-0")} />
                                   Atama Yok
                                </CommandItem>
                                */}
                                {employees
                                .filter(emp => `${emp.name || ''} ${emp.surname || ''}`.toLowerCase().includes(employeeSearch.toLowerCase()))
                                .map((employee) => (
                                  <CommandItem
                                    key={employee.id}
                                    value={`${employee.name} ${employee.surname || ''}`}
                                    onSelect={() => handleEmployeeSelect(employee.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedAssigneeIds.includes(employee.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="flex items-center">
                                      {employee.profilePictureUrl ? (
                                        <img src={employee.profilePictureUrl} alt={`${employee.name} ${employee.surname || ''}`} className="h-5 w-5 rounded-full mr-1.5 object-cover" />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 mr-1.5">
                                          {(employee.name?.charAt(0) || '').toUpperCase()}
                                        </div>
                                      )}
                                      {employee.name} {employee.surname || ''}
                                      <span className="ml-2 text-xs text-muted-foreground">({employee.position || 'Pozisyon Yok'})</span>
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                             </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                  <Input 
                    id="dueDate"
                    type="date"
                    value={getDueDateString(formData.dueDate)} // Helper fonksiyonu kullan
                    onChange={handleInputChange} 
                    name="dueDate"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingTask ? "Güncelle" : "Oluştur"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div> 
      
      {/* Filtreleme ve Arama */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Görevlerde veya atanan kişide ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <Select 
          value={filterStatus || "all"} // Select değeri "all" veya TaskStatus olabilir
          onValueChange={handleFilterStatusChange} // Yeni handler'ı kullan
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Duruma göre filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem> 
            {Object.entries(statusConfig).map(([key, { text, icon: Icon }]) => (
              <SelectItem key={key} value={key}>
                      <div className="flex items-center"> 
                    <Icon className="mr-2 h-4 w-4 opacity-70" /> {text}
                      </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Hata Mesajı */}
       {loadingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Veri Yükleme Hatası</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      )}

      {/* Görev Listesi Tablosu */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Atanan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead>Bitiş Tarihi</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow key="loading-row">
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && !loadingError && filteredTasks.length === 0 && (
              <TableRow key="empty-row">
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search || filterStatus ? "Filtre kriterlerine uygun görev bulunamadı." : "Henüz görev oluşturulmamış."}
                </TableCell>
              </TableRow>
            )}
            {!loading && !loadingError && filteredTasks.map((task) => {
              // İkonları değişkene ata
              const statusConfigItem = statusConfig[task.status] || statusConfig[TaskStatus.TODO]; // Fallback to TODO if status not found
              const priorityConfigItem = priorityConfig[task.priority] || priorityConfig[TaskPriority.MEDIUM]; // Fallback to MEDIUM if priority not found
              
              const StatusIcon = statusConfigItem ? statusConfigItem.icon : Clock; // Fallback to Clock if icon is missing
              const PriorityIcon = priorityConfigItem ? priorityConfigItem.icon : ChevronRight; // Fallback to ChevronRight if icon is missing
              
              const project = projects.find(p => p.id === task.projectId);

              return (
                <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {task.assignees.slice(0, 3).map((assignee, index) => (
                          <TooltipProvider key={assignee.id} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {assignee.profilePictureUrl ? (
                                  <img
                                    src={assignee.profilePictureUrl}
                                    alt={`${assignee.name} ${assignee.surname || ''}`}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
                                    style={{ zIndex: 3 - index }} // Üst üste binme sırası
                                  />
                                ) : (
                                  <div 
                                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300"
                                    style={{ zIndex: 3 - index }}
                                  >
                                    {(assignee.name?.charAt(0) || '').toUpperCase()}
                                  </div>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{assignee.name} {assignee.surname || ''}</p>
                                <p className="text-xs text-muted-foreground">{assignee.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400" style={{ zIndex: 0 }}>
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Atanmamış</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`whitespace-nowrap border ${statusConfigItem.color}`}
                    >
                      <StatusIcon className={`h-3 w-3 mr-1 ${task.status === TaskStatus.IN_PROGRESS ? 'animate-spin' : ''}`} />
                      {statusConfigItem.text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`whitespace-nowrap ${priorityConfigItem.color}`}
                    >
                      <PriorityIcon className="h-3 w-3 mr-1" />
                      {priorityConfigItem.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {project ? (
                       <span className="font-medium">{project.name}</span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(task.dueDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-0.5"> 
                      {/* Görüntüle Butonu */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Link href={`/tasks/${task.id}`} passHref>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                >
                                  <Eye className="h-4 w-4" /> 
                                </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Detayları Görüntüle</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* Düzenle Butonu */}
                      <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-7 w-7 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                 onClick={() => openEditSheet(task)}
                               >
                                 <Pencil className="h-4 w-4" /> 
                               </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p>Düzenle</p>
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                      {/* Sil Butonu */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-7 w-7 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                               onClick={() => handleDelete(task.id, task.title)}
                               disabled={isSubmitting} 
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Sil</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 