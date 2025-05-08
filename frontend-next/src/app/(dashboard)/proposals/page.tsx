"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  List, 
  LayoutGrid, 
  Search, 
  FileText, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Calendar as CalendarIcon,
  DollarSign, 
  X, 
  FileUp, 
  Trash, 
  Edit, 
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

import { Proposal, ProposalItem, NewProposalData, UpdateProposalData, NewProposalItemData, ProposalAttachment, NewProposalAttachmentData, Currency, ProposalItemType, ProposalStatus } from "@/types/proposal";
import { Customer } from "@/types/customer";
import { 
  getAllProposals, 
  createProposal, 
  updateProposal, 
  deleteProposal 
} from "@/services/proposalService";
import { getAllCustomers } from "@/services/customerService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter, 
  SheetClose 
} from "@/components/ui/sheet";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Türkçe Karşılıklar için Map Objeleri
// String anahtarlar kullanılıyor
const proposalStatusMap: Record<string, { text: string; className: string }> = {
  [ProposalStatus.DRAFT]:     { text: "Hazırlanıyor", className: "border-gray-500 text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
  [ProposalStatus.SENT]:      { text: "Beklemede",    className: "border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" },
  [ProposalStatus.ACCEPTED]:  { text: "Kabul Edildi", className: "border-green-500 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300" },
  [ProposalStatus.REJECTED]:  { text: "Reddedildi",   className: "border-red-500 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300" },
  [ProposalStatus.EXPIRED]:   { text: "Süresi Doldu", className: "border-orange-500 text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300" },
};

// String anahtarlar kullanılıyor
const proposalItemTypeMap: Record<string, string> = {
  [ProposalItemType.MATERIAL]: "Malzeme",
  [ProposalItemType.LABOR]: "İşçilik",
  [ProposalItemType.OVERHEAD]: "Genel Gider",
  [ProposalItemType.PROFIT]: "Kar",
  [ProposalItemType.OVERHEAD_PROFIT]: "Genel Gider & Kar",
};

// String anahtarlar kullanılıyor
const currencyMap: Record<string, string> = {
  [Currency.TL]: "TL",
  [Currency.USD]: "USD",
  [Currency.EUR]: "EUR",
};

const proposalItemSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(ProposalItemType),
  description: z.string().optional().nullable(),
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
  customerId: z.string().min(1, "Müşteri seçimi zorunludur"),
  status: z.nativeEnum(ProposalStatus).optional(),
  validUntil: z.date().optional().nullable(),
  items: z.array(proposalItemSchema).min(1, "En az bir teklif kalemi eklenmelidir"),
  attachments: z.array(proposalAttachmentSchema).optional(),
  notes: z.string().optional().nullable(),
});

const defaultItemValues: NewProposalItemData = {
  type: ProposalItemType.MATERIAL,
  description: "",
  quantity: 1,
  unitPrice: 0,
  currency: Currency.TL,
  id: crypto.randomUUID()
};

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

function DatePicker({ date, setDate, placeholder = "Tarih seçin..." }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: tr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={tr} 
        />
      </PopoverContent>
    </Popover>
  );
}

type ProposalFormValues = z.infer<typeof proposalSchema>;

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [totalProposals, setTotalProposals] = useState<number>(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<ProposalAttachment[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof proposalSchema>>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      customerId: "",
      status: ProposalStatus.DRAFT,
      validUntil: null,
      items: [defaultItemValues],
      attachments: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [proposalResponse, customerData] = await Promise.all([
          getAllProposals(),
          getAllCustomers()
        ]);
        
        console.log("Müşteri verisi useEffect içinde:", customerData);

        setProposals(proposalResponse.proposals || []); 
        setTotalProposals(proposalResponse.totalCount || 0);
        setCustomers(customerData || []);

      } catch (err) {
        handleLoadError("Teklif veya müşteri verileri yüklenirken hata oluştu.", err);
        setProposals([]);
        setTotalProposals(0);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLoadError = (message: string, err?: unknown) => {
      console.error(message, err);
      setError(message);
      toast.error(message);
  };

  const resetForm = () => {
      form.reset({
          customerId: "",
          status: ProposalStatus.DRAFT,
          validUntil: null,
          items: [defaultItemValues],
          attachments: [],
          notes: "",
      });
      setAttachments([]);
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
      if (!response.ok) {
        throw new Error('Dosya yüklenemedi');
      }
      const result = await response.json();
      if (result.success) {
        const newAttachment: ProposalAttachment = {
          id: crypto.randomUUID(),
          proposalId: "temp",
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileType: result.fileType,
          fileSize: result.fileSize,
          uploadedAt: new Date()
        };
        setAttachments((prev) => [...prev, newAttachment]);
        toast.success(`"${result.fileName}" yüklendi.`);
      } else {
        throw new Error(result.error || 'Dosya yüklenemedi');
      }
    } catch (err) {
      console.error("Dosya yükleme hatası:", err);
      toast.error(err instanceof Error ? err.message : "Dosya yüklenemedi.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (idToRemove: string) => {
    setAttachments((prev) => prev.filter(att => att.id !== idToRemove));
  };

  const onSubmit = async (values: z.infer<typeof proposalSchema>) => {
    const apiData: NewProposalData = {
        customerId: values.customerId,
        status: values.status,
        validUntil: values.validUntil?.toISOString() ?? null,
        items: values.items.map(({ id, ...item }) => ({
            ...item,
            type: item.type as ProposalItemType,
            currency: item.currency as Currency,
        })),
        attachments: attachments.map(att => ({ 
            fileName: att.fileName, fileUrl: att.fileUrl,
            fileType: att.fileType, fileSize: att.fileSize,
        })),
        notes: values.notes,
    };
    console.log("CREATE için gönderilen veri:", apiData);
    try {
      const savedProposal = await createProposal(apiData);
      const newProposalWithDate = { 
          ...savedProposal, 
          attachments: savedProposal.attachments?.map(a => ({...a, uploadedAt: new Date(a.uploadedAt)})) || []
      };
      setProposals([newProposalWithDate, ...proposals].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      toast.success(`"${savedProposal.proposalNo}" numaralı teklif oluşturuldu.`);
      setIsSheetOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Teklif kaydetme hatası:", error);
      toast.error(error?.message || "Teklif oluşturulamadı.");
    }
  };

  const handleDelete = async (id: string, proposalNo: string) => {
    if (!confirm(`"${proposalNo}" numaralı teklifi silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteProposal(id);
      setProposals(proposals.filter(p => p.id !== id));
      toast.success(`"${proposalNo}" numaralı teklif başarıyla silindi.`);
    } catch (error: any) {
      console.error("Teklif silme hatası:", error);
      toast.error(error?.message || "Teklif silinemedi.");
    }
  };

  const filteredProposals: Proposal[] = useMemo(() => {
    if (!search) return proposals;
    const searchLower = search.toLowerCase();
    return proposals.filter((p: Proposal) =>
      (p.proposalNo?.toLowerCase() || '').includes(searchLower) ||
      (p.customer?.name?.toLowerCase() || '').includes(searchLower) ||
      (p.notes?.toLowerCase() || '').includes(searchLower)
    );
  }, [proposals, search]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const formatTotals = (totals?: { [key: string]: number | undefined }) => {
    if (!totals || Object.keys(totals).length === 0) return "-";
    return Object.entries(totals)
      .map(([currency, value]) => {
        if (value === undefined) return "-";
        return `${formatCurrency(value)} ${currency}`;
      })
      .join(" / ");
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <FileText className="mr-2 h-6 w-6"/>
            Teklif Yönetimi
          </h1>
          <p className="text-muted-foreground">Müşteri tekliflerini oluşturun ve yönetin.</p>
        </div>
         <div className="flex items-center gap-2">
           <ToggleGroup type="single" defaultValue="list" value={viewMode} onValueChange={(value: "list" | "card") => { if (value) setViewMode(value); }}>
            <ToggleGroupItem value="list" aria-label="Liste görünümü"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Kart görünümü"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Yeni Teklif</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Yeni Teklif Oluştur</SheetTitle>
                <SheetDescription>Yeni bir teklif için bilgileri girin.</SheetDescription>
              </SheetHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="py-4 space-y-6">
                <div className="space-y-4 p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Genel Teklif Bilgileri</h4>
                    <div className="space-y-1">
                      <Label htmlFor="customerId">Müşteri*</Label>
                      <Controller
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                             <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="customerId">
                                    <SelectValue placeholder="Müşteri seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                      />
                       {form.formState.errors.customerId && <p className="text-xs text-red-600">{form.formState.errors.customerId.message}</p>}
                    </div>
                    <div className="space-y-1">
                         <Label htmlFor="validUntil">Geçerlilik Tarihi</Label>
                         <Controller
                            control={form.control}
                            name="validUntil"
                            render={({ field }) => (
                                <DatePicker date={field.value ?? undefined} setDate={field.onChange} />
                            )}
                         />
                   </div>
                   <div className="space-y-1">
                      <Label htmlFor="status">Teklif Durumu</Label>
                       <Controller
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger id="status">
                                      <SelectValue placeholder="Durum seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {Object.entries(proposalStatusMap).map(([key, { text }]) => (
                                          <SelectItem key={key} value={key}>{text}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                           )}
                       />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="notes">Notlar/Açıklama</Label>
                    <Input id="notes" {...form.register("notes")} placeholder="Teklifle ilgili genel notlar veya açıklama..." />
                    {form.formState.errors.notes && <p className="text-xs text-red-600">{form.formState.errors.notes.message}</p>}
                  </div>
                </div>
                
              <div className="space-y-4 p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Teklif Kalemleri*</h4>
                      <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3"/> Kalem Ekle</Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row items-start gap-2 p-3 border rounded bg-muted/50 relative">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-grow">
                         <div className="sm:col-span-3 space-y-1">
                           <Label htmlFor={`items.${index}.type`} className="text-xs">Tip</Label>
                            <Controller
                              control={form.control}
                              name={`items.${index}.type`}
                              render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger id={`items.${index}.type`}>
                                          <SelectValue placeholder="Tip" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {Object.keys(proposalItemTypeMap).map((typeKey) => (
                                              <SelectItem key={typeKey} value={typeKey}>{proposalItemTypeMap[typeKey]}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              )}
                            />
                         </div>
                          <div className="sm:col-span-6 space-y-1">
                              <Label htmlFor={`items.${index}.description`} className="text-xs">Açıklama</Label>
                              <Input id={`items.${index}.description`} {...form.register(`items.${index}.description`)} placeholder="Malzeme veya işçilik detayı..." />
                          </div>
                          <div className="sm:col-span-3 space-y-1">
                              <Label htmlFor={`items.${index}.quantity`} className="text-xs">Miktar*</Label>
                              <Input id={`items.${index}.quantity`} type="number" step="any" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                            {form.formState.errors.items?.[index]?.quantity && <p className="text-xs text-red-600 mt-1">{form.formState.errors.items[index]?.quantity?.message}</p>}
                    </div>
                           <div className="sm:col-span-6 space-y-1">
                              <Label htmlFor={`items.${index}.unitPrice`} className="text-xs">Birim Fiyat*</Label>
                              <Input id={`items.${index}.unitPrice`} type="number" step="any" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                               {form.formState.errors.items?.[index]?.unitPrice && <p className="text-xs text-red-600 mt-1">{form.formState.errors.items[index]?.unitPrice?.message}</p>}
                        </div>
                           <div className="sm:col-span-6 space-y-1">
                              <Label htmlFor={`items.${index}.currency`} className="text-xs">Döviz*</Label>
                               <Controller
                                  control={form.control}
                                  name={`items.${index}.currency`}
                                  render={({ field }) => (
                                      <Select value={field.value} onValueChange={field.onChange}>
                                          <SelectTrigger id={`items.${index}.currency`}>
                                              <SelectValue placeholder="Döviz" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {Object.keys(currencyMap).map((currencyKey) => (
                                                  <SelectItem key={currencyKey} value={currencyKey}>{currencyMap[currencyKey]}</SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  )}
                                />
                           </div>
                      </div>
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => remove(index)} 
                          className="text-destructive hover:text-destructive/80 absolute top-1 right-1 h-6 w-6 sm:relative sm:top-auto sm:right-auto sm:self-center"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && 
                   <p className="text-xs text-red-600 mt-1">{form.formState.errors.items.message}</p>}
                      </div>

              <div className="space-y-4 p-4 border rounded-md">
                   <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Dosya Ekleri</h4>
                      <Label htmlFor="file-upload" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                          <FileUp className="mr-1 h-3 w-3"/> Dosya Seç
                          <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isUploading}/>
                      </Label>
                  </div>
                  {isUploading && <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin"/> Yükleniyor...</div>}
                  {attachments.length > 0 ? (
                       <ul className="space-y-2">
                          {attachments.map((att) => (
                              <li key={att.id} className="text-sm flex items-center justify-between p-2 rounded bg-muted/30">
                              <div className="flex items-center overflow-hidden mr-2">
                                  <FileText className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate" title={att.fileName}>{att.fileName}</span>
                                  {att.fileSize && (
                                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                      ({Math.round(att.fileSize / 1024)} KB)
                                  </span>
                                  )}
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80 flex-shrink-0" onClick={() => removeAttachment(att.id)}>
                                  <Trash className="h-4 w-4" />
                              </Button>
                              </li>
                          ))}
                      </ul>
                  ) : (
                       !isUploading && <p className="text-xs text-muted-foreground italic text-center py-2">Henüz dosya eklenmedi.</p>
                  )}
                </div>
                
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Teklifi Oluştur
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      </div>
      
     <div className="relative w-full sm:max-w-xs">
       <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
       <Input placeholder="Tekliflerde ara (No, Müşteri, Notlar)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full"/>
    </div>

    {error && (
     <Alert variant="destructive">
       <AlertCircle className="h-4 w-4" />
       <AlertTitle>Hata</AlertTitle>
       <AlertDescription>{error}</AlertDescription>
     </Alert>
   )}

   {loading ? (
     <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
   ) : viewMode === 'list' ? (
       <div className="border rounded-lg overflow-hidden">
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Teklif No</TableHead>
               <TableHead>Notlar/Açıklama</TableHead>
               <TableHead>Müşteri</TableHead>
               <TableHead>Durum</TableHead>
               <TableHead>Geçerlilik</TableHead>
               <TableHead>Toplam Tutar</TableHead>
               <TableHead className="text-right">İşlemler</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody className="bg-white divide-y divide-gray-200 dark:bg-gray-950 dark:divide-gray-800">
             {filteredProposals.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{search ? `"${search}" için sonuç bulunamadı.` : "Henüz teklif oluşturulmamış."}</TableCell></TableRow>
             ) : (
               filteredProposals.map((proposal: Proposal) => (
                 <TableRow key={proposal.id} className="hover:bg-muted/50">
                   <TableCell className="font-mono text-xs">{proposal.proposalNo || 'No Yok'}</TableCell>
                   <TableCell className="font-medium max-w-xs truncate" title={proposal.notes || ''}>
                      <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                        {proposal.notes || proposal.proposalNo || 'Detay Yok'}
                       </Link>
                     </TableCell>
                   <TableCell>{proposal.customer?.name || 'Müşteri Yok'}</TableCell>
                   <TableCell>
                     <Badge variant="outline" className={cn("ml-auto flex-shrink-0", proposalStatusMap[proposal.status]?.className || '')}>
                       {proposalStatusMap[proposal.status]?.text || proposal.status}
                     </Badge>
                   </TableCell>
                   <TableCell>{formatDate(proposal.validUntil)}</TableCell>
                   <TableCell className="font-medium">{formatTotals(proposal.totals)}</TableCell>
                   <TableCell className="text-right">
                     <TooltipProvider delayDuration={100}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => router.push(`/proposals/${proposal.id}`)}>
                             <FileText size={16} />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Detayları Görüntüle</p></TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                     <TooltipProvider delayDuration={100}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => handleDelete(proposal.id, proposal.proposalNo)}>
                             <Trash2 size={16} />
                       </Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Sil</p></TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </TableCell>
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </div>
   ) : (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProposals.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-10">{search ? `"${search}" için sonuç bulunamadı.` : "Henüz teklif oluşturulmamış."}</p>
          ) : (
             filteredProposals.map((proposal: Proposal) => (
               <Card key={proposal.id} className="overflow-hidden flex flex-col">
                 <CardHeader className="p-4 bg-muted/50">
                   <div className="flex justify-between items-start gap-2">
                     <div className="flex-grow">
                       <CardTitle className="text-base font-semibold">
                         <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                            {proposal.notes || proposal.proposalNo || 'Detay Yok'}
                         </Link>
                       </CardTitle>
                       <CardDescription className="text-xs">{proposal.proposalNo || 'No Yok'}</CardDescription>
                     </div>
                      <Badge variant="outline" className={cn("ml-auto flex-shrink-0", proposalStatusMap[proposal.status]?.className || '')}>
                         {proposalStatusMap[proposal.status]?.text || proposal.status}
                      </Badge>
                   </div>
                    <p className="text-sm text-muted-foreground pt-2">{proposal.customer?.name || 'Müşteri Yok'}</p>
                 </CardHeader>
                 <CardContent className="flex-grow text-sm space-y-1">
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Geçerlilik: {formatDate(proposal.validUntil)}</span>
                     </div>
                    <div className="flex items-center font-medium pt-1">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Toplam: {formatTotals(proposal.totals)}</span>
                     </div>
                 </CardContent>
                  <div className="p-4 pt-0 mt-auto flex justify-end gap-1 border-t">
                     <TooltipProvider delayDuration={100}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => handleDelete(proposal.id, proposal.proposalNo)}>
                             <Trash2 size={16} />
                       </Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Sil</p></TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                 </div>
               </Card>
         ))
       )}
     </div>
   )}
 </div>
);
} 