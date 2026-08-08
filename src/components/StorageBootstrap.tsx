"use client";

import { useEffect } from "react";
import { clearUnreportedAttendance } from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";

/**
 * 앱이 켜질 때 딱 한 번 도는 데이터 정비 작업. 화면에는 아무것도 그리지 않는다.
 * (옛 형식 보정 + 저장 공간 유지 요청)
 *
 * One-time startup housekeeping for the local data store. All of it has to run
 * client-side (static export pre-renders with no localStorage), and none of it
 * renders anything.
 */
export function StorageBootstrap() {
  useEffect(() => {
    // Reports written under schema 1 seeded every session as present, which
    // contradicts the rule the edit screen states. Run once, before the stamp
    // below moves the device to 2 — doing it on every read would undo the
    // secretary's own ticks.
    if (storage.getSchemaVersion() < 2) {
      const reports = storage.getMonthlyReports();
      if (reports.length > 0) storage.setMonthlyReports(reports.map(clearUnreportedAttendance));
    }

    // Records which schema wrote this device's data.
    storage.ensureSchemaVersion();

    // Safari evicts localStorage for sites left unused for ~7 days. Asking for
    // persistence is the one lever a backend-less app has against losing a
    // member's whole year of records; a refusal is a normal outcome, not an error.
    void navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}
