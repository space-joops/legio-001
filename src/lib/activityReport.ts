import { sortActivityItems } from "./activityItems";
import { PRAYER_ITEMS } from "./constants";
import { computeMassCommunion } from "./monthlyReportUtils";
import type { ActivityItem, ActivityLine, MonthlyReport } from "./types";

/**
 * 단원들의 활동 기록을 합쳐 공식 양식의 "주요 활동 내역" 네 줄을 만든다.
 * 편집 화면과 인쇄 화면이 모두 이 결과를 그대로 쓴다. 예전에는 두 화면이 각자
 * 문자열을 조립하느라 구분자가 서로 달랐는데, 출처를 하나로 모아 맞췄다.
 */

export interface ActivityTally {
  label: string;
  count: number;
}

/** Totals every member's entries for one line of the form. */
export function tallyActivities(
  report: MonthlyReport,
  items: ActivityItem[],
  line: ActivityLine
): ActivityTally[] {
  const totals = new Map<string, number>();
  for (const entry of report.activityEntries ?? []) {
    totals.set(entry.itemKey, (totals.get(entry.itemKey) ?? 0) + entry.count);
  }
  return sortActivityItems(items)
    .filter((item) => item.line === line)
    .map((item) => ({ label: item.label, count: totals.get(item.key) ?? 0 }));
}

/** "장례미사(2), 교우상가방문(3)" — months with no activity are left out. */
export function formatTallies(tallies: ActivityTally[]): string {
  return tallies
    .filter((t) => t.count > 0)
    .map((t) => `${t.label}(${t.count})`)
    .join(", ");
}

export interface ActivityLines {
  /** 미사영성체(N),사제를 위한기도(N),… */
  diocese: string;
  /** 평일미사 참례(N), 소공동체 참여(N), … */
  parish: string;
  /** 연도(3), 장례미사(2), … */
  praesidium: string;
}

export function buildActivityLines(report: MonthlyReport, items: ActivityItem[]): ActivityLines {
  const weekdayMass = PRAYER_ITEMS.find((item) => item.key === "weekdayMass")!;
  const diocese = [
    `미사영성체(${computeMassCommunion(report)})`,
    // Weekday Mass belongs to the parish line, not this one.
    ...PRAYER_ITEMS.filter((item) => item.key !== "weekdayMass").map(
      (item) => `${item.label}(${report.prayerCounts[item.key] ?? 0})`
    ),
  ].join(", ");

  const parish = formatTallies([
    { label: weekdayMass.label, count: report.prayerCounts.weekdayMass ?? 0 },
    ...tallyActivities(report, items, "parish"),
  ]);

  return {
    diocese,
    parish,
    praesidium: formatTallies(tallyActivities(report, items, "praesidium")),
  };
}

/** Total a single member has recorded in this session — shown in the table cell. */
export function personActivityCount(
  report: MonthlyReport,
  personId: string,
  sessionNumber: number
): number {
  return (report.activityEntries ?? [])
    .filter((e) => e.personId === personId && e.sessionNumber === sessionNumber)
    .reduce((sum, e) => sum + e.count, 0);
}
