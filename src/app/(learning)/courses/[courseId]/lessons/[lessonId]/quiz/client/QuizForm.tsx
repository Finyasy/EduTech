"use client";

import { useState } from "react";
import type { QuizQuestionDetail } from "@/lib/server/data";

type QuizFormProps = {
  lessonId: string;
  questions: QuizQuestionDetail[];
};

type AnswerState = Record<string, string>;

type QuestionResult = {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
};

type SubmitResult = {
  score: number;
  total: number;
  results: QuestionResult[];
  saved: boolean;
};

const normalizeOption = (value: string) => value.trim().toLowerCase();
const displayOption = (value: string) => value.trim();

export default function QuizForm({ lessonId, questions }: QuizFormProps) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(
      (question) => !answers[question.id]?.trim(),
    );
    if (unanswered.length > 0) {
      setError("Answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setResult({
          score: typeof data.score === "number" ? data.score : 0,
          total: typeof data.total === "number" ? data.total : 0,
          results: Array.isArray(data.results) ? data.results : [],
          saved: Boolean(data.saved),
        });
      } else {
        setError(
          data?.error ?? "Unable to submit quiz.",
        );
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to submit quiz.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResult = (questionId: string) =>
    result?.results.find((r) => r.questionId === questionId);
  const submitted = result !== null;

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const qResult = getResult(question.id);
        const isCorrect = qResult?.correct;
        const showFeedback = submitted && qResult;

        return (
          <div
            key={question.id}
            className={`rounded-3xl border p-6 ${
              showFeedback
                ? isCorrect
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-rose-200 bg-rose-50/80"
                : "border-white/70 bg-white/90"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Question {index + 1}
              </p>
              {showFeedback && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isCorrect
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              )}
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {question.question}
            </p>
            {question.options?.length ? (
              <div className="mt-4 space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      submitted
                        ? "cursor-default border-slate-100 bg-slate-50/80 text-slate-600"
                        : "border-slate-200 bg-white text-slate-700"
                    } ${
                      showFeedback &&
                      !isCorrect &&
                      qResult?.correctAnswer &&
                      normalizeOption(option) ===
                        normalizeOption(qResult.correctAnswer)
                        ? "ring-2 ring-emerald-400"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      disabled={submitted}
                      className="disabled:pointer-events-none"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[question.id] ?? ""}
                onChange={(event) =>
                  handleAnswerChange(question.id, event.target.value)
                }
                disabled={submitted}
                className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="Type your answer"
              />
            )}
            {showFeedback && !isCorrect && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Correct answer: {displayOption(qResult.correctAnswer)}
                </p>
                {qResult.explanation && (
                  <p className="mt-2 text-amber-800">{qResult.explanation}</p>
                )}
              </div>
            )}
            {showFeedback && isCorrect && qResult.explanation && (
              <p className="mt-4 text-sm text-emerald-800">
                {qResult.explanation}
              </p>
            )}
          </div>
        );
      })}
      <div className="rounded-3xl border border-white/70 bg-white/90 p-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || submitted}
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {isSubmitting
            ? "Submitting..."
            : submitted
              ? "Submitted"
              : "Submit quiz"}
        </button>
        {result && (
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              Score: {result.score} out of {result.total}
              {result.total > 0 && (
                <span className="ml-2 text-slate-600">
                  ({Math.round((result.score / result.total) * 100)}%)
                </span>
              )}
            </p>
            {!result.saved && (
              <p className="text-sm text-slate-600">
                Sign in to save your score.
              </p>
            )}
            <p className="text-sm text-slate-600">
              {result.score === result.total
                ? "Great job! You got them all."
                : result.score > 0
                  ? "Review the incorrect answers above."
                  : "Review the correct answers and try the lesson again."}
            </p>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
