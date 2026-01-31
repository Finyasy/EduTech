"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseForAdmin } from "@/lib/server/data";

type CreateLessonFormProps = {
  courses: CourseForAdmin[];
  defaultCourseId?: string;
};

export default function CreateLessonForm({
  courses,
  defaultCourseId,
}: CreateLessonFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    courseId: defaultCourseId ?? courses[0]?.id ?? "",
    title: "",
    videoId: "",
    order: "1",
    notes: "",
    isPublished: false,
  });

  const handleChange = (
    field: keyof typeof formState,
    value: string | boolean,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.courseId) {
      setError("Create a course first.");
      return;
    }
    if (
      !formState.title.trim() ||
      !formState.videoId.trim() ||
      !formState.notes.trim() ||
      !formState.order.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    setIsSaving(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: formState.courseId,
          title: formState.title,
          videoId: formState.videoId,
          order: Number(formState.order),
          notes: formState.notes,
          isPublished: formState.isPublished,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setResult("Lesson created.");
        setFormState({
          courseId: formState.courseId,
          title: "",
          videoId: "",
          order: String(Number(formState.order) + 1),
          notes: "",
          isPublished: false,
        });
        router.push(`/admin#course-${formState.courseId}`);
        router.refresh();
      } else {
        setError(data?.error ?? "Unable to create lesson.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create lesson.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    Boolean(formState.courseId) &&
    Boolean(formState.title.trim()) &&
    Boolean(formState.videoId.trim()) &&
    Boolean(formState.notes.trim()) &&
    Number(formState.order) >= 1;

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6">
      <div className="grid gap-4">
        {courses.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            Create a course before adding lessons.
          </div>
        )}
        <label className="text-sm text-slate-700">
          Course
          <select
            value={formState.courseId}
            onChange={(event) => handleChange("courseId", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            disabled={courses.length === 0}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Title
          <input
            type="text"
            value={formState.title}
            onChange={(event) => handleChange("title", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          YouTube video ID
          <input
            type="text"
            value={formState.videoId}
            onChange={(event) => handleChange("videoId", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Lesson order
          <input
            type="number"
            min="1"
            value={formState.order}
            onChange={(event) => handleChange("order", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Notes
          <textarea
            value={formState.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            rows={4}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={formState.isPublished}
            onChange={(event) => handleChange("isPublished", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Published (visible to students)
        </label>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !canSubmit}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {isSaving ? "Saving..." : "Create lesson"}
        </button>
        {result && <p className="text-sm text-slate-600">{result}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
