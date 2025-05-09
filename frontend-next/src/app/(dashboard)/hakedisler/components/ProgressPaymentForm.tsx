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
import { CalendarIcon, X, FileUp, UploadCloud, File as FileIcon } from 'lucide-react';
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
import { ProgressPaymentInput } from '@/types/progressPayment';

interface ProgressPaymentFormProps {
  projects: { id: string; name: string }[];
  selectedProjectId?: string;
  onSubmit: (data: ProgressPaymentInput | FormData) => Promise<boolean>;
  onCancel: () => void;
}

// Form şeması
const formSchema = z.object({
  projectId: z.string({
    required_error: 'Lütfen bir proje seçin',
  }),
  hakedisNo: z.string({
    required_error: 'Hakediş numarası gereklidir',
  }).min(3, {
    message: 'Hakediş numarası en az 3 karakter olmalıdır',
  }),
  description: z.string({
    required_error: 'Açıklama gereklidir',
  }).min(3, {
    message: 'Açıklama en az 3 karakter olmalıdır',
  }),
  requestedAmount: z.coerce.number({
    required_error: 'Tutar gereklidir',
    invalid_type_error: 'Tutar sayı olmalıdır',
  }).positive({
    message: 'Tutar pozitif olmalıdır',
  }),
  dueDate: z.date().optional().nullable(),
  notes: z.string().optional(),
  files: z.any().optional() // Dosya alanı için şema
});

export function ProgressPaymentForm({ projects, selectedProjectId, onSubmit, onCancel }: ProgressPaymentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: selectedProjectId || '',
      hakedisNo: `HK-${new Date().getFullYear()}-`, // Varsayılan değer olarak yıl ekleyelim
      description: '',
      requestedAmount: 0,
      dueDate: null,
      notes: '',
      files: null
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // FormData oluştur ve dosyaları ekle
      const formData = new FormData();
      
      // Form alanlarını ekle
      formData.append('projectId', values.projectId);
      formData.append('hakedisNo', values.hakedisNo);
      formData.append('description', values.description);
      formData.append('requestedAmount', values.requestedAmount.toString());
      
      if (values.dueDate) {
        formData.append('dueDate', values.dueDate.toISOString());
      }
      
      if (values.notes) {
        formData.append('notes', values.notes);
      }
      
      // Dosyaları ekle
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Veri gönderilmeden önce debug et
      console.log('Gönderilecek form verileri:', {
        projectId: values.projectId,
        hakedisNo: values.hakedisNo,
        description: values.description,
        requestedAmount: values.requestedAmount,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        notes: values.notes || undefined,
        dosyaSayisi: selectedFiles.length
      });
      
      // API'ye gönder
      const success = await onSubmit(formData as unknown as ProgressPaymentInput);
      
      if (!success) {
        form.setError('root', {
          message: 'Hakediş kaydedilirken bir hata oluştu',
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" encType="multipart/form-data">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proje</FormLabel>
              <Select
                disabled={!!selectedProjectId}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hakedisNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hakediş Numarası</FormLabel>
              <FormControl>
                <Input placeholder="Örn: HK-2024-001" {...field} />
              </FormControl>
              <FormDescription>
                Benzersiz bir hakediş numarası girin (örn: HK-2024-001)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama/Dönem</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Mayıs 2024 Hakedişi" {...field} />
              </FormControl>
              <FormDescription>
                Hakediş dönemi veya açıklaması
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestedAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Talep Edilen Tutar (₺)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Vade Tarihi (Opsiyonel)</FormLabel>
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
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Hakediş ile ilgili ek notlar..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Dosya Yükleme Alanı */}
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosyalar (Opsiyonel)</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <UploadCloud className="h-8 w-8 text-gray-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dosya yüklemek için tıklayın veya sürükleyin
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, Word, Excel ve resim dosyaları
                    </span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
              
              {/* Seçilen Dosyaların Listesi */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium">Seçilen Dosyalar:</h4>
                  <ul className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li 
                        key={`${file.name}-${index}`} 
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm"
                      >
                        <div className="flex items-center">
                          <FileIcon className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Form>
  );
}