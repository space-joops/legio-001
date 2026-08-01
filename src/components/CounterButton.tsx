"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import styles from "./CounterButton.module.css";

interface CounterButtonProps {
  label: string;
  unitLabel?: string;
  icon: ReactNode;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetValue: (value: number) => void;
  onShowText?: () => void;
}

export function CounterButton({
  label,
  unitLabel,
  icon,
  count,
  onIncrement,
  onDecrement,
  onSetValue,
  onShowText,
}: CounterButtonProps) {
  const { t } = useTranslation();
  const [numericMode, setNumericMode] = useState(false);
  const [draft, setDraft] = useState(String(count));

  const openNumericMode = () => {
    setDraft(String(count));
    setNumericMode(true);
  };

  const applyDraft = () => {
    const parsed = Number.parseInt(draft, 10);
    onSetValue(Number.isFinite(parsed) ? parsed : 0);
    setNumericMode(false);
  };

  const commitDraftOnBlur = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) onSetValue(Math.max(0, parsed));
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-muted-foreground">
              {icon}
            </span>
            <span>{label}</span>
            {unitLabel && <span className="text-muted-foreground font-normal">({unitLabel})</span>}
          </div>
          {onShowText && (
            <Button variant="link" className="h-auto p-0" onClick={onShowText}>
              {t("counters.viewPrayerText")}
            </Button>
          )}
        </div>

        {!numericMode ? (
          <>
            <button
              type="button"
              className={styles.tapArea}
              onClick={onIncrement}
              aria-label={`${label} ${t("counters.tapToRecord")}`}
            >
              <span className={styles.count}>{count}</span>
            </button>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onDecrement}
                disabled={count <= 0}
                aria-label={`${label} ${t("counters.minus")}`}
              >
                −
              </Button>
              <Button variant="link" onClick={openNumericMode}>
                {t("counters.directInput")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraftOnBlur}
                onFocus={selectOnFocus}
                aria-label={label}
                className="text-xl h-12 text-center"
              />
              <Button size="lg" className="h-12 px-8" onClick={applyDraft}>
                {t("counters.apply")}
              </Button>
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="link" onClick={() => setNumericMode(false)}>
                {t("counters.counterView")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
