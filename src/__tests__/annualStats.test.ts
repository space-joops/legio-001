import { describe, it, expect } from "vitest";
import { createDefaultActivityItems } from "../lib/activityItems";
import {
  collectOtherActivityLabels,
  formatOtherActivitiesLine,
  tallyOtherActivities,
} from "../lib/activityReport";
import { annualStatsToCsv, availableYears, buildAnnualStats } from "../lib/annualStats";
import { createMonthlyReport } from "../lib/monthlyReportUtils";
import { PR_OTHER_KEY } from "../lib/reportForm2026";
import { convertReportTo2026 } from "../lib/reportFormMigration";
import { DEFAULT_ROSTER } from "../lib/storage";
import type { ActivityEntry, MonthlyReport } from "../lib/types";

const items = createDefaultActivityItems();

function entry(id: string, itemKey: string, count: number, customLabel?: string): ActivityEntry {
  return { id, personId: "p1", sessionNumber: 1, itemKey, count, note: "", ...(customLabel !== undefined ? { customLabel } : {}) };
}

function report(yearMonth: string, patch: Partial<MonthlyReport> = {}): MonthlyReport {
  return {
    ...createMonthlyReport(yearMonth, DEFAULT_ROSTER, null, []),
    sessionRangeStart: 1,
    sessionRangeEnd: 4,
    ...patch,
  };
}

describe("기타 활동", () => {
  it("이름별로 합산하고 NFC·공백을 맞춘다", () => {
    const r = report("2026-03", {
      activityEntries: [
        entry("1", PR_OTHER_KEY, 2, "바자회 봉사"),
        entry("2", PR_OTHER_KEY, 1, " 바자회  봉사 "),
        entry("3", PR_OTHER_KEY, 1, "성지순례 안내".normalize("NFD")),
        entry("4", PR_OTHER_KEY, 1),
      ],
    });
    expect(tallyOtherActivities(r)).toEqual([
      { label: "바자회 봉사", count: 3 },
      { label: "성지순례 안내", count: 1 },
      { label: "기타(이름 없음)", count: 1 },
    ]);
    expect(formatOtherActivitiesLine(tallyOtherActivities(r))).toBe(
      "기타 활동: 바자회 봉사(3), 성지순례 안내(1), 기타(이름 없음)(1)"
    );
    expect(collectOtherActivityLabels([r])).toEqual(["바자회 봉사", "성지순례 안내"]);
  });

  it("변환 때 기타 칸으로 보낸 이전 항목은 이름을 기타 활동 이름으로 남긴다", () => {
    const base = report("2025-11", { activityEntries: [entry("1", "custom1", 2)] });
    delete base.formVersion;
    const converted = convertReportTo2026(base, { custom1: PR_OTHER_KEY }, { custom1: "성지순례 안내" });
    expect(converted.activityEntries[0]).toMatchObject({ itemKey: PR_OTHER_KEY, customLabel: "성지순례 안내" });
  });
});

describe("buildAnnualStats", () => {
  const jan = report("2026-01", {
    prayerCounts: { weekdayMass: 10, priestPrayer: 1, chainPrayer: 2, rosaryDecades: 30, aspirations: 4 },
    sundayMassTotal: 20,
    senatusCounts: { ...report("2026-01").senatusCounts, rosaryBillion: 5, wydAttend: 1 },
    activityEntries: [
      entry("1", "f26.pr.coffin.a", 2),
      entry("2", PR_OTHER_KEY, 1, "바자회 봉사"),
    ],
    evangelization: {
      baptism: { result: 1, target: 5 },
      returnToFaith: { result: 0, target: 3 },
      activeMember: { result: 0, target: 0 },
      praetorium: { result: 0, target: 0 },
    },
    treasury: { broughtForward: 100000, income: 0, expense: 0, balance: 100000, expenseBreakdown: "" },
    treasuryLedger: [
      { sessionNumber: 1, offering: 30000, expenses: [{ id: "x", label: "의연금", amount: 10000 }] },
    ],
  });
  const feb = report("2026-02", {
    prayerCounts: { weekdayMass: 5, priestPrayer: 1, chainPrayer: 0, rosaryDecades: 20, aspirations: 0 },
    sundayMassTotal: 16,
    activityEntries: [
      entry("3", "f26.pr.coffin.b", 1),
      entry("4", PR_OTHER_KEY, 2, "바자회 봉사"),
      entry("5", "prayerForDead", 3),
    ],
    evangelization: {
      baptism: { result: 2, target: 5 },
      returnToFaith: { result: 1, target: 3 },
      activeMember: { result: 0, target: 0 },
      praetorium: { result: 0, target: 0 },
    },
  });
  const otherYear = report("2025-12", { prayerCounts: { ...jan.prayerCounts, rosaryDecades: 999 } });
  const stats = buildAnnualStats([feb, otherYear, jan], items, 2026);

  it("그해 보고서만 오래된 달부터 모은다", () => {
    expect(availableYears([feb, otherYear, jan])).toEqual([2026, 2025]);
    expect(stats.months.map((m) => m.yearMonth)).toEqual(["2026-01", "2026-02"]);
  });

  it("기도·미사영성체·세나뚜스를 합산한다", () => {
    expect(stats.prayer.rosaryDecades).toBe(50);
    expect(stats.massCommunion).toBe(10 + 20 + 5 + 16);
    expect(stats.weekdayMass).toBe(15);
    expect(stats.senatus[0].values).toEqual([5]);
    expect(stats.senatus[3].values).toEqual([1, 0]);
  });

  it("Pr. 짝 칸·기타 활동·이전 항목을 따로 합산한다", () => {
    const coffin = stats.pr[2].cells.find((c) => c.cell.label === "입관/출관");
    expect(coffin?.values).toEqual([2, 1]);
    expect(stats.pr.find((c) => c.label === "본당협조/소공동체활성화")?.total).toBe(3);
    expect(stats.others).toEqual([{ label: "바자회 봉사", count: 3, byMonth: { "2026-01": 1, "2026-02": 2 } }]);
    expect(stats.legacy).toEqual([{ label: "연도", count: 3 }]);
  });

  it("회계는 첫 달 이월금, 선교는 마지막 달 누계", () => {
    expect(stats.treasury.opening).toBe(100000);
    expect(stats.treasury.income).toBe(30000);
    expect(stats.treasury.notable.donation).toBe(10000);
    expect(stats.evangelization?.baptism).toEqual({ result: 2, target: 5 });
    expect(stats.evangelizationMonth).toBe("2026-02");
  });

  it("CSV 는 BOM 으로 시작하고 기타 활동 이름을 담는다", () => {
    const csv = annualStatsToCsv(stats);
    expect(csv.startsWith("﻿구분,항목,값")).toBe(true);
    expect(csv).toContain("기타 활동,바자회 봉사,3");
    expect(csv).toContain("Pr. 어려움겪는분돌봄,입관/출관,2/1");
  });
});
