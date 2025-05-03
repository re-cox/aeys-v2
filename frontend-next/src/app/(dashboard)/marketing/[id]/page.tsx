"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter, useParams } from "next/navigation";
import {
  Mail,
  Phone,
  Users,
  Building,
  ClipboardList,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
  FileText
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
import { Label } from "@/components/ui/label";

// Services & Types
import { updateActivity, deleteActivity, getActivityById } from "@/services/marketingService";
import { getAllEmployees } from "@/services/employeeService";
import { getAllCustomers } from "@/services/customerService";
import {
  MarketingActivity,
  ActivityType,
  ActivityStatus,
  UpdateMarketingActivityData,
} from "@/types/marketing";
import { Employee } from "@/types/employee";
import { Customer } from "@/types/customer";
import { toast } from "sonner";

// Re-using configs from the main page or define here if needed
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

// Date formatting helpers
const formatDetailDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "Belirtilmemiş";
  try {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy, HH:mm", { locale: tr });
  } catch { return "Geçersiz Tarih"; }
};
const formatDetailDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Belirtilmemiş";
  try {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy", { locale: tr });
  } catch { return "Geçersiz Tarih"; }
};

export default function MarketingActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<MarketingActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [editedData, setEditedData] = useState<Partial<UpdateMarketingActivityData>>({ id: id });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Load activity data from API and employee/customer lists
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch employees, customers and the current activity
        const [employeesData, customersData, currentActivity] = await Promise.all([
          getAllEmployees(),
          getAllCustomers(),
          getActivityById(id)
        ]);
        
        setAllEmployees(employeesData);
        setAllCustomers(customersData);

        if (currentActivity) {
          setActivity(currentActivity);

          // Initialize edit data
          setEditedData({
            id: currentActivity.id,
            type: currentActivity.type,
            status: currentActivity.status,
            activityDate: currentActivity.activityDate ? new Date(currentActivity.activityDate).toISOString().substring(0, 16) : undefined,
            title: currentActivity.title || '',
            description: currentActivity.description || '',
            outcome: currentActivity.outcome || '',
            nextStep: currentActivity.nextStep || '',
            nextStepDate: currentActivity.nextStepDate ? new Date(currentActivity.nextStepDate).toISOString().substring(0, 10) : undefined,
            locationLink: currentActivity.locationLink || '',
            customerId: currentActivity.customerId,
            employeeId: currentActivity.employeeId,
          });
        } else {
          setError("Pazarlama aktivitesi bulunamadı.");
          toast.error("Aktivite bulunamadı.");
        }
      } catch (err) {
        console.error("Veri yükleme hatası:", err);
        setError("Veri yüklenirken bir hata oluştu.");
        toast.error("Aktivite verisi yüklenemedi: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Form change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof UpdateMarketingActivityData, value: string) => {
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!id || !editedData) return;
    try {
      setLoading(true);
      const updateData: UpdateMarketingActivityData = {
        ...editedData,
        id: id,
        activityDate: editedData.activityDate ? new Date(editedData.activityDate).toISOString() : undefined,
        nextStepDate: editedData.nextStepDate ? new Date(editedData.nextStepDate).toISOString() : undefined,
      };

      // Call API to update the activity
      const updatedActivity = await updateActivity(updateData);

      // Update local state
      setActivity(updatedActivity);
      setIsEditMode(false);
      toast.success("Aktivite başarıyla güncellendi.");

    } catch (err) {
      console.error("Aktivite güncelleme hatası:", err);
      toast.error("Aktivite güncellenirken bir hata oluştu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Delete activity
  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleteLoading(true);
      // Call API to delete the activity
      await deleteActivity(id);

      // Return to the main activities list
      toast.success("Aktivite başarıyla silindi.");
      router.push("/marketing");
    } catch (err) {
      console.error("Aktivite silme hatası:", err);
      toast.error("Aktivite silinirken bir hata oluştu: " + (err instanceof Error ? err.message : String(err)));
      setDeleteConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Render loading state
  if (loading && !activity) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render error state
  if (error || !activity) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/marketing")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl font-semibold">Aktivite Bulunamadı</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "İstenen aktivite bulunamadı veya yüklenirken bir hata oluştu."}</p>
            <Button
              className="mt-4"
              variant="default"
              onClick={() => router.push("/marketing")}
            >
              Listeye Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentTypeIcon = typeConfig[activity.type]?.icon || ClipboardList;
  const CurrentStatusIcon = statusConfig[activity.status]?.icon || Clock;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-sm">
        {/* Header with Edit/Save/Delete */}
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button variant="outline" size="icon" onClick={() => router.push("/marketing")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isEditMode ? (
                <Input
                  name="title"
                  value={editedData.title || ''}
                  onChange={handleInputChange}
                  className="text-xl font-semibold h-9"
                  placeholder="Aktivite Başlığı"
                />
              ) : (
                <CardTitle className="text-xl font-semibold truncate" title={activity.title}>
                  {activity.title || "Başlıksız Aktivite"}
                </CardTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={loading}>
                    <X className="h-4 w-4 mr-1" /> İptal
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" /> Kaydet
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Edit className="h-4 w-4 mr-1" /> Düzenle
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Sil
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Badges Section */}
          <div className="flex flex-wrap gap-2">
             {isEditMode ? (
              <>
                <Select name="type" value={editedData.type} onValueChange={(v) => handleSelectChange("type", v as ActivityType)}>
                  <SelectTrigger className="h-8 text-xs w-auto">
                     <SelectValue placeholder="Tür" />
                  </SelectTrigger>
                  <SelectContent>
                     {Object.entries(typeConfig).map(([key, config]) => (
                       <SelectItem key={key} value={key}><div className="flex items-center"><config.icon className="mr-1.5 h-3.5 w-3.5" /> {config.label}</div></SelectItem>
                     ))}
                  </SelectContent>
                </Select>
                <Select name="status" value={editedData.status} onValueChange={(v) => handleSelectChange("status", v as ActivityStatus)}>
                   <SelectTrigger className="h-8 text-xs w-auto">
                     <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                     {Object.entries(statusConfig).map(([key, config]) => (
                       <SelectItem key={key} value={key}><div className="flex items-center"><config.icon className="mr-1.5 h-3.5 w-3.5" /> {config.label}</div></SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </>
             ) : (
              <>
                <Badge variant="outline" className={`whitespace-nowrap ${typeConfig[activity.type]?.color}`}>
                    <CurrentTypeIcon className="mr-1 h-3.5 w-3.5" /> {typeConfig[activity.type]?.label}
                </Badge>
                <Badge variant="outline" className={`whitespace-nowrap ${statusConfig[activity.status]?.color}`}>
                    <CurrentStatusIcon className="mr-1 h-3.5 w-3.5" /> {statusConfig[activity.status]?.label}
                </Badge>
              </>
             )}
          </div>

          <Separator />

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <Users className="h-5 w-5 mt-1 text-muted-foreground" />
                 <div>
                    <Label className="text-sm font-medium">Müşteri</Label>
                    {isEditMode ? (
                         <Select name="customerId" value={editedData.customerId} onValueChange={(v) => handleSelectChange("customerId", v)}>
                            <SelectTrigger className="mt-1">
                               <SelectValue placeholder="Müşteri Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCustomers.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    ) : (
                        <p className="text-muted-foreground">{activity.customer?.companyName || activity.customerId}</p>
                    )}
                 </div>
              </div>
               <div className="flex items-start gap-3">
                 <Users className="h-5 w-5 mt-1 text-muted-foreground" />
                 <div>
                    <Label className="text-sm font-medium">Sorumlu Personel</Label>
                     {isEditMode ? (
                         <Select name="employeeId" value={editedData.employeeId} onValueChange={(v) => handleSelectChange("employeeId", v)}>
                            <SelectTrigger className="mt-1">
                               <SelectValue placeholder="Personel Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {allEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} {e.surname}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    ) : (
                       <p className="text-muted-foreground">{activity.employee?.name} {activity.employee?.surname}</p>
                    )}
                 </div>
              </div>
               <div className="flex items-start gap-3">
                 <CalendarDays className="h-5 w-5 mt-1 text-muted-foreground" />
                 <div>
                    <Label className="text-sm font-medium">Aktivite Tarihi</Label>
                     {isEditMode ? (
                         <Input name="activityDate" type="datetime-local" value={editedData.activityDate || ''} onChange={handleInputChange} className="mt-1" />
                    ) : (
                       <p className="text-muted-foreground">{formatDetailDateTime(activity.activityDate)}</p>
                    )}
                 </div>
              </div>
            </div>

            {/* Column 2 */}
             <div className="space-y-4">
                 <div className="flex items-start gap-3">
                     <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                     <div className="flex-1">
                         <Label className="text-sm font-medium">Açıklama / Notlar</Label>
                         {isEditMode ? (
                             <Textarea name="description" value={editedData.description || ''} onChange={handleInputChange} placeholder="Görüşme detayları, önemli notlar..." className="mt-1 min-h-28" />
                         ) : (
                             <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                                 {activity.description || "Açıklama eklenmemiş."}
                             </p>
                         )}
                     </div>
                 </div>
             </div>
          </div>

           <Separator />

           {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* Column 1 */}
                 <div className="space-y-4">
                     <div className="flex items-start gap-3">
                         <CheckCircle className="h-5 w-5 mt-1 text-muted-foreground" />
                         <div>
                             <Label className="text-sm font-medium">Sonuç</Label>
                             {isEditMode ? (
                                 <Input name="outcome" value={editedData.outcome || ''} onChange={handleInputChange} placeholder="Örn: Olumlu, teklif istendi" className="mt-1" />
                             ) : (
                                 <p className="text-muted-foreground">{activity.outcome || "Belirtilmemiş"}</p>
                             )}
                         </div>
                     </div>
                     <div className="flex items-start gap-3">
                         <ClipboardList className="h-5 w-5 mt-1 text-muted-foreground" />
                         <div>
                             <Label className="text-sm font-medium">Sonraki Adım</Label>
                              {isEditMode ? (
                                 <Input name="nextStep" value={editedData.nextStep || ''} onChange={handleInputChange} placeholder="Örn: Teklif hazırlama" className="mt-1" />
                             ) : (
                                 <p className="text-muted-foreground">{activity.nextStep || "Belirtilmemiş"}</p>
                             )}
                         </div>
                     </div>
                 </div>
                 {/* Column 2 */}
                 <div className="space-y-4">
                     <div className="flex items-start gap-3">
                         <ExternalLink className="h-5 w-5 mt-1 text-muted-foreground" />
                         <div>
                             <Label className="text-sm font-medium">Konum Linki</Label>
                             {isEditMode ? (
                                <Input name="locationLink" type="url" value={editedData.locationLink || ''} onChange={handleInputChange} placeholder="https://maps.app.goo.gl/..." className="mt-1" />
                            ) : (
                                 activity.locationLink ? (
                                     <a href={activity.locationLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                         {activity.locationLink}
                                     </a>
                                 ) : (
                                     <p className="text-muted-foreground">Belirtilmemiş</p>
                                 )
                             )}
                         </div>
                     </div>
                      <div className="flex items-start gap-3">
                         <CalendarDays className="h-5 w-5 mt-1 text-muted-foreground" />
                         <div>
                             <Label className="text-sm font-medium">Sonraki Adım Tarihi</Label>
                              {isEditMode ? (
                                 <Input name="nextStepDate" type="date" value={editedData.nextStepDate || ''} onChange={handleInputChange} className="mt-1" />
                             ) : (
                                <p className="text-muted-foreground">{formatDetailDate(activity.nextStepDate)}</p>
                             )}
                         </div>
                     </div>
                 </div>
            </div>

        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pazarlama Aktivitesini Sil</DialogTitle>
            <DialogDescription>
              Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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