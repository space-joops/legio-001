"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { storage } from "@/lib/storage";
import type { Profile } from "@/lib/types";
import styles from "./OnboardingGate.module.css";

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
  const { t } = useTranslation();
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
        <h1 className={styles.title}>{t("onboarding.title")}</h1>
        <p className={styles.subtitle}>{t("onboarding.subtitle")}</p>

        <label className={styles.field}>
          <span className={styles.label}>{t("settings.nameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={draft.name}
            placeholder={t("settings.namePlaceholder")}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t("settings.baptismalNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={draft.baptismalName}
            placeholder={t("settings.baptismalNamePlaceholder")}
            onChange={(e) => setDraft((d) => ({ ...d, baptismalName: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t("settings.praesidiumNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={draft.praesidiumName}
            placeholder={t("settings.praesidiumNamePlaceholder")}
            onChange={(e) => setDraft((d) => ({ ...d, praesidiumName: e.target.value }))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t("settings.parishNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={draft.parishName}
            placeholder={t("settings.parishNamePlaceholder")}
            onChange={(e) => setDraft((d) => ({ ...d, parishName: e.target.value }))}
          />
        </label>

        <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
          {t("onboarding.start")}
        </button>
      </form>
    </div>
  );
}
