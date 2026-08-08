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
import { SHOW_SPLASH_EVENT } from "@/components/SplashOverlay";
import { SplashToggle } from "@/components/SplashToggle";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { useTranslation } from "@/i18n/useTranslation";
import {
  importExportedData,
  inspectImportFile,
  resetAllData,
  shareOrDownloadExportedData,
  type ImportSummary,
} from "@/lib/exportData";
import { formatMeetingDateTime } from "@/lib/reportUtils";
import { SITE_URL } from "@/lib/site";
import { storage, DEFAULT_PROFILE } from "@/lib/storage";
import type { ExportedData, Profile } from "@/lib/types";
import { APP_VERSION, BUILD_TIME, formatBuildStamp } from "@/lib/version";
import styles from "./page.module.css";

/**
 * 설정 화면(`/settings`). 이 앱에서 화면 하나가 가장 많은 일을 하는 곳이다.
 *
 *   - 내 정보(이름·세례명·쁘레시디움·본당)
 *   - 서기 기능 입구
 *   - 언어 / 글자 크기 / 글꼴 / 스플래시
 *   - 앱 설치, 데이터 내보내기·가져오기·초기화, 버전 표시
 *
 * 데이터가 기기 안에만 있으므로 "내보내기"가 사실상 유일한 백업 수단이다.
 * 그래서 한동안 백업하지 않았으면 안내를 띄우고, 초기화 전에도 백업을 권한다.
 */

/** 잃을 게 생길 만큼 기록이 쌓인 뒤에야 백업하라고 권한다(30일). */
const BACKUP_REMINDER_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export default function SettingsPage() {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [resetOpen, setResetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [backupOverdue, setBackupOverdue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated */
    setProfile(storage.getProfile());
    const lastExportedAt = storage.getLastExportedAt();
    const hasRecords = storage.getHistory().length > 0;
    setBackupOverdue(hasRecords && Date.now() - lastExportedAt > BACKUP_REMINDER_AFTER_MS);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready]);

  const handleProfileChange = (field: keyof Profile, value: string) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    storage.setProfile(next);
  };

  // The full reload wipes React state, so give the success toast a moment on
  // screen first — reloading immediately used to swallow it before anyone read it.
  const reloadAfterToast = () => {
    window.setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  const clearFileInput = () => {
    setImportFile(null);
    setImportSummary(null);
    // Without this, re-picking the same file fires no change event and the
    // button appears dead.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    showToast(t("settings.resetDone"));
    reloadAfterToast();
  };

  // Validate up front so a wrong file is caught before the confirm dialog, and
  // so the dialog can describe what is actually about to overwrite everything.
  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      clearFileInput();
      showToast(t("settings.importError"));
      return;
    }
    const check = inspectImportFile(parsed);
    if (!check.ok) {
      clearFileInput();
      showToast(
        check.reason === "futureVersion"
          ? t("settings.importFutureVersion")
          : t("settings.importError")
      );
      return;
    }
    setImportFile(file);
    setImportSummary(check.summary);
  };

  const handleImportConfirm = async () => {
    const file = importFile;
    clearFileInput();
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<ExportedData>;
      importExportedData(data);
      showToast(t("settings.importSuccess"));
      reloadAfterToast();
    } catch {
      showToast(t("settings.importError"));
    }
  };

  const handleExport = async () => {
    const outcome = await shareOrDownloadExportedData();
    if (outcome === "cancelled") return;
    setBackupOverdue(false);
    if (outcome === "downloaded") showToast(t("settings.exportSaved"));
  };

  // Offered from inside the reset dialog: the one moment we know for sure the
  // user is about to destroy everything.
  const handleExportBeforeReset = async () => {
    setResetOpen(false);
    await handleExport();
  };

  const importSummaryText = importSummary
    ? [
        importSummary.memberName,
        importSummary.exportedAt
          ? formatMeetingDateTime(importSummary.exportedAt, language)
          : "",
        `${t("history.title")} ${importSummary.historyCount}`,
        `${t("secretary.listTitle")} ${importSummary.monthlyReportCount}`,
        `${t("secretaryRoster.memberCountsSection")} ${importSummary.rosterMemberCount}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

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
        <p className={styles.description}>{t("common.autoSaveNotice")}</p>
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
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => window.dispatchEvent(new Event(SHOW_SPLASH_EVENT))}
        >
          {t("settings.splashPreview")}
        </button>
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
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            const current = storage.getSettings();
            storage.setSettings({ ...current, hidePlatformChoicePopup: false });
            showToast(t("settings.resetPlatformChoiceDone"));
            setTimeout(() => { window.location.reload(); }, 1500);
          }}
          style={{ marginTop: "1rem" }}
        >
          {t("settings.resetPlatformChoice")}
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t("settings.exportData")}</span>
        <p className={styles.description}>{t("settings.exportDescription")}</p>
        {backupOverdue && <p className={styles.backupNotice}>{t("settings.backupOverdue")}</p>}
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void handleExport();
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
          onChange={(e) => {
            void handleFilePicked(e.target.files?.[0]);
          }}
        />
      </section>

      <ConfirmDialog
        open={resetOpen}
        title={t("settings.resetConfirmTitle")}
        body={t("settings.resetConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        altLabel={t("settings.exportBeforeReset")}
        onAlt={() => {
          void handleExportBeforeReset();
        }}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />

      <ConfirmDialog
        open={importFile !== null}
        title={t("settings.importConfirmTitle")}
        body={t("settings.importConfirmBody")}
        detail={importSummaryText}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={clearFileInput}
        onConfirm={handleImportConfirm}
      />

      {/* Neither belongs in a member's daily path: the secretary screens are for
          one person, and reset destroys everything. Collapsed at the very end so
          they take a deliberate extra tap. */}
      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>{t("settings.secretaryLink")}</h2>
        </summary>
        <p className={styles.description}>{t("settings.secretaryLinkDescription")}</p>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretary.open")}
        </Link>
      </details>

      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>{t("settings.resetData")}</h2>
        </summary>
        <p className={styles.description}>{t("settings.resetDescription")}</p>
        <button type="button" className={styles.dangerButton} onClick={() => setResetOpen(true)}>
          {t("settings.resetData")}
        </button>
      </details>


      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>{t("lab.title")}</h2>
        </summary>
        <p className={styles.description}>{t("lab.digitalRosaryDescription")}</p>
        <Link href="/lab/rosary" className={styles.secondaryButton}>
          {t("lab.digitalRosary")}
        </Link>
      </details>

      {/* One line, no labels: "v0.6.0(20260802120712) https://legio.diginori.com".
          It gets read out over the phone when something looks wrong. */}
      <p className={styles.versionText}>
        <span>
          v{APP_VERSION}
          {BUILD_TIME && `(${formatBuildStamp(BUILD_TIME)})`}
        </span>{" "}
        <a href={SITE_URL} className={styles.siteLink}>
          {SITE_URL}
        </a>
      </p>
    </PageShell>
  );
}
