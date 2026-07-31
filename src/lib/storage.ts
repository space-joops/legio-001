import { DATA_SCHEMA_VERSION } from "./constants";
import type {
  Language,
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
  dataSchemaVersion: "legioMariae.dataSchemaVersion",
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

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
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
};
export const DEFAULT_ROSTER: PraesidiumRoster = {
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
    return readJson<MonthlyReport[]>(KEYS.monthlyReports, []);
  },
  setMonthlyReports(reports: MonthlyReport[]): void {
    writeJson(KEYS.monthlyReports, reports);
  },

  ensureSchemaVersion(): void {
    writeJson(KEYS.dataSchemaVersion, DATA_SCHEMA_VERSION);
  },

  resetAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  },
};
