"use client";

import { PageShell } from "@/components/PageShell";
import { useRoster } from "@/hooks/useRoster";
import { useTranslation } from "@/i18n/useTranslation";
import { OFFICER_ROLES } from "@/lib/monthlyReportUtils";
import type { MemberCounts } from "@/lib/types";
import styles from "./page.module.css";

const MEMBER_COUNT_FIELDS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

export default function SecretaryRosterPage() {
  const { t } = useTranslation();
  const { ready, roster, updateHeader, updateOfficer, updateMemberCounts } = useRoster();

  if (!ready || !roster) {
    return <PageShell title={t("secretaryRoster.title")}>{null}</PageShell>;
  }

  return (
    <PageShell title={t("secretaryRoster.title")}>
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryRoster.memberCountsSection")}</h2>
        {MEMBER_COUNT_FIELDS.map(({ key, labelKey }) => (
          <label key={key} className={styles.field}>
            <span className={styles.label}>{t(labelKey)}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={roster.memberCounts[key]}
              onChange={(e) =>
                updateMemberCounts({ [key]: Number.parseInt(e.target.value, 10) || 0 })
              }
            />
          </label>
        ))}
      </section>
    </PageShell>
  );
}
