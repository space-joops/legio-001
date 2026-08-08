"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ActivityEntryDialog } from "@/components/ActivityEntryDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { PrayerSubmissionImportDialog } from "@/components/PrayerSubmissionImportDialog";
import { SecretaryReportPrintView } from "@/components/SecretaryReportPrintView";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/components/ToastProvider";
import { TreasuryExpenseDialog } from "@/components/TreasuryExpenseDialog";
import { useHistory } from "@/hooks/useHistory";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { useTranslation } from "@/i18n/useTranslation";
import { buildActivityLines, personActivityCount } from "@/lib/activityReport";
import { PRAYER_ITEMS } from "@/lib/constants";
import { shareOrDownloadFile } from "@/lib/exportData";
import { generateId } from "@/lib/id";
import {
  buildSinglePageImagePdf,
  canvasToPngBlob,
  captureElementToCanvas,
} from "@/lib/reportCapture";
import {
  MAX_ATTENDANCE_SESSIONS,
  OFFICER_ROLES,
  WEEKDAY_LABEL_KEYS,
  applySubmissionsToPrayerRoll,
  computeAttendanceSummary,
  computeMassCommunion,
  computeSundayMassBasis,
  computePrayerCountsFromRoll,
  findPersonInReport,
  formatMonthlyShareText,
  formatYearMonthLabel,
  markAttendanceFromPrayers,
  resyncAttendanceSessions,
  resyncPrayerRollSessions,
  sessionRangeNumbers,
  syncReportWithRoster,
  type SubmissionDecision,
} from "@/lib/monthlyReportUtils";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import {
  computeTreasuryLedger,
  deriveTreasury,
  formatExpenseBreakdown,
  formatWon,
  resyncTreasuryLedger,
} from "@/lib/treasury";
import type {
  ActivityEntry,
  AgendaItem,
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
  PrayerCounts,
  PrayerItemKey,
  TreasuryExpense,
  TreasurySessionEntry,
} from "@/lib/types";
import styles from "./page.module.css";

/**
 * 월례 보고서 작성·미리보기 화면(`/secretary/report?id=...`).
 *
 * 이 저장소에서 가장 큰 파일이다(1,200줄 남짓). 처음 열면 막막하니 아래 지도를
 * 먼저 보고 필요한 구역으로 바로 내려가는 걸 권한다. 위에서 아래로 이 순서다.
 *
 *   1. 모듈 상수      — MEMBER_COUNT_FIELDS / EVANGELIZATION_FIELDS / MEMBER_COUNT_BUCKETS
 *   2. 작은 헬퍼      — personDisplayName, formatDay, summariseExpenses, toNumber
 *   3. 작은 부품      — CurrencyInput(원화 입력칸), SessionTabBar(회차 탭)
 *   4. ReportPageContent — 실제 화면. 이 안이 다시 아래 순서로 되어 있다
 *        a. 훅과 state (8개 남짓)
 *        b. useEffect 2개 — 회차 탭 범위 보정 / 명단↔보고서 자동 동기화
 *        c. 로딩·없음 처리와 파생값
 *        d. 핸들러 20여 개 — **전부 마지막에 `patch()` 하나로 모인다**
 *        e. 미리보기 모드면 여기서 조기 반환(인쇄·PDF·이미지·공유)
 *        f. 편집 모드 화면 — 회합정보 / 활동보고 / 명단 / 단원수 / 의안 /
 *           재정 / 기도실적 / 활동상세 / 활동요약·복음화 / 다이얼로그 5종
 *   5. SecretaryReportPage — PageShell 과 <Suspense> 로 감싸는 껍데기
 *
 * 읽는 요령: **원본을 고치면 파생값을 다시 계산해 함께 저장한다**는 규칙만
 * 잡고 보면 핸들러들이 거의 같은 모양이라는 게 보인다. (출석부→출석 수,
 * 기도표→기도 합계, 장부→재정 4숫자. `lib/types.ts` 의 MonthlyReport 주석 참고)
 *
 * 계산 로직 자체는 여기 없고 `lib/monthlyReportUtils.ts` 와 `lib/treasury.ts` 에 있다.
 */
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

/** "민경국(마르코)" — one column instead of two, read-only; names are edited
    in 명단 관리 and reach the report through syncReportWithRoster. */
function personDisplayName(person: { name: string; baptismalName: string }): string {
  if (!person.name) return "";
  return person.baptismalName ? `${person.name}(${person.baptismalName})` : person.name;
}

/** "5/29" — enough for the secretary to recognise the window at a glance. */
function formatDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** "의연금 70,000" — with "외 1건" appended when the session had more. */
function summariseExpenses(expenses: TreasuryExpense[], moreSuffix: string): string {
  const [first, ...rest] = expenses;
  if (!first) return "";
  const head = `${first.label} ${formatWon(first.amount)}`;
  return rest.length === 0 ? head : `${head} ${moreSuffix.replace("{n}", String(rest.length))}`;
}

/**
 * Money field. `type="number"` can't show thousands separators, and six- and
 * seven-digit won amounts are hard to read without them for the members this
 * app is built for. Focus selects the whole value (selectOnFocus), so grouping
 * as you type never leaves the caret stranded mid-number.
 */
function CurrencyInput({
  value,
  onChange,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (value: string) => void;
  className: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={value === 0 ? "" : formatWon(value)}
      placeholder="0"
      aria-label={ariaLabel}
      onFocus={selectOnFocus}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
    />
  );
}

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
  // One tab drives the whole 활동보고 table; attendance and prayers used to
  // scroll independently, which let the two halves of one row disagree.
  const [activeSession, setActiveSession] = useState(report?.sessionRangeStart ?? 0);
  const [activityTarget, setActivityTarget] = useState<string | null>(null);
  const [expenseTarget, setExpenseTarget] = useState<number | null>(null);
  // Held in state rather than read per render because the activity dialog can
  // create a catalogue item, and the report lines below have to show it at once.
  const [activityItems, setActivityItems] = useState(() => storage.getActivityItems());
  // Read per render — nothing on this page adds an expense item.
  const expenseItems = storage.getExpenseItems();
  const [pendingRange, setPendingRange] = useState<{ start: number; end: number } | null>(null);
  const [removingAgendaId, setRemovingAgendaId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const start = report?.sessionRangeStart;
    const end = report?.sessionRangeEnd;
    if (start === undefined || end === undefined) return;
    const numbers = sessionRangeNumbers(start, end);
    if (numbers.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamps tab selection when the session range (external, storage-backed) shrinks past it
    setActiveSession((prev) => (numbers.includes(prev) ? prev : numbers[0]));
  }, [report?.sessionRangeStart, report?.sessionRangeEnd]);

  /**
   * Keeps the grid in step with 명단 관리. A report snapshots the roster when
   * it is created, so before this an edit over there never reached a report
   * that already existed and the secretary had to press two buttons. Returns
   * null when nothing differs, which is what stops this from looping.
   */
  useEffect(() => {
    if (!report) return;
    const changes = syncReportWithRoster(report, storage.getRoster());
    if (changes) updateReport(report.id, changes);
  }, [report, updateReport]);

  if (!reportsReady || !historyReady) return null;

  if (!report) {
    return <p>{t("secretaryReport.notFound")}</p>;
  }

  const sessionNumbers = sessionRangeNumbers(report.sessionRangeStart, report.sessionRangeEnd);
  const treasury = computeTreasuryLedger(report);
  // The stored ledger can lag the session range until the next edit; work from
  // the resynced rows so a freshly widened range already has entries to patch.
  const treasuryLedger = treasury.rows.map((row) => ({
    sessionNumber: row.sessionNumber,
    offering: row.offering,
    expenses: row.expenses,
  }));

  const patch = (p: Partial<MonthlyReport>) => updateReport(report.id, p);

  const applySessionRange = (start: number, end: number) => {
    const attendanceRoll = resyncAttendanceSessions(report.attendanceRoll, start, end);
    const prayerRoll = resyncPrayerRollSessions(report.prayerRoll, start, end);
    const treasuryLedger = resyncTreasuryLedger(report.treasuryLedger, start, end);
    patch({
      sessionRangeStart: start,
      sessionRangeEnd: end,
      attendanceRoll,
      prayerRoll,
      attendance: computeAttendanceSummary(attendanceRoll),
      treasuryLedger,
      treasury: deriveTreasury({ ...report, sessionRangeStart: start, sessionRangeEnd: end }, treasuryLedger),
    });
  };

  /** True when a session holds anything the secretary actually entered — a
      ticked attendance box, a prayer number, an activity or a ledger line — so
      narrowing the range past it asks before throwing the work away. */
  const sessionHasUserInput = (n: number) =>
    report.attendanceRoll.some((record) => record.sessions[n] === true) ||
    report.prayerRoll.some((entry) => {
      const counts = entry.sessions[n];
      return counts ? Object.values(counts).some((v) => v > 0) : false;
    }) ||
    report.activityEntries.some((entry) => entry.sessionNumber === n && entry.count > 0) ||
    report.treasuryLedger.some(
      (entry) => entry.sessionNumber === n && (entry.offering > 0 || entry.expenses.length > 0)
    );

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



  /** Renders the hidden A4-width copy of the form to a canvas. */
  const captureReportCanvas = () => {
    const sheet = captureRef.current;
    if (!sheet) return Promise.reject(new Error("capture host not mounted"));
    return captureElementToCanvas(sheet, 2);
  };

  const exportFileName = (ext: string) =>
    `${report.roster.praesidiumName || t("app.shortName")}_${report.yearMonth}.${ext}`;

  const handleExportPdf = async () => {
    try {
      const canvas = await captureReportCanvas();
      const blob = buildSinglePageImagePdf(canvas);
      const outcome = await shareOrDownloadFile(blob, exportFileName("pdf"));
      if (outcome === "downloaded") showToast(t("secretaryReport.pdfSaved"));
    } catch {
      showToast(t("secretaryReport.exportFailed"));
    }
  };

  /**
   * ClipboardItem gets the promise, not the finished blob: Safari only honours
   * clipboard.write() while the tap's user activation is alive, and
   * rasterising first would spend it. Browsers without image clipboard
   * support fall back to saving the PNG as a file.
   */
  const handleCopyImage = () => {
    const blobPromise = captureReportCanvas().then(canvasToPngBlob);
    const fallbackToFile = async () => {
      try {
        const blob = await blobPromise;
        const outcome = await shareOrDownloadFile(blob, exportFileName("png"));
        if (outcome === "downloaded") showToast(t("secretaryReport.imageSaved"));
      } catch {
        showToast(t("secretaryReport.exportFailed"));
      }
    };
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      void fallbackToFile();
      return;
    }
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": blobPromise })])
      .then(() => showToast(t("secretaryReport.imageCopied")))
      .catch(() => void fallbackToFile());
  };

  const activityLines = buildActivityLines(report, activityItems, {
    massCommunion: t("secretaryReport.massCommunionLabel"),
    prayer: Object.fromEntries(PRAYER_ITEMS.map((i) => [i.key, t(i.labelKey)])),
  });
  const sundayBasis = computeSundayMassBasis(
    report.yearMonth,
    report.meetingWeekday,
    report.prayerRoll.length
  );

  const prayerCountsFor = (personId: string, sessionNumber: number): Partial<PrayerCounts> =>
    report.prayerRoll.find((e) => e.personId === personId)?.sessions[sessionNumber] ?? {};

  /**
   * Prayer numbers and attendance move together in one patch.
   *
   * Two separate patches would each capture `report` from this render, so the
   * second would overwrite the first. It also implements the rule that
   * reporting numbers means the member was at the meeting: any nonzero count
   * marks them present, all-zero marks them absent. The checkbox stays live for
   * the cases that don't follow the rule.
   */
  const patchActivityCell = (
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
    const attendanceRoll = markAttendanceFromPrayers(report.attendanceRoll, prayerRoll, [
      { personId, sessionNumber },
    ]);
    patch({
      prayerRoll,
      prayerCounts: computePrayerCountsFromRoll(prayerRoll),
      attendanceRoll,
      attendance: computeAttendanceSummary(attendanceRoll),
    });
  };

  /** Replaces this person's entries for the session with what the dialog returns. */
  const saveActivityEntries = (personId: string, entries: ActivityEntry[]) => {
    const kept = (report.activityEntries ?? []).filter(
      (e) => !(e.personId === personId && e.sessionNumber === activeSession)
    );
    patch({
      activityEntries: [...kept, ...entries.map((e) => ({ ...e, personId }))],
    });
    setActivityTarget(null);
  };

  /**
   * The ledger and the four figures the form asks for have to move together:
   * two patch() calls in one handler both close over this same `report`, so the
   * second would undo the first.
   */
  const patchLedger = (ledger: TreasurySessionEntry[], broughtForward?: number) => {
    const base =
      broughtForward === undefined
        ? report
        : { ...report, treasury: { ...report.treasury, broughtForward } };
    patch({ treasuryLedger: ledger, treasury: deriveTreasury(base, ledger) });
  };

  const patchOffering = (sessionNumber: number, value: string) => {
    patchLedger(
      treasuryLedger.map((entry) =>
        entry.sessionNumber === sessionNumber ? { ...entry, offering: toNumber(value) } : entry
      )
    );
  };

  const saveSessionExpenses = (sessionNumber: number, expenses: TreasuryExpense[]) => {
    patchLedger(
      treasuryLedger.map((entry) =>
        entry.sessionNumber === sessionNumber ? { ...entry, expenses } : entry
      )
    );
    setExpenseTarget(null);
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
            className={styles.secondaryButton}
            onClick={() => {
              void handleExportPdf();
            }}
          >
            {t("secretaryReport.exportPdf")}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleCopyImage}>
            {t("secretaryReport.exportImage")}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => window.print()}
          >
            {t("secretaryReport.print")}
          </button>
          <ShareButton
            title={`${t("app.shortName")} ${formatYearMonthLabel(report.yearMonth, language)}`}
            text={formatMonthlyShareText(report, language)}
          />
        </div>
        <div className={styles.screenPreview}>
          <SecretaryReportPrintView report={report} />
        </div>
        {/* Hidden A4-width copy that the PDF and image buttons rasterise. In
            print it swaps in for the screen preview (see page.module.css), so
            print, PDF, and image all come from the identical one-page layout. */}
        <div className={styles.captureHost} aria-hidden="true">
          <div ref={captureRef} className={styles.captureSheet}>
            <SecretaryReportPrintView report={report} compact />
          </div>
        </div>
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
        <h2 className={styles.sectionTitle}>{t("secretaryReport.activityReportSection")}</h2>
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
          <h3 className={styles.sectionTitle}>{t("secretaryReport.activityReportGrid")}</h3>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setImportOpen(true)}
            >
              {t("secretaryReport.importOpen")}
            </button>
          </div>
        </div>
        <p className={styles.hint}>{t("secretaryReport.activityReportHint")}</p>
        <p className={styles.hint}>{t("secretaryReport.nameEditHint")}</p>
        <SessionTabBar
          sessions={sessionNumbers}
          active={activeSession}
          onSelect={setActiveSession}
        />
        <div className={styles.tableScroll}>
          <table className={styles.sessionTable}>
            <thead>
              <tr>
                <th>{t("secretaryReport.personColumnLabel")}</th>
                {PRAYER_ITEMS.map((item) => (
                  <th key={item.key}>{t(`secretaryReport.prayerAbbrev.${item.key}`)}</th>
                ))}
                <th>{t("secretaryReport.activityColumn")}</th>
                <th>{t("secretaryReport.attendance")}</th>
              </tr>
            </thead>
            <tbody>
              {report.attendanceRoll.map((record) => {
                const person = findPersonInReport(report, record.personId);
                const counts = prayerCountsFor(record.personId, activeSession);
                const activityCount = personActivityCount(report, record.personId, activeSession);
                return (
                  <tr key={record.personId}>
                    <th scope="row" className={styles.personCell}>
                      {personDisplayName(person)}
                    </th>
                    {PRAYER_ITEMS.map((item) => (
                      <td key={item.key}>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={styles.prayerRollInput}
                          value={counts[item.key] ?? 0}
                          onFocus={selectOnFocus}
                          aria-label={`${person.name} ${t(item.labelKey)}`}
                          onChange={(e) =>
                            patchActivityCell(
                              record.personId,
                              activeSession,
                              item.key,
                              e.target.value
                            )
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className={styles.activityButton}
                        onClick={() => setActivityTarget(record.personId)}
                        aria-label={`${person.name} ${t("secretaryReport.activityColumn")}`}
                      >
                        {activityCount > 0 ? activityCount : "+"}
                      </button>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className={styles.attendanceCheckbox}
                        checked={record.sessions[activeSession] ?? false}
                        onChange={() => toggleAttendance(record.personId, activeSession)}
                        aria-label={`${person.name || t("secretaryReport.attendanceRowNamePlaceholder")} ${activeSession}${t("week.sessionNumberUnit")} ${t("secretaryReport.attendance")}`}
                      />
                    </td>
                  </tr>
                );
              })}
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
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>{t("secretaryReport.treasurySection")}</h2>
          <Link href="/secretary/expense-items" className={styles.secondaryButton}>
            {t("secretaryReport.manageExpenseItems")}
          </Link>
        </div>
        <p className={styles.hint}>{t("secretaryReport.treasuryHint")}</p>

        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.broughtForwardLabel")}</span>
          <CurrencyInput
            value={report.treasury.broughtForward}
            className={styles.input}
            ariaLabel={t("secretaryReport.broughtForwardLabel")}
            onChange={(value) => patchLedger(treasuryLedger, toNumber(value))}
          />
        </label>

        <div className={styles.tableScroll}>
          <table className={`${styles.sessionTable} ${styles.treasuryTable}`}>
            <thead>
              <tr>
                <th>{t("secretaryReport.sessionColumn")}</th>
                <th>{t("secretaryReport.offeringColumn")}</th>
                <th>{t("secretaryReport.expenseLabel")}</th>
                <th>{t("secretaryReport.balanceLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {treasury.rows.map((row) => (
                <tr key={row.sessionNumber}>
                  <th scope="row">{row.sessionNumber}</th>
                  <td>
                    <CurrencyInput
                      value={row.offering}
                      className={styles.moneyInput}
                      ariaLabel={`${row.sessionNumber}${t("week.sessionNumberUnit")} ${t("secretaryReport.offeringColumn")}`}
                      onChange={(value) => patchOffering(row.sessionNumber, value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.expenseButton}
                      aria-label={`${row.sessionNumber}${t("week.sessionNumberUnit")} ${t("secretaryReport.expenseLabel")}`}
                      onClick={() => setExpenseTarget(row.sessionNumber)}
                    >
                      {row.expenses.length === 0 ? (
                        "+"
                      ) : (
                        <>
                          {/* A phone has no room for both; the item names are
                              spelled out in 중요 지출 내역 just below. */}
                          <span className={styles.expenseNamed}>
                            {summariseExpenses(row.expenses, t("secretaryReport.expenseMoreSuffix"))}
                          </span>
                          <span className={styles.expenseAmountOnly}>{formatWon(row.expense)}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className={styles.moneyCell}>{formatWon(row.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t("secretaryReport.treasuryTotalRow")}</th>
                <td className={styles.moneyCell}>{formatWon(treasury.income)}</td>
                <td className={styles.moneyCell}>{formatWon(treasury.expense)}</td>
                <td className={styles.moneyCell}>{formatWon(treasury.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <span className={styles.label}>{t("secretaryReport.expenseBreakdownLabel")}</span>
        <output className={styles.autoLine}>
          {formatExpenseBreakdown(treasury.breakdown) || "-"}
        </output>
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
        {sundayBasis && (
          <p className={styles.hint}>
            {t("secretaryReport.sundayMassBasis")}: {formatDay(sundayBasis.from)} ~{" "}
            {formatDay(sundayBasis.to)} · {t("secretaryReport.sundayCountLabel")}{" "}
            {sundayBasis.sundayCount} × {sundayBasis.peopleCount}
            {t("secretaryRoster.memberCountUnit")} = {sundayBasis.total}
          </p>
        )}

      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.activityDetailSection")}</h2>
        <p className={styles.hint}>{t("secretaryReport.autoLineHint")}</p>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.dioceseInstructionsLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.dioceseInstructions}
            onChange={(e) => patch({ dioceseInstructions: e.target.value })}
          />
        </label>
        <output className={styles.autoLine}>{activityLines.diocese}</output>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryReport.parishInstructionsLabel")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.parishInstructions}
            onChange={(e) => patch({ parishInstructions: e.target.value })}
          />
        </label>
        <output className={styles.autoLine}>{activityLines.parish}</output>
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
        <output className={styles.autoLine}>{activityLines.praesidium}</output>
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

      <ActivityEntryDialog
        open={activityTarget !== null}
        personLabel={activityTarget ? findPersonInReport(report, activityTarget).name : ""}
        sessionNumber={activeSession}
        items={activityItems}
        entries={(report.activityEntries ?? []).filter(
          (e) => e.personId === activityTarget && e.sessionNumber === activeSession
        )}
        onClose={() => setActivityTarget(null)}
        onSave={(entries) => activityTarget && saveActivityEntries(activityTarget, entries)}
        onItemsChange={setActivityItems}
      />

      <TreasuryExpenseDialog
        open={expenseTarget !== null}
        sessionNumber={expenseTarget ?? 0}
        items={expenseItems}
        expenses={
          treasuryLedger.find((entry) => entry.sessionNumber === expenseTarget)?.expenses ?? []
        }
        onClose={() => setExpenseTarget(null)}
        onSave={(expenses) =>
          expenseTarget !== null && saveSessionExpenses(expenseTarget, expenses)
        }
      />

      <PrayerSubmissionImportDialog
        open={importOpen}
        report={report}
        onCancel={() => setImportOpen(false)}
        onApply={(decisions: SubmissionDecision[]) => {
          const prayerRoll = applySubmissionsToPrayerRoll(report.prayerRoll, decisions);
          // A pasted report is a report — it marks the member present for the
          // sessions it covers, same as typing the numbers by hand would.
          const attendanceRoll = markAttendanceFromPrayers(
            report.attendanceRoll,
            prayerRoll,
            decisions.map((d) => ({ personId: d.personId, sessionNumber: d.sessionNumber }))
          );
          patch({
            prayerRoll,
            prayerCounts: computePrayerCountsFromRoll(prayerRoll),
            attendanceRoll,
            attendance: computeAttendanceSummary(attendanceRoll),
          });
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
