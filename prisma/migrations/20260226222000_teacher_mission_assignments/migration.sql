-- CreateTable
CREATE TABLE "TeacherMissionAssignment" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "subjectId" TEXT,
    "strandId" TEXT,
    "activityId" TEXT,
    "learnerIds" JSONB,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherMissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherMissionAssignment_dedupeKey_key" ON "TeacherMissionAssignment"("dedupeKey");

-- CreateIndex
CREATE INDEX "TeacherMissionAssignment_ownerKey_classId_updatedAt_idx" ON "TeacherMissionAssignment"("ownerKey", "classId", "updatedAt");

-- CreateIndex
CREATE INDEX "TeacherMissionAssignment_ownerKey_status_idx" ON "TeacherMissionAssignment"("ownerKey", "status");

-- CreateIndex
CREATE INDEX "TeacherMissionAssignment_classId_target_idx" ON "TeacherMissionAssignment"("classId", "target");

-- AddForeignKey
ALTER TABLE "TeacherMissionAssignment"
ADD CONSTRAINT "TeacherMissionAssignment_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "TeacherClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
