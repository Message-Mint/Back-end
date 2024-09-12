-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('TRIAL', 'BEGINNER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('USER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "currentSubscription" "SubscriptionTier" NOT NULL DEFAULT 'TRIAL',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "subscriptionActiveAt" TIMESTAMP(3) NOT NULL,
    "subscriptionExpiresAt" TIMESTAMP(3),
    "userType" "UserType" DEFAULT 'USER',
    "emailVerificationId" BIGINT,
    "phoneVerificationId" BIGINT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerification" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailAddress_key" ON "User"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationId_key" ON "User"("emailVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneVerificationId_key" ON "User"("phoneVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_code_key" ON "UserVerification"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_emailVerificationId_fkey" FOREIGN KEY ("emailVerificationId") REFERENCES "UserVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_phoneVerificationId_fkey" FOREIGN KEY ("phoneVerificationId") REFERENCES "UserVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
