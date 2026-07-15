"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { GameLevelConfig } from "@/lib/server/data";

type GamePlayProps = {
  gameId: string;
  levels: GameLevelConfig[];
  clerkEnabled: boolean;
};

type GameSessionProps = {
  gameId: string;
  levels: GameLevelConfig[];
  isSignedIn: boolean;
};

type BestStats = {
  bestScore: number;
  bestTimeMs: number;
};

const getBestKey = (gameId: string) => `edutech.game.${gameId}.best`;
const PP1_COUNT_GAME_ID = "game-pp1-count-sets";

type PP1CountObjectKind = "cup" | "bottleTop" | "stick" | "tin" | "seed";

const PP1_COUNT_OBJECTS: Record<
  string,
  { label: string; singular: string; kind: PP1CountObjectKind }
> = {
  "level-pp1-count-5": {
    label: "cups",
    singular: "cup",
    kind: "cup",
  },
  "level-pp1-count-6": {
    label: "bottle tops",
    singular: "top",
    kind: "bottleTop",
  },
  "level-pp1-count-7": {
    label: "sticks",
    singular: "stick",
    kind: "stick",
  },
  "level-pp1-count-8": {
    label: "tins",
    singular: "tin",
    kind: "tin",
  },
  "level-pp1-count-9": {
    label: "seeds",
    singular: "seed",
    kind: "seed",
  },
};

function parseCount(answer: string) {
  const count = Number(answer);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function PP1ObjectSet({
  count,
  levelId,
}: {
  count: number;
  levelId: string;
}) {
  const object = PP1_COUNT_OBJECTS[levelId] ?? {
    label: "objects",
    singular: "item",
    kind: "cup" as const,
  };

  return (
    <div className="rounded-[2rem] border border-amber-100 bg-amber-50/70 p-4 md:p-5">
      <p className="text-center text-sm font-semibold text-amber-950">
        Count the {object.label}.
      </p>
      <div
        className="mx-auto mt-4 grid max-w-xl grid-cols-3 gap-3 sm:grid-cols-5"
        aria-label={`${count} ${object.label}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`${levelId}-${index}`}
            className="flex aspect-square min-h-16 items-center justify-center rounded-[1.25rem] border border-white bg-white/80 p-2 shadow-sm"
          >
            <PP1ObjectVisual kind={object.kind} label={object.singular} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PP1ObjectVisual({
  kind,
  label,
}: {
  kind: PP1CountObjectKind;
  label: string;
}) {
  if (kind === "cup") {
    return (
      <span
        className="relative block h-10 w-10 rounded-b-xl border-2 border-amber-500 bg-amber-100 shadow-inner"
        aria-label={label}
        role="img"
      >
        <span className="absolute -right-2 top-3 h-4 w-3 rounded-r-full border-2 border-l-0 border-amber-500" />
        <span className="absolute left-1/2 top-1 h-1 w-7 -translate-x-1/2 rounded-full bg-white/70" />
      </span>
    );
  }

  if (kind === "bottleTop") {
    return (
      <span
        className="grid h-11 w-11 place-items-center rounded-full border-4 border-emerald-500 bg-emerald-100 shadow-inner"
        aria-label={label}
        role="img"
      >
        <span className="h-5 w-5 rounded-full border-2 border-emerald-600 bg-emerald-200" />
      </span>
    );
  }

  if (kind === "stick") {
    return (
      <span
        className="block h-12 w-3 rotate-12 rounded-full border border-amber-700 bg-amber-500 shadow-sm"
        aria-label={label}
        role="img"
      />
    );
  }

  if (kind === "tin") {
    return (
      <span
        className="relative block h-12 w-10 rounded-b-lg border-2 border-slate-500 bg-slate-100 shadow-inner"
        aria-label={label}
        role="img"
      >
        <span className="absolute -top-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-200" />
        <span className="absolute bottom-2 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-white" />
      </span>
    );
  }

  return (
    <span
      className="block h-9 w-6 rotate-45 rounded-[999px_0_999px_999px] border-2 border-lime-700 bg-lime-200 shadow-inner"
      aria-label={label}
      role="img"
    />
  );
}

function GameSession({ gameId, levels, isSignedIn }: GameSessionProps) {
  const choiceGridRef = useRef<HTMLDivElement | null>(null);
  const nextLevelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bestStats, setBestStats] = useState<BestStats | null>(null);
  const savedBestSignatureRef = useRef<string | null>(null);

  const level = levels[currentIndex];
  const isLastLevel = currentIndex === levels.length - 1;
  const isGameComplete = feedback !== null && isLastLevel;

  const choices = level?.configJson?.choices ?? [];
  const answer = level?.configJson?.answer ?? "";
  const prompt = level?.configJson?.prompt ?? "Choose the correct answer.";
  const answerCount = parseCount(answer);
  const isPp1CountingGame = gameId === PP1_COUNT_GAME_ID && answerCount !== null;
  const hasValidConfig =
    Boolean(prompt?.trim()) &&
    Array.isArray(choices) &&
    choices.length > 0 &&
    Boolean(answer?.trim());

  const submitAttempt = useCallback(
    async (gameLevelId: string, attemptScore: number, timeMs: number) => {
      if (!isSignedIn) {
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const response = await fetch("/api/games/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameLevelId,
            score: attemptScore,
            timeMs,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error ?? "Unable to save attempt.");
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Unable to save attempt.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getBestKey(gameId));
      if (!raw) return;
      const data = JSON.parse(raw) as BestStats;
      if (
        typeof data.bestScore === "number" &&
        typeof data.bestTimeMs === "number"
      ) {
        setBestStats(data);
      }
    } catch {
      // Ignore malformed storage.
    }
  }, [gameId]);

  useEffect(() => {
    if (!isSignedIn) return;
    let isMounted = true;
    const loadBest = async () => {
      try {
        const response = await fetch(`/api/games/best?gameId=${gameId}`);
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        if (
          isMounted &&
          typeof data.bestScore === "number" &&
          typeof data.bestTimeMs === "number"
        ) {
          setBestStats({ bestScore: data.bestScore, bestTimeMs: data.bestTimeMs });
        }
      } catch {
        // Ignore network failures.
      }
    };
    loadBest();
    return () => {
      isMounted = false;
    };
  }, [gameId, isSignedIn]);

  useEffect(() => {
    if (!isGameComplete) return;
    const bestScore = bestStats?.bestScore ?? -1;
    const bestTimeMs = bestStats?.bestTimeMs ?? Number.POSITIVE_INFINITY;
    const shouldUpdateBest =
      score > bestScore ||
      (score === bestScore && totalTimeMs > 0 && totalTimeMs < bestTimeMs);
    if (!shouldUpdateBest) return;

    const nextBest = { bestScore: score, bestTimeMs: totalTimeMs };
    setBestStats(nextBest);
    try {
      localStorage.setItem(getBestKey(gameId), JSON.stringify(nextBest));
    } catch {
      // Ignore storage errors.
    }

    if (!isSignedIn) return;
    const signature = `${score}:${totalTimeMs}`;
    if (savedBestSignatureRef.current === signature) return;
    savedBestSignatureRef.current = signature;

    const saveBest = async () => {
      try {
        const response = await fetch("/api/games/best", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId,
            bestScore: nextBest.bestScore,
            bestTimeMs: nextBest.bestTimeMs,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error ?? "Unable to save best score.");
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Unable to save best score.",
        );
      }
    };
    saveBest();
  }, [bestStats, gameId, isGameComplete, isSignedIn, score, totalTimeMs]);

  useEffect(() => {
    choiceGridRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (nextLevelTimerRef.current) {
        clearTimeout(nextLevelTimerRef.current);
      }
    };
  }, []);

  const handleChoice = async (choice: string) => {
    if (feedback !== null) return;

    setSelectedChoice(choice);
    const timeMs = Date.now() - levelStartTime;
    const correct =
      choice.trim().toLowerCase() ===
      level.configJson.answer.trim().toLowerCase();

    if (correct) {
      setFeedback("correct");
      setScore((s) => s + 1);
      setTotalTimeMs((t) => t + timeMs);
      await submitAttempt(level.id, 1, timeMs);

      if (isLastLevel) {
        // Stay on completion state
      } else {
        if (nextLevelTimerRef.current) {
          clearTimeout(nextLevelTimerRef.current);
        }
        nextLevelTimerRef.current = setTimeout(() => {
          setCurrentIndex((i) => i + 1);
          setFeedback(null);
          setSelectedChoice(null);
          setLevelStartTime(Date.now());
        }, 800);
      }
    } else {
      setFeedback("wrong");
      await submitAttempt(level.id, 0, timeMs);
    }
  };

  const handleNext = () => {
    if (!isLastLevel && feedback === "wrong") {
      setCurrentIndex((i) => i + 1);
      setFeedback(null);
      setSelectedChoice(null);
      setLevelStartTime(Date.now());
    }
  };

  // Game complete screen (finished last level, correct or wrong)
  if (isGameComplete) {
    return (
      <div className="rounded-[2.3rem] border border-white/70 bg-white/95 p-6 text-center shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {isPp1CountingGame ? "Counting practice complete" : "Game complete"}
        </p>
        <h2
          className="mt-4 text-3xl font-semibold text-slate-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {score} of {levels.length} correct
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Total time: {(totalTimeMs / 1000).toFixed(1)}s
        </p>
        {bestStats && (
          <p className="mt-2 text-sm text-slate-500">
            Best: {bestStats.bestScore} of {levels.length} ·{" "}
            {(bestStats.bestTimeMs / 1000).toFixed(1)}s
          </p>
        )}
        {feedback === "wrong" && (
          <p className="mx-auto mt-4 max-w-md rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
            Last set matched number {level.configJson.answer}.
          </p>
        )}
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-600">
          {isPp1CountingGame
            ? score === levels.length
              ? "You counted every set and matched each number."
              : "Try again. Count each object once, then choose the number."
            : score === levels.length
              ? "Perfect! You got them all."
              : "Nice try! Play again to improve."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setFeedback(null);
              setSelectedChoice(null);
              setTotalTimeMs(0);
              setLevelStartTime(Date.now());
            }}
            className="inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Play again
          </button>
          {isPp1CountingGame && (
            <Link
              href="/courses/course-math#pp1-week-1"
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Return to maths roadmap
            </Link>
          )}
          {isPp1CountingGame ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-12 cursor-not-allowed items-center rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-950 opacity-80"
            >
              Next maths activity soon
            </button>
          ) : (
            <Link
              href="/games"
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Back to games
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Wrong answer, not last level – show Next to continue
  if (feedback === "wrong" && !isLastLevel) {
    return (
      <div className="rounded-[2.2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-center text-2xl font-semibold text-rose-950">
          Try again if you missed one.
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-sm font-semibold leading-6 text-rose-800">
          Count each object once. The matching number is {level.configJson.answer}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setSelectedChoice(null);
              setLevelStartTime(Date.now());
            }}
            className="inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
          >
            Next set
          </button>
        </div>
      </div>
    );
  }

  // Current level – prompt + choices
  if (levels.length === 0) {
    return (
      <div className="glass-shell rounded-[2.2rem] border border-white/70 p-8 text-sm text-slate-600 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
        No levels available yet.
      </div>
    );
  }

  if (!hasValidConfig) {
    return (
      <div className="glass-shell rounded-[2.2rem] border border-amber-200 bg-amber-50/78 p-8 text-sm text-amber-900 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
        This level is missing game data. Check the level configuration and try
        again.
      </div>
    );
  }

  return (
    <div className="rounded-[2.35rem] border border-white/70 bg-white/95 p-5 shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Set {currentIndex + 1} of {levels.length}
        </p>
        {isPp1CountingGame && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900">
            Count 5-9
          </span>
        )}
      </div>
      {isPp1CountingGame && answerCount ? (
        <div className="mt-5">
          <PP1ObjectSet count={answerCount} levelId={level.id} />
          <h2
            className="mt-5 text-center text-3xl font-semibold leading-tight text-slate-950 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {prompt}
          </h2>
          <h2
            className="mt-2 text-center text-2xl font-semibold leading-tight text-slate-700 md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Choose the matching number.
          </h2>
        </div>
      ) : (
        <p
          className="mt-4 text-2xl font-semibold text-slate-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {prompt}
        </p>
      )}
      {!isSignedIn && (
        <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Sign in to save attempts
        </div>
      )}
      {bestStats && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Best: {bestStats.bestScore} / {levels.length} ·{" "}
          {(bestStats.bestTimeMs / 1000).toFixed(1)}s
        </p>
      )}
      {submitError && (
        <p className="mt-3 text-xs font-semibold text-rose-600">
          {submitError}
        </p>
      )}
      <div
        className={`mt-6 grid gap-3 ${isPp1CountingGame ? "grid-cols-3" : "sm:grid-cols-2"}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (feedback !== null) return;
          const key = event.key;
          if (key < "1" || key > "9") return;
          const index = Number(key) - 1;
          const choice = choices[index];
          if (!choice) return;
          event.preventDefault();
          handleChoice(choice);
        }}
        aria-label="Answer choices. Press 1-9 to select."
        role="radiogroup"
        aria-activedescendant={
          selectedChoice ? `choice-${currentIndex}-${choices.indexOf(selectedChoice)}` : undefined
        }
        ref={choiceGridRef}
      >
        {choices.map((choice, index) => {
          const isSelected = selectedChoice === choice;
          const isCorrect = choice.trim().toLowerCase() === answer.trim().toLowerCase();
          const showCorrect = feedback === "correct" && isSelected;
          const showWrong = feedback === "wrong" && isSelected;

          return (
            <button
              key={`${choice}-${index}`}
              id={`choice-${currentIndex}-${index}`}
              type="button"
              onClick={() => handleChoice(choice)}
              disabled={feedback !== null}
              role="radio"
              aria-checked={isSelected}
              className={`rounded-[1.4rem] border px-5 py-4 font-semibold transition ${
                feedback !== null
                  ? "cursor-default border-slate-100 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              } ${
                showCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : showWrong
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : feedback === "correct" && isCorrect
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                      : "text-slate-800"
              } ${isPp1CountingGame ? "min-h-20 text-center text-4xl" : "text-left text-sm"}`}
            >
              {!isPp1CountingGame && (
                <span className="mr-2 text-xs font-semibold text-slate-400">
                  {index + 1}.
                </span>
              )}
              {choice}
              {showCorrect && " ✓"}
              {showWrong && " ✗"}
            </button>
          );
        })}
      </div>
      {feedback === "correct" && !isLastLevel && (
        <p className="mt-4 text-center text-lg font-semibold text-emerald-700">
          Correct. Next set...
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {feedback === "correct"
          ? "Correct answer."
          : feedback === "wrong"
            ? "Incorrect answer."
            : "Choose an answer."}
      </p>
    </div>
  );
}

function AuthedGameSession({
  gameId,
  levels,
}: {
  gameId: string;
  levels: GameLevelConfig[];
}) {
  const { userId } = useAuth();
  return (
    <GameSession
      gameId={gameId}
      levels={levels}
      isSignedIn={Boolean(userId)}
    />
  );
}

export default function GamePlay({ gameId, levels, clerkEnabled }: GamePlayProps) {
  if (!clerkEnabled) {
    return <GameSession gameId={gameId} levels={levels} isSignedIn={false} />;
  }

  return <AuthedGameSession gameId={gameId} levels={levels} />;
}
