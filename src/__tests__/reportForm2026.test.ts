import { describe, it, expect } from "vitest";
import { createDefaultActivityItems } from "../lib/activityItems";
import { buildForm2026Tallies } from "../lib/activityReport";
import { createMonthlyReport } from "../lib/monthlyReportUtils";
import {
  PARISH_CELLS,
  PR_CATEGORIES,
  PR_GRID_ROWS,
  createForm2026ActivityItems,
  formatCellValue,
  mergeForm2026ActivityItems,
} from "../lib/reportForm2026";
import { DEFAULT_ROSTER } from "../lib/storage";
import { splitNotableExpenses } from "../lib/treasury";
import type { ActivityEntry } from "../lib/types";

function entry(itemKey: string, count: number, sessionNumber = 1): ActivityEntry {
  return { id: `${itemKey}-${sessionNumber}`, personId: "p1", sessionNumber, itemKey, count, note: "" };
}

describe("2026 양식 정의", () => {
  it("모든 활동 항목 키가 서로 다르다", () => {
    const keys = createForm2026ActivityItems().map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("격자의 모든 칸이 카탈로그 항목을 가진다", () => {
    const keys = new Set(createForm2026ActivityItems().map((item) => item.key));
    for (const cell of [...PARISH_CELLS, ...PR_CATEGORIES.flatMap((c) => c.cells)]) {
      for (const half of cell.halves) expect(keys.has(half.key)).toBe(true);
    }
  });

  it("Pr. 격자는 5분류이고 어느 분류도 8칸을 넘지 않는다", () => {
    expect(PR_CATEGORIES).toHaveLength(5);
    for (const category of PR_CATEGORIES) {
      expect(category.cells.length).toBeLessThanOrEqual(PR_GRID_ROWS);
    }
  });

  it("짝 칸은 a/b 로, 0 은 빈칸으로 찍힌다", () => {
    expect(formatCellValue([2, 1])).toBe("2/1");
    expect(formatCellValue([0, 3])).toBe("0/3");
    expect(formatCellValue([0, 0])).toBe("");
    expect(formatCellValue([1200])).toBe("1,200");
  });

  it("저장된 카탈로그에 빠진 새 항목만 덧붙이고 기존 항목은 그대로 둔다", () => {
    const stored = [
      { id: "x", key: "prayerForDead", label: "연도(고침)", line: "praesidium" as const, order: 0, hidden: true },
    ];
    const merged = mergeForm2026ActivityItems(stored);
    expect(merged[0]).toEqual(stored[0]);
    expect(merged.length).toBe(1 + createForm2026ActivityItems().length);
    expect(mergeForm2026ActivityItems(merged)).toBe(merged);
  });

  it("기본 카탈로그는 이전 양식 항목과 새 양식 항목을 모두 담는다", () => {
    const items = createDefaultActivityItems();
    expect(items.some((i) => i.key === "prayerForDead" && !i.form)).toBe(true);
    expect(items.some((i) => i.form === "2026-cu")).toBe(true);
  });
});

describe("buildForm2026Tallies", () => {
  const items = createDefaultActivityItems();

  it("짝 칸 반쪽을 따로 합산하고, 매일미사·미사영성체를 기도 숫자에서 가져온다", () => {
    const report = {
      ...createMonthlyReport("2026-06", DEFAULT_ROSTER, null, []),
      prayerCounts: { weekdayMass: 25, priestPrayer: 3, chainPrayer: 4, rosaryDecades: 50, aspirations: 9 },
      sundayMassTotal: 28,
      activityEntries: [
        entry("f26.pr.coffin.a", 1, 1),
        entry("f26.pr.coffin.a", 1, 2),
        entry("f26.pr.coffin.b", 1, 2),
        entry("f26.parish.newFamily", 3),
      ],
    };
    const tallies = buildForm2026Tallies(report, items);
    const coffin = tallies.pr[2].cells.find((t) => t.cell.label === "입관/출관");
    expect(coffin?.values).toEqual([2, 1]);
    expect(tallies.parish.find((t) => t.cell.label === "새가족찾기")?.values).toEqual([3]);
    expect(tallies.weekdayMass).toBe(25);
    expect(tallies.diocese[0]).toEqual({ label: "미사 영성체", value: 53 });
    expect(tallies.unmapped).toEqual([]);
  });

  it("양식에 칸이 없는 이전 항목은 unmapped 로 돌려준다", () => {
    const report = {
      ...createMonthlyReport("2026-06", DEFAULT_ROSTER, null, []),
      activityEntries: [entry("prayerForDead", 2)],
    };
    expect(buildForm2026Tallies(report, items).unmapped).toEqual([{ label: "연도", count: 2 }]);
  });
});

describe("splitNotableExpenses", () => {
  it("의연금·꽃값만 따로, 나머지는 기타로 합친다", () => {
    expect(
      splitNotableExpenses([
        { label: "의연금", amount: 70000 },
        { label: "꽃값", amount: 20000 },
        { label: "다과비", amount: 5000 },
        { label: "성물비", amount: 3000 },
      ])
    ).toEqual({ donation: 70000, flowers: 20000, other: 8000 });
  });
});
