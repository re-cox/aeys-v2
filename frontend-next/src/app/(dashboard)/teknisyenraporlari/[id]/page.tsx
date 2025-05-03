"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getTeknisyenRaporu, deleteTeknisyenDokuman, deleteTeknisyenRaporu } from '@/services/teknisyenRaporService';
import { TeknisyenRaporu, TeknisyenDokuman } from '@/types/teknisyen';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, FileText, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Durum renkleri
const durumRenkleri: { [key: string]: string } = {
  'Beklemede': 'bg-yellow-500 hover:bg-yellow-600',
  'Fiyatlar Girildi': 'bg-blue-500 hover:bg-blue-600',
  'Fatura Kesildi': 'bg-green-500 hover:bg-green-600',
  'İptal Edildi': 'bg-red-500 hover:bg-red-600',
};


const RaporDetayPage = () => {
  const router = useRouter();
  const params = useParams();
  const raporId = typeof params?.id === 'string' ? params.id : null;

  const [rapor, setRapor] = useState<TeknisyenRaporu | null>(null);
  const [dokumanlar, setDokumanlar] = useState<TeknisyenDokuman[]>([]);
  const [isLoadingRapor, setIsLoadingRapor] = useState(true);
  const [isLoadingDokuman, setIsLoadingDokuman] = useState(true);
  const [isDeletingRapor, setIsDeletingRapor] = useState(false);
  const [deletingDokumanId, setDeletingDokumanId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!raporId) {
       setIsLoadingRapor(false);
       setIsLoadingDokuman(false);
       toast.error("Rapor ID bulunamadı.");
       router.push('/teknisyenraporlari');
       return; 
    }

    setIsLoadingRapor(true);
    setIsLoadingDokuman(true);
    setRapor(null);
    setDokumanlar([]);

    try {
      const raporData = await getTeknisyenRaporu(raporId);
      setRapor(raporData);
      setDokumanlar(raporData.dokumanlar || []);

    } catch (error: any) {
      console.error("Rapor veya dokümanlar getirilirken hata:", error);
      const errorMessage = error.message || "Rapor detayları yüklenirken bir hata oluştu.";
      if (error.message.includes('bulunamadı')) { 
         toast.error("Rapor bulunamadı.");
      } else {
         toast.error(errorMessage);
      }
      router.push('/teknisyenraporlari');
    }
    finally {
        setIsLoadingRapor(false);
        setIsLoadingDokuman(false);
    }
  }, [raporId, router]);

  useEffect(() => {
    if (raporId) {
      fetchData();
    }
    else if(params?.id === undefined) {
        // Henüz id gelmemiş olabilir, bekleyebiliriz veya hata gösterebiliriz
        // Şimdilik bir şey yapmayalım, fetchData içindeki kontrol yeterli
    } else {
         // Geçersiz ID durumu (örn. /teknisyenraporlari/abc gibi)
        toast.error("Geçersiz Rapor ID.");
        router.push('/teknisyenraporlari');
    }
  }, [params, raporId, fetchData]);

  const handleRaporSil = async () => {
    if (!rapor) return;
    if (confirm(`"${rapor.isinAdi}" başlıklı raporu kalıcı olarak silmek istediğinizden emin misiniz?`)) {
        setIsDeletingRapor(true);
        try {
            await deleteTeknisyenRaporu(rapor.id);
            toast.success("Rapor başarıyla silindi.");
            router.push('/teknisyenraporlari');
            router.refresh();
        } catch (error: any) {
             console.error("Rapor silinirken hata:", error);
             const errorMessage = error.message || "Rapor silinirken bir hata oluştu.";
             toast.error(errorMessage);
        } finally {
             setIsDeletingRapor(false);
        }
    }
  };

   const handleDokumanSil = async (dokumanId: string, dokumanAdi: string) => {
       if (!rapor) return;
       if (confirm(`"${dokumanAdi}" isimli dökümanı silmek istediğinizden emin misiniz?`)) {
            setDeletingDokumanId(dokumanId);
           try {
             await deleteTeknisyenDokuman(dokumanId);
             setDokumanlar(currentDokumanlar => currentDokumanlar.filter(d => d.id !== dokumanId));
             toast.success(`"${dokumanAdi}" dökümanı silindi.`);
           } catch (error: any) {
               console.error("Döküman silinirken hata:", error);
               const errorMessage = error.message || "Döküman silinirken bir hata oluştu.";
               toast.error(errorMessage);
           } finally {
                setDeletingDokumanId(null);
           }
       }
   };

  if (isLoadingRapor) {
    return (
      <div className="container mx-auto py-10 space-y-4">
         <Skeleton className="h-8 w-32 mb-4" />
         <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-5 w-1/4 mb-1" />
                <Skeleton className="h-4 w-3/4" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Skeleton className="h-5 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></div>
                      <div><Skeleton className="h-5 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></div>
                 </div>
                 <div>
                    <Skeleton className="h-5 w-1/4 mb-2" />
                    <div className="border rounded-md p-4 space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                 </div>
            </CardContent>
         </Card>
      </div>
    );
  }

   if (!rapor && !isLoadingRapor) {
       return (
           <div className="container mx-auto py-10 text-center">
               <p className="text-red-600">Rapor yüklenemedi veya bulunamadı.</p>
                <Button variant="outline" size="sm" asChild className='mt-4'>
                   <Link href="/teknisyenraporlari">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Listeye Dön
                   </Link>
               </Button>
           </div>
       );
   }

   if (!rapor) return null;

  return (
    <div className="container mx-auto py-10">
       <div className='flex justify-between items-center mb-4'>
            <Button variant="outline" size="sm" asChild>
               <Link href="/teknisyenraporlari">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Listeye Dön
               </Link>
           </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoadingRapor || isLoadingDokuman}>
                 <RefreshCw className={`mr-2 h-4 w-4 ${(isLoadingRapor || isLoadingDokuman) ? 'animate-spin' : ''}`} />
                 Yenile
             </Button>
        </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
              <div>
                 <CardTitle className="text-2xl">{rapor.isinAdi}</CardTitle>
                 <CardDescription>Teknisyen No: {rapor.teknisyenNo}</CardDescription>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                 <Badge className={`${durumRenkleri[rapor.durum]} text-white`}>{rapor.durum}</Badge>
                  <Button variant="outline" size="icon" asChild title="Düzenle">
                       <Link href={`/teknisyenraporlari/${rapor.id}/duzenle`}>
                          <Pencil className="h-4 w-4" />
                       </Link>
                  </Button>
                   <Button
                       variant="destructive"
                       size="icon"
                       onClick={handleRaporSil}
                       disabled={isDeletingRapor}
                       title="Sil"
                    >
                       {isDeletingRapor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                   </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Detaylar</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
               <div>
                 <Label className='text-sm font-medium text-muted-foreground'>Başlangıç Tarihi:</Label>
                 <p className="font-semibold">{rapor.baslangicTarihi ? format(new Date(rapor.baslangicTarihi), 'PPP HH:mm', { locale: tr }) : '-'}</p>
               </div>
               <div>
                 <Label className='text-sm font-medium text-muted-foreground'>Bitiş Tarihi:</Label>
                 <p className="font-semibold">{rapor.bitisTarihi ? format(new Date(rapor.bitisTarihi), 'PPP HH:mm', { locale: tr }) : 'Tamamlanmadı'}</p>
               </div>
                <div>
                 <Label className='text-sm font-medium text-muted-foreground'>Oluşturulma Tarihi:</Label>
                 <p>{format(new Date(rapor.olusturulmaTarihi), 'PPP HH:mm', { locale: tr })}</p>
               </div>
               {rapor.guncellemeTarihi && (
                 <div>
                   <Label className='text-sm font-medium text-muted-foreground'>Son Güncelleme:</Label>
                   <p>{format(new Date(rapor.guncellemeTarihi), 'PPP HH:mm', { locale: tr })}</p>
                 </div>
               )} 
             </div>
           </div>

           <div>
             <h3 className="font-semibold text-lg mb-2">Görevli Personeller</h3>
             <div className="border rounded-md p-4">
                 {rapor.personeller && rapor.personeller.length > 0
                    ? <p className="text-sm text-muted-foreground">({rapor.personeller.length} personel görevli)</p>
                    : <p className="text-sm text-muted-foreground">Personel atanmamış.</p>}
             </div>
           </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Dökümanlar</h3>
            <div className="border rounded-md p-4 space-y-3">
               {isLoadingDokuman ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Dökümanlar yükleniyor...</span>
                    </div>
               ) : dokumanlar.length === 0 ? (
                   <p className="text-sm text-muted-foreground">Yüklenmiş döküman bulunmamaktadır.</p>
               ) : (
                   dokumanlar.map((doc) => (
                       <div key={doc.id} className="flex items-center justify-between gap-2 hover:bg-muted/50 p-2 rounded">
                           <div className="flex items-center space-x-3 overflow-hidden">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <a
                                  href={doc.dosyaYolu.startsWith('http') ? doc.dosyaYolu : `${API_URL}${doc.dosyaYolu}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary hover:underline truncate"
                                  title={doc.dosyaAdi}
                              >
                                {doc.dosyaAdi} <span className="text-xs text-muted-foreground">({ (doc.dosyaBoyutu / 1024).toFixed(1) } KB)</span>
                               </a>
                           </div>
                           <div className='flex items-center flex-shrink-0 space-x-1'>
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="İndir">
                                     <a href={doc.dosyaYolu.startsWith('http') ? doc.dosyaYolu : `${API_URL}${doc.dosyaYolu}`} target="_blank" rel="noopener noreferrer">
                                         <Download className="h-4 w-4" />
                                     </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"  className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    onClick={() => handleDokumanSil(doc.id, doc.dosyaAdi)}
                                    disabled={deletingDokumanId === doc.id}
                                    title="Dökümanı Sil"
                                 >
                                     {deletingDokumanId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                           </div>
                       </div>
                   ))
               )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default RaporDetayPage; 