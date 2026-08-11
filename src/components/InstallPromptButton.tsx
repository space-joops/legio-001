"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import styles from "./InstallPromptButton.module.css";

/** 설정 화면의 "홈 화면에 추가" 버튼. 눌릴 수 있는지는 `useInstallPrompt` 가 판단한다. */

export function InstallPromptButton() {
  const { canInstall, installed, isIos, isAndroid, promptInstall } = useInstallPrompt();

  if (installed) {
    return <p className={styles.installed}>이미 설치되어 있습니다.</p>;
  }

  if (isIos) {
    return (
      <p className={styles.hint}>
        {"iOS에서는 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택하세요."}
      </p>
    );
  }

  if (canInstall) {
    return (
      <button type="button" className={styles.button} onClick={promptInstall}>
        앱 설치하기
      </button>
    );
  }

  if (isAndroid) {
    return (
      <p className={styles.hint}>
        {"안드로이드에서는 브라우저 메뉴(⋮)에서 '홈 화면에 추가' 또는 '앱 설치'를 선택하세요."}
      </p>
    );
  }

  return (
    <p className={styles.hint}>
      {"이 브라우저에서는 설치 안내가 나타나지 않습니다. 브라우저 메뉴의 '홈 화면에 추가'를 이용해 주세요."}
    </p>
  );
}
