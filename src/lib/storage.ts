import { DATA_SCHEMA_VERSION } from "./constants";
import type { Language, Profile, Settings, WeeklyReport } from "./types";

const KEYS = {
  profile: "legioMariae.profile",
  settings: "legioMariae.settings",
  currentReport: "legioMariae.currentReport",
  history: "legioMariae.history",
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

export const DEFAULT_PROFILE: Profile = { name: "" };
export const DEFAULT_SETTINGS: Settings = { language: "ko" };

export const storage = {
  getProfile(): Profile {
    return readJson(KEYS.profile, DEFAULT_PROFILE);
  },
  setProfile(profile: Profile): void {
    writeJson(KEYS.profile, profile);
  },

  getSettings(): Settings {
    return readJson(KEYS.settings, DEFAULT_SETTINGS);
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

  ensureSchemaVersion(): void {
    writeJson(KEYS.dataSchemaVersion, DATA_SCHEMA_VERSION);
  },

  resetAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  },
};
