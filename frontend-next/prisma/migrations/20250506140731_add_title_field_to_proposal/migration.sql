/*
  Warnings:

  - You are about to drop the column `daysTaken` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `AnnualLeave` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AnnualLeave` table. All the data in the column will be lost.
  - The `status` column on the `AnnualLeave` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `assetId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentDate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `expectedReturnDate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `taxNumber` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `taxOffice` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `parentDepartmentId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `EdasNotificationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `EdasNotificationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `EdasNotificationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `EdasNotificationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `EdasNotificationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `annualLeaveAllowance` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `drivingLicense` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `hireDate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `militaryStatus` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `salaryVisibleTo` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `tcKimlikNo` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EmployeeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `EmployeeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `EmployeeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `EmployeeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EmployeeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `EmployeeDocument` table. All the data in the column will be lost.
  - The `uploadDate` column on the `EmployeeDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `actualEndDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `proposalNumber` on the `Proposal` table. All the data in the column will be lost.
  - You are about to alter the column `unitPrice` on the `ProposalItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to drop the column `departmentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `dosyaYolu` on the `TeknisyenDokuman` table. All the data in the column will be lost.
  - You are about to drop the column `yuklemeTarihi` on the `TeknisyenDokuman` table. All the data in the column will be lost.
  - You are about to drop the `AdditionalWork` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmergencyContact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketingActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectPhoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectTeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseRequestItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalaryPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeknisyenRaporu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkScheduleEmployee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaskAssignees` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[proposalNo]` on the table `Proposal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `AnnualLeave` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignDate` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedTo` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `date` on the `Attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `EdasNotification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `fileSize` to the `EdasNotificationDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `EdasNotificationDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `EdasNotificationDocument` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `documentType` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalFileName` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `createdById` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposalNo` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProposalItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `ProposalItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `createdById` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `priority` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `projectId` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dosyaTipu` to the `TeknisyenDokuman` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosyaUrl` to the `TeknisyenDokuman` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TeknisyenDokuman` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yuklayanId` to the `TeknisyenDokuman` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TeknisyenRaporDurum" AS ENUM ('TASLAK', 'INCELENIYOR', 'ONAYLANDI', 'REDDEDILDI');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LEAD', 'POTENTIAL');

-- CreateEnum
CREATE TYPE "ProgressPaymentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'PAID', 'PARTIALLY_PAID', 'REJECTED');

-- AlterEnum
ALTER TYPE "Currency" ADD VALUE 'GBP';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'STARTED';

-- DropForeignKey
ALTER TABLE "AdditionalWork" DROP CONSTRAINT "AdditionalWork_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "AdditionalWork" DROP CONSTRAINT "AdditionalWork_createdById_fkey";

-- DropForeignKey
ALTER TABLE "AnnualLeave" DROP CONSTRAINT "AnnualLeave_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_parentDepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_folderId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "EdasNotificationStep" DROP CONSTRAINT "EdasNotificationStep_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyContact" DROP CONSTRAINT "EmergencyContact_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDocument" DROP CONSTRAINT "EmployeeDocument_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "MarketingActivity" DROP CONSTRAINT "MarketingActivity_customerId_fkey";

-- DropForeignKey
ALTER TABLE "MarketingActivity" DROP CONSTRAINT "MarketingActivity_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_managerId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectFile" DROP CONSTRAINT "ProjectFile_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectFile" DROP CONSTRAINT "ProjectFile_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "ProjectPhoto" DROP CONSTRAINT "ProjectPhoto_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectPhoto" DROP CONSTRAINT "ProjectPhoto_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTeamMember" DROP CONSTRAINT "ProjectTeamMember_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTeamMember" DROP CONSTRAINT "ProjectTeamMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_customerId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_statusChangedById_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequestItem" DROP CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryPayment" DROP CONSTRAINT "SalaryPayment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "TeknisyenDokuman" DROP CONSTRAINT "TeknisyenDokuman_raporId_fkey";

-- DropForeignKey
ALTER TABLE "WorkSchedule" DROP CONSTRAINT "WorkSchedule_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "WorkScheduleEmployee" DROP CONSTRAINT "WorkScheduleEmployee_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "WorkScheduleEmployee" DROP CONSTRAINT "WorkScheduleEmployee_workScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "_TaskAssignees" DROP CONSTRAINT "_TaskAssignees_A_fkey";

-- DropForeignKey
ALTER TABLE "_TaskAssignees" DROP CONSTRAINT "_TaskAssignees_B_fkey";

-- DropIndex
DROP INDEX "AnnualLeave_employeeId_idx";

-- DropIndex
DROP INDEX "AnnualLeave_status_idx";

-- DropIndex
DROP INDEX "Assignment_assetId_idx";

-- DropIndex
DROP INDEX "Assignment_assignmentDate_idx";

-- DropIndex
DROP INDEX "Assignment_employeeId_idx";

-- DropIndex
DROP INDEX "Assignment_returnDate_idx";

-- DropIndex
DROP INDEX "Attendance_employeeId_date_key";

-- DropIndex
DROP INDEX "Customer_companyName_idx";

-- DropIndex
DROP INDEX "Customer_email_idx";

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Customer_taxNumber_idx";

-- DropIndex
DROP INDEX "Customer_taxNumber_key";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Department_parentDepartmentId_idx";

-- DropIndex
DROP INDEX "Document_documentType_idx";

-- DropIndex
DROP INDEX "Document_folderId_idx";

-- DropIndex
DROP INDEX "Document_uploadedById_idx";

-- DropIndex
DROP INDEX "EdasNotification_company_idx";

-- DropIndex
DROP INDEX "EdasNotification_refNo_idx";

-- DropIndex
DROP INDEX "EdasNotification_status_idx";

-- DropIndex
DROP INDEX "EdasNotificationDocument_documentType_idx";

-- DropIndex
DROP INDEX "EdasNotificationDocument_stepId_idx";

-- DropIndex
DROP INDEX "EdasNotificationStep_notificationId_idx";

-- DropIndex
DROP INDEX "EdasNotificationStep_stepType_idx";

-- DropIndex
DROP INDEX "Employee_departmentId_idx";

-- DropIndex
DROP INDEX "Employee_email_idx";

-- DropIndex
DROP INDEX "Employee_email_key";

-- DropIndex
DROP INDEX "Employee_name_idx";

-- DropIndex
DROP INDEX "Project_endDate_idx";

-- DropIndex
DROP INDEX "Project_managerId_idx";

-- DropIndex
DROP INDEX "Project_priority_idx";

-- DropIndex
DROP INDEX "Project_startDate_idx";

-- DropIndex
DROP INDEX "Project_status_idx";

-- DropIndex
DROP INDEX "Proposal_customerId_idx";

-- DropIndex
DROP INDEX "Proposal_proposalNumber_key";

-- DropIndex
DROP INDEX "Proposal_status_idx";

-- DropIndex
DROP INDEX "ProposalItem_proposalId_idx";

-- DropIndex
DROP INDEX "ProposalItem_type_idx";

-- DropIndex
DROP INDEX "Task_departmentId_idx";

-- DropIndex
DROP INDEX "Task_dueDate_idx";

-- DropIndex
DROP INDEX "Task_priority_idx";

-- DropIndex
DROP INDEX "Task_projectId_idx";

-- DropIndex
DROP INDEX "Task_status_idx";

-- DropIndex
DROP INDEX "TeknisyenDokuman_raporId_idx";

-- AlterTable
ALTER TABLE "AnnualLeave" DROP COLUMN "daysTaken",
DROP COLUMN "employeeId",
DROP COLUMN "notes",
DROP COLUMN "updatedAt",
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "startDate" SET DATA TYPE DATE,
ALTER COLUMN "endDate" SET DATA TYPE DATE,
DROP COLUMN "status",
ADD COLUMN     "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "assetId",
DROP COLUMN "assignmentDate",
DROP COLUMN "employeeId",
DROP COLUMN "expectedReturnDate",
DROP COLUMN "notes",
ADD COLUMN     "assignDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "assignedTo" TEXT NOT NULL,
ADD COLUMN     "inventoryId" TEXT NOT NULL,
ADD COLUMN     "isReturned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "employeeId",
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "date",
ADD COLUMN     "date" DATE NOT NULL,
ALTER COLUMN "hasOvertime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "city",
DROP COLUMN "companyName",
DROP COLUMN "contactName",
DROP COLUMN "district",
DROP COLUMN "notes",
DROP COLUMN "taxNumber",
DROP COLUMN "taxOffice",
DROP COLUMN "website",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "parentDepartmentId",
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "documentType",
DROP COLUMN "fileName",
DROP COLUMN "folderId",
DROP COLUMN "originalName",
DROP COLUMN "path",
DROP COLUMN "uploadedAt",
DROP COLUMN "uploadedById",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "EdasNotification" ADD COLUMN     "notes" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EdasNotificationDocument" DROP COLUMN "documentType",
DROP COLUMN "mimeType",
DROP COLUMN "originalName",
DROP COLUMN "path",
DROP COLUMN "size",
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "fileUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EdasNotificationStep" ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "address",
DROP COLUMN "annualLeaveAllowance",
DROP COLUMN "birthDate",
DROP COLUMN "bloodType",
DROP COLUMN "departmentId",
DROP COLUMN "drivingLicense",
DROP COLUMN "education",
DROP COLUMN "hireDate",
DROP COLUMN "iban",
DROP COLUMN "isActive",
DROP COLUMN "militaryStatus",
DROP COLUMN "password",
DROP COLUMN "phoneNumber",
DROP COLUMN "salary",
DROP COLUMN "salaryVisibleTo",
DROP COLUMN "tcKimlikNo",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfHire" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeDocument" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "size",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "url",
ADD COLUMN     "documentType" TEXT NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "fileSize" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalFileName" TEXT NOT NULL,
ADD COLUMN     "uploadedBy" TEXT NOT NULL,
DROP COLUMN "uploadDate",
ADD COLUMN     "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "actualEndDate",
DROP COLUMN "managerId",
DROP COLUMN "priority",
DROP COLUMN "progress",
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "departmentId" TEXT NOT NULL,
ADD COLUMN     "siteId" TEXT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "startDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "proposalNumber",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "proposalNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProposalItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "unitPrice" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "departmentId",
ADD COLUMN     "actualHours" DOUBLE PRECISION,
ADD COLUMN     "completedDate" TIMESTAMP(3),
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "estimatedHours" DOUBLE PRECISION,
ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT,
DROP COLUMN "priority",
ADD COLUMN     "priority" "Priority" NOT NULL,
ALTER COLUMN "projectId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeknisyenDokuman" DROP COLUMN "dosyaYolu",
DROP COLUMN "yuklemeTarihi",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dosyaTipu" TEXT NOT NULL,
ADD COLUMN     "dosyaUrl" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "yuklayanId" TEXT NOT NULL;

-- DropTable
DROP TABLE "AdditionalWork";

-- DropTable
DROP TABLE "Asset";

-- DropTable
DROP TABLE "EmergencyContact";

-- DropTable
DROP TABLE "Folder";

-- DropTable
DROP TABLE "MarketingActivity";

-- DropTable
DROP TABLE "ProjectFile";

-- DropTable
DROP TABLE "ProjectPhoto";

-- DropTable
DROP TABLE "ProjectTeamMember";

-- DropTable
DROP TABLE "PurchaseRequest";

-- DropTable
DROP TABLE "PurchaseRequestItem";

-- DropTable
DROP TABLE "SalaryPayment";

-- DropTable
DROP TABLE "TeknisyenRaporu";

-- DropTable
DROP TABLE "WorkSchedule";

-- DropTable
DROP TABLE "WorkScheduleEmployee";

-- DropTable
DROP TABLE "_TaskAssignees";

-- DropEnum
DROP TYPE "ActivityStatus";

-- DropEnum
DROP TYPE "ActivityType";

-- DropEnum
DROP TYPE "ApplicationType";

-- DropEnum
DROP TYPE "AssetCategory";

-- DropEnum
DROP TYPE "AssetStatus";

-- DropEnum
DROP TYPE "AyedasNotificationType";

-- DropEnum
DROP TYPE "BedasNotificationType";

-- DropEnum
DROP TYPE "DocumentCategory";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "ProjectPriority";

-- DropEnum
DROP TYPE "PurchaseRequestStatus";

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "WorkPriority";

-- DropEnum
DROP TYPE "WorkSchedulePriority";

-- DropEnum
DROP TYPE "WorkScheduleStatus";

-- DropEnum
DROP TYPE "WorkScheduleType";

-- DropEnum
DROP TYPE "WorkStatus";

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPayment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "paidAmount" DOUBLE PRECISION,
    "status" "ProgressPaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPaymentDocument" (
    "id" TEXT NOT NULL,
    "progressPaymentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPaymentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskAssignee" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskAssignee_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_TaskAssignee_B_index" ON "_TaskAssignee"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_proposalNo_key" ON "Proposal"("proposalNo");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualLeave" ADD CONSTRAINT "AnnualLeave_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualLeave" ADD CONSTRAINT "AnnualLeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisyenDokuman" ADD CONSTRAINT "TeknisyenDokuman_raporId_fkey" FOREIGN KEY ("raporId") REFERENCES "TeknisyenRapor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisyenDokuman" ADD CONSTRAINT "TeknisyenDokuman_yuklayanId_fkey" FOREIGN KEY ("yuklayanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_projeId_fkey" FOREIGN KEY ("projeId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisyenRapor" ADD CONSTRAINT "TeknisyenRapor_teknisyenId_fkey" FOREIGN KEY ("teknisyenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdasNotificationStep" ADD CONSTRAINT "EdasNotificationStep_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "EdasNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPayment" ADD CONSTRAINT "ProgressPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPaymentDocument" ADD CONSTRAINT "ProgressPaymentDocument_progressPaymentId_fkey" FOREIGN KEY ("progressPaymentId") REFERENCES "ProgressPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssignee" ADD CONSTRAINT "_TaskAssignee_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssignee" ADD CONSTRAINT "_TaskAssignee_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
