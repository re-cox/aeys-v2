"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
};

// Korumalı olmayan sayfalar
const PUBLIC_PATHS = ['/login', '/forgot-password'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRouteChecked, setIsRouteChecked] = useState(false);
  
  // Şu anki yolun genel veya korumalı olduğunu belirle
  const currentPath = pathname || '';
  const isPublicPath = PUBLIC_PATHS.includes(currentPath);
  
  // URL'e göre kullanıcı yönlendirme
  useEffect(() => {
    if (isLoading) {
      // Yükleme devam ederken hiçbir işlem yapma
      return;
    }
    
    const handleNavigation = async () => {
      try {
        // Token kontrolü - localStorage'da token varsa API'den kullanıcıyı kontrol et
        if (!user && !isPublicPath) {
          const token = localStorage.getItem('token');
          if (token) {
            console.log('[AuthGuard] Token var ama kullanıcı nesnesi yok, kullanıcı bilgilerini yeniliyorum');
            // User state'i olmasa bile token varsa, oturum bilgilerini yenilemeyi dene
            await refreshUser();
            // Bu noktalarda hala user null ise, token geçerli değildir - bu durumu refreshUser fonksiyonu ele alır
          } else {
            console.log('[AuthGuard] Token ve kullanıcı nesnesi yok, login sayfasına yönlendiriliyor');
            router.push('/login');
          }
        } 
        // Kullanıcı oturum açmışsa ve genel sayfadaysa, dashboard'a yönlendir
        else if (user && isPublicPath) {
          console.log('[AuthGuard] Kullanıcı oturum açmış ve genel sayfada, anasayfaya yönlendiriliyor');
          router.push('/dashboard');
        }
        
        setIsRouteChecked(true);
      } catch (error) {
        console.error('[AuthGuard] Yönlendirme hatası:', error);
        setIsRouteChecked(true);
      }
    };
    
    handleNavigation();
  }, [user, isLoading, isPublicPath, router, refreshUser]);

  // Yükleme durumunu göster
  if (isLoading || !isRouteChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Erişim kontrolü
  if (isPublicPath || user) {
    return <>{children}</>;
  }
  
  // Kontroller sona erdi, token yok ve korumalı sayfadayken loading göster
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Oturum bilgileriniz kontrol ediliyor...</p>
      </div>
    </div>
  );
} 