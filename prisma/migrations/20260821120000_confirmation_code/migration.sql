-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_confirmationCode_key" ON "Reservation"("confirmationCode");
CREATE INDEX IF NOT EXISTS "Reservation_confirmationCode_idx" ON "Reservation"("confirmationCode");
