CREATE TABLE "TeacherLearnerCurriculumEvidence" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "gameId" TEXT,
    "note" TEXT,
    "rubricLevelOverride" TEXT,
    "supportLevelOverride" TEXT,
    "countedEachObjectOnce" BOOLEAN NOT NULL DEFAULT false,
    "skippedDoubleCounted" BOOLEAN NOT NULL DEFAULT false,
    "matchedNumeralCorrectly" BOOLEAN NOT NULL DEFAULT false,
    "neededPrompts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherLearnerCurriculumEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherLearnerCurriculumEvidence_ownerKey_learnerId_competen_key" ON "TeacherLearnerCurriculumEvidence"("ownerKey", "learnerId", "competencyId");
CREATE INDEX "TeacherLearnerCurriculumEvidence_ownerKey_classId_idx" ON "TeacherLearnerCurriculumEvidence"("ownerKey", "classId");
CREATE INDEX "TeacherLearnerCurriculumEvidence_learnerId_competencyId_idx" ON "TeacherLearnerCurriculumEvidence"("learnerId", "competencyId");

ALTER TABLE "TeacherLearnerCurriculumEvidence" ADD CONSTRAINT "TeacherLearnerCurriculumEvidence_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherLearnerCurriculumEvidence" ADD CONSTRAINT "TeacherLearnerCurriculumEvidence_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TeacherLearner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
