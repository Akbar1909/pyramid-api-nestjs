-- Extend application workflow statuses
ALTER TYPE "program_application_status" ADD VALUE 'INTERVIEW_SCHEDULED';
ALTER TYPE "program_application_status" ADD VALUE 'OFFER_SENT';
ALTER TYPE "program_application_status" ADD VALUE 'ENROLLED';

-- Site-wide admissions page (singleton)
CREATE TABLE "admissions_content" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "intro_html" TEXT,
    "general_requirements" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_content_pkey" PRIMARY KEY ("id")
);

-- Faculty program enrichment
ALTER TABLE "faculty_programs" ADD COLUMN "slug" TEXT;
ALTER TABLE "faculty_programs" ADD COLUMN "image_file_id" TEXT;
ALTER TABLE "faculty_programs" ADD COLUMN "duration" TEXT;
ALTER TABLE "faculty_programs" ADD COLUMN "credential_type" VARCHAR(64);
ALTER TABLE "faculty_programs" ADD COLUMN "format" TEXT;
ALTER TABLE "faculty_programs" ADD COLUMN "practicum_hours" INTEGER;
ALTER TABLE "faculty_programs" ADD COLUMN "admission_requirements" JSONB;
ALTER TABLE "faculty_programs" ADD COLUMN "clinical_requirements" JSONB;

CREATE UNIQUE INDEX "faculty_programs_slug_key" ON "faculty_programs"("slug");

ALTER TABLE "faculty_programs" ADD CONSTRAINT "faculty_programs_image_file_id_fkey" FOREIGN KEY ("image_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Program application enrichment
ALTER TABLE "program_applications" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "program_applications" ADD COLUMN "preferred_start_date" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN "supplementary_answers" JSONB;
ALTER TABLE "program_applications" ADD COLUMN "interview_scheduled_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN "interview_notes" TEXT;
ALTER TABLE "program_applications" ADD COLUMN "enrolled_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN "tracking_token" TEXT;

UPDATE "program_applications"
SET "tracking_token" = md5("id" || random()::text || clock_timestamp()::text)
WHERE "tracking_token" IS NULL;

ALTER TABLE "program_applications" ALTER COLUMN "tracking_token" SET NOT NULL;

CREATE UNIQUE INDEX "program_applications_tracking_token_key" ON "program_applications"("tracking_token");

ALTER TABLE "program_applications" ALTER COLUMN "phone" DROP DEFAULT;

ALTER TABLE "program_application_attachments" ADD COLUMN "document_type" VARCHAR(64);
