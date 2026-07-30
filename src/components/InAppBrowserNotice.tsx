"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "./ToastProvider";
import styles from "./InAppBrowserNotice.module.css";

const IN_APP_BROWSER_PATTERN = /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\//i;
const DISMISSED_KEY = "legioMariae.inAppBrowserNoticeDismissed";

export function InAppBrowserNotice() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isInAppBrowser = IN_APP_BROWSER_PATTERN.test(window.navigator.userAgent);
    const dismissed = window.sessionStorage.getItem(DISMISSED_KEY) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time check of browser APIs unavailable at render time
    setVisible(isInAppBrowser && !dismissed);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t("inAppBrowser.linkCopied"));
    } catch {
      // clipboard unavailable; nothing more we can do here
    }
  };

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.text}>{t("inAppBrowser.message")}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.copyButton} onClick={handleCopyLink}>
          {t("inAppBrowser.copyLink")}
        </button>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label={t("inAppBrowser.dismiss")}
        >
          ×
        </button>
      </div>
    </div>
  );
}
