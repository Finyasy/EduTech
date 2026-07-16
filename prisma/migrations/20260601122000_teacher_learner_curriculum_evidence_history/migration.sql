CREATE TABLE "TeacherLearnerCurriculumEvidenceHistory" (
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
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherLearnerCurriculumEvidenceHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherLearnerCurriculumEvidenceHistory_ownerKey_classId_com_idx" ON "TeacherLearnerCurriculumEvidenceHistory"("ownerKey", "classId", "competencyId", "recordedAt");
CREATE INDEX "TeacherLearnerCurriculumEvidenceHistory_learnerId_competencyI_idx" ON "TeacherLearnerCurriculumEvidenceHistory"("learnerId", "competencyId", "recordedAt");

ALTER TABLE "TeacherLearnerCurriculumEvidenceHistory" ADD CONSTRAINT "TeacherLearnerCurriculumEvidenceHistory_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherLearnerCurriculumEvidenceHistory" ADD CONSTRAINT "TeacherLearnerCurriculumEvidenceHistory_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TeacherLearner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
