"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types/user';
import axios from 'axios'; // Axios kullanalım

// Ortamı tespit et (Sunucu mu, İstemci mi?)
const IS_SERVER = typeof window === 'undefined';

// Ortama göre doğru API temel URL'ini belirle
const API_BASE_URL = IS_SERVER
  ? process.env.API_URL || "http://localhost:5001/api" // Sunucuda tam URL kullan (bu context client-side olduğu için genellikle aşağıdaki kullanılır)
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";       // İstemcide göreceli yol veya tam URL kullan
  
// !!! ÖNEMLİ NOT: Eğer process.env.NEXT_PUBLIC_API_URL = \"/api\" ise,
// istemci tarafında bu, backend API'si yerine frontend'in kendi API rotalarına 
// (Next.js API routes) gider. Backend API'sine gitmesi için tam URL gerekir.
// .env.local dosyasında NEXT_PUBLIC_API_URL=\"http://localhost:5001/api\" olmalı.
// VEYA burada doğrudan backend URL'ini kullanabiliriz:
const EFFECTIVE_API_BASE_URL = "http://localhost:5001/api"; 
console.log(`[AuthContext] Effective API Base URL: ${EFFECTIVE_API_BASE_URL}`);

// Timeout değeri (milliseconds)
const TIMEOUT = 30000; // employeeServiceten gelen değeri kullanalım

// Axios istemcisini burada tanımla
const apiClient = axios.create({
  baseURL: EFFECTIVE_API_BASE_URL, // Backend API'sinin temel URL'si
  timeout: TIMEOUT, // Timeout değerini tanımla (varsa)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor ekleyerek her isteğe token ekleyebiliriz (opsiyonel ama iyi pratik)
apiClient.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("[Auth] Token eklendiği: İstek gönderiliyor", { url: config.url });
        } else {
            console.warn("[Auth] Token bulunamadı, istek yetkilendirilmeden gönderiliyor", { url: config.url });
        }
    } catch (error) {
        console.error("[Auth] Token işleme hatası:", error);
    }
    return config;
}, (error) => {
    console.error("[Auth] İstek interceptor hatası:", error);
    return Promise.reject(error);
});

// Define the type for our context value
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // Şimdilik /api/auth/me backend'de yok
}

// API response interfaces (Backend /api/auth/login yanıtına göre güncellendi)
interface AuthLoginResponse {
  user: { // Backend'den gelen user nesnesi (passwordHash hariç)
    id: string;
    email: string;
    name?: string | null; 
    surname?: string | null;
    roleId: string;
    departmentId?: string | null;
    role?: {       // include ile gelen rol bilgisi
      name: string;
      permissions: any; // Json tipi any olabilir
    };
    department?: { // include ile gelen departman bilgisi
      id: string;
      name: string;
    };
    // Diğer User alanları...
  };
  token: string;
}

// TODO: Backend /api/auth/me endpoint'i oluşturulduğunda bu arayüzü tanımla
// interface AuthMeResponse { ... }

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => Promise.resolve(),
  refreshUser: async () => {},
});

// Convert backend user data to frontend User interface
// (mapEmployeeToUser yerine mapUserToUser)
const mapUserToUser = (backendUser: AuthLoginResponse['user']): User => {
  // Backend rol adını frontend enum'una çevir (varsayılan EMPLOYEE)
  let frontendRole: UserRole = UserRole.EMPLOYEE;
  if (backendUser.role?.name?.toUpperCase() === 'ADMIN') {
    frontendRole = UserRole.ADMIN;
  }
  
  return {
    id: backendUser.id,
    firstName: backendUser.name || '',
    lastName: backendUser.surname || '',
    email: backendUser.email || '',
    role: frontendRole, // Dönüştürülmüş rolü kullan
    department: backendUser.department?.name || backendUser.departmentId || '',
    // position alanı backend User modelinde yok, role.name kullanılabilir
    position: backendUser.role?.name || '', 
    // phoneNumber backend User modelinde yok, gerekirse eklenmeli
    phoneNumber: '', 
    // profileImage backend User modelinde yok, gerekirse eklenmeli
    profileImage: '', 
    // Backend'den gelen izinleri de ekleyebiliriz (opsiyonel)
    permissions: backendUser.role?.permissions || {},
  };
};

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Kullanıcı bilgilerini yenileme fonksiyonu
  const refreshUser = useCallback(async () => {
    console.log("[Auth] refreshUser çağrıldı");
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("[Auth] Token yok, yenileme atlandı.");
      setUser(null);
      // Yükleme durumunu burada false yapmayalım, useEffect içinde yapılıyor
      return; 
    }
    
    try {
      console.log("[Auth] Backend /api/auth/me çağrılıyor...");
      // apiClient'ı kullan, headers'ı interceptor halleder
      const response = await apiClient.get<{ user: AuthLoginResponse['user'] }>(`/auth/me`); 

      const data = response.data;

      if (data.user) { // Backend yanıtına göre kontrol et
        console.log("[Auth] Kullanıcı bilgileri /auth/me ile alındı:", data.user.name);
        setUser(mapUserToUser(data.user)); // mapUserToUser kullan
        setError(null); // Başarılı olduysa hatayı temizle
      } else {
        console.error("[Auth] /auth/me yanıtında kullanıcı verisi yok:", data);
        localStorage.removeItem('token');
        setUser(null);
        setError("Oturum bilgileri alınamadı."); // Hata mesajı ayarla
      }
    } catch (err: any) {
      console.error("[Auth] /auth/me ile kullanıcı bilgileri yenilenirken hata:", err);
      let errorMessage = "Oturum bilgileri alınırken bir hata oluştu.";
      let shouldLogout = false; // Logout flag

      if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
              console.log("[Auth] 401 hatası (refreshUser): Oturum geçersiz, token siliniyor");
              errorMessage = "Oturumunuz zaman aşımına uğradı veya geçersiz. Lütfen tekrar giriş yapın.";
              shouldLogout = true; // Sadece 401'de logout yap
          } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message; // Sunucudan gelen hatayı kullan
          } else {
              // Diğer Axios hataları için genel mesaj (örn: Network Error)
              errorMessage = `Oturum bilgileri alınamadı (${err.message}). Lütfen internet bağlantınızı kontrol edin.`;
          }
      } else if (err instanceof Error) {
          errorMessage = err.message; // Genel JS hataları
      }

      // Sadece 401 durumunda token'ı sil ve kullanıcıyı null yap
      if (shouldLogout) {
          localStorage.removeItem('token');
          setUser(null);
      } 
      // Her durumda hata mesajını ayarla
      setError(errorMessage); 
    } finally {
      // İlklendirmeyi tamamla (başarılı veya başarısız olsa da)
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, []);

  // Kullanıcı oturum durumunu kontrol et - ilk yükleme
  useEffect(() => {
    // İlk yükleme kontrolü
    if (!isInitialized) {
      console.log("[Auth] İlk yükleme, oturum kontrolü yapılıyor");
      
      const checkAuthStatus = async () => {
        try {
          setIsLoading(true);
          
          // localStorage'dan token kontrolü
          const token = localStorage.getItem('token');
          if (!token) {
            console.log("[Auth] Token bulunamadı, kontrol tamamlandı");
            setUser(null);
            setIsInitialized(true);
            setIsLoading(false);
            return;
          }
          
          console.log("[Auth] Token bulundu, kullanıcı bilgileri kontrol ediliyor (refreshUser çağrılacak)");
          
          // Kullanıcı bilgilerini al
          await refreshUser();
          
        } catch (error) {
          console.error("[Auth] Oturum kontrolü sırasında hata:", error);
          // Hata durumunda token'ı temizle
          localStorage.removeItem('token');
          setUser(null);
        } finally {
          // İlklendirmeyi tamamla (başarılı veya başarısız olsa da)
          setIsInitialized(true);
          setIsLoading(false);
        }
      };
      
      checkAuthStatus();
    }
  }, [isInitialized, refreshUser]); // isInitialized ve refreshUser bağımlılıkları

  // Giriş fonksiyonu
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("[Auth] Backend'e giriş yapılıyor:", email);
      
      // apiClient'ı kullan
      const response = await apiClient.post<AuthLoginResponse>(
         `/auth/login`, 
         { email, password }
         // Headers'ı interceptor veya apiClient default ayarları halleder
       );

      const data = response.data;
      
      // Yanıtı kontrol et (backend başarılı yanıtında user ve token olmalı)
      if (data.user && data.token) {
        console.log("[Auth] Backend girişi başarılı, token alındı");
        
        // Önce token'ı kaydet
        localStorage.setItem('token', data.token);
        
        // Kullanıcı nesnesini oluştur ve state'e kaydet (mapUserToUser kullan)
        const mappedUser = mapUserToUser(data.user);
        setUser(mappedUser);
        
        return; // Başarılı giriş
      }
      
      // Beklenen veri yoksa hata fırlat (normalde bu olmaz, backend hatayı yakalar)
      console.error("[Auth] Backend yanıtında kullanıcı veya token bilgisi eksik:", data);
      throw new Error("Geçersiz sunucu yanıtı alındı.");
      
    } catch (err: any) {
      console.error("[Auth] Giriş sırasında hata:", err);
      let errorMessage = "Giriş yapılırken bir hata oluştu";
      // Axios hatalarından daha spesifik mesaj al
      if (axios.isAxiosError(err) && err.response?.data?.message) {
          errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      // Hatanın tekrar fırlatılması login sayfasında da handle edilmesini sağlar
      throw new Error(errorMessage); 
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = useCallback(async (): Promise<void> => {
    console.log("[Auth] Çıkış yapılıyor");
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    // apiClient.defaults.headers.Authorization = undefined; // Interceptor varsa bu gereksiz
    // Yönlendirme context dışında yapılmalı (örn: useEffect içinde)
  }, []);

  // Context değerini oluştur
  const contextValue = {
    user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 