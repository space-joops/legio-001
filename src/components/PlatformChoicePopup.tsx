"use client";

import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./PlatformChoicePopup.module.css";

export function PlatformChoicePopup() {
  const { t } = useTranslation();
  const { installed, canInstall, isIos, isAndroid, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const settings = storage.getSettings();
    if (!installed && !settings.hidePlatformChoicePopup) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [installed]);

  if (!open) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      const settings = storage.getSettings();
      storage.setSettings({ ...settings, hidePlatformChoicePopup: true });
    }
    setOpen(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{t("platformChoice.title")}</h2>
        <p className={styles.description}>{t("platformChoice.description")}</p>

        <div className={styles.options}>
          {canInstall && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                void promptInstall();
                handleClose();
              }}
            >
              {t("platformChoice.pwa")}
            </button>
          )}

          <div className={styles.manualInstall}>
            <p className={styles.manualInstallTitle}>{t("platformChoice.manual")}</p>
            {isIos ? (
              <p className={styles.hint}>{t("settings.installIosHint")}</p>
            ) : isAndroid ? (
              <p className={styles.hint}>{t("settings.installAndroidHint")}</p>
            ) : (
              <p className={styles.hint}>{t("settings.installUnavailable")}</p>
            )}
          </div>

          <button type="button" className={styles.secondaryButton} onClick={handleClose}>
            {t("platformChoice.web")}
          </button>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className={styles.checkbox}
          />
          {t("platformChoice.dontShowAgain")}
        </label>
      </div>
    </div>
  );
}
