import { PrismaClient } from '@prisma/client';

// PrismaClient için global tip tanımlama
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Veritabanı bağlantısını test et (employees/route.ts'den taşındı)
export async function testDatabaseConnection() {
  try {
    console.log("[DATABASE] Veritabanı bağlantısı test ediliyor...");
    // Basit bir sorgu dene
    await prisma.$queryRaw`SELECT 1`; // Sadece bağlantıyı test et, sonuç önemli değil
    console.log("[DATABASE] Veritabanı bağlantısı başarılı.");
    return true;
  } catch (error) {
    console.error("[DATABASE] Veritabanı bağlantı hatası:", error);
    return false;
  }
}

// Uygulama başladığında bağlantıyı test et (opsiyonel, sunucu başlangıcında log için)
// testDatabaseConnection(); // Gerekirse aktifleştirilebilir, ancak API rotalarında çağırmak daha yaygın

export default prisma; 