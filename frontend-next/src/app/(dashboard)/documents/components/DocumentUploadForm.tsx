import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentType } from '@/types/document';
import { formatDocumentType } from '../utils';
import { useAuth } from "@/context/AuthContext";

// Form şeması
const formSchema = z.object({
  file: z.any().refine((file) => file, {
    message: 'Dosya seçilmedi',
  }),
  documentType: z.string({
    required_error: 'Lütfen bir döküman türü seçin',
  }),
  originalName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentUploadFormProps {
  onUploadComplete: () => void;
  uploadDocument: (file: File, documentType: string) => Promise<void>;
}

export function DocumentUploadForm({
  onUploadComplete,
  uploadDocument,
}: DocumentUploadFormProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
      documentType: 'OFFICIAL',
      originalName: '',
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
    maxSize: 10485760, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        form.setValue('file', file);
        form.setValue('originalName', file.name);
      }
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Oturum bilgisi bulunamadı');
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(values.file, values.documentType);
      toast.success('Döküman başarıyla yüklendi');
      form.reset();
      setOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Döküman yükleme hatası:', error);
      toast.error('Döküman yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Döküman Yükle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Döküman Yükle</DialogTitle>
          <DialogDescription>
            Yüklemek istediğiniz dökümanı seçin ve gerekli bilgileri doldurun.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosya</FormLabel>
                  <FormControl>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {field.value ? (
                        <p className="text-sm text-green-600">
                          Seçilen dosya: {form.getValues('originalName')}
                        </p>
                      ) : isDragActive ? (
                        <p className="text-sm">Dosyayı buraya bırakın</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm">
                            Dosyayı buraya sürükleyin veya seçmek için tıklayın
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Maks. 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Döküman Türü</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Döküman türünü seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DocumentType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatDocumentType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Yükleniyor...' : 'Yükle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 