"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { PageShell } from "@/components/PageShell";
import { useRoster } from "@/hooks/useRoster";
import { useTranslation } from "@/i18n/useTranslation";
import { OFFICER_ROLES } from "@/lib/monthlyReportUtils";
import type { MemberCounts } from "@/lib/types";
import styles from "./page.module.css";

const WEEKDAY_LABEL_KEYS = [
  "secretaryRoster.weekdaySun",
  "secretaryRoster.weekdayMon",
  "secretaryRoster.weekdayTue",
  "secretaryRoster.weekdayWed",
  "secretaryRoster.weekdayThu",
  "secretaryRoster.weekdayFri",
  "secretaryRoster.weekdaySat",
] as const;

const MEMBER_COUNT_FIELDS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

type Draft = Record<keyof MemberCounts, { name: string; baptismalName: string }>;

const EMPTY_DRAFT: Draft = {
  activeMale: { name: "", baptismalName: "" },
  activeFemale: { name: "", baptismalName: "" },
  praetorium: { name: "", baptismalName: "" },
  auxiliaryMale: { name: "", baptismalName: "" },
  auxiliaryFemale: { name: "", baptismalName: "" },
  adjutorium: { name: "", baptismalName: "" },
};

export default function SecretaryRosterPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    ready,
    roster,
    updateHeader,
    updateRegularMeetingWeekday,
    updateOfficer,
    addMemberEntry,
    removeMemberEntry,
  } = useRoster();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  if (!ready || !roster) {
    return <PageShell title={t("secretaryRoster.title")} wide>{null}</PageShell>;
  }

  const handleAddMember = (category: keyof MemberCounts) => {
    const entry = draft[category];
    if (!entry.name.trim()) return;
    addMemberEntry(category, entry.name.trim(), entry.baptismalName.trim());
    setDraft((prev) => ({ ...prev, [category]: { name: "", baptismalName: "" } }));
  };

  return (
    <PageShell title={t("secretaryRoster.title")} wide>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryRoster.headerSection")}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryRoster.councilAffiliationLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={roster.councilAffiliation}
            placeholder={t("secretaryRoster.councilAffiliationPlaceholder")}
            onChange={(e) => updateHeader({ councilAffiliation: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryRoster.spiritualDirectorNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={roster.spiritualDirectorName}
            onChange={(e) => updateHeader({ spiritualDirectorName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>
            {t("secretaryRoster.spiritualDirectorBaptismalNameLabel")}
          </span>
          <input
            type="text"
            className={styles.input}
            value={roster.spiritualDirectorBaptismalName}
            onChange={(e) => updateHeader({ spiritualDirectorBaptismalName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryRoster.regularMeetingWeekdayLabel")}</span>
          <select
            className={styles.input}
            value={roster.regularMeetingWeekday}
            onChange={(e) => updateRegularMeetingWeekday(Number(e.target.value))}
          >
            <option value={-1}>{t("secretaryRoster.weekdayNotSet")}</option>
            {WEEKDAY_LABEL_KEYS.map((key, index) => (
              <option key={key} value={index}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryRoster.officersSection")}</h2>
        {OFFICER_ROLES.map((role) => {
          const officer = roster.officers.find((o) => o.role === role);
          if (!officer) return null;
          return (
            <div key={role} className={styles.officerRow}>
              <span className={styles.officerRoleLabel}>
                {t(`secretaryRoster.roleLabel.${role}`)}
              </span>
              <label className={styles.field}>
                <span className={styles.label}>{t("secretaryRoster.nameLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={officer.name}
                  onChange={(e) => updateOfficer(role, { name: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t("secretaryRoster.baptismalNameLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={officer.baptismalName}
                  onChange={(e) => updateOfficer(role, { baptismalName: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t("secretaryRoster.appointedDateLabel")}</span>
                <input
                  type="date"
                  className={styles.input}
                  value={officer.appointedDate}
                  onChange={(e) => updateOfficer(role, { appointedDate: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t("secretaryRoster.noteLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={officer.note}
                  onChange={(e) => updateOfficer(role, { note: e.target.value })}
                />
              </label>
            </div>
          );
        })}
      </section>

      <h2 className={styles.sectionTitle}>{t("secretaryRoster.memberCountsSection")}</h2>
      <div className={styles.memberGrid}>
        {MEMBER_COUNT_FIELDS.map(({ key, labelKey }) => (
          <section key={key} className={styles.section}>
            <h3 className={styles.memberCategoryTitle}>
              {t(labelKey)}
              <span className={styles.memberCount}>
                {roster.memberCounts[key]}
                {t("secretaryRoster.memberCountUnit")}
              </span>
            </h3>
            {roster.memberRoster[key].length === 0 ? (
              <p className={styles.memberListEmpty}>{t("secretaryRoster.memberListEmpty")}</p>
            ) : (
              <ul className={styles.memberList}>
                {roster.memberRoster[key].map((entry) => (
                  <li key={entry.id} className={styles.memberItem}>
                    <span className={styles.memberName}>
                      {entry.name}
                      {entry.baptismalName ? ` (${entry.baptismalName})` : ""}
                    </span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeMemberEntry(key, entry.id)}
                    >
                      {t("secretaryRoster.removeMember")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.addRow}>
              <input
                type="text"
                className={styles.input}
                placeholder={t("secretaryRoster.memberNamePlaceholder")}
                value={draft[key].name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: { ...prev[key], name: e.target.value } }))
                }
              />
              <input
                type="text"
                className={styles.input}
                placeholder={t("secretaryRoster.memberBaptismalNamePlaceholder")}
                value={draft[key].baptismalName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], baptismalName: e.target.value },
                  }))
                }
              />
              <button
                type="button"
                className={styles.addButton}
                onClick={() => handleAddMember(key)}
              >
                {t("secretaryRoster.addMemberButton")}
              </button>
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        className={styles.saveButton}
        onClick={() => showToast(t("secretaryRoster.saved"))}
      >
        {t("common.save")}
      </button>
    </PageShell>
  );
}
