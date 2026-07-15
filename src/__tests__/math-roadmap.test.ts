import { describe, expect, it } from "vitest";
import {
  buildMathCurriculumEvidenceSummary,
  buildPp1CountingEvidenceSummary,
  getMathCurriculumRecordByGameId,
  listMathCurriculumRecordsWithGames,
  PP1_COUNTING_COMPETENCY_ID,
  PP1_COUNTING_GAME_ID,
  PP1_COUNT_THE_SET_LEVELS,
} from "@/lib/curriculum/math-roadmap";

describe("math roadmap curriculum runtime", () => {
  it("keeps the PP1 counting curriculum slice linked to the count-the-set game", () => {
    const record = getMathCurriculumRecordByGameId(PP1_COUNTING_GAME_ID);

    expect(record).not.toBeNull();
    expect(record?.id).toBe(PP1_COUNTING_COMPETENCY_ID);
    expect(record?.curriculumLevel).toBe("PP1");
    expect(record?.term).toBe(2);
    expect(record?.week).toBe(1);
    expect(record?.gameLevelIds).toEqual(
      PP1_COUNT_THE_SET_LEVELS.map((level) => level.id),
    );
    expect(listMathCurriculumRecordsWithGames().map((item) => item.id)).toContain(
      PP1_COUNTING_COMPETENCY_ID,
    );
  });

  it("derives strong PP1 counting evidence from successful game attempts", () => {
    const summary = buildPp1CountingEvidenceSummary({
      attempts: PP1_COUNT_THE_SET_LEVELS.map((level, index) => ({
        gameLevelId: level.id,
        score: 1,
        timeMs: 1_500 + index * 100,
        submittedAt: `2026-05-2${index}T10:00:00.000Z`,
      })),
      bestScore: 5,
      bestTimeMs: 8_100,
      teacherJudgementHistory: [
        {
          note: "Teacher confirmed consistent 5-9 counting.",
          rubricLevelOverride: "EXCEEDS_EXPECTATION",
          supportLevelOverride: "INDEPENDENT",
          countedEachObjectOnce: true,
          skippedDoubleCounted: false,
          matchedNumeralCorrectly: true,
          neededPrompts: false,
          updatedAt: "2026-05-29T10:00:00.000Z",
          recordedAt: "2026-05-29T10:00:00.000Z",
        },
      ],
    });

    expect(summary.competencyId).toBe(PP1_COUNTING_COMPETENCY_ID);
    expect(summary.correctQuantities).toEqual([5, 6, 7, 8, 9]);
    expect(summary.missedQuantities).toEqual([]);
    expect(summary.rubricLevel).toBe("EXCEEDS_EXPECTATION");
    expect(summary.supportLevel).toBe("INDEPENDENT");
    expect(summary.teacherJudgementHistory).toHaveLength(1);
  });

  it("keeps teacher judgement beside game attempt evidence for one competency", () => {
    const summary = buildPp1CountingEvidenceSummary({
      attempts: PP1_COUNT_THE_SET_LEVELS.slice(0, 4).map((level, index) => ({
        gameLevelId: level.id,
        score: 1,
        timeMs: 1_400 + index * 80,
        submittedAt: `2026-06-0${index + 1}T10:00:00.000Z`,
      })),
      bestScore: 4,
      bestTimeMs: 5_900,
      teacherJudgement: {
        note: "Counts correctly with one prompt to touch each object once.",
        rubricLevelOverride: "APPROACHES_EXPECTATION",
        supportLevelOverride: "PROMPTS",
        countedEachObjectOnce: true,
        skippedDoubleCounted: false,
        matchedNumeralCorrectly: true,
        neededPrompts: true,
        updatedAt: "2026-06-05T10:00:00.000Z",
      },
    });

    expect(summary.competencyId).toBe(PP1_COUNTING_COMPETENCY_ID);
    expect(summary.attemptCount).toBe(4);
    expect(summary.rubricLevel).toBe("MEETS_EXPECTATION");
    expect(summary.teacherJudgement.rubricLevelOverride).toBe(
      "APPROACHES_EXPECTATION",
    );
    expect(summary.teacherJudgement.neededPrompts).toBe(true);
  });

  it("stays null-safe when no digital counting evidence exists yet", () => {
    const summary = buildPp1CountingEvidenceSummary({
      attempts: [],
      bestScore: null,
      bestTimeMs: null,
    });

    expect(summary.attemptCount).toBe(0);
    expect(summary.practicedQuantities).toEqual([]);
    expect(summary.correctQuantities).toEqual([]);
    expect(summary.missedQuantities).toEqual([5, 6, 7, 8, 9]);
    expect(summary.rubricLevel).toBeNull();
    expect(summary.supportLevel).toBeNull();
    expect(summary.teacherJudgementHistory).toEqual([]);
  });

  it("dispatches curriculum evidence building by competency id", () => {
    const summary = buildMathCurriculumEvidenceSummary({
      competencyId: PP1_COUNTING_COMPETENCY_ID,
      attempts: [
        {
          gameLevelId: PP1_COUNT_THE_SET_LEVELS[0]!.id,
          score: 1,
          timeMs: 1200,
          submittedAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      bestScore: 1,
      bestTimeMs: 1200,
    });

    expect(summary.competencyId).toBe(PP1_COUNTING_COMPETENCY_ID);
    expect(summary.gameId).toBe(PP1_COUNTING_GAME_ID);
    expect(summary.attemptCount).toBe(1);
  });
});
