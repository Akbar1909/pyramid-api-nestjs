-- CreateTable
CREATE TABLE "faculty_programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" VARCHAR(64) NOT NULL,
    "detail_url" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faculty_programs_is_published_sort_order_idx" ON "faculty_programs"("is_published", "sort_order");
