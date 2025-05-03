"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAnnualLeaveById, updateAnnualLeave } from "@/services/annualLeaveService";
import { getAllEmployees } from "@/services/employeeService";
import Link from "next/link";

const formSchema = z.object({
  employeeId: z.string().min(1, { message: "Personel seçilmelidir" }),
  startDate: z.date({ required_error: "Başlangıç tarihi seçilmelidir" }),
  endDate: z.date({ required_error: "Bitiş tarihi seçilmelidir" }),
  totalDays: z.number().min(1, { message: "İzin süresi en az 1 gün olmalıdır" }),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default(LeaveStatus.PENDING),
  approvedBy: z.string().optional()
});

export default function EditAnnualLeavePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      reason: "",
      notes: "",
      status: LeaveStatus.PENDING,
      approvedBy: ""
    }
  });

  // Veri yükleme
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // İzin kaydını al
        const leaveData = await getAnnualLeaveById(id);
        
        // Form değerlerini güncelle
        form.reset({
          employeeId: leaveData.employeeId,
          startDate: new Date(leaveData.startDate),
          endDate: new Date(leaveData.endDate),
          totalDays: leaveData.totalDays,
          reason: leaveData.reason || "",
          notes: leaveData.notes || "",
          status: leaveData.status,
          approvedBy: leaveData.approvedBy || ""
        });
        
        // Personel listesini al
        const employeesData = await getAllEmployees();
        setEmployees(employeesData.sort((a, b) => 
          `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
        ));
        
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        toast.error("İzin kaydı yüklenemedi.");
        router.push('/annual-leave');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, form, router]);

  // İzin gün sayısını hesapla
  const calculateTotalDays = (startDate: Date, endDate: Date) => {
    // startDate ve endDate dahil olmak üzere iş günlerini hesapla
    const currentDate = new Date(startDate);
    let totalDays = 0;

    while (currentDate <= endDate) {
      // 0 = Pazar, 6 = Cumartesi
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalDays;
  };

  // Tarih seçildiğinde gün sayısını otomatik hesapla
  useEffect(() => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");

    if (startDate && endDate) {
      if (endDate < startDate) {
        form.setValue("endDate", startDate);
        form.setValue("totalDays", 1);
      } else {
        const days = calculateTotalDays(startDate, endDate);
        form.setValue("totalDays", days);
      }
    }
  }, [form.watch("startDate"), form.watch("endDate"), form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Yıllık izin güncelleniyor...");
    
    try {
      const updateData: UpdateAnnualLeave = {
        employeeId: values.employeeId,
        startDate: values.startDate,
        endDate: values.endDate,
        totalDays: values.totalDays,
        reason: values.reason,
        notes: values.notes,
        status: values.status,
        approvedBy: values.approvedBy
      };
      
      await updateAnnualLeave(id, updateData);
      
      toast.dismiss(loadingToast);
      toast.success("Yıllık izin başarıyla güncellendi.");
      router.push(`/annual-leave/${id}`);
    } catch (error) {
      console.error("Yıllık izin güncellenirken hata:", error);
      toast.dismiss(loadingToast);
      toast.error("Yıllık izin güncellenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Yıllık İzin Düzenle
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">İzin Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personel</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isLoading || isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Personel seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.name} {employee.surname} 
                                  {employee.department?.name && 
                                    <span className="ml-2 text-gray-500 text-xs">
                                      ({employee.department.name})
                                    </span>
                                  }
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                    disabled={isSubmitting}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy", { locale: tr })
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
                                  onSelect={(date) => field.onChange(date || undefined)}
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
                            <FormLabel>Bitiş Tarihi</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    disabled={isSubmitting}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy", { locale: tr })
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
                                  onSelect={(date) => field.onChange(date || undefined)}
                                  disabled={(date) => 
                                    form.watch("startDate") ? date < form.watch("startDate") : false
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

                    <FormField
                      control={form.control}
                      name="totalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Toplam İş Günü</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              disabled={true}
                              className="bg-gray-50 dark:bg-gray-900"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İzin Sebebi (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="İzin sebebi hakkında kısa bir açıklama yazın"
                              disabled={isSubmitting}
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="İlave notlar"
                              disabled={isSubmitting}
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durum</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={LeaveStatus.PENDING}>Beklemede</SelectItem>
                              <SelectItem value={LeaveStatus.APPROVED}>Onaylandı</SelectItem>
                              <SelectItem value={LeaveStatus.REJECTED}>Reddedildi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="approvedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Onaylayan (Onaylandı durumunda doldurulmalıdır)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Onaylayan kişinin adı"
                              disabled={isSubmitting || form.watch("status") !== LeaveStatus.APPROVED}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Link href={`/annual-leave/${id}`}>
                        <Button variant="outline" disabled={isSubmitting}>
                          İptal
                        </Button>
                      </Link>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bilgilendirme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">İzin Tarihleri</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      İzin başlangıç ve bitiş tarihlerini seçtiğinizde, toplam iş günü otomatik olarak hesaplanır. Hafta sonları (Cumartesi-Pazar) hesaplamaya dahil edilmez.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">İzin Durumu</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      İzin talebini onaylamak için durum alanını "Onaylandı" olarak değiştirin. "Onaylandı" durumunda "Onaylayan" alanı doldurulmalıdır.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 