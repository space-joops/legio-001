"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InstallPromptButton } from "@/components/InstallPromptButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { useTranslation } from "@/i18n/useTranslation";
import { downloadExportedData, resetAllData } from "@/lib/exportData";
import { storage } from "@/lib/storage";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [name, setName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setName(storage.getProfile().name);
  }, [ready]);

  const handleNameChange = (value: string) => {
    setName(value);
    storage.setProfile({ name: value });
  };

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    showToast(t("settings.resetDone"));
    window.location.href = "/";
  };

  return (
    <PageShell title={t("settings.title")}>
      <section className={styles.section}>
        <label className={styles.field}>
          <span className={styles.label}>{t("settings.nameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={name}
            placeholder={t("settings.namePlaceholder")}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </label>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.languageLabel")}</span>
        <LanguageToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.install")}</span>
        <p className={styles.description}>{t("settings.installDescription")}</p>
        <InstallPromptButton />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.exportData")}</span>
        <p className={styles.description}>{t("settings.exportDescription")}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={downloadExportedData}
        >
          {t("settings.exportData")}
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.resetData")}</span>
        <p className={styles.description}>{t("settings.resetDescription")}</p>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={() => setResetOpen(true)}
        >
          {t("settings.resetData")}
        </button>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title={t("settings.resetConfirmTitle")}
        body={t("settings.resetConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </PageShell>
  );
}
