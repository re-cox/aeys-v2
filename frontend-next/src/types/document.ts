import { User } from './user';

// Dokuman tipleri
export enum DocumentType {
  CONTRACT = 'CONTRACT',   // Sözleşme
  REPORT = 'REPORT',       // Rapor
  INVOICE = 'INVOICE',     // Fatura
  OFFICIAL = 'OFFICIAL',   // Resmi belge
  PERMIT = 'PERMIT',       // İzin Belgesi
  DRAWING = 'DRAWING',     // Çizim
  TECHNICAL = 'TECHNICAL', // Teknik Belge
  LEGAL = 'LEGAL',         // Yasal Belge
  OTHER = 'OTHER',         // Diğer
  FILE = 'FILE',           // Dosya
  CERTIFICATE = 'CERTIFICATE' // Sertifika
}

// Folder interface
export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // İlişkiler
  parent?: Folder | null;
  children?: Folder[];
  documents?: Document[];
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
  _count?: {
    documents?: number;
    children?: number;
  };
}

// Dokuman kategorileri
export enum DocumentCategory {
  FINANCE = 'FINANCE',       // Finans
  HR = 'HR',                 // İnsan Kaynakları
  LEGAL = 'LEGAL',           // Hukuk
  OPERATIONS = 'OPERATIONS', // Operasyon
  MARKETING = 'MARKETING',   // Pazarlama
  SALES = 'SALES',           // Satış
  IT = 'IT',                 // Bilgi Teknolojileri
  GENERAL = 'GENERAL',       // Genel
  PROJECT = 'PROJECT',       // Proje
  CUSTOMER = 'CUSTOMER',     // Müşteri
  EMPLOYEE = 'EMPLOYEE',     // Personel
  FINANCIAL = 'FINANCIAL',   // Finansal
  TECHNICAL = 'TECHNICAL',   // Teknik
  OTHER = 'OTHER'            // Diğer
}

/**
 * Doküman modeli
 */
export interface Document {
  id: string;
  name: string;
  description?: string;
  fileUrl?: string;
  type: string;
  size: number;
  mimeType?: string;
  content?: string;
  category?: string;
  folderId?: string | null;
  projectId?: string | null;
  customerId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  
  // İlişkiler (opsiyonel)
  createdBy?: User;
  folder?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Yeni doküman oluşturma formu için tip
 */
export interface DocumentFormData {
  name: string;
  description?: string;
  fileUrl?: string;
  type?: string;
  size?: number;
  mimeType?: string;
  content?: string;
  category?: string;
  folderId?: string | null;
  projectId?: string | null;
  customerId?: string | null;
}

export interface FolderFormData {
  name: string;
  description?: string;
  parentId?: string | null;
  createdById: string;
  color?: string;
  icon?: string;
}

// Type for the document type configuration displayed in the UI
export interface DocumentTypeConfig {
  label: string;
  icon: React.ComponentType<any>;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}

// Type for the document category configuration displayed in the UI
export interface DocumentCategoryConfig {
  label: string;
  icon: React.ComponentType<any>;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}

// Document filter options
export interface DocumentFilterOptions {
  search?: string;
  type?: string | null;
  category?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  folderId?: string | null;
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortDir?: 'asc' | 'desc';
}

// Upload progress state
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: {
    fileUrl: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
}

// Document view mode
export type DocumentViewMode = 'grid' | 'list' | 'details';

// Dosya yükleme yanıtı için tip
export interface UploadResponse {
  fileUrl: string;
  fileName: string;
  size: number;
  mimeType: string;
} 