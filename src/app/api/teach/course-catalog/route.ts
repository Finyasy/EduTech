import { NextResponse } from "next/server";
import {
  getFallbackCourseOverviews,
  listCourses,
  type CourseOverview,
} from "@/lib/server/data";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";

const TEACHER_COURSE_CATALOG_TIMEOUT_MS = 1_200;
const TEACHER_COURSE_CATALOG_CACHE_TTL_MS = 60_000;
const TEACHER_COURSE_CATALOG_CACHE_STALE_TTL_MS =
  process.env.NODE_ENV === "development"
    ? 15 * 60 * 1000
    : 5 * 60 * 1000;

type TeacherCourseCatalogCacheEntry = {
  value: CourseOverview[];
  expiresAt: number;
  staleAt: number;
};

let teacherCourseCatalogCache: TeacherCourseCatalogCacheEntry | null = null;

const readTeacherCourseCatalogCache = (input?: { allowStale?: boolean }) => {
  const cached = teacherCourseCatalogCache;
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (cached.expiresAt > now) {
    return cached.value;
  }

  if (input?.allowStale && cached.staleAt > now) {
    return cached.value;
  }

  if (cached.staleAt <= now) {
    teacherCourseCatalogCache = null;
  }

  return null;
};

const writeTeacherCourseCatalogCache = (value: CourseOverview[]) => {
  const now = Date.now();
  teacherCourseCatalogCache = {
    value,
    expiresAt: now + TEACHER_COURSE_CATALOG_CACHE_TTL_MS,
    staleAt: now + TEACHER_COURSE_CATALOG_CACHE_STALE_TTL_MS,
  };
};

const withTeacherCourseCatalogTimeout = async <T,>(
  promise: Promise<T>,
): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), TEACHER_COURSE_CATALOG_TIMEOUT_MS),
    ),
  ]);

const isLiveCourseCatalog = (courses: CourseOverview[]) =>
  !courses.some((course) => course.isFallbackData);

const toCatalogResponse = (
  courses: CourseOverview[],
  source: "fresh-live" | "live" | "stale-live" | "fallback" | "timeout-fallback",
) =>
  NextResponse.json(courses, {
    headers: { "x-teach-course-catalog-source": source },
  });

export async function GET() {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cachedCourses = readTeacherCourseCatalogCache();
  if (cachedCourses) {
    return toCatalogResponse(cachedCourses, "fresh-live");
  }

  const staleCourses = readTeacherCourseCatalogCache({ allowStale: true });
  const courses = await withTeacherCourseCatalogTimeout(listCourses());

  if (courses && isLiveCourseCatalog(courses)) {
    writeTeacherCourseCatalogCache(courses);
    return toCatalogResponse(courses, "live");
  }

  if (staleCourses) {
    return toCatalogResponse(staleCourses, "stale-live");
  }

  if (courses) {
    return toCatalogResponse(courses, "fallback");
  }

  return toCatalogResponse(getFallbackCourseOverviews(), "timeout-fallback");
}
