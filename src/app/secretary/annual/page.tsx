"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AnnualReportPrintView } from "@/components/AnnualReportPrintView";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useAnnualReports } from "@/hooks/useAnnualReports";
import { useTranslation } from "@/i18n/useTranslation";
import { buildAnnualReportRtf } from "@/lib/annualReportRtf";
import { formatAttendanceRatio, refreshAggregate } from "@/lib/annualReportUtils";
import { shareOrDownloadFile } from "@/lib/exportData";
import { generateId } from "@/lib/id";
import { OFFICER_ROLES } from "@/lib/monthlyReportUtils";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import type { AnnualEvent, AnnualEventKind, AnnualReport, TreasuryLine } from "@/lib/types";
import styles from "./page.module.css";

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

const EVENT_KINDS: { kind: AnnualEventKind; labelKey: string }[] = [
  { kind: "event", labelKey: "secretaryAnnual.eventsSection" },
  { kind: "formation", labelKey: "secretaryAnnual.formationsSection" },
  { kind: "other", labelKey: "secretaryAnnual.othersSection" },
];

function AnnualReportContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { showToast } = useToast();
  const { ready, findById, updateReport } = useAnnualReports();
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  if (!ready) return null;
  const report = id ? findById(id) : null;
  if (!report) {
    return (
      <>
        <p>{t("secretaryAnnual.notFound")}</p>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretaryAnnual.backToList")}
        </Link>
      </>
    );
  }

  const patch = (p: Partial<AnnualReport>) => updateReport(report.id, p);
  const agg = report.aggregate;

  const handleRefresh = () => {
    patch(refreshAggregate(report, storage.getMonthlyReports()));
    showToast(t("secretaryAnnual.refreshed"));
  };

  /** Pulls every 주요 사항 row from that year's monthly reports in as events. */
  const handleLoadEvents = () => {
    const months = storage
      .getMonthlyReports()
      .filter((r) => r.yearMonth.startsWith(`${report.year}-`));
    const loaded: AnnualEvent[] = months.flatMap((m) =>
      (m.agendaItems ?? []).map((item) => ({
        id: generateId(),
        kind: "event" as AnnualEventKind,
        title: item.title,
        date: item.dateTime,
        attendance: item.attendanceNote,
      }))
    );
    patch({ events: [...report.events, ...loaded] });
    showToast(t("secretaryAnnual.loadedFromMonthly"));
  };

  const patchEvent = (eventId: string, p: Partial<AnnualEvent>) => {
    patch({ events: report.events.map((e) => (e.id === eventId ? { ...e, ...p } : e)) });
  };

  const patchLine = (
    field: "incomeLines" | "expenseLines",
    lineId: string,
    p: Partial<TreasuryLine>
  ) => {
    patch({ [field]: report[field].map((l) => (l.id === lineId ? { ...l, ...p } : l)) });
  };

  const handleExportRtf = async () => {
    const rtf = buildAnnualReportRtf(report, language);
    const blob = new Blob([rtf], { type: "application/rtf" });
    const name = report.roster.praesidiumName || t("app.shortName");
    const outcome = await shareOrDownloadFile(blob, `${name}_${report.year}_사업보고서.rtf`);
    if (outcome === "downloaded") showToast(t("secretaryReport.exportDocumentSaved"));
  };

  if (mode === "preview") {
    return (
      <>
        <div className={styles.previewActions} data-app-chrome>
          <button type="button" className={styles.secondaryButton} onClick={() => setMode("edit")}>
            {t("secretaryReport.edit")}
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => window.print()}>
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
        </div>
        <AnnualReportPrintView report={report} />
      </>
    );
  }

  return (
    <>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretaryAnnual.backToList")}
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setMode("preview")}>
          {t("secretaryReport.preview")}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleRefresh}>
          {t("secretaryAnnual.refresh")}
        </button>
      </div>
      <p className={styles.autoSaveNotice}>{t("common.autoSaveNotice")}</p>
      <p className={styles.hint}>{t("secretaryAnnual.refreshHint")}</p>
      <p className={styles.hint}>
        {t("secretaryAnnual.monthCountLabel")}: {agg.monthCount}
        {t("secretaryAnnual.monthCountUnit")}
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.basicSection")}</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryAnnual.reportNumberLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              value={report.reportNumber}
              onFocus={selectOnFocus}
              onChange={(e) => patch({ reportNumber: toNumber(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryAnnual.submittedOn")}</span>
            <input
              type="text"
              className={styles.input}
              value={report.submittedOn}
              onChange={(e) => patch({ submittedOn: e.target.value })}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryAnnual.parishNameLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={report.parishName}
            onChange={(e) => patch({ parishName: e.target.value })}
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryAnnual.foundedOn")}</span>
            <input
              type="text"
              className={styles.input}
              value={report.foundedOn}
              onChange={(e) => patch({ foundedOn: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryAnnual.approvedOn")}</span>
            <input
              type="text"
              className={styles.input}
              value={report.approvedOn}
              onChange={(e) => patch({ approvedOn: e.target.value })}
            />
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryAnnual.deputyDirector")}</span>
            <input
              type="text"
              className={styles.input}
              value={report.deputyDirectorName}
              onChange={(e) => patch({ deputyDirectorName: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretaryRoster.baptismalNameLabel")}</span>
            <input
              type="text"
              className={styles.input}
              value={report.deputyDirectorBaptismalName}
              onChange={(e) => patch({ deputyDirectorBaptismalName: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.officersSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryRoster.officersSection")}</th>
                <th>{t("secretaryAnnual.praesidiumAttendance")}</th>
                <th>{t("secretaryAnnual.councilAttendance")}</th>
                <th>{t("secretaryAnnual.officerTransfer")}</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_ROLES.map((role) => {
                const att = report.officerAttendance.find((a) => a.role === role);
                return (
                  <tr key={role}>
                    <th>{t(`secretaryRoster.roleLabel.${role}`)}</th>
                    <td>
                      {formatAttendanceRatio(
                        att?.praesidiumPresent ?? 0,
                        att?.praesidiumTotal ?? 0
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={att?.councilAttendance ?? ""}
                        placeholder="12/12"
                        aria-label={t("secretaryAnnual.councilAttendance")}
                        onChange={(e) =>
                          patch({
                            officerAttendance: report.officerAttendance.map((a) =>
                              a.role === role ? { ...a, councilAttendance: e.target.value } : a
                            ),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={att?.transferNote ?? ""}
                        aria-label={t("secretaryAnnual.officerTransfer")}
                        onChange={(e) =>
                          patch({
                            officerAttendance: report.officerAttendance.map((a) =>
                              a.role === role ? { ...a, transferNote: e.target.value } : a
                            ),
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>
          {t("secretaryAnnual.memberAttendance")}:{" "}
          {formatAttendanceRatio(agg.membersPresent, agg.membersTotal)}
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>{t("secretaryReport.treasurySection")}</h2>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                patch({
                  incomeLines: [
                    ...report.incomeLines,
                    { id: generateId(), label: "", amount: 0 },
                  ],
                })
              }
            >
              {t("secretaryAnnual.addIncomeLine")}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                patch({
                  expenseLines: [
                    ...report.expenseLines,
                    { id: generateId(), label: "", amount: 0 },
                  ],
                })
              }
            >
              {t("secretaryAnnual.addExpenseLine")}
            </button>
          </div>
        </div>
        <p className={styles.hint}>
          {t("secretaryAnnual.broughtForward")} {agg.treasuryBroughtForward.toLocaleString()} ·{" "}
          {t("secretaryAnnual.incomeTotal")} {agg.treasuryIncome.toLocaleString()} ·{" "}
          {t("secretaryAnnual.expenseTotal")} {agg.treasuryExpense.toLocaleString()} ·{" "}
          {t("secretaryReport.balanceLabel")} {agg.treasuryBalance.toLocaleString()}
        </p>
        {(["incomeLines", "expenseLines"] as const).map((field) =>
          report[field].map((line) => (
            <div key={line.id} className={styles.row}>
              <input
                type="text"
                className={styles.input}
                value={line.label}
                placeholder={t("secretaryAnnual.lineLabelPlaceholder")}
                aria-label={t("secretaryAnnual.lineLabelPlaceholder")}
                onChange={(e) => patchLine(field, line.id, { label: e.target.value })}
              />
              <input
                type="number"
                inputMode="numeric"
                className={styles.input}
                value={line.amount}
                onFocus={selectOnFocus}
                aria-label={
                  field === "incomeLines"
                    ? t("secretaryReport.incomeLabel")
                    : t("secretaryReport.expenseLabel")
                }
                onChange={(e) => patchLine(field, line.id, { amount: toNumber(e.target.value) })}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() =>
                  patch({ [field]: report[field].filter((l) => l.id !== line.id) })
                }
              >
                {t("common.delete")}
              </button>
            </div>
          ))
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>{t("secretaryAnnual.eventsSection")}</h2>
          <div className={styles.topActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleLoadEvents}>
              {t("secretaryAnnual.loadFromMonthly")}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                patch({
                  events: [
                    ...report.events,
                    { id: generateId(), kind: "event", title: "", date: "", attendance: "" },
                  ],
                })
              }
            >
              {t("secretaryAnnual.addEvent")}
            </button>
          </div>
        </div>
        {report.events.map((event) => (
          <div key={event.id} className={styles.row}>
            <select
              className={styles.input}
              value={event.kind}
              aria-label={t("secretaryAnnual.eventKindLabel")}
              onChange={(e) => patchEvent(event.id, { kind: e.target.value as AnnualEventKind })}
            >
              {EVENT_KINDS.map(({ kind, labelKey }) => (
                <option key={kind} value={kind}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
            <input
              type="text"
              className={styles.input}
              value={event.title}
              aria-label={t("secretaryReport.agendaTitleLabel")}
              onChange={(e) => patchEvent(event.id, { title: e.target.value })}
            />
            <input
              type="text"
              className={styles.input}
              value={event.date}
              aria-label={t("secretaryReport.agendaDateTimeLabel")}
              onChange={(e) => patchEvent(event.id, { date: e.target.value })}
            />
            <input
              type="text"
              className={styles.input}
              value={event.attendance}
              aria-label={t("secretaryReport.agendaAttendanceNoteLabel")}
              onChange={(e) => patchEvent(event.id, { attendance: e.target.value })}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => patch({ events: report.events.filter((e) => e.id !== event.id) })}
            >
              {t("common.delete")}
            </button>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.operationSection")}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryAnnual.operationNotes")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.operationNotes}
            onChange={(e) => patch({ operationNotes: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryAnnual.issueTitle")}</span>
          <input
            type="text"
            className={styles.input}
            value={report.issueTitle}
            onChange={(e) => patch({ issueTitle: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryAnnual.issueBody")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.issueBody}
            onChange={(e) => patch({ issueBody: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("secretaryAnnual.issueAction")}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.issueAction}
            onChange={(e) => patch({ issueAction: e.target.value })}
          />
        </label>
      </section>
    </>
  );
}

export default function AnnualReportPage() {
  const { t } = useTranslation();
  return (
    <PageShell title={t("secretaryAnnual.title")} wide>
      <Suspense fallback={null}>
        <AnnualReportContent />
      </Suspense>
    </PageShell>
  );
}
