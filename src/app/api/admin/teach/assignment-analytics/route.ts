import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { getTeacherAssignmentAnalyticsReport } from "@/lib/server/teacher-store";
import {
  isDatabaseFailureError,
  toDatabaseFailureResponse,
} from "@/lib/server/request";

const querySchema = z.object({
  ownerKey: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  target: z.enum(["CLASS", "NEEDS_PRACTICE"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const parseDateParam = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: access.status },
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    ownerKey: url.searchParams.get("ownerKey") ?? undefined,
    classId: url.searchParams.get("classId") ?? undefined,
    target: url.searchParams.get("target") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const dateFrom = parseDateParam(parsed.data.dateFrom);
  const dateTo = parseDateParam(parsed.data.dateTo);

  if (parsed.data.dateFrom && !dateFrom) {
    return NextResponse.json({ error: "Invalid dateFrom." }, { status: 400 });
  }
  if (parsed.data.dateTo && !dateTo) {
    return NextResponse.json({ error: "Invalid dateTo." }, { status: 400 });
  }
  if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
    return NextResponse.json(
      { error: "dateFrom must be before or equal to dateTo." },
      { status: 400 },
    );
  }

  let report;
  try {
    report = await getTeacherAssignmentAnalyticsReport({
      ownerKey: parsed.data.ownerKey,
      classId: parsed.data.classId,
      target: parsed.data.target,
      dateFrom,
      dateTo,
    });
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, "admin-assignment-analytics");
    }
    throw error;
  }

  return NextResponse.json(report);
}
