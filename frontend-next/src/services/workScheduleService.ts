import { 
  WorkSchedule, 
  NewWorkScheduleData, 
  UpdateWorkScheduleData, 
  WorkScheduleQueryParams 
} from '@/types/workSchedule';

// Tüm iş programlarını getir (filtreleme parametreleriyle)
export async function getAllWorkSchedules(params?: WorkScheduleQueryParams): Promise<WorkSchedule[]> {
  try {
    let url = '/api/work-schedules';
    
    // Filtreleme parametrelerini URL'e ekle
    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.departmentId) queryParams.append('departmentId', params.departmentId);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.searchQuery) queryParams.append('search', params.searchQuery);
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`İş programları yüklenirken hata oluştu: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('İş programları yüklenirken bir hata oluştu:', error);
    throw error;
  }
}

// İş programını ID'ye göre getir
export async function getWorkScheduleById(id: string): Promise<WorkSchedule> {
  try {
    const response = await fetch(`/api/work-schedules/${id}`);
    
    if (!response.ok) {
      throw new Error(`İş programı yüklenirken hata oluştu: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`İş programı (ID: ${id}) yüklenirken bir hata oluştu:`, error);
    throw error;
  }
}

// Yeni iş programı oluştur
export async function createWorkSchedule(data: NewWorkScheduleData): Promise<WorkSchedule> {
  try {
    const response = await fetch('/api/work-schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`İş programı oluşturulurken hata oluştu: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('İş programı oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

// İş programını güncelle
export async function updateWorkSchedule(data: UpdateWorkScheduleData): Promise<WorkSchedule> {
  try {
    const response = await fetch(`/api/work-schedules/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`İş programı güncellenirken hata oluştu: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`İş programı (ID: ${data.id}) güncellenirken bir hata oluştu:`, error);
    throw error;
  }
}

// İş programını sil
export async function deleteWorkSchedule(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/work-schedules/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`İş programı silinirken hata oluştu: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`İş programı (ID: ${id}) silinirken bir hata oluştu:`, error);
    throw error;
  }
}

// İş programına çalışan ekle
export async function addEmployeeToWorkSchedule(
  workScheduleId: string, 
  employeeId: string,
  role?: string,
  isResponsible: boolean = false
): Promise<{ id: string; workScheduleId: string; employeeId: string; role?: string; isResponsible: boolean }> {
  try {
    const response = await fetch(`/api/work-schedules/${workScheduleId}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId,
        role,
        isResponsible
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Çalışan iş programına eklenirken hata oluştu: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Çalışan iş programına eklenirken bir hata oluştu:', error);
    throw error;
  }
}

// İş programından çalışan çıkar
export async function removeEmployeeFromWorkSchedule(
  workScheduleId: string, 
  employeeId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/work-schedules/${workScheduleId}/employees/${employeeId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Çalışan iş programından çıkarılırken hata oluştu: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Çalışan iş programından çıkarılırken bir hata oluştu:', error);
    throw error;
  }
} 