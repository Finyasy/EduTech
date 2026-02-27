import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthNav from "@/components/shared/AuthNav";
import SiteHeader from "@/components/shared/SiteHeader";
import {
  compareCoursesByCurriculumPlan,
  getCourseCurriculumPlan,
} from "@/lib/curriculum/learning-path";
import { requireStaff } from "@/lib/server/auth";
import { listCourses, type CourseOverview } from "@/lib/server/data";
import TeacherWorkspaceRouteShell from "./TeacherWorkspaceRouteShell";

type TeacherWorkspaceScaffoldProps = {
  basePath: "/teach" | "/admin/teach";
  variant: "teacher" | "admin";
  children?: ReactNode;
};

export default async function TeacherWorkspaceScaffold({
  basePath,
  variant,
  children,
}: TeacherWorkspaceScaffoldProps) {
  const staffCheck = await requireStaff();
  if (!staffCheck.ok) {
    if (staffCheck.status === 401) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent(basePath)}`);
    }
    if (staffCheck.status === 403) {
      redirect("/dashboard");
    }
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
            {staffCheck.status === 501
              ? "Database not configured. Connect Supabase to enable staff tools."
              : "Staff access required."}
          </div>
        </main>
      </div>
    );
  }

  const staffUser = staffCheck.user;
  if (!staffUser) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(basePath)}`);
  }

  const isAdmin = staffUser.role === "ADMIN";
  const courses = await listCourses().catch(() => [] as CourseOverview[]);
  const orderedCourses = [...courses].sort(compareCoursesByCurriculumPlan);
  const missionPreview = orderedCourses.slice(0, 3);
  const hasCourseFallback = courses.some((course) => course.isFallbackData);
  const title =
    variant === "admin" ? "Admin Teaching Console" : "Teacher Workspace";
  const subtitle =
    variant === "admin"
      ? "Manage classrooms, monitor learning progress, and coordinate teaching sessions from one control surface."
      : "Run teaching sessions, manage learners, and review class progress with staff tools.";

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={basePath}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-300 to-indigo-400 text-sm font-black tracking-tight text-slate-950 shadow-lg shadow-cyan-500/20"
            >
              LB
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-200">
                  LIVE
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                  {staffUser.role}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                  {basePath}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/courses"
              className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-sm font-semibold text-lime-100 transition hover:bg-lime-300/15"
            >
              Learner Courses
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Admin
              </Link>
            )}
            <Link
              href={basePath === "/teach" ? "/admin/teach" : "/teach"}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
            >
              {basePath === "/teach" ? "Open Admin Route" : "Open Alias /teach"}
            </Link>
          </div>

          <div className="shrink-0 rounded-full border border-white/10 bg-white/95 px-2 py-1 shadow-lg shadow-black/20">
            <AuthNav isStaff isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 md:px-6">
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-6 text-white shadow-2xl shadow-black/20">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-400 blur-3xl" />
            <div className="absolute left-8 top-12 h-28 w-28 rounded-full bg-indigo-500 blur-3xl" />
          </div>
          <div className="relative grid gap-4 lg:grid-cols-[1.3fr_auto] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                {variant === "admin" ? "Staff Operations" : "Teacher Operations"}
              </p>
              <h1
                className="text-2xl font-semibold tracking-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                {subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Route
                </p>
                <p className="mt-1 font-semibold text-white">{basePath}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Access
                </p>
                <p className="mt-1 font-semibold text-white">
                  {isAdmin ? "Admin + Teacher" : "Teacher"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-xl shadow-black/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Learner Mission Alignment
              </p>
              <h2
                className="mt-2 text-xl font-semibold tracking-tight md:text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Teach from the same missions learners see in Courses
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This teacher portal now links directly to the learner mission library so
                classroom activities stay aligned with the student-facing curriculum.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/courses"
                className="inline-flex min-h-11 items-center rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-sm font-semibold text-lime-100 transition hover:bg-lime-300/15"
              >
                Open learner courses
              </Link>
            </div>
          </div>

          {hasCourseFallback && (
            <p className="mt-4 inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
              Course catalog data may be delayed. Showing fallback mission alignment.
            </p>
          )}

          {missionPreview.length > 0 && (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {missionPreview.map((course) => (
                <article
                  key={course.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    {course.ageBand && (
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-cyan-100">
                        Ages {course.ageBand}
                      </span>
                    )}
                    {course.pathwayStage && (
                      <span className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-2 py-1 text-indigo-100">
                        {course.pathwayStage}
                      </span>
                    )}
                    {getCourseCurriculumPlan(course.id)?.priority && (
                      <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-2 py-1 text-lime-100">
                        {getCourseCurriculumPlan(course.id)?.priority}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {course.gradeLevel}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    {course.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                    {course.description}
                  </p>
                  {getCourseCurriculumPlan(course.id)?.stickyHook && (
                    <p className="mt-2 text-xs text-slate-400">
                      {getCourseCurriculumPlan(course.id)?.stickyHook}
                    </p>
                  )}
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    {course.aiFocus && (
                      <p>
                        <span className="font-semibold text-slate-100">AI:</span>{" "}
                        {course.aiFocus}
                      </p>
                    )}
                    {course.codingFocus && (
                      <p>
                        <span className="font-semibold text-slate-100">Code:</span>{" "}
                        {course.codingFocus}
                      </p>
                    )}
                    {course.mathFocus && (
                      <p>
                        <span className="font-semibold text-slate-100">Math:</span>{" "}
                        {course.mathFocus}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Preview mission
                    </Link>
                    <Link
                      href={basePath}
                      className="inline-flex min-h-10 items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      Teach in workspace
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <TeacherWorkspaceRouteShell basePath={basePath} courseCatalog={courses} />
        {children}
      </main>
    </div>
  );
}
