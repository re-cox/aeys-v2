"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Plus, 
  X, 
  FileUp, 
  Trash, 
  Calendar as CalendarIcon,
  FileText,
  Pencil // Pencil ikonu başlık için
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';

// Tipler ve Servisler
import { Proposal, UpdateProposalData, NewProposalItemData, ProposalAttachment } from "@/types/proposal";
import { Customer } from "@/types/customer";
import { getProposalById, updateProposal } from "@/services/proposalService";
import { getAllCustomers } from "@/services/customerService";
import { ProposalStatus, ProposalItemType, Currency } from '@prisma/client';

// Shadcn UI Bileşenleri
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// --- DatePicker Bileşeni ---
interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
}
function DatePicker({ date, setDate, placeholder = "Tarih seçin..." }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: tr }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={tr} />
            </PopoverContent>
        </Popover>
    );
}
// ------------------------------------------

// --- Zod Şemaları --- 
const proposalItemSchema = z.object({
  id: z.string().optional(), 
  type: z.nativeEnum(ProposalItemType),
  description: z.string().nullable().optional(),
  quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalı"),
  unitPrice: z.number().min(0, "Birim fiyat negatif olamaz"),
  currency: z.nativeEnum(Currency),
});

const proposalAttachmentSchema = z.object({
  id: z.string().optional(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  uploadedAt: z.date().optional(),
});

const proposalSchema = z.object({
  title: z.string().min(1, "Teklif başlığı zorunludur"),
  customerId: z.string().min(1, "Müşteri seçimi zorunludur"),
  status: z.nativeEnum(ProposalStatus).optional(),
  validUntil: z.date().nullable().optional(),
  items: z.array(proposalItemSchema).min(1, "En az bir teklif kalemi eklenmelidir"),
  attachments: z.array(proposalAttachmentSchema).optional(), 
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

// --- Default Değerler --- 
const defaultItemValues: NewProposalItemData = {
  type: ProposalItemType.MATERIAL,
  description: "",
  quantity: 1,
  unitPrice: 0,
  currency: Currency.TL,
  id: crypto.randomUUID()
};

// --- Türkçe Map Objeleri ---
const proposalStatusMap: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "Hazırlanıyor",
  [ProposalStatus.SENT]: "Beklemede",
  [ProposalStatus.ACCEPTED]: "Kabul Edildi",
  [ProposalStatus.REJECTED]: "Reddedildi",
  [ProposalStatus.EXPIRED]: "Süresi Doldu",
};
const proposalItemTypeMap: Record<ProposalItemType, string> = {
  [ProposalItemType.MATERIAL]: "Malzeme",
  [ProposalItemType.LABOR]: "İşçilik",
  [ProposalItemType.OVERHEAD]: "Genel Gider",
  [ProposalItemType.PROFIT]: "Kar",
  [ProposalItemType.OVERHEAD_PROFIT]: "Genel Gider & Kar",
};
const currencyMap: Record<Currency, string> = {
  [Currency.TL]: "TL",
  [Currency.USD]: "USD",
  [Currency.EUR]: "EUR",
};
// -------------------------

export default function ProposalEditPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;

  const [proposal, setProposal] = useState<Proposal | null>(null); // Yüklenen orijinal teklif
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attachments, setAttachments] = useState<ProposalAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form Kurulumu
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    // defaultValues useEffect içinde set edilecek
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Veri Yükleme ve Formu Doldurma
  useEffect(() => {
    if (!proposalId) {
        setError("Teklif ID bulunamadı.");
        setLoading(false);
        return;
    }
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [proposalData, customerData] = await Promise.all([
          getProposalById(proposalId),
          getAllCustomers()
        ]);
        
        if (!proposalData) throw new Error("Düzenlenecek teklif bulunamadı.");
        
        setProposal(proposalData);
        setCustomers(customerData || []);
        setAttachments(proposalData.attachments || []);

        // Formu yüklenen veriyle doldur
        const defaultItems = (proposalData.items && proposalData.items.length > 0 
          ? proposalData.items.map(item => ({...item, id: crypto.randomUUID()})) 
          : [{...defaultItemValues, id: crypto.randomUUID()}]); // Boşsa bile bir tane ekle

        form.reset({
          title: proposalData.title,
          customerId: proposalData.customerId,
          status: proposalData.status,
          validUntil: proposalData.validUntil,
          items: defaultItems, 
          attachments: proposalData.attachments || [],
        });

      } catch (err) {
        handleLoadError("Veriler yüklenirken hata oluştu.", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [proposalId, form.reset]); // form.reset'i bağımlılığa ekle

  // --- Form Handler Fonksiyonları ---
  const handleLoadError = (message: string, err?: unknown) => {
    console.error(message, err);
    setError(message);
    toast.error(message);
  };

  const addItem = () => {
    append({...defaultItemValues, id: crypto.randomUUID() });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Dosya yüklenemedi');
      const result = await response.json();
      if (result.success) {
        const newAttachment: ProposalAttachment = {
          id: crypto.randomUUID(), 
          proposalId: proposalId, // Mevcut teklifin ID'si
          fileName: result.fileName, 
          fileUrl: result.fileUrl,
          fileType: result.fileType, 
          fileSize: result.fileSize,
          uploadedAt: new Date()
        };
        setAttachments((prev) => [...prev, newAttachment]);
        toast.success(`"${result.fileName}" yüklendi.`);
      } else { throw new Error(result.error || 'Dosya yüklenemedi'); }
    } catch (err) { 
      handleLoadError("Dosya yükleme hatası:", err); 
    } finally { 
      setIsUploading(false); 
      event.target.value = ""; 
    }
  };

  const removeAttachment = (idToRemove: string) => {
    setAttachments((prev) => prev.filter(att => att.id !== idToRemove));
  };

  // Form Gönderme (Sadece Güncelleme)
  const onSubmit = async (values: ProposalFormValues) => {
    if (!proposal) return;
    console.log("Form güncelleniyor...", values);

    const apiData: UpdateProposalData = {
        title: values.title,
        customerId: values.customerId,
        status: values.status,
        validUntil: values.validUntil?.toISOString() ?? null,
        items: values.items.map(({ /*id,*/ ...item }) => item),
        attachments: attachments.map(att => ({ 
            fileName: att.fileName, fileUrl: att.fileUrl,
            fileType: att.fileType, fileSize: att.fileSize,
        }))
    };
    
    console.log("API'ye gönderilecek Update verisi:", apiData);

    try {
      const savedProposal = await updateProposal(proposal.id, apiData); 
      toast.success(`"${savedProposal.title}" teklifi başarıyla güncellendi.`);
      router.push(`/proposals/${proposal.id}`);
    } catch (error) {
      handleLoadError("Teklif güncellenemedi.", error);
    } 
  };

 // --- RENDER --- 

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
         <Alert variant="destructive" className="max-w-lg mx-auto">
             <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/proposals')}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Teklif Listesine Dön
                </Button>
            </div>
         </Alert>
      </div>
    );
  }

  if (!proposal) {
      // Bu durum normalde error tarafından yakalanır, ama ekstra kontrol
      return <div className="text-center py-10 text-muted-foreground">Teklif yüklenemedi veya bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Başlık ve Geri Dön Butonu */}
        <div className="flex items-center justify-between">
             <h1 className="text-2xl font-bold tracking-tight flex items-center">
                <Pencil className="mr-3 h-6 w-6 text-primary"/>
                Teklifi Düzenle: {proposal?.title}
             </h1>
             <Button variant="outline" size="sm" onClick={() => router.push(`/proposals/${proposalId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Detaylara Dön
             </Button>
        </div>

        {/* Form Kartı */}
        <Card>
             <CardHeader>
                <CardTitle>Teklif Detayları</CardTitle>
                 <CardDescription>Teklif No: {proposal?.proposalNumber}</CardDescription>
            </CardHeader>
            <CardContent>
                 {/* Formun kendisi RHF Provider gerektirmez */}
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* --- Genel Bilgiler Bölümü --- */}
                     <div className="space-y-4 p-4 border rounded-md bg-background/50">
                        <h4 className="font-medium mb-2 text-muted-foreground">Genel Bilgiler</h4>
                         <div className="space-y-1">
                            <Label htmlFor="title">Teklif Başlığı*</Label>
                            <Input id="title" {...form.register("title")} placeholder="örn: XYZ Projesi Malzeme Teklifi" />
                            {form.formState.errors.title && <p className="text-xs text-red-600 mt-1">{form.formState.errors.title.message}</p>}
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <Label htmlFor="customerId">Müşteri*</Label>
                              <Controller 
                                name="customerId" 
                                control={form.control} 
                                render={({ field }) => (
                                 <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Müşteri seçin..." />
                                   </SelectTrigger>
                                   <SelectContent>
                                     {customers.map((customer) => (
                                       <SelectItem key={customer.id} value={customer.id}>{customer.companyName}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               )} 
                              />
                              {form.formState.errors.customerId && <p className="text-xs text-red-600 mt-1">{form.formState.errors.customerId.message}</p>}
                           </div>
                            <div className="space-y-1">
                              <Label htmlFor="validUntil">Geçerlilik Tarihi</Label>
                               <Controller 
                                name="validUntil" 
                                control={form.control} 
                                render={({ field }) => ( 
                                  <DatePicker 
                                    date={field.value ?? undefined} 
                                    setDate={(date) => field.onChange(date)} // onChange ile güncelle
                                  /> 
                                )} 
                               />
                           </div>
                         </div>
                          <div className="space-y-1">
                             <Label htmlFor="status">Teklif Durumu</Label>
                              <Controller 
                                name="status" 
                                control={form.control} 
                                render={({ field }) => (
                                 <Select value={field.value ?? ProposalStatus.DRAFT} onValueChange={field.onChange}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Durum seçin..." />
                                   </SelectTrigger>
                                   <SelectContent>
                                     {Object.entries(proposalStatusMap).map(([key, text]) => (
                                       <SelectItem key={key} value={key}>{text}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               )} 
                              />
                          </div>
                     </div>

                      {/* --- Teklif Kalemleri Bölümü --- */}
                     <div className="space-y-4 p-4 border rounded-md bg-background/50">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-muted-foreground">Teklif Kalemleri*</h4>
                            <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3"/> Kalem Ekle</Button>
                         </div>
                         {fields.map((field, index) => (
                             <div key={field.id} className="flex flex-col sm:flex-row items-start gap-2 p-3 border rounded bg-background/80 relative">
                                 <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-2 flex-grow">
                                      {/* Tip */}
                                     <div className="sm:col-span-3 space-y-1">
                                         <Label htmlFor={`items.${index}.type`} className="text-xs">Tip</Label>
                                         <Controller 
                                            name={`items.${index}.type`} 
                                            control={form.control} 
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}> 
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Tip" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(proposalItemTypeMap).map(([key, text]) => (
                                                            <SelectItem key={key} value={key}>{text}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select> 
                                            )}
                                         />
                                     </div>
                                     {/* Açıklama */}
                                      <div className="sm:col-span-9 space-y-1">
                                         <Label htmlFor={`items.${index}.description`} className="text-xs">Açıklama</Label>
                                         <Input id={`items.${index}.description`} {...form.register(`items.${index}.description`)} placeholder="Detay..." className="h-8 text-xs"/>
                                     </div>
                                     {/* Miktar */}
                                     <div className="sm:col-span-3 space-y-1">
                                          <Label htmlFor={`items.${index}.quantity`} className="text-xs">Miktar*</Label>
                                         <Input id={`items.${index}.quantity`} type="number" step="any" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-8 text-xs"/>
                                         {form.formState.errors.items?.[index]?.quantity && <p className="text-xs text-red-600 mt-1">{form.formState.errors.items[index]?.quantity?.message}</p>}
                                     </div>
                                     {/* Birim Fiyat */}
                                      <div className="sm:col-span-5 space-y-1">
                                         <Label htmlFor={`items.${index}.unitPrice`} className="text-xs">Birim Fiyat*</Label>
                                         <Input id={`items.${index}.unitPrice`} type="number" step="any" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} className="h-8 text-xs"/>
                                         {form.formState.errors.items?.[index]?.unitPrice && <p className="text-xs text-red-600 mt-1">{form.formState.errors.items[index]?.unitPrice?.message}</p>}
                                     </div>
                                      {/* Döviz Kuru */}
                                       <div className="sm:col-span-4 space-y-1">
                                         <Label htmlFor={`items.${index}.currency`} className="text-xs">Döviz*</Label>
                                         <Controller 
                                            name={`items.${index}.currency`} 
                                            control={form.control} 
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}> 
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Döviz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(currencyMap).map(([key, text]) => (
                                                            <SelectItem key={key} value={key}>{text}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select> 
                                            )}
                                        />
                                     </div>
                                 </div>
                                 <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 absolute top-1 right-1 h-6 w-6 sm:relative sm:top-auto sm:right-auto sm:self-center"> <X className="h-4 w-4" /></Button>
                             </div>
                         ))}
                         {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && <p className="text-xs text-red-600 mt-1">{form.formState.errors.items.message}</p>}
                    </div>

                      {/* --- Dosya Ekleri Bölümü --- */}
                     <div className="space-y-4 p-4 border rounded-md bg-background/50">
                         <div className="flex justify-between items-center mb-2">
                           <h4 className="font-medium text-muted-foreground">Dosya Ekleri</h4>
                           <Label htmlFor="file-upload" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                              <FileUp className="mr-1 h-3 w-3"/> Dosya Seç
                              <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isUploading}/>
                           </Label>
                         </div>
                         {isUploading && <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin"/> Yükleniyor...</div>}
                        {attachments.length > 0 ? ( <ul className="space-y-2"> {attachments.map((att) => ( <li key={att.id} className="text-sm flex items-center justify-between p-2 rounded bg-muted/30"><div className="flex items-center overflow-hidden mr-2"><FileText className="mr-2 h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate" title={att.fileName}>{att.fileName}</span>{att.fileSize && (<span className="text-xs text-muted-foreground ml-2 shrink-0">({Math.round(att.fileSize / 1024)} KB)</span>)}</div><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80 shrink-0" onClick={() => removeAttachment(att.id)}><Trash className="h-4 w-4" /></Button></li> ))}</ul> ) : ( !isUploading && <p className="text-xs text-muted-foreground italic text-center py-2">Henüz dosya eklenmedi.</p> )}
                    </div>

                    {/* --- Kaydet Butonu --- */}
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                            {form.formState.isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                 </form>
             </CardContent>
        </Card>
    </div>
  );
} 