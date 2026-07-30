import { DATA_SCHEMA_VERSION } from "./constants";
import { storage } from "./storage";
import type { ExportedData } from "./types";

export function buildExportedData(): ExportedData {
  return {
    exportedAt: new Date().toISOString(),
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    profile: storage.getProfile(),
    history: storage.getHistory(),
    currentReport: storage.getCurrentReport(),
    schedule: storage.getSchedule(),
  };
}

export function downloadExportedData(): void {
  const data = buildExportedData();
  const name = data.profile.name || "unknown";
  const date = data.exportedAt.slice(0, 10);
  const filename = `legio-report-${name}-${date}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function resetAllData(): void {
  storage.resetAll();
}
