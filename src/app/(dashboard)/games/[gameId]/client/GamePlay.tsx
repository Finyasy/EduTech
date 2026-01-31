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
      <div className="rounded-3xl border border-white/70 bg-white/90 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
          Game complete
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
          Score: {score} / {levels.length}
        </h2>
        <p className="mt-2 text-slate-600">
          Total time: {(totalTimeMs / 1000).toFixed(1)}s
        </p>
        {bestStats && (
          <p className="mt-2 text-sm text-slate-600">
            Best: {bestStats.bestScore} / {levels.length} ·{" "}
            {(bestStats.bestTimeMs / 1000).toFixed(1)}s
          </p>
        )}
        {feedback === "wrong" && (
          <p className="mt-2 text-sm text-rose-700">
            Last level: correct answer was {level.configJson.answer}
          </p>
        )}
        <p className="mt-4 text-sm text-slate-600">
          {score === levels.length
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
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Play again
          </button>
          <Link
            href="/games"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Back to games
          </Link>
        </div>
      </div>
    );
  }

  // Wrong answer, not last level – show Next to continue
  if (feedback === "wrong" && !isLastLevel) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8">
        <p className="text-center font-semibold text-rose-800">
          Not quite! The correct answer was: {level.configJson.answer}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setSelectedChoice(null);
              setLevelStartTime(Date.now());
            }}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Next level
          </button>
        </div>
      </div>
    );
  }

  // Current level – prompt + choices
  if (levels.length === 0) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/90 p-8 text-sm text-slate-600">
        No levels available yet.
      </div>
    );
  }

  if (!hasValidConfig) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-sm text-amber-900">
        This level is missing game data. Check the level configuration and try
        again.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Level {currentIndex + 1} of {levels.length}
      </p>
      <p className="mt-4 text-xl font-semibold text-slate-900">{prompt}</p>
      {!isSignedIn && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
          Sign in to save attempts
        </p>
      )}
      {bestStats && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Best: {bestStats.bestScore} / {levels.length} ·{" "}
          {(bestStats.bestTimeMs / 1000).toFixed(1)}s
        </p>
      )}
      {submitError && (
        <p className="mt-2 text-xs font-semibold text-rose-600">
          {submitError}
        </p>
      )}
      <div
        className="mt-6 grid gap-3 sm:grid-cols-2"
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
              className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${
                feedback !== null
                  ? "cursor-default border-slate-100 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
              } ${
                showCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : showWrong
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : feedback === "correct" && isCorrect
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                      : "text-slate-800"
              }`}
            >
              <span className="mr-2 text-xs font-semibold text-slate-400">
                {index + 1}.
              </span>
              {choice}
              {showCorrect && " ✓"}
              {showWrong && " ✗"}
            </button>
          );
        })}
      </div>
      {feedback === "correct" && !isLastLevel && (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-700">
          Correct! Next level...
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
