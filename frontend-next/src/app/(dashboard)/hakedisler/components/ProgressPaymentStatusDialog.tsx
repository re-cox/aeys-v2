import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressPayment, ProgressPaymentStatus } from '@/types/progressPayment';
import { translateProgressPaymentStatus } from '@/services/progressPaymentService';

interface ProgressPaymentStatusDialogProps {
  payment: ProgressPayment;
  onSubmit: (status: string, data: any) => Promise<boolean>;
  onCancel: () => void;
}

// Form şeması
const formSchema = z.object({
  status: z.string(),
  approvedAmount: z.number().optional().nullable(),
  paidAmount: z.number().optional().nullable(),
  paymentDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

// Form tipi
type FormValues = z.infer<typeof formSchema>;

// Mevcut duruma göre sonraki olası durumları belirle
const getNextPossibleStatuses = (currentStatus: ProgressPaymentStatus): ProgressPaymentStatus[] => {
  switch (currentStatus) {
    case 'DRAFT':
      return ['SUBMITTED'];
    case 'SUBMITTED':
      return ['PENDING', 'DRAFT', 'REJECTED'];
    case 'PENDING':
      return ['APPROVED', 'REJECTED'];
    case 'APPROVED':
      return ['PAID', 'REJECTED'];
    case 'PAID':
      return ['PAID']; // Ödendi durumu değiştirilemez, yine kendisi olabilir
    case 'REJECTED':
      return ['DRAFT', 'SUBMITTED', 'PENDING']; // Reddedilmiş durum yeniden başlatılabilir
    default:
      return ['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'];
  }
};

export function ProgressPaymentStatusDialog({ payment, onSubmit, onCancel }: ProgressPaymentStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(payment.status);
  
  // Form tanımlaması
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: payment.status,
      approvedAmount: payment.approvedAmount,
      paidAmount: payment.paidAmount,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
      notes: payment.notes,
    }
  });
  
  // Status değiştiğinde form değerlerini güncelle
  useEffect(() => {
    form.setValue('status', selectedStatus);
  }, [selectedStatus, form]);
  
  // Form gönderim işlemi
  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await onSubmit(values.status, {
        approvedAmount: values.approvedAmount,
        paidAmount: values.paidAmount,
        paymentDate: values.paymentDate,
        notes: values.notes
      });
      
      if (!result) {
        throw new Error('Durum güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni Durum</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedStatus(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DRAFT">Hazırlanıyor</SelectItem>
                  <SelectItem value="SUBMITTED">Gönderildi</SelectItem>
                  <SelectItem value="PENDING">Onay Bekliyor</SelectItem>
                  <SelectItem value="APPROVED">Onaylandı</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="REJECTED">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Hakediş durumunu güncelleyin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {(selectedStatus === 'APPROVED' || selectedStatus === 'PAID') && (
          <FormField
            control={form.control}
            name="approvedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Onaylanan Tutar</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="0.00"
                      type="number"
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">₺</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Hakediş için onaylanan tutarı girin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {(selectedStatus === 'PAID') && (
          <FormField
            control={form.control}
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ödenen Tutar</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="0.00"
                      type="number"
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">₺</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Hakediş için ödenen tutarı girin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {(selectedStatus === 'APPROVED' || selectedStatus === 'PAID') && (
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
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy")
                        ) : (
                          <span>Tarih Seçin</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Hakediş ödeme tarihini seçin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Durum değişikliği ile ilgili ek notlar..."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Durum değişikliği ile ilgili ek bilgiler ekleyin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <XCircle className="mr-2 h-4 w-4" /> İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
}