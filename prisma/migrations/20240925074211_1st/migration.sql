-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('TRIAL', 'BEGINNER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "InstanceEnvironment" AS ENUM ('DEVELOPMENT', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "SessionStorageType" AS ENUM ('REDIS', 'POSTGRESQL', 'MONGODB');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentSubscription" "SubscriptionTier" NOT NULL DEFAULT 'TRIAL',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndDate" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',

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
    "userEmailId" TEXT,
    "userPhoneId" TEXT,

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instances" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "businessWhatsApp" TEXT,
    "businessCountry" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "environment" "InstanceEnvironment" NOT NULL,
    "sessionStorage" "SessionStorageType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_username_email_phone_idx" ON "users"("username", "email", "phone");

-- CreateIndex
CREATE INDEX "users_currentSubscription_subscriptionStartDate_idx" ON "users"("currentSubscription", "subscriptionStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_code_key" ON "user_verifications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_userEmailId_key" ON "user_verifications"("userEmailId");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_userPhoneId_key" ON "user_verifications"("userPhoneId");

-- CreateIndex
CREATE INDEX "user_verifications_code_idx" ON "user_verifications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "instances_name_key" ON "instances"("name");

-- CreateIndex
CREATE INDEX "instances_name_isActive_idx" ON "instances"("name", "isActive");

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_userEmailId_fkey" FOREIGN KEY ("userEmailId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_userPhoneId_fkey" FOREIGN KEY ("userPhoneId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instances" ADD CONSTRAINT "instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
