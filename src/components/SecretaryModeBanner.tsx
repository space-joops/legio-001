"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./SecretaryModeBanner.module.css";

/** Slim bar atop every /secretary/* page: names the mode (the sudden amber
    theme otherwise goes unexplained) and restores the door people came in
    through — the general Settings tab disappears from the bottom nav here. */
export function SecretaryModeBanner() {
  const { t } = useTranslation();
  return (
    <div className={styles.banner} data-app-chrome>
      <span className={styles.label}>{t("secretary.modeBanner")}</span>
      <Link href="/settings" className={styles.exitLink}>
        {t("secretary.exitToSettings")}
      </Link>
    </div>
  );
}
