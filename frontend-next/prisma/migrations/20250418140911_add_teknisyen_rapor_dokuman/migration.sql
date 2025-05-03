-- AlterTable
ALTER TABLE "AdditionalWork" ADD COLUMN     "technicianNumber" TEXT;

-- CreateTable
CREATE TABLE "TeknisyenRaporu" (
    "id" TEXT NOT NULL,
    "isinAdi" TEXT NOT NULL,
    "teknisyenNo" TEXT NOT NULL,
    "durum" TEXT NOT NULL,
    "baslangicTarihi" TIMESTAMP(3) NOT NULL,
    "bitisTarihi" TIMESTAMP(3),
    "olusturulmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" TIMESTAMP(3),
    "personeller" TEXT[],

    CONSTRAINT "TeknisyenRaporu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeknisyenDokuman" (
    "id" TEXT NOT NULL,
    "dosyaAdi" TEXT NOT NULL,
    "dosyaYolu" TEXT NOT NULL,
    "dosyaBoyutu" INTEGER NOT NULL,
    "yuklemeTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raporId" TEXT NOT NULL,

    CONSTRAINT "TeknisyenDokuman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeknisyenRaporu_teknisyenNo_idx" ON "TeknisyenRaporu"("teknisyenNo");

-- CreateIndex
CREATE INDEX "TeknisyenRaporu_durum_idx" ON "TeknisyenRaporu"("durum");

-- CreateIndex
CREATE INDEX "TeknisyenDokuman_raporId_idx" ON "TeknisyenDokuman"("raporId");

-- AddForeignKey
ALTER TABLE "TeknisyenDokuman" ADD CONSTRAINT "TeknisyenDokuman_raporId_fkey" FOREIGN KEY ("raporId") REFERENCES "TeknisyenRaporu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
