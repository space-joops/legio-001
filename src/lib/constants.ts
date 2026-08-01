import type { PrayerCounts, PrayerItemKey } from "./types";

export interface PrayerItemConfig {
  key: PrayerItemKey;
  labelKey: string;
  icon: "mass" | "priest" | "chain" | "rosary" | "aspiration";
  /** true for items that are naturally counted in days (0-7 in a normal week) rather than open-ended taps */
  unitLabelKey?: string;
}

export const PRAYER_ITEMS: PrayerItemConfig[] = [
  { key: "weekdayMass", labelKey: "counters.weekdayMass", icon: "mass" },
  { key: "priestPrayer", labelKey: "counters.priestPrayer", icon: "priest" },
  { key: "chainPrayer", labelKey: "counters.chainPrayer", icon: "chain" },
  {
    key: "rosaryDecades",
    labelKey: "counters.rosaryDecades",
    icon: "rosary",
    unitLabelKey: "counters.unitDecade",
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
