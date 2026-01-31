import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/shared/SiteHeader";
import { getCourse, listLessons } from "@/lib/server/data";

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

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
  const difficulty =
    "difficulty" in course && course.difficulty
      ? course.difficulty
      : "Grade-based";
  const estimatedMinutes =
    "estimatedMinutes" in course && course.estimatedMinutes
      ? course.estimatedMinutes
      : Math.max(orderedLessons.length * 10, 10);

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="mb-10 space-y-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-orange-200/80 via-amber-100 to-sky-100 p-8 shadow-sm"
            style={
              imageUrl
                ? {
                    backgroundImage: `linear-gradient(120deg, rgba(253, 186, 116, 0.9), rgba(254, 240, 138, 0.85)), url(${imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-orange-300/50 blur-2xl" />
            <div className="relative space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-800">
                Course
              </p>
              <h1
                className="text-3xl font-semibold text-slate-900 md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {course.title}
              </h1>
              <p className="max-w-2xl text-sm text-slate-700">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                <span className="rounded-full bg-white/80 px-3 py-1">
                  {course.gradeLevel}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1">
                  {orderedLessons.length} lesson
                  {orderedLessons.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1">
                  {estimatedMinutes} mins
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1">
                  {difficulty}
                </span>
              </div>
              {orderedLessons.length > 0 && (
                <Link
                  href={`/courses/${courseId}/lessons/${orderedLessons[0].id}`}
                  className="inline-flex rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700"
                >
                  Start course
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lessons
            </p>
            <ul className="mt-4 space-y-2">
              {orderedLessons.length === 0 ? (
                <li className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                  No lessons in this course yet.
                </li>
              ) : (
                orderedLessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {lesson.order}. {lesson.title}
                    </span>
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
                    >
                      {index === 0 ? "Start" : "View"}
                    </Link>
                  </li>
                ))
              )}
            </ul>
            {orderedLessons.length > 0 && (
              <div className="mt-6">
                <Link
                  href={`/courses/${courseId}/lessons/${orderedLessons[0].id}`}
                  className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300"
                >
                  Start course
                </Link>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600">
            <Link
              href="/courses"
              className="text-orange-600 underline decoration-orange-200 hover:text-orange-700"
            >
              ← Back to courses
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
