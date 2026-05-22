import Link from "next/link";
import { notFound } from "next/navigation";
import MissionArtwork from "@/components/shared/MissionArtwork";
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_32%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[34rem] grid-orbit opacity-30" />
      <SiteHeader withAuth={false} />
      <main className="relative mx-auto w-full max-w-5xl px-6 pb-16 pt-10">
        <header className="mb-8 rounded-[2.4rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] p-6 text-white shadow-skyline md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-start">
            <div>
              <Link
                href={`/courses/${courseId}/lessons/${lessonId}`}
                className="inline-flex min-h-10 items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                ← Back to lesson
              </Link>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/76">
                {course.title} · Quiz
              </p>
              <h1
                className="mt-3 text-3xl font-semibold text-white md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {lesson.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/84">
                Answer every question, then submit once. Your score is saved when your learner
                session is active.
              </p>
            </div>
            <MissionArtwork
              className="h-52 border-white/15"
              imageClassName="object-[center_42%]"
              label={`${lesson.title} quiz studio`}
              priority
            />
          </div>
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
