"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useRoster } from "@/hooks/useRoster";
import { OFFICER_ROLE_LABEL, OFFICER_ROLES, WEEKDAY_LABELS } from "@/lib/monthlyReportUtils";
import type { MemberCounts } from "@/lib/types";
import styles from "./page.module.css";

/**
 * 쁘레시디움 명단 관리 화면(`/secretary/roster`).
 *
 * 여기서 관리하는 것: 쁘레시디움 이름·상급평의회·영적지도자, 간부 4명,
 * 구분별 단원 명부, 주회 요일.
 *
 * 여기서 이름을 고쳐도 **이미 만들어 둔 월례 보고서는 자동으로 바뀌지 않는다.**
 * 보고서는 만들 때 명단을 통째로 복사해 가기 때문이다(그래야 지난달 보고서가
 * 나중에 바뀌지 않는다).
 */
const MEMBER_COUNT_FIELDS: { key: keyof MemberCounts; label: string }[] = [
  { key: "activeMale", label: "행동단원(남)" },
  { key: "activeFemale", label: "행동단원(여)" },
  { key: "praetorium", label: "쁘레또리움 단원" },
  { key: "auxiliaryMale", label: "협조단원(남)" },
  { key: "auxiliaryFemale", label: "협조단원(여)" },
  { key: "adjutorium", label: "아듀또리움 단원" },
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
  const {
    ready,
    roster,
    updateHeader,
    updateRegularMeetingWeekday,
    updateOfficer,
    addMemberEntry,
    removeMemberEntry,
    updateMemberEntry,
  } = useRoster();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [removeTarget, setRemoveTarget] = useState<{
    category: keyof MemberCounts;
    id: string;
  } | null>(null);

  if (!ready || !roster) {
    return <PageShell title="현재 명단 관리" wide>{null}</PageShell>;
  }

  const handleAddMember = (category: keyof MemberCounts) => {
    const entry = draft[category];
    if (!entry.name.trim()) return;
    addMemberEntry(category, entry.name.trim(), entry.baptismalName.trim());
    setDraft((prev) => ({ ...prev, [category]: { name: "", baptismalName: "" } }));
  };

  return (
    <PageShell title="현재 명단 관리" wide>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>쁘레시디움 정보</h2>
        <label className={styles.field}>
          <span className={styles.label}>쁘레시디움 이름</span>
          <input
            type="text"
            className={styles.input}
            value={roster.praesidiumName}
            placeholder="예: 천상은총의 어머니"
            onChange={(e) => updateHeader({ praesidiumName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>소속 평의회</span>
          <input
            type="text"
            className={styles.input}
            value={roster.councilAffiliation}
            placeholder="예: 하늘의 문 Cu."
            onChange={(e) => updateHeader({ councilAffiliation: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>영적지도자 성명</span>
          <input
            type="text"
            className={styles.input}
            value={roster.spiritualDirectorName}
            onChange={(e) => updateHeader({ spiritualDirectorName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>
            영적지도자 세례명
          </span>
          <input
            type="text"
            className={styles.input}
            value={roster.spiritualDirectorBaptismalName}
            onChange={(e) => updateHeader({ spiritualDirectorBaptismalName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>정기 회합 요일</span>
          <select
            className={styles.input}
            value={roster.regularMeetingWeekday}
            onChange={(e) => updateRegularMeetingWeekday(Number(e.target.value))}
          >
            <option value={-1}>미설정</option>
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>간부 명단</h2>
        {OFFICER_ROLES.map((role) => {
          const officer = roster.officers.find((o) => o.role === role);
          if (!officer) return null;
          return (
            <div key={role} className={styles.officerRow}>
              <span className={styles.officerRoleLabel}>
                {OFFICER_ROLE_LABEL[role]}
              </span>
              <label className={styles.field}>
                <span className={styles.label}>성명</span>
                <input
                  type="text"
                  className={styles.input}
                  value={officer.name}
                  onChange={(e) => updateOfficer(role, { name: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>세례명</span>
                <input
                  type="text"
                  className={styles.input}
                  value={officer.baptismalName}
                  onChange={(e) => updateOfficer(role, { baptismalName: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>임명일</span>
                <input
                  type="date"
                  className={styles.input}
                  value={officer.appointedDate}
                  onChange={(e) => updateOfficer(role, { appointedDate: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>참고사항</span>
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

      <h2 className={styles.sectionTitle}>현재 단원 수</h2>
      <div className={styles.memberGrid}>
        {MEMBER_COUNT_FIELDS.map(({ key, label }) => (
          <section key={key} className={styles.section}>
            <h3 className={styles.memberCategoryTitle}>
              {label}
              <span className={styles.memberCount}>
                {roster.memberCounts[key]}
                {"명"}
              </span>
            </h3>
            {roster.memberRoster[key].length === 0 ? (
              <p className={styles.memberListEmpty}>등록된 이름이 없습니다.</p>
            ) : (
              <ul className={styles.memberList}>
                {roster.memberRoster[key].map((entry) => (
                  <li key={entry.id} className={styles.memberItem}>
                    {/* Editable in place: deleting and re-adding to fix a typo
                        would mint a new member id and orphan the rows already
                        recorded against this person in past monthly reports. */}
                    <input
                      type="text"
                      className={styles.memberNameInput}
                      value={entry.name}
                      aria-label="성명"
                      onChange={(e) =>
                        updateMemberEntry(key, entry.id, { name: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      className={styles.memberNameInput}
                      value={entry.baptismalName}
                      aria-label="세례명"
                      onChange={(e) =>
                        updateMemberEntry(key, entry.id, { baptismalName: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => setRemoveTarget({ category: key, id: entry.id })}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.addRow}>
              <input
                type="text"
                className={styles.input}
                aria-label="성명"
                placeholder="이름"
                value={draft[key].name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: { ...prev[key], name: e.target.value } }))
                }
              />
              <input
                type="text"
                className={styles.input}
                aria-label="세례명"
                placeholder="세례명"
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
                이름 추가
              </button>
            </div>
          </section>
        ))}
      </div>

      <p className={styles.autoSaveNotice}>모든 변경 사항은 자동으로 저장됩니다.</p>

      <Link href="/secretary" className={styles.backLink}>
        월례보고서 화면으로
      </Link>

      <ConfirmDialog
        open={removeTarget !== null}
        title="이 이름을 삭제할까요?"
        body="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        danger
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeMemberEntry(removeTarget.category, removeTarget.id);
          setRemoveTarget(null);
        }}
      />
    </PageShell>
  );
}
