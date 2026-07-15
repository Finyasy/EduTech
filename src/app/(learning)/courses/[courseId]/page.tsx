import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { getCourseCurriculumPlan } from "@/lib/curriculum/learning-path";
import {
  FIRST_MATH_VERTICAL_SLICE,
  PP1_TERM2_ALIGNMENT,
} from "@/lib/curriculum/math-roadmap";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import { getCourse, listLessons } from "@/lib/server/data";

export const revalidate = 120;
const courseDetailAuthTimeoutMs = 900;

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

type BlendRow = {
  key: "ai" | "coding" | "math";
  label: string;
  value: number;
  barClass: string;
  textClass: string;
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

const LESSON_MOMENTS = [
  "Concept unlock",
  "Build sprint",
  "Share and refine",
  "Extension challenge",
];

const MATHS_ROADMAP_BLOCKS = [
  {
    label: "Start here",
    title: "Begin with PP1 counting 5-9",
    body: "This maths path starts with real object sets, clear number choices, and short practice that helps learners count carefully.",
  },
  {
    label: "Practice",
    title: "Count, choose, and check",
    body: "Learners count cups, tins, seeds, sticks, and bottle tops, then match each set to the correct numeral.",
  },
  {
    label: "What comes next",
    title: "Build confidence before moving on",
    body: "After counting is steady, the roadmap continues into sequencing, number writing, measurement, and later PP2 to Grade 3 maths skills.",
  },
];

const MATHS_TERM_SEQUENCE = [
  "Next: ordering numbers and finding missing numbers",
  "After that: numeral writing and early measurement",
  "Later: stronger maths confidence from PP2 into Grade 1-3",
];

const MATHS_REVIEW_CHECKS = [
  "Start with real classroom objects before the game.",
  "Count each object once and say the number clearly.",
  "Choose the matching numeral after counting.",
  "Use the game for extra practice, not as the first activity.",
  "Keep building toward PP2 and Grade 1 readiness.",
];

const PP1_COUNTING_CLASSROOM_FLOW = [
  {
    label: "Activity",
    value: "Count real cups, tins, seeds, sticks, or bottle tops in sets of 5 to 9.",
  },
  {
    label: "Evidence",
    value: "Learner counts each object once and chooses the matching numeral.",
  },
  {
    label: "Teacher note",
    value: "Record skipped counts, double-counts, correct matches, and prompt level.",
  },
];

function stageTone(stage?: string) {
  if (stage === "Explorer") return "border-amber-200 bg-amber-50 text-amber-900";
  if (stage === "Builder") return "border-sky-200 bg-sky-50 text-sky-900";
  if (stage === "Creator") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function assessmentTone(stage?: string) {
  if (stage === "Explorer") return "Show-and-tell checkpoints";
  if (stage === "Builder") return "Debug, improve, and retest";
  if (stage === "Creator") return "Demo, defend, and reflect";
  return "Project reflection";
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

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) return { title: "Course | LearnBridge" };
  if ("isPublished" in course && !course.isPublished) {
    return { title: "Course | LearnBridge" };
  }
  if (courseId === "course-math") {
    return { title: "Kenya CBC/CBE Maths Roadmap | LearnBridge" };
  }
  return { title: `${course.title} | LearnBridge` };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const authState = await getAuthStateWithTimeout(courseDetailAuthTimeoutMs);

  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl(`/courses/${courseId}`));
  }

  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  if ("isPublished" in course && !course.isPublished) {
    notFound();
  }

  const lessons = await listLessons(course.id);
  const orderedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const difficulty = "difficulty" in course && course.difficulty ? course.difficulty : "Mission";
  const ageBand = "ageBand" in course && course.ageBand ? course.ageBand : course.gradeLevel;
  const ageBandLabel = /^\d+-\d+$/.test(ageBand) ? `Ages ${ageBand}` : ageBand;
  const pathwayStage =
    "pathwayStage" in course && course.pathwayStage ? course.pathwayStage : "Learner";
  const aiFocus =
    "aiFocus" in course && course.aiFocus ? course.aiFocus : "Age-appropriate AI concept";
  const codingFocus =
    "codingFocus" in course && course.codingFocus ? course.codingFocus : "Core coding practice";
  const mathFocus = "mathFocus" in course && course.mathFocus ? course.mathFocus : "Math in context";
  const missionOutcome =
    "missionOutcome" in course && course.missionOutcome
      ? course.missionOutcome
      : "Build and share a project";
  const sessionBlueprint =
    "sessionBlueprint" in course && course.sessionBlueprint
      ? course.sessionBlueprint
      : "10 min learn, 20 min build, 5 min share";
  const estimatedMinutes =
    "estimatedMinutes" in course && course.estimatedMinutes
      ? course.estimatedMinutes
      : Math.max(orderedLessons.length * 10, 10);
  const curriculumPlan = getCourseCurriculumPlan(course.id);
  const startHref =
    orderedLessons.length > 0
      ? `/courses/${courseId}/lessons/${orderedLessons[0].id}`
      : `/courses/${courseId}`;

  if (course.id === "course-math") {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <SiteHeader withAuth={false} />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-8 md:px-8">
          {authState.status === "timed_out" && (
            <LearnerRouteAuthBridge
              redirectUrl={`/courses/${courseId}`}
              eyebrow="Learner session"
              title="Checking your maths roadmap access."
              description="The roadmap is ready. If your session expired, we will move you to sign-in before opening the full maths view."
            />
          )}

          <LearnerPageHeader
            eyebrow="Mathematics roadmap"
            title="Kenya CBC/CBE Maths Roadmap"
            description="A classroom-first path for Mathematical Activities. Start with PP1 counting 5-9, collect teacher evidence, then extend the same structure into PP2 and Grade 1-3."
            titleClassName="max-w-4xl text-3xl font-semibold leading-[1.08] text-slate-950 md:text-4xl"
            badges={
              <>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900">
                  PP1 first
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-900">
                  CBC/CBE aligned
                </span>
              </>
            }
            actions={
              <>
                <Link
                  href={`/games/${FIRST_MATH_VERTICAL_SLICE.gameId}`}
                  className="inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Play PP1 counting game
                </Link>
                <Link
                  href="#pp1-week-1"
                  className="inline-flex min-h-12 items-center rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:border-amber-300"
                >
                  View PP1 Week 1 plan
                </Link>
                {orderedLessons.length > 0 && (
                  <Link
                    href={startHref}
                    className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Open maths lesson
                  </Link>
                )}
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Back to library
                </Link>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: "Start level", value: "PP1" },
                  { label: "Current slice", value: "PP1 Term 2 Week 1" },
                  { label: "Focus", value: "Counting 5-9" },
                  { label: "Practice", value: "5 sets to try" },
                ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </LearnerPageHeader>

          <section className="grid gap-5 lg:grid-cols-3">
            {MATHS_ROADMAP_BLOCKS.map((block) => (
              <article
                key={block.label}
                className="rounded-[1.8rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {block.label}
                </p>
                <h2
                  className="mt-2 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {block.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{block.body}</p>
              </article>
            ))}
          </section>

          <section
            id="pp1-week-1"
            className="rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  PP1 Term 2 Week 1
                </p>
                <h2
                  className="mt-2 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Counting 5-9 is the first maths practice slice.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep the learner task simple: count each object once, then choose the matching
                  number. The digital game supports teacher observation; it does not replace
                  classroom counting with real objects.
                </p>
              </div>
              <Link
                href={`/games/${FIRST_MATH_VERTICAL_SLICE.gameId}`}
                className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Play PP1 Count The Set
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {PP1_COUNTING_CLASSROOM_FLOW.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.35rem] border border-amber-100 bg-amber-50/80 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
              <div className="grid grid-cols-[0.9fr_1.35fr_1.2fr_1.25fr] gap-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-lg:hidden">
                <span>Strand</span>
                <span>Competency</span>
                <span>Activity / Game</span>
                <span>Evidence</span>
              </div>
              {PP1_TERM2_ALIGNMENT.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 border-b border-slate-200 px-4 py-4 last:border-b-0 lg:grid-cols-[0.9fr_1.35fr_1.2fr_1.25fr]"
                >
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                      Strand
                    </p>
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                      {item.strand}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                      Competency
                    </p>
                    <p className="text-sm font-semibold leading-6 text-slate-950">
                      {item.competency}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                      Activity / Game
                    </p>
                    <p className="text-sm leading-6 text-slate-700">{item.classroomActivity}</p>
                    {item.gameId ? (
                      <Link
                        href={`/games/${item.gameId}`}
                        className="mt-2 inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 transition hover:border-sky-300"
                      >
                        Open game
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Game placeholder
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                      Evidence
                    </p>
                    <p className="text-sm leading-6 text-slate-700">{item.evidence}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                What comes next
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                After counting 5-9, learners keep building number confidence.
              </h2>
              <div className="mt-5 space-y-3">
                {MATHS_TERM_SEQUENCE.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[1.35rem] border border-slate-200 bg-white/90 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Remember
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Maths stays primary from the first click.
              </h2>
              <ul className="mt-5 space-y-3">
                {MATHS_REVIEW_CHECKS.map((check) => (
                  <li
                    key={check}
                    className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm font-semibold leading-6 text-emerald-950"
                  >
                    {check}
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Practice summary
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PP1 Term 2 Week 1: Counting 5-9
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Count the objects. Choose the matching number. Try again if you missed one.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Game", value: "PP1 Count The Set" },
                  { label: "Sets", value: "5 object groups" },
                  { label: "Goal", value: "Match each set to 5, 6, 7, 8, or 9" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <div className="rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Maths lesson steps
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Open the lesson path after the first counting game.
              </h2>
              {orderedLessons.length > 0 && (
                <Link
                  href={startHref}
                  className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                >
                  Open first step
                </Link>
              )}
              <ul className="mt-5 grid gap-4">
                {orderedLessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Step {index + 1}
                        </p>
                        <h3
                          className="mt-2 text-xl font-semibold text-slate-950"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {lesson.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{lesson.notes}</p>
                      </div>
                      <Link
                        href={`/courses/${courseId}/lessons/${lesson.id}`}
                        className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                      >
                        Open lesson
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <p className="text-sm text-slate-600">
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center rounded-full px-2 text-slate-700 underline decoration-slate-300 transition hover:bg-slate-100/70 hover:text-slate-950"
            >
              Back to courses
            </Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader withAuth={false} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-8 md:px-8">
        {authState.status === "timed_out" && (
          <LearnerRouteAuthBridge
            redirectUrl={`/courses/${courseId}`}
            eyebrow="Learner session"
            title="Checking your mission access."
            description="The mission page is ready. If your session expired, we will move you to sign-in before opening the private course detail."
          />
        )}

        <div className="mb-0">
          <LearnerPageHeader
            eyebrow="Mission detail"
            title={course.title}
            description={course.description}
            titleClassName="max-w-4xl text-3xl font-semibold leading-[1.08] text-slate-950 md:text-4xl"
            badges={
              <>
                <span
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${stageTone(pathwayStage)}`}
                >
                  {pathwayStage} path
                </span>
                {curriculumPlan?.priority && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-900">
                    {curriculumPlan.priority}
                  </span>
                )}
              </>
            }
            actions={
              <>
                {orderedLessons.length > 0 && (
                  <Link
                    href={startHref}
                    className="inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    Start mission
                  </Link>
                )}
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Back to library
                </Link>
              </>
            }
          >
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {ageBandLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {orderedLessons.length} lesson{orderedLessons.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {estimatedMinutes} mins
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {difficulty}
                </span>
              </div>

            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.7rem] border border-slate-200 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/48">
                      Mission profile
                    </p>
                    <h2
                      className="mt-2 text-2xl font-semibold text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {curriculumPlan?.badgeLabel ?? "Studio Mission"}
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-xs font-semibold text-emerald-900">
                    Ready for lesson 1
                  </div>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                    Outcome
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{missionOutcome}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                    Session rhythm
                </p>
                <p className="mt-2 text-sm leading-6 text-white/74">{sessionBlueprint}</p>

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
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    AI
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{aiFocus}</p>
                </article>
                <article className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Coding
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{codingFocus}</p>
                </article>
                <article className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Maths
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{mathFocus}</p>
                </article>
              </div>
            </div>
          </div>
          </LearnerPageHeader>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-shell rounded-[2.25rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Inside this mission
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/90 p-4 text-emerald-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  AI concept
                </p>
                <p className="mt-2 text-sm font-semibold">{aiFocus}</p>
              </article>
              <article className="rounded-[1.5rem] border border-sky-100 bg-sky-50/90 p-4 text-sky-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Coding skill
                </p>
                <p className="mt-2 text-sm font-semibold">{codingFocus}</p>
              </article>
              <article className="rounded-[1.5rem] border border-amber-100 bg-amber-50/90 p-4 text-amber-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Maths concept
                </p>
                <p className="mt-2 text-sm font-semibold">{mathFocus}</p>
              </article>
            </div>

            <div className="mt-4 rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Why this mission works
              </p>
              <p
                className="mt-2 text-xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                One clear learning arc, one concrete build, one explain-your-thinking moment.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Learners do not need to decode the interface to get started. The mission keeps the
                task visible, the session short, and the product output meaningful enough to show a
                teacher or family member.
              </p>
            </div>
          </div>

          <aside className="glass-shell rounded-[2.25rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Assessment model
            </p>
            <div className="mt-4 space-y-3">
              <article className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Assessment style
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {assessmentTone(pathwayStage)}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  What adults notice
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Better learner explanations, stronger debugging stamina, and clearer evidence of
                  AI, coding, and maths transfer inside one session.
                </p>
              </article>
            </div>
          </aside>
        </section>

        <section className="glass-shell rounded-[2.25rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Lesson runway
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Learners know what comes next at every step.
              </h2>
            </div>
            {orderedLessons.length > 0 && (
              <Link
                href={startHref}
                className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Jump into lesson 1
              </Link>
            )}
          </div>

          <ul className="mt-5 grid gap-4 lg:grid-cols-3">
            {orderedLessons.length === 0 ? (
              <li className="rounded-[1.7rem] border border-slate-200/80 bg-white/90 px-4 py-8 text-center text-sm text-slate-500 lg:col-span-3">
                No lessons in this course yet.
              </li>
            ) : (
              orderedLessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {LESSON_MOMENTS[index] ?? "Studio extension"}
                      </p>
                      <h3
                        className="mt-2 text-xl font-semibold text-slate-950"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {lesson.order}. {lesson.title}
                      </h3>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {index === 0 ? "Learn" : index === 1 ? "Build" : "Share"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {index === 0
                      ? "Learners unlock the key idea with one example and one immediate win."
                      : index === 1
                        ? "The build moment turns the concept into something visible and testable."
                        : "Learners explain, present, or improve the output so understanding sticks."}
                  </p>
                  <div className="mt-5">
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                    >
                      {index === 0 ? "Start lesson" : "Open lesson"}
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="text-sm text-slate-600">
          <Link
            href="/courses"
            className="inline-flex min-h-11 items-center rounded-full px-2 text-slate-700 underline decoration-slate-300 transition hover:bg-slate-100/70 hover:text-slate-950"
          >
            ← Back to courses
          </Link>
        </p>
      </main>
    </div>
  );
}
