"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Mail,
  Phone,
  Users,
  Building,
  ClipboardList,
  Plus,
  Filter,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

// Services & Types
import { getAllActivities, createActivity } from "@/services/marketingService";
import { getAllEmployees } from "@/services/employeeService";
import { getAllCustomers } from "@/services/customerService";
import {
  MarketingActivity,
  ActivityType,
  ActivityStatus,
  NewMarketingActivityData,
  MarketingActivityQueryParams
} from "@/types/marketing";
import { Employee } from "@/types/employee";
import { Customer } from "@/types/customer";

// Type and Status Configurations with Icons
const typeConfig: Record<ActivityType, { label: string; color: string; icon: React.ElementType }> = {
  [ActivityType.EMAIL]: { label: 'E-posta', color: 'bg-blue-100 text-blue-800', icon: Mail },
  [ActivityType.CALL]: { label: 'Telefon', color: 'bg-green-100 text-green-800', icon: Phone },
  [ActivityType.MEETING]: { label: 'Toplantı', color: 'bg-purple-100 text-purple-800', icon: Users },
  [ActivityType.SITE_VISIT]: { label: 'Saha Ziyareti', color: 'bg-orange-100 text-orange-800', icon: Building },
  [ActivityType.POTENTIAL_VISIT]: { label: 'Potansiyel Ziyaret', color: 'bg-yellow-100 text-yellow-800', icon: Users },
  [ActivityType.FOLLOW_UP]: { label: 'Takip', color: 'bg-indigo-100 text-indigo-800', icon: ClipboardList },
  [ActivityType.OTHER]: { label: 'Diğer', color: 'bg-gray-100 text-gray-800', icon: ClipboardList },
};

const statusConfig: Record<ActivityStatus, { label: string; color: string; icon: React.ElementType }> = {
  [ActivityStatus.PLANNED]: { label: 'Planlandı', color: 'bg-gray-100 text-gray-800', icon: CalendarDays },
  [ActivityStatus.COMPLETED]: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [ActivityStatus.CANCELLED]: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle },
  [ActivityStatus.NEEDS_FOLLOW_UP]: { label: 'Takip Gerekiyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

// Date formatting helper
const formatShortDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "dd.MM.yy HH:mm", { locale: tr });
  } catch (e) {
    return "Geçersiz Tarih";
  }
};

export default function MarketingPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<MarketingActivityQueryParams>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<ActivityType | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | "ALL">("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  
  // New Activity Modal
  const [newActivityOpen, setNewActivityOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<NewMarketingActivityData>>({
    type: ActivityType.MEETING,
    status: ActivityStatus.PLANNED,
    activityDate: new Date().toISOString().substring(0, 16), // Default to now
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activitiesData, employeesData, customersData] = await Promise.all([
          getAllActivities(filters), // Initial load with empty filters
          getAllEmployees(),
          getAllCustomers(),
        ]);
        
        setActivities(activitiesData);
        setEmployees(employeesData);
        setCustomers(customersData);
        setError(null);
      } catch (err) {
        console.error("Veri yükleme hatası:", err);
        setError("Veriler yüklenirken bir hata oluştu.");
        toast.error("Pazarlama aktiviteleri yüklenirken hata: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // Reload when filters change

  // Handle filter changes
  const applyFilters = () => {
    setFilters({
      searchQuery: searchQuery.trim() || undefined,
      type: selectedType === "ALL" ? undefined : selectedType,
      status: selectedStatus === "ALL" ? undefined : selectedStatus,
      employeeId: selectedEmployee === "ALL" ? undefined : selectedEmployee,
      customerId: selectedCustomer === "ALL" ? undefined : selectedCustomer,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setSelectedEmployee("ALL");
    setSelectedCustomer("ALL");
    setFilters({});
  };

  // Handle new activity form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes specifically for enum types
   const handleSelectChange = (name: keyof NewMarketingActivityData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle new activity submission
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.activityDate || !formData.customerId) {
      toast.error("Lütfen Tür, Tarih, ve Müşteri alanlarını doldurun.");
      return;
    }

    try {
      setFormLoading(true);
      
      // Eğer çalışan seçilmemişse, en az bir çalışanı kontrol et
      let employeeId = formData.employeeId;
      if (!employeeId && employees.length > 0) {
        employeeId = employees[0].id;
        console.log('[Marketing] Çalışan ID otomatik atandı:', employeeId);
      }
      
      if (!employeeId) {
        toast.error("Sorumlu personel seçilmedi ve otomatik çalışan bulunamadı.");
        setFormLoading(false);
        return;
      }
      
      const newActivityData: NewMarketingActivityData = {
        type: formData.type,
        status: formData.status || ActivityStatus.PLANNED,
        activityDate: new Date(formData.activityDate).toISOString(),
        title: formData.title,
        description: formData.description,
        outcome: formData.outcome,
        nextStep: formData.nextStep,
        nextStepDate: formData.nextStepDate ? new Date(formData.nextStepDate).toISOString() : undefined,
        locationLink: formData.locationLink,
        customerId: formData.customerId,
        employeeId: employeeId,
      };
      
      const createdActivity = await createActivity(newActivityData);
      toast.success("Pazarlama aktivitesi başarıyla oluşturuldu.");
      
      // Yeni aktivite ekledikten sonra listeyi güncellemek için verileri yeniden çek
      const refreshedActivities = await getAllActivities(filters);
      setActivities(refreshedActivities);
      
      setNewActivityOpen(false);
      setFormData({ type: ActivityType.MEETING, status: ActivityStatus.PLANNED, activityDate: new Date().toISOString().substring(0, 16) }); // Reset form
      
    } catch (err) {
      console.error("Aktivite oluşturma hatası:", err);
      toast.error("Aktivite oluşturulurken bir hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  };

  // Memoized filtered activities for performance
  const filteredActivities = useMemo(() => {
      // Note: Filtering is now primarily done via API query (filters state)
      // This local filter can be kept for instant UI feedback or removed if API is fast enough
      return activities;
  }, [activities]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Pazarlama Aktiviteleri</h1>
        <Dialog open={newActivityOpen} onOpenChange={setNewActivityOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-1" />
              Yeni Aktivite Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yeni Pazarlama Aktivitesi</DialogTitle>
              <DialogDescription>
Müşteri etkileşimlerinizi ve planlarınızı kaydedin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateActivity} className="space-y-4 py-4">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Tür <span className="text-red-500">*</span></Label>
                  <Select name="type" required value={formData.type} onValueChange={(v) => handleSelectChange("type", v as ActivityType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aktivite türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <config.icon className="mr-2 h-4 w-4" /> {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
      </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="status">Durum</Label>
                  <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange("status", v as ActivityStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                           <div className="flex items-center">
                            <config.icon className="mr-2 h-4 w-4" /> {config.label}
            </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
      </div>
      
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <Label htmlFor="customerId">Müşteri <span className="text-red-500">*</span></Label>
                  <Select name="customerId" required value={formData.customerId} onValueChange={(v) => handleSelectChange("customerId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId">Sorumlu Personel <span className="text-red-500">*</span></Label>
                   <Select name="employeeId" required value={formData.employeeId} onValueChange={(v) => handleSelectChange("employeeId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Personel seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>{employee.name} {employee.surname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                        </div>
                    </div>
                    
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="activityDate">Aktivite Tarihi <span className="text-red-500">*</span></Label>
                    <Input id="activityDate" name="activityDate" type="datetime-local" required value={formData.activityDate} onChange={handleFormChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Başlık</Label>
                    <Input id="title" name="title" placeholder="Örn: Tanıtım Toplantısı" value={formData.title || ''} onChange={handleFormChange} />
                      </div>
                    </div>
                    
               <div className="space-y-1.5">
                  <Label htmlFor="description">Açıklama / Notlar</Label>
                  <Textarea id="description" name="description" placeholder="Görüşme detayları, önemli notlar..." value={formData.description || ''} onChange={handleFormChange} />
                    </div>
                    
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="outcome">Sonuç</Label>
                    <Input id="outcome" name="outcome" placeholder="Örn: Olumlu, teklif istendi" value={formData.outcome || ''} onChange={handleFormChange} />
                        </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="locationLink">Konum Linki (Google Maps vb.)</Label>
                    <Input id="locationLink" name="locationLink" type="url" placeholder="https://maps.app.goo.gl/..." value={formData.locationLink || ''} onChange={handleFormChange} />
                        </div>
                    </div>
               
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nextStep">Sonraki Adım</Label>
                    <Input id="nextStep" name="nextStep" placeholder="Örn: Teklif hazırlama" value={formData.nextStep || ''} onChange={handleFormChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nextStepDate">Sonraki Adım Tarihi</Label>
                    <Input id="nextStepDate" name="nextStepDate" type="date" value={formData.nextStepDate ? formData.nextStepDate.substring(0, 10) : ''} onChange={handleFormChange} />
                        </div>
                      </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNewActivityOpen(false)}>
                  İptal
                      </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Oluşturuluyor..." : "Oluştur"}
                      </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
           <div className="flex items-center gap-2">
             <Filter className="w-5 h-5"/>
             <CardTitle className="text-lg">Filtrele</CardTitle>
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Başlık, açıklama, sonuç ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lg:col-span-2"
            />
             <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ActivityType | "ALL")}>
                <SelectTrigger>
                  <SelectValue placeholder="Türe Göre Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Türler</SelectItem>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}><config.icon className="inline mr-1 h-4 w-4"/> {config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ActivityStatus | "ALL")}>
                <SelectTrigger>
                  <SelectValue placeholder="Duruma Göre Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                   {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}><config.icon className="inline mr-1 h-4 w-4"/> {config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Personele Göre Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Personeller</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name} {emp.surname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteriye Göre Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Müşteriler</SelectItem>
                   {customers.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={resetFilters}>Filtreleri Temizle</Button>
             <Button onClick={applyFilters}>Filtrele</Button>
           </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Başlık/Açıklama</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Sorumlu</TableHead>
                <TableHead>Sonraki Adım</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Yükleniyor...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && error && (
                 <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && filteredActivities.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Filtrelere uygun pazarlama aktivitesi bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && filteredActivities.map((activity) => {
                const TypeIcon = typeConfig[activity.type]?.icon || ClipboardList;
                const StatusIcon = statusConfig[activity.status]?.icon || Clock;
                return (
                  <TableRow
                    key={activity.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/marketing/${activity.id}`)}
                  >
                    <TableCell>
                      <Badge variant="outline" className={`whitespace-nowrap ${typeConfig[activity.type]?.color || 'bg-gray-100 text-gray-800'}`}>
                        <TypeIcon className="mr-1 h-3.5 w-3.5" />
                        {typeConfig[activity.type]?.label || activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.customer?.name || activity.customerId}</TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-medium truncate max-w-xs" title={activity.title}>{activity.title || "Başlık Yok"}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-xs" title={activity.description}>{activity.description}</span>
        </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatShortDateTime(activity.activityDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`whitespace-nowrap ${statusConfig[activity.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                         <StatusIcon className="mr-1 h-3.5 w-3.5" />
                         {statusConfig[activity.status]?.label || activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.employee?.name} {activity.employee?.surname}</TableCell>
                     <TableCell className="whitespace-nowrap">
                       {activity.nextStepDate ? formatShortDateTime(activity.nextStepDate) : '-'}
                       {activity.nextStep && <span className="text-xs text-muted-foreground block truncate max-w-[100px]" title={activity.nextStep}>{activity.nextStep}</span>}
                     </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 