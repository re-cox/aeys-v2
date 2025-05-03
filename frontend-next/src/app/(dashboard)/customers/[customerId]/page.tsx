"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation'; // Dinamik rota parametreleri ve yönlendirme için
// import Link from 'next/link'; // Kullanılmıyor
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Hash, 
  FileText, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Pencil, 
  Trash2,
  User,
  Briefcase,
  CircleDot
} from "lucide-react";
import { toast } from "sonner";

import { Customer } from "@/types/customer"; // UpdateCustomerData kaldırıldı
import { getCustomerById, deleteCustomer } from "@/services/customerService"; // updateCustomer kaldırıldı

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  // CardDescription // Kullanılmıyor
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Ekleme/Düzenleme Sheet'i için (şimdilik prop olarak almayacağız, belki global state veya context ile yönetilebilir)
// import CustomerFormSheet from '@/components/customers/customer-form-sheet'; // Varsayımsal

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isEditSheetOpen, setIsEditSheetOpen] = useState(false); // Düzenleme Sheet'i için state

  useEffect(() => {
    if (!customerId) return;

    const loadCustomer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCustomerById(customerId);
        if (!data) {
          throw new Error("Müşteri bulunamadı.");
        }
        setCustomer(data);
      } catch (err) {
        console.error("Müşteri detayı yükleme hatası:", err);
        const message = err instanceof Error ? err.message : "Müşteri bilgileri yüklenirken bir hata oluştu.";
        setError(message);
        toast.error(message);
        // Opsiyonel: Hata durumunda listeye geri yönlendir
        // router.push('/customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, router]);

  const handleDelete = async () => {
    if (!customer) return;
    if (!confirm(`"${customer.name}" müşterisini silmek istediğinizden emin misiniz?`)) return;

    try {
      await deleteCustomer(customer.id);
      toast.success(`"${customer.name}" müşterisi başarıyla silindi.`);
      router.push('/customers'); // Listeye geri dön
    } catch (err: any) {
      console.error("Müşteri silme hatası:", err);
      toast.error(err?.message || "Müşteri silinemedi.");
    }
  };

  // --- RENDER --- 

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
         <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
                {error}
                <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/customers')}>
                       <ArrowLeft className="mr-2 h-4 w-4"/> Müşteri Listesine Dön
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    // Bu durum normalde error state'i tarafından yakalanır ama yine de ekleyelim.
    return <div className="text-center py-10 text-muted-foreground">Müşteri bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
       {/* Geri Butonu ve Başlık/Aksiyonlar */}
       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <Button variant="outline" size="sm" onClick={() => router.push('/customers')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Müşteri Listesine Dön
                </Button>
                <h1 className="text-2xl font-bold tracking-tight flex items-center">
                   <Building className="mr-3 h-7 w-7 text-primary"/>
                   {customer.name}
                </h1>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
                 {/* Düzenle butonu */}
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {/* Düzenleme için ana sayfaya yönlendir */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => {
                                    // Ana sayfaya ?edit=customerId query parametresi ile yönlendir
                                    router.push(`/customers?edit=${customer.id}`);
                                }}
                            >
                                <Pencil className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Müşteriyi Düzenle</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
                 {/* Sil butonu */}
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="destructive" size="icon" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Müşteriyi Sil</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
       </div>

      {/* Detay Sekmeleri */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="general" className="py-2">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="contact" className="py-2">İletişim & Adres</TabsTrigger>
          <TabsTrigger value="tax" className="py-2">Vergi Bilgileri</TabsTrigger>
          <TabsTrigger value="notes" className="py-2">Notlar</TabsTrigger>
        </TabsList>

        {/* Genel Bilgiler Sekmesi */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Firma Adı:</span>
                 <span className="font-medium">{customer.name}</span>
               </div>
               {/* Eklendi: Yetkili Kişi */}
               <div className="flex items-center text-sm">
                 <User className="mr-3 h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">Yetkili Kişi:</span>
                 <span className="font-medium ml-auto">{customer.contactName || '-'}</span>
               </div>
               {/* Eklendi: Yetkili Ünvan */}
               <div className="flex items-center text-sm">
                 <Briefcase className="mr-3 h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">Yetkili Ünvan:</span>
                 <span className="font-medium ml-auto">{customer.contactTitle || '-'}</span>
               </div>
               {/* Eklendi: Durum */}
               <div className="flex items-center text-sm">
                 <CircleDot className="mr-3 h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">Durum:</span>
                 <span className="font-medium ml-auto capitalize">{customer.status ? customer.status.toLowerCase() : '-'}</span>
               </div>
                <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Oluşturulma Tarihi:</span>
                 <span className="font-medium">{customer.createdAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: 'long', timeStyle: 'short' }).format(new Date(customer.createdAt)) : '-'}</span>
               </div>
                 <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Son Güncelleme:</span>
                 <span className="font-medium">{customer.updatedAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: 'long', timeStyle: 'short' }).format(new Date(customer.updatedAt)) : '-'}</span>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* İletişim & Adres Sekmesi */}
        <TabsContent value="contact">
           <Card>
            <CardHeader>
              <CardTitle>İletişim & Adres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex items-center text-sm">
                 <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
                 <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email || '-'}</a>
               </div>
                <div className="flex items-center text-sm">
                 <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
                 <span>{customer.phone || '-'}</span>
               </div>
               <div className="flex items-start pt-3 border-t">
                 <MapPin className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                 <div className="text-sm">
                    <p>{customer.address || 'Adres belirtilmemiş.'}</p>
                    {/* Eklendi: Şehir, İlçe, Posta Kodu, Ülke */} 
                    <p className="text-muted-foreground">
                      {customer.district && <span>{customer.district}</span>}
                      {customer.city && <span>{customer.district ? ', ' : ''}{customer.city}</span>}
                      {customer.postalCode && <span>{ (customer.district || customer.city) ? ' / ' : '' }{customer.postalCode}</span>}
                      {customer.country && <span>{ (customer.district || customer.city || customer.postalCode) ? ', ' : '' }{customer.country}</span>}
                      {!(customer.district || customer.city || customer.postalCode || customer.country) && <span>Şehir/İlçe/Posta Kodu/Ülke belirtilmemiş.</span>}
                    </p>
                 </div>
               </div>
               {/* Eklendi: Web Sitesi */} 
               {customer.website && (
                 <div className="flex items-center text-sm pt-3 border-t">
                    <Globe className="mr-3 h-4 w-4 text-muted-foreground" />
                    <a 
                       href={customer.website.startsWith('http') ? customer.website : `//${customer.website}`} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="hover:underline truncate"
                    >
                      {customer.website}
                    </a>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

         {/* Vergi Bilgileri Sekmesi */}
        <TabsContent value="tax">
           <Card>
            <CardHeader>
              <CardTitle>Vergi Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex items-center text-sm">
                 <Hash className="mr-3 h-4 w-4 text-muted-foreground" />
                 <span>Vergi Numarası: <span className="font-medium">{customer.taxId || '-'}</span></span>
               </div>
               {/* Eklendi: Vergi Dairesi */} 
               <div className="flex items-center text-sm">
                 <FileText className="mr-3 h-4 w-4 text-muted-foreground" /> 
                 <span>Vergi Dairesi: <span className="font-medium">{customer.taxOffice || '-'}</span></span>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notlar Sekmesi */}
        <TabsContent value="notes">
           <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
               {/* Eklendi: Notlar içeriği */}
               {customer.notes ? (
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
               ) : (
                 <p className="text-sm text-muted-foreground">Bu müşteri için not bulunmamaktadır.</p>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Düzenleme Sheet'i (Opsiyonel, CustomerFormSheet component'i oluşturulursa) */}
      {/* 
       <CustomerFormSheet 
         isOpen={isEditSheetOpen} 
         setIsOpen={setIsEditSheetOpen} 
         customerData={customer} 
         onSuccess={() => { 
            // Detayı yeniden yükle 
            // Veya sadece state'i güncelle
         }}
       /> 
       */}
    </div>
  );
} 