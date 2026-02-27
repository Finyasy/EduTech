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
  const [course, lesson, lessons] = await Promise.all([
    getCourse(courseId),
    getLesson(lessonId),
    listLessons(courseId),
  ]) as [Awaited<ReturnType<typeof getCourse>>, Awaited<ReturnType<typeof getLesson>>, LessonDetail[]];

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
  const lessonPhase =
    currentIndex <= 0 ? "Learn" : currentIndex === 1 ? "Build" : "Share";
  const phaseGoal =
    lessonPhase === "Learn"
      ? "Understand the AI and math idea first."
      : lessonPhase === "Build"
        ? "Create and debug your own solution."
        : "Explain your result and improve one part.";
  const videoId = normalizeYouTubeVideoId(lesson.videoId);
  const videoEmbedUrl = videoId ? getYouTubeEmbedUrl(videoId) : null;
  const videoWatchUrl = videoId ? getYouTubeWatchUrl(videoId) : null;

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
          <Link
            href="/courses"
            className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold text-orange-600 transition hover:bg-orange-100/70"
          >
            ← All courses
          </Link>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {course.gradeLevel}
          </span>
        </div>

        <section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                {course.title}
              </p>
              <h1
                className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {lesson.order}. {lesson.title}
              </h1>
              <p className="mt-3 text-sm text-slate-600">{course.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                <span className="rounded-full bg-lime-100 px-3 py-1 text-lime-800">
                  {lessonPhase}
                </span>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-800">
                  10-15 min learn
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                  15-20 min build
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  5 min reflection
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm">
              <div className="aspect-video w-full bg-slate-900">
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
              <div className="border-t border-white/70 px-6 py-5 text-sm text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Lesson notes
                    </p>
                    <p className="mt-3">{lesson.notes}</p>
                  </div>
                  {videoWatchUrl && (
                    <a
                      href={videoWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300"
                    >
                      Watch on YouTube
                    </a>
                  )}
                </div>
                {!videoEmbedUrl && (
                  <p className="mt-3 text-xs text-rose-700">
                    Ask an admin to update this lesson with a valid YouTube ID
                    or URL.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-lime-100 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Mission checklist
              </p>
              <p className="mt-3 text-sm text-slate-700">{phaseGoal}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                  1. Watch the concept demo and identify one AI idea.
                </li>
                <li className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                  2. Build or edit code using block logic or Python.
                </li>
                <li className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                  3. Explain the math behind your result in one sentence.
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <LessonProgressPanel
              lessonId={lesson.id}
              clerkEnabled={isClerkConfigured}
            />

            <div className="rounded-3xl border border-cyan-100 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Safe AI helper
              </p>
              <p className="mt-3 text-sm text-slate-700">
                Use guided prompts to ask for hints safely.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {[
                  "Explain this in kid-friendly words.",
                  "Give me one hint, not the full answer.",
                  "Check if my code has one bug.",
                  "Show me the math step I missed.",
                ].map((prompt) => (
                  <li key={prompt} className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Lesson lineup
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {lessons.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/courses/${course.id}/lessons/${item.id}`}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        item.id === lesson.id
                          ? "border-orange-200 bg-orange-50 text-orange-900"
                          : "border-slate-100 bg-white hover:border-orange-100"
                      } min-h-11`}
                    >
                      <span>
                        {item.order}. {item.title}
                      </span>
                      {item.id === lesson.id && (
                        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                          Now
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {nextLesson && (
              <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-sm text-slate-700 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Up next
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {nextLesson.title}
                </p>
                <Link
                  href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
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
