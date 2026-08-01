import type { PrayerCounts, PrayerItemKey } from "./types";

export interface PrayerItemConfig {
  key: PrayerItemKey;
  labelKey: string;
  icon: "mass" | "priest" | "chain" | "rosary" | "aspiration" | "catena" | "tessera" | "book";
  /** true for items that are naturally counted in days (0-7 in a normal week) rather than open-ended taps */
  unitLabelKey?: string;
}

export const PRAYER_ITEMS: PrayerItemConfig[] = [
  { key: "catena", labelKey: "counters.catena", icon: "catena" },
  { key: "tesseraFull", labelKey: "counters.tesseraFull", icon: "tessera" },
  { key: "handbookReading", labelKey: "counters.handbookReading", icon: "book" },
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
  catena: 0,
  tesseraFull: 0,
  handbookReading: 0,
  weekdayMass: 0,
  priestPrayer: 0,
  chainPrayer: 0,
  rosaryDecades: 0,
  aspirations: 0,
};

export const DATA_SCHEMA_VERSION = 1;
