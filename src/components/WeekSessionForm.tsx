"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

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
    <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
          <TextField
            label={t("week.sessionNumber")}
            type="number"
            inputMode="numeric"
            slotProps={{ htmlInput: { min: 1 } }}
            required
            value={sessionNumber}
            onChange={(e) => onSessionNumberChange(e.target.value)}
            onFocus={selectOnFocus}
            placeholder={t("week.sessionNumberPlaceholder")}
            fullWidth
            variant="outlined"
          />
          <TextField
            label={t("week.meetingDateTime")}
            type="datetime-local"
            required
            value={meetingDateTime}
            onChange={(e) => onMeetingDateTimeChange(e.target.value)}
            fullWidth
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box sx={{ mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disableElevation
              fullWidth
              sx={{ py: 1.5 }}
            >
              {submitLabel}
            </Button>
          </Box>
        </CardContent>
      </form>
    </Card>
  );
}
