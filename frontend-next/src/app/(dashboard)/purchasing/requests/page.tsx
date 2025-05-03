"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Satın alma talebi türü
interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedDate: string;
  requiredDate: string | null;
  status: string;
  department: {
    name: string;
  };
  requester: {
    name: string;
    surname?: string;
    email?: string;
  };
  statusChangedBy?: {
    name: string;
    surname?: string;
  };
  statusChangedAt?: string;
  items: {
    id: string;
    itemName: string;
  }[];
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/purchasing/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(`Sunucu yanıtı: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        throw new Error(data.message || 'Veriler alınamadı');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
      toast.error('Talepler yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Durum rengini belirle
  const getStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {label: string, variant: "default" | "destructive" | "outline" | "secondary" | "success"}} = {
      'PENDING': { label: 'Beklemede', variant: 'secondary' },
      'APPROVED': { label: 'Onaylandı', variant: 'success' },
      'REJECTED': { label: 'Reddedildi', variant: 'destructive' },
      'COMPLETED': { label: 'Tamamlandı', variant: 'success' },
      'CANCELLED': { label: 'İptal Edildi', variant: 'outline' },
      'PAYMENT_COMPLETED': { label: 'Ödeme Yapıldı', variant: 'success' },
      'DELIVERED': { label: 'Teslim Edildi', variant: 'success' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    
    return (
      <Badge variant={statusInfo.variant} className="font-medium">
        {statusInfo.label}
      </Badge>
    );
  };

  // Talepleri durumlarına göre filtrele
  const filteredRequests = {
    pending: requests.filter(request => request.status === 'PENDING'),
    approved: requests.filter(request => ['APPROVED', 'COMPLETED', 'PAYMENT_COMPLETED', 'DELIVERED'].includes(request.status)),
    rejected: requests.filter(request => ['REJECTED', 'CANCELLED'].includes(request.status))
  };

  // Sekme başlıklarında talep sayılarını göster
  const getTabTitle = (key: string) => {
    const count = filteredRequests[key as keyof typeof filteredRequests].length;
    return `${count > 0 ? `(${count})` : ''}`;
  };

  const renderRequestsTable = (requests: PurchaseRequest[]) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-500 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-gray-500 font-medium">Bu sekmede talep bulunmuyor.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto -mx-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Talep No</TableHead>
              <TableHead className="font-semibold">Talep Tarihi</TableHead>
              <TableHead className="font-semibold">İstenilen Tarih</TableHead>
              <TableHead className="font-semibold">Departman</TableHead>
              <TableHead className="font-semibold">Talep Eden</TableHead>
              <TableHead className="font-semibold">Durum Değiştiren</TableHead>
              <TableHead className="font-semibold">Kalemler</TableHead>
              <TableHead className="font-semibold">Durum</TableHead>
              <TableHead className="text-right font-semibold">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.requestNumber}</TableCell>
                <TableCell>
                  {request.requestedDate ? format(new Date(request.requestedDate), 'dd.MM.yyyy') : '-'}
                </TableCell>
                <TableCell>
                  {request.requiredDate ? format(new Date(request.requiredDate), 'dd.MM.yyyy') : '-'}
                </TableCell>
                <TableCell>{request.department?.name || '-'}</TableCell>
                <TableCell>{request.requester ? `${request.requester.name} ${request.requester.surname || ''}` : '-'}</TableCell>
                <TableCell>
                  {request.statusChangedBy 
                    ? `${request.statusChangedBy.name} ${request.statusChangedBy.surname || ''}`
                    : '-'}
                </TableCell>
                <TableCell>{request.items?.length || 0} kalem</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/purchasing/requests/${request.id}`}>
                      Detay
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Satın Alma Talepleri</h1>
          <p className="text-muted-foreground mt-1">Tüm satın alma taleplerini görüntüleyin ve yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchRequests} disabled={isLoading} className="min-w-[120px]">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button asChild className="min-w-[180px]">
            <Link href="/purchasing/new-request">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Talep Oluştur
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Talep Listesi</CardTitle>
          <CardDescription>Mevcut satın alma taleplerini görüntüleyin ve yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Talepler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : (
            <Tabs defaultValue="pending" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-4 bg-muted/50">
                <TabsTrigger value="pending" className="relative">
                  Bekleyen Talepler {getTabTitle('pending')}
                </TabsTrigger>
                <TabsTrigger value="approved" className="relative">
                  Onaylanan Talepler {getTabTitle('approved')}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="relative">
                  Reddedilen Talepler {getTabTitle('rejected')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                {renderRequestsTable(filteredRequests.pending)}
              </TabsContent>
              <TabsContent value="approved">
                {renderRequestsTable(filteredRequests.approved)}
              </TabsContent>
              <TabsContent value="rejected">
                {renderRequestsTable(filteredRequests.rejected)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 