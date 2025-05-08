"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Building, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { toast } from "sonner";

import { Proposal } from "@/types/proposal";
import { getProposalById, deleteProposal } from "@/services/proposalService";
import { ProposalStatus, ProposalItemType, Currency } from '@prisma/client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Türkçe karşılıklar 
const proposalStatusMap: Record<ProposalStatus, { text: string; className: string }> = {
  [ProposalStatus.DRAFT]:     { text: "Hazırlanıyor", className: "border-gray-500 text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
  [ProposalStatus.SENT]:      { text: "Beklemede",    className: "border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" },
  [ProposalStatus.ACCEPTED]:  { text: "Kabul Edildi", className: "border-green-500 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300" },
  [ProposalStatus.REJECTED]:  { text: "Reddedildi",   className: "border-red-500 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300" },
  [ProposalStatus.EXPIRED]:   { text: "Süresi Doldu", className: "border-orange-500 text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300" },
};
const proposalItemTypeMap: Record<ProposalItemType, string> = {
  [ProposalItemType.MATERIAL]: "Malzeme",
  [ProposalItemType.LABOR]: "İşçilik",
  [ProposalItemType.OVERHEAD]: "Genel Gider",
  [ProposalItemType.PROFIT]: "Kar",
  [ProposalItemType.OVERHEAD_PROFIT]: "Genel Gider & Kar",
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;
    const loadProposal = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProposalById(proposalId);
        console.log("Detay için API'den gelen veri:", data);
        if (!data) throw new Error("Teklif bulunamadı.");
        setProposal(data);
      } catch (err) {
        handleLoadError("Teklif bilgileri yüklenirken bir hata oluştu.", err);
      } finally {
        setLoading(false);
      }
    };
    loadProposal();
  }, [proposalId]);

  const handleLoadError = (message: string, err?: unknown) => {
    console.error(message, err);
    setError(message);
    toast.error(message);
  };

  const handleDelete = async () => {
    if (!proposal) return;
    if (!confirm(`"${proposal.proposalNo}" numaralı teklifi silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteProposal(proposal.id);
      toast.success(`"${proposal.proposalNo}" numaralı teklif başarıyla silindi.`);
      router.push('/proposals'); 
    } catch (err) {
      let errorMessage = "Teklif silinemedi.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      handleLoadError(errorMessage, err);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const renderTotals = (totals?: { [key in Currency]?: number }) => {
    if (!totals || Object.keys(totals).length === 0) return <span className="text-muted-foreground">-</span>;
    return Object.entries(totals).map(([currency, value]) => (
      <div key={currency} className="font-semibold">
        {formatCurrency(value)} <span className="text-xs text-muted-foreground">{currency}</span>
      </div>
    ));
  };

 // --- RENDER --- 

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-6">
         <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
                {error || "Teklif bulunamadı."}
                <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/proposals')}>
                       <ArrowLeft className="mr-2 h-4 w-4"/> Teklif Listesine Dön
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <Button variant="outline" size="sm" onClick={() => router.push('/proposals')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Teklif Listesine Dön
                </Button>
                <h1 className="text-2xl font-bold tracking-tight flex items-center">
                   <FileText className="mr-3 h-7 w-7 text-primary"/>
                   {proposal.proposalNo}
                </h1>
                <p className="text-muted-foreground mt-1">Teklif No: {proposal.proposalNo}</p>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" onClick={() => router.push(`/proposals/${proposal.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4"/> Düzenle
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Teklifi Düzenle</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4"/> Sil
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Teklifi Sil</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
       </div>

      {/* Teklif Detayları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Sütun: Genel Bilgiler & Müşteri */}
          <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durum:</span>
                    <Badge variant="outline" className={proposalStatusMap[proposal.status].className}>{proposalStatusMap[proposal.status].text}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Geçerlilik:</span>
                    <span className="font-medium flex items-center"><CalendarIcon className="mr-1.5 h-4 w-4 text-muted-foreground"/> {formatDate(proposal.validUntil)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Oluşturulma:</span>
                    <span className="font-medium">{new Intl.DateTimeFormat("tr-TR", { dateStyle: 'short', timeStyle: 'short' }).format(proposal.createdAt)}</span>
                  </div>
                    <div className="flex justify-between">
                    <span className="text-muted-foreground">Güncelleme:</span>
                    <span className="font-medium">{new Intl.DateTimeFormat("tr-TR", { dateStyle: 'short', timeStyle: 'short' }).format(proposal.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="font-medium">
                     {proposal.customer ? (
                        <Link href={`/customers/${proposal.customer.id}`} className="flex items-center hover:underline">
                           <Building className="mr-2 h-4 w-4 text-muted-foreground"/> 
                           {proposal.customer.name}
                       </Link>
                     ) : (
                        <span className="text-muted-foreground italic">Müşteri bilgisi yok</span>
                     )}
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Sağ Sütun: Kalemler ve Toplamlar */}
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle>Teklif Kalemleri</CardTitle>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tip</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Birim Fiyat</TableHead>
                          <TableHead className="text-right">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposal.items.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Kalem bulunmamaktadır.</TableCell></TableRow>
                        ) : (
                          proposal.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell><Badge variant="outline">{proposalItemTypeMap[item.type]}</Badge></TableCell>
                              <TableCell className="text-muted-foreground text-xs">{item.description || "-"}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)} {item.currency}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.unitPrice * item.quantity)} {item.currency}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
              <Card>
                 <CardHeader>
                   <CardTitle>Teklif Toplamları</CardTitle>
                 </CardHeader>
                 <CardContent className="flex justify-end space-x-6">
                    {Object.keys(proposal.totals || {}).length > 0 ? (
                        renderTotals(proposal.totals)
                    ) : (
                        <p className="text-sm text-muted-foreground">Hesaplanacak kalem yok.</p>
                    )}
                 </CardContent>
               </Card>

               {/* Dosya Ekleri Kartı */}
               <Card>
                 <CardHeader>
                   <CardTitle>Ekli Dosyalar</CardTitle>
                 </CardHeader>
                 <CardContent>
                   {proposal.attachments && proposal.attachments.length > 0 ? (
                     <ul className="space-y-2">
                       {proposal.attachments.map((att) => (
                         <li key={att.id} className="text-sm flex items-center justify-between p-2 rounded hover:bg-muted/50">
                           <a 
                             href={att.fileUrl} // Gerçek URL kullanılacak
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center hover:underline truncate"
                             title={att.fileName}
                           >
                             <FileText className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                             <span className="truncate">{att.fileName}</span>
                           </a>
                           {/* Opsiyonel: Dosya boyutu veya silme butonu eklenebilir */}
                           {att.fileSize && (
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                ({Math.round(att.fileSize / 1024)} KB)
                              </span>
                           )}
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p className="text-sm text-muted-foreground italic">Bu teklife ait dosya eki bulunmamaktadır.</p>
                   )}
                 </CardContent>
               </Card>

          </div>
      </div>
    </div>
  );
} 