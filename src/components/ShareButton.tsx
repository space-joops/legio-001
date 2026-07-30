"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "./ToastProvider";
import styles from "./ShareButton.module.css";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(url ? { title, text, url } : { title, text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
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
