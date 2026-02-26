import type { ReactNode } from "react";
import TeacherWorkspaceScaffold from "@/components/teacher/TeacherWorkspaceScaffold";

export const dynamic = "force-dynamic";

export default async function TeachLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TeacherWorkspaceScaffold basePath="/teach" variant="teacher">
      {children}
    </TeacherWorkspaceScaffold>
  );
}
