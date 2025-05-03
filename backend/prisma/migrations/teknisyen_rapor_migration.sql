-- TeknisyenRaporDurum enum'ı oluştur
CREATE TYPE "TeknisyenRaporDurum" AS ENUM ('TASLAK', 'INCELENIYOR', 'ONAYLANDI', 'REDDEDILDI');

-- TeknisyenRapor tablosunu oluştur
CREATE TABLE "TeknisyenRapor" (
  "id" TEXT NOT NULL,
  "baslik" TEXT NOT NULL,
  "aciklama" TEXT,
  "durum" "TeknisyenRaporDurum" NOT NULL,
  "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "teknisyenId" TEXT NOT NULL,
  "projeId" TEXT,
  "siteId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeknisyenRapor_pkey" PRIMARY KEY ("id")
);

-- TeknisyenDokuman tablosunu oluştur
CREATE TABLE "TeknisyenDokuman" (
  "id" TEXT NOT NULL,
  "dosyaAdi" TEXT NOT NULL,
  "dosyaUrl" TEXT NOT NULL,
  "dosyaTipu" TEXT NOT NULL,
  "dosyaBoyutu" INTEGER NOT NULL,
  "raporId" TEXT NOT NULL,
  "yuklayanId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeknisyenDokuman_pkey" PRIMARY KEY ("id")
);

-- İlişkileri ekle
-- User -> TeknisyenRapor ilişkisi
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_teknisyenId_fkey" FOREIGN KEY ("teknisyenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Proje -> TeknisyenRapor ilişkisi
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_projeId_fkey" FOREIGN KEY ("projeId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Site -> TeknisyenRapor ilişkisi
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TeknisyenRapor -> TeknisyenDokuman ilişkisi
ALTER TABLE "TeknisyenDokuman" ADD CONSTRAINT "TeknisyenDokuman_raporId_fkey" FOREIGN KEY ("raporId") REFERENCES "TeknisyenRapor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User -> TeknisyenDokuman ilişkisi
ALTER TABLE "TeknisyenDokuman" ADD CONSTRAINT "TeknisyenDokuman_yuklayanId_fkey" FOREIGN KEY ("yuklayanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- İndexler
CREATE INDEX "TeknisyenRapor_teknisyenId_idx" ON "TeknisyenRapor"("teknisyenId");
CREATE INDEX "TeknisyenRapor_projeId_idx" ON "TeknisyenRapor"("projeId");
CREATE INDEX "TeknisyenRapor_siteId_idx" ON "TeknisyenRapor"("siteId");
CREATE INDEX "TeknisyenRapor_durum_idx" ON "TeknisyenRapor"("durum");
CREATE INDEX "TeknisyenDokuman_raporId_idx" ON "TeknisyenDokuman"("raporId");
CREATE INDEX "TeknisyenDokuman_yuklayanId_idx" ON "TeknisyenDokuman"("yuklayanId"); 