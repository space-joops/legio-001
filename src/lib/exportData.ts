import { DATA_SCHEMA_VERSION } from "./constants";
import { DEFAULT_PROFILE, DEFAULT_ROSTER, storage } from "./storage";
import type { ExportedData, MemberRoster } from "./types";

export function buildExportedData(): ExportedData {
  return {
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    profile: storage.getProfile(),
    history: storage.getHistory(),
    currentReport: storage.getCurrentReport(),
    schedule: storage.getSchedule(),
    roster: storage.getRoster(),
    monthlyReports: storage.getMonthlyReports(),
    annualReports: storage.getAnnualReports(),
  };
}

/** Share sheet on phones, plain download elsewhere. Returns what happened so the
    caller can decide whether a toast is warranted. */
export async function shareOrDownloadFile(
  blob: Blob,
  filename: string
): Promise<"shared" | "downloaded" | "cancelled"> {
  if (typeof navigator !== "undefined" && "canShare" in navigator) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return "shared";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      }
    }
  }
  downloadBlob(blob, filename);
  return "downloaded";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadExportedData(): Promise<"shared" | "downloaded" | "cancelled"> {
  const data = buildExportedData();
  const name = data.profile.name || "unknown";
  const date = data.exportedAt.slice(0, 10);
  const filename = `legio-report-${name}-${date}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  if (typeof navigator !== "undefined" && "canShare" in navigator) {
    const file = new File([blob], filename, { type: "application/json" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        storage.setLastExportedAt(Date.now());
        return "shared";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      }
    }
  }

  downloadBlob(blob, filename);
  storage.setLastExportedAt(Date.now());
  return "downloaded";
}

/** What an import file turns out to contain, so the user can recognise a wrong
    file *before* it overwrites everything rather than after. */
export interface ImportSummary {
  exportedAt: string;
  memberName: string;
  historyCount: number;
  monthlyReportCount: number;
  rosterMemberCount: number;
}

export type ImportCheck =
  | { ok: true; data: ExportedData; summary: ImportSummary }
  | { ok: false; reason: "malformed" | "futureVersion" };

function countRosterMembers(roster: unknown): number {
  if (!roster || typeof roster !== "object") return 0;
  const memberRoster = (roster as { memberRoster?: Partial<MemberRoster> }).memberRoster;
  if (!memberRoster || typeof memberRoster !== "object") return 0;
  return Object.values(memberRoster).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );
}

/**
 * Import overwrites *everything*, including the secretary's roster and every
 * monthly report — so a member's export file silently wipes a secretary's work.
 * Validate the shape and hand back a summary the UI can show before committing.
 */
export function inspectImportFile(raw: unknown): ImportCheck {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const data = raw as Partial<ExportedData>;

  const version = data.dataSchemaVersion;
  if (typeof version !== "number") return { ok: false, reason: "malformed" };
  if (version > DATA_SCHEMA_VERSION) return { ok: false, reason: "futureVersion" };

  if (!data.profile || typeof data.profile !== "object") return { ok: false, reason: "malformed" };
  if (!Array.isArray(data.history)) return { ok: false, reason: "malformed" };

  return {
    ok: true,
    data: data as ExportedData,
    summary: {
      exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
      memberName: data.profile.name ?? "",
      historyCount: data.history.length,
      monthlyReportCount: Array.isArray(data.monthlyReports) ? data.monthlyReports.length : 0,
      rosterMemberCount: countRosterMembers(data.roster),
    },
  };
}

export function importExportedData(data: Partial<ExportedData>): void {
  storage.setProfile({ ...DEFAULT_PROFILE, ...data.profile });
  storage.setHistory(data.history ?? []);
  storage.setCurrentReport(data.currentReport ?? null);
  storage.setSchedule(data.schedule ?? []);
  storage.setRoster({ ...DEFAULT_ROSTER, ...data.roster });
  storage.setMonthlyReports(data.monthlyReports ?? []);
  storage.setAnnualReports(data.annualReports ?? []);
  storage.ensureSchemaVersion();
}

export function resetAllData(): void {
  storage.resetAll();
}
