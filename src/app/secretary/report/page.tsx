"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { PrayerSubmissionImportDialog } from "@/components/PrayerSubmissionImportDialog";
import { SecretaryReportPrintView } from "@/components/SecretaryReportPrintView";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/components/ToastProvider";
import { useHistory } from "@/hooks/useHistory";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { shareOrDownloadFile } from "@/lib/exportData";
import { generateId } from "@/lib/id";
import { buildMonthlyReportRtf } from "@/lib/monthlyReportRtf";
import {
  MAX_ATTENDANCE_SESSIONS,
  OFFICER_ROLES,
  WEEKDAY_LABEL_KEYS,
  addMemberToReport,
  applySubmissionsToPrayerRoll,
  computeAttendanceSummary,
  computeMassCommunion,
  computePrayerCountsFromRoll,
  findPersonInReport,
  formatMonthlyShareText,
  formatYearMonthLabel,
  renamePersonInReport,
  resyncAttendanceSessions,
  resyncNamesFromRoster,
  resyncPrayerRollSessions,
  sessionRangeNumbers,
  type SubmissionDecision,
} from "@/lib/monthlyReportUtils";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import type {
  AgendaItem,
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
  PrayerItemKey,
} from "@/lib/types";
import styles from "./page.module.css";

const MEMBER_COUNT_FIELDS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

const EVANGELIZATION_FIELDS: { key: keyof EvangelizationTallies; labelKey: string }[] = [
  { key: "baptism", labelKey: "secretaryReport.evangelizationBaptism" },
  { key: "returnToFaith", labelKey: "secretaryReport.evangelizationReturn" },
  { key: "activeMember", labelKey: "secretaryReport.evangelizationActiveMember" },
  { key: "praetorium", labelKey: "secretaryReport.evangelizationPraetorium" },
];

const MEMBER_COUNT_BUCKETS = [
  { key: "memberCountsPrevMonth", labelKey: "secretaryReport.prevMonthLabel" },
  { key: "memberCountsThisMonth", labelKey: "secretaryReport.thisMonthLabel" },
  { key: "memberCountsIncrease", labelKey: "secretaryReport.increaseLabel" },
  { key: "memberCountsDecrease", labelKey: "secretaryReport.decreaseLabel" },
] as const satisfies readonly { key: keyof MonthlyReport; labelKey: string }[];

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function SessionTabBar({
  sessions,
  active,
  onSelect,
}: {
  sessions: number[];
  active: number;
  onSelect: (session: number) => void;
}) {
  return (
    <div className={styles.sessionTabs}>
      {sessions.map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.sessionTab} ${n === active ? styles.sessionTabActive : ""}`}
          onClick={() => onSelect(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ReportPageContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { ready: reportsReady, findById, updateReport } = useMonthlyReports();
  const { ready: historyReady } = useHistory();
  const [mode, setMode] = useState<"edit" | "preview">(
    searchParams.get("mode") === "preview" ? "preview" : "edit"
  );
  const report = reportsReady && id ? findById(id) : null;
  const [activeAttendanceSession, setActiveAttendanceSession] = useState(
    report?.sessionRangeStart ?? 0
  );
  const [activePrayerSession, setActivePrayerSession] = useState(report?.sessionRangeStart ?? 0);
  const [pendingRange, setPendingRange] = useState<{ start: number; end: number } | null>(null);
  const [removingAgendaId, setRemovingAgendaId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const start = report?.sessionRangeStart;
    const end = report?.sessionRangeEnd;
    if (start === undefined || end === undefined) return;
    const numbers = sessionRangeNumbers(start, end);
    if (numbers.length === 0) return;
    /* eslint-disable react-hooks/set-state-in-effect -- clamps tab selection when the session range (external, storage-backed) shrinks past it */
    setActiveAttendanceSession((prev) => (numbers.includes(prev) ? prev : numbers[0]));
    setActivePrayerSession((prev) => (numbers.includes(prev) ? prev : numbers[0]));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [report?.sessionRangeStart, report?.sessionRangeEnd]);

  if (!reportsReady || !historyReady) return null;

  if (!report) {
    return <p>{t("secretaryReport.notFound")}</p>;
  }

  const sessionNumbers = sessionRangeNumbers(report.sessionRangeStart, report.sessionRangeEnd);

  const patch = (p: Partial<MonthlyReport>) => updateReport(report.id, p);

  const applySessionRange = (start: number, end: number) => {
    const attendanceRoll = resyncAttendanceSessions(report.attendanceRoll, start, end);
    const prayerRoll = resyncPrayerRollSessions(report.prayerRoll, start, end);
    patch({
      sessionRangeStart: start,
      sessionRangeEnd: end,
      attendanceRoll,
      prayerRoll,
      attendance: computeAttendanceSummary(attendanceRoll),
    });
  };

  /** True when a session holds anything the secretary actually entered — an
      unchecked attendance box or a nonzero prayer count. */
  const sessionHasUserInput = (n: number) =>
    report.attendanceRoll.some((record) => record.sessions[n] === false) ||
    report.prayerRoll.some((entry) => {
      const counts = entry.sessions[n];
      return counts ? Object.values(counts).some((v) => v > 0) : false;
    });

  const handleSessionRangeChange = (
    field: "sessionRangeStart" | "sessionRangeEnd",
    value: string
  ) => {
    // Clearing the field used to collapse the range to 0 and wipe every
    // session's data — hold off until an actual number is typed.
    if (value.trim() === "") return;
    let start = field === "sessionRangeStart" ? toNumber(value) : report.sessionRangeStart;
    let end = field === "sessionRangeEnd" ? toNumber(value) : report.sessionRangeEnd;
    if (end - start + 1 > MAX_ATTENDANCE_SESSIONS) {
      if (field === "sessionRangeStart") {
        end = start + MAX_ATTENDANCE_SESSIONS - 1;
      } else {
        start = end - MAX_ATTENDANCE_SESSIONS + 1;
      }
    }
    const losesData = sessionRangeNumbers(report.sessionRangeStart, report.sessionRangeEnd).some(
      (n) => (n < start || n > end) && sessionHasUserInput(n)
    );
    if (losesData) {
      setPendingRange({ start, end });
    } else {
      applySessionRange(start, end);
    }
  };

  const toggleAttendance = (personId: string, sessionNumber: number) => {
    const attendanceRoll = report.attendanceRoll.map((record) =>
      record.personId === personId
        ? {
            ...record,
            sessions: { ...record.sessions, [sessionNumber]: !record.sessions[sessionNumber] },
          }
        : record
    );
    patch({ attendanceRoll, attendance: computeAttendanceSummary(attendanceRoll) });
  };

  /**
   * One rename updates the roster snapshot and both rolls together. Editing any
   * single one of them used to leave the same person under two different names
   * inside one report.
   */
  const renamePerson = (personId: string, field: "name" | "baptismalName", value: string) => {
    const next = { ...findPersonInReport(report, personId), [field]: value };
    patch(renamePersonInReport(report, personId, next.name, next.baptismalName));
  };

  const handleResyncNames = () => {
    patch(resyncNamesFromRoster(report, storage.getRoster()));
    showToast(t("secretaryReport.resyncNamesDone"));
  };

  const handleAddPerson = () => {
    patch(addMemberToReport(report, "", ""));
  };

  const handleExportRtf = async () => {
    const rtf = buildMonthlyReportRtf(report, language);
    // RTF is 7-bit ASCII by construction (Korean goes out as \u escapes).
    const blob = new Blob([rtf], { type: "application/rtf" });
    const name = report.roster.praesidiumName || t("app.shortName");
    const outcome = await shareOrDownloadFile(blob, `${name}_${report.yearMonth}.rtf`);
    if (outcome === "downloaded") showToast(t("secretaryReport.exportDocumentSaved"));
  };

  const patchPrayerRollCell = (
    personId: string,
    sessionNumber: number,
    itemKey: PrayerItemKey,
    value: string
  ) => {
    const prayerRoll = report.prayerRoll.map((entry) =>
      entry.personId === personId
        ? {
            ...entry,
            sessions: {
              ...entry.sessions,
              [sessionNumber]: { ...entry.sessions[sessionNumber], [itemKey]: toNumber(value) },
            },
          }
        : entry
    );
    patch({ prayerRoll, prayerCounts: computePrayerCountsFromRoll(prayerRoll) });
  };

  const patchTreasury = (
    field: "broughtForward" | "income" | "expense" | "balance" | "expenseBreakdown",
    value: string
  ) => {
    if (field === "expenseBreakdown") {
      patch({ treasury: { ...report.treasury, expenseBreakdown: value } });
      return;
    }
    const next = { ...report.treasury, [field]: toNumber(value) };
    if (field !== "balance") {
      next.balance = next.broughtForward + next.income - next.expense;
    }
    patch({ treasury: next });
  };

  const patchMemberCountBucket = (
    bucket: (typeof MEMBER_COUNT_BUCKETS)[number]["key"],
    key: keyof MemberCounts,
    value: string
  ) => {
    const next = toNumber(value);
    const patched = { [bucket]: { ...report[bucket], [key]: next } } as Partial<MonthlyReport>;
    // Increase/decrease are just the month-over-month delta, so derive them
    // instead of making the secretary fill twelve more boxes by hand. Editing
    // either delta directly still wins — some months need a manual explanation.
    if (bucket === "memberCountsPrevMonth" || bucket === "memberCountsThisMonth") {
      const prev = bucket === "memberCountsPrevMonth" ? next : report.memberCountsPrevMonth[key];
      const now = bucket === "memberCountsThisMonth" ? next : report.memberCountsThisMonth[key];
      const delta = now - prev;
      patched.memberCountsIncrease = {
        ...report.memberCountsIncrease,
        [key]: delta > 0 ? delta : 0,
      };
      patched.memberCountsDecrease = {
        ...report.memberCountsDecrease,
        [key]: delta < 0 ? -delta : 0,
      };
    }
    patch(patched);
  };

  const patchRosterHeader = (
    field: "councilAffiliation" | "spiritualDirectorName" | "spiritualDirectorBaptismalName",
    value: string
  ) => {
    patch({ roster: { ...report.roster, [field]: value } });
  };

  const patchOfficer = (
    role: (typeof OFFICER_ROLES)[number],
    field: "name" | "baptismalName" | "appointedDate" | "note",
    value: string
  ) => {
    patch({
      roster: {
        ...report.roster,
        officers: report.roster.officers.map((officer) =>
          officer.role === role ? { ...officer, [field]: value } : officer
        ),
      },
    });
  };

  const addAgendaItem = () => {
    const item: AgendaItem = {
      id: generateId(),
      status: "실시",
      title: "",
      organizer: "",
      dateTime: "",
      location: "",
      attendanceNote: "",
    };
    patch({ agendaItems: [...report.agendaItems, item] });
  };

  const patchAgendaItem = (itemId: string, field: keyof AgendaItem, value: string) => {
    patch({
      agendaItems: report.agendaItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeAgendaItem = (itemId: string) => {
    patch({ agendaItems: report.agendaItems.filter((item) => item.id !== itemId) });
  };

  if (mode === "preview") {
    return (
      <>
        <div className={styles.previewActions} data-app-chrome>
          <button type="button" className={styles.secondaryButton} onClick={() => setMode("edit")}>
            {t("secretaryReport.edit")}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => window.print()}
          >
            {t("secretaryReport.print")}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              void handleExportRtf();
            }}
          >
            {t("secretaryReport.exportDocument")}
          </button>
          <ShareButton
            title={`${t("app.shortName")} ${formatYearMonthLabel(report.yearMonth, language)}`}
            text={formatMonthlyShareText(report, language)}
          />
        </div>
        <SecretaryReportPrintView report={report} />
      </>
    );
  }

  return (
    <>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretaryReport.backToList")}
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setMode("preview")}>
          {t("secretaryReport.preview")}
        </button>
      </div>
      <p className={styles.autoSaveNotice}>{t("common.autoSaveNotice")}</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.meetingInfoSection")}</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.sessionRangeStartLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.sessionRangeStart}
              onFocus={selectOnFocus}
              onChange={(e) => handleSessionRangeChange("sessionRangeStart", e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.sessionRangeEndLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.sessionRangeEnd}
              onFocus={selectOnFocus}
              onChange={(e) => handleSessionRangeChange("sessionRangeEnd", e.target.value)}
            />
          </label>
        </div>
        <p className={styles.hint}>{t("secretaryReport.maxSessionsHint")}</p>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.meetingWeekdayLabel")}</span>
          <select
            className={styles.input}
            value={report.meetingWeekday}
            onChange={(e) => patch({ meetingWeekday: Number(e.target.value) })}
          >
            <option value={-1}>{t("secretaryRoster.weekdayNotSet")}</option>
            {WEEKDAY_LABEL_KEYS.map((key, index) => (
              <option key={key} value={index}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.meetingTimeLabel")}</span>
          <input
            type="time"
            className={styles.input}
            value={report.meetingTime}
            onChange={(e) => patch({ meetingTime: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.meetingLocationLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={report.meetingLocation}
            onChange={(e) => patch({ meetingLocation: e.target.value })}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.attendanceSection")}</h2>
        <div className={styles.row}>
          <p className={styles.attendanceSummary}>
            {t("secretaryReport.officersPresentLabel")} {report.attendance.officersPresent}/
            {report.attendance.officersTotal}
          </p>
          <p className={styles.attendanceSummary}>
            {t("secretaryReport.membersPresentLabel")} {report.attendance.membersPresent}/
            {report.attendance.membersTotal}
          </p>
        </div>

        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>{t("secretaryReport.attendanceGridSection")}</h3>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleResyncNames}
            >
              {t("secretaryReport.resyncNames")}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleAddPerson}>
              {t("secretaryReport.addPerson")}
            </button>
          </div>
        </div>
        <p className={styles.hint}>{t("secretaryReport.attendanceDefaultHint")}</p>
        <p className={styles.hint}>{t("secretaryReport.nameEditHint")}</p>
        <SessionTabBar
          sessions={sessionNumbers}
          active={activeAttendanceSession}
          onSelect={setActiveAttendanceSession}
        />
        <div className={styles.tableScroll}>
          <table className={styles.sessionTable}>
            <thead>
              <tr>
                <th>{t("secretaryReport.personColumnLabel")}</th>
                <th>{t("secretaryRoster.baptismalNameLabel")}</th>
                <th>{t("secretaryReport.attendance")}</th>
              </tr>
            </thead>
            <tbody>
              {report.attendanceRoll.map((record) => (
                <tr key={record.personId}>
                  <td>
                    <input
                      type="text"
                      className={styles.attendanceNameInput}
                      value={findPersonInReport(report, record.personId).name}
                      aria-label={t("secretaryReport.personColumnLabel")}
                      placeholder={t("secretaryReport.attendanceRowNamePlaceholder")}
                      onChange={(e) => renamePerson(record.personId, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.attendanceNameInput}
                      value={findPersonInReport(report, record.personId).baptismalName}
                      aria-label={t("secretaryRoster.baptismalNameLabel")}
                      onChange={(e) => renamePerson(record.personId, "baptismalName", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.attendanceCheckbox}
                      checked={record.sessions[activeAttendanceSession] ?? true}
                      onChange={() => toggleAttendance(record.personId, activeAttendanceSession)}
                      aria-label={`${record.personLabel || t("secretaryReport.attendanceRowNamePlaceholder")} ${activeAttendanceSession}${t("week.sessionNumberUnit")} ${t("secretaryReport.attendance")}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className={styles.section}>
        <summary className={styles.sectionSummary}>
          <h2 className={styles.sectionTitle}>{t("secretaryReport.rosterSection")}</h2>
        </summary>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryRoster.councilAffiliationLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={report.roster.councilAffiliation}
            onChange={(e) => patchRosterHeader("councilAffiliation", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryRoster.spiritualDirectorNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={report.roster.spiritualDirectorName}
            onChange={(e) => patchRosterHeader("spiritualDirectorName", e.target.value)}
          />
        </label>
        {OFFICER_ROLES.map((role) => {
          const officer = report.roster.officers.find((o) => o.role === role);
          if (!officer) return null;
          return (
            <div key={role} className={styles.officerRow}>
              <span className={styles.officerRoleLabel}>{t(`secretaryRoster.roleLabel.${role}`)}</span>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span className={styles.label}>{t("secretaryRoster.nameLabel")}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={officer.name}
                    onChange={(e) => patchOfficer(role, "name", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t("secretaryRoster.baptismalNameLabel")}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={officer.baptismalName}
                    onChange={(e) => patchOfficer(role, "baptismalName", e.target.value)}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </details>

      <details className={styles.section}>
        <summary className={styles.sectionSummary}>
          <h2 className={styles.sectionTitle}>{t("secretaryReport.memberCountsSection")}</h2>
        </summary>
        {MEMBER_COUNT_FIELDS.map(({ key, labelKey }) => (
          <div key={key} className={styles.memberCountRow}>
            <span className={styles.label}>{t(labelKey)}</span>
            <div className={styles.row}>
              {MEMBER_COUNT_BUCKETS.map((bucket) => (
                <label key={bucket.key} className={styles.field}>
                  <span className={styles.smallLabel}>{t(bucket.labelKey)}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.input}
                    value={report[bucket.key][key]}
                    onFocus={selectOnFocus}
                    onChange={(e) => patchMemberCountBucket(bucket.key, key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </details>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.agendaSection")}</h2>
        {report.agendaItems.map((item) => (
          <div key={item.id} className={styles.agendaRow}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.smallLabel}>{t("secretaryReport.agendaStatusLabel")}</span>
                <select
                  className={styles.input}
                  value={item.status}
                  onChange={(e) => patchAgendaItem(item.id, "status", e.target.value)}
                >
                  <option value="실시">{t("secretaryReport.agendaStatusDone")}</option>
                  <option value="계획">{t("secretaryReport.agendaStatusPlanned")}</option>
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.smallLabel}>{t("secretaryReport.agendaTitleLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={item.title}
                  onChange={(e) => patchAgendaItem(item.id, "title", e.target.value)}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.smallLabel}>{t("secretaryReport.agendaOrganizerLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={item.organizer}
                  onChange={(e) => patchAgendaItem(item.id, "organizer", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.smallLabel}>{t("secretaryReport.agendaDateTimeLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={item.dateTime}
                  onChange={(e) => patchAgendaItem(item.id, "dateTime", e.target.value)}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.smallLabel}>{t("secretaryReport.agendaLocationLabel")}</span>
                <input
                  type="text"
                  className={styles.input}
                  value={item.location}
                  onChange={(e) => patchAgendaItem(item.id, "location", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.smallLabel}>
                  {t("secretaryReport.agendaAttendanceNoteLabel")}
                </span>
                <input
                  type="text"
                  className={styles.input}
                  value={item.attendanceNote}
                  onChange={(e) => patchAgendaItem(item.id, "attendanceNote", e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => setRemovingAgendaId(item.id)}
            >
              {t("secretaryReport.agendaRemove")}
            </button>
          </div>
        ))}
        <button type="button" className={styles.secondaryButton} onClick={addAgendaItem}>
          {t("secretaryReport.agendaAdd")}
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.treasurySection")}</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.broughtForwardLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.treasury.broughtForward}
              onFocus={selectOnFocus}
              onChange={(e) => patchTreasury("broughtForward", e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.incomeLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.treasury.income}
              onFocus={selectOnFocus}
              onChange={(e) => patchTreasury("income", e.target.value)}
            />
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.expenseLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.treasury.expense}
              onFocus={selectOnFocus}
              onChange={(e) => patchTreasury("expense", e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.balanceLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.treasury.balance}
              onFocus={selectOnFocus}
              onChange={(e) => patchTreasury("balance", e.target.value)}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.expenseBreakdownLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.treasury.expenseBreakdown}
            onChange={(e) => patchTreasury("expenseBreakdown", e.target.value)}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.prayerSection")}</h2>
        <div className={styles.row}>
          {PRAYER_ITEMS.map((item) => (
            <p key={item.key} className={styles.attendanceSummary}>
              {t(item.labelKey)} {report.prayerCounts[item.key]}
            </p>
          ))}
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.sundayMassLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.sundayMassTotal}
              onFocus={selectOnFocus}
              onChange={(e) => patch({ sundayMassTotal: toNumber(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryReport.massCommunionResult")}</span>
            <output className={styles.derivedValue}>{computeMassCommunion(report)}</output>
          </label>
        </div>
        <p className={styles.hint}>{t("secretaryReport.sundayMassHint")}</p>

        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>{t("secretaryReport.prayerRollSection")}</h3>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setImportOpen(true)}
          >
            {t("secretaryReport.importOpen")}
          </button>
        </div>
        <SessionTabBar
          sessions={sessionNumbers}
          active={activePrayerSession}
          onSelect={setActivePrayerSession}
        />
        <div className={styles.tableScroll}>
          <table className={styles.sessionTable}>
            <thead>
              <tr>
                <th>{t("secretaryReport.personColumnLabel")}</th>
                {PRAYER_ITEMS.map((item) => (
                  <th key={item.key}>{t(`secretaryReport.prayerAbbrev.${item.key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.prayerRoll.map((entry) => (
                <tr key={entry.personId}>
                  <td>
                    <input
                      type="text"
                      className={styles.attendanceNameInput}
                      value={findPersonInReport(report, entry.personId).name}
                      aria-label={t("secretaryReport.personColumnLabel")}
                      placeholder={t("secretaryReport.attendanceRowNamePlaceholder")}
                      onChange={(e) => renamePerson(entry.personId, "name", e.target.value)}
                    />
                  </td>
                  {PRAYER_ITEMS.map((item) => (
                    <td key={item.key}>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={styles.prayerRollInput}
                        value={entry.sessions[activePrayerSession]?.[item.key] ?? 0}
                        onFocus={selectOnFocus}
                        onChange={(e) =>
                          patchPrayerRollCell(entry.personId, activePrayerSession, item.key, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.instructionsSection")}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.dioceseInstructionsLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.dioceseInstructions}
            onChange={(e) => patch({ dioceseInstructions: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.parishInstructionsLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.parishInstructions}
            onChange={(e) => patch({ parishInstructions: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.councilInstructionsLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.councilInstructions}
            onChange={(e) => patch({ councilInstructions: e.target.value })}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.activitySummarySection")}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.activitySummary")}</span>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder={t("secretaryReport.activitySummaryPlaceholder")}
            value={report.activitySummary}
            onChange={(e) => patch({ activitySummary: e.target.value })}
          />
        </label>
        <h3 className={styles.sectionTitle}>{t("secretaryReport.evangelizationSection")}</h3>
        {EVANGELIZATION_FIELDS.map(({ key, labelKey }) => (
          <div key={key} className={styles.memberCountRow}>
            <span className={styles.label}>{t(labelKey)}</span>
            <div className={styles.row}>
              {(["result", "target"] as const).map((slot) => (
                <label key={slot} className={styles.field}>
                  <span className={styles.smallLabel}>
                    {t(`secretaryReport.evangelization${slot === "result" ? "Result" : "Target"}`)}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.input}
                    value={report.evangelization[key][slot]}
                    onFocus={selectOnFocus}
                    onChange={(e) =>
                      patch({
                        evangelization: {
                          ...report.evangelization,
                          [key]: { ...report.evangelization[key], [slot]: toNumber(e.target.value) },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.cumulativeEvangelizationLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={2}
            value={report.cumulativeEvangelization}
            onChange={(e) => patch({ cumulativeEvangelization: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.otherNotesLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.otherNotes}
            onChange={(e) => patch({ otherNotes: e.target.value })}
          />
        </label>
      </section>

      <PrayerSubmissionImportDialog
        open={importOpen}
        report={report}
        onCancel={() => setImportOpen(false)}
        onApply={(decisions: SubmissionDecision[]) => {
          const prayerRoll = applySubmissionsToPrayerRoll(report.prayerRoll, decisions);
          patch({ prayerRoll, prayerCounts: computePrayerCountsFromRoll(prayerRoll) });
          setImportOpen(false);
          showToast(t("secretaryReport.importApplied"));
        }}
      />

      <ConfirmDialog
        open={pendingRange !== null}
        title={t("secretaryReport.sessionRangeConfirmTitle")}
        body={t("secretaryReport.sessionRangeConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setPendingRange(null)}
        onConfirm={() => {
          if (pendingRange) applySessionRange(pendingRange.start, pendingRange.end);
          setPendingRange(null);
        }}
      />

      <ConfirmDialog
        open={removingAgendaId !== null}
        title={t("secretaryReport.agendaRemoveConfirmTitle")}
        body={t("secretaryReport.agendaRemoveConfirmBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setRemovingAgendaId(null)}
        onConfirm={() => {
          if (removingAgendaId) removeAgendaItem(removingAgendaId);
          setRemovingAgendaId(null);
        }}
      />
    </>
  );
}

export default function SecretaryReportPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("secretaryReport.title")} wide>
      <Suspense fallback={null}>
        <ReportPageContent />
      </Suspense>
    </PageShell>
  );
}
