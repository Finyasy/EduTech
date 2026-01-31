import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { listCoursesForAdmin, listLessonsForAdmin } from "@/lib/server/data";
import { requireAdmin } from "@/lib/server/auth";
import DeleteCourseButton from "./client/DeleteCourseButton";
import DeleteLessonButton from "./client/DeleteLessonButton";

export default async function AdminPage() {
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const adminCheck = await requireAdmin();

  if (!adminCheck.ok) {
    if (adminCheck.status === 401) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`);
    }
    if (adminCheck.status === 403) {
      redirect("/dashboard");
    }
    return (
      <div className="min-h-screen bg-amber-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-700">
            {adminCheck.status === 501 ? (
              <p className="text-sm">
                Database not configured. Connect Supabase to enable admin tools.
              </p>
            ) : (
              <p className="text-sm">
                Admin access required. Please{" "}
                <Link
                  href="/sign-in"
                  className="text-orange-600 underline decoration-orange-200"
                >
                  sign in
                </Link>{" "}
                with an admin account.
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const courses = await listCoursesForAdmin();
  const lessonsByCourse = await Promise.all(
    courses.map(async (course) => ({
      course,
      lessons: await listLessonsForAdmin(course.id),
    })),
  );

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-10">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
              Admin
            </p>
            <h1
              className="text-3xl font-semibold text-slate-900 md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Content control center
            </h1>
            <p className="text-slate-700">
              Create and manage courses, lessons, and quizzes.
            </p>
          </div>
          {hasDatabase && (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/create-course"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                New course
              </Link>
              <Link
                href="/admin/create-lesson"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                New lesson
              </Link>
            </div>
          )}
        </header>

        {!hasDatabase && (
          <div className="mb-8 rounded-3xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-800">
            Database not configured. Connect Supabase to enable CRUD actions.
          </div>
        )}

        <section className="space-y-6">
          {lessonsByCourse.map(({ course, lessons }) => (
            <div
              key={course.id}
              id={`course-${course.id}`}
              className="rounded-3xl border border-white/70 bg-white/90 p-6 target:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] target:shadow-orange-300/60 target:animate-pulse"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className="text-2xl font-semibold text-slate-900"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {course.title}
                    </h2>
                    {!course.isPublished && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {course.gradeLevel} · {lessons.length} lessons
                  </p>
                </div>
                {hasDatabase && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/create-lesson?courseId=${course.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Add lesson
                    </Link>
                    <DeleteCourseButton
                      courseId={course.id}
                      courseTitle={course.title}
                    />
                  </div>
                )}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2"
                  >
                    <span className="flex items-center gap-2">
                      {lesson.order}. {lesson.title}
                      {!lesson.isPublished && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          Draft
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/courses/${course.id}/lessons/${lesson.id}/edit`}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="text-xs text-orange-600"
                      >
                        View
                      </Link>
                      <DeleteLessonButton
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
