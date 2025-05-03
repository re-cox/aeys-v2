/*
  Warnings:

  - You are about to drop the column `approvedBy` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `totalDays` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `annualLeaveAllowance` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `drivingLicense` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `identityNumber` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `militaryStatus` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `salaryVisibleTo` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Employee` table. All the data in the column will be lost.
  - The `hireDate` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `description` on the `MarketingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `locationLink` on the `MarketingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `nextStep` on the `MarketingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `nextStepDate` on the `MarketingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MarketingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `MarketingActivity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `daysTaken` to the `AnnualLeave` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `details` to the `MarketingActivity` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `MarketingActivity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "MarketingActivity" DROP CONSTRAINT "MarketingActivity_customerId_fkey";

-- DropIndex
DROP INDEX "Document_category_idx";

-- DropIndex
DROP INDEX "Document_type_idx";

-- DropIndex
DROP INDEX "Document_uploadedAt_idx";

-- DropIndex
DROP INDEX "MarketingActivity_status_idx";

-- DropIndex
DROP INDEX "MarketingActivity_type_idx";

-- AlterTable
ALTER TABLE "AnnualLeave" DROP COLUMN "approvedBy",
DROP COLUMN "createdAt",
DROP COLUMN "reason",
DROP COLUMN "totalDays",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "daysTaken" INTEGER NOT NULL,
ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "parentDepartmentId" TEXT;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "fileSize",
DROP COLUMN "fileType",
DROP COLUMN "fileUrl",
DROP COLUMN "tags",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "documentType" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "annualLeaveAllowance",
DROP COLUMN "birthDate",
DROP COLUMN "bloodType",
DROP COLUMN "createdAt",
DROP COLUMN "drivingLicense",
DROP COLUMN "education",
DROP COLUMN "identityNumber",
DROP COLUMN "militaryStatus",
DROP COLUMN "phone",
DROP COLUMN "profileImage",
DROP COLUMN "salary",
DROP COLUMN "salaryVisibleTo",
DROP COLUMN "surname",
DROP COLUMN "updatedAt",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "profilePictureUrl" TEXT,
ADD COLUMN     "tcKimlikNo" TEXT,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "position" DROP NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
DROP COLUMN "hireDate",
ADD COLUMN     "hireDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MarketingActivity" DROP COLUMN "description",
DROP COLUMN "locationLink",
DROP COLUMN "nextStep",
DROP COLUMN "nextStepDate",
DROP COLUMN "status",
DROP COLUMN "title",
ADD COLUMN     "details" TEXT NOT NULL,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "estimatedPrice" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNumber_key" ON "PurchaseRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requesterId_idx" ON "PurchaseRequest"("requesterId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_departmentId_idx" ON "PurchaseRequest"("departmentId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_purchaseRequestId_idx" ON "PurchaseRequestItem"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "AnnualLeave_employeeId_idx" ON "AnnualLeave"("employeeId");

-- CreateIndex
CREATE INDEX "AnnualLeave_status_idx" ON "AnnualLeave"("status");

-- CreateIndex
CREATE INDEX "Department_parentDepartmentId_idx" ON "Department"("parentDepartmentId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Task_departmentId_idx" ON "Task"("departmentId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingActivity" ADD CONSTRAINT "MarketingActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
