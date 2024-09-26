/*
  Warnings:

  - The primary key for the `instances` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `instances` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "instances" DROP CONSTRAINT "instances_userId_fkey";

-- AlterTable
ALTER TABLE "instances" DROP CONSTRAINT "instances_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "isActive" SET DEFAULT true,
ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "instances_id_seq";

-- AlterTable
ALTER TABLE "user_verifications" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '24 hours';

-- CreateIndex
CREATE UNIQUE INDEX "instances_id_key" ON "instances"("id");

-- AddForeignKey
ALTER TABLE "instances" ADD CONSTRAINT "instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
