export type CurriculumPriority = "Core" | "Stretch" | "Booster";

export type CourseLike = {
  id: string;
  title: string;
  ageBand?: "5-7" | "8-10" | "11-14";
  pathwayStage?: "Explorer" | "Builder" | "Creator";
  aiFocus?: string;
  codingFocus?: string;
  mathFocus?: string;
};

export type CourseCurriculumPlan = {
  courseId: string;
  priority: CurriculumPriority;
  sequenceIndex: number;
  ageBand: "5-7" | "8-10" | "11-14";
  stickyHook: string;
  teacherUses: string[];
  nextMissionIds: string[];
  badgeLabel: string;
  themeBlend: { ai: number; coding: number; math: number };
};

export type AlignmentReason = {
  courseId: string;
  reason: string;
  weight: number;
};

export type TeacherAlignmentRecommendation<TCourse extends CourseLike = CourseLike> = {
  course: TCourse;
  score: number;
  reasons: string[];
  primaryReason: string;
  confidence: "Best fit" | "Strong fit" | "Support fit";
  plan: CourseCurriculumPlan | null;
};

export type LearnerBadge = {
  id: string;
  label: string;
  description: string;
  toneClass: string;
};

export type LearnerRecommendation = {
  courseId: string;
  title: string;
  href: string;
  reason: string;
  ageBand?: "5-7" | "8-10" | "11-14";
  stage?: "Explorer" | "Builder" | "Creator";
};

const COURSE_PLANS: Record<string, CourseCurriculumPlan> = {
  "course-logic": {
    courseId: "course-logic",
    priority: "Core",
    sequenceIndex: 10,
    ageBand: "5-7",
    stickyHook: "Fast wins with visible pattern sorting and robot feedback.",
    teacherUses: [
      "Pre-number sorting and grouping warmups",
      "Pattern and ordering remediation practice",
      "Transition to simple coding rules",
    ],
    nextMissionIds: ["course-safari", "course-treasure"],
    badgeLabel: "Pattern Scout",
    themeBlend: { ai: 45, coding: 25, math: 30 },
  },
  "course-safari": {
    courseId: "course-safari",
    priority: "Core",
    sequenceIndex: 20,
    ageBand: "5-7",
    stickyHook: "Sound and picture sorting keeps attention high for early learners.",
    teacherUses: [
      "Matching/pairing reinforcement",
      "Vocabulary + classification bridge lessons",
      "Whole-group interactive station work",
    ],
    nextMissionIds: ["course-treasure"],
    badgeLabel: "Safari Sorter",
    themeBlend: { ai: 40, coding: 25, math: 35 },
  },
  "course-treasure": {
    courseId: "course-treasure",
    priority: "Stretch",
    sequenceIndex: 30,
    ageBand: "5-7",
    stickyHook: "Treasure maps add narrative motivation and repeat play.",
    teacherUses: [
      "Geometry and positional language practice",
      "Number sequencing support",
      "Debugging and turn-taking routines",
    ],
    nextMissionIds: ["course-math", "course-space-signals"],
    badgeLabel: "Trail Coder",
    themeBlend: { ai: 20, coding: 45, math: 35 },
  },
  "course-math": {
    courseId: "course-math",
    priority: "Core",
    sequenceIndex: 40,
    ageBand: "8-10",
    stickyHook: "Robot missions combine coding challenge with measurable math wins.",
    teacherUses: [
      "Numbers and geometry extension tasks",
      "Debugging routines for mixed-ability groups",
      "Coding clubs and challenge periods",
    ],
    nextMissionIds: ["course-space-signals", "course-eco-sensors"],
    badgeLabel: "Robot Navigator",
    themeBlend: { ai: 20, coding: 45, math: 35 },
  },
  "course-space-signals": {
    courseId: "course-space-signals",
    priority: "Core",
    sequenceIndex: 50,
    ageBand: "8-10",
    stickyHook: "Mystery signal alerts keep builders curious and iterating.",
    teacherUses: [
      "Pattern and anomaly spotting exercises",
      "Graph reading and coordinate mini-projects",
      "Conditional logic practice",
    ],
    nextMissionIds: ["course-eco-sensors", "course-climate-data"],
    badgeLabel: "Signal Detective",
    themeBlend: { ai: 35, coding: 35, math: 30 },
  },
  "course-eco-sensors": {
    courseId: "course-eco-sensors",
    priority: "Stretch",
    sequenceIndex: 60,
    ageBand: "8-10",
    stickyHook: "Real-world garden decisions make coding feel useful and hands-on.",
    teacherUses: [
      "Measurement and comparison application",
      "Threshold-rule design discussions",
      "Science + maths integration blocks",
    ],
    nextMissionIds: ["course-climate-data"],
    badgeLabel: "Eco Builder",
    themeBlend: { ai: 30, coding: 30, math: 40 },
  },
  "course-story": {
    courseId: "course-story",
    priority: "Core",
    sequenceIndex: 70,
    ageBand: "11-14",
    stickyHook: "Creative storytelling + safe AI design supports strong student ownership.",
    teacherUses: [
      "Language integration and prompt writing",
      "Responsible AI discussion starters",
      "Presentation and reflection rubrics",
    ],
    nextMissionIds: ["course-climate-data", "course-vision-lab"],
    badgeLabel: "Prompt Author",
    themeBlend: { ai: 40, coding: 35, math: 25 },
  },
  "course-climate-data": {
    courseId: "course-climate-data",
    priority: "Core",
    sequenceIndex: 80,
    ageBand: "11-14",
    stickyHook: "Authentic datasets and charts keep older learners challenged.",
    teacherUses: [
      "Data literacy and maths communication tasks",
      "Python summarization practice",
      "Evidence-based claims and critique",
    ],
    nextMissionIds: ["course-vision-lab"],
    badgeLabel: "Data Analyst",
    themeBlend: { ai: 30, coding: 30, math: 40 },
  },
  "course-vision-lab": {
    courseId: "course-vision-lab",
    priority: "Stretch",
    sequenceIndex: 90,
    ageBand: "11-14",
    stickyHook: "Arcade challenge format sustains focus while teaching fairness checks.",
    teacherUses: [
      "Ethics and bias review activities",
      "Test-case design and scoring logic",
      "Peer review and fairness evidence presentations",
    ],
    nextMissionIds: [],
    badgeLabel: "Fairness Auditor",
    themeBlend: { ai: 45, coding: 30, math: 25 },
  },
};

const SUBJECT_ALIGNMENT_RULES: Record<string, AlignmentReason[]> = {
  "subject-math": [
    { courseId: "course-math", reason: "Math subject sessions map directly to robot coding and quantitative problem solving.", weight: 4 },
    { courseId: "course-logic", reason: "Pre-math patterns and sorting support early AI reasoning foundations.", weight: 2 },
    { courseId: "course-space-signals", reason: "Graphing and comparisons reinforce upper-primary maths fluency.", weight: 2 },
    { courseId: "course-eco-sensors", reason: "Measurement and thresholds apply maths in practical coding contexts.", weight: 2 },
  ],
  "subject-language": [
    { courseId: "course-story", reason: "Language instruction aligns with prompt writing, storytelling, and chatbot reflection.", weight: 4 },
    { courseId: "course-vision-lab", reason: "Language-rich critique helps learners explain fairness and evidence.", weight: 2 },
    { courseId: "course-climate-data", reason: "Supports reading data reports and writing evidence-based summaries.", weight: 1 },
  ],
};

const STRAND_ALIGNMENT_RULES: Record<string, AlignmentReason[]> = {
  "strand-pre-number": [
    { courseId: "course-logic", reason: "Pre-number concepts feed classification and pattern-detective routines.", weight: 4 },
    { courseId: "course-safari", reason: "Grouping and comparing sets match safari sorting tasks.", weight: 3 },
    { courseId: "course-treasure", reason: "Ordering and path steps strengthen early sequence thinking.", weight: 2 },
  ],
  "strand-numbers": [
    { courseId: "course-math", reason: "Number fluency supports robot moves, loops, and coordinates.", weight: 4 },
    { courseId: "course-treasure", reason: "Sequence and position practice support treasure-bot maps.", weight: 2 },
  ],
  "strand-measurement": [
    { courseId: "course-eco-sensors", reason: "Measurement strand maps to sensor readings and threshold decisions.", weight: 4 },
    { courseId: "course-math", reason: "Measurement supports robot timing and path accuracy checks.", weight: 3 },
    { courseId: "course-climate-data", reason: "Measurement vocabulary extends into climate data interpretation.", weight: 2 },
  ],
  "strand-geometry": [
    { courseId: "course-treasure", reason: "Shapes and space language align with map navigation and direction changes.", weight: 3 },
    { courseId: "course-math", reason: "Geometry supports coordinates and robot navigation puzzles.", weight: 4 },
    { courseId: "course-vision-lab", reason: "Visual features and shapes connect to image recognition discussions.", weight: 2 },
  ],
  "strand-listening-speaking": [
    { courseId: "course-story", reason: "Listening and speaking strengthen prompt design and chatbot dialogue practice.", weight: 4 },
    { courseId: "course-safari", reason: "Sound-based sorting can support oral labeling and listening routines.", weight: 2 },
  ],
  "strand-reading": [
    { courseId: "course-story", reason: "Reading strand aligns with prompt interpretation and response revision.", weight: 4 },
    { courseId: "course-vision-lab", reason: "Reading examples and test cases supports evaluation thinking.", weight: 2 },
    { courseId: "course-climate-data", reason: "Reading charts and data notes supports climate evidence tasks.", weight: 2 },
  ],
  "strand-writing": [
    { courseId: "course-story", reason: "Writing strand maps to chatbot prompts and story iteration.", weight: 4 },
    { courseId: "course-climate-data", reason: "Writing explanations supports data report conclusions.", weight: 2 },
    { courseId: "course-vision-lab", reason: "Writing fairness justifications supports reflection tasks.", weight: 2 },
  ],
};

const ACTIVITY_ALIGNMENT_RULES: Record<string, AlignmentReason[]> = {
  "activity-sorting-grouping": [
    { courseId: "course-logic", reason: "Direct match for sorting and classification logic in AI Pattern Detectives.", weight: 6 },
    { courseId: "course-safari", reason: "Sound and picture grouping is the core mechanic in Safari missions.", weight: 5 },
  ],
  "activity-matching-pairing": [
    { courseId: "course-safari", reason: "Matching and pairing supports early sound-label and object-label practice.", weight: 5 },
    { courseId: "course-logic", reason: "Pattern matching strengthens classifier feature recognition.", weight: 4 },
  ],
  "activity-ordering": [
    { courseId: "course-treasure", reason: "Ordering maps to step-by-step commands in treasure bot routes.", weight: 5 },
    { courseId: "course-logic", reason: "Sequence logic supports early coding and prediction tasks.", weight: 4 },
    { courseId: "course-math", reason: "Ordering supports loop planning and robot route debugging.", weight: 3 },
  ],
  "activity-patterns": [
    { courseId: "course-logic", reason: "Strongest fit for repeated visual and number pattern detection.", weight: 6 },
    { courseId: "course-space-signals", reason: "Pattern spotting extends to signal anomaly detection tasks.", weight: 3 },
  ],
  "activity-number-recognition": [
    { courseId: "course-treasure", reason: "Number labels and map clues support treasure-bot route reading.", weight: 4 },
    { courseId: "course-math", reason: "Number recognition supports robot coding inputs and coordinates.", weight: 4 },
  ],
  "activity-number-sequencing": [
    { courseId: "course-treasure", reason: "Sequential number clues match route-building logic.", weight: 4 },
    { courseId: "course-math", reason: "Number sequencing supports loop-based movement and debugging.", weight: 5 },
  ],
  "activity-number-writing": [
    { courseId: "course-treasure", reason: "Writing route numbers helps young learners own the code-map challenge.", weight: 3 },
    { courseId: "course-math", reason: "Written number practice reinforces coordinate and variable notation.", weight: 3 },
  ],
  "activity-comparing-sizes": [
    { courseId: "course-eco-sensors", reason: "Comparing readings directly mirrors eco sensor decision thresholds.", weight: 5 },
    { courseId: "course-math", reason: "Size comparisons support robot planning and quantitative choices.", weight: 3 },
  ],
  "activity-length-estimation": [
    { courseId: "course-eco-sensors", reason: "Estimation supports measurement-based environmental monitoring tasks.", weight: 4 },
    { courseId: "course-math", reason: "Supports route distance estimation and debugging in robot labs.", weight: 4 },
  ],
  "activity-capacity-weight": [
    { courseId: "course-eco-sensors", reason: "Capacity and weight data fit garden monitoring decisions.", weight: 5 },
    { courseId: "course-climate-data", reason: "Measurement thinking extends into data tables and comparisons.", weight: 2 },
  ],
  "activity-sides-of-objects": [
    { courseId: "course-math", reason: "Shape features connect directly to geometry and robot navigation tasks.", weight: 4 },
    { courseId: "course-vision-lab", reason: "Feature recognition supports computer vision discussions.", weight: 3 },
  ],
  "activity-shapes": [
    { courseId: "course-treasure", reason: "Shape clues support map puzzles and navigation games.", weight: 3 },
    { courseId: "course-math", reason: "Shape reasoning supports geometry and coding pathways.", weight: 4 },
    { courseId: "course-vision-lab", reason: "Image features and shape recognition support vision model practice.", weight: 3 },
  ],
  "activity-print-awareness": [
    { courseId: "course-story", reason: "Print awareness supports safe prompt reading and chatbot instructions.", weight: 4 },
  ],
  "activity-letter-recognition": [
    { courseId: "course-story", reason: "Letter recognition supports early prompt writing and reading fluency.", weight: 4 },
    { courseId: "course-safari", reason: "Label matching can support sound-to-letter vocabulary games.", weight: 2 },
  ],
  "activity-visual-discrimination": [
    { courseId: "course-vision-lab", reason: "Visual discrimination is a direct bridge to image-recognition fairness activities.", weight: 5 },
    { courseId: "course-story", reason: "Supports reading accuracy in prompt and story revision tasks.", weight: 2 },
  ],
  "activity-listening-comprehension": [
    { courseId: "course-story", reason: "Listening comprehension supports dialogue design and prompt interpretation.", weight: 5 },
    { courseId: "course-safari", reason: "Audio clue sorting reinforces listening and labeling routines.", weight: 2 },
  ],
  "activity-auditory-memory": [
    { courseId: "course-story", reason: "Auditory memory supports multi-step prompts and oral storytelling.", weight: 4 },
    { courseId: "course-safari", reason: "Remembers sound patterns used in early classification games.", weight: 3 },
  ],
  "activity-letter-formation": [
    { courseId: "course-story", reason: "Letter formation supports written prompt drafting and reflection.", weight: 4 },
  ],
};

export function getCourseCurriculumPlan(courseId: string) {
  return COURSE_PLANS[courseId] ?? null;
}

export function compareCoursesByCurriculumPlan(a: CourseLike, b: CourseLike) {
  const planA = getCourseCurriculumPlan(a.id);
  const planB = getCourseCurriculumPlan(b.id);
  const seqA = planA?.sequenceIndex ?? Number.MAX_SAFE_INTEGER;
  const seqB = planB?.sequenceIndex ?? Number.MAX_SAFE_INTEGER;
  if (seqA !== seqB) return seqA - seqB;
  return a.title.localeCompare(b.title);
}

function priorityRank(priority?: CurriculumPriority | null) {
  if (priority === "Core") return 0;
  if (priority === "Booster") return 1;
  if (priority === "Stretch") return 2;
  return 3;
}

function confidenceLabel(score: number): TeacherAlignmentRecommendation["confidence"] {
  if (score >= 10) return "Best fit";
  if (score >= 6) return "Strong fit";
  return "Support fit";
}

export function buildTeacherAlignmentRecommendations<TCourse extends CourseLike>(input: {
  courseCatalog: TCourse[];
  subjectId?: string | null;
  strandId?: string | null;
  activityId?: string | null;
}) {
  const aggregated = new Map<string, { score: number; reasons: string[] }>();

  const addRules = (rules: AlignmentReason[] | undefined) => {
    if (!rules) return;
    rules.forEach((rule) => {
      const current = aggregated.get(rule.courseId) ?? { score: 0, reasons: [] };
      current.score += rule.weight;
      if (!current.reasons.includes(rule.reason)) {
        current.reasons.push(rule.reason);
      }
      aggregated.set(rule.courseId, current);
    });
  };

  if (input.subjectId) addRules(SUBJECT_ALIGNMENT_RULES[input.subjectId]);
  if (input.strandId) addRules(STRAND_ALIGNMENT_RULES[input.strandId]);
  if (input.activityId) addRules(ACTIVITY_ALIGNMENT_RULES[input.activityId]);

  const recommendations: TeacherAlignmentRecommendation<TCourse>[] = Array.from(
    aggregated.entries(),
  ).flatMap(([courseId, aggregate]) => {
      const course = input.courseCatalog.find((item) => item.id === courseId);
      if (!course) return [];
      const plan = getCourseCurriculumPlan(course.id);
      return [
        {
          course,
          score: aggregate.score,
          reasons: aggregate.reasons,
          primaryReason: aggregate.reasons[0] ?? "Curriculum alignment",
          confidence: confidenceLabel(aggregate.score),
          plan,
        },
      ];
    });

  recommendations.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const priorityDiff = priorityRank(a.plan?.priority) - priorityRank(b.plan?.priority);
    if (priorityDiff !== 0) return priorityDiff;
    const seqDiff = (a.plan?.sequenceIndex ?? 999) - (b.plan?.sequenceIndex ?? 999);
    if (seqDiff !== 0) return seqDiff;
    return a.course.title.localeCompare(b.course.title);
  });

  return recommendations;
}

export type DashboardStatsLike = {
  continueWatching?: { courseId?: string; courseTitle?: string; href?: string } | null;
  completedTotal: number;
  completedThisWeek: number;
  streakDays: number;
};

const FALLBACK_TITLES: Record<string, string> = {
  "course-logic": "AI Pattern Detectives",
  "course-safari": "Sound Sorting Safari",
  "course-treasure": "Treasure Bot Trail",
  "course-math": "Robot Coders Math Lab",
  "course-space-signals": "Space Signal Detectives",
  "course-eco-sensors": "Eco Sensor Builders",
  "course-story": "Story Chatbot Studio",
  "course-climate-data": "Climate Data Code Studio",
  "course-vision-lab": "Vision Lab Ethics Arcade",
};

const DEFAULT_RECOMMENDATION_SEQUENCE = [
  "course-logic",
  "course-safari",
  "course-treasure",
  "course-math",
  "course-space-signals",
  "course-eco-sensors",
  "course-story",
  "course-climate-data",
  "course-vision-lab",
] as const;

function learnerStageTarget(stats: DashboardStatsLike) {
  if (stats.completedTotal < 3) return "Explorer" as const;
  if (stats.completedTotal < 6) return "Builder" as const;
  return "Creator" as const;
}

export function getLearnerRecommendationFromStats(
  stats: DashboardStatsLike,
  courseCatalog?: CourseLike[],
): LearnerRecommendation {
  if (stats.continueWatching?.courseId && stats.continueWatching.href) {
    return {
      courseId: stats.continueWatching.courseId,
      title: stats.continueWatching.courseTitle ?? FALLBACK_TITLES[stats.continueWatching.courseId] ?? "Resume mission",
      href: stats.continueWatching.href,
      reason: "Finish your current mission first to keep momentum and build streak consistency.",
    };
  }

  const stageTarget = learnerStageTarget(stats);
  const orderedCatalog = courseCatalog
    ? [...courseCatalog].sort(compareCoursesByCurriculumPlan)
    : DEFAULT_RECOMMENDATION_SEQUENCE.map((courseId) => ({
        id: courseId,
        title: FALLBACK_TITLES[courseId],
        ageBand: getCourseCurriculumPlan(courseId)?.ageBand,
        pathwayStage: undefined,
      }));

  const byStage = orderedCatalog.find((course) => {
    const plan = getCourseCurriculumPlan(course.id);
    if (!plan) return false;
    if (stageTarget === "Explorer") return plan.ageBand === "5-7";
    if (stageTarget === "Builder") return plan.ageBand === "8-10";
    return plan.ageBand === "11-14";
  }) ?? orderedCatalog[0];

  const targetCourseId = byStage?.id ?? "course-logic";
  const plan = getCourseCurriculumPlan(targetCourseId);
  return {
    courseId: targetCourseId,
    title: byStage?.title ?? FALLBACK_TITLES[targetCourseId] ?? "Next mission",
    href: `/courses/${targetCourseId}`,
    ageBand: plan?.ageBand,
    stage: byStage?.pathwayStage,
    reason:
      stageTarget === "Explorer"
        ? "Start with a quick-win mission that builds pattern confidence and visible progress."
        : stageTarget === "Builder"
          ? "Move into builder missions with coding + maths challenges and debugging practice."
          : "You are ready for creator missions with real-world data, Python, and responsible AI decisions.",
  };
}

export function getLearnerBadgesFromStats(stats: DashboardStatsLike): LearnerBadge[] {
  const badges: LearnerBadge[] = [];

  if (stats.streakDays >= 7) {
    badges.push({
      id: "streak-seven",
      label: "7-Day Streak",
      description: "You kept learning for a full week.",
      toneClass: "border-amber-200 bg-amber-50 text-amber-900",
    });
  } else if (stats.streakDays >= 3) {
    badges.push({
      id: "streak-three",
      label: "Streak Starter",
      description: "Three days in a row. Keep it going.",
      toneClass: "border-orange-200 bg-orange-50 text-orange-900",
    });
  }

  if (stats.completedThisWeek >= 3) {
    badges.push({
      id: "week-finisher",
      label: "Weekly Finisher",
      description: "Completed three or more lessons this week.",
      toneClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
    });
  }

  if (stats.completedTotal >= 5) {
    badges.push({
      id: "mission-builder",
      label: "Mission Builder",
      description: "You have completed five or more lessons.",
      toneClass: "border-lime-200 bg-lime-50 text-lime-900",
    });
  }

  if (badges.length === 0) {
    badges.push({
      id: "first-spark",
      label: "First Spark",
      description: "Complete one lesson to unlock your first badge.",
      toneClass: "border-slate-200 bg-slate-50 text-slate-800",
    });
  }

  return badges.slice(0, 3);
}

export function getCourseSequenceForAgeBand(ageBand: "5-7" | "8-10" | "11-14") {
  return Object.values(COURSE_PLANS)
    .filter((plan) => plan.ageBand === ageBand)
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
}
