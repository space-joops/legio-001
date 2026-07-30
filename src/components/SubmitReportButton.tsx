"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ConfirmDialog } from "./ConfirmDialog";
import styles from "./SubmitReportButton.module.css";

export function SubmitReportButton({
  onConfirmSubmit,
}: {
  onConfirmSubmit: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        {t("home.submit")}
      </button>
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
