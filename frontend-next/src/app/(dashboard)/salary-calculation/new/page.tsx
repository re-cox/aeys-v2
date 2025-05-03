"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CalendarIcon, ArrowLeft, Calculator, CreditCard, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { createSalaryPayment } from "@/services/salaryPaymentService";
import { getAllEmployees } from "@/services/employeeService";
import { NewSalaryPayment, PaymentMethod } from "@/types/salaryPayment";
import { Employee } from "@/types/employee";
import Link from "next/link";

const formSchema = z.object({
  employeeId: z.string().min(1, { message: "Personel seçilmelidir" }),
  paymentDate: z.date({ required_error: "Ödeme tarihi seçilmelidir" }),
  baseSalary: z.number().min(0, { message: "Brüt maaş sıfırdan büyük olmalıdır" }),
  overtimePay: z.number().min(0, { message: "Mesai ücreti sıfırdan küçük olamaz" }).optional(),
  bonus: z.number().min(0, { message: "Prim miktarı sıfırdan küçük olamaz" }).optional(),
  taxDeduction: z.number().min(0, { message: "Vergi kesintisi sıfırdan küçük olamaz" }).optional(),
  insuranceDeduction: z.number().min(0, { message: "Sigorta kesintisi sıfırdan küçük olamaz" }).optional(),
  otherDeductions: z.number().min(0, { message: "Diğer kesintiler sıfırdan küçük olamaz" }).optional(),
  netAmount: z.number().min(0, { message: "Net maaş sıfırdan büyük olmalıdır" }),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, { message: "Ödeme yöntemi seçilmelidir" })
});

export default function NewSalaryCalculationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: new Date(),
      baseSalary: 0,
      overtimePay: 0,
      bonus: 0,
      taxDeduction: 0,
      insuranceDeduction: 0,
      otherDeductions: 0,
      netAmount: 0,
      notes: "",
      paymentMethod: PaymentMethod.BANK_TRANSFER
    }
  });

  // Personel listesini API'den al
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await getAllEmployees();
        // Personeli alfabetik sırala
        const sortedEmployees = data.sort((a, b) => 
          `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
        );
        setEmployees(sortedEmployees);
      } catch (error) {
        console.error("Personel listesi yüklenirken hata:", error);
        toast.error("Personel listesi yüklenemedi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Otomatik net maaş hesaplama
  const calculateNetAmount = () => {
    const baseSalary = form.watch("baseSalary") || 0;
    const overtimePay = form.watch("overtimePay") || 0;
    const bonus = form.watch("bonus") || 0;
    const taxDeduction = form.watch("taxDeduction") || 0;
    const insuranceDeduction = form.watch("insuranceDeduction") || 0;
    const otherDeductions = form.watch("otherDeductions") || 0;
    
    const totalIncome = baseSalary + overtimePay + bonus;
    const totalDeductions = taxDeduction + insuranceDeduction + otherDeductions;
    const netAmount = totalIncome - totalDeductions;
    
    return netAmount > 0 ? netAmount : 0;
  };

  // Maaş değerleri değiştiğinde net maaşı güncelle
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (["baseSalary", "overtimePay", "bonus", "taxDeduction", "insuranceDeduction", "otherDeductions"].includes(name || "")) {
        const netAmount = calculateNetAmount();
        form.setValue("netAmount", netAmount);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Maaş hesaplaması kaydediliyor...");
    
    try {
      const newSalaryPayment: NewSalaryPayment = {
        employeeId: values.employeeId,
        paymentDate: values.paymentDate,
        baseSalary: values.baseSalary,
        overtimePay: values.overtimePay || 0,
        bonus: values.bonus || 0,
        taxDeduction: values.taxDeduction || 0,
        insuranceDeduction: values.insuranceDeduction || 0,
        otherDeductions: values.otherDeductions || 0,
        netAmount: values.netAmount,
        notes: values.notes,
        paymentMethod: values.paymentMethod
      };
      
      await createSalaryPayment(newSalaryPayment);
      
      toast.dismiss(loadingToast);
      toast.success("Maaş hesaplaması başarıyla kaydedildi.");
      router.push("/salary-calculation");
    } catch (error) {
      console.error("Maaş hesaplaması kaydedilirken hata:", error);
      toast.dismiss(loadingToast);
      toast.error("Maaş hesaplaması kaydedilemedi. Lütfen daha sonra tekrar deneyin.");
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
          onClick={() => router.push("/salary-calculation")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Yeni Maaş Hesaplama
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Maaş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personel Seçimi */}
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personel</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
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

                  {/* Ödeme Tarihi */}
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ödeme Tarihi</FormLabel>
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
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ödeme Yöntemi */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ödeme Yöntemi</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ödeme yöntemi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={PaymentMethod.BANK_TRANSFER}>Banka Havalesi</SelectItem>
                            <SelectItem value={PaymentMethod.CASH}>Nakit</SelectItem>
                            <SelectItem value={PaymentMethod.CHECK}>Çek</SelectItem>
                            <SelectItem value={PaymentMethod.OTHER}>Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Brüt Maaş */}
                    <FormField
                      control={form.control}
                      name="baseSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brüt Maaş (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mesai Ücreti */}
                    <FormField
                      control={form.control}
                      name="overtimePay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesai Ücreti (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Prim */}
                    <FormField
                      control={form.control}
                      name="bonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prim (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Vergi Kesintisi */}
                    <FormField
                      control={form.control}
                      name="taxDeduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vergi Kesintisi (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sigorta Kesintisi */}
                    <FormField
                      control={form.control}
                      name="insuranceDeduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sigorta Kesintisi (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Diğer Kesintiler */}
                    <FormField
                      control={form.control}
                      name="otherDeductions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diğer Kesintiler (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Net Maaş */}
                  <FormField
                    control={form.control}
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Maaş (₺)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            className="font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notlar */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notlar (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Maaş ödemesi hakkında ekstra bilgiler..."
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Link href="/salary-calculation">
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
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Maaş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Brüt Maaş:</div>
                <div className="text-right">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("baseSalary") || 0)}
                </div>
                
                <div className="font-medium">Mesai Ücreti:</div>
                <div className="text-right">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("overtimePay") || 0)}
                </div>
                
                <div className="font-medium">Prim:</div>
                <div className="text-right">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("bonus") || 0)}
                </div>
                
                <div className="font-medium text-gray-800 dark:text-gray-200 border-t pt-1">Toplam Gelir:</div>
                <div className="text-right text-gray-800 dark:text-gray-200 border-t pt-1">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    (form.watch("baseSalary") || 0) + 
                    (form.watch("overtimePay") || 0) + 
                    (form.watch("bonus") || 0)
                  )}
                </div>
                
                <div className="font-medium text-red-500 mt-2">Vergi Kesintisi:</div>
                <div className="text-right text-red-500 mt-2">
                  -{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("taxDeduction") || 0)}
                </div>
                
                <div className="font-medium text-red-500">Sigorta Kesintisi:</div>
                <div className="text-right text-red-500">
                  -{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("insuranceDeduction") || 0)}
                </div>
                
                <div className="font-medium text-red-500">Diğer Kesintiler:</div>
                <div className="text-right text-red-500">
                  -{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("otherDeductions") || 0)}
                </div>
                
                <div className="font-medium text-red-500 border-t pt-1">Toplam Kesinti:</div>
                <div className="text-right text-red-500 border-t pt-1">
                  -{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    (form.watch("taxDeduction") || 0) + 
                    (form.watch("insuranceDeduction") || 0) + 
                    (form.watch("otherDeductions") || 0)
                  )}
                </div>
                
                <div className="font-medium text-green-600 dark:text-green-400 text-lg mt-2 border-t-2 pt-2">
                  Net Maaş:
                </div>
                <div className="text-right text-green-600 dark:text-green-400 text-lg font-bold mt-2 border-t-2 pt-2">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.watch("netAmount") || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bilgilendirme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-2">
                <Calculator className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Otomatik Hesaplama</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gelir ve kesinti değerlerini girdikçe, net maaş tutarı otomatik olarak hesaplanacaktır.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Kesintiler</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vergi, sigorta ve diğer kesintileri doğru şekilde girerek net maaş tutarının doğru hesaplanmasını sağlayın.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Ödeme Yöntemi</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Maaş ödemesinin nasıl yapılacağını belirtmek için ödeme yöntemini seçmeyi unutmayın.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 