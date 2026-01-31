import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";
import { listCourses } from "@/lib/server/data";

export default async function CoursesPage() {
  const courses = await listCourses();
  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Course library
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pick a course and start learning.
          </h1>
          <p className="max-w-2xl text-slate-700">
            Each course mixes short videos, quick quizzes, and games to keep
            learners engaged and moving forward.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {course.gradeLevel}
                  </p>
                  <h2
                    className="text-2xl font-semibold text-slate-900"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {course.title}
                  </h2>
                </div>
                <p className="text-sm text-slate-600">{course.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{course.lessonCount} lessons</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      View course
                    </Link>
                    <Link
                      href={
                        course.firstLessonId
                          ? `/courses/${course.id}/lessons/${course.firstLessonId}`
                          : `/courses/${course.id}`
                      }
                      className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
                    >
                      Start course
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
