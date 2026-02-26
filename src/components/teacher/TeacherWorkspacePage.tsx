import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { requireStaff } from "@/lib/server/auth";
import { getTeacherWorkspaceSnapshot } from "@/lib/server/teacher-store";
import TeacherWorkspaceClient, { type WorkspaceTab } from "./TeacherWorkspaceClient";

type TeacherWorkspacePageProps = {
  initialTab: WorkspaceTab;
  redirectUrl?: string;
  searchParams?: {
    classId?: string;
    subjectId?: string;
    strandId?: string;
    activityId?: string;
  };
};

export default async function TeacherWorkspacePage({
  initialTab,
  redirectUrl = "/admin/teach",
  searchParams,
}: TeacherWorkspacePageProps) {
  const staffCheck = await requireStaff();
  if (!staffCheck.ok) {
    if (staffCheck.status === 401) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    }
    if (staffCheck.status === 403) {
      redirect("/dashboard");
    }
    return (
      <div className="min-h-screen bg-amber-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-700">
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
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
  }

  const workspace = await getTeacherWorkspaceSnapshot({
    ownerKey: staffUser.id,
    classId: searchParams?.classId,
    subjectId: searchParams?.subjectId,
    strandId: searchParams?.strandId,
    activityId: searchParams?.activityId,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-sky-50 pb-24">
      <SiteHeader withAuth={false} isStaff isAdmin={staffUser.role === "ADMIN"} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Staff workspace
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Plan lessons, track class progress, and support each learner.
          </h1>
          <p className="max-w-3xl text-slate-700">
            This space keeps your original LearnBridge flow while adding
            class-focused teaching tools inspired by the Medmem patterns.
          </p>
          {workspace.isFallbackData && (
            <p className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              Data may be delayed. Showing fallback classroom data while the database reconnects.
            </p>
          )}
        </header>
        <TeacherWorkspaceClient
          initialWorkspace={workspace}
          initialTab={initialTab}
        />
      </main>
    </div>
  );
}
