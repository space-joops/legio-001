"use client";

import { useState } from "react";
import { PRAYER_ITEMS } from "@/lib/constants";
import { PRAYER_TEXTS } from "@/lib/prayerTexts";
import type { PrayerCounts, PrayerItemKey } from "@/lib/types";
import { useTranslation } from "@/i18n/useTranslation";
import { CounterButton } from "./CounterButton";
import { PrayerTextDialog } from "./PrayerTextDialog";
import { AspirationIcon } from "./icons/AspirationIcon";
import { ChainPrayerIcon } from "./icons/ChainPrayerIcon";
import { MassIcon } from "./icons/MassIcon";
import { PriestIcon } from "./icons/PriestIcon";
import { RosaryIcon } from "./icons/RosaryIcon";
import { BookIcon } from "./icons/NavIcons";

const ICONS = {
  mass: MassIcon,
  priest: PriestIcon,
  chain: ChainPrayerIcon,
  rosary: RosaryIcon,
  aspiration: AspirationIcon,
  catena: ChainPrayerIcon,
  tessera: AspirationIcon,
  book: BookIcon,
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
  const { t, language } = useTranslation();
  const [viewingKey, setViewingKey] = useState<PrayerItemKey | null>(null);

  const viewingItem = viewingKey ? PRAYER_ITEMS.find((item) => item.key === viewingKey) : null;
  const viewingEntry = viewingKey ? PRAYER_TEXTS[viewingKey]?.[language] ?? null : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {PRAYER_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const hasText = Boolean(PRAYER_TEXTS[item.key]);
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
            onShowText={hasText ? () => setViewingKey(item.key) : undefined}
          />
        );
      })}
      <PrayerTextDialog
        title={viewingItem ? t(viewingItem.labelKey) : ""}
        entry={viewingEntry}
        count={viewingKey ? counts[viewingKey] : 0}
        onIncrement={() => viewingKey && onIncrement(viewingKey)}
        onClose={() => setViewingKey(null)}
      />
    </div>
  );
}
