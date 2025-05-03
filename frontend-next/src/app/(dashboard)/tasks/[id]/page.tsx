"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTaskById } from '@/services/taskService';
import { Task } from '@/types/task';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CalendarDays, User, Users, FolderKanban, Flag, Building, AlertCircle, CheckCircle, Clock, Ban, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Durum ve Öncelik konfigürasyonları (TaskPage'den alınabilir veya ortak bir yere taşınabilir)
const statusConfig: Record<TaskStatus, { color: string; text: string; icon: React.ElementType }> = {
  [TaskStatus.TODO]: { color: 'border-gray-500 text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', text: 'Yapılacak', icon: Clock },
  [TaskStatus.IN_PROGRESS]: { color: 'border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300', text: 'Devam Ediyor', icon: Loader2 }, 
  [TaskStatus.REVIEW]: { color: 'border-yellow-500 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300', text: 'İncelemede', icon: Search },
  [TaskStatus.COMPLETED]: { color: 'border-green-500 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300', text: 'Tamamlandı', icon: CheckCircle },
  [TaskStatus.CANCELLED]: { color: 'border-red-500 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300', text: 'İptal', icon: Ban },
};

const priorityConfig: Record<TaskPriority, { color: string; text: string; icon: React.ElementType }> = {
  [TaskPriority.LOW]: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: 'Düşük', icon: ChevronDown },
  [TaskPriority.MEDIUM]: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', text: 'Orta', icon: ChevronRight },
  [TaskPriority.HIGH]: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', text: 'Yüksek', icon: ChevronRight },
  [TaskPriority.URGENT]: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', text: 'Acil', icon: AlertCircle },
};

// Tarih formatlama fonksiyonu
const formatDate = (date: Date | string | null): string => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-"; 
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(dateObj);
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return "-";
  }
};

const getInitials = (name?: string | null, surname?: string | null): string => {
    const firstNameInitial = name ? name.charAt(0).toUpperCase() : '';
    const lastNameInitial = surname ? surname.charAt(0).toUpperCase() : '';
    return `${firstNameInitial}${lastNameInitial}` || '??';
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
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
        console.log(`[TaskDetailPage] Fetching task with ID: ${id}`);
        const fetchedTask = await getTaskById(id);
        if (fetchedTask) {
          console.log("[TaskDetailPage] Task found:", fetchedTask);
          setTask(fetchedTask);
        } else {
          console.log("[TaskDetailPage] Task not found.");
          setError("Görev bulunamadı.");
        }
      } catch (err) {
        console.error("[TaskDetailPage] Error fetching task:", err);
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
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  if (!task) {
    // Bu durum normalde error state'i tarafından yakalanmalı ama yine de kontrol edelim
    return (
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Görev bulunamadı.</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>
        </div>
    );
  }

  const statusInfo = statusConfig[task.status] || statusConfig[TaskStatus.TODO];
  const priorityInfo = priorityConfig[task.priority] || priorityConfig[TaskPriority.MEDIUM];
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Geri Butonu */}
      <Button onClick={() => router.push('/tasks')} variant="outline" size="sm" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Görev Listesine Dön
      </Button>

      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground mb-1">{task.title}</CardTitle>
              {task.project && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FolderKanban className="h-4 w-4 mr-1.5 opacity-80" />
                  <span>{task.project.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`whitespace-nowrap border ${statusInfo.color}`}>
                <StatusIcon className={`h-4 w-4 mr-1.5 ${task.status === TaskStatus.IN_PROGRESS ? 'animate-spin' : ''}`} />
                {statusInfo.text}
              </Badge>
              <Badge className={`whitespace-nowrap ${priorityInfo.color}`}>
                <PriorityIcon className="h-4 w-4 mr-1.5" />
                {priorityInfo.text}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Açıklama */}
          {task.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Açıklama</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          
          <Separator />

          {/* Detaylar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Atanan Kişiler */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground flex items-center">
                <Users className="h-5 w-5 mr-2 opacity-80" /> Atanan Kişiler
              </h3>
              {task.assignees && task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {task.assignees.map((assignee) => (
                    <TooltipProvider key={assignee.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={assignee.profilePictureUrl || undefined} alt={`${assignee.name} ${assignee.surname || ''}`} />
                            <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">
                              {getInitials(assignee.name, assignee.surname)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
                          <p>{assignee.name} {assignee.surname || ''}</p>
                          <p className="text-gray-400 text-xs">{assignee.position || 'Pozisyon Yok'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Bu göreve kimse atanmamış.</p>
              )}
            </div>

            {/* Departman (varsa) */}
            {task.department && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground flex items-center">
                  <Building className="h-5 w-5 mr-2 opacity-80" /> Departman
                </h3>
                <p className="text-sm text-muted-foreground">{task.department.name}</p>
              </div>
            )}

            {/* Bitiş Tarihi */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 opacity-80" /> Bitiş Tarihi
              </h3>
              <p className={`text-sm ${!task.dueDate ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                {task.dueDate ? formatDate(task.dueDate) : "Belirtilmemiş"}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 px-6 py-3 text-xs text-muted-foreground flex justify-between">
          <span>Oluşturulma: {formatDate(task.createdAt)}</span>
          <span>Son Güncelleme: {formatDate(task.updatedAt)}</span>
        </CardFooter>
      </Card>
    </div>
  );
} 