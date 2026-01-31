import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { getCourse, getLesson, listQuizQuestions } from "@/lib/server/data";
import QuizForm from "./client/QuizForm";

type QuizPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { courseId, lessonId } = await params;
  const course = await getCourse(courseId);
  const lesson = await getLesson(lessonId);

  if (!course || !lesson || lesson.courseId !== courseId) {
    notFound();
  }

  if ("isPublished" in course && !course.isPublished) {
    notFound();
  }
  if ("isPublished" in lesson && !lesson.isPublished) {
    notFound();
  }

  const questions = await listQuizQuestions(lesson.id);

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
        <header className="mb-8 space-y-3">
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}`}
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to lesson
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            {course.title} · Quiz
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lesson.title}
          </h1>
          <p className="text-slate-700">
            Answer the questions below. Your score will be saved when you submit.
          </p>
        </header>
        {questions.length ? (
          <QuizForm lessonId={lesson.id} questions={questions} />
        ) : (
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-600">
            No quiz questions yet. Check back soon.
          </div>
        )}
      </main>
    </div>
  );
}
