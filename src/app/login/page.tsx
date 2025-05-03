'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('[LoginPage] Submitting login form...', { email });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('[LoginPage] API Response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Giriş başarısız.');
      }

      // Başarılı giriş
      toast.success('Başarıyla giriş yapıldı!');
      console.log('[LoginPage] Login successful, calling auth context login...');

      // Context'e token ve kullanıcı bilgilerini gönder
      // API yanıtının data.token ve data.employee içerdiğini varsayıyoruz
      if (data.token && data.employee) {
        login(data.token, data.employee);
      } else {
        console.error("[LoginPage] Missing token or employee data in API response");
        throw new Error("Oturum bilgileri alınamadı.");
      }

    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      const errorMessage = err.message || 'Giriş sırasında bir hata oluştu.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AEYS Giriş</CardTitle>
          <CardDescription>Lütfen hesabınıza giriş yapın.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="eposta@adresiniz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>            
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Giriş Yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 