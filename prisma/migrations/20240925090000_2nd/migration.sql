/*
  Warnings:

  - You are about to drop the column `businessWhatsApp` on the `instances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "instances" DROP COLUMN "businessWhatsApp",
ADD COLUMN     "businessWhatsAppNo" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_verifications" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '24 hours';
