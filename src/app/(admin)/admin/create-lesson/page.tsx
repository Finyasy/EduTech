import SiteHeader from "@/components/shared/SiteHeader";
import { requireAdmin } from "@/lib/server/auth";
import { listCoursesForAdmin } from "@/lib/server/data";
import { redirect } from "next/navigation";
import CreateLessonForm from "./client/CreateLessonForm";

type CreateLessonPageProps = {
  searchParams: { courseId?: string };
};

export default async function CreateLessonPage({
  searchParams,
}: CreateLessonPageProps) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    if (adminCheck.status === 401) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin/create-lesson")}`);
    }
    if (adminCheck.status === 403) {
      redirect("/dashboard");
    }
    return (
      <div className="min-h-screen bg-amber-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-10">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-700">
            {adminCheck.status === 501
              ? "Database not configured."
              : "Admin access required."}
          </div>
        </main>
      </div>
    );
  }

  const { courseId: defaultCourseId } = searchParams;
  const courses = await listCoursesForAdmin();

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-10">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Admin
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create a new lesson
          </h1>
        </header>
        <CreateLessonForm
          courses={courses}
          defaultCourseId={defaultCourseId}
        />
      </main>
    </div>
  );
}
