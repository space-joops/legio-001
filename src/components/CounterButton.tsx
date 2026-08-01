"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import ButtonBase from "@mui/material/ButtonBase";
import RemoveIcon from "@mui/icons-material/Remove";

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
    <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
              {icon}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {label}
            </Typography>
            {unitLabel && (
              <Typography variant="body2" color="text.secondary">
                ({unitLabel})
              </Typography>
            )}
          </Box>
          {onShowText && (
            <Button size="small" onClick={onShowText} sx={{ minWidth: "auto", px: 1 }}>
              {t("counters.viewPrayerText")}
            </Button>
          )}
        </Box>

        {!numericMode ? (
          <>
            <ButtonBase
              onClick={onIncrement}
              aria-label={`${label} ${t("counters.tapToRecord")}`}
              sx={{
                width: "100%",
                py: 4,
                bgcolor: "background.paper",
                borderRadius: 2,
                mb: 1,
                border: "1px solid",
                borderColor: "divider",
                transition: "background-color 0.2s",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography variant="h3" color="primary" sx={{ fontWeight: "bold" }}>
                {count}
              </Typography>
            </ButtonBase>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <IconButton
                onClick={onDecrement}
                disabled={count <= 0}
                color="primary"
                aria-label={`${label} ${t("counters.minus")}`}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <RemoveIcon />
              </IconButton>
              <Button onClick={openNumericMode} color="inherit">
                {t("counters.directInput")}
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                type="number"
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraftOnBlur}
                onFocus={selectOnFocus}
                aria-label={label}
                fullWidth
                variant="outlined"
                slotProps={{
                  htmlInput: { min: 0 }
                }}
                sx={{
                  "& input": { textAlign: "center", fontSize: "1.25rem", fontWeight: "bold" }
                }}
              />
              <Button variant="contained" size="large" disableElevation onClick={applyDraft} sx={{ px: 4 }}>
                {t("counters.apply")}
              </Button>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setNumericMode(false)} color="inherit">
                {t("counters.counterView")}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
