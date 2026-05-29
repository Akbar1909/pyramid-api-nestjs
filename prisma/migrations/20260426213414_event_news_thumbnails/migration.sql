-- AlterTable
ALTER TABLE "events" ADD COLUMN     "thumbnail_id" TEXT;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "thumbnail_id" TEXT;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
