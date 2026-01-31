import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { requireAdmin } from "@/lib/server/auth";
import { getCourseForAdmin } from "@/lib/server/data";
import EditCourseForm from "./client/EditCourseForm";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = await params;
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    if (adminCheck.status === 401) {
      redirect(
        `/sign-in?redirect_url=${encodeURIComponent(
          `/admin/courses/${courseId}/edit`,
        )}`,
      );
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

  const course = await getCourseForAdmin(courseId);
  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-10">
        <header className="mb-8 space-y-2">
          <Link
            href="/admin"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to admin
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Admin
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edit course
          </h1>
        </header>
        <EditCourseForm course={course} />
      </main>
    </div>
  );
}
