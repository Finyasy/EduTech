import { NextResponse } from "next/server";
import {
  getFallbackCourseOverviews,
  listCoursesForTeacherWorkspace,
  type CourseOverview,
} from "@/lib/server/data";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";

const TEACHER_COURSE_CATALOG_CACHE_TTL_MS = 60_000;
const TEACHER_COURSE_CATALOG_CACHE_STALE_TTL_MS =
  process.env.NODE_ENV === "development"
    ? 15 * 60 * 1000
    : 5 * 60 * 1000;
const TEACHER_COURSE_CATALOG_ROUTE_TIMEOUT_MS = 450;
const TEACHER_COURSE_CATALOG_RETRY_BACKOFF_MS =
  process.env.NODE_ENV === "development" ? 15_000 : 30_000;

type TeacherCourseCatalogCacheEntry = {
  value: CourseOverview[];
  expiresAt: number;
  staleAt: number;
};

type TeacherCourseCatalogState = {
  cache: TeacherCourseCatalogCacheEntry | null;
  inflight: Promise<CourseOverview[]> | null;
  refreshBackoffUntil: number;
};

const teacherCourseCatalogStateKey = "__teacherCourseCatalogState";

const getTeacherCourseCatalogState = (): TeacherCourseCatalogState => {
  const globalScope = globalThis as typeof globalThis & {
    [teacherCourseCatalogStateKey]?: TeacherCourseCatalogState;
  };

  if (!globalScope[teacherCourseCatalogStateKey]) {
    globalScope[teacherCourseCatalogStateKey] = {
      cache: null,
      inflight: null,
      refreshBackoffUntil: 0,
    };
  }

  return globalScope[teacherCourseCatalogStateKey]!;
};

const readTeacherCourseCatalogCache = (input?: { allowStale?: boolean }) => {
  const cached = getTeacherCourseCatalogState().cache;
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
    getTeacherCourseCatalogState().cache = null;
  }

  return null;
};

const writeTeacherCourseCatalogCache = (value: CourseOverview[]) => {
  const now = Date.now();
  const state = getTeacherCourseCatalogState();
  state.cache = {
    value,
    expiresAt: now + TEACHER_COURSE_CATALOG_CACHE_TTL_MS,
    staleAt: now + TEACHER_COURSE_CATALOG_CACHE_STALE_TTL_MS,
  };
  state.refreshBackoffUntil = 0;
};

const isLiveCourseCatalog = (courses: CourseOverview[]) =>
  !courses.some((course) => course.isFallbackData);

const markTeacherCourseCatalogRefreshBackoff = () => {
  getTeacherCourseCatalogState().refreshBackoffUntil =
    Date.now() + TEACHER_COURSE_CATALOG_RETRY_BACKOFF_MS;
};

const isTeacherCourseCatalogRefreshBackedOff = () =>
  getTeacherCourseCatalogState().refreshBackoffUntil > Date.now();

const withTeacherCourseCatalogRouteTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs = TEACHER_COURSE_CATALOG_ROUTE_TIMEOUT_MS,
): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);

const refreshTeacherCourseCatalog = () => {
  const state = getTeacherCourseCatalogState();
  if (state.inflight) {
    return state.inflight;
  }

  state.inflight = listCoursesForTeacherWorkspace()
    .then((courses) => {
      if (courses.length > 0 && isLiveCourseCatalog(courses)) {
        writeTeacherCourseCatalogCache(courses);
      } else {
        markTeacherCourseCatalogRefreshBackoff();
      }

      return courses;
    })
    .catch((error) => {
      markTeacherCourseCatalogRefreshBackoff();
      throw error;
    })
    .finally(() => {
      state.inflight = null;
    });

  return state.inflight;
};

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
  if (staleCourses) {
    if (!isTeacherCourseCatalogRefreshBackedOff()) {
      void refreshTeacherCourseCatalog().catch(() => {
        // Keep serving stale live data while a background refresh retries.
      });
    }
    return toCatalogResponse(staleCourses, "stale-live");
  }

  if (isTeacherCourseCatalogRefreshBackedOff()) {
    return toCatalogResponse(getFallbackCourseOverviews(), "timeout-fallback");
  }

  try {
    const courses = await withTeacherCourseCatalogRouteTimeout(
      refreshTeacherCourseCatalog(),
    );

    if (courses && isLiveCourseCatalog(courses)) {
      return toCatalogResponse(courses, "live");
    }

    if (courses) {
      return toCatalogResponse(courses, "fallback");
    }
  } catch {
    return toCatalogResponse(getFallbackCourseOverviews(), "timeout-fallback");
  }

  return toCatalogResponse(getFallbackCourseOverviews(), "timeout-fallback");
}
