"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PlusCircle, 
  Eye, 
  Loader2, 
  AlertCircle, 
  ClipboardList, 
  User, 
  Calendar, 
  CalendarClock, 
  Check, 
  Clock, 
  XCircle, 
  Flag,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale'; // Import Turkish locale

// Define interfaces based on Prisma schema
interface ProjectManager {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: string | null;
  endDate: string | null;
  progress: number;
  manager: ProjectManager | null;
  createdAt: string;
}

// Helper function to get status badge variant
const getStatusVariant = (status: Project['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'IN_PROGRESS': return 'default'; // Mavi (varsayılan)
    case 'COMPLETED': return 'default'; // Yeşil yerine mavi kullanabiliriz veya özel stil ekleyebiliriz.
    case 'PLANNING': return 'secondary'; // Gri
    case 'ON_HOLD': return 'outline'; // Sarı yerine çerçeveli kullanabiliriz.
    case 'CANCELLED': return 'destructive'; // Kırmızı
    default: return 'secondary';
  }
};

// Helper function to translate status
const translateStatus = (status: Project['status']): string => {
  switch (status) {
    case 'PLANNING': return 'Planlama';
    case 'IN_PROGRESS': return 'Devam Ediyor';
    case 'ON_HOLD': return 'Beklemede';
    case 'COMPLETED': return 'Tamamlandı';
    case 'CANCELLED': return 'İptal Edildi';
    default: return status;
  }
};

// Helper function to translate priority
const translatePriority = (priority: Project['priority']): string => {
    switch (priority) {
        case 'LOW': return 'Düşük';
        case 'MEDIUM': return 'Orta';
        case 'HIGH': return 'Yüksek';
        case 'URGENT': return 'Acil';
        default: return priority;
    }
};

// Helper function to get status icon
const getStatusIcon = (status: Project['status']) => {
  switch (status) {
      case 'COMPLETED': return <Check className="h-4 w-4 text-green-600" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4 text-blue-600" />;
      case 'PLANNING': return <ClipboardList className="h-4 w-4 text-gray-500" />;
      case 'ON_HOLD': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
  }
};

// Helper function to get priority icon
const getPriorityIcon = (priority: Project['priority']) => {
  switch (priority) {
      case 'LOW': return <Flag className="h-4 w-4 text-blue-500" />;
      case 'MEDIUM': return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'HIGH': return <Flag className="h-4 w-4 text-orange-500" />;
      case 'URGENT': return <Flag className="h-4 w-4 text-red-600" />;
      default: return null;
  }
};

// Helper function to format manager name (not separating first/last names as we don't have separate fields)
const formatManagerName = (name: string | undefined | null): string => {
  if (!name) return "-";
  
  // Assuming the name might be stored as "First Last" format already
  // If there's a specific format or standard for names in your system, 
  // this function can be adjusted accordingly
  return name;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        // Log received data for debugging
        console.log('Projects API Response:', data);
        
        // Check for API error response
        if (!response.ok) {
          throw new Error(data.message || 'Sunucu hatası: Projeler getirilemedi.');
        }
        
        // Check for success flag in response
        if (data.success === false) {
          throw new Error(data.message || 'Projeler getirilemedi.');
        }
        
        // Extract projects from data field if exists, otherwise use the data directly
        const projectsData = data.data || data;
        
        // Validate projects array
        if (!Array.isArray(projectsData)) {
          console.error('Geçersiz API yanıtı: Dizi değil', projectsData);
          throw new Error('Geçersiz API yanıtı: Projeler listesi alınamadı.');
        }
        
        setProjects(projectsData);
      } catch (err: any) { // Explicitly type err as any or Error
        console.error("Projeler alınırken hata:", err);
        setError(err.message || 'Projeler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-xl p-6 mb-4 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
              <ClipboardList className="mr-3 h-8 w-8" /> Projeler
            </h1>
            <p className="text-blue-100 mt-1 opacity-90">
              Şirket projelerinizi yönetin ve takip edin
            </p>
          </div>
          <Button asChild className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white">
            <Link href="/projects/new"> 
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Proje Oluştur
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
              <div>
                <CardTitle>Proje Listesi</CardTitle>
                <CardDescription className="hidden sm:block">
                  {projects.length > 0 
                    ? `Toplam ${projects.length} aktif proje` 
                    : 'Henüz proje bulunmuyor'}
                </CardDescription>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              Son güncelleme: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Projeler yükleniyor...</p>
              </div>
            </div>
          ) : error ? (
             <div className="flex flex-col items-center justify-center h-64 text-destructive">
               <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-3">
                 <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
               </div>
               <p className="text-center text-red-600 dark:text-red-400 mb-2">Projeler yüklenirken hata oluştu</p>
               <p className="text-sm text-center text-slate-600 dark:text-slate-400 max-w-md mb-4">{error}</p>
               <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                 <Loader2 className="mr-2 h-3 w-3" /> Tekrar Dene
               </Button>
             </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Henüz hiç proje oluşturulmamış.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                Yeni bir proje oluşturmak için yukarıdaki "Yeni Proje Oluştur" butonunu kullanabilirsiniz.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/projects/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Yeni Proje Oluştur
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="font-medium">Proje Adı</TableHead>
                    <TableHead className="font-medium">Durum</TableHead>
                    <TableHead className="font-medium">Öncelik</TableHead>
                    <TableHead className="font-medium">Yönetici</TableHead>
                    <TableHead className="font-medium">Başlangıç</TableHead>
                    <TableHead className="font-medium">Bitiş</TableHead>
                    <TableHead className="w-[15%] font-medium">İlerleme</TableHead>
                    <TableHead className="text-right font-medium">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/projects/${project.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(project.status)}
                          className="px-2 py-0.5 text-xs"
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)} {translateStatus(project.status)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(project.priority)} {translatePriority(project.priority)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {project.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <User className="h-3 w-3" />
                            </div>
                            <span>
                              {formatManagerName(project.manager.name)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.startDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span>{format(new Date(project.startDate), 'dd MMM yyyy', { locale: tr })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.endDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarClock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                            <span>{format(new Date(project.endDate), 'dd MMM yyyy', { locale: tr })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                project.progress >= 100 
                                  ? 'bg-green-500 dark:bg-green-600' 
                                  : project.status === 'ON_HOLD' 
                                    ? 'bg-yellow-500 dark:bg-yellow-600'
                                    : project.status === 'CANCELLED'
                                      ? 'bg-red-500 dark:bg-red-600'
                                      : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">%{project.progress}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild className="h-8 gap-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors">
                          <Link href={`/projects/${project.id}`}> 
                            <Eye className="h-3 w-3" /> Detay
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 