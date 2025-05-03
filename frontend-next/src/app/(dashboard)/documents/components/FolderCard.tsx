import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderIcon, MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '../utils';
import { Folder } from '@/types/document';

interface FolderCardProps {
  folder: Folder;
  onOpen: (folder: Folder) => void;
  onRename?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
}

const FolderCard: FC<FolderCardProps> = ({ folder, onOpen, onRename, onDelete }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpen(folder)}
    >
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-muted rounded-md">
              <FolderIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium text-sm truncate max-w-[150px]" title={folder.name}>
                {folder.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {folder.documentCount || 0} dosya
              </p>
            </div>
          </div>

          {(onRename || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRename && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onRename(folder);
                  }}>
                    Yeniden Adlandır
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(folder);
                    }}
                    className="text-red-500 focus:text-red-500"
                  >
                    Sil
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-auto pt-2">
          <div className="text-xs text-muted-foreground">
            {folder.createdBy ? 
              `${folder.createdBy.name || 'Kullanıcı'} tarafından oluşturuldu` : 
              'Oluşturan bilinmiyor'
            }
            <br />
            {folder.createdAt && formatRelativeTime(folder.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FolderCard; 