import { Asset, Assignment, Employee, AssetStatus, AssetCategory } from '@prisma/client';

// Demirbaş oluşturma verisi
export interface NewAssetData {
  name: string;
  assetTag: string; // Benzersiz demirbaş etiketi
  category: AssetCategory;
  description?: string;
  serialNumber?: string;
  status?: AssetStatus;
  purchaseDate?: string; // ISO Date String or Date object
  purchaseCost?: number | string; // Sayı veya string olarak alınabilir
  warrantyExpiry?: string; // ISO Date String or Date object
  location?: string;
  notes?: string;
}

// Demirbaş güncelleme verisi
export interface UpdateAssetData {
  id: string;
  name?: string;
  assetTag?: string; 
  category?: AssetCategory;
  description?: string;
  serialNumber?: string;
  status?: AssetStatus;
  purchaseDate?: string | null;
  purchaseCost?: number | string | null;
  warrantyExpiry?: string | null;
  location?: string | null;
  notes?: string | null;
}

// Demirbaş sorgulama parametreleri
export interface AssetQueryParams {
  status?: AssetStatus;
  category?: AssetCategory;
  searchQuery?: string;
}

// Zimmet kayıtlarını içeren demirbaş tipi (API'den döndüğünde)
export type AssetWithAssignments = Asset & {
  assignments: (Assignment & { employee?: Pick<Employee, 'id' | 'name' | 'surname'> })[];
};

// ---- Zimmet Tipleri ----

// Yeni zimmet oluşturma verisi
export interface NewAssignmentData {
  assetId: string;
  employeeId: string;
  assignmentDate: string; // ISO Date String or Date object
  expectedReturnDate?: string | null; // ISO Date String or Date object
  notes?: string;
}

// Zimmet güncelleme verisi (Özellikle iade ve notlar için)
export interface UpdateAssignmentData {
  returnDate?: string | null; // ISO Date String or Date object
  notes?: string | null;
}

// Zimmet sorgulama parametreleri
export interface AssignmentQueryParams {
  employeeId?: string;
  assetId?: string;
  status?: 'active' | 'returned'; // Aktif veya İade Edilmiş
}

// Demirbaş ve çalışan bilgilerini içeren zimmet tipi (API'den döndüğünde)
export type AssignmentWithIncludes = Assignment & {
  asset?: Pick<Asset, 'id' | 'name' | 'assetTag'>;
  employee?: Pick<Employee, 'id' | 'name' | 'surname'>;
}; 