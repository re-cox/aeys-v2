"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTaskById } from '@/services/taskService';
import { Task as TaskType } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, ArrowLeft, CalendarDays, Users, FolderKanban, Flag, Building, 
  AlertCircle, CheckCircle, Clock, Ban, Search, ChevronDown, ChevronRight, 
  FileText, UserCheck, CalendarPlus, CalendarClock, CalendarCheck 
} from 'lucide-react';
import { TaskStatus, Priority } from '@prisma/client';
import { cn } from '@/lib/utils';

// Durum ve Öncelik konfigürasyonları (TaskPage'den kopyalandı, ortak bir dosyaya taşınabilir)
const statusConfig: Record<TaskStatus, { color: string; text: string; icon: React.ElementType; badgeClass?: string }> = {
  [TaskStatus.TODO]: { color: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700', text: 'Yapılacak', icon: Clock, badgeClass: 'border-gray-300' },
  [TaskStatus.IN_PROGRESS]: { color: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/60', text: 'Devam Ediyor', icon: Loader2, badgeClass: 'border-blue-300' }, 
  [TaskStatus.REVIEW]: { color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/60', text: 'İncelemede', icon: Search, badgeClass: 'border-yellow-400' },
  [TaskStatus.COMPLETED]: { color: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/60', text: 'Tamamlandı', icon: CheckCircle, badgeClass: 'border-green-400' },
  [TaskStatus.CANCELLED]: { color: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/60', text: 'İptal', icon: Ban, badgeClass: 'border-red-400' },
};

const priorityConfig: Record<Priority, { color: string; text: string; icon: React.ElementType; badgeClass?: string }> = {
  [Priority.LOW]: { color: 'text-gray-700 bg-gray-200 dark:text-gray-200 dark:bg-gray-600', text: 'Düşük', icon: ChevronDown },
  [Priority.MEDIUM]: { color: 'text-blue-700 bg-blue-200 dark:text-blue-200 dark:bg-blue-700/70', text: 'Orta', icon: ChevronRight },
  [Priority.HIGH]: { color: 'text-orange-700 bg-orange-200 dark:text-orange-200 dark:bg-orange-700/70', text: 'Yüksek', icon: Flag },
  [Priority.URGENT]: { color: 'text-red-700 bg-red-200 dark:text-red-200 dark:bg-red-700/70', text: 'Acil', icon: AlertCircle },
};

const formatDate = (date: Date | string | null, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Geçersiz Tarih"; 
    const defaultOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('tr-TR', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return "Hatalı Tarih";
  }
};

const getInitials = (name?: string | null, surname?: string | null): string => {
    const firstNameInitial = name ? name.charAt(0).toUpperCase() : '';
    const lastNameInitial = surname ? surname.charAt(0).toUpperCase() : '';
    return `${firstNameInitial}${lastNameInitial}` || '??';
};

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | null | React.ReactNode;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, className }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {typeof value === 'string' ? <p className="text-sm text-foreground break-words">{value}</p> : value}
      </div>
    </div>
  );
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [task, setTask] = useState<TaskType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Görev ID bulunamadı.");
      setLoading(false);
      return;
    }
    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTaskById(id);
        console.log('Fetched Task Response:', response);
        if (response && typeof response.success === 'boolean') {
          if (response.success && response.data) {
            setTask(response.data as TaskType);
          } else if (!response.success) {
            setError((response as any).error || "Görev yüklenirken bir sunucu hatası oluştu.");
          } else {
            setError("Görev verisi bulunamadı (success true ama data yok).");
          }
        } else {
          setError("Görev yüklenirken beklenmedik bir yanıt formatı alındı.");
          console.error("Beklenmedik yanıt formatı:", response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Görev yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xl text-muted-foreground">Görev bulunamadı.</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>
        </div>
    );
  }

  const statusInfo = statusConfig[task.status] || statusConfig[TaskStatus.TODO];
  const priorityInfo = priorityConfig[task.priority] || priorityConfig[Priority.MEDIUM];
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header: Geri Butonu, Başlık, Proje, Badgeler */}
      <div>
        <Button onClick={() => router.push('/tasks')} variant="outline" size="sm" className="mb-6 shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Görev Listesine Dön
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1.5 break-words">{task.title}</h1>
            {task.project && (
              <Link href={`/projects/${task.project.id}`} className="group inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <FolderKanban className="h-4 w-4 mr-1.5 opacity-80 group-hover:text-primary" />
                <span>{task.project.name}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1 md:mt-0">
            <Badge variant="outline" className={`py-1 px-3 text-xs font-medium rounded-full border ${statusInfo.badgeClass || 'border-transparent'} ${statusInfo.color}`}>
              <StatusIcon className={`h-4 w-4 mr-1.5 ${task.status === TaskStatus.IN_PROGRESS ? 'animate-spin' : ''}`} />
              {statusInfo.text}
            </Badge>
            <Badge variant="outline" className={`py-1 px-3 text-xs font-medium rounded-full border ${priorityInfo.badgeClass || 'border-transparent'} ${priorityInfo.color}`}>
              <PriorityIcon className="h-4 w-4 mr-1.5" />
              {priorityInfo.text}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Ana İçerik: İki Sütunlu Yapı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        {/* Sol Sütun: Açıklama vb. */}
        <div className="lg:col-span-2 space-y-6">
          {task.description && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Açıklama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
              </CardContent>
            </Card>
          )}
          {!task.description && (
             <Card className="shadow-md">
              <CardContent className="pt-6">
                <p className="text-muted-foreground italic text-sm">Bu görev için bir açıklama girilmemiş.</p>
                </CardContent>
            </Card>
          )}
          {/* İleride eklenebilecek diğer kartlar (alt görevler, yorumlar vb.) */}
        </div>

        {/* Sağ Sütun: Detaylar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Detaylar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailItem
                icon={Users}
                label="Atanan Kişiler"
                value={
                  task.assignees && task.assignees.length > 0 ? (
                    <div className="flex flex-col space-y-2 mt-1">
                      {task.assignees.map((assignee) => (
                        <TooltipProvider key={assignee.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2 group cursor-default w-full">
                                <Avatar className="h-7 w-7 text-xs">
                                  <AvatarImage src={assignee.profilePictureUrl || undefined} />
                                  <AvatarFallback className="bg-muted font-semibold">
                                    {getInitials(assignee.name, assignee.surname)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{assignee.name} {assignee.surname || ''}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-background shadow-lg border text-foreground">
                              <p className="font-medium">{assignee.name} {assignee.surname || ''}</p>
                              {assignee.email && <p className="text-xs text-muted-foreground">{assignee.email}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mt-1">Kimse atanmamış.</p>
                  )
                }
              />
              
              {task.project?.department && (
                <DetailItem 
                  icon={Building} 
                  label="Departman (Proje)"
                  value={task.project.department.name} 
                />
              )}

              {task.createdBy && (
                 <DetailItem
                  icon={UserCheck}
                  label="Oluşturan Kişi"
                  value={
                    <div className="flex items-center space-x-2 mt-1 group cursor-default">
                       <Avatar className="h-7 w-7 text-xs">
                        <AvatarImage src={task.createdBy.profilePictureUrl || undefined} />
                        <AvatarFallback className="bg-muted font-semibold">
                          {getInitials(task.createdBy.name, task.createdBy.surname)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{task.createdBy.name} {task.createdBy.surname || ''}</span>
                    </div>
                  }
                />
              )}
              
              <Separator />
              
              <DetailItem icon={CalendarPlus} label="Oluşturulma Tarihi" value={formatDate(task.createdAt, { hour: '2-digit', minute: '2-digit' })} />
              <DetailItem icon={CalendarClock} label="Bitiş Tarihi" value={task.dueDate ? formatDate(task.dueDate) : "Belirtilmemiş"} />
              <DetailItem icon={CalendarCheck} label="Son Güncelleme" value={formatDate(task.updatedAt, { hour: '2-digit', minute: '2-digit'})} />
            
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 