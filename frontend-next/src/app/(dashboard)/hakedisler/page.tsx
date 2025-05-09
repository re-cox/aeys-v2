"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  PlusCircle, 
  FileText, 
  Loader2, 
  AlertCircle, 
  ClipboardList, 
  Calendar, 
  DollarSign, 
  FileCheck,
  FileX,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart4
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { 
  ProgressPayment, 
  ProgressPaymentInput, 
  ProjectFinancialSummary 
} from '@/types/progressPayment';

import {
  getAllProgressPayments,
  getProjectProgressPayments,
  getProjectFinancialSummary,
  translateProgressPaymentStatus,
  getStatusColorClass,
  createProgressPayment,
  updateProgressPaymentStatus,
  deleteProgressPayment
} from '@/services/progressPaymentService';

import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { ProgressPaymentForm } from './components/ProgressPaymentForm';
import { ProgressPaymentStatusDialog } from './components/ProgressPaymentStatusDialog';

export default function HakedislerPage() {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [progressPayments, setProgressPayments] = useState<ProgressPayment[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ProgressPayment | null>(null);

  // Filtreleme durumu
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    // Projeleri getir
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Projeler getirilemedi');
        }
        
        const projectsData = data.data || data;
        setProjects(projectsData.map((project: any) => ({
          id: project.id,
          name: project.name
        })));
      } catch (err: any) {
        console.error("Projeler alınırken hata:", err);
        setError(err.message || 'Projeler yüklenirken bir hata oluştu');
      }
    };
    
    fetchProjects();
  }, []);
  
  useEffect(() => {
    // Hakedişleri getir
    const fetchProgressPayments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let payments;
        
        if (selectedProjectId === 'all') {
          payments = await getAllProgressPayments();
        } else {
          payments = await getProjectProgressPayments(selectedProjectId);
          // Proje finansal özetini getir
          const summary = await getProjectFinancialSummary(selectedProjectId);
          setFinancialSummary(summary);
        }
        
        setProgressPayments(payments);
      } catch (err: any) {
        console.error("Hakediş verileri alınırken hata:", err);
        setError(err.message || 'Hakediş verileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgressPayments();
  }, [selectedProjectId]);
  
  // Hakediş ekleme işlemi
  const handleAddProgressPayment = async (data: ProgressPaymentInput | FormData) => {
    try {
      console.log("Hakediş ekleme işlemi başlatılıyor...");
      console.log("Gönderilecek veri türü:", data instanceof FormData ? "FormData" : "JSON");
      
      const newPayment = await createProgressPayment(data);
      setProgressPayments(prev => [newPayment, ...prev]);
      setIsFormOpen(false);
      
      // Finansal özeti güncelle
      if (selectedProjectId !== 'all') {
        const summary = await getProjectFinancialSummary(selectedProjectId);
        setFinancialSummary(summary);
      }
      
      return true;
    } catch (error) {
      console.error("Hakediş eklenirken hata:", error);
      return false;
    }
  };
  
  // Hakediş durumu güncelleme işlemi
  const handleStatusUpdate = async (paymentId: string, newStatus: string, data: any) => {
    try {
      await updateProgressPaymentStatus({
        id: paymentId,
        status: newStatus as any,
        ...data
      });
      
      // Hakedişleri yeniden yükle
      if (selectedProjectId === 'all') {
        const payments = await getAllProgressPayments();
        setProgressPayments(payments);
      } else {
        const payments = await getProjectProgressPayments(selectedProjectId);
        setProgressPayments(payments);
        
        // Finansal özeti güncelle
        const summary = await getProjectFinancialSummary(selectedProjectId);
        setFinancialSummary(summary);
      }
      
      setIsStatusDialogOpen(false);
      setSelectedPayment(null);
      
      return true;
    } catch (error) {
      console.error("Hakediş durumu güncellenirken hata:", error);
      return false;
    }
  };
  
  // Hakediş silme işlemi
  const handleDeleteProgressPayment = async (paymentId: string) => {
    if (!confirm('Bu hakediş kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await deleteProgressPayment(paymentId);
      
      // Hakedişleri yeniden yükle
      setProgressPayments(prev => prev.filter(payment => payment.id !== paymentId));
      
      // Finansal özeti güncelle
      if (selectedProjectId !== 'all') {
        const summary = await getProjectFinancialSummary(selectedProjectId);
        setFinancialSummary(summary);
      }
    } catch (error) {
      console.error("Hakediş silinirken hata:", error);
    }
  };
  
  // Filtreleme işlemi
  const filteredPayments = progressPayments.filter(payment => {
    // Durum filtresi
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false;
    }
    
    // Arama filtresi
    if (searchTerm && !(
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentNumber.toString().includes(searchTerm)
    )) {
      return false;
    }
    
    return true;
  });
  
  // Durum ikonu getir
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Edit className="h-4 w-4 text-gray-600" />;
      case 'SUBMITTED': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'APPROVED': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'PAID': return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'PARTIALLY_PAID': return <DollarSign className="h-4 w-4 text-cyan-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };
  
  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
      .format(amount)
      .replace('₺', '') + ' ₺';
  };

  // Hakediş detayına git
  const handleViewProgressPaymentDetail = (paymentId: string) => {
    router.push(`/hakedisler/${paymentId}`);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-xl p-6 mb-4 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
              <FileText className="mr-3 h-8 w-8" /> Hakedişler
            </h1>
            <p className="text-blue-100 mt-1 opacity-90">
              Proje hakedişlerini yönetin ve takip edin
            </p>
          </div>
          <Button 
            onClick={() => {
              setIsFormOpen(true);
              setSelectedPayment(null);
            }} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Yeni Hakediş Ekle
          </Button>
        </div>
      </div>
      
      {/* Proje Seçimi */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-1/3">
          <Label htmlFor="project-select">Proje Seçimi</Label>
          <Select 
            value={selectedProjectId} 
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger id="project-select" className="mt-1">
              <SelectValue placeholder="Proje seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Projeler</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/3">
          <Label htmlFor="status-filter">Durum Filtresi</Label>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status-filter" className="mt-1">
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="DRAFT">Hazırlanıyor</SelectItem>
              <SelectItem value="SUBMITTED">Gönderildi</SelectItem>
              <SelectItem value="PENDING">Onay Bekliyor</SelectItem>
              <SelectItem value="APPROVED">Onaylandı</SelectItem>
              <SelectItem value="PAID">Ödendi</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Kısmi Ödendi</SelectItem>
              <SelectItem value="REJECTED">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/3">
          <Label htmlFor="search">Arama</Label>
          <Input
            id="search"
            placeholder="Hakediş ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Finansal Özet Kartları */}
      {selectedProjectId !== 'all' && financialSummary && (
        <FinancialSummaryCards summary={financialSummary} />
      )}
      
      {/* Hakediş Listesi */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
              <div>
                <CardTitle>Hakediş Listesi</CardTitle>
                <CardDescription className="hidden sm:block">
                  {filteredPayments.length > 0 
                    ? `Toplam ${filteredPayments.length} hakediş kaydı` 
                    : 'Henüz hakediş kaydı bulunmuyor'}
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
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg">Yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12 text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Hakediş kaydı bulunamadı</p>
              <p className="text-sm mt-1">Yeni bir hakediş eklemek için "Yeni Hakediş Ekle" butonunu kullanabilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Hakediş No</TableHead>
                    {selectedProjectId === 'all' && <TableHead>Proje</TableHead>}
                    <TableHead>Açıklama/Dönem</TableHead>
                    <TableHead>Talep Tarihi</TableHead>
                    <TableHead>Talep Edilen</TableHead>
                    <TableHead>Onaylanan</TableHead>
                    <TableHead>Ödenen</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ödenme Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                      {selectedProjectId === 'all' && (
                        <TableCell className="max-w-[200px] truncate">{payment.projectName}</TableCell>
                      )}
                      <TableCell className="max-w-[200px] truncate">{payment.description}</TableCell>
                      <TableCell>{format(new Date(payment.createdAt), 'dd.MM.yyyy')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.requestedAmount)}</TableCell>
                      <TableCell>
                        {payment.approvedAmount !== null ? formatCurrency(payment.approvedAmount) : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.paidAmount !== null ? formatCurrency(payment.paidAmount) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColorClass(payment.status)} flex items-center gap-1 whitespace-nowrap`}>
                          {getStatusIcon(payment.status)}
                          {translateProgressPaymentStatus(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd.MM.yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsStatusDialogOpen(true);
                            }}
                            title="Durum Güncelle"
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Detay Görüntüle"
                            onClick={() => handleViewProgressPaymentDetail(payment.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-600"
                            onClick={() => handleDeleteProgressPayment(payment.id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni Hakediş Formu */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Hakediş Ekle</DialogTitle>
            <DialogDescription>
              Proje için yeni bir hakediş kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <ProgressPaymentForm 
            projects={projects} 
            selectedProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined} 
            onSubmit={handleAddProgressPayment} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Durum Güncelleme Diyaloğu */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Hakediş Durumu Güncelle</DialogTitle>
            <DialogDescription>
              Hakediş durumunu ve ilgili bilgileri güncelleyin.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <ProgressPaymentStatusDialog 
              payment={selectedPayment} 
              onSubmit={(status, data) => handleStatusUpdate(selectedPayment.id, status, data)} 
              onCancel={() => setIsStatusDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}