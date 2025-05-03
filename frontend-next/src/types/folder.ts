import { Document } from './document';
import { User } from './user';

/**
 * Klasör modeli
 */
export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  
  // İlişkiler (opsiyonel)
  parent?: Folder | null;
  children?: Folder[];
  documents?: Document[];
  createdBy?: User;
  
  // Ekstra bilgiler
  _count?: {
    children: number;
    documents: number;
  };
}

/**
 * Yeni klasör oluşturma formu için tip
 */
export interface FolderFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
}

/**
 * Klasör ağaç görünümü için tip 
 */
export interface FolderTreeItem extends Folder {
  level: number;
  expanded?: boolean;
  children?: FolderTreeItem[];
}

/**
 * Klasör içeriği cevabı için tip
 */
export interface FolderContentsResponse {
  folders: Folder[];
  documents: Document[];
} 