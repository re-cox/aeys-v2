import { TaskStatus, Priority } from "@prisma/client";
// Project tipini @prisma/client yerine kendi tanımladığımız yerden alalım
import { Project } from "./project"; 

// User için temel bilgileri içeren bir tip (createdBy ve assignees için kullanılabilir)
export interface UserBasicInfo {
  id: string;
  name: string | null;
  surname: string | null;
  email?: string | null; // email assignees için var, createdBy için de olabilir
  profilePictureUrl: string | null;
  position?: string | null; // assignees için vardı
}

// TaskAssignee tipini UserBasicInfo kullanacak şekilde güncelleyebiliriz veya ayrı tutabiliriz.
// Şimdilik TaskAssignee'yi UserBasicInfo'dan miras alacak şekilde yapalım:
export interface TaskAssignee extends UserBasicInfo {}

// Frontend'de kullanmak için Task arayüzü
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null; 
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  // departmentId: string | null; // Bu alan doğrudan Task üzerinde değil, Project üzerinden geliyor
  assignees: TaskAssignee[]; 
  project: Project | null; // Kendi Project tipimizi kullanıyoruz
  // department?: { id: string; name: string } | null; // Bu da Project üzerinden gelecek
  createdBy?: UserBasicInfo | null; // Görevi oluşturan kullanıcı bilgisi eklendi
}

// Yeni Task oluşturmak için tip (API'ye gönderilecek)
export interface NewTaskData {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | Date | null; 
  assigneeIds?: string[]; 
  projectId?: string | null;
  // departmentId?: string | null; // Kaldırıldı, backend bunu işlemiyor
  // assigneeId?: string | null; // assigneeIds kullanılıyor
}

// Task güncellemek için tip (API'ye gönderilecek)
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | Date | null; 
  assigneeIds?: string[]; 
  projectId?: string | null;
  // departmentId?: string | null; // Kaldırıldı
  // assigneeId?: string | null; // assigneeIds kullanılıyor
}

// API yanıtlarında kullanılacak genel tip (opsiyonel)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
} 