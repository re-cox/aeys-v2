// Yıllık İzin Tip Tanımları
import { Employee } from "./employee";

// İzin durumları
export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

// Temel Yıllık İzin Modeli
export interface AnnualLeave {
  id: string;
  employeeId: string;
  employee?: Employee;
  startDate: Date | string;
  endDate: Date | string;
  status: LeaveStatus;
  notes?: string;
  daysTaken: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  approvedAt?: Date | string;
  rejectedAt?: Date | string;
  requestedAt?: Date | string;
  approvedBy?: string;
  rejectedBy?: string;
}

// Yeni İzin Oluşturma İçin
export interface NewAnnualLeave {
  employeeId: string;
  startDate: Date | string;
  endDate: Date | string;
  status: LeaveStatus;
  notes?: string;
  daysTaken: number;
}

// İzin Güncelleme İçin
export interface UpdateAnnualLeave {
  id: string;
  employeeId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: LeaveStatus;
  notes?: string;
  daysTaken?: number;
  approvedAt?: Date | string;
  rejectedAt?: Date | string;
  approvedBy?: string;
  rejectedBy?: string;
}

// İzin İstatistikleri İçin
export interface LeaveStats {
  employeeId: string;
  employeeName?: string;
  departmentName?: string;
  totalDaysUsed: number;
  pendingDays: number;
  remainingDays: number;
  totalAnnualAllowance?: number;
} 