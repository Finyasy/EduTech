import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";
import {
  compareCoursesByCurriculumPlan,
  getCourseCurriculumPlan,
  getCourseSequenceForAgeBand,
} from "@/lib/curriculum/learning-path";
import { listCourses } from "@/lib/server/data";
import type { CourseOverview } from "@/lib/server/data";

export const revalidate = 120;

type AgeBandKey = "5-7" | "8-10" | "11-14" | "mixed";

type AgeBandSection = {
  key: AgeBandKey;
  label: string;
  anchorId: string;
  subtitle: string;
  chipClass: string;
  panelClass: string;
  ringClass: string;
};

const AGE_BAND_SECTIONS: AgeBandSection[] = [
  {
    key: "5-7",
    label: "Ages 5-7",
    anchorId: "age-5-7",
    subtitle: "Short wins, pattern play, and friendly first AI ideas.",
    chipClass: "bg-amber-100 text-amber-900 border-amber-200",
    panelClass: "from-amber-100/70 via-orange-50 to-white",
    ringClass: "ring-amber-200/70",
  },
  {
    key: "8-10",
    label: "Ages 8-10",
    anchorId: "age-8-10",
    subtitle: "Builder missions with data, loops, debugging, and math strategy.",
    chipClass: "bg-cyan-100 text-cyan-900 border-cyan-200",
    panelClass: "from-cyan-100/70 via-sky-50 to-white",
    ringClass: "ring-cyan-200/70",
  },
  {
    key: "11-14",
    label: "Ages 11-14",
    anchorId: "age-11-14",
    subtitle: "Creator missions with Python, real-world data, and responsible AI.",
    chipClass: "bg-lime-100 text-lime-900 border-lime-200",
    panelClass: "from-lime-100/70 via-emerald-50 to-white",
    ringClass: "ring-lime-200/70",
  },
  {
    key: "mixed",
    label: "Mixed ages",
    anchorId: "age-mixed",
    subtitle: "Flexible missions that can be adapted for different learner levels.",
    chipClass: "bg-slate-100 text-slate-800 border-slate-200",
    panelClass: "from-slate-100/70 via-white to-white",
    ringClass: "ring-slate-200/70",
  },
];

const STAGE_ORDER: Record<string, number> = {
  Explorer: 0,
  Builder: 1,
  Creator: 2,
};

const STAGE_CHIP_CLASS: Record<string, string> = {
  Explorer: "bg-orange-100 text-orange-900 border-orange-200",
  Builder: "bg-indigo-100 text-indigo-900 border-indigo-200",
  Creator: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  Mission: "bg-slate-100 text-slate-800 border-slate-200",
};

const STAGE_HOOKS: Record<string, string> = {
  Explorer: "Fast confidence wins with guided steps and visible results.",
  Builder: "Hands-on coding challenges with clear goals and debugging moments.",
  Creator: "Open-ended projects that reward creativity, reasoning, and reflection.",
  Mission: "Project-based learning with AI, coding, and maths in one flow.",
};

function getAgeBandKey(ageBand?: string): AgeBandKey {
  if (ageBand === "5-7" || ageBand === "8-10" || ageBand === "11-14") {
    return ageBand;
  }
  return "mixed";
}

function stageChipClass(stage?: string) {
  return STAGE_CHIP_CLASS[stage ?? "Mission"] ?? STAGE_CHIP_CLASS.Mission;
}

function missionMood(course: CourseOverview) {
  const stage = course.pathwayStage ?? "Mission";
  if (stage === "Explorer") return "Play first, learn by doing";
  if (stage === "Builder") return "Build, test, improve";
  if (stage === "Creator") return "Create and present";
  return "Learn, build, share";
}

function quickWinLine(course: CourseOverview) {
  if (course.pathwayStage === "Explorer") {
    return "Young learners get a visible win in Lesson 1 and a build moment in Lesson 2.";
  }
  if (course.pathwayStage === "Builder") {
    return "Designed for momentum: code a solution, test it, then improve one part.";
  }
  if (course.pathwayStage === "Creator") {
    return "Keeps older learners engaged with real-world context and creative output.";
  }
  return "Project-based rhythm keeps the learning experience moving.";
}

function ageBandLabel(ageBand?: string) {
  if (!ageBand) return "Mixed ages";
  return `Ages ${ageBand}`;
}

export default async function CoursesPage() {
  const courses: CourseOverview[] = await listCourses();
  const showDelayedDataBadge = courses.some((course) => course.isFallbackData);
  const totalLessons = courses.reduce((sum, course) => sum + course.lessonCount, 0);
  const stageCounts = courses.reduce<Record<string, number>>((acc, course) => {
    const stage = course.pathwayStage ?? "Mission";
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});

  const groupedCourses = AGE_BAND_SECTIONS.map((section) => {
    const items = courses
      .filter((course) => getAgeBandKey(course.ageBand) === section.key)
      .sort((a, b) => {
        const curriculumDiff = compareCoursesByCurriculumPlan(a, b);
        if (curriculumDiff !== 0) return curriculumDiff;
        const stageDiff =
          (STAGE_ORDER[a.pathwayStage ?? "Mission"] ?? 99) -
          (STAGE_ORDER[b.pathwayStage ?? "Mission"] ?? 99);
        if (stageDiff !== 0) return stageDiff;
        return a.title.localeCompare(b.title);
      });
    return { ...section, items };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-lime-50/80 to-cyan-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="relative mb-6 overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-8 top-4 h-36 w-36 rounded-full bg-amber-300 blur-3xl" />
            <div className="absolute right-4 top-8 h-28 w-28 rounded-full bg-cyan-300 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-lime-300 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
                Mission library
              </p>
              <span className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-900">
                AI + Coding + Maths
              </span>
              {showDelayedDataBadge && (
                <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Data may be delayed
                </div>
              )}
            </div>

            <h1
              className="text-3xl font-semibold text-slate-900 md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pick an age path and launch a mission.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 md:text-base">
              Designed for young learner momentum: short lessons, visible wins,
              creative projects, and a clear AI, coding, and maths connection in every mission.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Missions
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{courses.length}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Lessons
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{totalLessons}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Explorer paths
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {stageCounts.Explorer ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Builder + Creator
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {(stageCounts.Builder ?? 0) + (stageCounts.Creator ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="sticky top-20 z-20 mb-8 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {groupedCourses.map((group) => (
              <a
                key={group.anchorId}
                href={`#${group.anchorId}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-200"
              >
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${group.chipClass}`}
                >
                  {group.label}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.items.length} missions
                </span>
              </a>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Learn",
                body: "Start with one idea, one example, and one success in the first lesson.",
                tone: "border-amber-100 bg-amber-50 text-amber-900",
              },
              {
                title: "Build",
                body: "Create something playful with code and maths, then test it immediately.",
                tone: "border-cyan-100 bg-cyan-50 text-cyan-900",
              },
              {
                title: "Share",
                body: "Explain the result in kid-friendly language to lock in understanding.",
                tone: "border-lime-100 bg-lime-50 text-lime-900",
              },
            ].map((step) => (
              <div
                key={step.title}
                className={`rounded-2xl border p-4 text-sm ${step.tone}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {step.title}
                </p>
                <p className="mt-2 leading-5">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          {groupedCourses.map((group) => (
            <section
              key={group.anchorId}
              id={group.anchorId}
              className={`rounded-3xl border border-white/80 bg-gradient-to-br ${group.panelClass} p-5 shadow-sm ring-1 ${group.ringClass} md:p-6`}
            >
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${group.chipClass}`}
                    >
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {group.items.length} missions
                    </span>
                  </div>
                  <h2
                    className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {group.label} Mission Paths
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                    {group.subtitle}
                  </p>
                  {group.key !== "mixed" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Recommended path
                      </span>
                      {getCourseSequenceForAgeBand(group.key as "5-7" | "8-10" | "11-14")
                        .map((plan) => courses.find((course) => course.id === plan.courseId))
                        .filter((course): course is CourseOverview => Boolean(course))
                        .map((course) => (
                          <span
                            key={`${group.key}-${course.id}`}
                            className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-slate-700 shadow-sm"
                          >
                            {course.title}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/85 p-4 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Why this keeps learners coming back
                  </p>
                  <p className="mt-2 max-w-xs">
                    Clear mission goals, playful project outcomes, and visible progress in every lesson set.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {group.items.map((course) => {
                  const stage = course.pathwayStage ?? "Mission";
                  const stageClass = stageChipClass(stage);
                  const startHref = course.firstLessonId
                    ? `/courses/${course.id}/lessons/${course.firstLessonId}`
                    : `/courses/${course.id}`;
                  const curriculumPlan = getCourseCurriculumPlan(course.id);
                  const nextMissions = (curriculumPlan?.nextMissionIds ?? [])
                    .map((id) => courses.find((item) => item.id === id))
                    .filter((item): item is CourseOverview => Boolean(item));

                  return (
                    <article
                      key={course.id}
                      className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                            <span
                              className={`rounded-full border px-3 py-1 ${stageClass}`}
                            >
                              {stage}
                            </span>
                            <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-slate-700">
                              {ageBandLabel(course.ageBand)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                              {course.lessonCount} lessons
                            </span>
                            {curriculumPlan?.priority && (
                              <span className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-lime-800">
                                {curriculumPlan.priority}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {missionMood(course)}
                          </p>
                          <h3
                            className="mt-1 text-2xl font-semibold text-slate-900"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {course.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {course.description}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Engagement note
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {quickWinLine(course)}
                          </p>
                          {curriculumPlan?.stickyHook && (
                            <p className="mt-2 text-xs text-slate-500">
                              {curriculumPlan.stickyHook}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-lime-100 bg-lime-50 p-3 text-sm text-lime-950">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-700">
                              AI
                            </p>
                            <p className="mt-1 font-semibold">
                              {course.aiFocus ?? "Age-appropriate AI concept"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-sm text-cyan-950">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                              Coding
                            </p>
                            <p className="mt-1 font-semibold">
                              {course.codingFocus ?? "Core coding practice"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                              Maths
                            </p>
                            <p className="mt-1 font-semibold">
                              {course.mathFocus ?? "Math in context"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white p-4 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold text-slate-900">Outcome:</span>{" "}
                            {course.missionOutcome ?? "Project-based mission output"}
                          </p>
                          {course.sessionBlueprint && (
                            <p className="mt-2">
                              <span className="font-semibold text-slate-900">Session rhythm:</span>{" "}
                              {course.sessionBlueprint}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-slate-500">
                            {STAGE_HOOKS[stage] ?? STAGE_HOOKS.Mission}
                          </p>
                          {nextMissions.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Next mission
                              </span>
                              {nextMissions.map((nextCourse) => (
                                <Link
                                  key={`${course.id}-next-${nextCourse.id}`}
                                  href={`/courses/${nextCourse.id}`}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                                >
                                  {nextCourse.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Open mission details or jump straight into lesson 1
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/courses/${course.id}`}
                              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                              View mission
                            </Link>
                            <Link
                              href={startHref}
                              className="inline-flex min-h-11 items-center rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700"
                            >
                              Start mission
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      </main>
    </div>
  );
}
