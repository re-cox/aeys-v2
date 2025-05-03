-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "annualLeaveAllowance" INTEGER DEFAULT 14,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "drivingLicense" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "militaryStatus" TEXT,
ADD COLUMN     "salary" DOUBLE PRECISION,
ADD COLUMN     "salaryVisibleTo" TEXT,
ADD COLUMN     "surname" TEXT;
