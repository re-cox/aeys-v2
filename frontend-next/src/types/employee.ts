import { Department } from "./department";
import { Role } from "./role";
import { User } from "./user";

// Personel Tip Tanımları
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploadDate?: string;
  employeeId?: string;
}

export interface Employee {
  id: string;
  userId?: string | null;
  user?: User | null;
  position?: string;
  departmentId?: string;
  department?: Department;
  address?: string;
  iban?: string;
  isActive: boolean;
  phoneNumber?: string;
  profilePictureUrl?: string | null;
  tcKimlikNo?: string | null;
  hireDate?: Date | string;
  annualLeaveAllowance?: number;
  birthDate?: Date | string;
  bloodType?: string;
  drivingLicense?: string;
  education?: string;
  militaryStatus?: string;
  salaryVisibleTo?: string[];
  salary?: number;
  emergencyContacts?: EmergencyContact;
  documents?: EmployeeDocument[];
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
}

export interface EmployeeWithUser extends Employee {
  user: User;
}

export type EmployeeWithRelations = EmployeeWithUser;

export interface NewEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleId?: string;
  departmentId: string;
  position: string;
  tcKimlikNo: string;
  phoneNumber?: string;
  hireDate?: string | null;
  birthDate?: string | null;
  address?: string;
  iban?: string;
  bloodType?: string | null;
  drivingLicense?: string | null;
  education?: string;
  militaryStatus?: string | null;
  salary?: number;
  annualLeaveAllowance?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profilePictureUrl?: string | null;
}

export interface DocumentUploadResponse {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadDate: string;
}

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  departmentId?: string;
  position?: string;
  tcKimlikNo?: string;
  phoneNumber?: string;
  hireDate?: string | null;
  birthDate?: string | null;
  address?: string;
  iban?: string;
  isActive?: boolean;
  bloodType?: string | null;
  drivingLicense?: string | null;
  education?: string;
  militaryStatus?: string | null;
  salary?: number;
  annualLeaveAllowance?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profilePictureUrl?: string | null;
} 