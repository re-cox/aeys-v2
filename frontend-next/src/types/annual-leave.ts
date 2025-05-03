// import { LeaveStatus } from '@prisma/client'; // Prisma enum importu kaldırıldı

// Frontend için LeaveStatus enum tanımı
export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Frontend'de kullanılacak AnnualLeave tipi
export interface AnnualLeave {
  id: string;         // Zorunlu ID
  userId: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  status: LeaveStatus; // Manuel tanımlanan enum kullanılıyor
  reason?: string | null;
  requestedAt: string;  // ISO 8601 string formatında
  approvedById?: string | null;
  approvedAt?: string | null; // ISO 8601 string formatında

  // İlişkili veriler (Backend'den include ile geliyorsa)
  user?: {
    id: string;
    name?: string | null;
    surname?: string | null;
    department?: {
      name?: string | null;
    } | null;
  };
  approvedBy?: {
    id: string;
    name?: string | null;
    surname?: string | null;
  };
} 