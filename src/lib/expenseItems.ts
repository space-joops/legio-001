import { generateId } from "./id";
import type { ExpenseItem } from "./types";

/**
 * Names offered when recording an expense, so the treasurer picks 의연금
 * instead of typing it on a phone every month. Anything not on the list can
 * still be typed in directly, and the list itself is editable (지출 항목 관리).
 *
 * Unlike the activity catalogue these have no stable key — a recorded expense
 * keeps its own copy of the label, so this list only ever affects new entries.
 */
const SEED_LABELS = ["의연금", "꽃값", "성물비", "교육비", "경조사비", "다과비"];

export function createDefaultExpenseItems(): ExpenseItem[] {
  return SEED_LABELS.map((label, index) => ({
    id: label,
    label,
    order: index,
    hidden: false,
  }));
}

export function createExpenseItem(label: string, order: number): ExpenseItem {
  return { id: generateId(), label, order, hidden: false };
}

export function sortExpenseItems(items: ExpenseItem[]): ExpenseItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function selectableExpenseItems(items: ExpenseItem[]): ExpenseItem[] {
  return sortExpenseItems(items).filter((item) => !item.hidden);
}
