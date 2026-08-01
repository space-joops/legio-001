import { sortActivityItems } from "./activityItems";
import { PRAYER_ITEMS } from "./constants";
import { computeMassCommunion } from "./monthlyReportUtils";
import type { ActivityItem, ActivityLine, MonthlyReport } from "./types";

/**
 * Builds the four "주요 활동 내역" lines of the official form.
 *
 * The edit screen, the print view and the RTF export all render these, and
 * before this they each assembled the strings themselves — with different
 * separators. One source keeps them identical.
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

/**
 * @param labels prayer labels resolved by the caller — this runs both inside
 *   React (useTranslation) and outside it (RTF), which have separate lookups.
 */
export function buildActivityLines(
  report: MonthlyReport,
  items: ActivityItem[],
  labels: { massCommunion: string; prayer: Record<string, string> }
): ActivityLines {
  const diocese = [
    `${labels.massCommunion}(${computeMassCommunion(report)})`,
    // Weekday Mass belongs to the parish line, not this one.
    ...PRAYER_ITEMS.filter((item) => item.key !== "weekdayMass").map(
      (item) => `${labels.prayer[item.key]}(${report.prayerCounts[item.key] ?? 0})`
    ),
  ].join(", ");

  const parish = formatTallies([
    { label: labels.prayer.weekdayMass, count: report.prayerCounts.weekdayMass ?? 0 },
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
