"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/employee";
import { getAllEmployees } from "@/services/employeeService";
import { createAnnualLeave } from "@/services/annualLeaveService";
import { LeaveStatus } from "@/types/annualLeave";

// Form şeması
const formSchema = z.object({
  employeeId: z.string({
    required_error: "Personel seçilmelidir",
  }),
  startDate: z.date({
    required_error: "Başlangıç tarihi seçilmelidir",
  }),
  endDate: z.date({
    required_error: "Bitiş tarihi seçilmelidir",
  }),
  notes: z.string().optional(),
}).refine(data => {
  return data.endDate >= data.startDate;
}, {
  message: "Bitiş tarihi başlangıç tarihinden önce olamaz",
  path: ["endDate"],
});

interface CreateLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateLeaveDialog({ open, onClose, onCreated }: CreateLeaveDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Dialog kapandığında formu sıfırla
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // Personel listesini yükle
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true);
        const data = await getAllEmployees();
        console.log("[CreateLeaveDialog] Fetched Employees Data:", data);
        setEmployees(data);
      } catch (error) {
        console.error("Personel listesi yüklenemedi:", error);
        toast.error("Personel listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // İzin ekle
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Date nesnelerini YYYY-MM-DD formatına çevir
      const formattedStartDate = format(values.startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(values.endDate, 'yyyy-MM-dd');

      // Backend'in beklediği veri objesini oluştur
      const leavePayload: { 
        userId: string; 
        startDate: string; 
        endDate: string; 
        reason?: string; // reason opsiyonel
      } = {
        userId: values.employeeId, 
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      };

      // Sadece notes alanı doluysa reason'ı ekle
      if (values.notes && values.notes.trim() !== "") {
          leavePayload.reason = values.notes;
      }

      // Backend'in beklediği alanları gönder
      await createAnnualLeave(leavePayload);

      toast.success("İzin talebi başarıyla oluşturuldu");
      form.reset();
      onCreated();
    } catch (error) {
      console.error("İzin oluşturulurken hata:", error);
      toast.error("İzin oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // İki tarih arasındaki gün farkını hesapla (hafta sonları hariç)
  const calculateWorkdays = () => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");

    if (!startDate || !endDate) return null;

    let totalDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 0: Pazar, 6: Cumartesi
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalDays;
  };

  const workdays = calculateWorkdays();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni İzin Talebi</DialogTitle>
          <DialogDescription>
            Yeni bir yıllık izin talebi oluşturun. Tüm alanları doldurduktan sonra talebi kaydedin.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personel</FormLabel>
                  <Select
                    disabled={isLoading || isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Personel seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Yükleniyor...</span>
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="p-2 text-center text-sm">
                          Personel bulunamadı
                        </div>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.department?.name || "Departman yok"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            disabled={isSubmitting}
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
                          disabled={(date) => date < new Date()}
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
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
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
                            date < new Date() || 
                            (form.watch("startDate") && date < form.watch("startDate"))
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

            {workdays !== null && form.watch("startDate") && form.watch("endDate") && (
              <div className={cn(
                "px-3 py-2 rounded-md text-sm",
                workdays > 0 ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}>
                <p>
                  {workdays === 0
                    ? "Seçtiğiniz tarih aralığı hafta sonuna denk gelmektedir. Lütfen geçerli bir tarih aralığı seçin."
                    : `Seçtiğiniz tarihler arasında toplam ${workdays} iş günü bulunmaktadır.`}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="İzin talebi ile ilgili açıklamalarınızı ekleyebilirsiniz"
                      className="resize-none min-h-[80px]"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || workdays === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 