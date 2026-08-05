import {
  APOSTLES_CREED_EN,
  APOSTLES_CREED_KO,
  FATIMA_PRAYER_EN,
  GLORY_BE_EN,
  GLORY_BE_KO,
  HAIL_MARY_EN,
  HAIL_MARY_KO,
  OUR_FATHER_EN,
  OUR_FATHER_KO,
  ROSARY_MYSTERY_SECTIONS_EN,
  ROSARY_MYSTERY_SECTIONS_KO,
  SALVATION_PRAYER_KO,
  SALVE_REGINA_EN,
  SALVE_REGINA_KO,
  type PrayerTextSection,
} from "./prayerTexts";
import type { Language } from "./types";
import {
  ROSARY_MEDITATIONS,
  type DecadeMeditation,
} from "./rosaryMeditations";


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

/** How many decades make one rosary, and how many Hail Marys make one decade. */
export const DECADES_PER_ROSARY = 5;
export const HAIL_MARYS_PER_DECADE = 10;
/** The three Hail Marys of the opening prayers. */
const OPENING_HAIL_MARYS = 3;

/** Which set is prayed on the given day. Call this on the client only — a
    static export has no meaningful "today" at build time. */
export function getMysteryIdForDate(date: Date): MysteryId {
  return MYSTERY_BY_WEEKDAY[date.getDay()];
}

export function getMysterySection(id: MysteryId, language: Language): PrayerTextSection {
  const sections = language === "ko" ? ROSARY_MYSTERY_SECTIONS_KO : ROSARY_MYSTERY_SECTIONS_EN;
  return sections[MYSTERY_ORDER.indexOf(id)];
}

/** One screen of the walk-through: a prayer title and the words to say. */
export interface RosaryStep {
  title: string;
  /** "3 / 10" for the prayers that repeat. */
  ordinal?: string;
  /** Empty for the mystery announcements, where the title is the whole text. */
  lines: string[];
  /** 1–5 while inside a decade; absent for the opening and closing prayers. */
  decade?: number;
  /** The path to an optional image for this step */
  image?: string;
  /** The 10 specific meditations and virtue for the decade. */
  meditation?: DecadeMeditation;
}

/** Prayer names, passed in so this module stays free of the i18n layer. */
export interface RosaryStepLabels {
  creed: string;
  ourFather: string;
  hailMary: string;
  gloryBe: string;
  salvation: string;
  closing: string;
}

/**
 * The full rosary as one flat list of screens:
 * 사도신경 · 주님의 기도 · 성모송 ×3 · 영광송, then for each of the five decades
 * 신비 묵상 · 주님의 기도 · 성모송 ×10 · 영광송 · 구원을 비는 기도, then 성모찬송.
 * 77 steps in all.
 */
export function buildRosarySteps(
  id: MysteryId,
  language: Language,
  labels: RosaryStepLabels
): RosaryStep[] {
  const ko = language === "ko";
  const creed = ko ? APOSTLES_CREED_KO : APOSTLES_CREED_EN;
  const ourFather = ko ? OUR_FATHER_KO : OUR_FATHER_EN;
  const hailMary = ko ? HAIL_MARY_KO : HAIL_MARY_EN;
  const gloryBe = ko ? GLORY_BE_KO : GLORY_BE_EN;
  const salvation = ko ? SALVATION_PRAYER_KO : FATIMA_PRAYER_EN;
  const closing = ko ? SALVE_REGINA_KO : SALVE_REGINA_EN;
  const mystery = getMysterySection(id, language);

  const hailMarys = (count: number, decade?: number): RosaryStep[] =>
    Array.from({ length: count }, (_, i) => ({
      title: labels.hailMary,
      ordinal: `${i + 1} / ${count}`,
      lines: hailMary,
      decade,
    }));

  return [
    { title: labels.creed, lines: creed },
    { title: labels.ourFather, lines: ourFather },
    ...hailMarys(OPENING_HAIL_MARYS),
    { title: labels.gloryBe, lines: gloryBe },
    ...Array.from({ length: DECADES_PER_ROSARY }, (_, d) => [
      // The mystery line is the announcement — it is the screen's whole text.
      { title: mystery.lines[d], lines: [], decade: d + 1, image: `/images/rosary/${id}-${d + 1}.jpeg`, meditation: ROSARY_MEDITATIONS[id]?.[String(d + 1)] },
      { title: labels.ourFather, lines: ourFather, decade: d + 1 },
      ...hailMarys(HAIL_MARYS_PER_DECADE, d + 1),
      { title: labels.gloryBe, lines: gloryBe, decade: d + 1 },
      { title: labels.salvation, lines: salvation, decade: d + 1 },
    ]).flat(),
    { title: labels.closing, lines: closing },
  ];
}
