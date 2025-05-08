"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusCircle, 
  Eye, 
  Loader2, 
  AlertCircle, 
  ClipboardList, 
  User, 
  Calendar as CalendarIcon, 
  CalendarDays,
  Check, 
  Clock, 
  XCircle, 
  Flag,
  Play,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Building,
  Briefcase,
  Plus
} from 'lucide-react';
import { format, isAfter, isBefore, isWithinInterval, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from "react-day-picker";

// Define interfaces based on Prisma schema
interface ProjectManager {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
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
  Customer: Customer | null;
}

// Helper function to get status badge variant
const getStatusVariant = (status: Project['status']): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case 'IN_PROGRESS': return "default"; // Mavi
    case 'COMPLETED': return "success"; // Yeşil
    case 'PLANNING': return "secondary"; // Gri
    case 'ON_HOLD': return "outline"; // Çerçeveli
    case 'CANCELLED': return "destructive"; // Kırmızı
    default: return "secondary";
  }
};

// Helper function to translate status
const translateStatus = (status: Project['status']): string => {
  switch (status) {
    case 'PLANNING': return "Planlama";
    case 'IN_PROGRESS': return "Devam Ediyor";
    case 'ON_HOLD': return "Beklemede";
    case 'COMPLETED': return "Tamamlandı";
    case 'CANCELLED': return "İptal Edildi";
    default: return status;
  }
};

// Helper function to translate priority
const translatePriority = (priority: Project['priority']): string => {
  switch (priority) {
    case 'LOW': return "Düşük";
    case 'MEDIUM': return "Orta";
    case 'HIGH': return "Yüksek";
    case 'URGENT': return "Acil";
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

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreleme durumları
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' veya 'completed'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // Görünüm modu: tablo veya kartlar

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
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
      } catch (err: any) {
        console.error("Projeler alınırken hata:", err);
        setError(err.message || 'Projeler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Proje durumlarına göre gruplandırma
  const activeProjects = useMemo(() => {
    return projects.filter(project => project.status !== 'COMPLETED' && project.status !== 'CANCELLED');
  }, [projects]);

  // Tamamlanmış projeler
  const completedProjects = useMemo(() => {
    return projects.filter(project => project.status === 'COMPLETED');
  }, [projects]);

  // İptal edilmiş projeler
  const cancelledProjects = useMemo(() => {
    return projects.filter(project => project.status === 'CANCELLED');
  }, [projects]);

  // Arama ve filtreleme fonksiyonu
  const filterProjects = (projectsList: Project[]) => {
    return projectsList.filter(project => {
      // İsim araması
      const nameMatch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Müşteri araması
      const customerMatch = !customerSearchTerm || 
        (project.Customer && project.Customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()));
      
      // Durum filtresi
      const statusMatch = !statusFilter || statusFilter === "ALL" || project.status === statusFilter;
      
      // Tarih aralığı filtresi
      let dateMatch = true;
      if (selectedDateRange.from && selectedDateRange.to && project.startDate) {
        const projectStartDate = parseISO(project.startDate);
        dateMatch = isWithinInterval(
          projectStartDate, 
          { 
            start: selectedDateRange.from, 
            end: selectedDateRange.to 
          }
        );
      } else if (selectedDateRange.from && project.startDate) {
        const projectStartDate = parseISO(project.startDate);
        dateMatch = isAfter(projectStartDate, selectedDateRange.from);
      } else if (selectedDateRange.to && project.startDate) {
        const projectStartDate = parseISO(project.startDate);
        dateMatch = isBefore(projectStartDate, selectedDateRange.to);
      }
      
      return nameMatch && customerMatch && statusMatch && dateMatch;
    });
  };

  // Filtrelenmiş proje listeleri
  const filteredActiveProjects = useMemo(() => filterProjects(activeProjects), 
    [activeProjects, searchTerm, statusFilter, selectedDateRange, customerSearchTerm]);
  
  const filteredCompletedProjects = useMemo(() => filterProjects(completedProjects), 
    [completedProjects, searchTerm, statusFilter, selectedDateRange, customerSearchTerm]);
    
  const filteredCancelledProjects = useMemo(() => filterProjects(cancelledProjects),
    [cancelledProjects, searchTerm, statusFilter, selectedDateRange, customerSearchTerm]);

  // Tablo görünümü bileşeni
  const ProjectTable = ({ projects }: { projects: Project[] }) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow>
            <TableHead className="font-medium">Proje Adı</TableHead>
            <TableHead className="font-medium">Müşteri</TableHead>
            <TableHead className="font-medium">Durum</TableHead>
            <TableHead className="font-medium hidden md:table-cell">Öncelik</TableHead>
            <TableHead className="font-medium hidden md:table-cell">Başlangıç</TableHead>
            <TableHead className="font-medium hidden lg:table-cell">Bitiş</TableHead>
            <TableHead className="w-[15%] font-medium">İlerleme</TableHead>
            <TableHead className="text-right font-medium">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                Bu kriterlere uygun proje bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                      {format(new Date(project.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.Customer ? (
                    <div className="flex items-center space-x-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{project.Customer.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant={getStatusVariant(project.status)} className="flex gap-1 items-center">
                      {getStatusIcon(project.status)}
                      {translateStatus(project.status)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(project.priority)}
                    <span>{translatePriority(project.priority)}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {project.startDate ? (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{format(new Date(project.startDate), 'dd MMM yyyy', { locale: tr })}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {project.endDate ? (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{format(new Date(project.endDate), 'dd MMM yyyy', { locale: tr })}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress || 0} className="h-2" />
                    <span className="text-xs font-medium">{project.progress || 0}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Detay</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Kart görünümü bileşeni
  const ProjectCards = ({ projects }: { projects: Project[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Bu kriterlere uygun proje bulunamadı.</p>
        </div>
      ) : (
        projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant={getStatusVariant(project.status)} className="flex gap-1 items-center mb-2">
                    {getStatusIcon(project.status)}
                    {translateStatus(project.status)}
                  </Badge>
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  {project.Customer && (
                    <CardDescription className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      {project.Customer.name}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center justify-center bg-primary-50 dark:bg-primary-950 rounded-full w-10 h-10 text-primary-600 dark:text-primary-300">
                  {project.priority === 'URGENT' && (
                    <Flag className="h-5 w-5 text-red-600" />
                  )}
                  {project.priority === 'HIGH' && (
                    <Flag className="h-5 w-5 text-orange-500" />
                  )}
                  {project.priority === 'MEDIUM' && (
                    <Flag className="h-5 w-5 text-yellow-500" />
                  )}
                  {project.priority === 'LOW' && (
                    <Flag className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Başlangıç:</span>
                  </div>
                  <span className="font-medium">
                    {project.startDate 
                      ? format(new Date(project.startDate), 'dd MMM yyyy', { locale: tr })
                      : '-'
                    }
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2 border-t">
              <time className="text-xs text-muted-foreground">
                {format(new Date(project.createdAt), 'dd MMM yyyy', { locale: tr })}
              </time>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 gap-1"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Detay</span>
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

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
        </div>
      </div>

      {/* Filtre Bölümü */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>Filtreler</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Proje İsmi Arama */}
            <div className="space-y-2">
              <Label htmlFor="search">Proje İsmi</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Proje ara..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Müşteri Arama */}
            <div className="space-y-2">
              <Label htmlFor="customer">Müşteri</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer"
                  placeholder="Müşteri ara..."
                  className="pl-8"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tarih Aralığı */}
            <div className="space-y-2">
              <Label htmlFor="date-range">Tarih Aralığı</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateRange.from ? (
                      selectedDateRange.to ? (
                        <>
                          {format(selectedDateRange.from, "d MMM yyyy", { locale: tr })} -{" "}
                          {format(selectedDateRange.to, "d MMM yyyy", { locale: tr })}
                        </>
                      ) : (
                        format(selectedDateRange.from, "d MMM yyyy", { locale: tr })
                      )
                    ) : (
                      <span className="text-muted-foreground">Tarih seçin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDateRange.from}
                    selected={selectedDateRange}
                    onSelect={(range) => {
                      if (range) setSelectedDateRange(range);
                    }}
                    locale={tr}
                    numberOfMonths={2}
                  />
                  <div className="flex items-center justify-between p-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedDateRange.from && selectedDateRange.to
                        ? `${format(selectedDateRange.from, "d MMM yyyy", { locale: tr })} - ${format(selectedDateRange.to, "d MMM yyyy", { locale: tr })}`
                        : selectedDateRange.from
                        ? `${format(selectedDateRange.from, "d MMM yyyy", { locale: tr })} - ?`
                        : "Tarih seçiniz"}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedDateRange({ from: undefined, to: undefined })}
                    >
                      Temizle
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Durum Filtresi */}
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                  <SelectItem value="PLANNING">Planlama</SelectItem>
                  <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                  <SelectItem value="ON_HOLD">Beklemede</SelectItem>
                  <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtre Temizleme Butonu */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCustomerSearchTerm('');
                setStatusFilter('ALL');
                setSelectedDateRange({ from: undefined, to: undefined });
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sekme Tabanlı Proje Görünümü */}
      {isLoading ? (
        <Card className="border shadow-sm">
          <CardContent className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Projeler yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center h-64 text-destructive">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-center text-red-600 dark:text-red-400 mb-2">Projeler yüklenirken hata oluştu</p>
            <p className="text-sm text-center text-slate-600 dark:text-slate-400 max-w-md mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              <Loader2 className="mr-2 h-3 w-3" /> Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="active" className="relative">
                Aktif Projeler
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredActiveProjects.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Tamamlanan Projeler
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredCompletedProjects.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="relative">
                İptal Edilen Projeler
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredCancelledProjects.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="border rounded-md p-1 flex items-center">
                <Button
                  variant={viewMode === 'table' ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-sm"
                  onClick={() => setViewMode('table')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Tablo</span>
                </Button>
                <Button
                  variant={viewMode === 'cards' ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Kartlar</span>
                </Button>
              </div>
              
              <Button asChild>
                <Link href="/projects/new"> 
                  <PlusCircle className="mr-2 h-4 w-4" /> Yeni Proje
                </Link>
              </Button>
            </div>
          </div>
          
          <TabsContent value="active" className="mt-0">
            {viewMode === 'table' ? <ProjectTable projects={filteredActiveProjects} /> : <ProjectCards projects={filteredActiveProjects} />}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {viewMode === 'table' ? <ProjectTable projects={filteredCompletedProjects} /> : <ProjectCards projects={filteredCompletedProjects} />}
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-0">
            {viewMode === 'table' ? <ProjectTable projects={filteredCancelledProjects} /> : <ProjectCards projects={filteredCancelledProjects} />}
          </TabsContent>
        </Tabs>
      )}

      {/* Yeni Proje Ekleme Floating Action Button (Mobil için) */}
      <Link 
        href="/projects/new" 
        className="fixed bottom-6 right-6 md:hidden bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg flex items-center justify-center z-50 transition-all"
      >
        <PlusCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}

// Label bileşeni
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
} 