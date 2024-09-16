-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_emailVerificationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_phoneVerificationId_fkey";

-- AlterTable
ALTER TABLE "user_verifications" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '24 hours';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "nickName" DROP NOT NULL,
ALTER COLUMN "subscriptionActiveAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_emailVerificationId_fkey" FOREIGN KEY ("emailVerificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_phoneVerificationId_fkey" FOREIGN KEY ("phoneVerificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
