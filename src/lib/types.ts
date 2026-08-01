export type PrayerItemKey =
  | "weekdayMass"
  | "priestPrayer"
  | "chainPrayer"
  | "rosaryDecades"
  | "aspirations";

export type PrayerCounts = Record<PrayerItemKey, number>;

export type ReportStatus = "in_progress" | "submitted";

export interface WeeklyReport {
  id: string;
  schemaVersion: 1;
  sessionNumber: number;
  meetingDateTime: string;
  memberName: string;
  // Optional: reports submitted before these fields existed won't have them.
  baptismalName?: string;
  praesidiumName?: string;
  parishName?: string;
  activityNote?: string;
  counts: PrayerCounts;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface Profile {
  name: string;
  baptismalName: string;
  praesidiumName: string;
  parishName: string;
}

export type Language = "ko" | "en";

export type FontScale = "small" | "medium" | "large" | "xlarge";
export type FontFamily = "system" | "nanum";

export interface Settings {
  language: Language;
  fontScale: FontScale;
  fontFamily: FontFamily;
  /** Show the Legion of Mary splash image on app open (at most once every few hours). */
  splashEnabled: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  dateTime: string; // ISO
  reminderMinutesBefore: number;
  createdAt: string;
  notifiedAt?: string; // ISO; set once the reminder has been shown, to avoid duplicates
}

export type OfficerRole = "president" | "vicePresident" | "secretary" | "treasurer";

export interface OfficerEntry {
  role: OfficerRole;
  name: string;
  baptismalName: string;
  appointedDate: string; // ISO date
  note: string;
}

export interface MemberCounts {
  activeMale: number;
  activeFemale: number;
  praetorium: number;
  auxiliaryMale: number;
  auxiliaryFemale: number;
  adjutorium: number;
}

export interface MemberEntry {
  id: string;
  name: string;
  baptismalName: string;
}

export type MemberRoster = Record<keyof MemberCounts, MemberEntry[]>;

export interface PraesidiumRoster {
  /** Printed in the report's signature block. */
  praesidiumName: string;
  councilAffiliation: string;
  spiritualDirectorName: string;
  spiritualDirectorBaptismalName: string;
  officers: OfficerEntry[];
  memberCounts: MemberCounts;
  memberRoster: MemberRoster;
  /** 0 = Sunday ... 6 = Saturday; -1 = not configured yet. */
  regularMeetingWeekday: number;
}

export interface AgendaItem {
  id: string;
  status: "실시" | "계획";
  title: string;
  organizer: string;
  dateTime: string;
  location: string;
  attendanceNote: string;
}

export interface AttendanceRecord {
  personId: string;
  personLabel: string;
  isOfficer: boolean;
  sessions: Record<number, boolean>;
}

export interface PrayerSessionEntry {
  personId: string;
  personLabel: string;
  sessions: Record<number, PrayerCounts>;
}

/** Printed as "영세·외짝(0/1), 냉담회두(0/3), …" — result over target. */
export interface EvangelizationTally {
  result: number;
  target: number;
}

export interface EvangelizationTallies {
  baptism: EvangelizationTally;
  returnToFaith: EvangelizationTally;
  activeMember: EvangelizationTally;
  praetorium: EvangelizationTally;
}

export interface MonthlyReport {
  id: string;
  yearMonth: string; // "2026-06"
  sessionRangeStart: number;
  sessionRangeEnd: number;
  /** 0 = Sunday ... 6 = Saturday; -1 = not configured yet. */
  meetingWeekday: number;
  meetingTime: string;
  meetingLocation: string;
  attendance: {
    officersPresent: number;
    officersTotal: number;
    membersPresent: number;
    membersTotal: number;
  };
  attendanceRoll: AttendanceRecord[];
  prayerRoll: PrayerSessionEntry[];
  roster: PraesidiumRoster;
  memberCountsPrevMonth: MemberCounts;
  memberCountsThisMonth: MemberCounts;
  memberCountsIncrease: MemberCounts;
  memberCountsDecrease: MemberCounts;
  agendaItems: AgendaItem[];
  treasury: {
    broughtForward: number;
    income: number;
    expense: number;
    balance: number;
    expenseBreakdown: string;
  };
  prayerCounts: PrayerCounts;
  /** Per-item activity counts keyed by ACTIVITY_ITEMS (src/lib/activityItems.ts). */
  activityTallies: Record<string, number>;
  /**
   * Sunday Masses attended across the whole praesidium this month. Seeded as
   * (people on the prayer roll x Sundays in the month) because members are
   * assumed to attend every Sunday unless they report otherwise; the secretary
   * adjusts it for extra feast-day Masses or absences.
   */
  sundayMassTotal: number;
  /** Year-to-date evangelisation results against target, per the official form. */
  evangelization: EvangelizationTallies;
  dioceseInstructions: string;
  parishInstructions: string;
  councilInstructions: string;
  activitySummary: string;
  cumulativeEvangelization: string;
  otherNotes: string;
  createdAt: string;
  updatedAt: string;
}

/** One line of the annual report's income/expense ledger. */
export interface TreasuryLine {
  id: string;
  label: string;
  amount: number;
}

/** 행사 / 교육 및 피정 / 기타(행사) — three tables of the same shape. */
export type AnnualEventKind = "event" | "formation" | "other";

export interface AnnualEvent {
  id: string;
  kind: AnnualEventKind;
  title: string;
  date: string;
  attendance: string;
}

/** Per-officer attendance as printed: "48/52" for Pr., "12/12" for the council. */
export interface OfficerAttendance {
  role: OfficerRole;
  praesidiumPresent: number;
  praesidiumTotal: number;
  /** The app never sees council meetings, so the secretary types these. */
  councilAttendance: string;
  transferNote: string;
}

/**
 * Figures rolled up from that year's monthly reports. Stored as a snapshot so
 * the report stays stable, and refreshable on demand once the monthly reports
 * behind it change.
 */
export interface AnnualAggregate {
  monthCount: number;
  sessionRangeStart: number;
  sessionRangeEnd: number;
  weekCount: number;
  meetingWeekday: number;
  meetingTime: string;
  meetingLocation: string;
  prayerCounts: PrayerCounts;
  massCommunion: number;
  activityTallies: Record<string, number>;
  officerAttendance: OfficerAttendance[];
  membersPresent: number;
  membersTotal: number;
  memberCountsStart: MemberCounts;
  memberCountsEnd: MemberCounts;
  treasuryBroughtForward: number;
  treasuryIncome: number;
  treasuryExpense: number;
  treasuryBalance: number;
  evangelization: EvangelizationTallies;
}

export interface AnnualReport {
  id: string;
  /** Calendar year covered, e.g. 2024. */
  year: number;
  /** The praesidium's own count, e.g. 33 for 제33차 사업 보고서. */
  reportNumber: number;
  submittedOn: string;
  parishName: string;
  foundedOn: string;
  approvedOn: string;
  deputyDirectorName: string;
  deputyDirectorBaptismalName: string;
  roster: PraesidiumRoster;
  aggregate: AnnualAggregate;
  /** Officer rows the secretary edited; overrides the aggregate on print. */
  officerAttendance: OfficerAttendance[];
  incomeLines: TreasuryLine[];
  expenseLines: TreasuryLine[];
  events: AnnualEvent[];
  operationNotes: string;
  issueTitle: string;
  issueBody: string;
  issueAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportedData {
  exportedAt: string;
  dataSchemaVersion: number;
  profile: Profile;
  history: WeeklyReport[];
  currentReport: WeeklyReport | null;
  schedule: ScheduleEvent[];
  roster: PraesidiumRoster;
  monthlyReports: MonthlyReport[];
  annualReports?: AnnualReport[];
}
