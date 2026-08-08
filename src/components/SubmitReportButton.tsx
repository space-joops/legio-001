"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ConfirmDialog } from "./ConfirmDialog";
import styles from "./SubmitReportButton.module.css";

/**
 * 홈 화면 맨 아래의 "제출하기" 버튼. 확인 창을 한 번 거친다.
 *
 * 제출하면 작성 중이던 회차가 기록으로 넘어가고 홈 화면이 비워지므로,
 * 실수로 누르는 일이 없도록 확인을 받는다.
 */

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
