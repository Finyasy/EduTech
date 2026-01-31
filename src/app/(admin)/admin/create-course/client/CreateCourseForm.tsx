"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCourseForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    gradeLevel: "",
    isPublished: false,
  });

  const handleChange = (
    field: "title" | "description" | "gradeLevel" | "isPublished",
    value: string | boolean,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.title.trim() || !formState.description.trim() || !formState.gradeLevel.trim()) {
      setError("Title, description, and grade level are required.");
      return;
    }

    setIsSaving(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          gradeLevel: formState.gradeLevel,
          isPublished: formState.isPublished,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setResult("Course created.");
        setFormState({
          title: "",
          description: "",
          gradeLevel: "",
          isPublished: false,
        });
        const courseId = typeof data?.courseId === "string" ? data.courseId : "";
        router.push(courseId ? `/admin#course-${courseId}` : "/admin");
        router.refresh();
      } else {
        setError(data?.error ?? "Unable to create course.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create course.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    Boolean(formState.title.trim()) &&
    Boolean(formState.description.trim()) &&
    Boolean(formState.gradeLevel.trim());

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6">
      <div className="grid gap-4">
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
          Description
          <textarea
            value={formState.description}
            onChange={(event) => handleChange("description", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            rows={4}
          />
        </label>
        <label className="text-sm text-slate-700">
          Grade level
          <input
            type="text"
            value={formState.gradeLevel}
            onChange={(event) => handleChange("gradeLevel", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
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
          {isSaving ? "Saving..." : "Create course"}
        </button>
        {result && <p className="text-sm text-slate-600">{result}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
