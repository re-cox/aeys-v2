"use client";

import { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  List, 
  LayoutGrid, 
  Search, 
  Users, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  NotebookText 
} from "lucide-react";
import { toast } from "sonner";

import { Customer, NewCustomerData, UpdateCustomerData } from "@/types/customer";
import { 
  getAllCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from "@/services/customerService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";

const initialFormData: NewCustomerData = {
  name: "",
  contactName: "",
  contactTitle: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  district: "",
  postalCode: "",
  country: "",
  taxId: "",
  taxOffice: "",
  website: "",
  notes: "",
  status: "ACTIVE",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<NewCustomerData | UpdateCustomerData>(initialFormData);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Müşterileri Yükle
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllCustomers();
        const loadedCustomers = data || [];
        setCustomers(loadedCustomers);

        const editId = searchParams.get('edit');
        if (editId) {
          const customerToEdit = loadedCustomers.find((c: Customer) => c.id === editId);
          if (customerToEdit) {
            openEditSheet(customerToEdit);
            router.replace('/customers', { scroll: false });
          }
        }

      } catch (err) {
        console.error("Müşteri yükleme hatası:", err);
        const message = err instanceof Error ? err.message : "Müşteriler yüklenirken bir hata oluştu.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!isSheetOpen) {
      const currentEditId = searchParams.get('edit');
      if (currentEditId) {
        router.replace('/customers', { scroll: false });
      }
    }
  }, [isSheetOpen]);

  // Form değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Formu Resetle
  const resetForm = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    if (searchParams.get('edit')) {
      router.replace('/customers', { scroll: false });
    }
  };

  // Düzenleme için Sheet'i Aç
  const openEditSheet = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
        name: customer.name || "",
        contactName: customer.contactName || "",
        contactTitle: customer.contactTitle || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        district: customer.district || "",
        postalCode: customer.postalCode || "",
        country: customer.country || "",
        taxId: customer.taxId || "",
        taxOffice: customer.taxOffice || "",
        website: customer.website || "",
        notes: customer.notes || "",
        status: customer.status || "ACTIVE",
    });
    setIsSheetOpen(true);
  };

  // Formu Gönder (Ekleme/Güncelleme)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let savedCustomer: Customer;
      if (editingCustomer) {
        // Güncelleme
        savedCustomer = await updateCustomer(editingCustomer.id, formData as UpdateCustomerData);
        setCustomers(customers.map(c => c.id === savedCustomer.id ? savedCustomer : c));
        toast.success(`"${savedCustomer.name}" müşterisi güncellendi.`);
      } else {
        // Ekleme
        savedCustomer = await createCustomer(formData as NewCustomerData);
        setCustomers([savedCustomer, ...customers].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        toast.success(`"${savedCustomer.name}" müşterisi oluşturuldu.`);
      }
      setIsSheetOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Müşteri kaydetme hatası:", error);
      // API'den gelen özel hata mesajlarını göster
      const errorMessage = error?.message || (editingCustomer ? "Müşteri güncellenemedi." : "Müşteri oluşturulamadı.");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Müşteri Silme
  const handleDelete = async (customerId: string, name: string) => {
    if (!confirm(`"${name}" müşterisini silmek istediğinizden emin misiniz?`)) return;
    // Silme işlemi sırasında belki ayrı bir loading state kullanılabilir
    try {
      await deleteCustomer(customerId);
      setCustomers(customers.filter(c => c.id !== customerId));
      toast.success(`"${name}" müşterisi silindi.`);
    } catch (error: any) {
      console.error("Müşteri silme hatası:", error);
      toast.error(error?.message || "Müşteri silinemedi.");
    }
  };

  // Filtrelenmiş Müşteriler
  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const searchLower = search.toLowerCase();
    return customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(searchLower)) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchLower)) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.includes(searchLower)) ||
      (c.taxId && c.taxId.includes(searchLower))
    );
  }, [customers, search]);

  // --- RENDER --- 
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Users className="mr-2 h-6 w-6"/>
            Müşteri Yönetimi
          </h1>
          <p className="text-muted-foreground">Müşteri kayıtlarını görüntüleyin ve yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup 
            type="single" 
            defaultValue="list" 
            value={viewMode} 
            onValueChange={(value: "list" | "card") => { if (value) setViewMode(value); }}
            aria-label="Görünüm modu"
           >
            <ToggleGroupItem value="list" aria-label="Liste görünümü">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Kart görünümü">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Müşteri
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{editingCustomer ? "Müşteriyi Düzenle" : "Yeni Müşteri Oluştur"}</SheetTitle>
                <SheetDescription>
                  {editingCustomer 
                    ? `"${editingCustomer.name}" müşterisinin bilgilerini güncelleyin.`
                    : "Yeni bir müşteri kaydı oluşturmak için formu doldurun."
                  }
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="py-4 space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right col-span-1">
                      Firma Adı *
                    </Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      required 
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contactName" className="text-right col-span-1">
                      Yetkili Kişi
                    </Label>
                    <Input 
                      id="contactName" 
                      name="contactName"
                      value={formData.contactName || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contactTitle" className="text-right col-span-1">
                      Yetkili Ünvan
                    </Label>
                    <Input 
                      id="contactTitle" 
                      name="contactTitle"
                      value={formData.contactTitle || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right col-span-1">
                      E-posta
                    </Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                    </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right col-span-1">
                      Telefon
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                    </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right col-span-1">
                      Adres
                    </Label>
                    <Textarea 
                      id="address" 
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                 </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right col-span-1">
                      Şehir
                    </Label>
                    <Input 
                      id="city" 
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="district" className="text-right col-span-1">
                      İlçe
                    </Label>
                    <Input 
                      id="district" 
                      name="district"
                      value={formData.district || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="postalCode" className="text-right col-span-1">
                      Posta Kodu
                    </Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode"
                      value={formData.postalCode || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
          </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="country" className="text-right col-span-1">
                      Ülke
                    </Label>
                    <Input 
                      id="country" 
                      name="country"
                      value={formData.country || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
        </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="taxId" className="text-right col-span-1">
                      Vergi Numarası
                    </Label>
                    <Input 
                      id="taxId" 
                      name="taxId"
                      value={formData.taxId || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="taxOffice" className="text-right col-span-1">
                      Vergi Dairesi
                    </Label>
                    <Input 
                      id="taxOffice" 
                      name="taxOffice"
                      value={formData.taxOffice || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right col-span-1">
                      Web Sitesi
                    </Label>
                    <Input 
                      id="website" 
                      name="website"
                      value={formData.website || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right col-span-1">
                      Notlar
                    </Label>
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      rows={3} 
                    />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right col-span-1">
                      Durum
                    </Label>
                    <select 
                      id="status" 
                      name="status"
                      value={formData.status || "ACTIVE"}
                      onChange={handleInputChange}
                      className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {["ACTIVE", "INACTIVE", "PENDING"].map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="button" variant="outline">İptal</Button>
                  </SheetClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    {editingCustomer ? "Güncelle" : "Oluştur"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
                </div>
              </div>

      {/* Arama */}
      <div className="relative w-full sm:max-w-xs">
         <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
            placeholder="Müşterilerde ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
              </div>

      {/* Hata Mesajı */}
       {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

       {/* İçerik Alanı */}
      {loading ? (
          <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'list' ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma Adı</TableHead>
                  <TableHead>Yetkili Kişi</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Şehir</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {search ? `"${search}" için sonuç bulunamadı.` : "Henüz müşteri kaydı yok."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/customers/${customer.id}`} className="hover:underline">
                          {customer.name}
                        </Link>
                      </TableCell>
                      <TableCell>{customer.contactName || "-"}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>{customer.city || "-"}</TableCell>
                      <TableCell className="text-right">
                         <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <Link href={`/customers/${customer.id}`} legacyBehavior passHref>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 mr-1">
                                        <Building size={16} />
                                    </Button>
                                 </Link>
                              </TooltipTrigger>
                              <TooltipContent><p>Detayları Görüntüle</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                         <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSheet(customer)}>
                                  <Pencil size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Düzenle</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                         <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive/80" 
                                  onClick={() => handleDelete(customer.id, customer.name)}
                                >
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
            {filteredCustomers.length === 0 ? (
                 <p className="col-span-full text-center text-muted-foreground py-10">
                    {search ? `"${search}" için sonuç bulunamadı.` : "Henüz müşteri kaydı yok."}
                 </p>
            ) : (
                filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>
                         <Link href={`/customers/${customer.id}`} className="hover:underline flex items-center">
                           <Building className="mr-2 h-5 w-5 text-primary"/>
                           {customer.name}
                         </Link>
                      </CardTitle>
                      <CardDescription>{customer.contactName || 'Yetkili belirtilmemiş'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center">
                         <Mail className="mr-2 h-4 w-4 text-muted-foreground"/>
                         <a href={`mailto:${customer.email}`} className="hover:underline truncate">{customer.email || '-'}</a>
                      </div>
                        <div className="flex items-center">
                         <Phone className="mr-2 h-4 w-4 text-muted-foreground"/>
                         <span>{customer.phone || '-'}</span>
                        </div>
                       {customer.website && (
                        <div className="flex items-center">
                           <Globe className="mr-2 h-4 w-4 text-muted-foreground"/>
                            <a href={customer.website.startsWith('http') ? customer.website : `//${customer.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{customer.website}</a>
                        </div>
                      )}
                        {customer.notes && (
                         <div className="flex items-start pt-2 mt-2 border-t">
                           <NotebookText className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"/>
                           <p className="text-muted-foreground text-xs line-clamp-2">{customer.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openEditSheet(customer)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Düzenle</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="destructive" size="icon" onClick={() => handleDelete(customer.id, customer.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Sil</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </CardFooter>
                  </Card>
              ))
            )}
          </div>
        )}
    </div>
  );
} 