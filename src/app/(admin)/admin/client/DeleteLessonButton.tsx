"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteLessonButtonProps = {
  lessonId: string;
  lessonTitle: string;
};

export default function DeleteLessonButton({
  lessonId,
  lessonTitle,
}: DeleteLessonButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete lesson "${lessonTitle}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/lesson/${lessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to delete lesson.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
    >
      {isDeleting ? "..." : "Delete"}
    </button>
  );
}
