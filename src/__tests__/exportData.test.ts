import { describe, it, expect, beforeEach } from "vitest";

// storage guards every read/write behind `typeof window`, so give it a
// browser-alike before any storage-backed function runs. Static imports are
// evaluated first, but none of these modules touch window at load time.
const backing = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => {
      backing.set(key, value);
    },
    removeItem: (key: string) => {
      backing.delete(key);
    },
  },
};

import { DATA_SCHEMA_VERSION, SCOPED_EXPORT_VERSION } from "../lib/constants";
import {
  applyMonthImport,
  applyPersonalImport,
  applySecretaryImport,
  buildExportedData,
  buildPersonalExport,
  buildSecretaryExport,
  buildSecretaryMonthExport,
  inspectImportFile,
} from "../lib/exportData";
import { storage } from "../lib/storage";
import type { MonthlyReport, WeeklyReport } from "../lib/types";

const weeklyReport = (id: string): WeeklyReport => ({
  id,
  schemaVersion: 1,
  sessionNumber: 1,
  meetingDateTime: "2026-07-01T19:00",
  memberName: "김단원",
  counts: { weekdayMass: 1, priestPrayer: 2, chainPrayer: 3, rosaryDecades: 5, aspirations: 0 },
  status: "submitted",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
});

// Only identity matters here: getMonthlyReports() backfills every other field
// through normalizeMonthlyReport, the same path real imports go through.
const monthlyReport = (id: string, yearMonth: string): MonthlyReport =>
  ({ id, yearMonth }) as MonthlyReport;

const seedBothSides = () => {
  backing.clear();
  storage.setProfile({ name: "김단원", baptismalName: "요한", praesidiumName: "", parishName: "" });
  storage.setHistory([weeklyReport("w1"), weeklyReport("w2")]);
  storage.setRoster({ ...storage.getRoster(), praesidiumName: "평화의 모후" });
  storage.setMonthlyReports([monthlyReport("m6", "2026-06"), monthlyReport("m7", "2026-07")]);
};

describe("내보내기 파일 버전 불변식 (구버전 앱 호환)", () => {
  beforeEach(() => {
    backing.clear();
  });

  it("전체 백업은 스키마 버전 2를 유지한다", () => {
    const full = buildExportedData();
    expect(full.dataSchemaVersion).toBe(DATA_SCHEMA_VERSION);
    expect(full.exportScope).toBe("all");
  });

  it("범위 파일은 모두 버전 3을 달고 나간다", () => {
    expect(buildPersonalExport().dataSchemaVersion).toBe(SCOPED_EXPORT_VERSION);
    expect(buildSecretaryExport().dataSchemaVersion).toBe(SCOPED_EXPORT_VERSION);
    expect(
      buildSecretaryMonthExport(monthlyReport("m", "2026-07")).dataSchemaVersion
    ).toBe(SCOPED_EXPORT_VERSION);
    expect(SCOPED_EXPORT_VERSION).toBeGreaterThan(DATA_SCHEMA_VERSION);
  });

  it("구버전 앱의 검증 로직은 범위 파일을 전부 거부한다", () => {
    const oldAppAccepts = (raw: unknown): boolean => {
      const data = raw as {
        dataSchemaVersion?: unknown;
        profile?: unknown;
        history?: unknown;
      };
      return (
        typeof data.dataSchemaVersion === "number" &&
        data.dataSchemaVersion <= DATA_SCHEMA_VERSION &&
        !!data.profile &&
        typeof data.profile === "object" &&
        Array.isArray(data.history)
      );
    };
    expect(oldAppAccepts(buildExportedData())).toBe(true);
    expect(oldAppAccepts(buildPersonalExport())).toBe(false);
    expect(oldAppAccepts(buildSecretaryExport())).toBe(false);
    expect(
      oldAppAccepts(buildSecretaryMonthExport(monthlyReport("m", "2026-07")))
    ).toBe(false);
  });
});

describe("inspectImportFile 범위별 검증", () => {
  beforeEach(() => {
    backing.clear();
  });

  it("범위 표시가 없는 예전 파일은 전체(all)로 통한다", () => {
    const check = inspectImportFile({
      dataSchemaVersion: 2,
      profile: { name: "김단원" },
      history: [weeklyReport("w1")],
      monthlyReports: [monthlyReport("m", "2026-07")],
    });
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.summary.scope).toBe("all");
      expect(check.summary.memberName).toBe("김단원");
      expect(check.summary.historyCount).toBe(1);
      expect(check.summary.monthlyReportCount).toBe(1);
    }
  });

  it("더 새로운 버전·모르는 범위는 앱 업데이트 안내로 이어진다", () => {
    const tooNew = inspectImportFile({ dataSchemaVersion: SCOPED_EXPORT_VERSION + 1 });
    expect(tooNew.ok).toBe(false);
    if (!tooNew.ok) expect(tooNew.reason).toBe("futureVersion");

    const unknownScope = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "everything-v9",
    });
    expect(unknownScope.ok).toBe(false);
    if (!unknownScope.ok) expect(unknownScope.reason).toBe("futureVersion");
  });

  it("깨진 파일은 malformed로 거부된다", () => {
    expect(inspectImportFile(null).ok).toBe(false);
    expect(inspectImportFile("text").ok).toBe(false);
    expect(inspectImportFile({}).ok).toBe(false);

    const noHistory = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "personal",
      profile: { name: "김" },
    });
    expect(noHistory.ok).toBe(false);
    if (!noHistory.ok) expect(noHistory.reason).toBe("malformed");

    const noRoster = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "secretary",
      monthlyReports: [],
    });
    expect(noRoster.ok).toBe(false);
    if (!noRoster.ok) expect(noRoster.reason).toBe("malformed");
  });

  it("월 파일은 보고서 1건과 올바른 연월을 요구한다", () => {
    const good = inspectImportFile(buildSecretaryMonthExport(monthlyReport("m", "2026-07")));
    expect(good.ok).toBe(true);
    if (good.ok && good.summary.scope === "secretaryMonth") {
      expect(good.summary.yearMonth).toBe("2026-07");
    }

    const two = buildSecretaryMonthExport(monthlyReport("a", "2026-07"));
    two.monthlyReports.push(monthlyReport("b", "2026-08"));
    expect(inspectImportFile(two).ok).toBe(false);

    const bad = buildSecretaryMonthExport(monthlyReport("m", "2026년 7월"));
    expect(inspectImportFile(bad).ok).toBe(false);
  });

  it("월 파일 요약은 같은 달 존재·이후 달 존재를 알려 준다", () => {
    seedBothSides();
    const july = inspectImportFile(buildSecretaryMonthExport(monthlyReport("x", "2026-07")));
    expect(july.ok).toBe(true);
    if (july.ok && july.summary.scope === "secretaryMonth") {
      expect(july.summary.monthAlreadyExists).toBe(true);
      expect(july.summary.hasNewerMonthLocally).toBe(false);
    }

    const may = inspectImportFile(buildSecretaryMonthExport(monthlyReport("x", "2026-05")));
    expect(may.ok).toBe(true);
    if (may.ok && may.summary.scope === "secretaryMonth") {
      expect(may.summary.monthAlreadyExists).toBe(false);
      expect(may.summary.hasNewerMonthLocally).toBe(true);
    }
  });
});

describe("범위별 가져오기가 반대편 데이터를 보존한다", () => {
  it("서기 가져오기는 활동 기록을 건드리지 않는다", () => {
    seedBothSides();
    applySecretaryImport({
      exportScope: "secretary",
      exportedAt: "2026-08-01T00:00:00Z",
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      roster: { ...storage.getRoster(), praesidiumName: "바다의 별" },
      monthlyReports: [monthlyReport("pc7", "2026-07")],
      activityItems: [],
      expenseItems: [],
    });
    expect(storage.getHistory().length).toBe(2);
    expect(storage.getProfile().name).toBe("김단원");
    expect(storage.getRoster().praesidiumName).toBe("바다의 별");
    expect(storage.getMonthlyReports().map((r) => r.id)).toEqual(["pc7"]);
  });

  it("활동 기록 가져오기는 서기 데이터를 건드리지 않는다", () => {
    seedBothSides();
    applyPersonalImport({
      exportScope: "personal",
      exportedAt: "2026-08-01T00:00:00Z",
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      profile: { name: "이단원", baptismalName: "", praesidiumName: "", parishName: "" },
      history: [weeklyReport("phone1")],
      currentReport: null,
      schedule: [],
    });
    expect(storage.getProfile().name).toBe("이단원");
    expect(storage.getHistory().map((r) => r.id)).toEqual(["phone1"]);
    expect(storage.getRoster().praesidiumName).toBe("평화의 모후");
    expect(storage.getMonthlyReports().length).toBe(2);
  });

  it("월 가져오기: 새 달은 추가되고 정렬된다", () => {
    seedBothSides();
    applyMonthImport(buildSecretaryMonthExport(monthlyReport("m8", "2026-08")));
    expect(storage.getMonthlyReports().map((r) => r.yearMonth)).toEqual([
      "2026-08",
      "2026-07",
      "2026-06",
    ]);
  });

  it("월 가져오기: 같은 달은 교체되고 개수는 그대로다", () => {
    seedBothSides();
    applyMonthImport(buildSecretaryMonthExport(monthlyReport("pc7", "2026-07")));
    const reports = storage.getMonthlyReports();
    expect(reports.length).toBe(2);
    expect(reports.find((r) => r.yearMonth === "2026-07")?.id).toBe("pc7");
    expect(reports.find((r) => r.yearMonth === "2026-06")?.id).toBe("m6");
  });
});
