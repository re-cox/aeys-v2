import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Document, DocumentType } from "@/types/document";
import { 
  DownloadIcon, 
  EditIcon, 
  EyeIcon, 
  FileIcon, 
  MoreVerticalIcon, 
  Trash2Icon 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFileSize, formatDate, documentTypeConfig } from "../utils";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DocumentCard({ 
  document, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: DocumentCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  // Dosya türüne göre simge seçimi
  const DocTypeIcon = document.type && documentTypeConfig[document.type as DocumentType]?.icon 
    ? documentTypeConfig[document.type as DocumentType].icon 
    : FileIcon;
  
  // Dosya türüne göre renk seçimi
  const typeColorClasses = document.type && documentTypeConfig[document.type as DocumentType]?.colorClass
    ? documentTypeConfig[document.type as DocumentType].colorClass
    : "text-gray-500 bg-gray-100";
  
  // Dosya URL'sini kontrol et - default URL ver dosya yoksa
  const fileUrl = document.fileUrl && document.fileUrl.trim() !== "" 
    ? document.fileUrl 
    : "#";
  
  // Dosya tipine göre önizleme göster/gösterme
  const canPreview = document.mimeType && (
    document.mimeType.startsWith("image/") || 
    document.mimeType === "application/pdf"
  );

  // Kullanıcı adı - güvenlik için kontrol
  const username = document.uploadedBy 
    ? `${document.uploadedBy.name || ''}` 
    : "Kullanıcı";
  
  // Kullanıcının baş harfleri - eğer profil resmi yoksa
  const userInitials = username
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        isSelected ? "ring-2 ring-primary ring-offset-2" : "",
        isHovering ? "shadow-md" : "shadow-sm"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute right-2 top-2 z-10">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onSelect()}
          className="h-5 w-5 bg-white"
        />
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-md", typeColorClasses)}>
            <DocTypeIcon className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium truncate">
            {document.fileName}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {canPreview && document.fileUrl && document.fileUrl.startsWith('http') ? (
          <div className="relative aspect-[3/2] overflow-hidden rounded-md mb-2 bg-gray-100">
            {document.mimeType?.startsWith("image/") ? (
              <img
                src={document.fileUrl}
                alt={document.fileName}
                className="h-full w-full object-cover transition-all"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FileIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[3/2] overflow-hidden rounded-md mb-2 bg-gray-100 flex items-center justify-center">
            <FileIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">Boyut:</span>
            <span className="ml-1">{formatFileSize(document.size || 0)}</span>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">Tür:</span>
            <span className="ml-1">
              {document.type && documentTypeConfig[document.type as DocumentType] 
                ? documentTypeConfig[document.type as DocumentType].label 
                : 'Belirtilmemiş'}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">Tarih:</span>
            <span className="ml-1">{formatDate(document.createdAt || new Date())}</span>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">Yükleyen:</span>
            <div className="flex items-center ml-1">
              <Avatar className="h-4 w-4 mr-1">
                <AvatarImage 
                  src={document.uploadedBy?.avatarUrl || ''} 
                  alt={username} 
                />
                <AvatarFallback className="text-[8px]">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">{username}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex gap-1">
          {canPreview && (
            <Button size="sm" variant="ghost" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <EyeIcon className="h-4 w-4" />
              </a>
            </Button>
          )}
          
          <Button size="sm" variant="ghost" asChild>
            <a 
              href={fileUrl} 
              download={document.fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <EditIcon className="h-4 w-4 mr-2" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={onDelete}
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
} 