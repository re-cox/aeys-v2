"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, UserRole } from "@/types/user";
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
}

// API response interfaces
interface AuthMeResponse {
  success: boolean;
  employee: {
    id: string;
    email: string;
    name: string;
    surname: string;
    position: UserRole;
    departmentId: string;
    profilePictureUrl: string | null;
    department: {
      id: string;
      name: string;
    } | null;
  };
  message?: string;
  details?: string;
}

interface AuthLoginResponse {
  employee: {
    id: string;
    email: string;
    name: string;
    surname: string;
    position: UserRole;
    departmentId: string;
    profilePictureUrl: string | null;
    department: {
      id: string;
      name: string;
    } | null;
  };
  token: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert employee data from API to User interface
const mapEmployeeToUser = (employee: AuthMeResponse['employee'] | AuthLoginResponse['employee']): User => {
  return {
    id: employee.id,
    email: employee.email,
    firstName: employee.name,
    lastName: employee.surname,
    role: employee.position,
    profileImage: employee.profilePictureUrl || undefined,
    department: employee.department ? employee.department.name : undefined
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Kullanıcı bilgilerini yenileme fonksiyonu
  const refreshUser = useCallback(async (): Promise<boolean> => {
    setError(null);
    
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Auth] Token bulunamadı, oturum yok');
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      return false;
    }
    
    try {
      console.log('[Auth] Token bulundu, kullanıcı bilgisi alınıyor');
      // API isteği 
      const response = await axios.get<AuthMeResponse>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Başarılı yanıt kontrolü
      if (response.data.success && response.data.employee) {
        console.log('[Auth] API\'den kullanıcı bilgisi alındı:', response.data.employee.name);
        const userData = mapEmployeeToUser(response.data.employee);
        setUser(userData);
        setIsLoading(false);
        setIsInitialized(true);
        return true;
      } else {
        console.error('[Auth] API yanıtında başarısız yanıt:', response.data);
        // Başarılı yanıt gelmedi ama HTTP 200 - token geçersiz olabilir
        setUser(null);
        localStorage.removeItem('token');
        setError('Oturum doğrulanamadı: ' + (response.data.message || 'Bilinmeyen hata'));
        setIsLoading(false);
        setIsInitialized(true);
        return false;
      }
    } catch (error) {
      console.error('[Auth] Kullanıcı bilgisi alınırken hata:', error);
      
      // Axios hata yakalamayı daha açıklayıcı yap
      if (axios.isAxiosError(error)) {
        // Hata detaylarını log
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;
        const errorDetails = error.response?.data?.details || '';
        
        console.error(`[Auth] API Hatası (${status}):`, errorMessage, errorDetails);
        
        // 401/403 veya token hataları için token temizleme
        if (status === 401 || status === 403 || 
            errorMessage.includes('token') || errorMessage.includes('Token') || 
            errorMessage.includes('jwt') || errorMessage.includes('JWT')) {
          console.log('[Auth] Kimlik doğrulama hatası, token siliniyor');
          localStorage.removeItem('token');
          setUser(null);
        }
        
        // Hata mesajını ayarla
        setError(`Oturum hatası: ${errorMessage}`);
      } else {
        console.error('[Auth] Bilinmeyen hata:', error);
        setError('Bilinmeyen bir hata oluştu');
      }
      
      setIsLoading(false);
      setIsInitialized(true);
      return false;
    }
  }, []);

  // Kullanıcı oturum durumunu kontrol et
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
          
          console.log("[Auth] Token bulundu, kullanıcı bilgileri kontrol ediliyor");
          
          // User bilgilerini al
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

  useEffect(() => {
    if (isLoading && user) {
      console.log("Updating user state:", user.firstName, user.email);
      setUser(user);
      setIsLoading(false);
    }
  }, [user, isLoading]);

  // Giriş fonksiyonu
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Auth] Giriş isteği gönderiliyor');
      const response = await axios.post<AuthLoginResponse>('/api/auth/login', {
        email,
        password,
      });
      
      if (response.data && response.data.token) {
        // Token'ı kaydet
        localStorage.setItem('token', response.data.token);
        
        // Kullanıcı bilgilerini ayarla
        const userData = mapEmployeeToUser(response.data.employee);
        setUser(userData);
        console.log('[Auth] Giriş başarılı, token kaydedildi:', userData.firstName);
      } else {
        console.error('[Auth] Giriş yanıtında token bulunamadı');
        setError('Giriş yapılamadı: Geçersiz yanıt formatı');
      }
    } catch (error) {
      console.error('[Auth] Giriş yaparken hata:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        setError(`Giriş hatası: ${errorMessage}`);
      } else {
        setError('Giriş sırasında bilinmeyen bir hata oluştu');
      }
      
      throw error; // Hatayı yukarı fırlat ki login formu ele alabilsin
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // API'ye logout bildir (opsiyonel)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.post('/api/auth/logout', {}, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (apiError) {
          // API hatası olsa bile devam et
          console.warn('[Auth] Logout API hatası:', apiError);
        }
      }
    } finally {
      // Yerel state'i temizle
      localStorage.removeItem('token');
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  // Auth context değerini hazırla
  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || !isInitialized, // İlklendirme tamamlanana kadar loading göster
    error,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth hook'u AuthProvider içinde kullanılmalıdır");
  }
  
  return context;
} 