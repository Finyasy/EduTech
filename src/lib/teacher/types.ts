export type LearnerProgressStatus =
  | "PRACTICED_ENOUGH"
  | "KEEP_GOING"
  | "NEED_MORE_PRACTICE";

export type TeacherClassroom = {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  teacherPhone: string;
  cardColor: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeacherLearner = {
  id: string;
  classId: string;
  name: string;
  avatarHue: number;
  weeklyMinutes: number;
  lastWeekMinutes: number;
  createdAt: string;
};

export type TeacherSubject = {
  id: string;
  name: string;
  accentClass: string;
};

export type TeacherStrand = {
  id: string;
  subjectId: string;
  name: string;
};

export type TeacherActivity = {
  id: string;
  subjectId: string;
  strandId: string;
  title: string;
  iconText: string;
  cardClass: string;
};

export type TeacherSchoolSettings = {
  schoolName: string;
  country: string;
  appVersion: string;
  deviceId: string;
  connectivityStatus: "OKAY" | "LIMITED";
  contentStatus: "UP_TO_DATE" | "SYNCING";
  supportEmail: string;
  schoolQrCode: string;
};

export type TeacherWorkspaceSnapshot = {
  isFallbackData?: boolean;
  school: TeacherSchoolSettings;
  classes: TeacherClassroom[];
  archivedClasses: TeacherClassroom[];
  activeClassId: string | null;
  learners: TeacherLearner[];
  subjects: TeacherSubject[];
  strands: TeacherStrand[];
  activities: TeacherActivity[];
  sessionActivityId: string | null;
  sessionStatuses: Record<string, LearnerProgressStatus>;
  weeklySummary: {
    thisWeekMinutes: number;
    lastWeekMinutes: number;
  };
  learnerUsage: Array<{
    learnerId: string;
    learnerName: string;
    thisWeekMinutes: number;
    lastWeekMinutes: number;
  }>;
};
