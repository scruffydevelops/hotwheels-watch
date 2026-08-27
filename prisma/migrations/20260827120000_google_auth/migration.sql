-- Switching from email/password to Google sign-in. Only diagnostic test
-- accounts exist at this point (no real user data), so clearing them is
-- safe — there's no way to link an existing password-based account to a
-- Google identity without the user signing in again anyway.
DELETE FROM "User";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash";
ALTER TABLE "User" ADD COLUMN "googleId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
