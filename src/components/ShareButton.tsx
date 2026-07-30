"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "./ToastProvider";
import styles from "./ShareButton.module.css";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("report.shareCopied"));
    } catch {
      // clipboard unavailable; nothing more we can do here
    }
  };

  return (
    <button type="button" className={styles.button} onClick={handleShare}>
      {t("report.share")}
    </button>
  );
}
