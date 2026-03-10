import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import LessonProgressPanel from "@/components/learning/LessonProgressPanel";
import { getCourse, getLesson, listLessons } from "@/lib/server/data";
import type { LessonDetail } from "@/lib/server/data";
import {
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  normalizeYouTubeVideoId,
} from "@/lib/youtube";

export const revalidate = 120;

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = Boolean(
  clerkPublishableKey &&
    clerkPublishableKey.startsWith("pk_") &&
    !clerkPublishableKey.endsWith("..."),
);

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const [course, lesson, lessons] = (await Promise.all([
    getCourse(courseId),
    getLesson(lessonId),
    listLessons(courseId),
  ])) as [
    Awaited<ReturnType<typeof getCourse>>,
    Awaited<ReturnType<typeof getLesson>>,
    LessonDetail[],
  ];

  if (!course || !lesson || lesson.courseId !== courseId) {
    notFound();
  }

  if ("isPublished" in course && !course.isPublished) {
    notFound();
  }
  if ("isPublished" in lesson && !lesson.isPublished) {
    notFound();
  }

  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null;
  const lessonPhase = currentIndex <= 0 ? "Learn" : currentIndex === 1 ? "Build" : "Share";
  const phaseGoal =
    lessonPhase === "Learn"
      ? "Understand the AI and math idea first."
      : lessonPhase === "Build"
        ? "Create and debug your own solution."
        : "Explain your result and improve one part.";
  const videoId = normalizeYouTubeVideoId(lesson.videoId);
  const videoEmbedUrl = videoId ? getYouTubeEmbedUrl(videoId) : null;
  const videoWatchUrl = videoId ? getYouTubeWatchUrl(videoId) : null;
  const ageBand = "ageBand" in course && course.ageBand ? `Ages ${course.ageBand}` : course.gradeLevel;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_32%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[34rem] grid-orbit opacity-30" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/courses"
            className="inline-flex min-h-11 items-center rounded-full border border-white/70 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-200 hover:text-slate-950"
          >
            ← All courses
          </Link>
          <span className="rounded-full border border-white/70 bg-white/78 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur">
            {ageBand}
          </span>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] p-6 text-white shadow-skyline md:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-amber-300/16 blur-3xl" />
                <div className="absolute right-10 top-10 h-44 w-44 rounded-full bg-sky-300/14 blur-3xl" />
              </div>
              <div className="relative space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/62">
                  {course.title}
                </p>
                <h1
                  className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {lesson.order}. {lesson.title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
                  {course.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-4 py-2 text-emerald-100">
                    {lessonPhase}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/72">
                    10-15 min learn
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/72">
                    15-20 min build
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/72">
                    5 min reflection
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-shell overflow-hidden rounded-[2.25rem] border border-white/70 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <div className="aspect-video w-full bg-slate-950">
                {videoEmbedUrl ? (
                  <iframe
                    className="h-full w-full"
                    src={videoEmbedUrl}
                    title={lesson.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/90">
                    This lesson video is currently unavailable.
                  </div>
                )}
              </div>
              <div className="border-t border-white/70 px-6 py-6 text-sm text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Lesson notes
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{lesson.notes}</p>
                  </div>
                  {videoWatchUrl && (
                    <a
                      href={videoWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      Watch on YouTube
                    </a>
                  )}
                </div>
                {!videoEmbedUrl && (
                  <p className="mt-3 text-xs text-rose-700">
                    Ask an admin to update this lesson with a valid YouTube ID or URL.
                  </p>
                )}
              </div>
            </div>

            <div className="glass-shell rounded-[2.25rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Mission checklist
                  </p>
                  <p
                    className="mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {phaseGoal}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-900">
                  {lessonPhase} focus
                </span>
              </div>
              <ul className="mt-5 grid gap-3 md:grid-cols-3 text-sm text-slate-700">
                <li className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/88 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    1. Watch
                  </p>
                  <p className="mt-2 leading-6">Watch the concept demo and identify one AI idea.</p>
                </li>
                <li className="rounded-[1.5rem] border border-sky-100 bg-sky-50/88 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    2. Build
                  </p>
                  <p className="mt-2 leading-6">Build or edit code using block logic or Python.</p>
                </li>
                <li className="rounded-[1.5rem] border border-amber-100 bg-amber-50/88 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                    3. Explain
                  </p>
                  <p className="mt-2 leading-6">
                    Explain the math behind your result in one sentence.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <LessonProgressPanel lessonId={lesson.id} clerkEnabled={isClerkConfigured} />

            <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Safe AI helper
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Use guided prompts to ask for hints safely.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {[
                  "Explain this in kid-friendly words.",
                  "Give me one hint, not the full answer.",
                  "Check if my code has one bug.",
                  "Show me the math step I missed.",
                ].map((prompt, index) => (
                  <li
                    key={prompt}
                    className={`rounded-[1.15rem] border px-3 py-3 ${
                      index % 2 === 0
                        ? "border-sky-100 bg-sky-50/88"
                        : "border-emerald-100 bg-emerald-50/88"
                    }`}
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Lesson lineup
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {lessons.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/courses/${course.id}/lessons/${item.id}`}
                      className={`flex min-h-12 items-center justify-between rounded-[1.25rem] border px-4 py-3 transition ${
                        item.id === lesson.id
                          ? "border-slate-900/10 bg-slate-950 text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)]"
                          : "border-white/80 bg-white/88 hover:border-slate-200"
                      }`}
                    >
                      <span>
                        {item.order}. {item.title}
                      </span>
                      {item.id === lesson.id && (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">
                          Now
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {nextLesson && (
              <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_34%,#14346f_100%)] p-6 text-white shadow-skyline">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                  Up next
                </p>
                <p
                  className="mt-3 text-2xl font-semibold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {nextLesson.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Keep the momentum going while the context is still fresh.
                </p>
                <Link
                  href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Start next lesson
                </Link>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
