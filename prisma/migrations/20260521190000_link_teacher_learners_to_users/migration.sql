ALTER TABLE "TeacherLearner" ADD COLUMN "userId" TEXT;

CREATE INDEX "TeacherLearner_userId_idx" ON "TeacherLearner"("userId");
