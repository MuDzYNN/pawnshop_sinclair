-- CreateEnum
CREATE TYPE "ClientEntryType" AS ENUM ('DEPOSIT', 'BUYBACK', 'ADJUSTMENT');

-- AlterEnum
ALTER TYPE "Permission" ADD VALUE 'MANAGE_CLIENTS';
ALTER TYPE "Permission" ADD VALUE 'USE_CLIENTS';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_DEPOSIT';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_ADJUSTED';

-- AlterTable
ALTER TABLE "buyback" ADD COLUMN     "balancePayout" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_entry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ClientEntryType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "buybackId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_name_idx" ON "client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_entry_buybackId_key" ON "client_entry"("buybackId");

-- CreateIndex
CREATE INDEX "client_entry_clientId_createdAt_idx" ON "client_entry"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "client_entry_employeeId_idx" ON "client_entry"("employeeId");

-- AddForeignKey
ALTER TABLE "client_entry" ADD CONSTRAINT "client_entry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_entry" ADD CONSTRAINT "client_entry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_entry" ADD CONSTRAINT "client_entry_buybackId_fkey" FOREIGN KEY ("buybackId") REFERENCES "buyback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
