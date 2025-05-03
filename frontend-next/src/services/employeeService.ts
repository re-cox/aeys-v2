// API istekleri için servis sınıfı
import { apiClient, handleApiError, API_URL } from './api';
import { Employee, EmployeeDocument, NewEmployeePayload, UpdateEmployeePayload, CreateUserResponse, EmergencyContact } from '@/types/employee';
import { Department } from '@/types/department';
import { Role } from '@/types/role';
import { toast } from 'sonner';
import axios from 'axios';

// Backend User tipi için daha doğru bir tanım (backend/src/controllers/user.controller.ts -> getUserById select ile uyumlu)
// Export eklendi
export interface BackendUserData {
  id: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  roleId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  role?: { 
    id: string; // ID eklendi
    name: string; 
    permissions?: any;
  };
  employee?: any; // Employee alanı tipini sonra tanımladık
}

// Backend'den dönen Employee verisi için tip (ilişkili User ile)
// Bu getEmployeeById veya getAllEmployees map'lemesinde kullanılabilir
export interface BackendEmployeeWithUser {
  id: string; // Employee ID
  position?: string | null;
  phoneNumber?: string | null;
  tcKimlikNo?: string | null;
  hireDate?: string | Date | null;
  birthDate?: string | Date | null;
  address?: string | null;
  iban?: string | null;
  bloodType?: string | null;
  drivingLicense?: string | null;
  education?: string | null;
  militaryStatus?: string | null;
  salary?: number | null;
  annualLeaveAllowance?: number | null;
  profilePictureUrl?: string | null;
  departmentId?: string | null;
  userId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  department?: {
    id: string;
    name: string;
  } | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  documents?: EmployeeDocument[] | null;
  user?: { // İlişkili User bilgisi
    id: string;
    email: string;
    name?: string | null;
    surname?: string | null;
    roleId: string;
    role?: { id: string; name: string; };
  } | null;
}

// Employee ile User tiplerini birleştiren yardımcı arayüz
export interface EmployeeWithUserData extends Omit<Employee, 'user'> {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    surname?: string | null;
    role?: {
      id: string;
      name: string;
    };
  };
  roleId?: string;
}

// Ortama göre doğru API temel URL'ini belirle
const EFFECTIVE_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'; 
console.log(`[employeeService] Effective API Base URL: ${EFFECTIVE_API_BASE_URL}`);


// Timeout değeri (milliseconds)
// const TIMEOUT = 30000; // Artık api.ts'deki instance kullanılacak

// Axios instance'ı doğrudan base URL ile oluşturalım - KALDIRILDI
/*
const apiClient = axios.create({
  baseURL: EFFECTIVE_API_BASE_URL, // Backend API'sinin temel URL'si
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    // Gerekirse Authorization header'ı dinamik olarak eklenebilir (interceptor ile)
  },
});
*/

/**
 * Tüm kullanıcıları (personelleri) backend API'sinden getirir
 * Artık Employee[] döndürecek şekilde map'leme yapmalı
 */
export async function getAllEmployees(includeSalary: boolean = false): Promise<Employee[]> { 
  const context = "Tüm Personelleri Getir"; 
  console.log(`[employeeService] Backend'den tüm kullanıcılar getiriliyor... (Maaş dahil: ${includeSalary})`);
  try {
    const endpoint = `/users?includeEmployee=true${includeSalary ? '&includeSalary=true' : ''}`; // includeEmployee=true ekle
    const response = await apiClient.get<any[]>(endpoint); 
    console.log(`[employeeService] Backend'den ${response.data.length} kullanıcı alındı.`);
    
    if (!response.data || response.data.length === 0) {
      console.warn('[employeeService] Backend\'den kullanıcı verisi alınamadı veya hiç kullanıcı yok!');
      return []; 
    }
    
    // Backend verisini Employee tipine dönüştürüyoruz
    return response.data.map((user, index) => {
      // Employee ID'si yoksa kullanıcı ID'si veya index kullanılarak benzersiz bir değer oluştur
      const uniqueId = user.employee?.id || user.id || `generated-id-${index}`;
      
      const employee: Employee = {
        id: uniqueId, // Benzersiz ID sağla
        userId: user.id || `user-${index}`, // Benzersiz user ID
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        position: user.employee?.position || "",
        phoneNumber: user.employee?.phoneNumber || "",
        tcKimlikNo: user.employee?.tcKimlikNo || "",
        hireDate: user.employee?.hireDate || null,
        profilePictureUrl: user.employee?.profilePictureUrl || null,
        departmentId: user.employee?.departmentId || null,
        department: user.employee?.department || null,
        isActive: true
      };
      return employee;
    });

  } catch (error) {
    console.error('[employeeService] Personel verileri alınırken hata oluştu:', error); 
    handleApiError(error, context); 
    return []; 
  }
}

/**
 * Belirli bir personelin bilgilerini backend API'sinden getirir
 * Endpointi düzeltme: User yerine Employee endpoint'i kullanılacak
 * Backend endpoint: /api/employees/:id
 */
export async function getEmployeeById(id: string): Promise<EmployeeWithUserData | null> { 
  const context = `Personel Getir (ID: ${id})`; 
  console.log(`[employeeService] getEmployeeById çağrıldı (ID: ${id})`);
  console.log(`[employeeService] API URL: ${API_URL}`);
  
  try {
    // API URL değiştiriliyor: /users/:id?includeEmployee=true --> /employees/:id
    console.log(`[employeeService] İstek yolu: /employees/${id}`);
    const fullUrl = `${API_URL}/employees/${id}`;
    console.log(`[employeeService] Tam URL: ${fullUrl}`);
    
    const response = await apiClient.get<any>(`/employees/${id}`);
    
    if (!response.data || !response.data.success) {
      console.warn(`[employeeService] ID: ${id} için veritabanında personel kaydı bulunamadı.`);
      return null;
    }
    
    // API yanıt yapısını düzenliyoruz çünkü employees endpoint'i farklı formatta dönüyor
    const employeeData = response.data.data; // Employees API { success: true, data: {...} } formatında
    
    // Employees formatını frontend formatına dönüştürüyoruz
    const employeeWithUserData: EmployeeWithUserData = {
      id: employeeData.id,
      userId: employeeData.userId,
      email: employeeData.userEmail || '', // Email bilgisi yoksa boş string
      name: employeeData.userName || '',
      surname: employeeData.userSurname || '',
      // Diğer employee alanları
      position: employeeData.position || null,
      phoneNumber: employeeData.phoneNumber || null,
      departmentId: employeeData.departmentId || null,
      department: employeeData.department || null,
      tcKimlikNo: employeeData.tcKimlikNo || null,
      hireDate: employeeData.hireDate || null,
      birthDate: employeeData.birthDate || null, 
      address: employeeData.address || null,
      iban: employeeData.iban || null,
      bloodType: employeeData.bloodType || null,
      drivingLicense: employeeData.drivingLicense || null,
      education: employeeData.education || null,
      militaryStatus: employeeData.militaryStatus || null,
      profilePictureUrl: employeeData.profilePictureUrl || null,
      salary: employeeData.salary ?? null,
      annualLeaveAllowance: employeeData.annualLeaveAllowance ?? null,
      emergencyContactName: employeeData.emergencyContactName || null,
      emergencyContactPhone: employeeData.emergencyContactPhone || null,
      emergencyContactRelation: employeeData.emergencyContactRelation || null,
      documents: employeeData.documents || [],
      isActive: employeeData.isActive ?? true,
      createdAt: employeeData.createdAt,
      updatedAt: employeeData.updatedAt
    };

    console.log("[employeeService] Backend'den alınan veri:", response.data);
    console.log("[employeeService] Dönüştürülmüş veri:", employeeWithUserData);
    return employeeWithUserData; 
    
  } catch (error) {
    console.error(`[employeeService] ${context} işlemi başarısız:`, error);
    
    // API hatası için toast göster
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      
      if (status === 404) {
        toast.error(`Personel bulunamadı. (ID: ${id})`);
      } else {
        toast.error(`${context} işlemi başarısız: ${errorMessage}`);
      }
    } else if (error instanceof Error) {
      toast.error(`${context} işlemi başarısız: ${error.message}`);
    } else {
      toast.error(`${context} işlemi başarısız: Bilinmeyen hata`);
    }
    
    throw error; // Hatayı yukarıya fırlat
  }
}

/**
 * Yeni personel oluşturur (Backend API'sine gönderir)
 * Backend endpoint: POST /api/users
 * Parametre tipi NewEmployeePayload
 * Dönen tip CreateUserResponse olarak güncellendi
 */
export async function createEmployee(
  employeeData: NewEmployeePayload 
): Promise<CreateUserResponse | null> { // Dönen tip güncellendi
  const context = "Personel Oluştur";
  console.log("[employeeService] createEmployee çağrıldı, Backend endpoint POST /api/users");
  console.log("[employeeService] Personel oluşturma isteği gönderiliyor:", JSON.stringify(employeeData, null, 2));

  try {
    // Backend endpoint'i /users, dönüş tipi CreateUserResponse
    const response = await apiClient.post<CreateUserResponse>(`/users`, employeeData); 
    console.log("[employeeService] Personel başarıyla oluşturuldu, Backend yanıtı:", response.data);
    return response.data; 
  } catch (error) {
    console.error('[employeeService] Personel oluşturulurken hata oluştu:', error);
    handleApiError(error, context);
    return null;
  }
}

/**
 * Personel bilgilerini günceller (Backend API'sine gönderir)
 * Backend endpoint: PUT /api/users/:id
 * Dönen tip BackendEmployeeWithUser (güncelleme sonrası tam veri döner varsayımı)
 */
export async function updateEmployee(id: string, employeeData: UpdateEmployeePayload): Promise<BackendEmployeeWithUser | null> { 
  const context = `Personel Güncelle (ID: ${id})`;
  console.log(`[employeeService] updateEmployee çağrıldı (ID: ${id}) - Backend endpoint PUT /api/users/${id}`);
  console.log("[employeeService] Personel güncelleme isteği gönderiliyor:", JSON.stringify(employeeData, null, 2));
  try {
    const response = await apiClient.put<BackendEmployeeWithUser>(`/users/${id}`, employeeData); 
    console.log("[employeeService] Personel başarıyla güncellendi, Backend yanıtı:", response.data);
    return response.data;
  } catch (error) {
    console.error(`[employeeService] ID'si ${id} olan personel güncellenirken hata oluştu:`, error);
    handleApiError(error, context);
    return null;
  }
}

/**
 * Personel siler
 * Backend endpoint: DELETE /api/users/:id
 */
export async function deleteEmployee(id: string): Promise<boolean> {
  const context = `Personel Sil (ID: ${id})`;
  console.log(`[employeeService] deleteEmployee çağrıldı (ID: ${id}) - Backend endpoint DELETE /api/users/${id}`);
  try {
    await apiClient.delete(`/users/${id}`);
    console.log(`[employeeService] Personel (ID: ${id}) başarıyla silindi.`);
    return true;
  } catch (error) {
    console.error(`[employeeService] ID'si ${id} olan personel silinirken hata oluştu:`, error);
    handleApiError(error, context);
    return false;
  }
}

// Profil resmi ve doküman yükleme fonksiyonları da backend API'lerini kullanmalı
// TODO: Backend'de ilgili endpoint'ler (örn: /api/users/:id/profile-image, /api/users/:id/documents) oluşturulmalı

/**
 * Profil resmini yükler (Backend API'sine gönderir)
 * Backend endpoint: POST /api/users/:userId/profile-picture
 * @param userId Profil resminin ait olduğu kullanıcının ID'si
 * @param file Yüklenecek resim dosyası
 * @returns Yüklenen resmin URL'i
 */
export async function uploadProfilePicture(userId: string, file: File): Promise<{ profilePictureUrl: string } | null> {
  const context = `Profil Fotoğrafı Yükle (User ID: ${userId})`;
  console.log(`[employeeService] uploadProfilePicture çağrıldı (User ID: ${userId})`);
  const formData = new FormData();
  formData.append('profilePicture', file);

  try {
    // Endpoint: /users/:userId/profile-picture 
    const response = await apiClient.post<{ success: boolean, profilePictureUrl: string, message: string }>(
      `/users/${userId}/profile-picture`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log("[employeeService] Profil fotoğrafı başarıyla yüklendi:", response.data);
    
    if (response.data.success && response.data.profilePictureUrl) {
      return { 
        profilePictureUrl: response.data.profilePictureUrl 
      };
    } else {
      toast.error("Profil fotoğrafı yüklendi fakat URL alınamadı.");
      return null;
    }
  } catch (error) {
    console.error('[employeeService] Profil fotoğrafı yüklenirken hata oluştu:', error);
    handleApiError(error, context);
    return null;
  }
}

/**
 * Personel dokümanlarını yükler (Backend API'sine gönderir)
 * Backend endpoint: POST /api/employees/:employeeId/documents
 * @param employeeId Dökümanların ait olduğu personelin ID'si
 * @param files Yüklenecek döküman dosyaları listesi
 * @returns Yüklenen dökümanların bilgileri
 */
export async function uploadEmployeeDocuments(employeeId: string, files: File[]): Promise<EmployeeDocument[] | null> {
  const context = `Personel Dökümanı Yükle (Employee ID: ${employeeId})`;
  console.log(`[employeeService] uploadEmployeeDocuments çağrıldı (Employee ID: ${employeeId})`);
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('documents', file);
  });

  try {
    // Endpoint /employees/ olmalı
    const response = await apiClient.post<EmployeeDocument[]>(`/employees/${employeeId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("[employeeService] Dökümanlar başarıyla yüklendi:", response.data);
    return response.data;
  } catch (error) {
    console.error('[employeeService] Döküman yüklenirken hata oluştu:', error);
    handleApiError(error, context);
    return null;
  }
}

// Doküman silme fonksiyonu (varsa) da benzer şekilde güncellenmeli

/**
 * Profil resmini Base64 formatında yükler
 * Backend endpoint: POST /api/employees/:employeeId/profile-image
 * @param userId Profil resminin ait olduğu kullanıcının ID'si
 * @param base64Image Base64 formatında resim verisi
 * @returns Yüklenen resmin URL'i
 */
export async function uploadProfileImage(userId: string, base64Image: string): Promise<string | null> {
  const context = `Profil Resmi Yükle (Base64, Kullanıcı ID: ${userId})`;
  console.log(`[employeeService] Base64 profil resmi yükleniyor (Kullanıcı ID: ${userId})`);

  try {
    // API endpoint'i düzeltildi - /api/employees/:employeeId/profile-image
    const response = await apiClient.post<{ imageUrl: string }>(`/employees/${userId}/profile-image`, {
      imageData: base64Image,
    });
    console.log('[employeeService] Base64 profil resmi başarıyla yüklendi:', response.data);
    return response.data.imageUrl;
  } catch (error) {
    console.error('[employeeService] Base64 profil resmi yüklenirken hata oluştu:', error);
    handleApiError(error, context);
    return null;
  }
}

// --- BU KISIMDAN SONRASI TAMAMEN SİLİNECEK --- 
/*
// Frontend'de kullanılan ek alanları içeren genişletilmiş Employee arayüzü
interface EmployeeExtended extends Employee {
  identityNumber?: string;
  profileImage?: string;
  phone?: string;
}

// Tüm personelleri getirir
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const response = await apiClient.get<Employee[]>(`/employees`, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error('Personel verileri alınırken hata oluştu:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Sunucu hatası: ${error.response.status} - ${error.response.statusText}`);
        
        // Sunucu yanıtındaki hatayı logla
        if (error.response.data) {
          console.error('Hata yanıtı:', JSON.stringify(error.response.data));
        }
      } else if (error.request) {
        console.error('Sunucu yanıt vermedi, bağlantı hatası olabilir');
      }
    }
    
    throw new Error("Personel verileri alınamadı");
  }
}

// Belirli bir personelin bilgilerini getirir
export async function getEmployeeById(id: string): Promise<EmployeeExtended | null> {
  try {
    console.log(`getEmployeeById çağrısı, id: ${id}`);
    
    const response = await apiClient.get<EmployeeExtended>(`/employees/${id}`, {
      timeout: TIMEOUT
    });
    
    // API yanıtını kontrol et
    const data = response.data;
    
    console.log(`getEmployeeById API yanıtı:`, data);
    
    // TC Kimlik No hem orijinal alan adı (tcKimlikNo) hem de 
    // frontend'deki alan adı (identityNumber) olarak eşitleniyor
    if (data.tcKimlikNo && !data.identityNumber) {
      data.identityNumber = data.tcKimlikNo;
    } else if (data.identityNumber && !data.tcKimlikNo) {
      data.tcKimlikNo = data.identityNumber;
    }
    
    // Acil durum kişisi verisini kontrol et ve düzelt
    // API yanıtında acil durum kişisi dizi olarak geliyorsa, 
    // onu tekil bir nesne olarak düzenliyoruz
    if (data.emergencyContacts && Array.isArray(data.emergencyContacts)) {
      console.log('Acil durum kişisi dizi olarak geldi, tekil nesneye dönüştürülüyor:', data.emergencyContacts);
      data.emergencyContacts = data.emergencyContacts[0] || null;
    }
    
    return data;
  } catch (error) {
    console.error(`ID'si ${id} olan personel alınırken hata oluştu:`, error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`${id} ID'sine sahip personel bulunamadı`);
    }
    
    throw new Error("Personel bilgileri alınamadı");
  }
}

// Yeni personel oluşturur
export async function createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
  try {
    const response = await apiClient.post<Employee>(`/employees`, employeeData, {
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error('Personel oluşturulurken hata oluştu:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Sunucu hatası: ${error.response.status} ${error.response.statusText}`);
      
      // Detaylı hata mesajını logla
      if (error.response.data) {
        console.error('Hata mesajı:', error.response.data);
      }
      
      if (error.response.status === 400) {
        throw new Error('Geçersiz personel bilgileri: ' + 
        (error.response.data.error || 'Lütfen zorunlu alanları doldurun'));
      }
    }
    
    throw new Error("Personel oluşturulamadı");
  }
}

// Personel bilgilerini günceller
export async function updateEmployee(id: string, employeeData: Partial<EmployeeExtended>): Promise<Employee> {
  try {
    console.log(`updateEmployee çağrısı, id: ${id}, data:`, JSON.stringify(employeeData, null, 2));
    
    // API'nin beklediği alan adlarına göre veriyi dönüştür
    const apiData = { ...employeeData } as any;
    
    // profileImage, API'de profilePictureUrl olarak bekleniyor
    if (apiData.profileImage !== undefined && !apiData.profilePictureUrl) {
      apiData.profilePictureUrl = apiData.profileImage;
    }
    
    // phone, API'de phoneNumber olarak bekleniyor
    if (apiData.phone !== undefined && !apiData.phoneNumber) {
      apiData.phoneNumber = apiData.phone;
    }
    
    const response = await apiClient.put<Employee>(`/employees/${id}`, apiData, {
      timeout: TIMEOUT
    });
    
    console.log(`updateEmployee başarılı, id: ${id}, response:`, response.status);
    return response.data;
  } catch (error) {
    console.error(`ID'si ${id} olan personel güncellenirken hata oluştu:`, error);
    
    if (axios.isAxiosError(error)) {
      console.error(`Axios Hata Tipi: ${error.code}, İstek URL: ${error.config?.url}`);
      
      if (error.response) {
        console.error(`Sunucu hatası: ${error.response.status} - ${error.response.statusText}`);
        
        // Detaylı hata mesajını logla
        if (error.response.data) {
          console.error('API yanıt hata detayları:', error.response.data);
          console.error('API çağrısı sırasında hata:', new Error(
            `Personel güncellenirken bir hata oluştu. - ${
              typeof error.response.data === 'object' && error.response.data.details 
                ? error.response.data.details 
                : (error.response.data.error || error.message || "Yetkilendirme hatası")
            }`
          ));
        }
        
        if (error.response.status === 401) {
          throw new Error('Yetkilendirme hatası: Lütfen tekrar giriş yapın');
        } else if (error.response.status === 404) {
          throw new Error(`${id} ID'sine sahip personel bulunamadı`);
        } else if (error.response.status === 409) {
          const errorMessage = error.response.data?.error || 'Aynı değere sahip kayıt zaten mevcut';
          throw new Error(`Veri çakışması: ${errorMessage}`);
        } else if (error.response.status === 400) {
          const errorMessage = error.response.data?.error || 'Formda eksik veya hatalı alanlar var';
          throw new Error(`Geçersiz istek: ${errorMessage}`);
        } else if (error.response.status === 500) {
          const errorMessage = error.response.data?.error || 'Sunucu hatası';
          const errorDetails = error.response.data?.details ? ` - ${error.response.data.details}` : '';
          throw new Error(`Sunucu hatası: ${errorMessage}${errorDetails}`);
        } else {
          const errorMsg = error.response.data?.error || 'Personel güncellenemedi';
          const errorDetails = error.response.data?.details ? ` - ${error.response.data.details}` : '';
          throw new Error(`${errorMsg}${errorDetails}`);
        }
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error('Sunucu yanıt vermedi, ağ hatası olabilir');
        throw new Error('Sunucu yanıt vermedi. İnternet bağlantınızı kontrol edin.');
      } else {
        // İstek oluşturulurken bir hata oluştu
        console.error('İstek oluşturulurken hata:', error.message);
        throw new Error(`İstek gönderilirken hata: ${error.message}`);
      }
    }
    
    // Axios hatası değilse
    throw new Error("Personel güncellenemedi");
  }
}

// Personeli siler
export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/employees/${id}`, {
      timeout: TIMEOUT
    });
    return true;
  } catch (error) {
    console.error(`ID'si ${id} olan personel silinirken hata oluştu:`, error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`${id} ID'sine sahip personel bulunamadı`);
    }
    
    throw new Error("Personel silinemedi");
  }
}

// Profil resmini yükler (Base64 formatında)
export async function uploadProfileImage(base64Image: string): Promise<string> {
  try {
    console.log('Profil resmi yükleniyor...');
    const response = await apiClient.post<{url: string}>(`/upload/profile-image`, { image: base64Image }, {
      timeout: TIMEOUT * 2, // Daha uzun timeout, çünkü dosya yükleme işlemi
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Profil resmi başarıyla yüklendi');
    return response.data.url;
  } catch (error) {
    console.error('Profil resmi yüklenirken hata oluştu:', error);
    throw new Error("Profil resmi yüklenemedi");
  }
}

// Döküman yükle
export async function uploadDocument(file: File): Promise<EmployeeDocument> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<EmployeeDocument>(`/upload/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: TIMEOUT * 2 // Dosya yükleme için daha uzun timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Doküman yüklenirken hata oluştu:', error);
    throw new Error("Doküman yüklenemedi");
  }
} 
*/ 