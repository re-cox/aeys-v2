"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
    Loader2, AlertCircle, ArrowLeft, Edit, Trash2, User, Users, CalendarDays,
    Paperclip, Image as ImageIcon, PlusCircle, Upload, Download, DollarSign,
    ClipboardList, Flag, Clock, CheckCircle, XCircle, FolderKanban, Mail, Play,
    Pencil, Save, X, UserPlus, UserMinus, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Interface definitions matching the API response structure
interface Employee {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string | null;
}

interface ProjectTeamMember {
    id: string;
    employee: Employee;
    role?: string | null;
}

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string | null;
    assignee?: Employee | null;
}

interface ProjectFile {
    id: string;
    originalName: string;
    fileType: string;
    size?: number | null;
    uploadedAt: string;
    path: string; // Needed for download link
    uploadedBy?: { id: string; name: string } | null;
}

interface ProjectPhoto {
    id: string;
    originalName: string;
    path: string;
    caption?: string | null;
    uploadedAt: string;
    uploadedBy?: { id: string; name: string } | null;
}

interface ProjectDetails {
    id: string;
    name: string;
    description?: string | null;
    status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    startDate?: string | null;
    endDate?: string | null;
    actualEndDate?: string | null;
    budget?: number | null;
    progress: number;
    createdAt: string;
    updatedAt: string;
    manager?: Employee | null;
    team: ProjectTeamMember[];
    tasks: Task[];
    files: ProjectFile[];
    photos: ProjectPhoto[];
}

// Helper functions (translateStatus, translatePriority, getStatusVariant - can be imported from a utils file)
const translateStatus = (status: ProjectDetails['status'] | Task['status']): string => {
  switch (status) {
    case 'PLANNING': return 'Planlama';
    case 'IN_PROGRESS': return 'Devam Ediyor';
    case 'ON_HOLD': return 'Beklemede';
    case 'COMPLETED': return 'Tamamlandı';
    case 'CANCELLED': return 'İptal Edildi';
    case 'TODO': return 'Yapılacak';
    case 'REVIEW': return 'Gözden Geçirme';
    default: return status;
  }
};

const translatePriority = (priority: ProjectDetails['priority'] | Task['priority']): string => {
    switch (priority) {
        case 'LOW': return 'Düşük';
        case 'MEDIUM': return 'Orta';
        case 'HIGH': return 'Yüksek';
        case 'URGENT': return 'Acil';
        default: return priority;
    }
};

const getStatusVariant = (
    status: ProjectDetails['status'] | Task['status']
): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'IN_PROGRESS': return 'default';
        case 'COMPLETED': return 'default';
        case 'PLANNING':
        case 'TODO':
            return 'secondary';
        case 'ON_HOLD':
        case 'REVIEW':
            return 'outline';
        case 'CANCELLED': return 'destructive';
        default: return 'secondary';
    }
};

const getPriorityIcon = (priority: ProjectDetails['priority'] | Task['priority']) => {
    switch (priority) {
        case 'LOW': return <Flag className="h-4 w-4 text-blue-500" />;
        case 'MEDIUM': return <Flag className="h-4 w-4 text-yellow-500" />;
        case 'HIGH': return <Flag className="h-4 w-4 text-orange-500" />;
        case 'URGENT': return <Flag className="h-4 w-4 text-red-600" />;
        default: return null;
    }
};

const getStatusIcon = (status: ProjectDetails['status'] | Task['status']) => {
    switch (status) {
        case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />;
        case 'IN_PROGRESS': return <Play className="h-4 w-4 text-blue-600" />;
        case 'PLANNING': case 'TODO': return <ClipboardList className="h-4 w-4 text-gray-500" />;
        case 'ON_HOLD': case 'REVIEW': return <Clock className="h-4 w-4 text-yellow-600" />;
        default: return null;
    }
};

const formatBytes = (bytes?: number | null, decimals = 2): string => {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Tarih bazlı ilerleme hesaplama fonksiyonu
const calculateProgressByDates = (startDate?: string | null, endDate?: string | null): number => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Başlangıç tarihi gelecekteyse, ilerleme %0
  if (start > today) return 0;
  
  // Bitiş tarihi geçmişse, ilerleme %100
  if (end < today) return 100;
  
  // Toplam süre (milisaniye cinsinden)
  const totalDuration = end.getTime() - start.getTime();
  
  // Bugüne kadar geçen süre (milisaniye cinsinden)
  const elapsedDuration = today.getTime() - start.getTime();
  
  // İlerleme yüzdesi hesaplama ve 0-100 arasına sınırlama
  const progress = Math.round((elapsedDuration / totalDuration) * 100);
  return Math.max(0, Math.min(100, progress));
};

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Yeni state'ler
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [editedDescription, setEditedDescription] = useState<string | undefined | null>("");
    const [editedStartDate, setEditedStartDate] = useState<string | undefined | null>("");
    const [editedEndDate, setEditedEndDate] = useState<string | undefined | null>("");
    const [selectedManagerId, setSelectedManagerId] = useState<string | undefined>("");
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
    const [selectedTeamMemberRole, setSelectedTeamMemberRole] = useState<string>("");
    const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
    
    // Dosya ve fotoğraf yükleme için refs
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const photoInputRef = React.useRef<HTMLInputElement>(null);

    const fetchProjectDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Proje detayları getirilemedi.');
            }
            setProject(data.data);
            setEditedDescription(data.data.description);
            setEditedStartDate(data.data.startDate);
            setEditedEndDate(data.data.endDate);
            setSelectedManagerId(data.data.manager?.id);
        } catch (err: any) {
            console.error("Fetch Error:", err);
            setError(err.message || 'Proje detayları yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    // Çalışan listesini getir
    const fetchEmployees = async () => {
        setIsEmployeesLoading(true);
        try {
            const response = await fetch('/api/employees/list');
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Çalışanlar getirilemedi.');
            }
            setEmployees(data.data);
        } catch (err: any) {
            console.error("Employees Fetch Error:", err);
            toast.error(`Çalışan listesi yüklenirken bir hata oluştu: ${err.message}`);
        } finally {
            setIsEmployeesLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
            fetchEmployees();
        }
    }, [projectId]);

    const handleDeleteProject = async () => {
        if (!project || !confirm(`'${project.name}' projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

        const toastId = toast.loading('Proje siliniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Proje silinemedi.');
            }
            toast.success('Proje başarıyla silindi.', { id: toastId });
            router.push('/projects'); // Redirect to project list after deletion
        } catch (error: any) {
            console.error("Delete Error:", error);
            toast.error(`Proje silme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Proje açıklaması güncelleme
    const handleUpdateDescription = async () => {
        if (!project) return;
        
        const toastId = toast.loading('Açıklama güncelleniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: editedDescription
                }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Açıklama güncellenemedi.');
            }
            
            setProject(prev => prev ? {...prev, description: editedDescription} : null);
            setIsEditing(false);
            toast.success('Açıklama başarıyla güncellendi.', { id: toastId });
        } catch (error: any) {
            console.error("Update Error:", error);
            toast.error(`Açıklama güncelleme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Proje yöneticisi güncelleme
    const handleUpdateManager = async () => {
        if (!project || !selectedManagerId) return;
        
        const toastId = toast.loading('Proje yöneticisi güncelleniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    managerId: selectedManagerId
                }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Proje yöneticisi güncellenemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Proje yöneticisi başarıyla güncellendi.', { id: toastId });
        } catch (error: any) {
            console.error("Update Manager Error:", error);
            toast.error(`Proje yöneticisi güncelleme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Ekip üyesi ekleme
    const handleAddTeamMember = async () => {
        if (!project || !selectedTeamMemberId) return;
        
        const toastId = toast.loading('Ekip üyesi ekleniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}/team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: selectedTeamMemberId,
                    role: selectedTeamMemberRole || undefined
                }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Ekip üyesi eklenemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            setSelectedTeamMemberId("");
            setSelectedTeamMemberRole("");
            toast.success('Ekip üyesi başarıyla eklendi.', { id: toastId });
        } catch (error: any) {
            console.error("Add Team Member Error:", error);
            toast.error(`Ekip üyesi ekleme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Ekip üyesi silme
    const handleRemoveTeamMember = async (teamMemberId: string) => {
        if (!project || !confirm('Bu üyeyi ekipten çıkarmak istediğinizden emin misiniz?')) return;
        
        const toastId = toast.loading('Ekip üyesi çıkarılıyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}/team/${teamMemberId}`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Ekip üyesi çıkarılamadı.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Ekip üyesi başarıyla çıkarıldı.', { id: toastId });
        } catch (error: any) {
            console.error("Remove Team Member Error:", error);
            toast.error(`Ekip üyesi çıkarma başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Dosya yükleme
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        setIsUploading(true);
        const toastId = toast.loading('Dosya yükleniyor...');
        
        try {
            const formData = new FormData();
            formData.append('file', event.target.files[0]);
            formData.append('projectId', projectId);
            
            const response = await fetch(`/api/projects/${projectId}/files`, {
                method: 'POST',
                body: formData,
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Dosya yüklenemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Dosya başarıyla yüklendi.', { id: toastId });
        } catch (error: any) {
            console.error("File Upload Error:", error);
            toast.error(`Dosya yükleme başarısız: ${error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Fotoğraf yükleme
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        setIsUploading(true);
        const toastId = toast.loading('Fotoğraf yükleniyor...');
        
        try {
            const formData = new FormData();
            formData.append('photo', event.target.files[0]);
            formData.append('projectId', projectId);
            
            const response = await fetch(`/api/projects/${projectId}/photos`, {
                method: 'POST',
                body: formData,
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Fotoğraf yüklenemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Fotoğraf başarıyla yüklendi.', { id: toastId });
        } catch (error: any) {
            console.error("Photo Upload Error:", error);
            toast.error(`Fotoğraf yükleme başarısız: ${error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
            if (photoInputRef.current) {
                photoInputRef.current.value = '';
            }
        }
    };

    // Dosya silme
    const handleFileDelete = async (fileId: string) => {
        if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;
        
        const toastId = toast.loading('Dosya siliniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Dosya silinemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Dosya başarıyla silindi.', { id: toastId });
        } catch (error: any) {
            console.error("File Delete Error:", error);
            toast.error(`Dosya silme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Fotoğraf silme
    const handlePhotoDelete = async (photoId: string) => {
        if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) return;
        
        const toastId = toast.loading('Fotoğraf siliniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}/photos/${photoId}`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Fotoğraf silinemedi.');
            }
            
            // Güncel proje bilgilerini getir
            fetchProjectDetails();
            toast.success('Fotoğraf başarıyla silindi.', { id: toastId });
        } catch (error: any) {
            console.error("Photo Delete Error:", error);
            toast.error(`Fotoğraf silme başarısız: ${error.message}`, { id: toastId });
        }
    };

    // Mevcut ekip üyesi mi kontrolü
    const isTeamMember = (employeeId: string): boolean => {
        if (!project || !project.team) return false;
        return project.team.some(member => member.employee.id === employeeId);
    };

    // Fotoğrafı görüntüleme fonksiyonu
    const handleViewPhoto = (photo: ProjectPhoto) => {
        setSelectedPhoto(photo);
    };

    // Proje tarihlerini güncelleme
    const handleUpdateDates = async () => {
        if (!project) return;
        
        const toastId = toast.loading('Tarihler güncelleniyor...');
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startDate: editedStartDate,
                    endDate: editedEndDate,
                    // İlerleme değerini de otomatik hesaplayıp gönderelim
                    progress: calculateProgressByDates(editedStartDate, editedEndDate)
                }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Tarihler güncellenemedi.');
            }
            
            setProject(prev => prev ? {
                ...prev, 
                startDate: editedStartDate, 
                endDate: editedEndDate,
                progress: calculateProgressByDates(editedStartDate, editedEndDate)
            } : null);
            setIsEditingDates(false);
            toast.success('Tarihler başarıyla güncellendi.', { id: toastId });
        } catch (error: any) {
            console.error("Update Dates Error:", error);
            toast.error(`Tarih güncelleme başarısız: ${error.message}`, { id: toastId });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-150px)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-center mb-4">Proje yüklenirken hata oluştu: {error}</p>
                <Button variant="outline" onClick={fetchProjectDetails}>Tekrar Dene</Button>
                <Button variant="link" onClick={() => router.back()} className="mt-2">Geri</Button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
                <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-center text-muted-foreground mb-4">Proje bulunamadı.</p>
                <Button variant="outline" asChild>
                    <Link href="/projects">Proje Listesine Dön</Link>
                </Button>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="container mx-auto py-8 space-y-8">
                {/* Header with Gradient Background */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-xl p-8 mb-8 shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <Button variant="secondary" size="sm" className="mb-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white" onClick={() => router.back()}>
                               <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                            </Button>
                            <h1 className="text-3xl md:text-4xl font-bold flex items-center text-white">
                                {getStatusIcon(project.status)} <span className="ml-2">{project.name}</span>
                            </h1>
                            <p className="text-blue-100 mt-2 max-w-2xl opacity-90">
                                {project.description || "Henüz açıklama eklenmemiş."}
                            </p>
                            <div className="flex gap-3 mt-4">
                                <Badge variant="secondary" className="bg-white/25 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-3 py-1">
                                    {translateStatus(project.status)}
                                </Badge>
                                <Badge variant="secondary" className="bg-white/25 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-3 py-1 flex items-center gap-1">
                                    {getPriorityIcon(project.priority)}{translatePriority(project.priority)}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="secondary" 
                                size="icon" 
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white" onClick={handleDeleteProject}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Açıklama Düzenleme Modalı */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Proje Açıklamasını Düzenle</DialogTitle>
                            <DialogDescription>
                                Proje açıklamasını güncelleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Açıklama</Label>
                                <Textarea
                                    id="description"
                                    value={editedDescription || ""}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    placeholder="Proje açıklaması girin..."
                                    className="min-h-[120px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>İptal</Button>
                            <Button onClick={handleUpdateDescription}>Kaydet</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Progress Card with animation */}
                <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg flex items-center">
                            <FolderKanban className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" /> 
                            Proje İlerlemesi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-in-out"
                                    style={{ width: `${calculateProgressByDates(project.startDate, project.endDate)}%` }}
                                ></div>
                            </div>
                            <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">%{calculateProgressByDates(project.startDate, project.endDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-3">
                            <span>Başlangıç: <span className="font-medium">{project.startDate ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}</span></span>
                            <span>Bitiş: <span className="font-medium">{project.endDate ? format(new Date(project.endDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}</span></span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-2"
                                onClick={() => setIsEditingDates(true)}
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tarih Düzenleme Modalı */}
                <Dialog open={isEditingDates} onOpenChange={setIsEditingDates}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Proje Tarihlerini Düzenle</DialogTitle>
                            <DialogDescription>
                                Projenin başlangıç ve bitiş tarihlerini güncelleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={editedStartDate ? new Date(editedStartDate).toISOString().substring(0, 10) : ""}
                                    onChange={(e) => setEditedStartDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={editedEndDate ? new Date(editedEndDate).toISOString().substring(0, 10) : ""}
                                    onChange={(e) => setEditedEndDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditingDates(false)}>İptal</Button>
                            <Button onClick={handleUpdateDates}>Kaydet</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details & Team */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Project Details Card */}
                        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
                                <CardTitle className="flex items-center text-lg">
                                    <ClipboardList className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
                                    Proje Bilgileri
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                {project.description && (
                                    <div className="bg-blue-50 dark:bg-slate-800/50 border-l-4 border-blue-500 p-4 rounded-r-md relative group">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" /> Bütçe:
                                    </div>
                                    <div className="font-medium">
                                        {project.budget ? (
                                            <span className="text-green-600 dark:text-green-500">
                                                {project.budget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                            </span>
                                        ) : 'Belirtilmemiş'}
                                    </div>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-500" /> Başlangıç Tarihi:
                                    </div>
                                    <div className="font-medium">
                                        {project.startDate ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                                    </div>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4 w-4 text-orange-600 dark:text-orange-500" /> Bitiş Tarihi (Planlanan):
                                    </div>
                                    <div className="font-medium">
                                        {project.endDate ? format(new Date(project.endDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                                    </div>

                                     {project.actualEndDate && (
                                        <>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle className="h-4 w-4 text-green-600" /> Bitiş Tarihi (Gerçekleşen):
                                        </div>
                                        <div className="font-medium text-green-600 dark:text-green-500">
                                            {format(new Date(project.actualEndDate), 'dd MMMM yyyy', { locale: tr })}
                                        </div>
                                        </>
                                     )}

                                     <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4 text-slate-500" /> Oluşturulma Tarihi:
                                    </div>
                                    <div className="font-medium">
                                        {format(new Date(project.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                                    </div>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4 text-slate-500" /> Son Güncelleme:
                                    </div>
                                    <div className="font-medium">
                                        {format(new Date(project.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs: Files, Photos, Tasks */}
                        <Tabs defaultValue="tasks" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
                                    <ClipboardList className="h-4 w-4 mr-2" /> Görevler ({project.tasks.length})
                                </TabsTrigger>
                                <TabsTrigger value="files" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
                                    <Paperclip className="h-4 w-4 mr-2" /> Dosyalar ({project.files.length})
                                </TabsTrigger>
                                <TabsTrigger value="photos" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
                                    <ImageIcon className="h-4 w-4 mr-2" /> Fotoğraflar ({project.photos.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* Tasks Tab */}
                            <TabsContent value="tasks" className="pt-4">
                                <Card className="border-0 shadow-md">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg flex items-center">
                                            <CheckCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
                                            Proje Görevleri
                                        </CardTitle>
                                        {/* TODO: Add New Task Button */} 
                                    </CardHeader>
                                    <CardContent className="p-0">
                                         {project.tasks.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
                                                    <ClipboardList className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400">Bu projeye henüz görev eklenmemiş.</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Yeni görevler ekleyerek projeyi takip edebilirsiniz.</p>
                                            </div>
                                         ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                                                        <TableHead>Başlık</TableHead>
                                                        <TableHead>Durum</TableHead>
                                                        <TableHead>Öncelik</TableHead>
                                                        <TableHead>Atanan</TableHead>
                                                        <TableHead>Bitiş Tarihi</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {project.tasks.map((task) => (
                                                        <TableRow key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                            <TableCell className="font-medium">{task.title}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={getStatusVariant(task.status)} className="px-2 py-0.5 text-xs">
                                                                    <span className="flex items-center gap-1">
                                                                        {getStatusIcon(task.status)} {translateStatus(task.status)}
                                                                    </span>
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="flex items-center gap-1">
                                                                    {getPriorityIcon(task.priority)} {translatePriority(task.priority)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>{task.assignee?.name || '-'}</TableCell>
                                                            <TableCell>
                                                                {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: tr }) : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Files Tab */}
                            <TabsContent value="files" className="pt-4">
                                <Card className="border-0 shadow-md">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg flex items-center">
                                            <Paperclip className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
                                            Proje Dosyaları
                                        </CardTitle>
                                        <div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Yükleniyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" /> Dosya Yükle
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                         {project.files.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
                                                    <Paperclip className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400">Bu projeye henüz dosya eklenmemiş.</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dosya yükleyerek projenizi belgelendirebilirsiniz.</p>
                                            </div>
                                         ) : (
                                            <ul className="divide-y">
                                                {project.files.map((file) => (
                                                <li key={file.id} className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <Paperclip className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                             <a href={`/${file.path}`} download={file.originalName} className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" target="_blank" rel="noopener noreferrer">
                                                                {file.originalName}
                                                            </a>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatBytes(file.size)} • {file.fileType} • Yükleyen: {file.uploadedBy?.name || 'Bilinmiyor'} • {format(new Date(file.uploadedAt), 'dd MMM yyyy', { locale: tr })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                         <Button variant="outline" size="sm" asChild className="text-xs gap-1 h-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors">
                                                            <a href={`/${file.path}`} download={file.originalName} target="_blank" rel="noopener noreferrer">
                                                                <Download className="h-3 w-3" /> İndir
                                                            </a>
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-red-500 hover:text-red-600"
                                                            onClick={() => handleFileDelete(file.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Photos Tab */}
                            <TabsContent value="photos" className="pt-4">
                                <Card className="border-0 shadow-md">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg flex items-center">
                                            <ImageIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
                                            Proje Fotoğrafları
                                        </CardTitle>
                                        <div>
                                            <input 
                                                type="file" 
                                                ref={photoInputRef}
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => photoInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Yükleniyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" /> Fotoğraf Yükle
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {project.photos.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
                                                    <ImageIcon className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400">Bu projeye henüz fotoğraf eklenmemiş.</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fotoğraflar ekleyerek projenin görsel kaydını tutabilirsiniz.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {project.photos.map((photo) => (
                                                <div key={photo.id} className="relative group aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={`/${photo.path}`}
                                                        alt={photo.caption || photo.originalName}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                        className="object-cover transition-all duration-500 group-hover:scale-110"
                                                        onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        {photo.caption && (
                                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                <p className="text-sm text-white">{photo.caption}</p>
                                                                <p className="text-xs text-white/70">{format(new Date(photo.uploadedAt), 'dd MMM yyyy', { locale: tr })}</p>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                                            <Button 
                                                                variant="secondary" 
                                                                size="icon" 
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleViewPhoto(photo)}
                                                            >
                                                                <ImageIcon className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="icon" 
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handlePhotoDelete(photo.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column: Manager & Team */}
                    <div className="space-y-6">
                        {/* Project Manager Card */}
                         {project.manager ? (
                            <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle>Proje Yöneticisi</CardTitle>
                                                <CardDescription className="font-medium text-base">{project.manager.name}</CardDescription>
                                            </div>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Proje Yöneticisini Değiştir</DialogTitle>
                                                    <DialogDescription>
                                                        Projenin yöneticisini değiştirebilirsiniz.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Label htmlFor="managerId" className="mb-2 block">Yeni Proje Yöneticisi</Label>
                                                    <Select 
                                                        value={selectedManagerId} 
                                                        onValueChange={setSelectedManagerId}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Proje yöneticisi seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Çalışanlar</SelectLabel>
                                                                {isEmployeesLoading ? (
                                                                    <div className="flex justify-center p-2">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    </div>
                                                                ) : employees.length === 0 ? (
                                                                    <p className="p-2 text-sm text-muted-foreground">Çalışan bulunamadı</p>
                                                                ) : (
                                                                    employees.map(employee => (
                                                                        <SelectItem key={employee.id} value={employee.id}>
                                                                            {employee.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" type="button">
                                                        İptal
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        onClick={handleUpdateManager} 
                                                        disabled={!selectedManagerId || selectedManagerId === project.manager?.id}
                                                    >
                                                        Değiştir
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-sm">{project.manager.email}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden border-0 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle>Proje Yöneticisi</CardTitle>
                                                <CardDescription className="text-base">Atanmamış</CardDescription>
                                            </div>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <UserPlus className="h-4 w-4 mr-2" /> Ata
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Proje Yöneticisi Ata</DialogTitle>
                                                    <DialogDescription>
                                                        Projeye bir yönetici atayabilirsiniz.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Label htmlFor="managerId" className="mb-2 block">Proje Yöneticisi</Label>
                                                    <Select 
                                                        value={selectedManagerId} 
                                                        onValueChange={setSelectedManagerId}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Proje yöneticisi seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Çalışanlar</SelectLabel>
                                                                {isEmployeesLoading ? (
                                                                    <div className="flex justify-center p-2">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    </div>
                                                                ) : employees.length === 0 ? (
                                                                    <p className="p-2 text-sm text-muted-foreground">Çalışan bulunamadı</p>
                                                                ) : (
                                                                    employees.map(employee => (
                                                                        <SelectItem key={employee.id} value={employee.id}>
                                                                            {employee.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" type="button">
                                                        İptal
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        onClick={handleUpdateManager} 
                                                        disabled={!selectedManagerId}
                                                    >
                                                        Ata
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}

                        {/* Team Members Card */}
                        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle>Proje Ekibi</CardTitle>
                                            <CardDescription className="font-medium text-base">{project.team.length} Üye</CardDescription>
                                        </div>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <UserPlus className="h-4 w-4 mr-2" /> Ekle
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Ekip Üyesi Ekle</DialogTitle>
                                                <DialogDescription>
                                                    Projeye yeni bir ekip üyesi ekleyebilirsiniz.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div>
                                                    <Label htmlFor="teamMemberId" className="mb-2 block">Çalışan</Label>
                                                    <Select 
                                                        value={selectedTeamMemberId} 
                                                        onValueChange={setSelectedTeamMemberId}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Çalışan seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Çalışanlar</SelectLabel>
                                                                {isEmployeesLoading ? (
                                                                    <div className="flex justify-center p-2">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    </div>
                                                                ) : employees.length === 0 ? (
                                                                    <p className="p-2 text-sm text-muted-foreground">Çalışan bulunamadı</p>
                                                                ) : (
                                                                    employees
                                                                        .filter(employee => !isTeamMember(employee.id) && employee.id !== project.manager?.id)
                                                                        .map(employee => (
                                                                            <SelectItem key={employee.id} value={employee.id}>
                                                                                {employee.name}
                                                                            </SelectItem>
                                                                        ))
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="role" className="mb-2 block">Rol (Opsiyonel)</Label>
                                                    <Input 
                                                        id="role" 
                                                        value={selectedTeamMemberRole}
                                                        onChange={(e) => setSelectedTeamMemberRole(e.target.value)}
                                                        placeholder="Ekip üyesinin rolü"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" type="button">
                                                    İptal
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    onClick={handleAddTeamMember} 
                                                    disabled={!selectedTeamMemberId}
                                                >
                                                    Ekle
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            {project.team.length > 0 ? (
                                <CardContent className="pt-4">
                                    <ul className="divide-y">
                                        {project.team.map((member) => (
                                            <li key={member.id} className="py-3 first:pt-0 last:pb-0 relative group">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar or Placeholder */}
                                                     <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden border border-purple-200 dark:border-purple-800">
                                                        {member.employee.profilePictureUrl ? (
                                                            <Image src={member.employee.profilePictureUrl} alt={member.employee.name} width={40} height={40} className="rounded-full object-cover" />
                                                        ) : (
                                                            <User className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{member.employee.name}</p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{member.employee.email}</span>
                                                        </div>
                                                        {member.role && (
                                                            <Badge variant="outline" className="mt-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                                                {member.role}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500"
                                                    onClick={() => handleRemoveTeamMember(member.id)}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            ) : (
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 mb-2">
                                            <Users className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Bu projede henüz ekip üyesi yok.</p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </div>
                
                {/* Fotoğraf Görüntüleme Dialog */}
                <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                    <DialogContent className="max-w-4xl w-full">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                {selectedPhoto?.caption || selectedPhoto?.originalName || 'Proje Fotoğrafı'}
                            </DialogTitle>
                            {selectedPhoto?.caption && (
                                <DialogDescription>
                                    {selectedPhoto.caption}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="relative w-full h-[60vh] overflow-hidden rounded-md">
                            {selectedPhoto && (
                                <Image
                                    src={`/${selectedPhoto.path}`}
                                    alt={selectedPhoto.caption || selectedPhoto.originalName}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 80vw"
                                    className="object-contain"
                                    onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                                />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedPhoto && format(new Date(selectedPhoto.uploadedAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                        </p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
                                Kapat
                            </Button>
                            {selectedPhoto && (
                                <Link href={`/${selectedPhoto.path}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="default">
                                        <ExternalLink className="h-4 w-4 mr-2" /> Yeni Sekmede Aç
                                    </Button>
                                </Link>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
} 