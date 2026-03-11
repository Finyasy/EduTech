import { NextResponse } from "next/server";
import { listCourses } from "@/lib/server/data";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";

export async function GET() {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await listCourses();
  return NextResponse.json(courses);
}
