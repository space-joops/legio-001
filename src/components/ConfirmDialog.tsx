"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

/**
 * "정말 삭제할까요?" 같은 확인 창. 앱 전체가 이 하나를 돌려 쓴다.
 *
 * 브라우저 기본 `confirm()` 을 쓰지 않는 이유: 글자 크기를 키운 어르신 화면에서
 * 너무 작게 뜨고, 문구를 한국어로 다듬을 수도 없기 때문이다.
 *
 * 이 저장소의 모달은 전부 같은 방식이다 — `<dialog>` 요소 + `showModal()`.
 * 그러면 브라우저가 알아서 화면 맨 위에 띄워 줘서, z-index 를 다투거나
 * 뒤쪽 스크롤을 손으로 막을 필요가 없다.
 */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  /** Extra line under the body — e.g. a summary of the file about to be imported. */
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  /** Safer alternative offered alongside the destructive action (e.g. "back up first"). */
  altLabel?: string;
  onAlt?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  detail,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
  altLabel,
  onAlt,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {altLabel && onAlt && (
        <button type="button" className={styles.altButton} onClick={onAlt}>
          {altLabel}
        </button>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`${styles.confirmButton} ${danger ? styles.danger : ""}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
