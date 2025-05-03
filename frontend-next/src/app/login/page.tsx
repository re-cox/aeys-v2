"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [loginAttempt, setLoginAttempt] = useState(false);

  // Sayfa yüklendiğinde token kontrolü yap
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Token varsa ana sayfaya yönlendir
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Email ve şifre alanları zorunludur.");
      return;
    }
    
    try {
      setLoginAttempt(true);
      console.log("Giriş başlatılıyor...");
      
      await login(email, password);
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Giriş başarılı olduğu halde token kaydedilmedi!");
        toast.error("Oturum kaydedilemedi, lütfen tekrar deneyin");
        return;
      }
      
      console.log("Giriş işlemi tamamlandı, yönlendiriliyor");
      
      // Kayıtlı yönlendirme URL'ini kontrol et
      const redirectUrl = localStorage.getItem('redirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('redirectUrl'); // URL'i temizle
        router.push(redirectUrl); // Kayıtlı URL'e yönlendir
      } else {
        router.push('/dashboard'); // Varsayılan olarak dashboard'a yönlendir
      }
    } catch (error) {
      console.error("Giriş hatası:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        // Server tarafından dönen hata mesajını göster
        const errorMessage = error.response.data?.message || "Bilinmeyen bir hata oluştu";
        toast.error(`Giriş yapılamadı: ${errorMessage}`);
      } else {
        // Genel hata mesajı
        toast.error("Giriş yapılamadı. Lütfen email ve şifrenizi kontrol edin.");
      }
    } finally {
      setLoginAttempt(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Giriş Yap</h1>
          <p className="text-gray-600">
            Aydem Elektrik Yönetim Sistemine hoş geldiniz
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="ornek@aydem.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || loginAttempt}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Şifre</label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Şifremi Unuttum
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || loginAttempt}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading || loginAttempt}
          >
            {isLoading || loginAttempt ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş Yapılıyor...
              </span>
            ) : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
} 