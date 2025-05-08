import { AxiosError } from 'axios';
import { Task, NewTaskData, UpdateTaskData } from '@/types/task';
import { api } from '@/lib/api'; // api nesnesini import et

// const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api'}/tasks`; // Backend API URL
// const TIMEOUT = 30000; // apiClient bunu yönetiyor olmalı

// Axios hata işleyici (apiClient bunu zaten yapıyor olabilir, gözden geçirilecek)
const handleApiError = (error: unknown, context: string) => {
  console.error(`[taskService] ${context} hatası:`, error);
  if (error instanceof Error && (error as any).isAxiosError) {
    const axiosError = error as AxiosError<any>; // Hata tipini belirtmek daha iyi
    if (axiosError.response) {
      console.error(`[taskService] Sunucu yanıtı: ${axiosError.response.status}`, axiosError.response.data);
      const errorData = axiosError.response.data;
      const message = errorData?.error || errorData?.message || `İşlem sırasında sunucu hatası (${axiosError.response.status})`;
      throw new Error(message);
    } else if (axiosError.request) {
      throw new Error('Sunucu yanıt vermedi. Ağ bağlantınızı kontrol edin.');
    } else {
      throw new Error(`İstek oluşturulurken hata: ${axiosError.message}`);
    }
  } else if (error instanceof Error) {
    throw error; 
  } else {
    throw new Error(`${context} sırasında bilinmeyen bir hata oluştu.`);
  }
};

/**
 * Tüm görevleri API'den getirir.
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    console.log('[taskService] Fetching all tasks using apiClient...');
    const response = await api.tasks.getAll(); 
    if (response && Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object' && (response as any).data && Array.isArray((response as any).data)) {
        return (response as any).data;
    }
    console.error("[taskService] API'den geçersiz görev verisi formatı:", response);
    throw new Error("Görev verileri alınamadı veya formatı geçersiz.");
  } catch (error) {
    handleApiError(error, 'Görevleri getirme');
    return []; 
  }
}

/**
 * Belirli bir görevi ID ile API'den getirir.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  if (!id) {
    console.warn('[taskService] getTaskById çağrısı geçersiz ID ile yapıldı.');
    return null;
  }
  try {
    console.log(`[taskService] Fetching task ${id} using apiClient...`);
    const task = await api.tasks.getById(id);
    return task || null; // api.tasks.getById null dönebilir eğer bulunamazsa
  } catch (error) {
    if ((error as any).isAxiosError && (error as AxiosError).response?.status === 404) {
        console.log(`[taskService] Görev (${id}) bulunamadı (404).`);
        return null;
    }
    handleApiError(error, `Görev (${id}) getirme`);
    return null; 
  }
}

/**
 * Yeni bir görev oluşturur.
 */
export async function createTask(taskData: NewTaskData): Promise<Task> {
  try {
    console.log('[taskService] Creating task using apiClient...', taskData);
    const dataForApi: any = {
      ...taskData,
      description: taskData.description === null ? undefined : taskData.description,
      // dueDate: taskData.dueDate instanceof Date ? taskData.dueDate.toISOString().split('T')[0] : taskData.dueDate,
      // assigneeId alanı api.ts'de beklenmiyor, NewTaskData'dan kaldırılabilir veya burada silinebilir.
    };
    if (taskData.assigneeId) {
        delete dataForApi.assigneeId;
    }
    if (taskData.dueDate instanceof Date) {
        dataForApi.dueDate = taskData.dueDate.toISOString().split('T')[0];
    } else {
        dataForApi.dueDate = taskData.dueDate; // string veya null/undefined ise olduğu gibi bırak
    }

    const newTask = await api.tasks.create(dataForApi);
    if (!newTask) { 
        throw new Error("Görev oluşturulamadı, API geçerli bir görev döndürmedi.");
    }
    return newTask;
  } catch (error) {
    handleApiError(error, 'Görev oluşturma');
    throw error; 
  }
}

/**
 * Mevcut bir görevi günceller.
 */
export async function updateTask(id: string, taskData: UpdateTaskData): Promise<Task> {
  try {
    console.log(`[taskService] Updating task ${id} using apiClient...`, taskData);
    const dataForApi: any = { 
        ...taskData,
        // dueDate: taskData.dueDate instanceof Date ? taskData.dueDate.toISOString().split('T')[0] : taskData.dueDate,
        // assigneeId alanı api.ts'de beklenmiyor, UpdateTaskData'dan kaldırılabilir veya burada silinebilir.
    };
    if (taskData.assigneeId) {
        delete dataForApi.assigneeId;
    }
    if (taskData.dueDate instanceof Date) {
        dataForApi.dueDate = taskData.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD formatına çevir
    } else {
        dataForApi.dueDate = taskData.dueDate; // string veya null/undefined ise olduğu gibi bırak
    }

    const updatedTask = await api.tasks.update(id, dataForApi);
    if (!updatedTask) { 
        throw new Error("Görev güncellenemedi, API geçerli bir görev döndürmedi.");
    }
    return updatedTask;
  } catch (error) {
    handleApiError(error, `Görev (${id}) güncelleme`);
    throw error; 
  }
}

/**
 * Bir görevi ID ile siler.
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    console.log(`[taskService] Deleting task ${id} using apiClient...`);
    await api.tasks.delete(id); // api.tasks.delete bir şey döndürmeyebilir veya boolean
    return true; // Başarılı olduğunu varsayalım, api.ts'deki delete bunu netleştirmeli
  } catch (error) {
    if ((error as any).isAxiosError && (error as AxiosError).response?.status === 404) {
      console.log(`[taskService] Silinecek görev (${id}) bulunamadı (404).`);
      return true; 
    }
    handleApiError(error, `Görev (${id}) silme`);
    return false; 
  }
} 