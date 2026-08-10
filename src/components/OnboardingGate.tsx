"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { storage } from "@/lib/storage";
import type { Profile } from "@/lib/types";
import styles from "./OnboardingGate.module.css";

/**
 * 내 정보가 아직 비어 있으면 앱 대신 첫 설정 화면을 보여 주는 문지기.
 *
 * 이름·쁘레시디움 같은 값은 주간 보고를 만들 때 그 안에 복사돼 들어간다.
 * 그래서 비어 있는 채로 기록을 시작하면 나중에 누구 보고서인지 알 수 없게 된다.
 *
 * 하이드레이션이 끝나기 전에는 아무것도 그리지 않는다. 저장소를 읽기 전에
 * 판단하면 이미 설정을 마친 사람에게도 온보딩이 잠깐 번쩍이기 때문이다.
 */

function isProfileComplete(profile: Profile): boolean {
  return Boolean(
    profile.name.trim() &&
      profile.baptismalName.trim() &&
      profile.praesidiumName.trim() &&
      profile.parishName.trim()
  );
}

export function OnboardingGate({ children }: { children: ReactNode }) {
  const ready = useLocalStorageReady();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>({
    name: "",
    baptismalName: "",
    praesidiumName: "",
    parishName: "",
  });

  useEffect(() => {
    if (!ready) return;
    const loaded = storage.getProfile();
    // Seeds local state from localStorage once the client has hydrated.
    /* eslint-disable react-hooks/set-state-in-effect */
    setProfile(loaded);
    setDraft(loaded);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready]);

  if (!ready || !profile) return null;

  if (isProfileComplete(profile)) {
    return <>{children}</>;
  }

  const canSubmit = isProfileComplete(draft);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const next: Profile = {
      name: draft.name.trim(),
      baptismalName: draft.baptismalName.trim(),
      praesidiumName: draft.praesidiumName.trim(),
      parishName: draft.parishName.trim(),
    };
    storage.setProfile(next);
    setProfile(next);
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>시작하기 전에</h1>
        <p className={styles.subtitle}>레지오 마리애 주간 활동 보고를 사용하려면 아래 정보를 입력해 주세요.</p>

        <label className={styles.field}>
          <span className={styles.label}>이름</span>
          <input
            type="text"
            className={styles.input}
            value={draft.name}
            placeholder="단원 이름을 입력하세요"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>세례명</span>
          <input
            type="text"
            className={styles.input}
            value={draft.baptismalName}
            placeholder="세례명을 입력하세요"
            onChange={(e) => setDraft((d) => ({ ...d, baptismalName: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>쁘레시디움 이름</span>
          <input
            type="text"
            className={styles.input}
            value={draft.praesidiumName}
            placeholder="쁘레시디움 이름을 입력하세요"
            onChange={(e) => setDraft((d) => ({ ...d, praesidiumName: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>성당명</span>
          <input
            type="text"
            className={styles.input}
            value={draft.parishName}
            placeholder="성당명을 입력하세요"
            onChange={(e) => setDraft((d) => ({ ...d, parishName: e.target.value }))}
          />
        </label>

        <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
          시작하기
        </button>
      </form>
    </div>
  );
}
