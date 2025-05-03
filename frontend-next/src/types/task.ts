import { TaskStatus, TaskPriority, Project } from "@prisma/client";

// Define a specific type for assignees as returned by the API
export interface TaskAssignee {
  id: string;
  name: string | null; // Prisma types often allow null
  surname: string | null; // Prisma types often allow null
  email: string | null; // Prisma types often allow null
  profilePictureUrl: string | null; // Make optional as per API select
  position: string | null; // Add position field
  // Note: 'position' is used in the component but not selected in API, so not included here
}

// Frontend'de kullanmak için Task arayüzü
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null; // Tarih nesnesi olarak alalım
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  departmentId: string | null;
  assignees: TaskAssignee[]; // Use the specific type
  project: Project | null;
  department?: { id: string; name: string } | null; // Departman ilişkisi opsiyonel olarak eklendi
}

// Yeni Task oluşturmak için tip (API'ye gönderilecek)
export interface NewTaskData {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null; // String veya Date olabilir
  assigneeIds?: string[]; // Yeni alan
  projectId?: string | null;
  departmentId?: string | null; // Eklendi
  assigneeId?: string | null; 
}

// Task güncellemek için tip (API'ye gönderilecek)
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null; // String veya Date olabilir
  assigneeIds?: string[]; // Yeni alan
  projectId?: string | null;
  departmentId?: string | null; // Eklendi
  assigneeId?: string | null; 
}

// API yanıtlarında kullanılacak genel tip (opsiyonel)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
} 