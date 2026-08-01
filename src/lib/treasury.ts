import { generateId } from "./id";
import { sessionRangeNumbers } from "./monthlyReportUtils";
import type { MonthlyReport, TreasuryExpense, TreasurySessionEntry } from "./types";

/**
 * The treasurer's per-session ledger and the four figures item 7 of the
 * official form asks for.
 *
 * Every submitted report checks out as `이월금 + 수입 − 지출 = 잔액`, and the
 * 중요 지출 내역 line always adds up to the expense total exactly — so once the
 * expenses are recorded item by item, both the total and that line fall out of
 * the same data. Nothing here is typed in twice.
 *
 * The edit screen, the print view and the RTF export all read this module, so
 * the numbers can't drift between what the secretary sees and what is filed.
 */

export interface TreasuryRow {
  sessionNumber: number;
  /** Previous session's closing balance; the month's opening for the first. */
  broughtForward: number;
  offering: number;
  expense: number;
  balance: number;
  expenses: TreasuryExpense[];
}

export interface TreasuryBreakdownLine {
  label: string;
  amount: number;
}

export interface TreasuryLedger {
  rows: TreasuryRow[];
  opening: number;
  income: number;
  expense: number;
  balance: number;
  /** Same item name merged, in the order each first appeared. */
  breakdown: TreasuryBreakdownLine[];
}

/**
 * Won amounts everywhere. The print view and RTF export used to call
 * `.toLocaleString()` with no locale, which made the output depend on the
 * device rather than on the app's language setting.
 */
export function formatWon(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function sumExpenses(expenses: TreasuryExpense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function createTreasurySession(sessionNumber: number): TreasurySessionEntry {
  return { sessionNumber, offering: 0, expenses: [] };
}

export function createTreasuryExpense(label: string, amount: number): TreasuryExpense {
  return { id: generateId(), label, amount };
}

/** Rebuilds the ledger for a new session range, keeping what was entered. */
export function resyncTreasuryLedger(
  ledger: TreasurySessionEntry[],
  sessionStart: number,
  sessionEnd: number
): TreasurySessionEntry[] {
  return sessionRangeNumbers(sessionStart, sessionEnd).map(
    (n) =>
      ledger.find((entry) => entry.sessionNumber === n) ?? createTreasurySession(n)
  );
}

export function computeTreasuryLedger(report: MonthlyReport): TreasuryLedger {
  const opening = report.treasury?.broughtForward ?? 0;
  const ledger = resyncTreasuryLedger(
    report.treasuryLedger ?? [],
    report.sessionRangeStart,
    report.sessionRangeEnd
  );

  let running = opening;
  const rows: TreasuryRow[] = ledger.map((entry) => {
    const broughtForward = running;
    const expense = sumExpenses(entry.expenses);
    running = broughtForward + entry.offering - expense;
    return {
      sessionNumber: entry.sessionNumber,
      broughtForward,
      offering: entry.offering,
      expense,
      balance: running,
      expenses: entry.expenses,
    };
  });

  const breakdown: TreasuryBreakdownLine[] = [];
  for (const entry of ledger) {
    for (const expense of entry.expenses) {
      const label = expense.label.trim();
      if (!label || expense.amount === 0) continue;
      const existing = breakdown.find((line) => line.label === label);
      if (existing) existing.amount += expense.amount;
      else breakdown.push({ label, amount: expense.amount });
    }
  }

  return {
    rows,
    opening,
    income: rows.reduce((total, row) => total + row.offering, 0),
    expense: rows.reduce((total, row) => total + row.expense, 0),
    balance: rows.length > 0 ? rows[rows.length - 1].balance : opening,
    breakdown,
  };
}

/** "(의연금) 70,000원  (꽃값) 20,000원" — the wording used on the form. */
export function formatExpenseBreakdown(breakdown: TreasuryBreakdownLine[]): string {
  return breakdown.map((line) => `(${line.label}) ${formatWon(line.amount)}원`).join("  ");
}

/** The derived half of `treasury`, ready to store next to the ledger. */
export function deriveTreasury(
  report: MonthlyReport,
  ledger: TreasurySessionEntry[]
): MonthlyReport["treasury"] {
  const computed = computeTreasuryLedger({ ...report, treasuryLedger: ledger });
  return {
    broughtForward: computed.opening,
    income: computed.income,
    expense: computed.expense,
    balance: computed.balance,
    expenseBreakdown: formatExpenseBreakdown(computed.breakdown),
  };
}

/** `(의연금) 70,000원  (꽃값) 20,000원` → the two lines it names. */
function parseExpenseBreakdown(text: string): TreasuryExpense[] {
  const expenses: TreasuryExpense[] = [];
  const pattern = /\(([^)]+)\)\s*([\d,]+)\s*원?/g;
  let match = pattern.exec(text);
  while (match !== null) {
    const amount = Number.parseInt(match[2].replace(/,/g, ""), 10);
    if (Number.isFinite(amount) && amount > 0) {
      expenses.push(createTreasuryExpense(match[1].trim(), amount));
    }
    match = pattern.exec(text);
  }
  return expenses;
}

/**
 * Reports written before the ledger existed carry only the four totals. Left
 * alone they would recompute to zero and wipe a month the secretary already
 * filed, so their figures are folded into a first-session ledger entry.
 *
 * Keyed on the field being absent, not empty: a ledger the secretary genuinely
 * cleared must stay cleared.
 */
export function migrateLegacyTreasury(report: MonthlyReport): MonthlyReport {
  if (Array.isArray(report.treasuryLedger)) return report;

  const legacy = report.treasury;
  const income = legacy?.income ?? 0;
  const expense = legacy?.expense ?? 0;
  if (!legacy || (income === 0 && expense === 0)) {
    return { ...report, treasuryLedger: [] };
  }

  const expenses = parseExpenseBreakdown(legacy.expenseBreakdown ?? "");
  // The itemised lines must never disagree with the total that was filed.
  const remainder = expense - sumExpenses(expenses);
  if (remainder > 0) expenses.push(createTreasuryExpense("기타", remainder));

  const firstSession = report.sessionRangeStart;
  return {
    ...report,
    treasuryLedger: [{ sessionNumber: firstSession, offering: income, expenses }],
  };
}
