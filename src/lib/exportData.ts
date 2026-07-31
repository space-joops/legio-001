import { DATA_SCHEMA_VERSION } from "./constants";
import { DEFAULT_PROFILE, DEFAULT_ROSTER, storage } from "./storage";
import type { ExportedData } from "./types";

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
  };
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
        return "shared";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      }
    }
  }

  downloadBlob(blob, filename);
  return "downloaded";
}

export function importExportedData(data: Partial<ExportedData>): void {
  storage.setProfile({ ...DEFAULT_PROFILE, ...data.profile });
  storage.setHistory(data.history ?? []);
  storage.setCurrentReport(data.currentReport ?? null);
  storage.setSchedule(data.schedule ?? []);
  storage.setRoster({ ...DEFAULT_ROSTER, ...data.roster });
  storage.setMonthlyReports(data.monthlyReports ?? []);
  storage.ensureSchemaVersion();
}

export function resetAllData(): void {
  storage.resetAll();
}
