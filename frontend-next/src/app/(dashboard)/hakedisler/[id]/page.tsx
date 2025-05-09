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
  Clock
} from 'lucide-react';

import { 
  getProgressPaymentById,
  translateProgressPaymentStatus,
  getStatusColorClass
} from '@/services/progressPaymentService';
import { ProgressPayment } from '@/types/progressPayment';

export default function ProgressPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [payment, setPayment] = useState<ProgressPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProgressPayment = async () => {
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
    
    fetchProgressPayment();
  }, [id]);
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
  };
  
  const handleGoBack = () => {
    router.back();
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
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" /> İndir
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-md">
                <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Henüz dosya eklenmemiş</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
            </Button>
            
            <div className="space-x-2">
              <Button variant="outline">
                <FileCheck className="mr-2 h-4 w-4" /> Durum Güncelle
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" /> PDF Olarak İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 