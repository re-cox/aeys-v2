"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Clipboard, 
  Calendar, 
  User, 
  Building, 
  MessageSquare,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Satın alma talebi türü
interface PurchaseRequestDetail {
  id: string;
  requestNumber: string;
  status: string;
  requestedDate: string;
  requiredDate: string | null;
  reason: string | null;
  notes: string | null;
  department: {
    id: string;
    name: string;
  };
  requester: {
    id: string;
    name: string;
    surname: string | null;
    email: string | null;
  };
  statusChangedBy?: {
    id: string;
    name: string;
    surname: string | null;
  };
  statusChangedAt?: string;
  items: {
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedPrice: number | null;
    notes: string | null;
  }[];
}

export default function PurchaseRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  
  const [request, setRequest] = useState<PurchaseRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Durum rengini belirle
  const getStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {label: string, variant: "default" | "destructive" | "outline" | "secondary"}} = {
      'PENDING': { label: 'Beklemede', variant: 'secondary' },
      'APPROVED': { label: 'Onaylandı', variant: 'default' },
      'REJECTED': { label: 'Reddedildi', variant: 'destructive' },
      'COMPLETED': { label: 'Tamamlandı', variant: 'default' },
      'CANCELLED': { label: 'İptal Edildi', variant: 'outline' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        router.push('/auth/login');
        return;
      }
      
      const response = await fetch(`/api/purchasing/requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        if (response.status === 404) {
          toast.error("Talep bulunamadı.");
          router.push('/purchasing/requests');
          return;
        }
        throw new Error(`Sunucu yanıtı: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRequest(data.data);
      } else {
        throw new Error(data.message || 'Talep bilgileri alınamadı');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
      toast.error('Talep bilgileri yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Durum değiştirme işlemi
  const updateRequestStatus = async (newStatus: string) => {
    if (isStatusUpdating || !request) return;
    
    setIsStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        router.push('/auth/login');
        return;
      }
      
      const response = await fetch(`/api/purchasing/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        throw new Error(`Sunucu yanıtı: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Talep durumu başarıyla güncellendi");
        fetchRequestDetails(); // Verileri yenile
      } else {
        throw new Error(data.message || 'Talep durumu güncellenemedi');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Durum güncellenirken bir hata oluştu');
      console.error(err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id, router]);

  const calculateTotalPrice = () => {
    if (!request?.items) return 0;
    
    return request.items.reduce((total, item) => {
      if (item.estimatedPrice) {
        return total + (item.estimatedPrice * item.quantity);
      }
      return total;
    }, 0);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Üst Başlık ve Butonlar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchasing/requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Satın Alma Talebi Detayı</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRequestDetails} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Talep bilgileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      ) : !request ? (
        <div className="text-center py-12 text-gray-500">
          <p>Talep bulunamadı.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Talep Başlık Bilgileri */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{request.requestNumber}</CardTitle>
                  <CardDescription>
                    {request.requestedDate && (
                      <span>Talep Tarihi: {format(new Date(request.requestedDate), 'dd.MM.yyyy')}</span>
                    )}
                  </CardDescription>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" /> Talep Eden
                  </span>
                  <span className="font-medium">
                    {request.requester?.name} {request.requester?.surname}
                  </span>
                  <span className="text-sm text-gray-500">{request.requester?.email || ''}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Building className="h-4 w-4" /> Departman
                  </span>
                  <span className="font-medium">{request.department?.name || '-'}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> İstenilen Tarih
                  </span>
                  <span className="font-medium">
                    {request.requiredDate 
                      ? format(new Date(request.requiredDate), 'dd.MM.yyyy')
                      : '-'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clipboard className="h-4 w-4" /> Toplam Kalem
                  </span>
                  <span className="font-medium">{request.items?.length || 0} kalem</span>
                </div>
              </div>

              {/* Durum Değiştiren Kişi Bilgisi */}
              {request.statusChangedBy && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Durum Değiştiren:</span>
                    <span className="font-medium">{request.statusChangedBy.name} {request.statusChangedBy.surname}</span>
                    {request.statusChangedAt && (
                      <span className="text-sm text-gray-500">
                        ({format(new Date(request.statusChangedAt), 'dd.MM.yyyy HH:mm')})
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Durum Değiştirme Bölümü */}
              <Separator className="my-4" />
              <div>
                <h3 className="text-sm font-medium mb-2">Talep Durumunu Güncelle</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={request.status === "PENDING" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "PENDING"}
                    onClick={() => updateRequestStatus("PENDING")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "PENDING" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Beklemede
                  </Button>
                  <Button 
                    variant={request.status === "APPROVED" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "APPROVED"}
                    onClick={() => updateRequestStatus("APPROVED")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "APPROVED" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Onaylandı
                  </Button>
                  <Button 
                    variant={request.status === "REJECTED" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "REJECTED"}
                    onClick={() => updateRequestStatus("REJECTED")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "REJECTED" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Reddedildi
                  </Button>
                  <Button 
                    variant={request.status === "PAYMENT_COMPLETED" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "PAYMENT_COMPLETED"}
                    onClick={() => updateRequestStatus("PAYMENT_COMPLETED")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "PAYMENT_COMPLETED" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Ödeme Yapıldı
                  </Button>
                  <Button 
                    variant={request.status === "DELIVERED" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "DELIVERED"}
                    onClick={() => updateRequestStatus("DELIVERED")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "DELIVERED" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Teslim Edildi
                  </Button>
                  <Button 
                    variant={request.status === "CANCELLED" ? "default" : "outline"} 
                    size="sm"
                    disabled={isStatusUpdating || request.status === "CANCELLED"}
                    onClick={() => updateRequestStatus("CANCELLED")}
                    className="flex items-center gap-1"
                  >
                    {isStatusUpdating && request.status !== "CANCELLED" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    İptal Edildi
                  </Button>
                </div>
              </div>

              {(request.reason || request.notes) && (
                <>
                  <Separator className="my-4" />
                  
                  {request.reason && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <MessageSquare className="h-4 w-4" /> Talep Nedeni
                      </span>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  )}
                  
                  {request.notes && (
                    <div>
                      <span className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <MessageSquare className="h-4 w-4" /> Notlar
                      </span>
                      <p className="text-sm">{request.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Malzeme Listesi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Talep Kalemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Malzeme Adı</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Tahmini Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {item.estimatedPrice 
                            ? `${item.estimatedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {item.estimatedPrice 
                            ? `${(item.estimatedPrice * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                            : '-'}
                        </TableCell>
                        <TableCell>{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {request.items.some(item => item.estimatedPrice) && (
                <div className="mt-4 text-right">
                  <span className="font-medium">Toplam Tahmini Tutar: </span>
                  <span className="font-bold">
                    {calculateTotalPrice().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 