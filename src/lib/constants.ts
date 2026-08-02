import type { PrayerCounts, PrayerItemKey } from "./types";

export interface PrayerItemConfig {
  key: PrayerItemKey;
  labelKey: string;
  icon: "mass" | "priest" | "chain" | "rosary" | "aspiration";
  /** Unit suffix shown next to the label and in the share text (only 묵주기도 has one: 단). */
  unitLabelKey?: string;
  /**
   * Taps fill a set of this many beads before the count moves, instead of
   * counting one per tap. Only 묵주기도 has one — a rosary is prayed as 5단.
   */
  setSize?: number;
}

/** A rosary is prayed as five decades, so taps commit five 단 at a time. */
export const ROSARY_SET_SIZE = 5;

export const PRAYER_ITEMS: PrayerItemConfig[] = [
  { key: "weekdayMass", labelKey: "counters.weekdayMass", icon: "mass" },
  { key: "priestPrayer", labelKey: "counters.priestPrayer", icon: "priest" },
  { key: "chainPrayer", labelKey: "counters.chainPrayer", icon: "chain" },
  {
    key: "rosaryDecades",
    labelKey: "counters.rosaryDecades",
    icon: "rosary",
    unitLabelKey: "counters.unitDecade",
    setSize: ROSARY_SET_SIZE,
  },
  { key: "aspirations", labelKey: "counters.aspirations", icon: "aspiration" },
];

export const EMPTY_COUNTS: PrayerCounts = {
  weekdayMass: 0,
  priestPrayer: 0,
  chainPrayer: 0,
  rosaryDecades: 0,
  aspirations: 0,
};

/**
 * 2: attendance defaults to absent. Reports written under 1 seeded every
 * session present, which contradicted the screen's own rule that prayer
 * numbers are what mark a member present.
 */
export const DATA_SCHEMA_VERSION = 2;
