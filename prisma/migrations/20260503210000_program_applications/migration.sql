-- CreateEnum
CREATE TYPE "program_application_status" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "stored_files" ALTER COLUMN "uploaded_by_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "program_applications" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "citizenship" VARCHAR(32) NOT NULL,
    "faculty_program_id" TEXT,
    "status" "program_application_status" NOT NULL DEFAULT 'SUBMITTED',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_application_attachments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "stored_file_id" TEXT NOT NULL,

    CONSTRAINT "program_application_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_applications_status_idx" ON "program_applications"("status");

-- CreateIndex
CREATE INDEX "program_applications_created_at_idx" ON "program_applications"("created_at");

-- CreateIndex
CREATE INDEX "program_applications_email_idx" ON "program_applications"("email");

-- CreateIndex
CREATE INDEX "program_application_attachments_application_id_idx" ON "program_application_attachments"("application_id");

-- AddForeignKey
ALTER TABLE "program_applications" ADD CONSTRAINT "program_applications_faculty_program_id_fkey" FOREIGN KEY ("faculty_program_id") REFERENCES "faculty_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_application_attachments" ADD CONSTRAINT "program_application_attachments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "program_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_application_attachments" ADD CONSTRAINT "program_application_attachments_stored_file_id_fkey" FOREIGN KEY ("stored_file_id") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
