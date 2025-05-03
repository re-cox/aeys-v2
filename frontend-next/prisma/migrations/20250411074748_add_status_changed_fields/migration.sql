/*
  Warnings:

  - The values [ORDERED,PARTIAL,COMPLETED] on the enum `PurchaseRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PurchaseRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_COMPLETED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" TYPE "PurchaseRequestStatus_new" USING ("status"::text::"PurchaseRequestStatus_new");
ALTER TYPE "PurchaseRequestStatus" RENAME TO "PurchaseRequestStatus_old";
ALTER TYPE "PurchaseRequestStatus_new" RENAME TO "PurchaseRequestStatus";
DROP TYPE "PurchaseRequestStatus_old";
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "PurchaseRequest" ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusChangedById" TEXT;

-- CreateIndex
CREATE INDEX "PurchaseRequest_statusChangedById_idx" ON "PurchaseRequest"("statusChangedById");

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_statusChangedById_fkey" FOREIGN KEY ("statusChangedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
