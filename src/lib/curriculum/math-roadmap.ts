export type MathRoadmapAlignment = {
  id: string;
  strand: string;
  competency: string;
  classroomActivity: string;
  aiBridge: string;
  codingBridge: string;
  gameMechanic: string;
  evidence: string;
  gameId?: string;
};

export type MathGameTemplate = {
  id: string;
  title: string;
  mechanic: string;
  bestFor: string;
  evidence: string;
};

export type MathCurriculumEvidenceType =
  | "GAME_ATTEMPT"
  | "TEACHER_OBSERVATION"
  | "PORTFOLIO_ARTIFACT";

export type MathCurriculumRubricLevel =
  | "EXCEEDS_EXPECTATION"
  | "MEETS_EXPECTATION"
  | "APPROACHES_EXPECTATION"
  | "BELOW_EXPECTATION";

export type MathCurriculumSupportLevel =
  | "INDEPENDENT"
  | "NORMAL_INSTRUCTION"
  | "PROMPTS"
  | "DIRECT_GUIDANCE";

export type MathCurriculumTeacherJudgement = {
  note: string | null;
  rubricLevelOverride: MathCurriculumRubricLevel | null;
  supportLevelOverride: MathCurriculumSupportLevel | null;
  countedEachObjectOnce: boolean;
  skippedDoubleCounted: boolean;
  matchedNumeralCorrectly: boolean;
  neededPrompts: boolean;
  updatedAt: string | null;
};

export type MathCurriculumTeacherJudgementHistoryEntry =
  MathCurriculumTeacherJudgement & {
    recordedAt: string;
  };

export type MathCurriculumRecord = {
  id: string;
  courseId: string;
  curriculumLevel: "PP1" | "PP2" | "GRADE_1" | "GRADE_2" | "GRADE_3";
  term: number;
  week: number;
  lessonRange: string;
  strand: string;
  subStrand: string;
  competency: string;
  specificLearningOutcome: string;
  evidenceTarget: string;
  evidenceTypes: MathCurriculumEvidenceType[];
  rubricId: string;
  aiBridge: string;
  codingBridge: string;
  gameId?: string;
  gameLevelIds?: string[];
};

export type Pp1CountSetLevelSpec = {
  id: string;
  levelNumber: number;
  quantity: number;
  prompt: string;
  choices: string[];
  answer: string;
};

export type MathGameAttemptSignal = {
  gameLevelId: string;
  score: number;
  timeMs: number;
  submittedAt: string;
};

export type MathCurriculumEvidenceSummary = {
  competencyId: string;
  courseId: string;
  gameId: string;
  rubricId: string;
  evidenceType: "GAME_ATTEMPT";
  evidenceTarget: string;
  latestEvidenceAt: string | null;
  attemptCount: number;
  practicedQuantities: number[];
  correctQuantities: number[];
  missedQuantities: number[];
  bestScore: number | null;
  bestTimeMs: number | null;
  rubricLevel: MathCurriculumRubricLevel | null;
  supportLevel: MathCurriculumSupportLevel | null;
  interpretation: string;
  teacherObservationPrompts: string[];
  teacherJudgement: MathCurriculumTeacherJudgement;
  teacherJudgementHistory: MathCurriculumTeacherJudgementHistoryEntry[];
};

type MathCurriculumEvidenceSummaryBuilderInput = {
  competencyId: string;
  attempts: MathGameAttemptSignal[];
  bestScore: number | null;
  bestTimeMs: number | null;
  teacherJudgement?: Partial<MathCurriculumTeacherJudgement> | null;
  teacherJudgementHistory?: MathCurriculumTeacherJudgementHistoryEntry[];
};

type MathCurriculumEvidenceDefinition = {
  competencyId: string;
  gameId: string;
  teacherObservationPrompts: string[];
  buildSummary: (input: MathCurriculumEvidenceSummaryBuilderInput) => MathCurriculumEvidenceSummary;
};

export const PP1_COUNTING_GAME_ID = "game-pp1-count-sets";
export const PP1_COUNTING_COMPETENCY_ID = "pp1-counting-5-9";
export const PP1_COUNTING_RUBRIC_ID = "pp1-counting-concrete-objects";
export const MATH_ROADMAP_COURSE_ID = "course-math";

export const PP1_COUNT_THE_SET_LEVELS: Pp1CountSetLevelSpec[] = [
  {
    id: "level-pp1-count-5",
    levelNumber: 1,
    quantity: 5,
    prompt: "Count the cups and choose the matching number.",
    choices: ["4", "5", "6"],
    answer: "5",
  },
  {
    id: "level-pp1-count-6",
    levelNumber: 2,
    quantity: 6,
    prompt: "Count the bottle tops and choose the matching number.",
    choices: ["5", "6", "7"],
    answer: "6",
  },
  {
    id: "level-pp1-count-7",
    levelNumber: 3,
    quantity: 7,
    prompt: "Count the sticks and choose the matching number.",
    choices: ["7", "8", "9"],
    answer: "7",
  },
  {
    id: "level-pp1-count-8",
    levelNumber: 4,
    quantity: 8,
    prompt: "Count the tins and choose the matching number.",
    choices: ["6", "8", "9"],
    answer: "8",
  },
  {
    id: "level-pp1-count-9",
    levelNumber: 5,
    quantity: 9,
    prompt: "Count the seeds and choose the matching number.",
    choices: ["7", "8", "9"],
    answer: "9",
  },
];

export const PP1_TERM2_ALIGNMENT: MathRoadmapAlignment[] = [
  {
    id: PP1_COUNTING_COMPETENCY_ID,
    strand: "Numbers",
    competency: "Count concrete object sets from 5 to 9.",
    classroomActivity: "Learners make sets using cups, tins, bottle tops, seeds, or sticks.",
    aiBridge: "A simple helper labels object sets by quantity and learners correct wrong labels.",
    codingBridge: "First, next, last and repeat-count routines build early sequencing language.",
    gameMechanic: "Choose the numeral that matches a visible or described object set.",
    evidence: "Learner counts each object once and matches the set to the correct numeral.",
    gameId: PP1_COUNTING_GAME_ID,
  },
  {
    id: "pp1-number-sequencing",
    strand: "Numbers",
    competency: "Order numbers 1-9 and identify missing numbers.",
    classroomActivity: "Learners arrange number cut-outs and complete missing-number strips.",
    aiBridge: "Pattern recognition: the helper predicts the missing number and learners check it.",
    codingBridge: "Ordered commands: learners debug a sequence that is out of order.",
    gameMechanic: "Complete the number path by selecting the missing tile.",
    evidence: "Learner places numbers in order and names what comes before or after.",
  },
  {
    id: "pp1-number-writing",
    strand: "Numbers",
    competency: "Model, trace, join, write, and type early numerals.",
    classroomActivity: "Learners form numerals with plasticine, chalk, sand trays, or tracing sheets.",
    aiBridge: "The helper compares numeral shapes and asks whether the number is recognizable.",
    codingBridge: "Input/output: learners type a numeral and match it back to a physical set.",
    gameMechanic: "Match a numeral shape to the quantity or spoken number.",
    evidence: "Learner produces a recognizable numeral and links it to a real count.",
  },
  {
    id: "pp1-long-short",
    strand: "Measurement",
    competency: "Compare long and short sides or objects.",
    classroomActivity: "Learners sort classroom objects or pictures into long and short groups.",
    aiBridge: "Feature comparison: the helper sorts by length and learners explain mistakes.",
    codingBridge: "If long, place here; if short, place there.",
    gameMechanic: "Drag or choose the object that belongs in the long/short group.",
    evidence: "Learner identifies longer/shorter examples and explains one comparison.",
  },
  {
    id: "pp1-heavy-light",
    strand: "Measurement",
    competency: "Compare heavy and light safe objects.",
    classroomActivity: "Learners lift, sort, and match safe household or classroom objects.",
    aiBridge: "Labeling examples: learners train the helper with heavy/light examples.",
    codingBridge: "Conditional sorting rule: if heavy, if light.",
    gameMechanic: "Sort or choose the heavy/light item from a small set.",
    evidence: "Learner sorts at least one heavy and one light object correctly.",
  },
  {
    id: "pp1-capacity",
    strand: "Measurement",
    competency: "Fill, empty, compare, and count container capacity.",
    classroomActivity: "Learners use small tins or cups to fill a bigger container.",
    aiBridge: "Prediction before testing: the helper guesses which container holds more.",
    codingBridge: "Repeat-fill loop: fill, count, repeat until full.",
    gameMechanic: "Choose how many small containers fill the big container.",
    evidence: "Learner counts fills and uses full/empty, more/less, or big/small correctly.",
  },
  {
    id: "pp1-daily-routine",
    strand: "Measurement",
    competency: "Sequence daily routine events using time language.",
    classroomActivity: "Learners order picture cards for morning, school, home, and evening.",
    aiBridge: "Sequence recognition: the helper predicts the next routine card.",
    codingBridge: "Ordered steps: first, next, then, last.",
    gameMechanic: "Put routine cards in the correct order.",
    evidence: "Learner orders familiar events and uses one time word correctly.",
  },
];

export const MATH_GAME_TEMPLATES: MathGameTemplate[] = [
  {
    id: "count-the-set",
    title: "Count The Set",
    mechanic: "Choose the numeral that matches a set of objects.",
    bestFor: "PP1 counting concrete objects and number recognition.",
    evidence: "Correct numeral choice and attempt pattern.",
  },
  {
    id: "complete-the-sequence",
    title: "Complete The Sequence",
    mechanic: "Choose the missing number or routine card.",
    bestFor: "Number sequencing and daily routine ordering.",
    evidence: "Missing-number accuracy and before/after vocabulary.",
  },
  {
    id: "sort-by-rule",
    title: "Sort By Rule",
    mechanic: "Classify items into the correct group.",
    bestFor: "Classification, long/short, heavy/light, and same/different.",
    evidence: "Rule use, correction behavior, and explanation.",
  },
  {
    id: "fill-and-count",
    title: "Fill And Count",
    mechanic: "Count repeated fills from a small container into a big one.",
    bestFor: "Capacity, one-to-one counting, and repeat-loop language.",
    evidence: "Fill count, comparison words, and support level.",
  },
];

export const MATH_CURRICULUM_RECORDS: MathCurriculumRecord[] = [
  {
    id: PP1_COUNTING_COMPETENCY_ID,
    courseId: MATH_ROADMAP_COURSE_ID,
    curriculumLevel: "PP1",
    term: 2,
    week: 1,
    lessonRange: "1-5",
    strand: "Numbers",
    subStrand: "Counting concrete objects",
    competency: "Count concrete object sets from 5 to 9.",
    specificLearningOutcome:
      "Learner counts household object sets from 5 to 9 and matches each set to the correct numeral.",
    evidenceTarget:
      "Learner counts each object once and matches the set to the correct numeral.",
    evidenceTypes: ["GAME_ATTEMPT", "TEACHER_OBSERVATION"],
    rubricId: PP1_COUNTING_RUBRIC_ID,
    aiBridge: "Helper labels object sets by quantity and learners correct wrong labels.",
    codingBridge: "First, next, last and repeat-count routines build early sequencing language.",
    gameId: PP1_COUNTING_GAME_ID,
    gameLevelIds: PP1_COUNT_THE_SET_LEVELS.map((level) => level.id),
  },
];

export const FIRST_MATH_VERTICAL_SLICE = {
  title: "PP1 Term 2 Week 1: Counting 5-9",
  lessonFocus: "Learners count household object sets and match each set to a numeral.",
  gameId: PP1_COUNTING_GAME_ID,
  teacherEvidence:
    "Observation note plus game attempt showing whether the learner counted each object once.",
  nextBuild:
    "Add number sequencing after the counting slice is reviewed with real teacher feedback.",
};

const COUNTING_OBSERVATION_PROMPTS = [
  "counted each object once",
  "skipped or double-counted objects",
  "matched the set to the correct numeral",
  "needed prompts or modeling",
];

export const getMathRoadmapAlignmentByGame = (gameId: string) =>
  PP1_TERM2_ALIGNMENT.filter((item) => item.gameId === gameId);

export const getMathCurriculumRecordByGameId = (gameId: string) =>
  MATH_CURRICULUM_RECORDS.find((record) => record.gameId === gameId) ?? null;

export const getMathCurriculumRecordById = (curriculumRecordId: string) =>
  MATH_CURRICULUM_RECORDS.find((record) => record.id === curriculumRecordId) ?? null;

export const listMathCurriculumRecordsWithGames = () =>
  MATH_CURRICULUM_RECORDS.filter((record) => Boolean(record.gameId));

export function buildPp1CountingEvidenceSummary(input: {
  attempts: MathGameAttemptSignal[];
  bestScore: number | null;
  bestTimeMs: number | null;
  teacherJudgement?: Partial<MathCurriculumTeacherJudgement> | null;
  teacherJudgementHistory?: MathCurriculumTeacherJudgementHistoryEntry[];
}): MathCurriculumEvidenceSummary {
  const curriculumRecord = getMathCurriculumRecordByGameId(PP1_COUNTING_GAME_ID);
  if (!curriculumRecord) {
    throw new Error("PP1 counting curriculum record is missing.");
  }

  const levelById = new Map(
    PP1_COUNT_THE_SET_LEVELS.map((level) => [level.id, level]),
  );
  const attempts = input.attempts
    .filter((attempt) => levelById.has(attempt.gameLevelId))
    .sort((left, right) =>
      right.submittedAt.localeCompare(left.submittedAt),
    );

  const practicedQuantities = Array.from(
    new Set(
      attempts
        .map((attempt) => levelById.get(attempt.gameLevelId)?.quantity ?? null)
        .filter((quantity): quantity is number => quantity !== null),
    ),
  ).sort((left, right) => left - right);

  const correctQuantities = Array.from(
    new Set(
      attempts
        .filter((attempt) => attempt.score > 0)
        .map((attempt) => levelById.get(attempt.gameLevelId)?.quantity ?? null)
        .filter((quantity): quantity is number => quantity !== null),
    ),
  ).sort((left, right) => left - right);

  const targetQuantities = PP1_COUNT_THE_SET_LEVELS.map((level) => level.quantity);
  const missedQuantities = targetQuantities.filter(
    (quantity) => !correctQuantities.includes(quantity),
  );

  let rubricLevel: MathCurriculumRubricLevel | null = null;
  let supportLevel: MathCurriculumSupportLevel | null = null;
  let interpretation = "No digital game evidence yet.";

  if (attempts.length > 0) {
    const bestScore = input.bestScore ?? 0;
    if (bestScore >= PP1_COUNT_THE_SET_LEVELS.length && correctQuantities.length >= 5) {
      rubricLevel = "EXCEEDS_EXPECTATION";
      supportLevel = "INDEPENDENT";
      interpretation =
        "Learner consistently counts each object once and matches the full 5-9 range accurately.";
    } else if (bestScore >= 4 || correctQuantities.length >= 4) {
      rubricLevel = "MEETS_EXPECTATION";
      supportLevel = "NORMAL_INSTRUCTION";
      interpretation =
        "Learner matches most PP1 counting sets correctly after normal instruction.";
    } else if (bestScore >= 2 || correctQuantities.length >= 2) {
      rubricLevel = "APPROACHES_EXPECTATION";
      supportLevel = "PROMPTS";
      interpretation =
        "Learner shows partial accuracy but still needs prompts on some quantities in the 5-9 range.";
    } else {
      rubricLevel = "BELOW_EXPECTATION";
      supportLevel = "DIRECT_GUIDANCE";
      interpretation =
        "Learner is not yet matching PP1 counting sets without direct support and repeated modeling.";
    }
  }

  return {
    competencyId: curriculumRecord.id,
    courseId: curriculumRecord.courseId,
    gameId: PP1_COUNTING_GAME_ID,
    rubricId: curriculumRecord.rubricId,
    evidenceType: "GAME_ATTEMPT",
    evidenceTarget: curriculumRecord.evidenceTarget,
    latestEvidenceAt: attempts[0]?.submittedAt ?? null,
    attemptCount: attempts.length,
    practicedQuantities,
    correctQuantities,
    missedQuantities,
    bestScore: input.bestScore,
    bestTimeMs: input.bestTimeMs,
    rubricLevel,
    supportLevel,
    interpretation,
    teacherObservationPrompts: COUNTING_OBSERVATION_PROMPTS,
    teacherJudgement: {
      note: input.teacherJudgement?.note ?? null,
      rubricLevelOverride: input.teacherJudgement?.rubricLevelOverride ?? null,
      supportLevelOverride: input.teacherJudgement?.supportLevelOverride ?? null,
      countedEachObjectOnce: input.teacherJudgement?.countedEachObjectOnce ?? false,
      skippedDoubleCounted: input.teacherJudgement?.skippedDoubleCounted ?? false,
      matchedNumeralCorrectly: input.teacherJudgement?.matchedNumeralCorrectly ?? false,
      neededPrompts: input.teacherJudgement?.neededPrompts ?? false,
      updatedAt: input.teacherJudgement?.updatedAt ?? null,
    },
    teacherJudgementHistory: input.teacherJudgementHistory ?? [],
  };
}

const MATH_CURRICULUM_EVIDENCE_DEFINITIONS: Record<
  string,
  MathCurriculumEvidenceDefinition
> = {
  [PP1_COUNTING_COMPETENCY_ID]: {
    competencyId: PP1_COUNTING_COMPETENCY_ID,
    gameId: PP1_COUNTING_GAME_ID,
    teacherObservationPrompts: COUNTING_OBSERVATION_PROMPTS,
    buildSummary: (input) =>
      buildPp1CountingEvidenceSummary({
        attempts: input.attempts,
        bestScore: input.bestScore,
        bestTimeMs: input.bestTimeMs,
        teacherJudgement: input.teacherJudgement,
        teacherJudgementHistory: input.teacherJudgementHistory,
      }),
  },
};

export function buildMathCurriculumEvidenceSummary(
  input: MathCurriculumEvidenceSummaryBuilderInput,
): MathCurriculumEvidenceSummary {
  const definition = MATH_CURRICULUM_EVIDENCE_DEFINITIONS[input.competencyId];
  if (definition) {
    return definition.buildSummary(input);
  }

  const curriculumRecord = getMathCurriculumRecordById(input.competencyId);
  if (!curriculumRecord) {
    throw new Error("Math curriculum record is missing.");
  }

  const attempts = input.attempts
    .filter((attempt) =>
      curriculumRecord.gameLevelIds?.length
        ? curriculumRecord.gameLevelIds.includes(attempt.gameLevelId)
        : true,
    )
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));

  let rubricLevel: MathCurriculumRubricLevel | null = null;
  let supportLevel: MathCurriculumSupportLevel | null = null;
  let interpretation = "No digital game evidence yet.";

  if (attempts.length > 0) {
    const bestScore = input.bestScore ?? 0;
    if (bestScore >= 4) {
      rubricLevel = "MEETS_EXPECTATION";
      supportLevel = "NORMAL_INSTRUCTION";
      interpretation =
        "Learner shows solid digital evidence for this maths competency after normal instruction.";
    } else if (bestScore >= 2) {
      rubricLevel = "APPROACHES_EXPECTATION";
      supportLevel = "PROMPTS";
      interpretation =
        "Learner shows partial digital evidence for this maths competency and still needs prompts.";
    } else {
      rubricLevel = "BELOW_EXPECTATION";
      supportLevel = "DIRECT_GUIDANCE";
      interpretation =
        "Learner is not yet showing enough digital evidence for this maths competency without direct support.";
    }
  }

  return {
    competencyId: curriculumRecord.id,
    courseId: curriculumRecord.courseId,
    gameId: curriculumRecord.gameId ?? "unknown-game",
    rubricId: curriculumRecord.rubricId,
    evidenceType: "GAME_ATTEMPT",
    evidenceTarget: curriculumRecord.evidenceTarget,
    latestEvidenceAt: attempts[0]?.submittedAt ?? null,
    attemptCount: attempts.length,
    practicedQuantities: [],
    correctQuantities: [],
    missedQuantities: [],
    bestScore: input.bestScore,
    bestTimeMs: input.bestTimeMs,
    rubricLevel,
    supportLevel,
    interpretation,
    teacherObservationPrompts: [
      "Teacher observation recorded for this competency",
      "Support level noted beside digital evidence",
    ],
    teacherJudgement: {
      note: input.teacherJudgement?.note ?? null,
      rubricLevelOverride: input.teacherJudgement?.rubricLevelOverride ?? null,
      supportLevelOverride: input.teacherJudgement?.supportLevelOverride ?? null,
      countedEachObjectOnce: input.teacherJudgement?.countedEachObjectOnce ?? false,
      skippedDoubleCounted: input.teacherJudgement?.skippedDoubleCounted ?? false,
      matchedNumeralCorrectly: input.teacherJudgement?.matchedNumeralCorrectly ?? false,
      neededPrompts: input.teacherJudgement?.neededPrompts ?? false,
      updatedAt: input.teacherJudgement?.updatedAt ?? null,
    },
    teacherJudgementHistory: input.teacherJudgementHistory ?? [],
  };
}
