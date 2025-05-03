-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('MAINTENANCE', 'MEETING', 'TRAINING', 'SITE_VISIT', 'INSTALLATION', 'REPAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkScheduleStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "WorkSchedulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('COMPUTER', 'LAPTOP', 'MONITOR', 'PHONE', 'VEHICLE', 'FURNITURE', 'EQUIPMENT', 'SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('NIHAI_BAGLANTI', 'SANTIYE');

-- CreateEnum
CREATE TYPE "AyedasNotificationType" AS ENUM ('IC_TESISAT_PROJESI', 'BAGLANTI_GORUSU', 'BAGLANTI_HATTI_TESISI', 'BAGLANTI_BEDELI', 'DAGITIM_BAGLANTI_ANLASMASI', 'SAYAC_MONTAJ_BEDELI', 'GECICI_KABUL', 'TESISAT_MUAYENE', 'TESISAT');

-- CreateEnum
CREATE TYPE "BedasNotificationType" AS ENUM ('PROJE', 'PROJE_ONAYI', 'ODEME', 'TESISAT', 'IS_EMRI', 'SAYAC');

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "type" "WorkScheduleType" NOT NULL,
    "status" "WorkScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "WorkSchedulePriority" NOT NULL DEFAULT 'MEDIUM',
    "departmentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkScheduleEmployee" (
    "id" TEXT NOT NULL,
    "workScheduleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT,
    "isResponsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkScheduleEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "assetTag" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "warrantyExpiry" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL,
    "expectedReturnDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdasNotification" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "projectName" TEXT,
    "applicationType" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "parcelBlock" TEXT,
    "parcelNo" TEXT,
    "company" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdasNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdasNotificationStep" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "refNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdasNotificationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdasNotificationDocument" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdasNotificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSchedule_departmentId_idx" ON "WorkSchedule"("departmentId");

-- CreateIndex
CREATE INDEX "WorkSchedule_type_idx" ON "WorkSchedule"("type");

-- CreateIndex
CREATE INDEX "WorkSchedule_status_idx" ON "WorkSchedule"("status");

-- CreateIndex
CREATE INDEX "WorkSchedule_priority_idx" ON "WorkSchedule"("priority");

-- CreateIndex
CREATE INDEX "WorkSchedule_startDate_idx" ON "WorkSchedule"("startDate");

-- CreateIndex
CREATE INDEX "WorkSchedule_endDate_idx" ON "WorkSchedule"("endDate");

-- CreateIndex
CREATE INDEX "WorkScheduleEmployee_workScheduleId_idx" ON "WorkScheduleEmployee"("workScheduleId");

-- CreateIndex
CREATE INDEX "WorkScheduleEmployee_employeeId_idx" ON "WorkScheduleEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleEmployee_workScheduleId_employeeId_key" ON "WorkScheduleEmployee"("workScheduleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_assetTag_idx" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_serialNumber_idx" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Assignment_assetId_idx" ON "Assignment"("assetId");

-- CreateIndex
CREATE INDEX "Assignment_employeeId_idx" ON "Assignment"("employeeId");

-- CreateIndex
CREATE INDEX "Assignment_assignmentDate_idx" ON "Assignment"("assignmentDate");

-- CreateIndex
CREATE INDEX "Assignment_returnDate_idx" ON "Assignment"("returnDate");

-- CreateIndex
CREATE UNIQUE INDEX "EdasNotification_refNo_key" ON "EdasNotification"("refNo");

-- CreateIndex
CREATE INDEX "EdasNotification_company_idx" ON "EdasNotification"("company");

-- CreateIndex
CREATE INDEX "EdasNotification_status_idx" ON "EdasNotification"("status");

-- CreateIndex
CREATE INDEX "EdasNotification_refNo_idx" ON "EdasNotification"("refNo");

-- CreateIndex
CREATE INDEX "EdasNotificationStep_notificationId_idx" ON "EdasNotificationStep"("notificationId");

-- CreateIndex
CREATE INDEX "EdasNotificationStep_stepType_idx" ON "EdasNotificationStep"("stepType");

-- CreateIndex
CREATE INDEX "EdasNotificationDocument_stepId_idx" ON "EdasNotificationDocument"("stepId");

-- CreateIndex
CREATE INDEX "EdasNotificationDocument_documentType_idx" ON "EdasNotificationDocument"("documentType");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkScheduleEmployee" ADD CONSTRAINT "WorkScheduleEmployee_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkScheduleEmployee" ADD CONSTRAINT "WorkScheduleEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdasNotificationStep" ADD CONSTRAINT "EdasNotificationStep_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "EdasNotification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdasNotificationDocument" ADD CONSTRAINT "EdasNotificationDocument_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "EdasNotificationStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
