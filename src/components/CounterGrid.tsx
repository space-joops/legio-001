"use client";

import { PRAYER_ITEMS } from "@/lib/constants";
import type { PrayerCounts, PrayerItemKey } from "@/lib/types";
import { useTranslation } from "@/i18n/useTranslation";
import { CounterButton } from "./CounterButton";
import { AspirationIcon } from "./icons/AspirationIcon";
import { ChainPrayerIcon } from "./icons/ChainPrayerIcon";
import { MassIcon } from "./icons/MassIcon";
import { PriestIcon } from "./icons/PriestIcon";
import { RosaryIcon } from "./icons/RosaryIcon";

const ICONS = {
  mass: MassIcon,
  priest: PriestIcon,
  chain: ChainPrayerIcon,
  rosary: RosaryIcon,
  aspiration: AspirationIcon,
};

interface CounterGridProps {
  counts: PrayerCounts;
  onIncrement: (key: PrayerItemKey) => void;
  onDecrement: (key: PrayerItemKey) => void;
  onSetValue: (key: PrayerItemKey, value: number) => void;
}

export function CounterGrid({
  counts,
  onIncrement,
  onDecrement,
  onSetValue,
}: CounterGridProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {PRAYER_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <CounterButton
            key={item.key}
            label={t(item.labelKey)}
            unitLabel={item.unitLabelKey ? t(item.unitLabelKey) : undefined}
            icon={<Icon />}
            count={counts[item.key]}
            onIncrement={() => onIncrement(item.key)}
            onDecrement={() => onDecrement(item.key)}
            onSetValue={(value) => onSetValue(item.key, value)}
          />
        );
      })}
    </div>
  );
}
