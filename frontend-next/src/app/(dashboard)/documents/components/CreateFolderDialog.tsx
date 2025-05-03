'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Folder } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createFolder } from '@/services/folderService';

interface CreateFolderDialogProps {
  parentId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}

export default function CreateFolderDialog({ parentId, onSuccess, onCancel, open }: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Klasör adı boş olamaz.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await createFolder({
        name,
        description,
        parentId: parentId === null ? 'root' : parentId
      });
      
      toast.success('Klasör başarıyla oluşturuldu');
      onSuccess();
    } catch (err: any) {
      console.error('Klasör oluşturulurken hata:', err);
      setError(err.response?.data?.error || err.message || 'Klasör oluşturulurken bir hata oluştu');
      toast.error('Klasör oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Yeni Klasör Oluştur
            </DialogTitle>
            <DialogDescription>
              Dokümanlarınızı kategorize etmek için yeni bir klasör oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Klasör Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Klasör adı"
                autoComplete="off"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Klasör açıklaması"
                rows={3}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 mt-2">{error}</div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 