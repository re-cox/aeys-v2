import { TeknisyenRaporDurum as PrismaTeknisyenRaporDurum } from '@prisma/client';

// Prisma'daki enum ile eşleşmesi için TeknisyenRaporuDurum'u güncelleyelim
// export type TeknisyenRaporuDurum = PrismaTeknisyenRaporDurum;
// VEYA string literalleri koruyalım (API yanıtı string ise)
export type TeknisyenRaporuDurum =
  | "Beklemede"
  | "Fiyatlar Girildi"
  | "Fatura Kesildi"
  | "İptal Edildi";

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
  id: string;         // Prisma'dan
  dosyaAdi: string;    // Prisma'dan
  dosyaUrl: string;    // Prisma'dan (dosyaYolu yerine)
  dosyaTipu: string;   // Prisma'dan (eklendi)
  dosyaBoyutu: number; // Prisma'dan (Int -> number)
  raporId: string;     // Prisma'dan
  yukleyenId: string;  // Prisma'dan (eklendi)
  createdAt: string;   // Prisma'dan (DateTime -> string, API yanıtına göre Date olabilir)
  updatedAt: string;   // Prisma'dan (DateTime -> string, API yanıtına göre Date olabilir)
}

// TeknisyenRaporu tipini Prisma modeline göre güncelle
export interface TeknisyenRaporu {
  id: string;            // Prisma'dan
  baslik: string;        // Prisma'dan (isinAdi yerine)
  aciklama?: string;      // Prisma'dan
  durum: TeknisyenRaporuDurum; // Prisma enum veya string literal
  tarih: string;         // Prisma'dan (DateTime -> string, baslangicTarihi yerine)
  teknisyenId: string;   // Prisma'dan (teknisyenNo yerine, User ID'si)
  projeId?: string;       // Prisma'dan
  siteId?: string;        // Prisma'dan
  createdAt: string;     // Prisma'dan (DateTime -> string, olusturulmaTarihi yerine)
  updatedAt: string;     // Prisma'dan (DateTime -> string, guncellemeTarihi yerine)
  dokumanlar?: TeknisyenDokuman[]; // Prisma ilişki
  // personeller alanı kaldırıldı, teknisyenId kullanılıyor.
  // Gerekirse teknisyen objesi eklenebilir: teknisyen?: Personel;
} 