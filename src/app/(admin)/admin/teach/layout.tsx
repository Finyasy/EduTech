import type { ReactNode } from "react";
import TeacherWorkspaceScaffold from "@/components/teacher/TeacherWorkspaceScaffold";

export const dynamic = "force-dynamic";

export default async function AdminTeachLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TeacherWorkspaceScaffold basePath="/admin/teach" variant="admin">
      {children}
    </TeacherWorkspaceScaffold>
  );
}
