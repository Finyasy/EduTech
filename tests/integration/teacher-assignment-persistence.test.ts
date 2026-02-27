/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/server/prisma";

const runDbIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIf = runDbIntegration ? describe : describe.skip;

describeIf("teacher mission assignment persistence", () => {
  const ownerKey = `integration-owner-${randomUUID()}`;
  let classId = "";

  afterAll(async () => {
    const prisma = getPrisma();
    if (!prisma) return;

    await prisma.$executeRaw`
      DELETE FROM "TeacherMissionAssignment"
      WHERE "ownerKey" = ${ownerKey}
    `;

    await prisma.$executeRaw`
      DELETE FROM "TeacherLearner"
      WHERE "classId" IN (
        SELECT "id" FROM "TeacherClassroom" WHERE "ownerKey" = ${ownerKey}
      )
    `;

    await prisma.$executeRaw`
      DELETE FROM "TeacherClassroom"
      WHERE "ownerKey" = ${ownerKey}
    `;

    await prisma.$executeRaw`
      DELETE FROM "TeacherSchoolProfile"
      WHERE "ownerKey" = ${ownerKey}
    `;
  });

  it("persists assignments across module reloads", async () => {
    const prisma = getPrisma();
    expect(prisma).not.toBeNull();

    const storeModule = await import("@/lib/server/teacher-store");

    const classroom = await storeModule.addTeacherClassroom(ownerKey, {
      grade: "PP1",
      name: "Integration Class",
      teacherName: "Integration Teacher",
      teacherPhone: "+254700000321",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });
    classId = classroom.id;

    await storeModule.assignTeacherMissionToClass({
      ownerKey,
      classId,
      courseId: "course-logic",
      courseTitle: "AI Pattern Detectives",
      target: "CLASS",
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
      learnerIds: [],
      note: "integration persistence test",
    });

    const beforeReload = await storeModule.getTeacherWorkspaceSnapshot({
      ownerKey,
      classId,
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
    });

    expect(beforeReload.assignments.some((a) => a.courseId === "course-logic")).toBe(true);
    expect(beforeReload.assignmentAnalytics.totalAssignments).toBeGreaterThanOrEqual(1);

    vi.resetModules();
    const reloadedModule = await import("@/lib/server/teacher-store");

    const afterReload = await reloadedModule.getTeacherWorkspaceSnapshot({
      ownerKey,
      classId,
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
    });

    expect(afterReload.assignments.some((a) => a.courseId === "course-logic")).toBe(true);
    expect(afterReload.assignmentAnalytics.totalAssignments).toBeGreaterThanOrEqual(1);
  });
});
