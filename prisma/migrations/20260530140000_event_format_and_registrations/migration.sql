-- Event format + public registration
CREATE TYPE "event_format" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

CREATE TYPE "event_registration_status" AS ENUM ('REGISTERED', 'CANCELLED');

ALTER TABLE "events" ADD COLUMN "format" "event_format" NOT NULL DEFAULT 'OFFLINE';
ALTER TABLE "events" ADD COLUMN "registration_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "event_registration_status" NOT NULL DEFAULT 'REGISTERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_registrations_event_id_email_key" ON "event_registrations"("event_id", "email");
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");
CREATE INDEX "event_registrations_status_idx" ON "event_registrations"("status");
CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations"("created_at");

ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
