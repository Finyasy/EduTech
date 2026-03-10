import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/shared/SiteHeader";
import { getCourseCurriculumPlan } from "@/lib/curriculum/learning-path";
import { getCourse, listLessons } from "@/lib/server/data";

export const revalidate = 120;

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
  return { title: `${course.title} | LearnBridge` };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  if ("isPublished" in course && !course.isPublished) {
    notFound();
  }

  const lessons = await listLessons(course.id);
  const orderedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const imageUrl = "imageUrl" in course ? course.imageUrl : null;
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_12%_14%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[36rem] grid-orbit opacity-30" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-8 md:px-8">
        <header className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-12">
          {imageUrl ? (
            <div
              className="absolute inset-0 opacity-18"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-8 top-20 h-44 w-44 rounded-full bg-amber-300/18 blur-3xl" />
            <div className="absolute right-12 top-8 h-56 w-56 rounded-full bg-sky-300/18 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-300/12 blur-3xl" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/78">
                  Mission detail
                </span>
                <span
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${stageTone(pathwayStage)}`}
                >
                  {pathwayStage} path
                </span>
                {curriculumPlan?.priority && (
                  <span className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
                    {curriculumPlan.priority}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <h1
                  className="max-w-4xl text-4xl font-semibold leading-[1.03] md:text-6xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {course.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                  {course.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                  {ageBandLabel}
                </span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                  {orderedLessons.length} lesson{orderedLessons.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                  {estimatedMinutes} mins
                </span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                  {difficulty}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {orderedLessons.length > 0 && (
                  <Link
                    href={startHref}
                    className="inline-flex min-h-12 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5"
                  >
                    Start mission
                  </Link>
                )}
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/16 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Back to library
                </Link>
              </div>
            </div>

            <div className="glass-shell relative overflow-hidden rounded-[2rem] border border-white/12 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.26)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(252,211,77,0.18),rgba(125,211,252,0.16),transparent)]" />
              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                      Mission profile
                    </p>
                    <h2
                      className="mt-2 text-2xl font-semibold text-slate-950"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {curriculumPlan?.badgeLabel ?? "Studio Mission"}
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-xs font-semibold text-emerald-900">
                    Ready for lesson 1
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-slate-900/8 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
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
                  <article className="rounded-[1.35rem] border border-white/80 bg-white/88 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      AI
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{aiFocus}</p>
                  </article>
                  <article className="rounded-[1.35rem] border border-white/80 bg-white/88 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Coding
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{codingFocus}</p>
                  </article>
                  <article className="rounded-[1.35rem] border border-white/80 bg-white/88 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Maths
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{mathFocus}</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-shell rounded-[2.25rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Inside this mission
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/88 p-4 text-emerald-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  AI concept
                </p>
                <p className="mt-2 text-sm font-semibold">{aiFocus}</p>
              </article>
              <article className="rounded-[1.5rem] border border-sky-100 bg-sky-50/88 p-4 text-sky-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Coding skill
                </p>
                <p className="mt-2 text-sm font-semibold">{codingFocus}</p>
              </article>
              <article className="rounded-[1.5rem] border border-amber-100 bg-amber-50/88 p-4 text-amber-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Maths concept
                </p>
                <p className="mt-2 text-sm font-semibold">{mathFocus}</p>
              </article>
            </div>

            <div className="mt-4 rounded-[1.7rem] border border-slate-200/80 bg-white/88 p-5">
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
              <article className="rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Assessment style
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {assessmentTone(pathwayStage)}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-4">
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
              <li className="rounded-[1.7rem] border border-slate-200/80 bg-white/88 px-4 py-8 text-center text-sm text-slate-500 lg:col-span-3">
                No lessons in this course yet.
              </li>
            ) : (
              orderedLessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="rounded-[1.7rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
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
