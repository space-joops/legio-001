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
}

export interface ScheduleEvent {
  id: string;
  title: string;
  dateTime: string; // ISO
  reminderMinutesBefore: number;
  createdAt: string;
  notifiedAt?: string; // ISO; set once the reminder has been shown, to avoid duplicates
}

export interface ExportedData {
  exportedAt: string;
  dataSchemaVersion: number;
  profile: Profile;
  history: WeeklyReport[];
  currentReport: WeeklyReport | null;
  schedule: ScheduleEvent[];
}
