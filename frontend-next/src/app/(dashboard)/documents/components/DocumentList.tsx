import { 
  FileIcon, 
  FileTextIcon, 
  FileImageIcon, 
  FileSpreadsheetIcon, 
  PresentationIcon, 
  FileText,
  Download,
  Trash,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Document } from '@/types/document';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDate, formatFileSize, formatSimpleDate } from '@/lib/utils';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onView: (document: Document) => void;
}

export default function DocumentList({ documents, onDelete, onDownload, onView }: DocumentListProps) {
  // Dosya türüne göre ikon seçme
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case 'image':
        return <FileImageIcon className="h-4 w-4 text-green-500" />;
      case 'spreadsheet':
        return <FileSpreadsheetIcon className="h-4 w-4 text-emerald-500" />;
      case 'presentation':
        return <PresentationIcon className="h-4 w-4 text-orange-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-gray-500" />;
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Ad</TableHead>
            <TableHead className="w-[100px]">Türü</TableHead>
            <TableHead className="w-[110px]">Kategori</TableHead>
            <TableHead className="w-[100px]">Boyut</TableHead>
            <TableHead className="w-[120px]">Oluşturulma</TableHead>
            <TableHead className="w-[100px] text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getFileIcon(document.type)}
                  <span className="truncate max-w-[250px]" title={document.name}>
                    {document.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>{document.type.charAt(0).toUpperCase() + document.type.slice(1)}</TableCell>
              <TableCell>
                {document.category ? (
                  <Badge 
                    variant="outline" 
                    className={getCategoryColor(document.category)}
                  >
                    {getCategoryName(document.category)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>{document.size ? formatFileSize(document.size) : '-'}</TableCell>
              <TableCell>{formatSimpleDate(document.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDownload(document.id, document.name)}
                    title="İndir"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 