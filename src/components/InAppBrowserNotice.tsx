"use client";

import { useEffect, useState } from "react";
import { detectInAppBrowser } from "@/hooks/useInstallPrompt";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "./ToastProvider";
import styles from "./InAppBrowserNotice.module.css";

/**
 * 카카오톡 등 앱 안에 들어 있는 브라우저로 열었을 때 뜨는 안내 배너.
 *
 * 인앱 브라우저는 별개의 저장 공간을 쓴다. 즉 거기서 기록한 내용은 크롬이나
 * 사파리로 열었을 때 보이지 않고, 앱 설치도 되지 않는다. 데이터를 잃었다는
 * 오해를 막으려면 "기본 브라우저로 열어 주세요"라고 알려 주는 수밖에 없다.
 */

const DISMISSED_KEY = "legioMariae.inAppBrowserNoticeDismissed";

export function InAppBrowserNotice() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isInAppBrowser = detectInAppBrowser();
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
