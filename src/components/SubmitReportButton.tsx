"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ConfirmDialog } from "./ConfirmDialog";
import Button from "@mui/material/Button";
import SendIcon from "@mui/material/Icon"; // Can use a send icon or similar, or just basic Button

export function SubmitReportButton({
  onConfirmSubmit,
}: {
  onConfirmSubmit: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        sx={{ mt: 2, height: 56, borderRadius: 3, fontSize: '1.1rem' }}
        onClick={() => setOpen(true)}
      >
        {t("home.submit")}
      </Button>
      <ConfirmDialog
        open={open}
        title={t("home.submitConfirmTitle")}
        body={t("home.submitConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onConfirmSubmit();
        }}
      />
    </>
  );
}
