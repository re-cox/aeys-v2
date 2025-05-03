'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata günlüğe kaydedilir
    console.error('Uygulama hatası:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bir Sorun Oluştu
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          İşleminiz sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya destek ekibimizle iletişime geçin.
        </p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-left text-xs mb-4 overflow-auto max-h-32">
          {error?.message || 'Bilinmeyen hata'}
        </pre>
        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="mb-2 sm:mb-0"
          >
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
          <Button 
            onClick={() => reset()} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    </div>
  );
} 