-- AlterEnum
ALTER TYPE "Permission" ADD VALUE 'VIEW_RESTRICTED_ITEMS';

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "restricted" BOOLEAN NOT NULL DEFAULT false;

-- Owner sees restricted items from the start
UPDATE "rank" SET "permissions" = array_append("permissions", 'VIEW_RESTRICTED_ITEMS') WHERE "name" = 'Właściciel';
