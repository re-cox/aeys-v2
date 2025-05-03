import dotenv from 'dotenv';
import path from 'path';

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Çevre değişkenleri için tip tanımı
interface Env {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

// Çevre değişkenlerini tanımla
export const env: Env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aeys',
  JWT_SECRET: process.env.JWT_SECRET || 'aydem-elektrik-yonetim-sistemi-gizli-anahtar-2024',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// Çevre değişkenlerini kontrol et
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL çevre değişkeni tanımlanmamış!');
  process.exit(1);
}

if (!env.JWT_SECRET) {
  console.error('JWT_SECRET çevre değişkeni tanımlanmamış!');
  process.exit(1);
}

console.log(`[Environment] NODE_ENV: ${env.NODE_ENV}`);
console.log(`[Environment] PORT: ${env.PORT}`);
console.log(`[Environment] FRONTEND_URL: ${env.FRONTEND_URL}`); 