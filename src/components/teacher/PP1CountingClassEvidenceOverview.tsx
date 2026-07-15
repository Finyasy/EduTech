"use client";

import type { TeacherLearnerDashboardSummary } from "@/lib/server/data";
import type { TeacherClassCurriculumEvidenceItem } from "@/lib/server/data";
import type { MathCurriculumRubricLevel } from "@/lib/curriculum/math-roadmap";
import type { LearnerProgressStatus, TeacherLearner } from "@/lib/teacher/types";

type PP1CountingClassEvidenceOverviewProps = {
  learners: TeacherLearner[];
  sessionStatuses: Record<string, LearnerProgressStatus>;
  classEvidence: TeacherClassCurriculumEvidenceItem[];
  activeSummary: TeacherLearnerDashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  onOpenLearner: (learnerId: string) => void;
};

const STATUS_LABELS: Record<LearnerProgressStatus, string> = {
  PRACTICED_ENOUGH: "Practiced enough",
  KEEP_GOING: "Keep going",
  NEED_MORE_PRACTICE: "Needs practice",
};

const RUBRIC_LABELS: Record<MathCurriculumRubricLevel, string> = {
  EXCEEDS_EXPECTATION: "Exceeds",
  MEETS_EXPECTATION: "Meets",
  APPROACHES_EXPECTATION: "Approaches",
  BELOW_EXPECTATION: "Below",
};

const getTeacherLevel = (item: TeacherClassCurriculumEvidenceItem) =>
  item.evidence.teacherJudgement.rubricLevelOverride ?? item.evidence.rubricLevel;

const hasTeacherRecord = (item: TeacherClassCurriculumEvidenceItem) =>
  Boolean(item.evidence.teacherJudgement.updatedAt);

const hasGameEvidence = (item: TeacherClassCurriculumEvidenceItem) =>
  item.evidence.attemptCount > 0 || item.evidence.latestEvidenceAt !== null;

const getTeacherRecordLabel = (item: TeacherClassCurriculumEvidenceItem) => {
  if (hasGameEvidence(item) && !hasTeacherRecord(item)) {
    return "Review needed";
  }

  const teacherLevel = getTeacherLevel(item);
  return teacherLevel ? RUBRIC_LABELS[teacherLevel] : "No record";
};

export default function PP1CountingClassEvidenceOverview({
  learners,
  sessionStatuses,
  classEvidence,
  activeSummary,
  isLoading,
  error,
  onOpenLearner,
}: PP1CountingClassEvidenceOverviewProps) {
  const evidenceByLearnerId = new Map(
    classEvidence.map((item) => [item.learner.id, item]),
  );
  const meetsOrExceeds = classEvidence.filter((item) => {
    const level = getTeacherLevel(item);
    return level === "EXCEEDS_EXPECTATION" || level === "MEETS_EXPECTATION";
  }).length;
  const needsPrompts = classEvidence.filter(
    (item) => getTeacherLevel(item) === "APPROACHES_EXPECTATION",
  ).length;
  const directSupport = classEvidence.filter(
    (item) => getTeacherLevel(item) === "BELOW_EXPECTATION",
  ).length;
  const teacherReview = classEvidence.filter(
    (item) => hasGameEvidence(item) && !hasTeacherRecord(item),
  ).length;
  const gameEvidenceCount = classEvidence.filter(hasGameEvidence).length;
  const teacherRecordCount = classEvidence.filter(hasTeacherRecord).length;
  const noEvidence = learners.filter((learner) => {
    const item = evidenceByLearnerId.get(learner.id);
    return !item || (!hasGameEvidence(item) && !hasTeacherRecord(item));
  }).length;
  const noGameEvidence = Math.max(
    0,
    learners.length - gameEvidenceCount,
  );

  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            Class PP1 counting evidence
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Count concrete object sets from 5 to 9
          </h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
            Use game practice as a signal, then open a learner to record teacher
            observation and rubric judgement.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
          game-pp1-count-sets
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <EvidenceMetric label="Meets" value={meetsOrExceeds} />
        <EvidenceMetric label="Prompts" value={needsPrompts} />
        <EvidenceMetric label="Teacher records" value={teacherRecordCount} />
        <EvidenceMetric label="Teacher review" value={teacherReview} />
        <EvidenceMetric label="No game evidence" value={noGameEvidence} />
      </div>
      {directSupport > 0 || noEvidence > 0 ? (
        <p className="mt-3 rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-sm leading-6 text-amber-950">
          {directSupport > 0
            ? `${directSupport} learner${directSupport === 1 ? "" : "s"} need direct support. `
            : ""}
          {noEvidence > 0
            ? `${noEvidence} learner${noEvidence === 1 ? "" : "s"} have no PP1 counting evidence yet.`
            : ""}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-white bg-white">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:grid-cols-[1fr_120px_120px_130px_auto]">
          <span>Learner</span>
          <span className="hidden md:block">Session</span>
          <span className="hidden md:block">Game evidence</span>
          <span className="hidden md:block">Teacher record</span>
          <span>Action</span>
        </div>
        {learners.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-600">No learners yet.</p>
        ) : (
          learners.map((learner) => {
            const status = sessionStatuses[learner.id] ?? "KEEP_GOING";
            const isActive = activeSummary?.learner.id === learner.id;
            const item = evidenceByLearnerId.get(learner.id);
            const evidenceText = item
              ? !hasGameEvidence(item)
                ? "Teacher only"
                : item.evidence.bestScore === null
                  ? `${item.evidence.attemptCount} attempts`
                : `${Math.min(item.evidence.bestScore, 5)} / 5`
              : isActive
                ? `${activeSummary.games.attemptCount} attempts`
                : learner.userId
                  ? "Open detail"
                  : "Link account";
            const teacherText = item ? getTeacherRecordLabel(item) : "No record";

            return (
              <div
                key={learner.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 md:grid-cols-[1fr_120px_120px_130px_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{learner.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isLoading
                      ? "Loading PP1 evidence"
                      : learner.userId
                        ? "Linked learner account"
                        : "No learner account"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600 md:hidden">
                    {evidenceText} · {teacherText}
                  </p>
                </div>
                <span className="hidden text-sm text-slate-700 md:block">
                  {STATUS_LABELS[status]}
                </span>
                <span className="hidden text-sm text-slate-700 md:block">
                  {evidenceText}
                </span>
                <span className="hidden text-sm text-slate-700 md:block">
                  {teacherText}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenLearner(learner.id)}
                  disabled={isLoading}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Open evidence
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white bg-white px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
