import { redirect } from "next/navigation";
import Link from "next/link";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import {
  compareCoursesByCurriculumPlan,
  getCourseCurriculumPlan,
  getCourseSequenceForAgeBand,
} from "@/lib/curriculum/learning-path";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import { listCourses } from "@/lib/server/data";
import type { CourseOverview } from "@/lib/server/data";

export const revalidate = 120;
const coursesAuthTimeoutMs = 900;

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

type BlendRow = {
  key: "ai" | "coding" | "math";
  label: string;
  value: number;
  barClass: string;
  textClass: string;
};

type SubjectKey = BlendRow["key"];

type SubjectHubCard = {
  key: SubjectKey;
  label: string;
  title: string;
  body: string;
  accentClass: string;
  badgeClass: string;
};

const AGE_BAND_SECTIONS: AgeBandSection[] = [
  {
    key: "5-7",
    label: "Ages 5-7",
    anchorId: "age-5-7",
    subtitle: "Short wins, pattern play, and friendly first AI ideas.",
    chipClass: "border-amber-200/80 bg-amber-50/90 text-amber-900",
    panelClass: "from-white/82 via-amber-50/78 to-orange-50/72",
    ringClass: "ring-amber-200/70",
  },
  {
    key: "8-10",
    label: "Ages 8-10",
    anchorId: "age-8-10",
    subtitle: "Builder missions with data, loops, debugging, and math strategy.",
    chipClass: "border-cyan-200/80 bg-cyan-50/90 text-cyan-900",
    panelClass: "from-white/82 via-cyan-50/74 to-sky-50/72",
    ringClass: "ring-cyan-200/70",
  },
  {
    key: "11-14",
    label: "Ages 11-14",
    anchorId: "age-11-14",
    subtitle: "Creator missions with Python, real-world data, and responsible AI.",
    chipClass: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
    panelClass: "from-white/82 via-emerald-50/74 to-teal-50/72",
    ringClass: "ring-emerald-200/70",
  },
  {
    key: "mixed",
    label: "Mixed ages",
    anchorId: "age-mixed",
    subtitle: "Flexible missions that can be adapted for different learner levels.",
    chipClass: "border-slate-200/80 bg-slate-50/90 text-slate-800",
    panelClass: "from-white/84 via-white/78 to-slate-50/72",
    ringClass: "ring-slate-200/70",
  },
];

const STAGE_ORDER: Record<string, number> = {
  Explorer: 0,
  Builder: 1,
  Creator: 2,
};

const STAGE_CHIP_CLASS: Record<string, string> = {
  Explorer: "border-amber-200 bg-amber-50 text-amber-900",
  Builder: "border-sky-200 bg-sky-50 text-sky-900",
  Creator: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Mission: "border-slate-200 bg-slate-50 text-slate-800",
};

const STAGE_HOOKS: Record<string, string> = {
  Explorer: "Fast confidence wins with guided steps and visible results.",
  Builder: "Hands-on coding challenges with clear goals and debugging moments.",
  Creator: "Open-ended projects that reward creativity, reasoning, and reflection.",
  Mission: "Project-based learning with AI, coding, and maths in one flow.",
};

const SUBJECT_TONES: Record<BlendRow["key"], Pick<BlendRow, "barClass" | "textClass">> = {
  ai: {
    barClass: "from-emerald-300 via-lime-200 to-emerald-100",
    textClass: "text-emerald-100",
  },
  coding: {
    barClass: "from-sky-300 via-cyan-200 to-blue-100",
    textClass: "text-sky-100",
  },
  math: {
    barClass: "from-amber-300 via-yellow-200 to-amber-100",
    textClass: "text-amber-100",
  },
};

const SUBJECT_HUB_CARDS: SubjectHubCard[] = [
  {
    key: "math",
    label: "Mathematics",
    title: "Roadmaps, counting, number work, and practical maths.",
    body: "Start with the Kenya CBC/CBE maths roadmap and move into PP1 counting before expanding upward.",
    accentClass: "from-amber-100 via-yellow-50 to-white",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "ai",
    label: "Artificial Intelligence",
    title: "Pattern thinking, model ideas, and guided AI concepts.",
    body: "Open learner-friendly AI paths that focus on observing patterns, classification, and simple reasoning.",
    accentClass: "from-emerald-100 via-lime-50 to-white",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "coding",
    label: "Coding",
    title: "Loops, logic, debugging, and build-first code practice.",
    body: "Browse coding paths that turn ideas into small interactive builds with visible progress.",
    accentClass: "from-sky-100 via-cyan-50 to-white",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-900",
  },
];

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

function learningFormat(stage?: string) {
  if (stage === "Explorer") return "Guided Practice + Play";
  if (stage === "Builder") return "Code Lab + Challenge";
  if (stage === "Creator") return "Studio Project + Demo";
  return "Hybrid Mission";
}

function assessmentStyle(stage?: string) {
  if (stage === "Explorer") return "Show-and-tell checkpoints";
  if (stage === "Builder") return "Debug + performance checks";
  if (stage === "Creator") return "Evidence + ethics defense";
  return "Project reflection";
}

function ageBandLabel(ageBand?: string) {
  if (!ageBand) return "Mixed ages";
  return `Ages ${ageBand}`;
}

function courseLevelLabel(course: CourseOverview) {
  if (course.id === "course-math") return course.gradeLevel;
  return ageBandLabel(course.ageBand);
}

function blendRows(courseId: string): BlendRow[] {
  const blend = getCourseCurriculumPlan(courseId)?.themeBlend ?? {
    ai: 34,
    coding: 33,
    math: 33,
  };

  return (Object.entries(blend) as [BlendRow["key"], number][]).map(([key, value]) => ({
    key,
    label: key === "ai" ? "AI" : key === "coding" ? "Coding" : "Maths",
    value,
    ...SUBJECT_TONES[key],
  }));
}

function groupSummary(group: AgeBandSection) {
  if (group.key === "5-7") {
    return "Best for first wins, playful routines, and calm learner confidence.";
  }
  if (group.key === "8-10") {
    return "Best for learners ready to build, test, debug, and repeat quickly.";
  }
  if (group.key === "11-14") {
    return "Best for creator energy, demos, and evidence-backed AI projects.";
  }
  return "Flexible for mixed-age clubs, intervention groups, and blended sessions.";
}

function courseBlendValue(courseId: string, subject: SubjectKey) {
  const blend = getCourseCurriculumPlan(courseId)?.themeBlend ?? {
    ai: 34,
    coding: 33,
    math: 33,
  };
  return blend[subject];
}

export default async function CoursesPage() {
  const authState = await getAuthStateWithTimeout(coursesAuthTimeoutMs);

  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl("/courses"));
  }

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

  const recommendedCourses = groupedCourses
    .map((group) => group.items[0])
    .filter((course): course is CourseOverview => Boolean(course))
    .slice(0, 3);

  const subjectFeaturedCourses = SUBJECT_HUB_CARDS.map((subject) => {
    const featured =
      subject.key === "math"
        ? courses.find((course) => course.id === "course-math") ??
          [...courses].sort(
            (left, right) =>
              courseBlendValue(right.id, subject.key) - courseBlendValue(left.id, subject.key),
          )[0]
        : [...courses]
            .filter((course) => course.id !== "course-math")
            .sort((left, right) => {
              const blendDiff =
                courseBlendValue(right.id, subject.key) - courseBlendValue(left.id, subject.key);
              if (blendDiff !== 0) return blendDiff;
              return right.lessonCount - left.lessonCount;
            })[0];

    return {
      subject,
      featured: featured ?? null,
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_15%_14%,rgba(252,211,77,0.28),transparent_20%),radial-gradient(circle_at_82%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_80%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[38rem] grid-orbit opacity-35" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-8 md:px-8">
        {authState.status === "timed_out" && (
          <LearnerRouteAuthBridge
            redirectUrl="/courses"
            eyebrow="Learner session"
            title="Checking your course library access."
            description="The library shell is ready. If your session expired, we will move you to sign-in before opening the full mission catalog."
          />
        )}

        <LearnerPageHeader
          eyebrow="Learner subject hub"
          title="Choose a subject to continue."
          description="Start with Mathematics, Artificial Intelligence, or Coding. Each subject opens into its own learner path instead of one mixed mission catalog."
          badges={
            <>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-900">
                AI + Coding + Maths
              </span>
              {showDelayedDataBadge && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900">
                  Data may be delayed
                </span>
              )}
            </>
          }
          actions={
            <>
              <a
                href="#subjects"
                className="inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Browse subjects
              </a>
              <a
                href="#all-paths"
                className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Browse by age
              </a>
            </>
          }
          titleClassName="max-w-4xl text-3xl font-semibold leading-tight text-slate-950 md:text-4xl"
        >
          <div className="space-y-7">
            <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
              {[
                {
                  value: "3",
                  label: "subjects",
                },
                {
                  value: String(totalLessons),
                  label: "lessons",
                },
                {
                  value: String(courses.length),
                  label: "course paths",
                },
                {
                  value: String((stageCounts.Explorer ?? 0) + (stageCounts.Builder ?? 0) + (stageCounts.Creator ?? 0)),
                  label: "guided stages",
                },
              ].map((tile) => (
                <span
                  key={tile.label}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2"
                >
                  {tile.value} {tile.label}
                </span>
              ))}
            </div>

            <div id="subjects" className="grid gap-4 lg:grid-cols-3">
              {subjectFeaturedCourses.map(({ subject, featured }) => {
                const href =
                  subject.key === "math"
                    ? "/courses/course-math"
                    : featured
                      ? `/courses/${featured.id}`
                      : "/courses";

                return (
                  <Link
                    key={subject.key}
                    href={href}
                    className={`group rounded-[1.8rem] border border-slate-200 bg-gradient-to-br ${subject.accentClass} p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${subject.badgeClass}`}
                      >
                        {subject.label}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Open
                      </span>
                    </div>
                    <h2
                      className="mt-4 text-3xl font-semibold text-slate-950"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {subject.label}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{subject.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{subject.body}</p>
                    {featured ? (
                      <div className="mt-5 rounded-[1.35rem] border border-white/80 bg-white/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Start here
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {featured.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {subject.key === "math"
                            ? "Open the maths roadmap first."
                            : `${featured.lessonCount} lessons in the current highlighted path.`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-[1.35rem] border border-white/80 bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Subject path will appear here when content is ready.
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </LearnerPageHeader>

        <section className="glass-shell rounded-[2.25rem] border border-white/70 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Subject model
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Start with one subject, then move deeper into its learner paths.
              </h2>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-900">
              Subject-first
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Mathematics",
                body: "Roadmaps, practical tasks, and games that support clear competency progress.",
                tone: "border-amber-100 bg-amber-50/90 text-amber-950",
              },
              {
                title: "Artificial Intelligence",
                body: "Pattern spotting, classification ideas, and model thinking in learner-friendly form.",
                tone: "border-sky-100 bg-sky-50/90 text-sky-950",
              },
              {
                title: "Coding",
                body: "Logic, loops, debugging, and build-first practice that turns ideas into working projects.",
                tone: "border-emerald-100 bg-emerald-50/90 text-emerald-950",
              },
            ].map((card) => (
              <article key={card.title} className={`rounded-[1.5rem] border p-4 ${card.tone}`}>
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Featured starts
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Jump straight into one highlighted path from each subject.
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recommendedCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stageChipClass(course.pathwayStage)}`}
                  >
                    {courseLevelLabel(course)}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Open
                  </span>
                </div>
                <h2
                  className="mt-4 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {course.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="all-paths"
          className="sticky top-20 z-20 glass-shell rounded-[2.25rem] border border-white/70 p-4 shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            {groupedCourses.map((group) => (
              <a
                key={group.anchorId}
                href={`#${group.anchorId}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-200"
              >
                <span className={`rounded-full border px-3 py-1 text-xs ${group.chipClass}`}>
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
                tone: "border-amber-100 bg-amber-50/90 text-amber-900",
              },
              {
                title: "Build",
                body: "Create something playful with code and maths, then test it immediately.",
                tone: "border-sky-100 bg-sky-50/90 text-sky-900",
              },
              {
                title: "Share",
                body: "Explain the result in learner-friendly language to lock in understanding.",
                tone: "border-emerald-100 bg-emerald-50/90 text-emerald-900",
              },
            ].map((step) => (
              <div key={step.title} className={`rounded-[1.5rem] border p-4 text-sm ${step.tone}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{step.title}</p>
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
              className={`glass-shell rounded-[2.5rem] border border-white/75 bg-gradient-to-br ${group.panelClass} p-5 shadow-[0_24px_64px_rgba(15,23,42,0.08)] ring-1 ${group.ringClass} md:p-6`}
            >
              <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
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
                    className="mt-3 text-3xl font-semibold text-slate-950 md:text-4xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {group.label} Mission Paths
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{group.subtitle}</p>
                  {group.key !== "mixed" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
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

                <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Why this path feels sticky
                  </p>
                  <p
                    className="mt-2 text-lg font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {groupSummary(group)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Each mission opens with a clear win, stays visually calm, and makes the next
                    decision obvious for the learner.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
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
                      className="group overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.12)]"
                    >
                      <div className="pointer-events-none h-20 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(252,211,77,0.16),rgba(125,211,252,0.14),rgba(167,243,208,0.18))]" />
                      <div className="-mt-10 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
                        <div className="space-y-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                              <span className={`rounded-full border px-3 py-1 ${stageClass}`}>
                                {stage}
                              </span>
                              <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-slate-700">
                                {courseLevelLabel(course)}
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

                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                              {missionMood(course)}
                            </p>
                            <h3
                              className="mt-1 text-2xl font-semibold text-slate-950"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {course.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Engagement note
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{quickWinLine(course)}</p>
                            {curriculumPlan?.stickyHook && (
                              <p className="mt-2 text-sm text-slate-500">{curriculumPlan.stickyHook}</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                                {learningFormat(stage)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                                {assessmentStyle(stage)}
                              </span>
                            </div>
                          </div>

                          {course.id === "course-math" ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-[1.35rem] border border-amber-100 bg-amber-50/90 p-3 text-sm text-amber-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                  Strands
                                </p>
                                <p className="mt-1 font-semibold">
                                  Numbers, measurement, geometry, and data readiness
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/90 p-3 text-sm text-emerald-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                  Evidence
                                </p>
                                <p className="mt-1 font-semibold">
                                  Observation, portfolios, tasks, and mastery rubrics
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-sky-100 bg-sky-50/90 p-3 text-sm text-sky-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                                  Roadmap
                                </p>
                                <p className="mt-1 font-semibold">
                                  PP1 first, then PP2 and Grade 1-3 progression
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/90 p-3 text-sm text-emerald-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                  AI
                                </p>
                                <p className="mt-1 font-semibold">
                                  {course.aiFocus ?? "Age-appropriate AI concept"}
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-sky-100 bg-sky-50/90 p-3 text-sm text-sky-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                                  Coding
                                </p>
                                <p className="mt-1 font-semibold">
                                  {course.codingFocus ?? "Core coding practice"}
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-amber-100 bg-amber-50/90 p-3 text-sm text-amber-950">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                  Maths
                                </p>
                                <p className="mt-1 font-semibold">
                                  {course.mathFocus ?? "Math in context"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="rounded-[1.8rem] border border-slate-900/8 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
                                {course.id === "course-math" ? "Curriculum profile" : "Mission profile"}
                              </p>
                              <p className="mt-2 text-lg font-semibold text-white">
                                {course.id === "course-math"
                                  ? "PP1 counting roadmap"
                                  : curriculumPlan?.badgeLabel ?? "Studio Mission"}
                              </p>
                            </div>
                            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">
                              {course.id === "course-math" ? "Maths" : stage}
                            </span>
                          </div>

                          <div className="mt-5 space-y-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                                {course.id === "course-math" ? "Competency" : "Outcome"}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-white/74">
                                {course.id === "course-math"
                                  ? "Count concrete object sets from 5 to 9 and match each set to a numeral."
                                  : course.missionOutcome ?? "Project-based mission output"}
                              </p>
                            </div>
                            {course.id === "course-math" ? (
                              <div className="grid gap-2 text-sm leading-6 text-white/74">
                                <p>
                                  <span className="font-semibold text-white">Activity:</span>{" "}
                                  count cups, tins, seeds, sticks, or bottle tops.
                                </p>
                                <p>
                                  <span className="font-semibold text-white">Evidence:</span>{" "}
                                  game attempt plus teacher observation note.
                                </p>
                                <p>
                                  <span className="font-semibold text-white">Support:</span> AI and
                                  coding stay in teacher/curriculum context.
                                </p>
                              </div>
                            ) : course.sessionBlueprint ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                                  Session rhythm
                                </p>
                                <p className="mt-1 text-sm leading-6 text-white/74">
                                  {course.sessionBlueprint}
                                </p>
                              </div>
                            ) : null}
                            {course.id !== "course-math" && (
                              <p className="text-sm leading-6 text-white/60">
                                {STAGE_HOOKS[stage] ?? STAGE_HOOKS.Mission}
                              </p>
                            )}
                          </div>

                          {course.id === "course-math" ? (
                            <div className="mt-5 rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                                First game
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-6 text-white">
                                PP1 Count The Set
                              </p>
                              <p className="mt-1 text-sm leading-6 text-white/68">
                                Large object sets, number choices, and attempt evidence for counting
                                5-9.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-5 space-y-3">
                              {blendRows(course.id).map((row) => (
                                <div key={`${course.id}-${row.key}`} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em]">
                                    <span className={row.textClass}>{row.label}</span>
                                    <span className="text-white/72">{row.value}%</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-white/10">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${row.barClass}`}
                                      style={{ width: `${row.value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {nextMissions.length > 0 && (
                            <div className="mt-5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                                Next mission
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {nextMissions.map((nextCourse) => (
                                  <Link
                                    key={`${course.id}-next-${nextCourse.id}`}
                                    href={`/courses/${nextCourse.id}`}
                                    className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/78 transition hover:bg-white/12"
                                  >
                                    {nextCourse.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-6 flex flex-wrap gap-2">
                            <Link
                              href={`/courses/${course.id}`}
                              className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
                            >
                              {course.id === "course-math" ? "View roadmap" : "View mission"}
                            </Link>
                            <Link
                              href={
                                course.id === "course-math"
                                  ? "/games/game-pp1-count-sets"
                                  : startHref
                              }
                              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                            >
                              {course.id === "course-math" ? "Play counting game" : "Start mission"}
                            </Link>
                          </div>
                        </aside>
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
