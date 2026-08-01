"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./WeekSessionForm.module.css";

interface WeekSessionFormProps {
  sessionNumber: string;
  meetingDateTime: string;
  onSessionNumberChange: (value: string) => void;
  onMeetingDateTimeChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}

export function WeekSessionForm({
  sessionNumber,
  meetingDateTime,
  onSessionNumberChange,
  onMeetingDateTimeChange,
  onSubmit,
  submitLabel,
}: WeekSessionFormProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-full shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t("week.sessionNumber")}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              required
              value={sessionNumber}
              onChange={(e) => onSessionNumberChange(e.target.value)}
              onFocus={selectOnFocus}
              placeholder={t("week.sessionNumberPlaceholder")}
              className="text-lg h-12"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t("week.meetingDateTime")}</span>
            <Input
              type="datetime-local"
              required
              value={meetingDateTime}
              onChange={(e) => onMeetingDateTimeChange(e.target.value)}
              className="text-lg h-12"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg h-14 rounded-xl">
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
