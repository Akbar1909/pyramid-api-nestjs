-- CreateTable
CREATE TABLE "career_quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "display_total_steps" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "category_label" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "image_file_id" TEXT,
    "quote_text" TEXT,
    "quote_icon_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_quiz_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score_key" VARCHAR(64),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_quiz_questions_quiz_id_step_order_key" ON "career_quiz_questions"("quiz_id", "step_order");

-- CreateIndex
CREATE INDEX "career_quiz_questions_quiz_id_idx" ON "career_quiz_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "career_quiz_options_question_id_idx" ON "career_quiz_options"("question_id");

-- AddForeignKey
ALTER TABLE "career_quiz_questions" ADD CONSTRAINT "career_quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "career_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quiz_questions" ADD CONSTRAINT "career_quiz_questions_image_file_id_fkey" FOREIGN KEY ("image_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_quiz_options" ADD CONSTRAINT "career_quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "career_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
