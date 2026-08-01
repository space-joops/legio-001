import { EMPTY_COUNTS } from "./constants";
import type { PrayerCounts, PrayerItemKey, WeeklyReport } from "./types";

/**
 * A member's weekly numbers, encoded as one line appended to the text they
 * already share. The secretary pastes those messages back into the monthly
 * report instead of retyping several hundred cells by hand.
 *
 * Why a pipe-delimited line and not JSON, base64, a file, or a link:
 * - KakaoTalk is how these get sent. Files there expire, and the secretary
 *   tallies at month end — by then week 1's attachment is often gone. Text
 *   stays in the conversation forever, and "export chat" yields one .txt with
 *   everyone's messages that can be pasted in a single go.
 * - A link would open inside KakaoTalk's in-app browser, a separate origin
 *   where the secretary has no roster at all (see InAppBrowserNotice).
 * - JSON's quotes get mangled by iOS smart punctuation, and both JSON and
 *   base64 fail all-or-nothing and can't be eyeballed or hand-fixed.
 */
export const SUBMISSION_MAGIC = "LEGIO1";

/**
 * Frozen to format v1 on purpose — deliberately NOT derived from PRAYER_ITEMS,
 * so reordering or adding a prayer type later can't silently change how
 * already-sent lines are read.
 */
export const SUBMISSION_COUNT_KEYS = [
  "weekdayMass",
  "priestPrayer",
  "chainPrayer",
  "rosaryDecades",
  "aspirations",
] as const satisfies readonly PrayerItemKey[];

const FIELD_COUNT = 6 + SUBMISSION_COUNT_KEYS.length; // magic, session, date, name, baptismal, …counts, submittedAt

export interface ParsedSubmission {
  sessionNumber: number;
  /** "2026-07-08"; empty when the sender's report had no meeting date. */
  meetingDate: string;
  /** As typed by the member — display as-is, compare via normalizeName. */
  name: string;
  baptismalName: string;
  counts: PrayerCounts;
  /** "2026-07-08T20:31" or "" — breaks ties when the same week is sent twice. */
  submittedAt: string;
  raw: string;
}

/** Pipes and newlines would break the field split; nothing else needs escaping. */
function sanitizeField(value: string): string {
  return value.replace(/[|\r\n]/g, " ").trim();
}

function compactDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

function compactDateTime(iso: string): string {
  return `${compactDate(iso)}${iso.slice(11, 16).replace(":", "")}`;
}

function expandDate(compact: string): string {
  if (!/^\d{8}$/.test(compact)) return "";
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function expandDateTime(compact: string): string {
  if (!/^\d{12}$/.test(compact)) return "";
  return `${expandDate(compact.slice(0, 8))}T${compact.slice(8, 10)}:${compact.slice(10, 12)}`;
}

/** The label line is prose so the member isn't alarmed by the payload; parsing
    keys off the magic string alone, so a mangled or deleted label is harmless. */
export function formatSubmissionBlock(report: WeeklyReport, label: string): string {
  const fields = [
    SUBMISSION_MAGIC,
    String(report.sessionNumber),
    compactDate(report.meetingDateTime),
    sanitizeField(report.memberName),
    sanitizeField(report.baptismalName ?? ""),
    ...SUBMISSION_COUNT_KEYS.map((key) => String(report.counts[key] ?? 0)),
    report.submittedAt ? compactDateTime(report.submittedAt) : "",
  ];
  return ["", label, fields.join("|")].join("\n");
}

function parseLine(line: string): ParsedSubmission | null {
  const fields = line.split("|");
  if (fields.length !== FIELD_COUNT) return null;

  const sessionNumber = Number.parseInt(fields[1], 10);
  if (!Number.isFinite(sessionNumber) || sessionNumber < 0) return null;

  const counts: PrayerCounts = { ...EMPTY_COUNTS };
  for (let i = 0; i < SUBMISSION_COUNT_KEYS.length; i++) {
    const value = Number.parseInt(fields[5 + i], 10);
    if (!Number.isFinite(value) || value < 0) return null;
    counts[SUBMISSION_COUNT_KEYS[i]] = value;
  }

  const name = fields[3].trim();
  if (!name) return null;

  return {
    sessionNumber,
    meetingDate: expandDate(fields[2].trim()),
    name,
    baptismalName: fields[4].trim(),
    counts,
    submittedAt: expandDateTime(fields[fields.length - 1].trim()),
    raw: line,
  };
}

/**
 * Scans anything from a single forwarded message to a whole exported chat log.
 * Lines that look like submissions but don't parse are returned separately so
 * the UI can show them rather than dropping them on the floor.
 */
export function parseSubmissionBlocks(text: string): {
  submissions: ParsedSubmission[];
  malformed: string[];
} {
  const submissions: ParsedSubmission[] = [];
  const malformed: string[] = [];

  for (const rawLine of text.split(/[\r\n]+/)) {
    const start = rawLine.indexOf(SUBMISSION_MAGIC + "|");
    if (start === -1) continue;
    // Chat exports prefix lines with timestamps and sender names; take from the
    // magic onward and drop any trailing chatter after the last field.
    const line = rawLine.slice(start).trim();
    const parsed = parseLine(line);
    if (parsed) submissions.push(parsed);
    else malformed.push(line);
  }

  return { submissions, malformed };
}

/**
 * Every name comparison must go through this. NFC is the load-bearing part:
 * Korean text from iOS/macOS often arrives decomposed (NFD), so a visually
 * identical name compares unequal and matching silently fails for those users.
 */
export function normalizeName(value: string): string {
  return value.trim().normalize("NFC").replace(/\s+/g, "");
}
