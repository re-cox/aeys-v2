"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";

// Form şeması
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

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      managerId: "",
      status: "",
      budget: "",
      clientId: "",
      departmentId: ""
    },
  });

  // Proje verilerini getir
  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Proje verisi
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Proje verileri alınamadı (HTTP ${response.status})`);
      }
      
      const projectData = await response.json();
      
      if (!projectData.data) {
        throw new Error('Proje bulunamadı');
      }
      
      // Formu doldur
      form.reset({
        name: projectData.data.name,
        description: projectData.data.description || "",
        startDate: projectData.data.startDate ? new Date(projectData.data.startDate) : undefined,
        endDate: projectData.data.endDate ? new Date(projectData.data.endDate) : undefined,
        status: projectData.data.status || "",
        budget: projectData.data.budget ? projectData.data.budget.toString() : "",
        clientId: projectData.data.Customer?.id || "",
        departmentId: projectData.data.Department?.id || "",
        managerId: "" // Backend'den alınacak
      });
    } catch (err: any) {
      console.error("Proje verileri alınırken hata:", err);
      setError(err.message);
      toast.error("Proje verileri alınamadı");
    } finally {
      setLoading(false);
    }
  }, [projectId, form]);

  // Gerekli verileri getir
  const fetchRelatedData = useCallback(async () => {
    try {
      // Departmanları getir
      const departmentsResponse = await fetch('/api/departments');
      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData.data || []);
      }
      
      // Müşterileri getir
      const customersResponse = await fetch('/api/customers');
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.data || []);
      }
      
      // Çalışanları getir
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.data || []);
      }
    } catch (err) {
      console.error("İlgili veriler yüklenirken hata:", err);
      toast.error("Bazı veriler yüklenemedi");
    }
  }, []);

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchProjectData();
    fetchRelatedData();
  }, [fetchProjectData, fetchRelatedData]);

  // Form gönderildiğinde
  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate ? data.endDate.toISOString() : null,
          status: data.status,
          budget: data.budget ? parseFloat(data.budget) : null,
          managerId: data.managerId,
          departmentId: data.departmentId,
          clientId: data.clientId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Proje güncellenirken hata oluştu (HTTP ${response.status})`);
      }

      toast.success("Proje başarıyla güncellendi");
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      console.error("Proje güncellenirken hata:", error);
      toast.error(error.message || "Proje güncellenirken bir hata oluştu");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Proje bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Proje Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proje Düzenle</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Proje Detaylarına Dön
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proje Bilgileri</CardTitle>
              <CardDescription>
                Proje detaylarını güncelleyin
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
                              variant="outline"
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
                            disabled={(date) => date < new Date("2020-01-01")}
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
                              variant="outline"
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
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
                          <SelectItem value="PLANNING">Planlanmış</SelectItem>
                          <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                          <SelectItem value="COMPLETED">Tamamlanmış</SelectItem>
                          <SelectItem value="ON_HOLD">Beklemede</SelectItem>
                          <SelectItem value="CANCELLED">İptal Edilmiş</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Departman Seçimi */}
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
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Bütçe ve Müşteri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bütçe */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje Bütçesi (TL)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ör: 500000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Müşteri Seçimi */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Müşteri seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                          <SelectValue placeholder="Proje yöneticisi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} {employee.surname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                İptal
              </Button>
              <Button type="submit">Projeyi Güncelle</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 