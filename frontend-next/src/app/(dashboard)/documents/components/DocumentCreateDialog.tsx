import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentType, DocumentCategory } from '@/types/document';
import { Loader2, UploadIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { documentTypeConfig, documentCategoryConfig } from '../utils';

interface DocumentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
  folderId?: string;
  uploadedById: string;
}

export function DocumentCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  folderId,
  uploadedById
}: DocumentCreateDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);

  const resetForm = () => {
    setFileName('');
    setDescription('');
    setDocumentType('');
    setDocumentCategory('');
    setSelectedFile(null);
  };

  const handleClose = (open: boolean) => {
    if (!open && !isLoading) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      // Dosya adını otomatik doldur, ama değiştirilebilir olsun
      if (!fileName) {
        // Dosya uzantısı olmadan adını al
        const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        setFileName(nameWithoutExtension || file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Hata",
        description: "Lütfen bir dosya seçin.",
        variant: "destructive",
      });
      return;
    }

    if (!fileName.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen dosya adı girin.",
        variant: "destructive",
      });
      return;
    }

    if (!documentType) {
      toast({
        title: "Hata", 
        description: "Lütfen belge türü seçin.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileName', fileName);
      formData.append('description', description);
      formData.append('documentType', documentType);
      formData.append('documentCategory', documentCategory || '');
      formData.append('uploadedById', uploadedById);
      
      if (folderId) {
        formData.append('folderId', folderId);
      }

      await onSubmit(formData);
      resetForm();
    } catch (error) {
      console.error('Belge yükleme hatası:', error);
      toast({
        title: "Belge Yükleme Hatası",
        description: "Belge yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleDragLeave = () => {
    setIsFileDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      if (!fileName) {
        const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        setFileName(nameWithoutExtension || file.name);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Belge Yükle</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir belge yükleyin. Belge bilgilerini doldurun ve dosyayı seçin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div 
              className={cn(
                "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer",
                isFileDragging ? "border-primary bg-primary/5" : "border-border",
                selectedFile ? "bg-green-50 border-green-200" : "bg-background"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
              />
              
              {selectedFile ? (
                <div className="text-center">
                  <div className="font-medium text-green-600 mb-1">Dosya seçildi!</div>
                  <div className="text-sm text-gray-500 truncate max-w-full">{selectedFile.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Dosyayı Değiştir
                  </Button>
                </div>
              ) : (
                <>
                  <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium text-sm">Buraya tıklayın veya dosyayı sürükleyin</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, Excel, resim ve diğer belge türleri desteklenir
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fileName" className="text-right">
                  Belge Adı
                </Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Belge adını girin"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="documentType" className="text-right">
                  Belge Türü
                </Label>
                <Select 
                  value={documentType} 
                  onValueChange={(value) => setDocumentType(value as DocumentType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Belge türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(documentTypeConfig).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {config.icon && <config.icon className="h-4 w-4" />}
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="documentCategory" className="text-right">
                  Kategori
                </Label>
                <Select 
                  value={documentCategory} 
                  onValueChange={(value) => setDocumentCategory(value as DocumentCategory)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kategori seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(documentCategoryConfig).map(([category, config]) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            {config.icon && <config.icon className="h-4 w-4" />}
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description" className="text-right">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Belge hakkında ek bilgiler (opsiyonel)"
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                "Belgeyi Yükle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 