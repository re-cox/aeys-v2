'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { 
  File, 
  Download, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  FileCog, 
  FileCheck, 
  Clock, 
  User, 
  Tag,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Document, DocumentType, DocumentCategory } from '@/types/document';
import { downloadDocument } from '@/services/documentService';
import { formatFileSize, formatDate, getFileUrl, formatDocumentType, formatDocumentCategory } from '../utils';

interface DocumentViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export default function DocumentViewDialog({
  isOpen,
  onClose,
  document
}: DocumentViewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('preview');
  
  // Döküman tipine göre icon belirle
  const getDocumentIcon = () => {
    switch (document.type as DocumentType) {
      case DocumentType.CONTRACT:
        return <FileSpreadsheet className="h-6 w-6 text-blue-500" />;
      case DocumentType.REPORT:
        return <FileText className="h-6 w-6 text-green-500" />;
      case DocumentType.INVOICE:
        return <FileCog className="h-6 w-6 text-yellow-500" />;
      case DocumentType.OFFICIAL:
        return <FileCheck className="h-6 w-6 text-red-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // İçerik tipine göre uygun önizleme
  const renderPreview = () => {
    if (!document.fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-gray-50">
          <File className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">Dosya içeriği bulunamadı</p>
        </div>
      );
    }
    
    const fileUrl = getFileUrl(document.fileUrl);
    const mimeType = document.mimeType || '';
    
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl}
            alt={document.name}
            className="max-h-[500px] object-contain rounded-md"
          />
        </div>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <div className="h-[500px] border rounded-md">
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="w-full h-full"
            title={document.name}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-gray-50">
          {getDocumentIcon()}
          <p className="text-gray-700 mt-4 font-medium">{document.name}</p>
          <p className="text-gray-500 text-sm mt-2">
            Bu dosya türü için önizleme kullanılamıyor
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
        </div>
      );
    }
  };
  
  // Döküman indirme işlemi
  const handleDownload = async () => {
    try {
      if (!document.name || !document.fileUrl) {
        toast.error('Dosya bilgileri eksik');
        return;
      }
      
      setIsLoading(true);
      toast.info('Dosya indiriliyor...');
      
      await downloadDocument(document.id, document.name);
      
      toast.success('Dosya başarıyla indirildi');
    } catch (error) {
      console.error('Dosya indirilirken hata oluştu:', error);
      toast.error('Dosya indirilemedi');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dış bağlantıda görüntüleme
  const handleOpenExternal = () => {
    if (document.fileUrl) {
      window.open(getFileUrl(document.fileUrl), '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDocumentIcon()}
            {document.name}
          </DialogTitle>
          <DialogDescription>
            {document.description || 'Döküman önizlemesi'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="preview">Önizleme</TabsTrigger>
            <TabsTrigger value="details">Detaylar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Döküman Adı</h3>
                  <p className="mt-1">{document.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
                  <Badge variant="outline" className="mt-1">
                    {formatDocumentCategory(document.category as DocumentCategory)}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tür</h3>
                  <Badge variant="outline" className="mt-1">
                    {formatDocumentType(document.type as DocumentType)}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dosya Boyutu</h3>
                  <p className="mt-1">{document.size ? formatFileSize(document.size) : 'Bilinmiyor'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</h3>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <p>{formatDate(document.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Son Güncelleme</h3>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <p>{formatDate(document.updatedAt)}</p>
                  </div>
                </div>
                
                {document.createdBy && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Yükleyen</h3>
                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <p>{document.createdBy.name}</p>
                    </div>
                  </div>
                )}
                
                {document.folder && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Klasör</h3>
                    <div className="flex items-center mt-1">
                      <Tag className="h-4 w-4 mr-1 text-gray-500" />
                      <p>{document.folder.name}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {document.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Açıklama</h3>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{document.description}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 flex-row sm:justify-between">
          <div>
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
          <div className="flex gap-2">
            {document.fileUrl && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Yeni Sekmede Aç
                </Button>
                <Button 
                  onClick={handleDownload}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      İndiriliyor...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 