-- CreateEnum
CREATE TYPE "HakedisDurum" AS ENUM ('TASLAK', 'ONAY_BEKLIYOR', 'ONAYLANDI', 'ODENDI', 'REDDEDILDI', 'IPTAL_EDILDI');

-- CreateTable
CREATE TABLE "Hakedis" (
    "id" TEXT NOT NULL,
    "hakedisNo" TEXT NOT NULL,
    "projeId" TEXT NOT NULL,
    "aciklama" TEXT,
    "hakedisTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baslangicTarihi" TIMESTAMP(3) NOT NULL,
    "bitisTarihi" TIMESTAMP(3) NOT NULL,
    "tutar" DOUBLE PRECISION NOT NULL,
    "kdvOrani" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "kdvTutar" DOUBLE PRECISION NOT NULL,
    "toplamTutar" DOUBLE PRECISION NOT NULL,
    "paraBirimi" TEXT NOT NULL DEFAULT 'TRY',
    "durum" "HakedisDurum" NOT NULL DEFAULT 'TASLAK',
    "olusturanId" TEXT NOT NULL,
    "onaylayanId" TEXT,
    "onayTarihi" TIMESTAMP(3),
    "odemeTarihi" TIMESTAMP(3),
    "odemeKanali" TEXT,
    "odemeReferansNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hakedis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hakedis_hakedisNo_key" ON "Hakedis"("hakedisNo");

-- CreateIndex
CREATE INDEX "Hakedis_projeId_idx" ON "Hakedis"("projeId");

-- CreateIndex
CREATE INDEX "Hakedis_olusturanId_idx" ON "Hakedis"("olusturanId");

-- CreateIndex
CREATE INDEX "Hakedis_onaylayanId_idx" ON "Hakedis"("onaylayanId");

-- AddForeignKey
ALTER TABLE "Hakedis" ADD CONSTRAINT "Hakedis_projeId_fkey" FOREIGN KEY ("projeId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hakedis" ADD CONSTRAINT "Hakedis_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hakedis" ADD CONSTRAINT "Hakedis_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
