import { describe, it, expect } from "vitest";
import { createActivityItem, createDefaultActivityItems } from "../lib/activityItems";
import { createMonthlyReport } from "../lib/monthlyReportUtils";
import { createForm2026ActivityItems } from "../lib/reportForm2026";
import {
  EXCLUDE,
  SUGGESTED_MAPPING,
  carriedOverNotes,
  convertReportTo2026,
  initialMapping,
  isMappingComplete,
  listLegacyActivityUsage,
} from "../lib/reportFormMigration";
import { DEFAULT_ROSTER } from "../lib/storage";
import type { ActivityEntry, MonthlyReport } from "../lib/types";

function entry(id: string, itemKey: string, count: number): ActivityEntry {
  return { id, personId: "p1", sessionNumber: 1, itemKey, count, note: "메모" };
}

const custom = createActivityItem("성지순례 안내", "praesidium", 99);
const items = [...createDefaultActivityItems(), custom];
const validTargets = new Set(createForm2026ActivityItems().map((i) => i.key));

/** formVersion 이 없는 이전 양식 보고서. */
function legacyReport(): MonthlyReport {
  const base = createMonthlyReport("2025-12", DEFAULT_ROSTER, null, []);
  const { formVersion: _ignored, ...rest } = base;
  void _ignored;
  return {
    ...rest,
    activityEntries: [
      entry("e1", "prayerForDead", 3),
      entry("e2", "funeralMass", 1),
      entry("e3", custom.key, 2),
      entry("e4", "prayerForDead", 1),
    ],
    councilInstructions: "평의회 회합 참석",
    activitySummary: "",
    otherNotes: "기존 메모",
    evangelization: {
      ...base.evangelization,
      activeMember: { result: 1, target: 2 },
    },
  };
}

describe("추천 매핑", () => {
  it("모든 추천 대상이 실제 새 양식 키다", () => {
    for (const target of Object.values(SUGGESTED_MAPPING)) {
      expect(validTargets.has(target)).toBe(true);
    }
  });
});

describe("listLegacyActivityUsage / initialMapping", () => {
  it("이전 항목별 합계를 모은다", () => {
    expect(listLegacyActivityUsage(legacyReport(), items)).toEqual([
      { key: "prayerForDead", label: "연도", total: 4 },
      { key: "funeralMass", label: "장례미사", total: 1 },
      { key: custom.key, label: "성지순례 안내", total: 2 },
    ]);
  });

  it("기억된 선택 → 추천 순으로 채우고, 사용자 항목은 비워 둔다", () => {
    const usage = listLegacyActivityUsage(legacyReport(), items);
    const mapping = initialMapping(usage, { funeralMass: "f26.pr.funeralMass.b" }, validTargets);
    expect(mapping).toEqual({
      prayerForDead: "f26.pr.prayerForDead",
      funeralMass: "f26.pr.funeralMass.b",
      [custom.key]: "",
    });
    expect(isMappingComplete(usage, mapping)).toBe(false);
  });

  it("더 이상 없는 키를 기억하고 있으면 미지정으로 둔다", () => {
    const usage = listLegacyActivityUsage(legacyReport(), items);
    expect(initialMapping(usage, { prayerForDead: "f26.gone" }, validTargets).prayerForDead).toBe("");
  });
});

describe("convertReportTo2026", () => {
  const mapping = {
    prayerForDead: "f26.pr.prayerForDead",
    funeralMass: "f26.pr.funeralMass.a",
    [custom.key]: EXCLUDE,
  };

  it("항목 키를 바꾸고, 제외한 기록은 지우고, 양식 버전을 붙인다", () => {
    const converted = convertReportTo2026(legacyReport(), mapping);
    expect(converted.formVersion).toBe("2026-cu");
    expect(converted.activityEntries.map((e) => [e.id, e.itemKey, e.count])).toEqual([
      ["e1", "f26.pr.prayerForDead", 3],
      ["e2", "f26.pr.funeralMass.a", 1],
      ["e4", "f26.pr.prayerForDead", 1],
    ]);
    expect(converted.activityEntries[0].note).toBe("메모");
    expect(converted.senatusCounts.rosaryBillion).toBe(0);
  });

  it("자리 없는 글은 기타 뒤로 옮기고 원래 칸은 비운다", () => {
    const converted = convertReportTo2026(legacyReport(), mapping);
    expect(converted.otherNotes).toBe(
      "기존 메모\n[이전 양식] 평의회 지시사항: 평의회 회합 참석\n[이전 양식] 선교실적: 행동단원(1/2)"
    );
    expect(converted.councilInstructions).toBe("");
  });

  it("원본은 바꾸지 않는다", () => {
    const original = legacyReport();
    const snapshot = structuredClone(original);
    convertReportTo2026(original, mapping);
    expect(original).toEqual(snapshot);
  });

  it("지정 안 된 항목이 있으면 던진다", () => {
    expect(() => convertReportTo2026(legacyReport(), { prayerForDead: "f26.pr.prayerForDead" })).toThrow();
  });

  it("옮길 글이 없으면 carriedOverNotes 는 빈 배열", () => {
    const report = { ...legacyReport(), councilInstructions: "", evangelization: createMonthlyReport("2026-01", DEFAULT_ROSTER, null, []).evangelization };
    expect(carriedOverNotes(report)).toEqual([]);
  });
});
