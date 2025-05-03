import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressPayment } from '@/types/progressPayment';
import { translateProgressPaymentStatus } from '@/services/progressPaymentService';

interface ProgressPaymentStatusDialogProps {
  payment: ProgressPayment;
  onSubmit: (status: string, data: any) => Promise<boolean>;
  onCancel: () => void;
}

// Form şeması
const formSchema = z.object({
  status: z.string({
    required_error: 'Durum seçimi gereklidir',
  }),
  approvedAmount: z.coerce.number().optional().nullable(),
  paidAmount: z.coerce.number().optional().nullable(),
  paymentDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

export function ProgressPaymentStatusDialog({ payment, onSubmit, onCancel }: ProgressPaymentStatusDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: payment.status,
      approvedAmount: payment.approvedAmount,
      paidAmount: payment.paidAmount,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
      notes: payment.notes,
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const selectedStatus = form.watch('status');

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(values.status, {
        approvedAmount: values.approvedAmount,
        paidAmount: values.paidAmount,
        paymentDate: values.paymentDate,
        notes: values.notes,
      });
      if (!success) {
        form.setError('root', {
          message: 'Hakediş durumu güncellenirken bir hata oluştu',
        });
      }
    } catch (error) {
      console.error('Form gönderilirken hata:', error);
      form.setError('root', {
        message: 'Beklenmeyen bir hata oluştu',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
      .format(amount)
      .replace('₺', '') + ' ₺';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-muted-foreground">Hakediş Bilgileri</p>
          <p className="font-medium mt-1">{payment.description}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <span className="text-muted-foreground">Proje:</span> {payment.projectName}
            </div>
            <div>
              <span className="text-muted-foreground">Hakediş No:</span> {payment.paymentNumber}
            </div>
            <div>
              <span className="text-muted-foreground">Talep Edilen:</span> {formatCurrency(payment.requestedAmount)}
            </div>
            <div>
              <span className="text-muted-foreground">Mevcut Durum:</span> {translateProgressPaymentStatus(payment.status)}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durum</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <SelectItem value="PARTIALLY_PAID">Kısmi Ödendi</SelectItem>
                  <SelectItem value="REJECTED">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(selectedStatus === 'APPROVED' || selectedStatus === 'PARTIALLY_PAID' || selectedStatus === 'PAID') && (
          <FormField
            control={form.control}
            name="approvedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Onaylanan Tutar (₺)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(selectedStatus === 'PARTIALLY_PAID' || selectedStatus === 'PAID') && (
          <FormField
            control={form.control}
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ödenen Tutar (₺)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(selectedStatus === 'PARTIALLY_PAID' || selectedStatus === 'PAID') && (
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
              <FormLabel>Notlar (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Durum değişikliği ile ilgili notlar..."
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-red-500">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </div>
      </form>
    </Form>
  );
}