import {
  ROSARY_MYSTERY_SECTIONS_EN,
  ROSARY_MYSTERY_SECTIONS_KO,
  type PrayerTextSection,
} from "./prayerTexts";
import type { Language } from "./types";

export type MysteryId = "joyful" | "sorrowful" | "glorious" | "luminous";

/**
 * The order the four sets sit in inside ROSARY_MYSTERY_SECTIONS_KO/EN
 * (환희 · 고통 · 영광 · 빛). Those arrays carry the wording verified against the
 * official 가톨릭 기도서 text, and the tessera page shares them — so this module
 * indexes into them rather than restating any of the twenty decades.
 */
export const MYSTERY_ORDER: MysteryId[] = ["joyful", "sorrowful", "glorious", "luminous"];

/**
 * Indexed by `Date.getDay()` (0 = Sunday):
 * 일 영광 · 월 환희 · 화 고통 · 수 영광 · 목 빛 · 금 고통 · 토 환희.
 * Matches the weekday named in each set's own heading string.
 */
const MYSTERY_BY_WEEKDAY: MysteryId[] = [
  "glorious",
  "joyful",
  "sorrowful",
  "glorious",
  "luminous",
  "sorrowful",
  "joyful",
];

/** Which set is prayed on the given day. Call this on the client only — a
    static export has no meaningful "today" at build time. */
export function getMysteryIdForDate(date: Date): MysteryId {
  return MYSTERY_BY_WEEKDAY[date.getDay()];
}

export function getMysterySection(id: MysteryId, language: Language): PrayerTextSection {
  const sections = language === "ko" ? ROSARY_MYSTERY_SECTIONS_KO : ROSARY_MYSTERY_SECTIONS_EN;
  return sections[MYSTERY_ORDER.indexOf(id)];
}
