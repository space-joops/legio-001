"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        주간 활동 마감
      </button>
      <ConfirmDialog
        open={open}
        title="주간 활동을 마감할까요?"
        body="마감하면 이번 주 기록이 저장되고 기록 목록에 추가됩니다. 보고는 이 기기에만 저장되며, 제출 후 공유하기로 보낼 수 있습니다. 다음 주는 홈에서 '이번 주 시작하기'를 눌러 새로 시작합니다."
        confirmLabel="확인"
        cancelLabel="취소"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onConfirmSubmit();
        }}
      />
    </>
  );
}
