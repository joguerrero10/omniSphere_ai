/*
  Warnings:

  - Added the required column `createdBy` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
