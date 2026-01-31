import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import LessonProgressPanel from "@/components/learning/LessonProgressPanel";
import { getCourse, getLesson, listLessons } from "@/lib/server/data";

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
  ]);

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

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
          <Link href="/courses" className="font-semibold text-orange-600">
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
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${lesson.videoId}`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="border-t border-white/70 px-6 py-5 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Lesson notes
                </p>
                <p className="mt-3">{lesson.notes}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <LessonProgressPanel
              lessonId={lesson.id}
              clerkEnabled={isClerkConfigured}
            />

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
                      }`}
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
                  className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
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
