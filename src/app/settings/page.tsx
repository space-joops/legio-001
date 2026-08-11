"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FontScaleToggle } from "@/components/FontScaleToggle";
import { ImportDataButton } from "@/components/ImportDataButton";
import { InstallPromptButton } from "@/components/InstallPromptButton";
import { PageShell } from "@/components/PageShell";
import { ShareButton } from "@/components/ShareButton";
import { SHOW_SPLASH_EVENT } from "@/components/SplashOverlay";
import { SplashToggle } from "@/components/SplashToggle";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import {
  resetAllData,
  shareOrDownloadExportedData,
  shareOrDownloadPersonalExport,
} from "@/lib/exportData";
import { SITE_URL } from "@/lib/site";
import { storage, DEFAULT_PROFILE } from "@/lib/storage";
import type { Profile } from "@/lib/types";
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
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [resetOpen, setResetOpen] = useState(false);
  const [backupOverdue, setBackupOverdue] = useState(false);

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

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
    showToast("초기화되었습니다.");
    reloadAfterToast();
  };

  const handleExport = async () => {
    const outcome = await shareOrDownloadExportedData();
    if (outcome === "cancelled") return;
    setBackupOverdue(false);
    if (outcome === "downloaded") showToast("파일이 저장되었습니다.");
  };

  const handleExportPersonal = async () => {
    const outcome = await shareOrDownloadPersonalExport();
    if (outcome === "cancelled") return;
    setBackupOverdue(false);
    if (outcome === "downloaded") showToast("파일이 저장되었습니다.");
  };

  // Offered from inside the reset dialog: the one moment we know for sure the
  // user is about to destroy everything.
  const handleExportBeforeReset = async () => {
    setResetOpen(false);
    await handleExport();
  };

  return (
    <PageShell title="설정">
      <section className={styles.section}>
        <label className={styles.field}>
          <span className={styles.label}>이름</span>
          <input
            type="text"
            className={styles.input}
            value={profile.name}
            placeholder="단원 이름을 입력하세요"
            onChange={(e) => handleProfileChange("name", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>세례명</span>
          <input
            type="text"
            className={styles.input}
            value={profile.baptismalName}
            placeholder="세례명을 입력하세요"
            onChange={(e) => handleProfileChange("baptismalName", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>쁘레시디움 이름</span>
          <input
            type="text"
            className={styles.input}
            value={profile.praesidiumName}
            placeholder="쁘레시디움 이름을 입력하세요"
            onChange={(e) => handleProfileChange("praesidiumName", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>성당명</span>
          <input
            type="text"
            className={styles.input}
            value={profile.parishName}
            placeholder="성당명을 입력하세요"
            onChange={(e) => handleProfileChange("parishName", e.target.value)}
          />
        </label>
        <p className={styles.description}>모든 변경 사항은 자동으로 저장됩니다.</p>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>글자 크기</span>
        <FontScaleToggle />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>시작 화면 성화</span>
        <p className={styles.description}>앱을 열 때와 다른 앱·다른 탭에 갔다가 돌아올 때마다 레지오 마리애 성화를 잠시 보여 줍니다. 화면을 누르면 바로 넘어갑니다.</p>
        <SplashToggle />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => window.dispatchEvent(new Event(SHOW_SPLASH_EVENT))}
        >
          지금 보기
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>앱 공유하기</span>
        <p className={styles.description}>다른 단원에게 이 앱을 소개해 보세요.</p>
        <ShareButton
          title="레지오 활동보고"
          text="레지오 마리애 주간 활동 보고 앱을 함께 써보세요!"
          url={`${SITE_URL}/?ref=app_share`}
        />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>앱 설치하기</span>
        <p className={styles.description}>홈 화면에 앱처럼 설치해서 더 편하게 사용하세요.</p>
        <InstallPromptButton />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            const current = storage.getSettings();
            storage.setSettings({ ...current, hidePlatformChoicePopup: false });
            showToast("앱 설치 안내가 다시 나타납니다.");
            setTimeout(() => { window.location.reload(); }, 1500);
          }}
          style={{ marginTop: "1rem" }}
        >
          앱 설치 안내 다시 보기
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>데이터 내보내기</span>
        {backupOverdue && <p className={styles.backupNotice}>한 달 넘게 내보내기를 하지 않았습니다. 기기를 바꾸거나 앱을 지우면 기록이 사라지니 지금 저장해 두세요.</p>}
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void handleExport();
          }}
        >
          전체 백업 내보내기
        </button>
        <p className={styles.description}>활동 기록과 서기 자료(명단·월례 보고서)를 모두 한 파일에 담습니다.</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void handleExportPersonal();
          }}
        >
          활동 기록만 내보내기
        </button>
        <p className={styles.description}>내 주간 활동 기록과 일정만 담습니다. 서기 자료는 담지 않습니다.</p>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>데이터 가져오기</span>
        <p className={styles.description}>다른 기기에서 내보낸 파일을 불러옵니다. 파일 종류(전체 백업·활동 기록·서기 데이터·월례 보고서)에 따라 그 내용만 바뀝니다.</p>
        <ImportDataButton
          label="데이터 가져오기"
          buttonClassName={styles.secondaryButton}
          reloadTo="/"
        />
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="정말 초기화할까요?"
        body="모든 활동 기록과 설정이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        altLabel="먼저 내보내기(백업)"
        onAlt={() => {
          void handleExportBeforeReset();
        }}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />

      {/* Neither belongs in a member's daily path: the secretary screens are for
          one person, and reset destroys everything. Collapsed at the very end so
          they take a deliberate extra tap. */}
      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>월례보고서(서기용)</h2>
        </summary>
        <p className={styles.description}>쁘레시디움 월례 보고서를 작성하고 인쇄·공유할 수 있습니다.</p>
        <Link href="/secretary" className={styles.secondaryButton}>
          열기
        </Link>
      </details>

      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>데이터 초기화</h2>
        </summary>
        <p className={styles.description}>모든 기록을 삭제하고 처음 상태로 되돌립니다.</p>
        <button type="button" className={styles.dangerButton} onClick={() => setResetOpen(true)}>
          데이터 초기화
        </button>
      </details>


      <details className={styles.advanced}>
        <summary className={styles.advancedSummary}>
          <h2 className={styles.advancedTitle}>실험실</h2>
        </summary>
        <p className={styles.description}>묵주기도를 바칠 때 사용할 수 있는 디지털 묵주입니다.</p>
        <Link href="/lab/rosary" className={styles.secondaryButton}>
          디지털 묵주
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
