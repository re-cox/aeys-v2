-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'SITE_VISIT', 'POTENTIAL_VISIT', 'FOLLOW_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED', 'NEEDS_FOLLOW_UP');

-- CreateTable
CREATE TABLE "MarketingActivity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'COMPLETED',
    "activityDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "outcome" TEXT,
    "nextStep" TEXT,
    "nextStepDate" TIMESTAMP(3),
    "locationLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "MarketingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingActivity_customerId_idx" ON "MarketingActivity"("customerId");

-- CreateIndex
CREATE INDEX "MarketingActivity_employeeId_idx" ON "MarketingActivity"("employeeId");

-- CreateIndex
CREATE INDEX "MarketingActivity_activityDate_idx" ON "MarketingActivity"("activityDate");

-- CreateIndex
CREATE INDEX "MarketingActivity_type_idx" ON "MarketingActivity"("type");

-- CreateIndex
CREATE INDEX "MarketingActivity_status_idx" ON "MarketingActivity"("status");

-- AddForeignKey
ALTER TABLE "MarketingActivity" ADD CONSTRAINT "MarketingActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingActivity" ADD CONSTRAINT "MarketingActivity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
