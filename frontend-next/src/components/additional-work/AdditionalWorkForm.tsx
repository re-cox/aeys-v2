'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { 
  AdditionalWork, 
  AdditionalWorkFormData,
  createAdditionalWork,
  updateAdditionalWork,
  getAdditionalWorkById
} from '@/services/additionalWorkService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Define form schema
const formSchema = z.object({
  title: z.string().min(3, { message: 'Başlık en az 3 karakter olmalıdır.' }),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: 'Lütfen bir öncelik seçin.',
  }),
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    required_error: 'Lütfen bir durum seçin.',
  }),
  assignedToId: z.string({
    required_error: 'Lütfen bir çalışan seçin.',
  }),
  startDate: z.date({
    required_error: 'Lütfen başlangıç tarihi seçin.',
  }),
  endDate: z.date().optional(),
});

interface AdditionalWorkFormProps {
  additionalWorkId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdditionalWorkForm({
  additionalWorkId,
  onSuccess,
  onCancel,
}: AdditionalWorkFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!additionalWorkId);
  const [employees, setEmployees] = useState<{ id: string; name: string; surname: string; department?: { name: string } }[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      assignedToId: '',
      startDate: new Date(),
    },
  });

  // Load employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) throw new Error('Çalışanlar yüklenemedi');
        
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        toast({
          variant: 'destructive',
          title: 'Çalışanlar Yüklenemedi',
          description: 'Çalışan listesi alınırken bir hata oluştu.',
        });
      }
    };

    fetchEmployees();
  }, [toast]);

  // Load existing additional work if editing
  useEffect(() => {
    if (!additionalWorkId) return;

    const fetchAdditionalWork = async () => {
      setFetchLoading(true);
      try {
        const data = await getAdditionalWorkById(additionalWorkId);
        
        form.reset({
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          status: data.status,
          assignedToId: data.assignedTo?.id || '',
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        });
      } catch (error) {
        console.error('Failed to fetch additional work:', error);
        toast({
          variant: 'destructive',
          title: 'Ek İş Yüklenemedi',
          description: 'Ek iş bilgileri alınırken bir hata oluştu.',
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAdditionalWork();
  }, [additionalWorkId, form, toast]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Yetkilendirme Hatası',
        description: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData: AdditionalWorkFormData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        assignedToId: values.assignedToId,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
      };

      console.log('Form verileri:', formData);
      
      if (additionalWorkId) {
        await updateAdditionalWork(additionalWorkId, formData);
      } else {
        await createAdditionalWork(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save additional work:', error);
      if (error instanceof Error) {
        console.error('Hata detayı:', error.message);
        console.error('Hata stack:', error.stack);
      }
      toast({
        variant: 'destructive',
        title: 'Ek İş Kaydedilemedi',
        description: error instanceof Error ? error.message : 'Ek iş kaydedilirken bir hata oluştu.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input placeholder="Ek iş başlığı" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ek iş açıklaması" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Öncelik</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="MEDIUM">Orta</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="URGENT">Acil</SelectItem>
                  </SelectContent>
                </Select>
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
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ASSIGNED">Atandı</SelectItem>
                    <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                    <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                    <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignedToId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atanan Kişi</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Çalışan seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.name} ${employee.surname}`}
                      {employee.department && ` - ${employee.department.name}`}
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
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  locale={tr}
                />
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
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  locale={tr}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {additionalWorkId ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 