"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "@/components/ui/button";

export function SubmitReportButton({
  onConfirmSubmit,
}: {
  onConfirmSubmit: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" className="w-full mt-4 h-16 text-xl rounded-2xl" onClick={() => setOpen(true)}>
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
