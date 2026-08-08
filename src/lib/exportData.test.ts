import assert from "node:assert";
import test from "node:test";

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

import { DATA_SCHEMA_VERSION, SCOPED_EXPORT_VERSION } from "./constants.ts";
import {
  applyMonthImport,
  applyPersonalImport,
  applySecretaryImport,
  buildExportedData,
  buildPersonalExport,
  buildSecretaryExport,
  buildSecretaryMonthExport,
  inspectImportFile,
} from "./exportData.ts";
import { storage } from "./storage.ts";
import type { MonthlyReport, WeeklyReport } from "./types.ts";

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

test("내보내기 파일 버전 불변식 (구버전 앱 호환)", async (t) => {
  backing.clear();

  await t.test("전체 백업은 스키마 버전 2를 유지한다", () => {
    const full = buildExportedData();
    assert.strictEqual(full.dataSchemaVersion, DATA_SCHEMA_VERSION);
    assert.strictEqual(full.exportScope, "all");
  });

  await t.test("범위 파일은 모두 버전 3을 달고 나간다", () => {
    assert.strictEqual(buildPersonalExport().dataSchemaVersion, SCOPED_EXPORT_VERSION);
    assert.strictEqual(buildSecretaryExport().dataSchemaVersion, SCOPED_EXPORT_VERSION);
    assert.strictEqual(
      buildSecretaryMonthExport(monthlyReport("m", "2026-07")).dataSchemaVersion,
      SCOPED_EXPORT_VERSION
    );
    assert.ok(SCOPED_EXPORT_VERSION > DATA_SCHEMA_VERSION);
  });

  await t.test("구버전 앱의 검증 로직은 범위 파일을 전부 거부한다", () => {
    // The acceptance test scoped-exports-era apps ran (version <= 2, profile
    // object, history array) — if a scoped file ever passes it, that app
    // would wholesale-overwrite and wipe the slices the file omits.
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
    assert.strictEqual(oldAppAccepts(buildExportedData()), true);
    assert.strictEqual(oldAppAccepts(buildPersonalExport()), false);
    assert.strictEqual(oldAppAccepts(buildSecretaryExport()), false);
    assert.strictEqual(
      oldAppAccepts(buildSecretaryMonthExport(monthlyReport("m", "2026-07"))),
      false
    );
  });
});

test("inspectImportFile 범위별 검증", async (t) => {
  backing.clear();

  await t.test("범위 표시가 없는 예전 파일은 전체(all)로 통한다", () => {
    const check = inspectImportFile({
      dataSchemaVersion: 2,
      profile: { name: "김단원" },
      history: [weeklyReport("w1")],
      monthlyReports: [monthlyReport("m", "2026-07")],
    });
    assert.ok(check.ok);
    assert.strictEqual(check.summary.scope, "all");
    assert.strictEqual(check.summary.memberName, "김단원");
    assert.strictEqual(check.summary.historyCount, 1);
    assert.strictEqual(check.summary.monthlyReportCount, 1);
  });

  await t.test("더 새로운 버전·모르는 범위는 앱 업데이트 안내로 이어진다", () => {
    const tooNew = inspectImportFile({ dataSchemaVersion: SCOPED_EXPORT_VERSION + 1 });
    assert.ok(!tooNew.ok && tooNew.reason === "futureVersion");
    const unknownScope = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "everything-v9",
    });
    assert.ok(!unknownScope.ok && unknownScope.reason === "futureVersion");
  });

  await t.test("깨진 파일은 malformed로 거부된다", () => {
    assert.ok(!inspectImportFile(null).ok);
    assert.ok(!inspectImportFile("text").ok);
    assert.ok(!inspectImportFile({}).ok);
    const noHistory = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "personal",
      profile: { name: "김" },
    });
    assert.ok(!noHistory.ok && noHistory.reason === "malformed");
    const noRoster = inspectImportFile({
      dataSchemaVersion: SCOPED_EXPORT_VERSION,
      exportScope: "secretary",
      monthlyReports: [],
    });
    assert.ok(!noRoster.ok && noRoster.reason === "malformed");
  });

  await t.test("월 파일은 보고서 1건과 올바른 연월을 요구한다", () => {
    const good = inspectImportFile(buildSecretaryMonthExport(monthlyReport("m", "2026-07")));
    assert.ok(good.ok);
    assert.strictEqual(good.summary.scope, "secretaryMonth");
    assert.strictEqual(good.summary.yearMonth, "2026-07");

    const two = buildSecretaryMonthExport(monthlyReport("a", "2026-07"));
    two.monthlyReports.push(monthlyReport("b", "2026-08"));
    assert.ok(!inspectImportFile(two).ok);

    const bad = buildSecretaryMonthExport(monthlyReport("m", "2026년 7월"));
    assert.ok(!inspectImportFile(bad).ok);
  });

  await t.test("월 파일 요약은 같은 달 존재·이후 달 존재를 알려 준다", () => {
    seedBothSides();
    const july = inspectImportFile(buildSecretaryMonthExport(monthlyReport("x", "2026-07")));
    assert.ok(july.ok);
    assert.strictEqual(july.summary.monthAlreadyExists, true);
    assert.strictEqual(july.summary.hasNewerMonthLocally, false);

    const may = inspectImportFile(buildSecretaryMonthExport(monthlyReport("x", "2026-05")));
    assert.ok(may.ok);
    assert.strictEqual(may.summary.monthAlreadyExists, false);
    assert.strictEqual(may.summary.hasNewerMonthLocally, true);
  });
});

test("범위별 가져오기가 반대편 데이터를 보존한다", async (t) => {
  await t.test("서기 가져오기는 활동 기록을 건드리지 않는다", () => {
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
    assert.strictEqual(storage.getHistory().length, 2);
    assert.strictEqual(storage.getProfile().name, "김단원");
    assert.strictEqual(storage.getRoster().praesidiumName, "바다의 별");
    assert.deepStrictEqual(
      storage.getMonthlyReports().map((r) => r.id),
      ["pc7"]
    );
  });

  await t.test("활동 기록 가져오기는 서기 데이터를 건드리지 않는다", () => {
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
    assert.strictEqual(storage.getProfile().name, "이단원");
    assert.deepStrictEqual(
      storage.getHistory().map((r) => r.id),
      ["phone1"]
    );
    assert.strictEqual(storage.getRoster().praesidiumName, "평화의 모후");
    assert.strictEqual(storage.getMonthlyReports().length, 2);
  });

  await t.test("월 가져오기: 새 달은 추가되고 정렬된다", () => {
    seedBothSides();
    applyMonthImport(buildSecretaryMonthExport(monthlyReport("m8", "2026-08")));
    assert.deepStrictEqual(
      storage.getMonthlyReports().map((r) => r.yearMonth),
      ["2026-08", "2026-07", "2026-06"]
    );
  });

  await t.test("월 가져오기: 같은 달은 교체되고 개수는 그대로다", () => {
    seedBothSides();
    applyMonthImport(buildSecretaryMonthExport(monthlyReport("pc7", "2026-07")));
    const reports = storage.getMonthlyReports();
    assert.strictEqual(reports.length, 2);
    assert.strictEqual(reports.find((r) => r.yearMonth === "2026-07")?.id, "pc7");
    assert.strictEqual(reports.find((r) => r.yearMonth === "2026-06")?.id, "m6");
  });
});
