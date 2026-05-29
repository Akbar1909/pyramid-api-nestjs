-- AlterTable: optional rich HTML for extended program copy; card summary stays in `description`.
ALTER TABLE "faculty_programs" ADD COLUMN "body" TEXT;
