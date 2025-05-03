-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "AdditionalWork" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "compensation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdditionalWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdditionalWork_assignedToId_idx" ON "AdditionalWork"("assignedToId");

-- CreateIndex
CREATE INDEX "AdditionalWork_createdById_idx" ON "AdditionalWork"("createdById");

-- CreateIndex
CREATE INDEX "AdditionalWork_status_idx" ON "AdditionalWork"("status");

-- CreateIndex
CREATE INDEX "AdditionalWork_priority_idx" ON "AdditionalWork"("priority");

-- AddForeignKey
ALTER TABLE "AdditionalWork" ADD CONSTRAINT "AdditionalWork_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalWork" ADD CONSTRAINT "AdditionalWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
