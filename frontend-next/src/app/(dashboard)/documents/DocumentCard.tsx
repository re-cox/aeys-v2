import React from 'react';
import { Document } from '@/types/document';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Pencil, Trash2 } from 'lucide-react';
import { formatFileSize, formatDate } from './utils';
import { getSafeTypeConfig, getSafeFileUrl, hasValidFileUrl, getDocumentIcon } from './safeDocumentHelpers';

interface DocumentCardProps {
  document: Document;
  onView?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

/**
 * Document card component for displaying document information
 */
export function DocumentCard({ document, onView, onDownload, onEdit, onDelete }: DocumentCardProps) {
  // Get safe configurations
  const typeConfig = getSafeTypeConfig(document);
  const TypeIcon = getDocumentIcon(document);
  
  // Get the safe file URL and check if valid
  const fileUrl = getSafeFileUrl(document);
  const hasFileUrl = hasValidFileUrl(document);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <TypeIcon className={`h-8 w-8 ${typeConfig.colorClass || 'text-gray-500'}`} />
          </div>
          
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-medium truncate" title={document.fileName}>
              {document.fileName}
            </h3>
            
            <div className="flex items-center flex-wrap gap-2">
              <Badge variant="outline">{typeConfig.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(document.size)}
              </span>
            </div>
            
            {document.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {document.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between p-4 pt-0 gap-2">
        <div className="text-xs text-muted-foreground">
          {formatDate(document.createdAt)}
        </div>
        
        <div className="flex gap-1">
          {hasFileUrl && onView && (
            <Button variant="ghost" size="icon" onClick={() => onView(document)} title="Görüntüle">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {hasFileUrl && onDownload && (
            <Button variant="ghost" size="icon" onClick={() => onDownload(document)} title="İndir">
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(document)} title="Düzenle">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(document)} 
              title="Sil"
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 