'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Loader2, 
  Download,
  FileCheck,
  Clock,
  Trash2,
  AlertTriangle,
  Upload,
  File,
  X,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

import { 
  getProgressPaymentById,
  translateProgressPaymentStatus,
  getStatusColorClass,
  deleteProgressPaymentDocument,
  getProgressPaymentDocumentUrl,
  updateProgressPaymentStatus
} from '@/services/progressPaymentService';
import { ProgressPayment, ProgressPaymentStatus, ProgressPaymentStatusUpdate } from '@/types/progressPayment';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProgressPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [payment, setPayment] = useState<ProgressPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, fileName: string} | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProgressPaymentStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Dosya yükleme state'leri
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Define fetchProgressPayment once at the component level
  const fetchProgressPayment = async () => {
    if (!id) {
      // setError('Hakediş ID bulunamadı.'); // Optional: set error if id is missing
      // setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getProgressPaymentById(id);
      setPayment(data);
    } catch (err: any) {
      console.error("Hakediş detayı alınırken hata:", err);
      setError(err.message || 'Hakediş detayı yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // useEffect to call fetchProgressPayment on id change or when component mounts with id
  useEffect(() => {
    fetchProgressPayment();
  }, [id]);
  
  const handleDeleteDocument = async () => {
    if (!documentToDelete || !payment) return;
    
    setIsDeletingDocument(true);
    
    try {
      await deleteProgressPaymentDocument(payment.id, documentToDelete.id);
      toast.success(`${documentToDelete.fileName} başarıyla silindi`);
      
      await fetchProgressPayment(); // Call the unified fetchProgressPayment
      
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Belge silinirken hata:', error);
      toast.error('Belge silinirken bir hata oluştu: ' + error.message);
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const handleStatusChange = async () => {
    if (!payment || !selectedStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      const statusUpdate: ProgressPaymentStatusUpdate = {
        id: payment.id,
        status: selectedStatus
      };
      
      console.log('Gönderilen durum güncellemesi:', statusUpdate);
      
      await updateProgressPaymentStatus(statusUpdate);
      
      toast.success('Hakediş durumu başarıyla güncellendi');
      setShowStatusDialog(false);
      
      // Hakediş detaylarını yeniden yükle
      await fetchProgressPayment();
    } catch (error: any) {
      console.error('Durum güncellenirken hata:', error);
      toast.error('Durum güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleStatusDialog = () => {
    setSelectedStatus(payment?.status || null);
    setShowStatusDialog(true);
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  // Dosya yükleme fonksiyonları
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleUploadFiles = async () => {
    if (!payment || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('progressPaymentId', payment.id);
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Auth token al (varsa)
      const authToken = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log(`Dosyalar (${files.length} adet) yükleniyor...`);
      
      // API endpoint'e dosyaları yükle
      const response = await fetch(`http://localhost:5001/api/progress-payments/${payment.id}/documents`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMsg = 'Dosya yüklenirken bir hata oluştu';
        
        // Hata mesajını detaylı göster
        try {
          const errorData = await response.json();
          console.error('API hata yanıtı:', errorData);
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // JSON parse hatası
          console.error('API hata yanıtı alınamadı:', e);
          errorMsg = `Dosya yüklenirken bir hata oluştu: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMsg);
      }
      
      toast.success(`${files.length} dosya başarıyla yüklendi`);
      setFiles([]);
      
      // Hakediş detaylarını yeniden yükle
      await fetchProgressPayment();
    } catch (error: any) {
      console.error('Dosya yüklenirken hata:', error);
      toast.error('Dosya yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-xl text-gray-600">Hakediş detayları yükleniyor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="text-xl text-red-600 mb-2">Hata Oluştu</p>
        <p className="text-gray-600">{error}</p>
        <Button onClick={handleGoBack} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }
  
  if (!payment) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-orange-600 mb-4" />
        <p className="text-xl text-gray-600 mb-2">Hakediş bulunamadı</p>
        <Button onClick={handleGoBack} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleGoBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Geri
        </Button>
        <h1 className="text-2xl font-bold">Hakediş Detayı</h1>
        <Badge variant="outline" className={`${getStatusColorClass(payment.status)} ml-2`}>
          {translateProgressPaymentStatus(payment.status)}
        </Badge>
      </div>
      
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" />
              <div>
                <CardTitle>Hakediş #{payment.paymentNumber}</CardTitle>
                <CardDescription>
                  {payment.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Genel Bilgiler</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Proje</span>
                  <span className="font-medium">{payment.projectName}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Hakediş No</span>
                  <span className="font-medium">{payment.paymentNumber}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Açıklama</span>
                  <span className="font-medium">{payment.description}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Oluşturma Tarihi</span>
                  <span className="font-medium">
                    {format(new Date(payment.createdAt), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
                
                {payment.dueDate && (
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Vade Tarihi</span>
                    <span className="font-medium">
                      {format(new Date(payment.dueDate), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                )}
                
                {payment.notes && (
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Notlar</span>
                    <span className="font-medium">{payment.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Finansal Bilgiler</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Durum</span>
                  <Badge variant="outline" className={getStatusColorClass(payment.status)}>
                    {translateProgressPaymentStatus(payment.status)}
                  </Badge>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Talep Edilen Tutar</span>
                  <span className="font-medium text-blue-600">{formatCurrency(payment.requestedAmount)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Onaylanan Tutar</span>
                  <span className="font-medium text-green-600">
                    {payment.approvedAmount !== null ? formatCurrency(payment.approvedAmount) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Ödenen Tutar</span>
                  <span className="font-medium text-emerald-600">
                    {payment.paidAmount !== null ? formatCurrency(payment.paidAmount) : '-'}
                  </span>
                </div>
                
                {payment.paymentDate && (
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Ödenme Tarihi</span>
                    <span className="font-medium">
                      {format(new Date(payment.paymentDate), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Download className="h-5 w-5 mr-2" /> İlgili Dosyalar
            </h3>
            
            {payment.documents && payment.documents.length > 0 ? (
              <div className="space-y-2">
                {payment.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                      <span>{doc.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" /> İndir
                        </a>
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setDocumentToDelete({id: doc.id, fileName: doc.fileName});
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Sil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-md">
                <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Henüz dosya eklenmemiş</p>
              </div>
            )}
            
            {/* Dosya Yükleme Bölümü */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2 flex items-center">
                <Upload className="h-4 w-4 mr-2" /> Dosya Ekle
              </h4>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 transition-colors hover:border-blue-400 dark:hover:border-blue-500"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Dosyaları sürükleyip bırakın veya dosya seçin
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                  />
                  <Button asChild variant="outline" size="sm">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" /> Dosya Seç
                    </label>
                  </Button>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Seçilen Dosyalar ({files.length})</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center">
                            <File className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={handleUploadFiles} 
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                            Yükleniyor... ({uploadProgress}%)
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" /> 
                            Dosyaları Yükle
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
            </Button>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={handleStatusDialog}>
                <FileCheck className="mr-2 h-4 w-4" /> Durum Güncelle
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" /> PDF Olarak İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Durum Güncelleme Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hakediş Durumunu Güncelle</AlertDialogTitle>
            <AlertDialogDescription>
              Hakediş durumunu değiştirmek için yeni bir durum seçin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-4">
            {["DRAFT", "SUBMITTED", "PENDING", "APPROVED", "PAID", "REJECTED"].map((status) => (
              <div 
                key={status} 
                onClick={() => setSelectedStatus(status as ProgressPaymentStatus)}
                className={`flex items-center p-3 rounded-md cursor-pointer border-2 ${
                  selectedStatus === status ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <Badge variant="outline" className={getStatusColorClass(status)}>
                  {translateProgressPaymentStatus(status)}
                </Badge>
              </div>
            ))}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <Button 
              onClick={handleStatusChange} 
              disabled={isUpdatingStatus || selectedStatus === payment?.status}
            >
              {isUpdatingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Güncelle
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Belge Silme Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dosyayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete?.fileName} dosyasını silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleDeleteDocument} 
              disabled={isDeletingDocument}
            >
              {isDeletingDocument && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sil
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}