-- Exactly three choices (A/B/C) with one marked correct for admin; score_key removed.

ALTER TABLE "career_quiz_options" ADD COLUMN "is_correct" BOOLEAN NOT NULL DEFAULT false;

-- Keep at most three options per question (lowest sort_order first).
DELETE FROM "career_quiz_options" AS o
WHERE o."id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "question_id" ORDER BY "sort_order" ASC, "id" ASC) AS rn
    FROM "career_quiz_options"
  ) AS ranked
  WHERE ranked.rn > 3
);

-- Mark one correct per question (first row if none were flagged yet).
UPDATE "career_quiz_options" AS o
SET "is_correct" = true
FROM (
  SELECT DISTINCT ON ("question_id") "id"
  FROM "career_quiz_options"
  ORDER BY "question_id", "sort_order" ASC, "id" ASC
) AS pick
WHERE o."id" = pick."id";

ALTER TABLE "career_quiz_options" DROP COLUMN IF EXISTS "score_key";

-- Normalize labels to A, B, C by sort order within each question.
UPDATE "career_quiz_options" AS o
SET "label" = v."new_label"
FROM (
  SELECT "id",
         CASE ROW_NUMBER() OVER (PARTITION BY "question_id" ORDER BY "sort_order" ASC, "id" ASC)
           WHEN 1 THEN 'A'
           WHEN 2 THEN 'B'
           WHEN 3 THEN 'C'
           ELSE "label"
         END AS "new_label"
  FROM "career_quiz_options"
) AS v
WHERE o."id" = v."id";

UPDATE "career_quiz_options"
SET "sort_order" = sub.rn - 1
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "question_id" ORDER BY "sort_order" ASC, "id" ASC) AS rn
  FROM "career_quiz_options"
) AS sub
WHERE "career_quiz_options"."id" = sub."id";
