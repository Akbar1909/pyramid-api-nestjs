-- CreateEnum
CREATE TYPE "tour_booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tour_bookings" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "visit_at" TIMESTAMP(3) NOT NULL,
    "status" "tour_booking_status" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tour_bookings_visit_at_idx" ON "tour_bookings"("visit_at");

-- CreateIndex
CREATE INDEX "tour_bookings_status_idx" ON "tour_bookings"("status");

-- CreateIndex
CREATE INDEX "tour_bookings_created_at_idx" ON "tour_bookings"("created_at");
