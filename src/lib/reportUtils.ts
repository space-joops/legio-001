import { ko as strings } from "@/lib/strings";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import { formatSubmissionBlock } from "./prayerSubmission";
import type { Profile, WeeklyReport } from "./types";

export function createNewReport(
  sessionNumber: number,
  meetingDateTime: string,
  profile: Profile
): WeeklyReport {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: 1,
    sessionNumber,
    meetingDateTime,
    memberName: profile.name,
    baptismalName: profile.baptismalName,
    praesidiumName: profile.praesidiumName,
    parishName: profile.parishName,
    counts: { ...EMPTY_COUNTS },
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
}

export function sortHistory(history: WeeklyReport[]): WeeklyReport[] {
  return [...history].sort((a, b) => b.sessionNumber - a.sessionNumber);
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatMeetingDateTime(iso: string, language: "ko"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatSessionLabel(sessionNumber: number, language: "ko"): string {
  return language === "ko" ? `${sessionNumber}회차` : `Session ${sessionNumber}`;
}

export function formatShareText(report: WeeklyReport, language: "ko"): string {
  const dict = strings;
  const title = `${dict.app.shortName} (${formatSessionLabel(
    report.sessionNumber,
    language
  )})`;
  const dateLine = `${dict.report.meetingLabel}: ${formatMeetingDateTime(
    report.meetingDateTime,
    language
  )}`;
  const nameLine = `${dict.report.memberLabel}: ${report.memberName || "-"}`;
  const lines = PRAYER_ITEMS.map((item) => {
    const unit = item.key === "rosaryDecades" ? dict.counters.unitDecade : "";
    return `${dict.counters[item.key]}: ${report.counts[item.key]}${unit}`;
  });
  const noteLines = report.activityNote?.trim()
    ? ["", `${dict.report.activityNoteLabel}: ${report.activityNote.trim()}`]
    : [];
  // Machine-readable tail so the secretary can paste this straight into the
  // monthly report instead of copying the numbers by hand.
  const submissionBlock = formatSubmissionBlock(report, dict.report.shareBlockLabel);
  return [title, dateLine, nameLine, "", ...lines, ...noteLines].join("\n") + submissionBlock;
}
