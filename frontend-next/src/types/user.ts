/**
 * Kullanıcı tipini tanımlayan arayüz
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  permissions?: any;
}

/**
 * Kullanıcı rollerini tanımlayan enum
 */
export enum UserRole {
  ADMIN = 'ADMIN',          // Yönetici
  MANAGER = 'MANAGER',      // Müdür
  EMPLOYEE = 'EMPLOYEE',    // Çalışan
  CONTRACTOR = 'CONTRACTOR' // Yüklenici
}

/**
 * Kullanıcı izinlerini tanımlayan tip
 */
export interface UserPermissions {
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canDeleteDocuments: boolean;
  canCreateFolders: boolean;
  canEditFolders: boolean;
  canDeleteFolders: boolean;
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canExportData: boolean;
} 