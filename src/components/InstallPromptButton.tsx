"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./InstallPromptButton.module.css";

export function InstallPromptButton() {
  const { t } = useTranslation();
  const { canInstall, installed, isIos, promptInstall } = useInstallPrompt();

  if (installed) {
    return <p className={styles.installed}>{t("settings.installed")}</p>;
  }

  if (isIos) {
    return <p className={styles.hint}>{t("settings.installIosHint")}</p>;
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={promptInstall}
      disabled={!canInstall}
    >
      {t("settings.install")}
    </button>
  );
}
