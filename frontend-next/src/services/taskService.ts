import axios from 'axios';
import { Task, NewTaskData, UpdateTaskData } from '@/types/task';

const API_URL = '/api/tasks'; // Temel URL
const TIMEOUT = 30000;

// Axios hata işleyici (tekrarı önlemek için)
const handleApiError = (error: unknown, context: string) => {
  console.error(`${context} hatası:`, error);
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error(`Sunucu yanıtı: ${error.response.status}`, error.response.data);
      const errorData = error.response.data;
      // API'den gelen hata mesajını kullan, yoksa genel bir mesaj ver
      const message = errorData?.error || errorData?.message || `İşlem sırasında sunucu hatası (${error.response.status})`;
      throw new Error(message);
    } else if (error.request) {
      throw new Error('Sunucu yanıt vermedi. Ağ bağlantınızı kontrol edin.');
    } else {
      throw new Error(`İstek oluşturulurken hata: ${error.message}`);
    }
  } else if (error instanceof Error) {
    throw error; // Zaten bir Error nesnesi ise tekrar fırlat
  } else {
    throw new Error(`${context} sırasında bilinmeyen bir hata oluştu.`);
  }
};

/**
 * Tüm görevleri API'den getirir.
 * API yanıtının { success: boolean, data: Task[] } formatında olduğunu varsayar.
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    const response = await axios.get<{ success: boolean; data: Task[]; count: number }>(
      API_URL,
      { timeout: TIMEOUT }
    );
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.error("API'den geçersiz görev verisi formatı:", response.data);
      throw new Error("Görev verileri alınamadı veya formatı geçersiz.");
    }
  } catch (error) {
    handleApiError(error, 'Görevleri getirme');
    return []; // Hata durumunda boş dizi döndür (veya null?)
  }
}

/**
 * Belirli bir görevi ID ile API'den getirir.
 * API yanıtının { success: boolean, data: Task } formatında olduğunu varsayar.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  if (!id) {
    console.warn('getTaskById çağrısı geçersiz ID ile yapıldı.');
    return null;
  }
  try {
    const response = await axios.get<{ success: boolean; data: Task }>(
      `${API_URL}/${id}`,
      { timeout: TIMEOUT }
    );
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      // 404 durumunu ayrıca ele almak iyi olabilir ama şimdilik null dönüyoruz
      console.warn(`API'den görev (${id}) alınamadı veya formatı geçersiz:`, response.data);
      return null;
    }
  } catch (error) {
    // 404 hatasını özellikle kontrol et
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`Görev (${id}) bulunamadı.`);
      return null;
    }
    handleApiError(error, `Görev (${id}) getirme`);
    return null; // Diğer hatalarda da null döndür
  }
}

/**
 * Yeni bir görev oluşturur.
 * assigneeIds dizisini gönderir.
 * API yanıtının { success: boolean, data: Task } formatında olduğunu varsayar.
 */
export async function createTask(taskData: NewTaskData): Promise<Task> {
  try {
    // assigneeId yerine assigneeIds gönderilecek
    const dataToSend = { ...taskData };
    delete dataToSend.assigneeId; // Eski alanı kaldır
    dataToSend.assigneeIds = Array.isArray(taskData.assigneeIds) ? taskData.assigneeIds : [];

    const response = await axios.post<{ success: boolean; data: Task }>(
      API_URL,
      dataToSend, 
      {
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data?.error || "Görev oluşturulamadı.");
    }
  } catch (error) {
    handleApiError(error, 'Görev oluşturma');
    // Hata durumunda ne döndüreceğimize karar vermeliyiz, belki null?
    // Şimdilik handleApiError zaten hata fırlatıyor.
    throw error; // Veya null döndürmek yerine hatayı tekrar fırlatabiliriz
  }
}

/**
 * Mevcut bir görevi günceller.
 * assigneeIds dizisini gönderir.
 * API yanıtının { success: boolean, data: Task } formatında olduğunu varsayar.
 */
export async function updateTask(id: string, taskData: UpdateTaskData): Promise<Task> {
  try {
    // assigneeId yerine assigneeIds gönderilecek
    const dataToSend = { ...taskData };
    delete dataToSend.assigneeId; // Eski alanı kaldır
    dataToSend.assigneeIds = Array.isArray(taskData.assigneeIds) ? taskData.assigneeIds : [];
    
    const response = await axios.put<{ success: boolean; data: Task }>(
      `${API_URL}/${id}`,
      dataToSend,
      {
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data?.error || "Görev güncellenemedi.");
    }
  } catch (error) {
    handleApiError(error, `Görev (${id}) güncelleme`);
    throw error; 
  }
}

/**
 * Bir görevi ID ile siler.
 * Başarılı olursa true, olmazsa false döner.
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { timeout: TIMEOUT });
    // 204 No Content başarı anlamına gelir
    return response.status === 204;
  } catch (error) {
    // 404 hatasını görmezden gel (zaten silinmiş olabilir)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`Silinecek görev (${id}) bulunamadı.`);
      return true; // Zaten yoksa başarılı sayabiliriz
    }
    handleApiError(error, `Görev (${id}) silme`);
    return false; // Diğer hatalarda başarısız
  }
} 