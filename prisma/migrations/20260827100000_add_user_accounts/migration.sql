-- DropTable
DROP TABLE "AppSetting";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ntfyTopic" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_ntfyTopic_key" ON "User"("ntfyTopic");

-- AlterTable
ALTER TABLE "ScalpAddress" ADD COLUMN "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ScalpAddress_userId_idx" ON "ScalpAddress"("userId");

-- AddForeignKey
ALTER TABLE "ScalpAddress" ADD CONSTRAINT "ScalpAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
