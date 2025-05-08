import { ProjectStatus } from "@prisma/client";
import { Customer } from "./customer";
// import { Site } from "./site"; // Site tipi bulunamadığı için kaldırıldı
// import { Task } from "./task"; // Döngüsel bağımlılık ve ihtiyaç olmaması nedeniyle kaldırıldı
import { Department } from "./department";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus; 
  startDate: Date | string;
  endDate?: Date | string | null;
  budget?: number | null;
  departmentId: string; 
  customerId?: string | null;
  // siteId?: string | null; // Site ile ilgili alanlar da kaldırıldı
  createdAt: Date | string;
  updatedAt: Date | string;
  
  department?: Department;
  customer?: Customer | null;
  // site?: Site | null; // Site ile ilgili alanlar da kaldırıldı
  // tasks?: Task[]; // Task ile ilgili alanlar da kaldırıldı
} 