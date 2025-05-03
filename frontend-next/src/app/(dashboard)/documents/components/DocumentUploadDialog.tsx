'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileUp, Upload, X, File, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DocumentType, DocumentCategory, type Document, type Folder, type UploadProgress } from '@/types/document';
import { uploadFile } from '@/services/uploadService';
import { createDocument } from '@/services/documentService';

// Doküman form şeması
const formSchema = z.object({
  name: z.string().min(2, { message: 'Doküman adı en az 2 karakter olmalıdır' }).max(100),
  description: z.string().max(500, { message: 'Açıklama en fazla 500 karakter olabilir' }).optional(),
  type: z.nativeEnum(DocumentType),
  category: z.nativeEnum(DocumentCategory),
  folderId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder?: Folder | null;
  onSuccess?: () => void;
}

export default function DocumentUploadDialog({
  isOpen,
  onClose,
  currentFolder = null,
  onSuccess
}: DocumentUploadDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  // Form tanımı
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: DocumentType.OTHER,
      category: DocumentCategory.GENERAL,
      folderId: currentFolder?.id || null,
    }
  });

  // Dosya bırakma işlevselliği
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // Otomatik olarak dosya adını form alanına yerleştir
      form.setValue('name', file.name.split('.')[0]);
      
      setUploadProgress({
        file,
        progress: 0,
        status: 'idle',
      });
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });

  // Seçilen dosyayı kaldır
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(null);
  };

  // Form gönderimi
  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Dosyayı yükle
      setUploadProgress({
        file: selectedFile,
        progress: 10,
        status: 'uploading',
      });
      
      const uploadResult = await uploadFile(selectedFile, (progress) => {
        setUploadProgress(prev => prev ? {
          ...prev,
          progress,
        } : null);
      });
      
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 80,
        status: 'success',
        result: uploadResult,
      } : null);
      
      // Döküman oluştur
      const documentData = {
        name: values.name,
        description: values.description || '',
        type: values.type,
        category: values.category,
        folderId: values.folderId,
        fileUrl: uploadResult.fileUrl,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        createdById: user.id,
      };
      
      await createDocument(documentData);
      
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 100,
      } : null);
      
      toast.success('Doküman başarıyla yüklendi');
      form.reset();
      setSelectedFile(null);
      setUploadProgress(null);
      onClose();
      
      // Başarı durumunda callback fonksiyonu çağır
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Doküman yüklenirken hata oluştu:', error);
      toast.error('Doküman yüklenemedi. Lütfen tekrar deneyin.');
      
      setUploadProgress(prev => prev ? {
        ...prev,
        status: 'error',
        error: 'Dosya yüklenirken bir hata oluştu.',
      } : null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Doküman Yükle
          </DialogTitle>
          <DialogDescription>
            {currentFolder 
              ? `"${currentFolder.name}" klasörüne doküman yükleyin.`
              : 'Sisteme yeni bir doküman yükleyin.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dosya Yükleme Alanı */}
            <div className="mb-4">
              {selectedFile ? (
                <div className="border rounded-md p-4 relative">
                  <div className="flex items-center gap-2">
                    <File className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={removeSelectedFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {uploadProgress && uploadProgress.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadProgress.progress} className="h-2" />
                      <p className="text-xs text-center mt-1">
                        Yükleniyor... {uploadProgress.progress.toFixed(0)}%
                      </p>
                    </div>
                  )}
                  
                  {uploadProgress && uploadProgress.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadProgress.error}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm font-medium">
                    Dosyaları buraya sürükleyin veya tıklayarak seçin
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    En fazla 50MB boyutunda bir dosya yükleyebilirsiniz
                  </p>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doküman Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Doküman adını girin" {...field} />
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
                      placeholder="Doküman hakkında açıklama girin (isteğe bağlı)" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doküman Türü</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(DocumentType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === DocumentType.CONTRACT && 'Sözleşme'}
                            {type === DocumentType.REPORT && 'Rapor'}
                            {type === DocumentType.INVOICE && 'Fatura'}
                            {type === DocumentType.OFFICIAL && 'Resmi Belge'}
                            {type === DocumentType.CERTIFICATE && 'Sertifika'}
                            {type === DocumentType.OTHER && 'Diğer'}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(DocumentCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === DocumentCategory.HR && 'İnsan Kaynakları'}
                            {category === DocumentCategory.FINANCE && 'Finans'}
                            {category === DocumentCategory.LEGAL && 'Hukuk'}
                            {category === DocumentCategory.OPERATIONS && 'Operasyon'}
                            {category === DocumentCategory.MARKETING && 'Pazarlama'}
                            {category === DocumentCategory.SALES && 'Satış'}
                            {category === DocumentCategory.TECHNICAL && 'Teknik'}
                            {category === DocumentCategory.OTHER && 'Diğer'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedFile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : 'Doküman Yükle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 