CREATE TYPE "MasteryDimension" AS ENUM ('AI', 'CODING', 'MATH');

CREATE TYPE "LearnerArtifactStatus" AS ENUM ('SUBMITTED', 'REVIEWED');

CREATE TABLE "LearnerArtifact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "buildType" TEXT NOT NULL,
    "reflection" TEXT NOT NULL,
    "artifactUrl" TEXT,
    "status" "LearnerArtifactStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasteryRubric" (
    "id" TEXT NOT NULL,
    "dimension" "MasteryDimension" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryRubric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasteryScore" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearnerArtifact_userId_createdAt_idx" ON "LearnerArtifact"("userId", "createdAt");
CREATE INDEX "LearnerArtifact_lessonId_createdAt_idx" ON "LearnerArtifact"("lessonId", "createdAt");
CREATE INDEX "LearnerArtifact_status_createdAt_idx" ON "LearnerArtifact"("status", "createdAt");
CREATE INDEX "MasteryRubric_dimension_idx" ON "MasteryRubric"("dimension");
CREATE UNIQUE INDEX "MasteryScore_artifactId_rubricId_key" ON "MasteryScore"("artifactId", "rubricId");
CREATE INDEX "MasteryScore_userId_assessedAt_idx" ON "MasteryScore"("userId", "assessedAt");

ALTER TABLE "LearnerArtifact" ADD CONSTRAINT "LearnerArtifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearnerArtifact" ADD CONSTRAINT "LearnerArtifact_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MasteryScore" ADD CONSTRAINT "MasteryScore_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "LearnerArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasteryScore" ADD CONSTRAINT "MasteryScore_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "MasteryRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MasteryScore" ADD CONSTRAINT "MasteryScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
