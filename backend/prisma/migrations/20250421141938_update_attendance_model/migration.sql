/*
  Warnings:

  - You are about to drop the column `checkIn` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOut` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `isOvertime` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Attendance` table. All the data in the column will be lost.
  - Added the required column `date` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "checkIn",
DROP COLUMN "checkOut",
DROP COLUMN "isOvertime",
DROP COLUMN "note",
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "hasOvertime" BOOLEAN DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "overtimeEnd" TEXT,
ADD COLUMN     "overtimeStart" TEXT,
ADD COLUMN     "status" TEXT NOT NULL;
