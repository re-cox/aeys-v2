"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
// import { DatePicker } from "@/components/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { toast } from "sonner";
import axios from 'axios';
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Form şeması ve validation
const formSchema = z.object({
  name: z.string().min(3, "Proje adı en az 3 karakter olmalıdır."),
  description: z.string().min(10, "Proje açıklaması en az 10 karakter olmalıdır."),
  startDate: z.date({ required_error: "Başlangıç tarihi zorunludur" }),
  endDate: z.date({ required_error: "Bitiş tarihi zorunludur" }).optional(),
  managerId: z.string().min(1, "Proje yöneticisi seçilmelidir"),
  status: z.string().min(1, "Proje durumu seçilmelidir"),
  budget: z.string().optional(),
  clientId: z.string().optional(),
  departmentId: z.string().min(1, "Departman seçilmelidir"),
});

export default function NewProjectPage() {
  const router = useRouter();
  const { toast: toastUI } = useToast();
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      budget: "",
      status: "active", // Default status
      departmentId: "", // Varsayılan departman ID'si (boş)
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsFetchingEmployees(true);
      try {
        // Hata ayıklama için daha fazla detay
        console.log("Çalışanları getirme işlemi başlıyor...");
        
        // Backend API'sine doğrudan istek gönder
        const API_BASE_URL = "http://localhost:5001/api";
        
        // localStorage client-side'da güvenli bir şekilde kullanmak için
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token');
          console.log("Token durumu:", token ? "Bulundu" : "Bulunamadı");
        }
        
        if (!token) {
          console.error("Token bulunamadı, lütfen oturum açın");
          toast.error('Oturum bilgisi bulunamadı. Lütfen yeniden giriş yapın.');
          setIsFetchingEmployees(false);
          return;
        }
        
        console.log(`${API_BASE_URL}/employees API'sine istek gönderiliyor...`);
        
        // Backend API'ye yetkilendirme token'ı ile istek gönder
        const response = await fetch(`${API_BASE_URL}/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("API yanıtı:", response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error('Çalışanlar getirilemedi.');
        }
        
        const responseData = await response.json();
        console.log("Alınan yanıt verisi:", responseData);
        
        // Yanıt verilerini kontrol et
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
          console.error("API yanıtı beklenen formatta değil:", responseData);
          throw new Error('API yanıtı geçersiz format.');
        }
        
        // Veri yapısını loglayarak analiz et - ilk elemanı incele
        if (responseData.data.length > 0) {
          console.log("Örnek çalışan verisi:", JSON.stringify(responseData.data[0], null, 2));
        }
        
        // Backend veri formatını bizim istediğimiz formata dönüştür
        const processedEmployees = responseData.data.map((emp: any) => {
          // Veri yapısına göre uygun alan kontrollerini yap
          // Çalışan adı direkt olarak emp nesnesinde veya user.name içinde olabilir
          let firstName = '';
          let lastName = '';
          
          // Farklı veri yapısı olasılıklarını kontrol et
          if (emp.user?.name) {
            firstName = emp.user.name;
            lastName = emp.user.surname || '';
          } else if (emp.name) {
            firstName = emp.name;
            lastName = emp.surname || '';
          } else if (emp.firstName) {
            firstName = emp.firstName;
            lastName = emp.lastName || '';
          }
          
          const fullName = `${firstName} ${lastName}`.trim();
          
          console.log(`Çalışan ID: ${emp.id}, İşlenen İsim: ${fullName || 'İsimsiz Çalışan'}`);
          
          return {
            id: emp.id,
            name: fullName || 'İsimsiz Çalışan'
          };
        });
        
        console.log("İşlenmiş çalışan verileri:", processedEmployees);
        setEmployees(processedEmployees);

        // Hiç çalışan bulunamadıysa uyarı göster
        if (processedEmployees.length === 0) {
          console.warn("Dikkat: Hiç çalışan bulunamadı! Önce Employee tablosunu doldurun.");
        }

      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error('Çalışan listesi yüklenirken bir hata oluştu.');
      } finally {
        setIsFetchingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Departmanları getirme
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsFetchingDepartments(true);
      try {
        console.log("Departmanları getirme işlemi başlıyor...");
        
        // Backend API'sine doğrudan istek gönder
        const API_BASE_URL = "http://localhost:5001/api";
        
        // localStorage client-side'da güvenli bir şekilde kullanmak için
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token');
        }
        
        if (!token) {
          console.error("Token bulunamadı, lütfen oturum açın");
          toast.error('Oturum bilgisi bulunamadı. Lütfen yeniden giriş yapın.');
          setIsFetchingDepartments(false);
          return;
        }
        
        console.log(`${API_BASE_URL}/departments API'sine istek gönderiliyor...`);
        
        // Backend API'ye yetkilendirme token'ı ile istek gönder
        const response = await fetch(`${API_BASE_URL}/departments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Departmanlar getirilemedi.');
        }
        
        const responseData = await response.json();
        
        // Yanıt verilerini kontrol et
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
          console.error("API yanıtı beklenen formatta değil:", responseData);
          throw new Error('API yanıtı geçersiz format.');
        }
        
        // Backend veri formatını bizim istediğimiz formata dönüştür
        const processedDepartments = responseData.data.map((dep: any) => {
          return {
            id: dep.id,
            name: dep.name || 'İsimsiz Departman'
          };
        });
        
        console.log("İşlenmiş departman verileri:", processedDepartments);
        setDepartments(processedDepartments);

      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error('Departman listesi yüklenirken bir hata oluştu.');
      } finally {
        setIsFetchingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);

  // Form gönderimi
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      console.log("Form değerleri:", values);
      
      // Tarih formatını API'ye uygun hale getir
      const formattedValues = {
        ...values,
        startDate: format(new Date(values.startDate), 'yyyy-MM-dd'),
        endDate: values.endDate ? format(new Date(values.endDate), 'yyyy-MM-dd') : undefined,
        budget: values.budget ? parseFloat(values.budget) : undefined,
      };
      
      console.log("API'ye gönderilecek değerler:", formattedValues);
      
      // API isteği
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Proje oluşturulurken bir hata oluştu.');
      }
      
      toast.success('Proje başarıyla oluşturuldu');
      router.push('/projects');
      
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error instanceof Error ? error.message : 'Proje oluşturulurken bir hata oluştu.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Yeni Proje Oluştur</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proje Bilgileri</CardTitle>
              <CardDescription>
                Yeni projenin temel bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proje Adı */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proje Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Ör: Aydem Merkez Binası Elektrik Altyapı Projesi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Proje Açıklaması */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proje Açıklaması</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Projenin kapsamı ve detayları hakkında bilgi verin" 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Başlangıç ve Bitiş Tarihleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bitiş Tarihi (Opsiyonel)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Proje Durumu ve Departman */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proje Durumu */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje Durumu</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Proje durumunu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="planned">Planlanmış</SelectItem>
                          <SelectItem value="completed">Tamamlanmış</SelectItem>
                          <SelectItem value="on-hold">Beklemede</SelectItem>
                          <SelectItem value="cancelled">İptal Edilmiş</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Departman */}
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departman</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Departman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isFetchingDepartments && <SelectItem value="loading_placeholder" disabled>Departmanlar yükleniyor...</SelectItem>}
                          {!isFetchingDepartments && departments.length === 0 && <SelectItem value="no_department" disabled>Departman bulunamadı</SelectItem>}
                          {departments.map((dep) => (
                            <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Proje Yöneticisi ve Bütçe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proje Yöneticisi */}
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje Yöneticisi</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Proje yöneticisini seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isFetchingEmployees && <SelectItem value="loading_placeholder" disabled>Çalışanlar yükleniyor...</SelectItem>}
                          {!isFetchingEmployees && employees.length === 0 && <SelectItem value="no_employee" disabled>Çalışan bulunamadı</SelectItem>}
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Bütçe */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bütçe (TL) (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ör: 50000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/projects')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : 'Projeyi Oluştur'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}