import { DATA_SCHEMA_VERSION, SCOPED_EXPORT_VERSION } from "./constants";
import { sortMonthlyReports } from "./monthlyReportUtils";
import { DEFAULT_PROFILE, DEFAULT_ROSTER, storage } from "./storage";
import type {
  AnyExportFile,
  ExportScope,
  ExportedData,
  MemberRoster,
  MonthlyReport,
  PersonalExportFile,
  SecretaryExportFile,
  SecretaryMonthExportFile,
} from "./types";

/**
 * 설정 화면의 "데이터 내보내기 / 가져오기 / 초기화"를 담당한다.
 *
 * 이 앱은 데이터를 기기 안에만 두기 때문에, 휴대폰을 바꾸거나 앱을 지우면
 * 기록이 사라진다. 그걸 막는 유일한 수단이 이 JSON 파일이다. 그래서
 *   - 내보내기는 공유 시트를 먼저 시도하고 안 되면 다운로드로 떨어지고,
 *   - 가져오기는 파일을 먼저 검사해 무엇이 들어 있는지 보여 준 뒤 확인을 받는다.
 * (단원용 파일을 잘못 넣어 서기의 명단이 통째로 지워지는 사고가 있었다.)
 */
export function buildExportedData(): ExportedData {
  return {
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    exportScope: "all",
    profile: storage.getProfile(),
    history: storage.getHistory(),
    currentReport: storage.getCurrentReport(),
    schedule: storage.getSchedule(),
    roster: storage.getRoster(),
    monthlyReports: storage.getMonthlyReports(),
  };
}

export function buildPersonalExport(): PersonalExportFile {
  return {
    exportScope: "personal",
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: SCOPED_EXPORT_VERSION,
    profile: storage.getProfile(),
    history: storage.getHistory(),
    currentReport: storage.getCurrentReport(),
    schedule: storage.getSchedule(),
  };
}

export function buildSecretaryExport(): SecretaryExportFile {
  return {
    exportScope: "secretary",
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: SCOPED_EXPORT_VERSION,
    roster: storage.getRoster(),
    monthlyReports: storage.getMonthlyReports(),
    activityItems: storage.getActivityItems(),
    expenseItems: storage.getExpenseItems(),
  };
}

export function buildSecretaryMonthExport(report: MonthlyReport): SecretaryMonthExportFile {
  return {
    exportScope: "secretaryMonth",
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: SCOPED_EXPORT_VERSION,
    monthlyReports: [report],
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

async function shareOrDownloadJson(
  data: unknown,
  filename: string
): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  return shareOrDownloadFile(blob, filename);
}

export async function shareOrDownloadExportedData(): Promise<"shared" | "downloaded" | "cancelled"> {
  const data = buildExportedData();
  const name = data.profile.name || "unknown";
  const date = data.exportedAt.slice(0, 10);
  const outcome = await shareOrDownloadJson(data, `legio-report-${name}-${date}.json`);
  if (outcome !== "cancelled") storage.setLastExportedAt(Date.now());
  return outcome;
}

export async function shareOrDownloadPersonalExport(): Promise<"shared" | "downloaded" | "cancelled"> {
  const data = buildPersonalExport();
  const name = data.profile.name || "unknown";
  const date = data.exportedAt.slice(0, 10);
  const outcome = await shareOrDownloadJson(data, `legio-personal-${name}-${date}.json`);
  // The backup-overdue nag watches the weekly history, which this file covers.
  if (outcome !== "cancelled") storage.setLastExportedAt(Date.now());
  return outcome;
}

export async function shareOrDownloadSecretaryExport(): Promise<"shared" | "downloaded" | "cancelled"> {
  const data = buildSecretaryExport();
  const date = data.exportedAt.slice(0, 10);
  return shareOrDownloadJson(data, `legio-secretary-${date}.json`);
}

export async function shareOrDownloadMonthExport(
  report: MonthlyReport,
  fallbackName: string
): Promise<"shared" | "downloaded" | "cancelled"> {
  const name = report.roster.praesidiumName || fallbackName;
  return shareOrDownloadJson(buildSecretaryMonthExport(report), `${name}_${report.yearMonth}.json`);
}

/** What an import file turns out to contain, so the user can recognise a wrong
    file *before* it overwrites anything rather than after. */
export interface ImportSummary {
  scope: ExportScope;
  exportedAt: string;
  memberName: string;
  historyCount: number;
  monthlyReportCount: number;
  rosterMemberCount: number;
  /** secretaryMonth files only — "" otherwise. */
  yearMonth: string;
  /** secretaryMonth files only — from the report's embedded roster snapshot. */
  praesidiumName: string;
  /** secretaryMonth: this device already has a report for that month. */
  monthAlreadyExists: boolean;
  /** secretaryMonth: a later month exists here, whose 이월금 will not be recomputed. */
  hasNewerMonthLocally: boolean;
}

export type ImportCheck =
  | { ok: true; data: AnyExportFile; summary: ImportSummary }
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
 * Validate the shape and hand back a summary the UI can show before committing.
 * Which slices an import may touch is decided by the file's exportScope; files
 * from before scoped exports have none and keep their original overwrite-all
 * meaning.
 */
export function inspectImportFile(raw: unknown): ImportCheck {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const record = raw as Record<string, unknown>;

  const version = record.dataSchemaVersion;
  if (typeof version !== "number") return { ok: false, reason: "malformed" };
  if (version > SCOPED_EXPORT_VERSION) return { ok: false, reason: "futureVersion" };

  // An unrecognised scope marker means a newer app wrote the file, so "update
  // the app" is the accurate advice even if that app forgot to bump the version.
  const scope = record.exportScope === undefined ? "all" : record.exportScope;
  if (
    scope !== "all" &&
    scope !== "personal" &&
    scope !== "secretary" &&
    scope !== "secretaryMonth"
  ) {
    return { ok: false, reason: "futureVersion" };
  }

  const summary: ImportSummary = {
    scope,
    exportedAt: typeof record.exportedAt === "string" ? record.exportedAt : "",
    memberName: "",
    historyCount: 0,
    monthlyReportCount: 0,
    rosterMemberCount: 0,
    yearMonth: "",
    praesidiumName: "",
    monthAlreadyExists: false,
    hasNewerMonthLocally: false,
  };

  if (scope === "all" || scope === "personal") {
    if (!record.profile || typeof record.profile !== "object") {
      return { ok: false, reason: "malformed" };
    }
    if (!Array.isArray(record.history)) return { ok: false, reason: "malformed" };
    const name = (record.profile as { name?: unknown }).name;
    summary.memberName = typeof name === "string" ? name : "";
    summary.historyCount = record.history.length;
  }

  if (scope === "all") {
    summary.monthlyReportCount = Array.isArray(record.monthlyReports)
      ? record.monthlyReports.length
      : 0;
    summary.rosterMemberCount = countRosterMembers(record.roster);
  }

  if (scope === "secretary") {
    if (!record.roster || typeof record.roster !== "object") {
      return { ok: false, reason: "malformed" };
    }
    if (!Array.isArray(record.monthlyReports)) return { ok: false, reason: "malformed" };
    summary.monthlyReportCount = record.monthlyReports.length;
    summary.rosterMemberCount = countRosterMembers(record.roster);
  }

  if (scope === "secretaryMonth") {
    if (!Array.isArray(record.monthlyReports) || record.monthlyReports.length !== 1) {
      return { ok: false, reason: "malformed" };
    }
    const incoming = record.monthlyReports[0] as Partial<MonthlyReport> | null;
    const yearMonth = incoming && typeof incoming === "object" ? incoming.yearMonth : undefined;
    if (typeof yearMonth !== "string" || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return { ok: false, reason: "malformed" };
    }
    summary.yearMonth = yearMonth;
    summary.monthlyReportCount = 1;
    summary.praesidiumName =
      typeof incoming?.roster?.praesidiumName === "string" ? incoming.roster.praesidiumName : "";
    // Reads this device's storage so the dialog can say "adds a new month"
    // vs "replaces the existing one" and warn about later months' 이월금.
    const local = storage.getMonthlyReports();
    summary.monthAlreadyExists = local.some((r) => r.yearMonth === yearMonth);
    summary.hasNewerMonthLocally = local.some((r) => r.yearMonth > yearMonth);
  }

  return { ok: true, data: raw as AnyExportFile, summary };
}

/** Legacy and "all" files: replace every slice, exactly as before scoped exports. */
export function importExportedData(data: Partial<ExportedData>): void {
  storage.setProfile({ ...DEFAULT_PROFILE, ...data.profile });
  storage.setHistory(data.history ?? []);
  storage.setCurrentReport(data.currentReport ?? null);
  storage.setSchedule(data.schedule ?? []);
  storage.setRoster({ ...DEFAULT_ROSTER, ...data.roster });
  storage.setMonthlyReports(data.monthlyReports ?? []);
  storage.ensureSchemaVersion();
}

export function applyPersonalImport(data: PersonalExportFile): void {
  storage.setProfile({ ...DEFAULT_PROFILE, ...data.profile });
  storage.setHistory(data.history ?? []);
  storage.setCurrentReport(data.currentReport ?? null);
  storage.setSchedule(data.schedule ?? []);
  storage.ensureSchemaVersion();
}

export function applySecretaryImport(data: SecretaryExportFile): void {
  storage.setRoster({ ...DEFAULT_ROSTER, ...data.roster });
  storage.setMonthlyReports(sortMonthlyReports(data.monthlyReports ?? []));
  // The catalogues may be absent from hand-edited or future files; a missing
  // one must leave the local catalogue alone rather than reset it.
  if (Array.isArray(data.activityItems)) storage.setActivityItems(data.activityItems);
  if (Array.isArray(data.expenseItems)) storage.setExpenseItems(data.expenseItems);
  storage.ensureSchemaVersion();
}

export function applyMonthImport(data: SecretaryMonthExportFile): void {
  const incoming = data.monthlyReports[0];
  if (!incoming) return;
  // Filter on both keys so neither uniqueness invariant can break: yearMonth is
  // the real identity (one report per month), id covers a same-origin file
  // re-imported after that month was deleted and recreated locally.
  const rest = storage
    .getMonthlyReports()
    .filter((r) => r.yearMonth !== incoming.yearMonth && r.id !== incoming.id);
  storage.setMonthlyReports(sortMonthlyReports([...rest, incoming]));
  storage.ensureSchemaVersion();
}

/** Dispatch an inspected file to the apply function its scope calls for. */
export function applyImportedFile(data: AnyExportFile): void {
  switch (data.exportScope) {
    case "personal":
      applyPersonalImport(data);
      return;
    case "secretary":
      applySecretaryImport(data);
      return;
    case "secretaryMonth":
      applyMonthImport(data);
      return;
    default:
      // "all", or a legacy file with no scope marker.
      importExportedData(data);
  }
}

export function resetAllData(): void {
  storage.resetAll();
}
