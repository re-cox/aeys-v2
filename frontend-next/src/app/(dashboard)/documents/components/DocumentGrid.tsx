import { FileIcon, FileTextIcon, FileImageIcon, FileSpreadsheetIcon, PresentationIcon, FileText } from 'lucide-react';
import { Document } from '@/types/document';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Download, Trash, Eye } from 'lucide-react';
import { formatDate, formatFileSize, formatSimpleDate } from '@/lib/utils';

interface DocumentGridProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onView: (document: Document) => void;
}

export default function DocumentGrid({ documents, onDelete, onDownload, onView }: DocumentGridProps) {
  // Dosya türüne göre ikon seçme
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileTextIcon className="h-12 w-12 text-blue-500" />;
      case 'image':
        return <FileImageIcon className="h-12 w-12 text-green-500" />;
      case 'spreadsheet':
        return <FileSpreadsheetIcon className="h-12 w-12 text-emerald-500" />;
      case 'presentation':
        return <PresentationIcon className="h-12 w-12 text-orange-500" />;
      case 'pdf':
        return <FileText className="h-12 w-12 text-red-500" />;
      default:
        return <FileIcon className="h-12 w-12 text-gray-500" />;
    }
  };
  
  // Kategorilere göre rozet rengi
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'invoice':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'report':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'certificate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Kategori adını Türkçe'ye çevirme
  const getCategoryName = (category?: string) => {
    switch (category) {
      case 'contract':
        return 'Sözleşme';
      case 'invoice':
        return 'Fatura';
      case 'report':
        return 'Rapor';
      case 'certificate':
        return 'Sertifika';
      case 'other':
        return 'Diğer';
      default:
        return 'Genel';
    }
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {documents.map((document) => (
        <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="pt-4 px-4 pb-2 flex flex-col items-center text-center">
            <div className="mb-3">
              {document.fileUrl && document.type === 'image' ? (
                <div className="h-24 w-24 relative overflow-hidden rounded-lg bg-muted">
                  <img 
                    src={document.fileUrl} 
                    alt={document.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Resim yüklenemezse sadece gizleyelim ve default ikonu gösterelim
                      e.currentTarget.style.display = 'none';
                      // HTML içeriğini doğrudan değiştirmek yerine React state'i kullanmak daha doğru olacaktır
                      // Basit bir çözüm olarak şimdilik sadece resmi gizliyoruz
                    }}
                  />
                  {/* Resim yüklenemediğinde gösterilecek yedek ikon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0" style={{ opacity: 0 }}>
                    {getFileIcon(document.type)}
                  </div>
                </div>
              ) : (
                getFileIcon(document.type)
              )}
            </div>
            
            <h3 className="font-medium text-sm truncate max-w-full mb-1" title={document.name}>
              {document.name}
            </h3>
            
            {document.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2" title={document.description}>
                {document.description}
              </p>
            )}
            
            {document.category && (
              <Badge 
                variant="outline" 
                className={`mb-2 ${getCategoryColor(document.category)}`}
              >
                {getCategoryName(document.category)}
              </Badge>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1 mt-auto">
              {document.size > 0 && (
                <div>{formatFileSize(document.size)}</div>
              )}
              <div>
                {formatSimpleDate(document.createdAt)}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2 pb-3 px-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onDownload(document.id, document.name)}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              İndir
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onView(document)}
                  className={
                    (document.type === 'pdf' || document.type === 'image' || 
                     document.mimeType?.includes('pdf') || 
                     (document.mimeType && ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'].some(type => document.mimeType?.includes(type))))
                    ? '' 
                    : 'text-muted-foreground pointer-events-none opacity-50'
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Görüntüle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(document.id)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 