/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_emailVerificationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_phoneVerificationId_fkey";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserVerification";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentSubscription" "SubscriptionTier" NOT NULL DEFAULT 'TRIAL',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "subscriptionActiveAt" TIMESTAMP(3) NOT NULL,
    "subscriptionExpiresAt" TIMESTAMP(3),
    "userType" "UserType" NOT NULL DEFAULT 'USER',
    "emailVerificationId" BIGINT,
    "phoneVerificationId" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_verifications" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailAddress_key" ON "users"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationId_key" ON "users"("emailVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneVerificationId_key" ON "users"("phoneVerificationId");

-- CreateIndex
CREATE INDEX "users_userName_emailAddress_phoneNumber_idx" ON "users"("userName", "emailAddress", "phoneNumber");

-- CreateIndex
CREATE INDEX "users_currentSubscription_subscriptionActiveAt_idx" ON "users"("currentSubscription", "subscriptionActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_code_key" ON "user_verifications"("code");

-- CreateIndex
CREATE INDEX "user_verifications_code_idx" ON "user_verifications"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_emailVerificationId_fkey" FOREIGN KEY ("emailVerificationId") REFERENCES "user_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_phoneVerificationId_fkey" FOREIGN KEY ("phoneVerificationId") REFERENCES "user_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
