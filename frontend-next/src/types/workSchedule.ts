import { Department } from './department';
import { Employee } from './employee';

// İş Programı Türleri
export enum WorkScheduleType {
  MAINTENANCE = 'MAINTENANCE',     // Bakım
  MEETING = 'MEETING',             // Toplantı
  TRAINING = 'TRAINING',           // Eğitim
  SITE_VISIT = 'SITE_VISIT',       // Saha Ziyareti
  INSTALLATION = 'INSTALLATION',   // Kurulum
  REPAIR = 'REPAIR',               // Onarım
  OTHER = 'OTHER'                  // Diğer
}

// İş Programı Durumları
export enum WorkScheduleStatus {
  PLANNED = 'PLANNED',             // Planlandı
  IN_PROGRESS = 'IN_PROGRESS',     // Devam Ediyor
  COMPLETED = 'COMPLETED',         // Tamamlandı
  CANCELLED = 'CANCELLED',         // İptal Edildi
  POSTPONED = 'POSTPONED'          // Ertelendi
}

// İş Programı Önceliği
export enum WorkSchedulePriority {
  LOW = 'LOW',                     // Düşük
  MEDIUM = 'MEDIUM',               // Orta
  HIGH = 'HIGH'                    // Yüksek
}

// İş Programı Katılımcı tipi
export interface WorkScheduleEmployee {
  id: string;
  workScheduleId: string;
  employeeId: string;
  employee?: Employee;
  role?: string;
  isResponsible: boolean;
  createdAt: string;
  updatedAt: string;
}

// İş Programı tipi
export interface WorkSchedule {
  id: string;
  title: string;
  description?: string;
  location?: string;
  type: WorkScheduleType;
  status: WorkScheduleStatus;
  priority: WorkSchedulePriority;
  departmentId: string;
  department?: Department;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employees?: WorkScheduleEmployee[];
}

// Yeni iş programı oluşturma tipi
export interface NewWorkScheduleData {
  title: string;
  description?: string;
  location?: string;
  type: WorkScheduleType;
  status?: WorkScheduleStatus;
  priority?: WorkSchedulePriority;
  departmentId: string;
  startDate: string;
  endDate: string;
  notes?: string;
  employees: {
    employeeId: string;
    role?: string;
    isResponsible?: boolean;
  }[];
}

// İş programı güncelleme tipi
export interface UpdateWorkScheduleData {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  type?: WorkScheduleType;
  status?: WorkScheduleStatus;
  priority?: WorkSchedulePriority;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// İş programı sorgulama parametreleri
export interface WorkScheduleQueryParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  type?: WorkScheduleType;
  status?: WorkScheduleStatus;
  priority?: WorkSchedulePriority;
  searchQuery?: string;
}

// İş programı görünüm modu
export enum CalendarViewMode {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY'
} 