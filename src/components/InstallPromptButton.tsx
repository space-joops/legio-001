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

  // A disabled button with no explanation reads as "broken" — say why.
  if (!canInstall) {
    return <p className={styles.hint}>{t("settings.installUnavailable")}</p>;
  }

  return (
    <button type="button" className={styles.button} onClick={promptInstall}>
      {t("settings.install")}
    </button>
  );
}
