-- CreateEnum
CREATE TYPE "TeacherSessionLearnerStatus" AS ENUM ('PRACTICED_ENOUGH', 'KEEP_GOING', 'NEED_MORE_PRACTICE');

-- CreateTable
CREATE TABLE "TeacherSchoolProfile" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "connectivityStatus" TEXT NOT NULL,
    "contentStatus" TEXT NOT NULL,
    "supportEmail" TEXT NOT NULL,
    "schoolQrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSchoolProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherClassroom" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherPhone" TEXT NOT NULL,
    "cardColor" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherClassroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherLearner" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarHue" INTEGER NOT NULL,
    "weeklyMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastWeekMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherLearner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSessionStatus" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "TeacherSessionLearnerStatus" NOT NULL DEFAULT 'KEEP_GOING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSessionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSchoolProfile_ownerKey_key" ON "TeacherSchoolProfile"("ownerKey");

-- CreateIndex
CREATE INDEX "TeacherClassroom_ownerKey_isArchived_idx" ON "TeacherClassroom"("ownerKey", "isArchived");

-- CreateIndex
CREATE INDEX "TeacherLearner_classId_idx" ON "TeacherLearner"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSessionStatus_classId_learnerId_activityId_key" ON "TeacherSessionStatus"("classId", "learnerId", "activityId");

-- CreateIndex
CREATE INDEX "TeacherSessionStatus_classId_activityId_idx" ON "TeacherSessionStatus"("classId", "activityId");

-- AddForeignKey
ALTER TABLE "TeacherLearner" ADD CONSTRAINT "TeacherLearner_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSessionStatus" ADD CONSTRAINT "TeacherSessionStatus_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSessionStatus" ADD CONSTRAINT "TeacherSessionStatus_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TeacherLearner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

