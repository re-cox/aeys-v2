'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Users, 
  FileText, 
  Image as ImageIcon, 
  BarChart3, 
  Building, 
  PieChart,
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock as ClockIcon,
  PlayCircle,
  Loader2,
  Upload,
  Phone,
  Mail,
  UserPlus,
  CalendarIcon
} from 'lucide-react';
import Image from 'next/image';
import ProjectGallery from './ProjectGallery';
import { api } from '@/lib/api';

// Kilometre taşı için tip tanımı
interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
  projectId: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Proje verisinin tip tanımı (API yanıtına göre genişletilebilir)
interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  budget: number | null;
  progress: number;
  Department: { id: string; name: string } | null;
  Customer: { id: string; name: string } | null;
  Site: { id: string; name: string, location: string | null } | null;
  tasks: any[]; // Daha detaylı tip eklenebilir
  Document: any[]; // Daha detaylı tip eklenebilir
  TeknisyenRapor: any[]; // Daha detaylı tip eklenebilir
  ProgressPayment: any[]; // Ödeme bilgileri için
}

// Personel veri tipi tanımı
interface Employee {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  position?: string;
  department?: {
    id: string;
    name: string;
  };
  profilePictureUrl?: string;
}

// Takım üyesi veri tipi tanımı
interface TeamMember {
  id: string;
  employeeId: string;
  projectId: string;
  role?: string;
  employee: Employee;
}

// Status renklerini belirlemek için
const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return "text-green-500 bg-green-50 border-green-200";
    case 'IN_PROGRESS': return "text-blue-500 bg-blue-50 border-blue-200";
    case 'PLANNING': return "text-purple-500 bg-purple-50 border-purple-200";
    case 'ON_HOLD': return "text-amber-500 bg-amber-50 border-amber-200";
    case 'CANCELLED': return "text-red-500 bg-red-50 border-red-200";
    default: return "text-gray-500 bg-gray-50 border-gray-200";
  }
};

// Status adını Türkçeye çevirmek için
const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED': return "Tamamlandı";
    case 'IN_PROGRESS': return "Devam Ediyor";
    case 'PLANNING': return "Planlama Aşamasında";
    case 'ON_HOLD': return "Beklemede";
    case 'CANCELLED': return "İptal Edildi";
    default: return status;
  }
};

// Status ikonunu belirlemek için
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
    case 'IN_PROGRESS': return <PlayCircle className="h-4 w-4" />;
    case 'PLANNING': return <FileText className="h-4 w-4" />;
    case 'ON_HOLD': return <ClockIcon className="h-4 w-4" />;
    case 'CANCELLED': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

export default function ProjectDetailsClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    description: string;
    date: Date | undefined;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
    icon: string;
  }>({
    title: "",
    description: "",
    date: undefined,
    status: "PLANNED",
    icon: "calendar"
  });

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Proje detayları alınamadı (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setProject(data.data);
      } else {
        throw new Error(data.message || 'Proje verisi alınamadı.');
      }
    } catch (err: any) {
      console.error("Proje detayı fetch hatası:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId, fetchProjectDetails]);

  // Personel verilerini getirmek için fonksiyon
  const fetchEmployees = useCallback(async () => {
    if (activeTab !== 'team') return;
    
    setIsLoadingEmployees(true);
    try {
      const employeeData = await api.employees.getAll();
      setEmployees(employeeData);
      
      // Proje ekip üyelerini getir
      // Not: Gerçek API implementasyonundan önce mock data kullanıyoruz
      // TODO: Proje ekip API'sini oluştur
      setTeamMembers([
        {
          id: '1',
          employeeId: employeeData[0]?.id || '1',
          projectId: projectId,
          role: 'Proje Yöneticisi',
          employee: employeeData[0] || {
            id: '1',
            name: 'Veri',
            surname: 'Yüklenemedi',
            email: 'ornek@aydem.com'
          }
        }
      ]);
    } catch (error) {
      console.error('Personel verileri yüklenirken hata:', error);
      toast.error('Personel verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [projectId, activeTab]);
  
  // Personel verilerini getir
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Yükleme durumu
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96 mb-6" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        
        <Skeleton className="h-56 w-full rounded-xl" />
        
        <div className="flex gap-2 overflow-x-auto mt-4">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 md:p-6">
        <div className="rounded-full bg-red-100 p-3 mb-3">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-xl font-medium text-red-600 mb-2">Hata</h3>
        <p className="text-center text-gray-600 max-w-md mb-4">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>
          <Button onClick={() => fetchProjectDetails()}>
            <Loader2 className="mr-2 h-4 w-4" /> Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  // Proje bulunamadı durumu
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 md:p-6">
        <div className="rounded-full bg-amber-100 p-3 mb-3">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="text-xl font-medium text-amber-600 mb-2">Proje Bulunamadı</h3>
        <p className="text-center text-gray-600 max-w-md mb-4">
          Aradığınız proje bulunamadı veya erişim izniniz yok.
        </p>
        <Button variant="outline" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Proje Listesine Dön
        </Button>
      </div>
    );
  }

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'PPP', { locale: tr });
    } catch {
      return 'Geçersiz Tarih';
    }
  };

  // Proje durumuna göre renk sınıfını belirle
  const statusColorClass = getStatusColor(project.status);
  const statusText = getStatusText(project.status);
  const statusIcon = getStatusIcon(project.status);

  // İlerleme yüzdesi hesaplama
  const progressPercent = project.progress || 0;

  // Avatar placeholder oluşturma yardımcı fonksiyonu
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  // Proje verilerini al
  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error(`Proje verileri alınamadı: ${response.status}`);
        }
        const data = await response.json();
        setProject(data.data);

        // Kilometre taşlarını getir
        fetchMilestones();
      } catch (err: any) {
        console.error("Proje verileri alınırken hata:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  // Kilometre taşlarını getir
  const fetchMilestones = async () => {
    setLoadingMilestones(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      
      if (!response.ok) {
        // API henüz kurulmadıysa proje başlangıç ve bitiş tarihlerinden geçici veri oluştur
        console.warn('Milestone API henüz kurulmamış, geçici veri oluşturuluyor');
        const tempMilestones: ProjectMilestone[] = [{
          id: `temp-${Date.now()}`,
          title: "Proje Başlangıcı",
          description: "Proje resmen başlatıldı ve ilk adımlar atıldı.",
          date: project?.startDate || new Date().toISOString(),
          status: "COMPLETED",
          projectId: projectId,
          icon: "calendar",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
        setMilestones(tempMilestones);
        return;
      }
      
      const data = await response.json();
      setMilestones(data.data || []);
    } catch (err) {
      console.error("Kilometre taşları alınırken hata:", err);
      // Hata durumunda boş dizi ile devam et
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Proje verilerini aldıktan sonra kilometre taşlarını getir
  useEffect(() => {
    if (project) {
      fetchMilestones();
    }
  }, [project]);

  // Kilometre taşı ekle
  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.date) {
      toast.error("Başlık ve tarih alanları zorunludur");
      return;
    }

    try {
      // API çağrısı yap
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newMilestone.title,
          description: newMilestone.description,
          date: newMilestone.date.toISOString(),
          status: newMilestone.status,
          icon: newMilestone.icon
        }),
      });

      if (!response.ok) {
        // API henüz kurulmadıysa yerel state'e ekle
        if (response.status === 404) {
          console.warn('Milestone API henüz kurulmamış, geçici olarak ekleniyor');
          const tempMilestone: ProjectMilestone = {
            id: `temp-${Date.now()}`,
            title: newMilestone.title,
            description: newMilestone.description,
            date: newMilestone.date.toISOString(),
            status: newMilestone.status,
            projectId: projectId,
            icon: newMilestone.icon,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setMilestones(prev => [...prev, tempMilestone]);
          setShowMilestoneForm(false);
          setNewMilestone({
            title: "",
            description: "",
            date: undefined,
            status: "PLANNED",
            icon: "calendar"
          });
          toast.success("Kilometre taşı eklendi (geçici)");
          return;
        }
        
        throw new Error("Kilometre taşı eklenirken bir hata oluştu");
      }

      const data = await response.json();
      setMilestones(prev => [...prev, data.data]);
      setShowMilestoneForm(false);
      setNewMilestone({
        title: "",
        description: "",
        date: undefined,
        status: "PLANNED",
        icon: "calendar"
      });
      toast.success("Kilometre taşı eklendi");
    } catch (err) {
      console.error("Kilometre taşı eklenirken hata:", err);
      toast.error("Kilometre taşı eklenirken bir hata oluştu");
    }
  };

  // Kilometre taşı sil
  const handleDeleteMilestone = async (id: string) => {
    try {
      // Eğer geçici ID ise doğrudan state'den kaldır
      if (id.startsWith('temp-')) {
        setMilestones(prev => prev.filter(m => m.id !== id));
        toast.success("Kilometre taşı silindi");
        return;
      }
      
      // API çağrısı yap
      const response = await fetch(`/api/projects/${projectId}/milestones/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Kilometre taşı silinirken bir hata oluştu");
      }

      setMilestones(prev => prev.filter(m => m.id !== id));
      toast.success("Kilometre taşı silindi");
    } catch (err) {
      console.error("Kilometre taşı silinirken hata:", err);
      toast.error("Kilometre taşı silinirken bir hata oluştu");
    }
  };

  // Kilometre taşı durumunu güncelle
  const handleUpdateMilestoneStatus = async (id: string, newStatus: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED") => {
    try {
      // Eğer geçici ID ise doğrudan state'i güncelle
      if (id.startsWith('temp-')) {
        setMilestones(prev => prev.map(m => 
          m.id === id ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m
        ));
        toast.success("Kilometre taşı durumu güncellendi");
        return;
      }
      
      // API çağrısı yap
      const response = await fetch(`/api/projects/${projectId}/milestones/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Kilometre taşı güncellenirken bir hata oluştu");
      }

      setMilestones(prev => prev.map(m => 
        m.id === id ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m
      ));
      toast.success("Kilometre taşı durumu güncellendi");
    } catch (err) {
      console.error("Kilometre taşı güncellenirken hata:", err);
      toast.error("Kilometre taşı güncellenirken bir hata oluştu");
    }
  };

  // Milestone için ikon seçimi
  const getMilestoneIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      'calendar': <Calendar className="h-5 w-5 text-primary" />,
      'file': <FileText className="h-5 w-5 text-blue-600" />,
      'map': <MapPin className="h-5 w-5 text-amber-600" />,
      'alert': <AlertCircle className="h-5 w-5 text-purple-600" />,
      'check': <CheckCircle className="h-5 w-5 text-green-600" />
    };
    
    return icons[iconName] || <Calendar className="h-5 w-5 text-primary" />;
  };

  // Milestone durumuna göre renk sınıfları
  const getMilestoneStatusClasses = (status: string) => {
    const classes = {
      'PLANNED': {
        badge: "bg-slate-50 text-slate-700 border-slate-200",
        container: "group-hover:bg-slate-50/30",
        icon: "bg-slate-50 group-hover:bg-slate-100 group-hover:border-slate-300"
      },
      'IN_PROGRESS': {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        container: "group-hover:bg-amber-50/30",
        icon: "bg-amber-50 group-hover:bg-amber-100 group-hover:border-amber-300"
      },
      'COMPLETED': {
        badge: "bg-green-50 text-green-700 border-green-200",
        container: "group-hover:bg-green-50/30",
        icon: "bg-green-50 group-hover:bg-green-100 group-hover:border-green-300"
      },
      'DELAYED': {
        badge: "bg-red-50 text-red-700 border-red-200",
        container: "group-hover:bg-red-50/30",
        icon: "bg-red-50 group-hover:bg-red-100 group-hover:border-red-300"
      }
    };
    
    return classes[status as keyof typeof classes] || classes['PLANNED'];
  };

  // Zaman Çizelgesi Tabı - mock veriler yerine API'dan alınan veriler kullanılacak
  const renderTimelineTab = () => {
    return (
      <TabsContent value="timeline">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Zaman Çizelgesi
            </CardTitle>
            <CardDescription>Proje zaman çizelgesi ve kilometre taşları</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMilestones ? (
              <div className="p-6 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Kilometre taşları yükleniyor...</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/20 ml-6 mt-2 pb-2">
                {milestones.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">Henüz kilometre taşı bulunmuyor.</p>
                    <p className="text-sm">Yeni bir kilometre taşı eklemek için "Kilometre Taşı Ekle" butonunu kullanın.</p>
                  </div>
                ) : (
                  // Kilometre taşları gösteriliyor
                  milestones
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((milestone) => {
                      const statusClasses = getMilestoneStatusClasses(milestone.status);
                      
                      return (
                        <div key={milestone.id} className="mb-8 ml-6 relative group">
                          <div className={`absolute -left-[25px] mt-1.5 h-10 w-10 rounded-full border ${statusClasses.icon} flex items-center justify-center transition-colors`}>
                            {getMilestoneIcon(milestone.icon || 'calendar')}
                          </div>
                          <div className={`pt-1.5 ${statusClasses.container} p-3 rounded-lg transition-colors`}>
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-lg">{milestone.title}</h3>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <time className="text-sm text-muted-foreground">
                              {formatDate(milestone.date)}
                            </time>
                            <p className="mt-2 text-muted-foreground">
                              {milestone.description}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline" className={statusClasses.badge}>
                                {milestone.status === "PLANNED" && "Planlandı"}
                                {milestone.status === "IN_PROGRESS" && "Süreç Devam Ediyor"}
                                {milestone.status === "COMPLETED" && "Tamamlandı"}
                                {milestone.status === "DELAYED" && "Gecikti"}
                              </Badge>
                            </div>
                            <div className="mt-3 pt-3 border-t border-dashed border-muted opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex justify-end gap-2">
                                {milestone.status !== "COMPLETED" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateMilestoneStatus(milestone.id, "COMPLETED")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                    Tamamlandı
                                  </Button>
                                )}
                                {milestone.status !== "IN_PROGRESS" && milestone.status !== "COMPLETED" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateMilestoneStatus(milestone.id, "IN_PROGRESS")}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-1 text-amber-600" />
                                    Devam Ediyor
                                  </Button>
                                )}
                                {milestone.status !== "DELAYED" && milestone.status !== "COMPLETED" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateMilestoneStatus(milestone.id, "DELAYED")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                    Gecikti
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
                
                {/* Kilometre taşı ekleme formu */}
                {showMilestoneForm && (
                  <div className="mb-8 ml-6 p-4 border rounded-lg bg-background">
                    <h3 className="font-medium text-lg mb-4">Yeni Kilometre Taşı</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="milestone-title">Başlık</Label>
                        <Input 
                          id="milestone-title"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Kilometre taşı başlığı"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="milestone-description">Açıklama</Label>
                        <Textarea 
                          id="milestone-description"
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Kilometre taşı açıklaması"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="milestone-date">Tarih</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="milestone-date"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              {newMilestone.date ? (
                                format(newMilestone.date, "PPP", { locale: tr })
                              ) : (
                                <span className="text-muted-foreground">Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={newMilestone.date}
                              onSelect={(date) => setNewMilestone(prev => ({ ...prev, date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor="milestone-status">Durum</Label>
                        <Select 
                          value={newMilestone.status}
                          onValueChange={(value) => setNewMilestone(prev => ({ ...prev, status: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLANNED">Planlandı</SelectItem>
                            <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                            <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                            <SelectItem value="DELAYED">Gecikti</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="milestone-icon">İkon</Label>
                        <Select 
                          value={newMilestone.icon}
                          onValueChange={(value) => setNewMilestone(prev => ({ ...prev, icon: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="İkon seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calendar">Takvim</SelectItem>
                            <SelectItem value="file">Dosya</SelectItem>
                            <SelectItem value="map">Harita</SelectItem>
                            <SelectItem value="alert">Uyarı</SelectItem>
                            <SelectItem value="check">Onay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowMilestoneForm(false)}
                        >
                          İptal
                        </Button>
                        <Button 
                          onClick={handleAddMilestone}
                        >
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              variant="outline" 
              size="sm"
              disabled
            >
              <Calendar className="h-4 w-4 mr-2" />
              Takvime Ekle
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
            >
              {showMilestoneForm ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  İptal
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Kilometre Taşı Ekle
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Üst Kısım - Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-xl p-6 shadow-lg text-white">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2 -ml-2 text-blue-100 hover:text-white hover:bg-white/10" 
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Projelere Dön
          </Button>
          <h1 className="text-3xl font-bold mb-1 text-white">{project.name}</h1>
          <div className="flex items-center gap-2 text-blue-100">
            {project.Customer && (
              <>
                <Building className="h-4 w-4" />
                <span className="hover:text-white cursor-pointer" onClick={() => project.Customer?.id && router.push(`/customers/${project.Customer.id}`)}>
                  {project.Customer.name}
                </span>
                <span className="mx-1">•</span>
              </>
            )}
            {project.Department && (
              <>
                <Briefcase className="h-4 w-4" />
                <span>{project.Department.name}</span>
                <span className="mx-1">•</span>
              </>
            )}
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.startDate)}</span>
          </div>
        </div>
        <div className="flex gap-2 self-end md:self-start">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            <span>Düzenle</span>
          </Button>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 bg-white/10">
            {statusIcon}
            <span className="text-sm font-medium">{statusText}</span>
          </div>
        </div>
      </div>

      {/* Ana İçerik - Google Harita ve Özet Bilgiler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Harita Alanı */}
        <Card className="lg:col-span-2 border shadow-sm overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-900/90 py-1 px-3 rounded-full shadow-md flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{project.Site?.name || 'Konum belirtilmemiş'}</span>
          </div>
          <div className="relative w-full h-64 bg-muted">
            {project.Site?.location ? (
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(project.Site.location)}&output=embed`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                title="Google Maps"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground">Bu proje için konum bilgisi bulunamadı</p>
                {project.Site?.name && (
                  <p className="text-sm mt-1 font-medium">{project.Site.name}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Özet Bilgiler */}
        <Card className="border shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Proje Özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İlerleme Çubuğu */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">İlerleme</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>

            {/* Diğer Bilgiler */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full w-7 h-7">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-muted-foreground">Başlangıç</span>
                </div>
                <span className="font-medium">{formatDate(project.startDate)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full w-7 h-7">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-muted-foreground">Bitiş (Tahmini)</span>
                </div>
                <span className="font-medium">{formatDate(project.endDate)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full w-7 h-7">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-muted-foreground">Bütçe</span>
                </div>
                <span className="font-medium">
                  {project.budget 
                    ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget)
                    : '-'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-amber-100 dark:bg-amber-900 rounded-full w-7 h-7">
                    <Building className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-muted-foreground">Müşteri</span>
                </div>
                <span 
                  className="font-medium hover:text-primary cursor-pointer"
                  onClick={() => project.Customer?.id && router.push(`/customers/${project.Customer.id}`)}
                >
                  {project.Customer?.name || '-'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-full w-7 h-7">
                    <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-muted-foreground">Departman</span>
                </div>
                <span className="font-medium">{project.Department?.name || '-'}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-full w-7 h-7">
                    <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-muted-foreground">Şantiye</span>
                </div>
                <span className="font-medium">{project.Site?.name || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekme Tasarımı */}
      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
          <TabsTrigger value="gallery">Saha Fotoğrafları</TabsTrigger>
          <TabsTrigger value="financial">Finansal Analiz</TabsTrigger>
          <TabsTrigger value="documents">Dokümanlar</TabsTrigger>
          <TabsTrigger value="team">Ekip & İletişim</TabsTrigger>
        </TabsList>

        {/* Genel Bilgiler İçeriği */}
        <TabsContent value="general" className="py-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Proje Açıklaması</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {project.description || 'Bu proje için açıklama bulunmamaktadır.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diğer sekme içerikleri burada olacak */}
        <TabsContent value="timeline">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Zaman Çizelgesi
              </CardTitle>
              <CardDescription>Proje zaman çizelgesi ve kilometre taşları</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMilestones ? (
                <div className="p-6 flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p>Kilometre taşları yükleniyor...</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-primary/20 ml-6 mt-2 pb-2">
                  {milestones.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">Henüz kilometre taşı bulunmuyor.</p>
                      <p className="text-sm">Yeni bir kilometre taşı eklemek için "Kilometre Taşı Ekle" butonunu kullanın.</p>
                    </div>
                  ) : (
                    // Kilometre taşları gösteriliyor
                    milestones
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((milestone) => {
                        const statusClasses = getMilestoneStatusClasses(milestone.status);
                        
                        return (
                          <div key={milestone.id} className="mb-8 ml-6 relative group">
                            <div className={`absolute -left-[25px] mt-1.5 h-10 w-10 rounded-full border ${statusClasses.icon} flex items-center justify-center transition-colors`}>
                              {getMilestoneIcon(milestone.icon || 'calendar')}
                            </div>
                            <div className={`pt-1.5 ${statusClasses.container} p-3 rounded-lg transition-colors`}>
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium text-lg">{milestone.title}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              <time className="text-sm text-muted-foreground">
                                {formatDate(milestone.date)}
                              </time>
                              <p className="mt-2 text-muted-foreground">
                                {milestone.description}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <Badge variant="outline" className={statusClasses.badge}>
                                  {milestone.status === "PLANNED" && "Planlandı"}
                                  {milestone.status === "IN_PROGRESS" && "Süreç Devam Ediyor"}
                                  {milestone.status === "COMPLETED" && "Tamamlandı"}
                                  {milestone.status === "DELAYED" && "Gecikti"}
                                </Badge>
                              </div>
                              <div className="mt-3 pt-3 border-t border-dashed border-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex justify-end gap-2">
                                  {milestone.status !== "COMPLETED" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUpdateMilestoneStatus(milestone.id, "COMPLETED")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                      Tamamlandı
                                    </Button>
                                  )}
                                  {milestone.status !== "IN_PROGRESS" && milestone.status !== "COMPLETED" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUpdateMilestoneStatus(milestone.id, "IN_PROGRESS")}
                                    >
                                      <PlayCircle className="h-4 w-4 mr-1 text-amber-600" />
                                      Devam Ediyor
                                    </Button>
                                  )}
                                  {milestone.status !== "DELAYED" && milestone.status !== "COMPLETED" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUpdateMilestoneStatus(milestone.id, "DELAYED")}
                                    >
                                      <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                      Gecikti
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                  
                  {/* Kilometre taşı ekleme formu */}
                  {showMilestoneForm && (
                    <div className="mb-8 ml-6 p-4 border rounded-lg bg-background">
                      <h3 className="font-medium text-lg mb-4">Yeni Kilometre Taşı</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="milestone-title">Başlık</Label>
                          <Input 
                            id="milestone-title"
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Kilometre taşı başlığı"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="milestone-description">Açıklama</Label>
                          <Textarea 
                            id="milestone-description"
                            value={newMilestone.description}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Kilometre taşı açıklaması"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="milestone-date">Tarih</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="milestone-date"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {newMilestone.date ? (
                                  format(newMilestone.date, "PPP", { locale: tr })
                                ) : (
                                  <span className="text-muted-foreground">Tarih seçin</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={newMilestone.date}
                                onSelect={(date) => setNewMilestone(prev => ({ ...prev, date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label htmlFor="milestone-status">Durum</Label>
                          <Select 
                            value={newMilestone.status}
                            onValueChange={(value) => setNewMilestone(prev => ({ ...prev, status: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Durum seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PLANNED">Planlandı</SelectItem>
                              <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                              <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                              <SelectItem value="DELAYED">Gecikti</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="milestone-icon">İkon</Label>
                          <Select 
                            value={newMilestone.icon}
                            onValueChange={(value) => setNewMilestone(prev => ({ ...prev, icon: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="İkon seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="calendar">Takvim</SelectItem>
                              <SelectItem value="file">Dosya</SelectItem>
                              <SelectItem value="map">Harita</SelectItem>
                              <SelectItem value="alert">Uyarı</SelectItem>
                              <SelectItem value="check">Onay</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowMilestoneForm(false)}
                          >
                            İptal
                          </Button>
                          <Button 
                            onClick={handleAddMilestone}
                          >
                            Kaydet
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                size="sm"
                disabled
              >
                <Calendar className="h-4 w-4 mr-2" />
                Takvime Ekle
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              >
                {showMilestoneForm ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    İptal
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Kilometre Taşı Ekle
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Saha Fotoğrafları</CardTitle>
              <CardDescription>Projeye ait saha fotoğrafları ve notları burada görüntülenir</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectGallery projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Finansal Analiz
              </CardTitle>
              <CardDescription>Proje finansal bilgileri ve ödeme planı</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Finansal Özet Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 rounded-lg p-4 border border-green-100 dark:border-green-900 hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center rounded-full h-8 w-8 bg-green-100 dark:bg-green-900">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-sm font-medium text-green-900 dark:text-green-300">Toplam Bütçe</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {project.budget 
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget)
                      : 'Belirtilmedi'}
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-1">Onaylanan toplam proje bütçesi</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900 hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center rounded-full h-8 w-8 bg-blue-100 dark:bg-blue-900">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
                    </div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">Harcanan Tutar</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {project.budget 
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.45)
                      : 'Belirtilmedi'}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-blue-700/70 dark:text-blue-400/70">Toplam bütçenin %45'i</p>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800">
                      Güncel
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900 hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center rounded-full h-8 w-8 bg-amber-100 dark:bg-amber-900">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <h3 className="text-sm font-medium text-amber-900 dark:text-amber-300">Kalan Bütçe</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {project.budget 
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.55)
                      : 'Belirtilmedi'}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Toplam bütçenin %55'i</p>
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: "55%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bütçe Dağılımı ve İlerleme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-5 space-y-4 hover:shadow-md transition-all">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-slate-500" />
                    Bütçe Dağılımı
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          Malzeme
                        </span>
                        <span className="font-medium">48%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: "48%" }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.48)
                          : '-'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          İşçilik
                        </span>
                        <span className="font-medium">32%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: "32%" }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.32)
                          : '-'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                          Nakliye
                        </span>
                        <span className="font-medium">8%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: "8%" }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.08)
                          : '-'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                          Diğer Giderler
                        </span>
                        <span className="font-medium">12%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: "12%" }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.12)
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-5 space-y-4 hover:shadow-md transition-all">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-500" />
                    Aylık Harcama Eğilimi
                  </h3>
                  
                  <div className="flex items-end h-[180px] gap-2 pt-5 border-b pb-4">
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">15.000₺</span>
                      <div className="w-full max-w-10 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors" style={{ height: "30%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">Oca</span>
                    </div>
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">22.500₺</span>
                      <div className="w-full max-w-10 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors" style={{ height: "45%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">Şub</span>
                    </div>
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">30.000₺</span>
                      <div className="w-full max-w-10 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors" style={{ height: "60%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">Mar</span>
                    </div>
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">50.000₺</span>
                      <div className="w-full max-w-10 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors" style={{ height: "100%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">Nis</span>
                    </div>
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">37.500₺</span>
                      <div className="w-full max-w-10 bg-primary/70 hover:bg-primary rounded-t-sm transition-colors" style={{ height: "75%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">May</span>
                    </div>
                    <div className="group relative flex flex-col items-center flex-1">
                      <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-2 py-1 rounded">0₺</span>
                      <div className="w-full max-w-10 bg-muted rounded-t-sm" style={{ height: "5%" }}></div>
                      <span className="text-xs mt-2 text-muted-foreground">Haz</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center px-1 mt-2">
                    <div className="text-xs">
                      <div className="font-medium">Toplam Harcama:</div>
                      <div className="text-muted-foreground mt-0.5">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.45)
                          : '-'}
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      <div className="font-medium">En Yüksek Harcama:</div>
                      <div className="text-muted-foreground mt-0.5">Nisan 2024</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ödeme Planı */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 bg-muted/30 border-b">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    Hakediş ve Ödeme Planı
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-dashed">
                  <div className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">1. Hakediş</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ödendi</Badge>
                    </div>
                    <p className="text-lg font-bold">
                      {project.budget 
                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.25)
                        : '-'}
                    </p>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">Tarih: 20 Ocak 2024</p>
                      <p className="text-xs font-medium">25%</p>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden mt-1">
                      <div className="h-full bg-green-500" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">2. Hakediş</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ödendi</Badge>
                    </div>
                    <p className="text-lg font-bold">
                      {project.budget 
                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.20)
                        : '-'}
                    </p>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">Tarih: 15 Mart 2024</p>
                      <p className="text-xs font-medium">20%</p>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden mt-1">
                      <div className="h-full bg-green-500" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">3. Hakediş</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Hazırlanıyor</Badge>
                    </div>
                    <p className="text-lg font-bold">
                      {project.budget 
                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.30)
                        : '-'}
                    </p>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">Tarih: 25 Mayıs 2024</p>
                      <p className="text-xs font-medium">30%</p>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-dashed">
                    <div className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">4. Hakediş</span>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Planlandı</Badge>
                      </div>
                      <p className="text-lg font-bold">
                        {project.budget 
                          ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.25)
                          : '-'}
                      </p>
                      <div className="flex justify-between">
                        <p className="text-xs text-muted-foreground">Tarih: 10 Temmuz 2024</p>
                        <p className="text-xs font-medium">25%</p>
                      </div>
                      <div className="h-1 w-full bg-muted overflow-hidden mt-1">
                        <div className="h-full bg-slate-400" style={{ width: "0%" }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 md:col-span-2 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Ödeme Özeti</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Toplam</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Ödenen</p>
                          <p className="text-md font-bold mt-1">
                            {project.budget 
                              ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.45)
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Kalan</p>
                          <p className="text-md font-bold mt-1">
                            {project.budget 
                              ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.budget * 0.55)
                              : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600" 
                          style={{ width: "45%" }} 
                        />
                      </div>
                      <p className="text-xs text-end mt-1">%45 tamamlandı</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Rapor İndir
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Hakediş Oluştur
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Dokümanlar
              </CardTitle>
              <CardDescription>Projeye ait teknik dokümanlar ve belgeler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dosya Yükleme Alanı */}
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-muted/30 group hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium mb-1">Dosya Yükle</h3>
                  <p className="text-sm text-muted-foreground">Sürükle bırak veya dosya seç</p>
                  <p className="text-xs text-muted-foreground mt-1">Maksimum dosya boyutu: 10MB</p>
                </div>
                <Button size="sm" variant="secondary" className="relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-colors">
                  <Upload className="h-4 w-4 mr-2" /> Dosya Seç
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </Button>
              </div>
              
              {/* Doküman Kategorileri */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Teknik Çizimler
                    </h3>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">2 Dosya</Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-blue-50 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Ana Hat Çizimi</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">PDF, 2.4 MB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">5 Nisan 2024</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-blue-50 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Elektrik Planı</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">DWG, 5.2 MB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">12 Mart 2024</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                      Sözleşmeler
                    </h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">2 Dosya</Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-green-50 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Ana Sözleşme</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">PDF, 1.8 MB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">15 Ocak 2024</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-green-50 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Teknik Şartname</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">DOC, 920 KB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">20 Ocak 2024</p>
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-50 text-red-700 border-red-200">Güncel</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                      Teknik Raporlar
                    </h3>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0">2 Dosya</Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-purple-50 text-purple-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Zemin Etüdü</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">PDF, 4.2 MB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">3 Şubat 2024</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md h-9 w-9 bg-purple-50 text-purple-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Haftalık İlerleme</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">XLSX, 540 KB</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">18 Nisan 2024</p>
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-200">Yeni</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Son Eklenen Dokümanlar */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-slate-800/90 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                    Son Eklenen Dokümanlar
                  </h3>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Filtrele
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Doküman Adı</th>
                        <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Kategori</th>
                        <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Boyut</th>
                        <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Ekleyen</th>
                        <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground">Tarih</th>
                        <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/30 transition-colors group">
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md h-8 w-8 bg-green-50 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <span>Keşif Listesi v2</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sözleşme</Badge>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">1.2 MB</td>
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" />
                              <AvatarFallback>AY</AvatarFallback>
                            </Avatar>
                            <span>Ahmet Yılmaz</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">12 Nisan 2024</td>
                        <td className="p-4 align-middle text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/30 transition-colors group">
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md h-8 w-8 bg-blue-50 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <span>Trafo Bağlantı Detayları</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Teknik Çizim</Badge>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">3.8 MB</td>
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" />
                              <AvatarFallback>MD</AvatarFallback>
                            </Avatar>
                            <span>Mehmet Demir</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">8 Nisan 2024</td>
                        <td className="p-4 align-middle text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/30 transition-colors group">
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md h-8 w-8 bg-amber-50 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div className="flex flex-col">
                              <span>Aylık Faaliyet Raporu</span>
                              <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 mt-0.5 bg-amber-50 text-amber-700 border-amber-200">Yeni Eklendi</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Rapor</Badge>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">0.9 MB</td>
                        <td className="p-4 align-middle text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" />
                              <AvatarFallback>AY</AvatarFallback>
                            </Avatar>
                            <span>Ayşe Kaya</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">Bugün</td>
                        <td className="p-4 align-middle text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">3 dosya gösteriliyor</div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Önceki
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      Sonraki
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Tüm Dokümanlar
              </Button>
              <Button className="gap-1">
                <Upload className="h-4 w-4" />
                <span>Yeni Doküman</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Ekip & İletişim
              </CardTitle>
              <CardDescription>Proje ekip üyeleri ve iletişim bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingEmployees ? (
                // Yükleniyor durumu
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-muted rounded"></div>
                  <div className="h-48 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  {/* Proje Yöneticisi - İlk takım üyesi veya proje yöneticisi rolündeki kişi */}
                  {teamMembers.length > 0 && (
                    <div className="border rounded-lg bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-slate-900/50 p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarImage src={teamMembers[0].employee.profilePictureUrl} />
                            <AvatarFallback className="text-lg">
                              {getInitials(teamMembers[0].employee.name, teamMembers[0].employee.surname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-lg">{teamMembers[0].employee.name} {teamMembers[0].employee.surname}</h3>
                            <p className="text-sm text-muted-foreground">{teamMembers[0].role || 'Proje Ekip Üyesi'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="bg-primary-50 text-primary border-primary-200">
                                {teamMembers[0].employee.position || (teamMembers[0].employee.department?.name || 'Görev Belirtilmemiş')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {teamMembers[0].employee.phoneNumber && (
                            <Button size="sm" variant="outline" className="gap-1">
                              <Phone className="h-4 w-4" />
                              <span>Ara</span>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="gap-1">
                            <Mail className="h-4 w-4" />
                            <span>E-posta</span>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">E-posta</span>
                          <span className="font-medium">{teamMembers[0].employee.email}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Telefon</span>
                          <span className="font-medium">{teamMembers[0].employee.phoneNumber || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Departman</span>
                          <span className="font-medium">{teamMembers[0].employee.department?.name || '-'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Proje Ekibi - Diğer takım üyeleri */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" /> 
                        Proje Ekibi
                      </h3>
                      <Button size="sm" variant="outline" className="gap-1">
                        <UserPlus className="h-4 w-4" />
                        <span>Ekip Üyesi Ekle</span>
                      </Button>
                    </div>
                    
                    {teamMembers.length <= 1 ? (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-25" />
                        <h4 className="font-medium mb-1">Henüz Ekip Üyesi Yok</h4>
                        <p className="text-sm mb-4">Bu projeye henüz ekip üyesi eklenmemiş.</p>
                        <Button size="sm">Ekip Üyesi Ekle</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* İlk üye proje yöneticisi olarak gösterildiği için, diğer üyeleri liste halinde gösteriyoruz */}
                        {teamMembers.slice(1).map((member) => (
                          <div key={member.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                            <Avatar>
                              <AvatarImage src={member.employee.profilePictureUrl} />
                              <AvatarFallback>{getInitials(member.employee.name, member.employee.surname)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start w-full">
                                <div>
                                  <h4 className="font-medium">{member.employee.name} {member.employee.surname}</h4>
                                  <p className="text-sm text-muted-foreground">{member.role || 'Ekip Üyesi'}</p>
                                </div>
                                <div className="flex gap-1">
                                  {member.employee.phoneNumber && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs text-muted-foreground">E-posta</span>
                                  <span>{member.employee.email}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs text-muted-foreground">Telefon</span>
                                  <span>{member.employee.phoneNumber || '-'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Müşteri İletişim Bilgileri - Eğer mevcutsa */}
                  {project.Customer && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 p-3 border-b">
                        <h3 className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4 text-amber-600" />
                          Müşteri İletişim Bilgileri
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-amber-100 text-amber-800">
                              {project.Customer.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{project.Customer.name}</h4>
                            <p className="text-sm text-muted-foreground">Müşteri</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md">
                            <span className="text-xs text-muted-foreground">İletişim Kişisi</span>
                            <span className="font-medium">-</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md">
                            <span className="text-xs text-muted-foreground">Telefon</span>
                            <span className="font-medium">-</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md">
                            <span className="text-xs text-muted-foreground">E-posta</span>
                            <span className="font-medium">-</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md">
                            <span className="text-xs text-muted-foreground">Adres</span>
                            <span className="font-medium">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Tüm Proje Ekibi
              </Button>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Yeni Ekip Üyesi Ekle
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 