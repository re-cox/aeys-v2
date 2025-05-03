/*
  Warnings:

  - You are about to drop the column `departmentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EmergencyContact` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `EmployeeDocument` table without a default value. This is not possible if the table is not empty.
  - Made the column `size` on table `EmployeeDocument` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "EmergencyContact" DROP CONSTRAINT "EmergencyContact_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departmentId_fkey";

-- DropIndex
DROP INDEX "Employee_iban_key";

-- DropIndex
DROP INDEX "Employee_phoneNumber_key";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ALTER COLUMN "hireDate" SET DATA TYPE DATE,
ALTER COLUMN "birthDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "EmployeeDocument" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "size" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "departmentId";

-- DropTable
DROP TABLE "EmergencyContact";

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
