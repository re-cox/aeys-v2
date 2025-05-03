"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  Building,
  MapPin,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Services & Types
import { updateWorkSchedule, deleteWorkSchedule } from "@/services/workScheduleService";
import { getAllEmployees } from "@/services/employeeService";
import { getAllDepartments } from "@/services/departmentService";
import {
  WorkSchedule,
  WorkScheduleType,
  WorkScheduleStatus,
  WorkSchedulePriority,
  UpdateWorkScheduleData,
  WorkScheduleEmployee
} from "@/types/workSchedule";
import { Department } from "@/types/department";
import { Employee } from "@/types/employee";
import { toast } from "sonner";

// Helper Configurations
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

// Date formatting helper
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "dd MMMM yyyy HH:mm", { locale: tr });
};

export default function WorkScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [editedData, setEditedData] = useState<UpdateWorkScheduleData>({ id: id });
  const [editedEmployeeIds, setEditedEmployeeIds] = useState<string[]>([]);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchDataFromLocalStorage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [departmentsData, employeesData] = await Promise.all([
          getAllDepartments(),
          getAllEmployees()
        ]);
        setDepartments(departmentsData);
        setAllEmployees(employeesData);

        const savedSchedulesString = localStorage.getItem('workSchedules');
        if (savedSchedulesString) {
          const savedSchedules: WorkSchedule[] = JSON.parse(savedSchedulesString);
          const scheduleData = savedSchedules.find(schedule => schedule.id === id);
          
          if (scheduleData) {
            setWorkSchedule(scheduleData);
            
            setEditedData({
              id: scheduleData.id,
              title: scheduleData.title,
              description: scheduleData.description || "",
              location: scheduleData.location || "",
              type: scheduleData.type,
              status: scheduleData.status,
              priority: scheduleData.priority,
              departmentId: scheduleData.departmentId,
              startDate: new Date(scheduleData.startDate).toISOString().substring(0, 16),
              endDate: new Date(scheduleData.endDate).toISOString().substring(0, 16),
              notes: scheduleData.notes || ""
            });
            setEditedEmployeeIds(scheduleData.employees?.map(emp => emp.employeeId) || []);
            
          } else {
            setError("İş programı bulunamadı.");
            toast.error("İş programı bulunamadı.");
          }
        } else {
          setError("Kaydedilmiş iş programı verisi bulunamadı.");
          toast.error("İş programı verisi bulunamadı.");
        }
      } catch (err) {
        console.error("Veri yükleme/okuma hatası:", err);
        setError("Veri yüklenirken/okunurken bir hata oluştu.");
        toast.error("İş programı verisi yüklenemedi/okunamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchDataFromLocalStorage();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setEditedEmployeeIds(selectedOptions);
  };

  const handleSaveChanges = async () => {
    if (!id || !workSchedule) return;
    try {
      setLoading(true);
      
      const apiUpdateData: UpdateWorkScheduleData = {
        id: id,
        title: editedData.title,
        description: editedData.description,
        location: editedData.location,
        type: editedData.type,
        status: editedData.status,
        priority: editedData.priority,
        departmentId: editedData.departmentId,
        startDate: editedData.startDate ? new Date(editedData.startDate).toISOString() : undefined,
        endDate: editedData.endDate ? new Date(editedData.endDate).toISOString() : undefined,
        notes: editedData.notes
      };
      
      await updateWorkSchedule(apiUpdateData);
      
      const updatedEmployees: WorkScheduleEmployee[] = editedEmployeeIds.map(empId => {
          const employee = allEmployees.find(e => e.id === empId);
          const existingEmployeeData = workSchedule.employees?.find(we => we.employeeId === empId);
          return {
              id: existingEmployeeData?.id || `tmp-emp-${empId}-${Date.now()}`,
              workScheduleId: id,
              employeeId: empId,
              employee: employee,
              role: existingEmployeeData?.role || undefined,
              isResponsible: existingEmployeeData?.isResponsible || false,
              createdAt: existingEmployeeData?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
          };
      });

      const fullUpdatedSchedule: WorkSchedule = {
        ...workSchedule,
        id: id,
        title: editedData.title || workSchedule.title,
        description: editedData.description,
        location: editedData.location,
        type: editedData.type || workSchedule.type,
        status: editedData.status || workSchedule.status,
        priority: editedData.priority || workSchedule.priority,
        departmentId: editedData.departmentId || workSchedule.departmentId,
        department: departments.find(d => d.id === (editedData.departmentId || workSchedule.departmentId)),
        startDate: editedData.startDate ? new Date(editedData.startDate).toISOString() : workSchedule.startDate,
        endDate: editedData.endDate ? new Date(editedData.endDate).toISOString() : workSchedule.endDate,
        notes: editedData.notes,
        employees: updatedEmployees,
        updatedAt: new Date().toISOString(),
      };
      
      setWorkSchedule(fullUpdatedSchedule);
      setIsEditMode(false);
      
      updateLocalStorage(fullUpdatedSchedule);
      
      toast.success("İş programı başarıyla güncellendi.");
    } catch (err) {
      console.error("İş programı güncelleme hatası:", err);
      toast.error("İş programı güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (updatedSchedule: WorkSchedule) => {
    if (typeof window !== 'undefined') {
      const savedSchedulesString = localStorage.getItem('workSchedules');
      let savedSchedules: WorkSchedule[] = [];
      if (savedSchedulesString) {
        try {
          savedSchedules = JSON.parse(savedSchedulesString);
        } catch (e) {
          console.error("LocalStorage'dan veri çözümlenirken hata:", e);
        }
      }
      const scheduleIndex = savedSchedules.findIndex(schedule => schedule.id === updatedSchedule.id);
      
      if (scheduleIndex > -1) {
        savedSchedules[scheduleIndex] = updatedSchedule;
      } else {
        savedSchedules.push(updatedSchedule);
      }
      
      localStorage.setItem('workSchedules', JSON.stringify(savedSchedules));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleteLoading(true);
      await deleteWorkSchedule(id);
      removeFromLocalStorage(id);
      toast.success("İş programı başarıyla silindi.");
      router.push("/calendar");
    } catch (err) {
      console.error("İş programı silme hatası:", err);
      toast.error("İş programı silinirken bir hata oluştu.");
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };
  
  const removeFromLocalStorage = (scheduleId: string) => {
    if (typeof window !== 'undefined') {
      const savedSchedulesString = localStorage.getItem('workSchedules');
      if (savedSchedulesString) {
        try {
          const savedSchedules: WorkSchedule[] = JSON.parse(savedSchedulesString);
          const filteredSchedules = savedSchedules.filter(schedule => schedule.id !== scheduleId);
          localStorage.setItem('workSchedules', JSON.stringify(filteredSchedules));
        } catch (e) {
          console.error("LocalStorage'dan veri çözümlenirken hata:", e);
        }
      }
    }
  };

  if (loading && !workSchedule) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !workSchedule) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/calendar")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl font-semibold">İş Programı Bulunamadı</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "İstenen iş programı bulunamadı veya yüklenirken bir hata oluştu."}</p>
            <Button 
              className="mt-4" 
              variant="default" 
              onClick={() => router.push("/calendar")}
            >
              Takvime Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/calendar")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isEditMode ? (
                <Input
                  name="title"
                  value={editedData.title || ''}
                  onChange={handleInputChange}
                  className="text-xl font-semibold"
                />
              ) : (
                <CardTitle className="text-xl font-semibold">{workSchedule.title}</CardTitle>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    <X className="h-4 w-4 mr-1" />
                    İptal
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Kaydet
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {isEditMode ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tür:</span>
                  <Select 
                    name="type" 
                    value={editedData.type} 
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(WorkScheduleType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeConfig[type as WorkScheduleType].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Durum:</span>
                  <Select 
                    name="status" 
                    value={editedData.status} 
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(WorkScheduleStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusConfig[status as WorkScheduleStatus].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Öncelik:</span>
                  <Select 
                    name="priority" 
                    value={editedData.priority} 
                    onValueChange={(value) => handleSelectChange("priority", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(WorkSchedulePriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priorityConfig[priority as WorkSchedulePriority].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <Badge variant={typeConfig[workSchedule.type].badgeVariant}>
                  {typeConfig[workSchedule.type].label}
                </Badge>
                <Badge variant={statusConfig[workSchedule.status].badgeVariant}>
                  {statusConfig[workSchedule.status].label}
                </Badge>
                <Badge variant={priorityConfig[workSchedule.priority].badgeVariant}>
                  {priorityConfig[workSchedule.priority].label}
                </Badge>
              </>
            )}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Program Bilgileri</h3>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Başlangıç</p>
                    {isEditMode ? (
                      <Input
                        name="startDate"
                        type="datetime-local"
                        value={editedData.startDate || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground">{formatDateTime(workSchedule.startDate)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Bitiş</p>
                    {isEditMode ? (
                      <Input
                        name="endDate"
                        type="datetime-local"
                        value={editedData.endDate || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground">{formatDateTime(workSchedule.endDate)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Building className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Departman</p>
                    {isEditMode ? (
                      <Select 
                        name="departmentId" 
                        value={editedData.departmentId} 
                        onValueChange={(value) => handleSelectChange("departmentId", value)}
                      >
                        <SelectTrigger className="mt-1">
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
                    ) : (
                      <p className="text-muted-foreground">{workSchedule.department?.name || "Belirtilmemiş"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Konum</p>
                    {isEditMode ? (
                      <Input
                        name="location"
                        value={editedData.location || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="Konum bilgisi (opsiyonel)"
                      />
                    ) : (
                      <p className="text-muted-foreground">{workSchedule.location || "Belirtilmemiş"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Açıklama</h3>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  {isEditMode ? (
                    <Textarea
                      name="description"
                      value={editedData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Program açıklaması"
                      className="min-h-36"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {workSchedule.description || "Bu program için açıklama eklenmemiş."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Görevli Çalışanlar</h3>
              {!isEditMode && workSchedule.employees && workSchedule.employees.length > 0 && (
                <Badge variant="outline">{workSchedule.employees.length} kişi</Badge>
              )}
            </div>
            
            {isEditMode ? (
              <div className="space-y-2">
                 <div className="flex items-center border rounded-md">
                  <Users className="w-4 h-4 ml-3 text-gray-400" />
                  <select 
                    id="editedEmployees" 
                    name="editedEmployees" 
                    multiple
                    value={editedEmployeeIds}
                    onChange={handleEmployeeSelect}
                    className="w-full p-2 border-0 focus:outline-none min-h-24 bg-background"
                  >
                    {allEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} {employee.surname}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Birden fazla çalışan seçmek için CTRL (veya Mac&apos;te Cmd) tuşuna basılı tutarak seçim yapın.</p>
              </div>
            ) : (
              !workSchedule.employees || workSchedule.employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-muted-foreground">Bu programa henüz görevli atanmamış.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {workSchedule.employees?.map((wsEmployee) => (
                    <Card key={wsEmployee.id} className="border h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{wsEmployee.employee?.name} {wsEmployee.employee?.surname}</p>
                            <p className="text-sm text-muted-foreground">{wsEmployee.role || "Görev belirtilmemiş"}</p>
                          </div>
                          {wsEmployee.isResponsible && (
                            <Badge className="ml-auto">Sorumlu</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İş Programını Sil</DialogTitle>
            <DialogDescription>
              Bu iş programını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 