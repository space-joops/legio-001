export type PrayerItemKey =
  | "weekdayMass"
  | "priestPrayer"
  | "chainPrayer"
  | "rosaryDecades"
  | "aspirations"
  | "catena"
  | "tesseraFull"
  | "handbookReading";

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

export interface ExportedData {
  exportedAt: string;
  dataSchemaVersion: number;
  profile: Profile;
  history: WeeklyReport[];
  currentReport: WeeklyReport | null;
  schedule: ScheduleEvent[];
  roster: PraesidiumRoster;
  monthlyReports: MonthlyReport[];
}
