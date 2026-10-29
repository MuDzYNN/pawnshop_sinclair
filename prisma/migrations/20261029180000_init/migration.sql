-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_EMPLOYEES', 'MANAGE_RANKS', 'MANAGE_ITEMS', 'MANAGE_WEBHOOKS', 'VIEW_BUYBACKS', 'VIEW_LOGS', 'CREATE_BUYBACKS', 'MANAGE_ALIASES', 'MANAGE_IGNORED', 'CREATE_SALES', 'VIEW_SALES', 'SETTLE_SALES');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'SETTLED');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('CONTACT', 'BUYBACK');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_MOVED', 'ITEM_DELETED', 'ALIAS_CREATED', 'ALIAS_DELETED', 'IGNORED_CREATED', 'IGNORED_DELETED', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_ACTIVATED', 'EMPLOYEE_DEACTIVATED', 'RANK_CREATED', 'RANK_UPDATED', 'RANK_MOVED', 'RANK_DELETED', 'WEBHOOK_UPDATED', 'WEBHOOK_DELETED', 'WEBHOOK_TESTED', 'BUYBACK_COMPLETED', 'SALE_COMPLETED', 'SALE_SETTLED', 'SALE_REOPENED', 'LOGIN', 'LOGIN_DENIED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_alias" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ignored_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ignored_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "bonusPercent" DOUBLE PRECISION NOT NULL,
    "bonusAmount" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "payout" INTEGER NOT NULL,
    "saleValue" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_line" (
    "id" TEXT NOT NULL,
    "buybackId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,

    CONSTRAINT "buyback_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "settledById" TEXT,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_line" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,

    CONSTRAINT "sale_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook" (
    "event" "WebhookEvent" NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("event")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rank_name_key" ON "rank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_discordId_key" ON "employee"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- CreateIndex
CREATE INDEX "employee_rankId_idx" ON "employee"("rankId");

-- CreateIndex
CREATE INDEX "item_position_idx" ON "item"("position");

-- CreateIndex
CREATE UNIQUE INDEX "item_name_note_key" ON "item"("name", "note");

-- CreateIndex
CREATE UNIQUE INDEX "item_alias_name_key" ON "item_alias"("name");

-- CreateIndex
CREATE INDEX "item_alias_itemId_idx" ON "item_alias"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ignored_item_name_key" ON "ignored_item"("name");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_number_key" ON "buyback"("number");

-- CreateIndex
CREATE INDEX "buyback_employeeId_idx" ON "buyback"("employeeId");

-- CreateIndex
CREATE INDEX "buyback_createdAt_idx" ON "buyback"("createdAt");

-- CreateIndex
CREATE INDEX "buyback_payout_idx" ON "buyback"("payout");

-- CreateIndex
CREATE INDEX "buyback_profit_idx" ON "buyback"("profit");

-- CreateIndex
CREATE INDEX "buyback_line_buybackId_idx" ON "buyback_line"("buybackId");

-- CreateIndex
CREATE INDEX "buyback_line_itemId_idx" ON "buyback_line"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_number_key" ON "sale"("number");

-- CreateIndex
CREATE INDEX "sale_employeeId_idx" ON "sale"("employeeId");

-- CreateIndex
CREATE INDEX "sale_createdAt_idx" ON "sale"("createdAt");

-- CreateIndex
CREATE INDEX "sale_status_idx" ON "sale"("status");

-- CreateIndex
CREATE INDEX "sale_value_idx" ON "sale"("value");

-- CreateIndex
CREATE INDEX "sale_line_saleId_idx" ON "sale_line"("saleId");

-- CreateIndex
CREATE INDEX "sale_line_itemId_idx" ON "sale_line"("itemId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_employeeId_idx" ON "audit_log"("employeeId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_alias" ADD CONSTRAINT "item_alias_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback" ADD CONSTRAINT "buyback_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_line" ADD CONSTRAINT "buyback_line_buybackId_fkey" FOREIGN KEY ("buybackId") REFERENCES "buyback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_line" ADD CONSTRAINT "buyback_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_line" ADD CONSTRAINT "sale_line_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_line" ADD CONSTRAINT "sale_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Default ranks
INSERT INTO "rank" ("id", "name", "position", "permissions", "updatedAt") VALUES
    ('rank_wlasciciel', 'Właściciel', 0, ARRAY['MANAGE_EMPLOYEES', 'MANAGE_RANKS', 'MANAGE_ITEMS', 'MANAGE_WEBHOOKS', 'VIEW_BUYBACKS', 'VIEW_LOGS', 'CREATE_BUYBACKS', 'MANAGE_ALIASES', 'MANAGE_IGNORED', 'CREATE_SALES', 'VIEW_SALES', 'SETTLE_SALES']::"Permission"[], CURRENT_TIMESTAMP),
    ('rank_manager', 'Manager', 1, ARRAY['MANAGE_EMPLOYEES', 'MANAGE_ITEMS', 'VIEW_BUYBACKS', 'CREATE_BUYBACKS', 'MANAGE_ALIASES', 'MANAGE_IGNORED', 'CREATE_SALES']::"Permission"[], CURRENT_TIMESTAMP),
    ('rank_pawnbroker', 'Pawnbroker', 2, ARRAY['CREATE_BUYBACKS', 'CREATE_SALES']::"Permission"[], CURRENT_TIMESTAMP);
