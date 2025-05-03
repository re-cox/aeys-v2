'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, File, X } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadDocument } from '@/services/documentService';

interface UploadFileDialogProps {
  folderId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}

export default function UploadFileDialog({ folderId, onSuccess, onCancel, open }: UploadFileDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('none');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Dosya adını al (eğer kullanıcı henüz bir isim girmediyse)
      if (!name) {
        // Dosya uzantısını kaldır
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setName(fileName);
      }
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Lütfen bir dosya seçin.');
      return;
    }
    
    if (!name.trim()) {
      setError('Doküman adı boş olamaz.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      
      if (description) {
        formData.append('description', description);
      }
      
      if (category && category !== 'none') {
        formData.append('category', category);
      }
      
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      await uploadDocument(formData);
      
      toast.success('Doküman başarıyla yüklendi');
      onSuccess();
    } catch (err: any) {
      console.error('Doküman yüklenirken hata:', err);
      setError(err.response?.data?.error || err.message || 'Doküman yüklenirken bir hata oluştu');
      toast.error('Doküman yüklenemedi');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dosya Yükle
            </DialogTitle>
            <DialogDescription>
              Klasöre doküman yükleyin. Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Dosya</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? file.name : 'Dosya seçin'}
                  </Button>
                </div>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Doküman Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Doküman adı"
                autoComplete="off"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Doküman açıklaması"
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Kategori (Opsiyonel)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kategorisiz</SelectItem>
                  <SelectItem value="contract">Sözleşme</SelectItem>
                  <SelectItem value="invoice">Fatura</SelectItem>
                  <SelectItem value="report">Rapor</SelectItem>
                  <SelectItem value="certificate">Sertifika</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 mt-2">{error}</div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !file || !name.trim()}>
              {loading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 