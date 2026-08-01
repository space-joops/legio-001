import { DATA_SCHEMA_VERSION } from "./constants";
import type {
  AnnualReport,
  Language,
  MemberCounts,
  MonthlyReport,
  PraesidiumRoster,
  Profile,
  ScheduleEvent,
  Settings,
  WeeklyReport,
} from "./types";

const KEYS = {
  profile: "legioMariae.profile",
  settings: "legioMariae.settings",
  currentReport: "legioMariae.currentReport",
  history: "legioMariae.history",
  schedule: "legioMariae.schedule",
  praesidiumRoster: "legioMariae.praesidiumRoster",
  monthlyReports: "legioMariae.monthlyReports",
  annualReports: "legioMariae.annualReports",
  dataSchemaVersion: "legioMariae.dataSchemaVersion",
  // Kept in KEYS so resetAll() still clears it on devices that used the
  // splash cooldown this app no longer has.
  lastSplashShownAt: "legioMariae.lastSplashShownAt",
  lastExportedAt: "legioMariae.lastExportedAt",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type WriteFailureListener = () => void;

const writeFailureListeners = new Set<WriteFailureListener>();

/**
 * Subscribe to storage writes that were rejected (quota exhausted, Safari
 * private mode, …). Every setter here is fire-and-forget, so without this the
 * failure would be completely silent and the user would keep tapping counters
 * that never persist.
 */
export function onStorageWriteFailure(listener: WriteFailureListener): () => void {
  writeFailureListeners.add(listener);
  return () => writeFailureListeners.delete(listener);
}

function writeJson<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Throwing here would take down the whole app: these setters are called
    // from render-adjacent handlers (a counter tap, a keystroke) and there is
    // no error boundary between them and the root.
    writeFailureListeners.forEach((listener) => listener());
    return false;
  }
}

export const DEFAULT_PROFILE: Profile = {
  name: "",
  baptismalName: "",
  praesidiumName: "",
  parishName: "",
};
export const DEFAULT_SETTINGS: Settings = {
  language: "ko",
  fontScale: "medium",
  fontFamily: "system",
  splashEnabled: true,
};
const EMPTY_MEMBER_COUNTS_DEFAULT: MemberCounts = {
  activeMale: 0,
  activeFemale: 0,
  praetorium: 0,
  auxiliaryMale: 0,
  auxiliaryFemale: 0,
  adjutorium: 0,
};

/** Only the fields that can be missing from reports written by older versions;
    spread *under* the stored report so real values always win. */
const EMPTY_EVANGELIZATION = {
  baptism: { result: 0, target: 0 },
  returnToFaith: { result: 0, target: 0 },
  activeMember: { result: 0, target: 0 },
  praetorium: { result: 0, target: 0 },
};

const EMPTY_MONTHLY_REPORT_DEFAULTS = {
  attendanceRoll: [],
  prayerRoll: [],
  agendaItems: [],
  sundayMassTotal: 0,
  evangelization: EMPTY_EVANGELIZATION,
  activityTallies: {},
  memberCountsPrevMonth: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsThisMonth: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsIncrease: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsDecrease: EMPTY_MEMBER_COUNTS_DEFAULT,
  dioceseInstructions: "",
  parishInstructions: "",
  councilInstructions: "",
  activitySummary: "",
  cumulativeEvangelization: "",
  otherNotes: "",
  meetingTime: "",
  meetingLocation: "",
} satisfies Partial<MonthlyReport>;

export const DEFAULT_ROSTER: PraesidiumRoster = {
  praesidiumName: "",
  councilAffiliation: "",
  spiritualDirectorName: "",
  spiritualDirectorBaptismalName: "",
  officers: [
    { role: "president", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "vicePresident", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "secretary", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "treasurer", name: "", baptismalName: "", appointedDate: "", note: "" },
  ],
  memberCounts: {
    activeMale: 0,
    activeFemale: 0,
    praetorium: 0,
    auxiliaryMale: 0,
    auxiliaryFemale: 0,
    adjutorium: 0,
  },
  memberRoster: {
    activeMale: [],
    activeFemale: [],
    praetorium: [],
    auxiliaryMale: [],
    auxiliaryFemale: [],
    adjutorium: [],
  },
  regularMeetingWeekday: -1,
};

export const storage = {
  getProfile(): Profile {
    // Merge with defaults so profiles saved before a field existed don't come back `undefined`.
    return { ...DEFAULT_PROFILE, ...readJson<Partial<Profile>>(KEYS.profile, {}) };
  },
  setProfile(profile: Profile): void {
    writeJson(KEYS.profile, profile);
  },

  getSettings(): Settings {
    // Merge with defaults so settings saved before a field existed don't come back `undefined`.
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(KEYS.settings, {}) };
  },
  setSettings(settings: Settings): void {
    writeJson(KEYS.settings, settings);
  },
  getLanguage(): Language {
    return this.getSettings().language;
  },
  setLanguage(language: Language): void {
    this.setSettings({ ...this.getSettings(), language });
  },

  getCurrentReport(): WeeklyReport | null {
    return readJson<WeeklyReport | null>(KEYS.currentReport, null);
  },
  setCurrentReport(report: WeeklyReport | null): void {
    writeJson(KEYS.currentReport, report);
  },

  getHistory(): WeeklyReport[] {
    return readJson<WeeklyReport[]>(KEYS.history, []);
  },
  setHistory(history: WeeklyReport[]): void {
    writeJson(KEYS.history, history);
  },

  getSchedule(): ScheduleEvent[] {
    return readJson<ScheduleEvent[]>(KEYS.schedule, []);
  },
  setSchedule(schedule: ScheduleEvent[]): void {
    writeJson(KEYS.schedule, schedule);
  },

  getRoster(): PraesidiumRoster {
    return { ...DEFAULT_ROSTER, ...readJson<Partial<PraesidiumRoster>>(KEYS.praesidiumRoster, {}) };
  },
  setRoster(roster: PraesidiumRoster): void {
    writeJson(KEYS.praesidiumRoster, roster);
  },

  getMonthlyReports(): MonthlyReport[] {
    const stored = readJson<MonthlyReport[]>(KEYS.monthlyReports, []);
    if (!Array.isArray(stored)) return [];
    // Reports saved before a field existed would otherwise surface `undefined`
    // deep inside the print view; MonthlyReport is too big to hand-check.
    return stored.map((report) => ({ ...EMPTY_MONTHLY_REPORT_DEFAULTS, ...report }));
  },
  setMonthlyReports(reports: MonthlyReport[]): void {
    writeJson(KEYS.monthlyReports, reports);
  },

  getAnnualReports(): AnnualReport[] {
    const stored = readJson<AnnualReport[]>(KEYS.annualReports, []);
    return Array.isArray(stored) ? stored : [];
  },
  setAnnualReports(reports: AnnualReport[]): void {
    writeJson(KEYS.annualReports, reports);
  },

  /** Epoch ms of the last successful export; 0 means never backed up. */
  getLastExportedAt(): number {
    return readJson<number>(KEYS.lastExportedAt, 0);
  },
  setLastExportedAt(timestamp: number): void {
    writeJson(KEYS.lastExportedAt, timestamp);
  },

  getSchemaVersion(): number {
    return readJson<number>(KEYS.dataSchemaVersion, 0);
  },
  ensureSchemaVersion(): void {
    writeJson(KEYS.dataSchemaVersion, DATA_SCHEMA_VERSION);
  },

  resetAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  },
};
