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
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AnnualLeave } from "@/types/annualLeave";
import { updateAnnualLeave } from "@/services/annualLeaveService";

// Form şeması
const formSchema = z.object({
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

interface EditLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onEdited: () => void;
  leave: AnnualLeave;
}

export function EditLeaveDialog({ open, onClose, onEdited, leave }: EditLeaveDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      notes: leave.notes || "",
    },
  });

  // Dialog açıldığında form değerlerini güncelle
  useEffect(() => {
    if (open) {
      form.reset({
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        notes: leave.notes || "",
      });
    }
  }, [open, leave, form]);

  // İzni güncelle
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // İki tarih arasındaki gün sayısını hesapla (hafta sonları hariç)
      const startDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);
      
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
      
      // İzni güncelle
      await updateAnnualLeave({
        id: leave.id,
        startDate: values.startDate,
        endDate: values.endDate,
        notes: values.notes,
        totalDays: totalDays
      });
      
      toast.success("İzin talebi başarıyla güncellendi");
      onEdited();
    } catch (error) {
      console.error("İzin güncellenirken hata:", error);
      toast.error("İzin güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
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
          <DialogTitle>İzin Talebini Düzenle</DialogTitle>
          <DialogDescription>
            İzin talebinin tarihlerini ve notlarını düzenleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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