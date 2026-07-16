import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import LessonArtifactPanel from "@/components/learning/LessonArtifactPanel";
import LessonProgressPanel from "@/components/learning/LessonProgressPanel";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import { getCourse, getLesson, listLessons } from "@/lib/server/data";
import type { LessonDetail } from "@/lib/server/data";
import {
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  normalizeYouTubeVideoId,
} from "@/lib/youtube";

export const revalidate = 120;
const lessonAuthTimeoutMs = 900;

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
  const authState = await getAuthStateWithTimeout(lessonAuthTimeoutMs);

  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl(`/courses/${courseId}/lessons/${lessonId}`));
  }

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
      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        {authState.status === "timed_out" && (
          <div className="mb-6">
            <LearnerRouteAuthBridge
              redirectUrl={`/courses/${courseId}/lessons/${lessonId}`}
              eyebrow="Learner session"
              title="Checking your lesson access."
              description="The lesson shell is ready. If your session expired, we will move you to sign-in before opening the private lesson flow."
            />
          </div>
        )}

        <div className="mb-6">
          <LearnerPageHeader
            eyebrow={course.title}
            title={`${lesson.order}. ${lesson.title}`}
            description={course.description}
            badges={
              <>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-900">
                  {lessonPhase}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {ageBand}
                </span>
              </>
            }
            actions={
              <Link
                href="/courses"
                className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                ← All courses
              </Link>
            }
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                10-15 min learn
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                15-20 min build
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                5 min reflection
              </span>
            </div>
          </LearnerPageHeader>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-8">
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
                <li className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    1. Watch
                  </p>
                  <p className="mt-2 leading-6">Watch the concept demo and identify one AI idea.</p>
                </li>
                <li className="rounded-[1.5rem] border border-sky-100 bg-sky-50/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    2. Build
                  </p>
                  <p className="mt-2 leading-6">Build or edit code using block logic or Python.</p>
                </li>
                <li className="rounded-[1.5rem] border border-amber-100 bg-amber-50/90 px-4 py-4">
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
            <LessonArtifactPanel lessonId={lesson.id} clerkEnabled={isClerkConfigured} />

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
                        ? "border-sky-100 bg-sky-50/90"
                        : "border-emerald-100 bg-emerald-50/90"
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
                          : "border-white/80 bg-white/90 hover:border-slate-200"
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
              <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Up next
                </p>
                <p
                  className="mt-3 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {nextLesson.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep the momentum going while the context is still fresh.
                </p>
                <Link
                  href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
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
