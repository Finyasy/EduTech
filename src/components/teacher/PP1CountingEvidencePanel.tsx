"use client";

import { useMemo, useState } from "react";
import type { TeacherLearnerDashboardSummary } from "@/lib/server/data";
import {
  PP1_COUNTING_COMPETENCY_ID,
  type MathCurriculumEvidenceSummary,
  type MathCurriculumRubricLevel,
  type MathCurriculumSupportLevel,
  type MathCurriculumTeacherJudgement,
} from "@/lib/curriculum/math-roadmap";

type PP1CountingEvidencePanelProps = {
  summary: TeacherLearnerDashboardSummary;
  onSaved?: (
    competencyId: string,
    teacherJudgement: MathCurriculumTeacherJudgement,
  ) => void;
};

const COUNTING_GAME_MAX_SCORE = 5;
const COUNTING_GAME_ID = "game-pp1-count-sets";
const COUNTING_SLICE_TITLE = "PP1 Term 2 Week 1: Counting 5-9";
const COUNTING_EVIDENCE_TARGET =
  "Learner counts each object once and matches the set to the correct numeral.";

const RUBRIC_LEVELS = [
  {
    value: "EXCEEDS_EXPECTATION",
    label: "Exceeds",
    description: "Correct and consistent, can explain count.",
    support: "Independent",
  },
  {
    value: "MEETS_EXPECTATION",
    label: "Meets",
    description: "Correct after normal instruction.",
    support: "Normal instruction",
  },
  {
    value: "APPROACHES_EXPECTATION",
    label: "Approaches",
    description: "Partial accuracy or needs prompts.",
    support: "Prompts",
  },
  {
    value: "BELOW_EXPECTATION",
    label: "Below",
    description: "Cannot complete without direct support.",
    support: "Direct guidance",
  },
] as const;

const OBSERVATION_CHECKS = [
  {
    key: "countedEachObjectOnce",
    label: "counted each object once",
  },
  {
    key: "skippedDoubleCounted",
    label: "skipped/double-counted",
  },
  {
    key: "matchedNumeralCorrectly",
    label: "matched numeral correctly",
  },
  {
    key: "neededPrompts",
    label: "needed prompts",
  },
] as const;

type ObservationCheckKey = (typeof OBSERVATION_CHECKS)[number]["key"];

const RUBRIC_LABELS: Record<MathCurriculumRubricLevel, string> = {
  EXCEEDS_EXPECTATION: "Exceeds",
  MEETS_EXPECTATION: "Meets",
  APPROACHES_EXPECTATION: "Approaches",
  BELOW_EXPECTATION: "Below",
};

const SUPPORT_LABELS: Record<MathCurriculumSupportLevel, string> = {
  INDEPENDENT: "Independent",
  NORMAL_INSTRUCTION: "Normal instruction",
  PROMPTS: "Prompts",
  DIRECT_GUIDANCE: "Direct guidance",
};

const formatActivityDate = (value: string | null) => {
  if (!value) {
    return "No game evidence yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const findCountingEvidence = (summary: TeacherLearnerDashboardSummary) =>
  summary.curriculumEvidence?.find((item) => item.gameId === COUNTING_GAME_ID) ?? null;

const levelLabel = (value: MathCurriculumRubricLevel | null) =>
  value ? RUBRIC_LABELS[value] : "Observation needed";

const supportLabel = (value: MathCurriculumSupportLevel | null) =>
  value ? SUPPORT_LABELS[value] : "Not recorded";

const getInitialChecks = (evidence: MathCurriculumEvidenceSummary | null) => {
  const judgement = evidence?.teacherJudgement;
  if (!judgement) return [] as ObservationCheckKey[];

  return OBSERVATION_CHECKS.filter((check) => judgement[check.key]).map(
    (check) => check.key,
  );
};

const readSaveError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string"
      ? payload.error
      : "Unable to save teacher evidence.";
  } catch {
    return "Unable to save teacher evidence.";
  }
};

export default function PP1CountingEvidencePanel({
  summary,
  onSaved,
}: PP1CountingEvidencePanelProps) {
  const evidence = useMemo(() => findCountingEvidence(summary), [summary]);
  const [selectedChecks, setSelectedChecks] = useState<ObservationCheckKey[]>(() =>
    getInitialChecks(evidence),
  );
  const [rubricLevel, setRubricLevel] = useState<MathCurriculumRubricLevel | "">(
    () => evidence?.teacherJudgement.rubricLevelOverride ?? evidence?.rubricLevel ?? "",
  );
  const [supportLevel, setSupportLevel] = useState<MathCurriculumSupportLevel | "">(
    () => evidence?.teacherJudgement.supportLevelOverride ?? evidence?.supportLevel ?? "",
  );
  const [observationNote, setObservationNote] = useState(
    () => evidence?.teacherJudgement.note ?? "",
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState(
    () => evidence?.teacherJudgement.updatedAt ?? null,
  );

  const bestCountingScore =
    evidence?.bestScore === null || evidence?.bestScore === undefined
      ? summary.games.bestScore === null
        ? null
        : Math.min(summary.games.bestScore, COUNTING_GAME_MAX_SCORE)
      : Math.min(evidence.bestScore, COUNTING_GAME_MAX_SCORE);
  const practicedQuantities = evidence?.practicedQuantities ?? [];
  const correctQuantities = evidence?.correctQuantities ?? [];
  const missedQuantities = evidence?.missedQuantities ?? [5, 6, 7, 8, 9];
  const attemptCount = evidence?.attemptCount ?? summary.games.attemptCount;
  const latestEvidenceAt = evidence?.latestEvidenceAt ?? summary.games.latestSubmittedAt;
  const suggestedRubricLevel = evidence?.rubricLevel ?? null;
  const suggestedSupportLevel = evidence?.supportLevel ?? null;
  const competencyId = evidence?.competencyId ?? PP1_COUNTING_COMPETENCY_ID;
  const judgementHistory = evidence?.teacherJudgementHistory ?? [];
  const nextTeachingAction =
    missedQuantities.length > 0
      ? `Use bottle tops or seeds to recount ${missedQuantities.join(", ")} before the next digital attempt.`
      : selectedChecks.includes("neededPrompts") ||
          rubricLevel === "APPROACHES_EXPECTATION" ||
          rubricLevel === "BELOW_EXPECTATION"
        ? "Repeat the task with 5-9 real objects and model touching each object once."
        : "Ask the learner to explain how they counted one set, then move to number sequencing.";

  const toggleCheck = (check: ObservationCheckKey) => {
    setSaveStatus("idle");
    setSaveError(null);
    setSelectedChecks((current) =>
      current.includes(check)
        ? current.filter((item) => item !== check)
        : [...current, check],
    );
  };

  const saveTeacherJudgement = async () => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch(
        `/api/teach/class/${encodeURIComponent(
          summary.learner.classId,
        )}/learner/${encodeURIComponent(
          summary.learner.id,
        )}/curriculum-evidence/${encodeURIComponent(competencyId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: observationNote.trim() || null,
            rubricLevelOverride: rubricLevel || null,
            supportLevelOverride: supportLevel || null,
            countedEachObjectOnce: selectedChecks.includes("countedEachObjectOnce"),
            skippedDoubleCounted: selectedChecks.includes("skippedDoubleCounted"),
            matchedNumeralCorrectly: selectedChecks.includes(
              "matchedNumeralCorrectly",
            ),
            neededPrompts: selectedChecks.includes("neededPrompts"),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readSaveError(response));
      }

      const payload = (await response.json()) as {
        competencyId: string;
        teacherJudgement: MathCurriculumTeacherJudgement;
      };
      setSaveStatus("saved");
      setLastSavedAt(payload.teacherJudgement.updatedAt);
      onSaved?.(payload.competencyId, payload.teacherJudgement);
    } catch (error) {
      setSaveStatus("error");
      setSaveError(
        error instanceof Error ? error.message : "Unable to save teacher evidence.",
      );
    }
  };

  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            PP1 counting evidence
          </p>
          <h5 className="mt-1 text-base font-semibold text-slate-950">
            {COUNTING_SLICE_TITLE}
          </h5>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
            {COUNTING_EVIDENCE_TARGET}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
          {COUNTING_GAME_ID}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Latest evidence
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatActivityDate(latestEvidenceAt)}
          </p>
        </div>
        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Game attempts
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {attemptCount}
          </p>
        </div>
        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Best score
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {bestCountingScore === null
              ? "-"
              : `${bestCountingScore} / ${COUNTING_GAME_MAX_SCORE}`}
          </p>
        </div>
        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Support signal
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {supportLabel(suggestedSupportLevel)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Quantity evidence
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <QuantitySet label="Practiced" quantities={practicedQuantities} />
            <QuantitySet label="Correct" quantities={correctQuantities} tone="emerald" />
            <QuantitySet label="Needs check" quantities={missedQuantities} tone="amber" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Teacher judgement still matters.</p>
          <p className="mt-1">
            The game shows practice evidence. Use classroom observation to confirm
            whether the learner counted once, skipped or double-counted, matched the
            numeral, and needed support.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-white bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Teacher observation
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {OBSERVATION_CHECKS.map((check) => (
              <label
                key={check.key}
                className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedChecks.includes(check.key)}
                  onChange={() => toggleCheck(check.key)}
                  className="mt-1"
                />
                <span>{check.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={observationNote}
            onChange={(event) => {
              setObservationNote(event.target.value);
              setSaveStatus("idle");
              setSaveError(null);
            }}
            placeholder="Teacher observation note"
            className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
          />
        </div>

        <div className="rounded-xl border border-white bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Rubric level
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Suggested: {levelLabel(suggestedRubricLevel)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {RUBRIC_LEVELS.map((level) => (
              <label
                key={level.value}
                className={`block rounded-xl border px-3 py-2 text-sm ${
                  rubricLevel === level.value
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={`pp1-counting-rubric-${summary.learner.id}`}
                    checked={rubricLevel === level.value}
                    onChange={() => {
                      setSaveStatus("idle");
                      setSaveError(null);
                      setRubricLevel(level.value);
                      if (level.value === "EXCEEDS_EXPECTATION") {
                        setSupportLevel("INDEPENDENT");
                      } else if (level.value === "MEETS_EXPECTATION") {
                        setSupportLevel("NORMAL_INSTRUCTION");
                      } else if (level.value === "APPROACHES_EXPECTATION") {
                        setSupportLevel("PROMPTS");
                      } else {
                        setSupportLevel("DIRECT_GUIDANCE");
                      }
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">{level.label}</span>
                    <span className="mt-0.5 block text-slate-600">
                      {level.description}
                    </span>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Support: {level.support}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
            Current support level:{" "}
            <span className="font-semibold text-slate-900">
              {supportLevel ? SUPPORT_LABELS[supportLevel] : "Not recorded"}
            </span>
            . Game evidence is a signal; teacher judgement remains the assessment
            record.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Next teaching action
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            {nextTeachingAction}
          </p>
        </div>

        <div className="rounded-xl border border-white bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recent observation history
          </p>
          {judgementHistory.length > 0 ? (
            <div className="mt-3 space-y-2">
              {judgementHistory.slice(0, 3).map((entry) => (
                <div
                  key={`${entry.recordedAt}-${entry.note ?? "observation"}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    {formatActivityDate(entry.recordedAt)} ·{" "}
                    {levelLabel(entry.rubricLevelOverride)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {entry.note ?? "Observation saved without a note."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No prior observation records for this PP1 counting competency.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 pt-4">
        <p className="text-xs font-semibold text-slate-600">
          {saveStatus === "saved"
            ? `Saved${lastSavedAt ? ` ${formatActivityDate(lastSavedAt)}` : ""}.`
            : lastSavedAt
              ? `Last saved ${formatActivityDate(lastSavedAt)}.`
              : "Not saved yet."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {saveStatus === "error" && saveError ? (
            <p className="text-xs font-semibold text-red-700">{saveError}</p>
          ) : null}
          <button
            type="button"
            onClick={saveTeacherJudgement}
            disabled={saveStatus === "saving"}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saveStatus === "saving" ? "Saving..." : "Save evidence"}
          </button>
        </div>
      </div>
    </section>
  );
}

function QuantitySet({
  label,
  quantities,
  tone = "slate",
}: {
  label: string;
  quantities: number[];
  tone?: "slate" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {quantities.length > 0 ? (
          quantities.map((quantity) => (
            <span
              key={`${label}-${quantity}`}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold ${toneClass}`}
            >
              {quantity}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold text-slate-400">None yet</span>
        )}
      </div>
    </div>
  );
}
