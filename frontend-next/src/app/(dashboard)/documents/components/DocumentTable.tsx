import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Document } from '@/types/document';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Eye, 
  MoreHorizontal, 
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  formatBytes, 
  formatDate, 
  formatDocumentType, 
  formatRelativeTime, 
  getFileUrl 
} from '../utils';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DocumentTableProps {
  documents: Document[];
  onDelete: (documentId: string) => Promise<void>;
}

type SortField = 'fileName' | 'uploadedAt' | 'size' | 'documentType';
type SortDirection = 'asc' | 'desc';

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'fileName':
        return multiplier * (a.fileName.localeCompare(b.fileName));
      case 'uploadedAt':
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'size':
        return multiplier * ((a.size || 0) - (b.size || 0));
      case 'documentType':
        return multiplier * ((a.documentType || '').localeCompare(b.documentType || ''));
      default:
        return 0;
    }
  });

  const handleDownload = async (document: Document) => {
    try {
      const url = getFileUrl(document.fileUrl, document.id);
      
      if (url === '#') {
        toast.error('Dosya bulunamadı');
        return;
      }

      // API üzerinden dosyayı indirme
      if (url.startsWith('/api')) {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Dosya indirme hatası: ${response.status}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = document.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        // Doğrudan URL'den indirme
        window.open(url, '_blank');
      }
      
      toast.success('Dosya indiriliyor');
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      toast.error('Dosya indirilirken bir hata oluştu');
    }
  };

  const handleView = (document: Document) => {
    const url = getFileUrl(document.fileUrl, document.id);
    if (url === '#') {
      toast.error('Dosya bulunamadı');
      return;
    }
    window.open(url, '_blank');
  };

  const handleDeleteClick = async (documentId: string) => {
    try {
      await onDelete(documentId);
      toast.success('Doküman başarıyla silindi');
    } catch (error) {
      console.error('Doküman silme hatası:', error);
      toast.error('Doküman silinirken bir hata oluştu');
    }
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableCaption>Toplam {documents.length} döküman</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <button 
                className="flex items-center" 
                onClick={() => handleSort('fileName')}
              >
                Dosya Adı
                {sortField === 'fileName' && (
                  sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead>
              <button 
                className="flex items-center" 
                onClick={() => handleSort('documentType')}
              >
                Tür
                {sortField === 'documentType' && (
                  sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button 
                className="flex items-center" 
                onClick={() => handleSort('size')}
              >
                Boyut
                {sortField === 'size' && (
                  sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button 
                className="flex items-center" 
                onClick={() => handleSort('uploadedAt')}
              >
                Yüklenme Tarihi
                {sortField === 'uploadedAt' && (
                  sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Henüz hiç döküman bulunmuyor
              </TableCell>
            </TableRow>
          ) : (
            sortedDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">{document.fileName}</TableCell>
                <TableCell>{formatDocumentType(document.documentType || 'OTHER')}</TableCell>
                <TableCell className="text-right">{formatBytes(document.size || 0)}</TableCell>
                <TableCell className="text-right" title={formatDate(document.createdAt)}>
                  {formatRelativeTime(document.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Döküman İşlemleri</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleView(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        İndir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Dökümanı silmek istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu işlem geri alınamaz. Bu döküman kalıcı olarak silinecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(document.id)}>
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 