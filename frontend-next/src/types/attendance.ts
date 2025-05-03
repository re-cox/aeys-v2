import { AttendanceStatus } from "@/app/(dashboard)/attendance/page"; // veya Enum tipi de buraya taşınabilir
// VEYA AttendanceStatus tipini de buraya taşı:
// export type AttendanceStatus = 'G' | 'Y' | 'İ' | 'R' | 'X' | 'T';

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD formatında
  status: AttendanceStatus;
  hasOvertime?: boolean;
  overtimeStart?: string | null; // Backend null kabul ediyor
  overtimeEnd?: string | null;   // Backend null kabul ediyor
  isHoliday?: boolean;
  notes?: string | null;         // Backend null kabul ediyor
} 