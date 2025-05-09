-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TeknisyenRaporDurum" ADD VALUE 'BEKLEMEDE';
ALTER TYPE "TeknisyenRaporDurum" ADD VALUE 'FIYATLAR_GIRILDI';
ALTER TYPE "TeknisyenRaporDurum" ADD VALUE 'FATURA_KESILDI';
ALTER TYPE "TeknisyenRaporDurum" ADD VALUE 'IPTAL_EDILDI';

-- AlterTable
ALTER TABLE "TeknisyenRapor" ADD COLUMN     "bitisTarihi" TIMESTAMP(3);
