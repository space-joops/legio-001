"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

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
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 className={styles.title}>{title}</h2>
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
