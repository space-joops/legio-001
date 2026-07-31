"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FontFamilyToggle } from "@/components/FontFamilyToggle";
import { FontScaleToggle } from "@/components/FontScaleToggle";
import { InstallPromptButton } from "@/components/InstallPromptButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PageShell } from "@/components/PageShell";
import { ShareButton } from "@/components/ShareButton";
import { SplashToggle } from "@/components/SplashToggle";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { useTranslation } from "@/i18n/useTranslation";
import { importExportedData, resetAllData, shareOrDownloadExportedData } from "@/lib/exportData";
import { SITE_URL } from "@/lib/site";
import { storage, DEFAULT_PROFILE } from "@/lib/storage";
import type { ExportedData, Profile } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [resetOpen, setResetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setProfile(storage.getProfile());
  }, [ready]);

  const handleProfileChange = (field: keyof Profile, value: string) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    storage.setProfile(next);
  };

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    showToast(t("settings.resetDone"));
    window.location.href = "/";
  };

  const handleImportConfirm = async () => {
    const file = importFile;
    setImportFile(null);
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<ExportedData>;
      importExportedData(data);
      showToast(t("settings.importSuccess"));
      window.location.href = "/";
    } catch {
      showToast(t("settings.importError"));
    }
  };

  return (
    <PageShell title={t("settings.title")}>
      <section className={styles.section}>
        <label className={styles.field}>
          <span className={styles.label}>{t("settings.nameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={profile.name}
            placeholder={t("settings.namePlaceholder")}
            onChange={(e) => handleProfileChange("name", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("settings.baptismalNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={profile.baptismalName}
            placeholder={t("settings.baptismalNamePlaceholder")}
            onChange={(e) => handleProfileChange("baptismalName", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("settings.praesidiumNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={profile.praesidiumName}
            placeholder={t("settings.praesidiumNamePlaceholder")}
            onChange={(e) => handleProfileChange("praesidiumName", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("settings.parishNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={profile.parishName}
            placeholder={t("settings.parishNamePlaceholder")}
            onChange={(e) => handleProfileChange("parishName", e.target.value)}
          />
        </label>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.languageLabel")}</span>
        <LanguageToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.fontSizeLabel")}</span>
        <FontScaleToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.fontFamilyLabel")}</span>
        <FontFamilyToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.splashLabel")}</span>
        <p className={styles.description}>{t("settings.splashDescription")}</p>
        <SplashToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.shareApp")}</span>
        <p className={styles.description}>{t("settings.shareAppDescription")}</p>
        <ShareButton
          title={t("app.shortName")}
          text={t("settings.shareAppText")}
          url={`${SITE_URL}/?ref=app_share`}
        />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.install")}</span>
        <p className={styles.description}>{t("settings.installDescription")}</p>
        <InstallPromptButton />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.secretaryLink")}</span>
        <p className={styles.description}>{t("settings.secretaryLinkDescription")}</p>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("settings.secretaryLink")}
        </Link>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.exportData")}</span>
        <p className={styles.description}>{t("settings.exportDescription")}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void shareOrDownloadExportedData();
          }}
        >
          {t("settings.exportData")}
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.importData")}</span>
        <p className={styles.description}>{t("settings.importDescription")}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("settings.importData")}
        </button>
        {importFile && <p className={styles.description}>{importFile.name}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className={styles.hiddenFileInput}
          onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
        />
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

      <ConfirmDialog
        open={importFile !== null}
        title={t("settings.importConfirmTitle")}
        body={t("settings.importConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setImportFile(null)}
        onConfirm={handleImportConfirm}
      />

      <p className={styles.versionText}>
        {t("settings.appVersionLabel")} {APP_VERSION}
      </p>
    </PageShell>
  );
}
