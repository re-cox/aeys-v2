import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Eye, 
  FileIcon, 
  FilePdfIcon, 
  FileTextIcon, 
  FileTypeIcon, 
  ImageIcon, 
  MoreHorizontalIcon, 
  Trash2Icon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatBytes, formatRelativeTime } from '../utils';
import { Document, DocumentType } from '@/types/document';
import { toast } from 'sonner';

interface FileCardProps {
  document: Document;
  onDelete?: (document: Document) => void;
  onView?: (document: Document) => void;
}

const getFileIcon = (type: DocumentType | string) => {
  switch(type) {
    case DocumentType.PDF:
      return <FilePdfIcon className="h-5 w-5 text-red-500" />;
    case DocumentType.IMAGE:
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    case DocumentType.DOCUMENT:
      return <FileTextIcon className="h-5 w-5 text-blue-500" />;
    case DocumentType.SPREADSHEET:
      return <FileTypeIcon className="h-5 w-5 text-green-500" />;
    default:
      return <FileIcon className="h-5 w-5 text-gray-500" />;
  }
};

const FileCard: FC<FileCardProps> = ({ document, onDelete, onView }) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Ensure fileUrl exists
      if (!document.fileUrl) {
        toast.error('Dosya bağlantısı bulunamadı');
        return;
      }

      // Get file URL based on storage type
      const fileUrl = document.fileUrl.startsWith('http') 
        ? document.fileUrl 
        : `/api/documents/${document.id}/download`;

      // For direct download of server files
      if (!document.fileUrl.startsWith('http')) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Dosya indirilemedi');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.fileName || 'indir';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For external files, open in new tab
        window.open(fileUrl, '_blank');
      }
      
      toast.success('Dosya indiriliyor');
    } catch (error) {
      console.error("Dosya indirme hatası:", error);
      toast.error('Dosya indirilirken bir hata oluştu');
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onView && onView(document)}>
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-muted rounded-md">
              {getFileIcon(document.type || 'DEFAULT')}
            </div>
            <div>
              <h3 className="font-medium text-sm truncate max-w-[150px]" title={document.fileName}>
                {document.fileName || 'İsimsiz dosya'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {document.size ? formatBytes(document.size) : 'Boyut bilinmiyor'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                if (onView) onView(document);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(document);
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto pt-2">
          <div className="text-xs text-muted-foreground">
            {document.uploadedBy ? 
              `${document.uploadedBy.name || 'Kullanıcı'} tarafından yüklendi` : 
              'Yükleyen bilinmiyor'
            }
            <br />
            {document.uploadedAt && formatRelativeTime(document.uploadedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileCard; 