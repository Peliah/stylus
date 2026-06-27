-- CreateEnum
CREATE TYPE "CommandActor" AS ENUM ('CUSTOMER', 'VENDOR');

-- CreateEnum
CREATE TYPE "CommandActionType" AS ENUM (
  'SHOW_CATALOG',
  'CHECK_STOCK',
  'PLACE_ORDER',
  'CHECK_ORDER_STATUS',
  'CUSTOM_REPLY',
  'LIST_STOCK',
  'UPDATE_STOCK',
  'APPROVE_SEND',
  'APPROVE_ACTIONS',
  'REJECT',
  'APPROVE_EDIT',
  'HELP'
);

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN "intent" TEXT,
ADD COLUMN "actionType" "CommandActionType",
ADD COLUMN "vendorCommandId" TEXT,
ADD COLUMN "triggerMessageId" TEXT;

-- CreateTable
CREATE TABLE "VendorCommand" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "actor" "CommandActor" NOT NULL,
    "actionType" "CommandActionType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "replyTemplate" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorCommand_vendorId_actor_enabled_idx" ON "VendorCommand"("vendorId", "actor", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCommand_vendorId_keyword_key" ON "VendorCommand"("vendorId", "keyword");

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_vendorCommandId_fkey" FOREIGN KEY ("vendorCommandId") REFERENCES "VendorCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCommand" ADD CONSTRAINT "VendorCommand_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
