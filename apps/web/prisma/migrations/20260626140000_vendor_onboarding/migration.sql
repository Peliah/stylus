-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN "openwaSessionId" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "whatsappLinkedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_openwaSessionId_key" ON "Vendor"("openwaSessionId");

-- Existing vendors with products are treated as already onboarded
UPDATE "Vendor" v
SET "onboardingComplete" = true,
    "whatsappLinkedAt" = COALESCE("whatsappLinkedAt", NOW())
WHERE EXISTS (
  SELECT 1 FROM "Product" p WHERE p."vendorId" = v.id
);

-- Vendor matching env phone gets linked to default session when present
UPDATE "Vendor"
SET "openwaSessionId" = 'a7dc6272-fc62-4d88-8688-15525a016cb0',
    "whatsappLinkedAt" = COALESCE("whatsappLinkedAt", NOW()),
    "onboardingComplete" = true
WHERE "phoneNumber" = '23750810984@c.us';
