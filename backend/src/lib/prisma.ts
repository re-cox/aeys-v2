import { PrismaClient } from '@prisma/client';

// PrismaClient örneğini global olarak tanımla
// Bu, hot-reloading durumunda birden fazla bağlantı oluşmasını engeller
declare global {
  var prisma: PrismaClient | undefined;
}

// Geliştirme ortamında global nesne üzerinden Prisma'yı kullan
// Üretim ortamında ise her zaman yeni bir örnek oluştur
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Development ortamında global nesneyi kullan
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 