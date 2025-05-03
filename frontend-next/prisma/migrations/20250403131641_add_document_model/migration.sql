-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'REPORT', 'INVOICE', 'PERMIT', 'DRAWING', 'TECHNICAL', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PROJECT', 'CUSTOMER', 'EMPLOYEE', 'FINANCIAL', 'LEGAL', 'TECHNICAL', 'GENERAL');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "title" TEXT,
    "description" TEXT,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "category" "DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[],
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_uploadedAt_idx" ON "Document"("uploadedAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
