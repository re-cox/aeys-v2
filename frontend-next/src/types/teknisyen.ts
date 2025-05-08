import { TeknisyenRaporDurum as PrismaTeknisyenRaporDurum } from '@prisma/client';

// Backend'deki enum değerleriyle uyumlu olacak şekilde güncelliyoruz
export type TeknisyenRaporuDurum =
  | "TASLAK"
  | "INCELENIYOR"
  | "ONAYLANDI"
  | "REDDEDILDI";

// UI'da görüntülenecek durum metinleri için yardımcı fonksiyon
export const getDurumText = (durum: TeknisyenRaporuDurum): string => {
  const durumMap: Record<TeknisyenRaporuDurum, string> = {
    "TASLAK": "Beklemede",
    "INCELENIYOR": "Fiyatlar Girildi",
    "ONAYLANDI": "Fatura Kesildi",
    "REDDEDILDI": "İptal Edildi"
  };
  return durumMap[durum] || durum;
};

// Backend durum değerinden UI durum değerine dönüştürme
export const getUIDurumFromBackend = (backendDurum: string): TeknisyenRaporuDurum => {
  // Önce büyük harfe çevirelim
  const upperDurum = backendDurum.toUpperCase();
  
  // Geçerli değer mi kontrol edelim
  if (upperDurum === "TASLAK" || 
      upperDurum === "INCELENIYOR" || 
      upperDurum === "ONAYLANDI" || 
      upperDurum === "REDDEDILDI") {
    return upperDurum as TeknisyenRaporuDurum;
  }
  
  // Geçersizse varsayılan değeri döndürelim
  return "TASLAK";
};

// Bu dosyadaki Personel tanımı genel bir User/Employee olabilir,
// Ayrı bir types/personnel.ts veya types/user.ts dosyasına taşınabilir.
export interface Personel {
  id: string;
  name: string; // Prisma User modelinden
  surname?: string; // Prisma User modelinden
  email?: string; // Prisma User modelinden
  // Diğer gerekli alanlar User/Employee modelinden eklenebilir
}

// TeknisyenDokuman tipini Prisma modeline göre güncelle
export interface TeknisyenDokuman {
  id: string;
  dosyaAdi: string;
  dosyaUrl: string; // Bazı yerlerde dosyaYolu olarak kullanılıyor olabilir
  dosyaYolu?: string; // Uyumluluk için dosyaUrl'in alternatifi
  dosyaTipu: string;
  dosyaBoyutu: number;
  createdAt: string;
  raporId: string;
  
  // API yanıtında olabilecek diğer alanlar
  yuklemeTarihi?: string | Date;
}

// TeknisyenRaporu tipini hem Prisma modeli hem de form alanlarına göre güncelle
export interface TeknisyenRaporu {
  id: string;            // Prisma'dan
  baslik: string;        // Prisma'dan (form içinde isinAdi olarak kullanılıyor)
  aciklama?: string;      // Prisma'dan
  durum: TeknisyenRaporuDurum; // Prisma enum veya string literal
  tarih: string;         // Prisma'dan (DateTime -> string, form içinde baslangicTarihi olarak kullanılıyor)
  teknisyenId: string;   // Prisma'dan (form içinde teknisyenNo olarak kullanılıyor)
  projeId?: string;       // Prisma'dan
  siteId?: string;        // Prisma'dan
  createdAt: string;     // Prisma'dan (DateTime -> string)
  updatedAt: string;     // Prisma'dan (DateTime -> string)
  dokumanlar?: TeknisyenDokuman[]; // Prisma ilişki
  
  // İlişkiler
  teknisyen?: Personel;  // Backend'teki teknisyen ilişkisi
  proje?: {              // Backend'teki proje ilişkisi
    id: string;
    name: string;
  };
  site?: {               // Backend'teki site ilişkisi
    id: string;
    name: string;
  };
  
  // Form tarafından kullanılan ekstra alanlar (runtime'da mevcut olabilir)
  isinAdi?: string;       // UI için gerekli (baslik'ın alternatifi)
  teknisyenNo?: string;   // UI için gerekli (teknisyenId'nin alternatifi)
  baslangicTarihi?: string | Date; // UI için gerekli (tarih'in alternatifi)
  bitisTarihi?: string | Date; // UI için gerekli
  personeller?: string[]; // UI için gerekli
  
  // API'den gelen alanlar (frontend API ve veritabanı farklılıklarını gidermek için)
  olusturulmaTarihi?: string | Date; // createdAt'in alternatifi
  guncellemeTarihi?: string | Date; // updatedAt'in alternatifi
} 