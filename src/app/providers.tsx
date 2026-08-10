"use client";

import type { ReactNode } from "react";
import { DisplayPreferencesProvider } from "@/components/DisplayPreferencesProvider";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ScheduleReminderChecker } from "@/components/ScheduleReminderChecker";
import { SplashOverlay } from "@/components/SplashOverlay";
import { StorageBootstrap } from "@/components/StorageBootstrap";
import { StorageFailureNotice } from "@/components/StorageFailureNotice";
import { PlatformChoicePopup } from "@/components/PlatformChoicePopup";
import { ToastProvider } from "@/components/ToastProvider";
import { UpdateAvailableNotice } from "@/components/UpdateAvailableNotice";
import styles from "./providers.module.css";

/**
 * 앱 전역 배선판. "모든 화면에 공통으로 켜져 있어야 하는 것"을 여기 모아 둔다.
 *
 * 파일 첫 줄의 `"use client"` 가 중요하다. `layout.tsx` 는 빌드 때 한 번 실행되는
 * 서버 컴포넌트라 훅이나 브라우저 API 를 쓸 수 없다. 그래서 브라우저에서 살아
 * 움직여야 하는 것들을 전부 이 파일로 옮겨 놓았다.
 *
 * **바깥에 있을수록 더 넓은 범위를 덮는다.** 글자 크기 설정이 가장 바깥인 이유는
 * 스플래시와 온보딩 화면에도 적용돼야 하기 때문이다.
 *
 * 화면을 그리지 않고 일만 하는 것들도 섞여 있다.
 *   StorageBootstrap       — 옛 형식 데이터 보정
 *   StorageFailureNotice   — 저장 실패 알림
 *   ScheduleReminderChecker— 일정 알림 확인
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <DisplayPreferencesProvider>
      <ToastProvider>
        <StorageBootstrap />
        <StorageFailureNotice />
        <div className={styles.noticeStack} data-app-chrome>
          <InAppBrowserNotice />
          <UpdateAvailableNotice />
        </div>
        {/* 일부러 OnboardingGate 의 자식이 아니라 형제로 두었다. 온보딩 게이트는
            하이드레이션이 끝나기 전까지 아무것도 그리지 않기 때문에, 스플래시가
            그 안에 있으면 온보딩 화면을 덮지 못한다. */}
        <SplashOverlay />
        <PlatformChoicePopup />
        {/* 내 정보가 아직 없으면 온보딩 화면을 대신 보여 주는 문지기. */}
        <OnboardingGate>
          <ScheduleReminderChecker />
          {children}
        </OnboardingGate>
      </ToastProvider>
    </DisplayPreferencesProvider>
  );
}
