import { readU16 } from "./binary";
import { getParaBody, type ParaSlot } from "./paragraph";
import { TAG, type HwpRecord } from "./records";

/**
 * 세나뚜스 양식 제6호 템플릿에서 치환 대상 위치를 찾는다.
 *
 * 레코드 인덱스 하드코딩 대신 매 실행마다 앵커로 locate한다 — 표는 헤더 셀
 * 텍스트로 식별한 뒤 (row, col) 좌표로, 일반 문단은 고정 라벨 정규식으로.
 * 하나라도 못 찾으면 전체 실패로 던진다: 공식 제출 문서라 일부만 치환된
 * 파일이 조용히 나가는 것이 최악의 실패 모드이기 때문이다.
 */

export interface TableSlots {
  rowCount: number;
  colCount: number;
  /** "row,col" → 셀의 첫 문단. 병합 셀은 좌상단 좌표 하나로 온다. */
  cells: Map<string, ParaSlot>;
}

export interface TemplateMap {
  /** "2026 년 7월말 현재   제 1778 차 ~ 제 1782 차" */
  yearMonthSession: ParaSlot;
  /** "1. 주회합 일시 : 매주 목 요일 20 시 10 분  2. 장 소 : …" */
  meeting: ParaSlot;
  /** "3. 출석 : 간부 16 / 20  단원 12 / 15" */
  attendance: ParaSlot;
  /** "4. 간부 명단 : ( 영적지도자 : … )" */
  spiritualDirector: ParaSlot;
  /** "이월금 …원  수입 …원  지출 …원  잔액 …원" */
  treasury: ParaSlot;
  /** "중요 지출 내역 : …" */
  expenseBreakdown: ParaSlot;
  diocese: ParaSlot;
  parish: ParaSlot;
  council: ParaSlot;
  prActivity: ParaSlot;
  evangelization: ParaSlot;
  otherNotes: ParaSlot;
  /** "(평의회) 하늘의 문 Cu. 직속" */
  councilLine: ParaSlot;
  /** "… 쁘레시디움 단장 … (서명)" */
  signature: ParaSlot;
  officersTable: TableSlots;
  memberTable: TableSlots;
  agendaTable: TableSlots;
}

const PARAGRAPH_ANCHORS: Record<
  keyof Omit<TemplateMap, "officersTable" | "memberTable" | "agendaTable">,
  RegExp
> = {
  yearMonthSession: /\d{4}\s*년\s*\d{1,2}월말 현재/,
  meeting: /1\.\s*주회합 일시/,
  attendance: /3\.\s*출\s+석/,
  spiritualDirector: /영적지도자\s*:/,
  treasury: /이월금\s+[\d,]+원/,
  expenseBreakdown: /중요 지출 내역/,
  diocese: /^\*\s*교구 지시사항/,
  parish: /^\*\s*본당 지시사항/,
  council: /^\*\s*상급평의회 지시사항/,
  prActivity: /^\*\s*Pr\.활동사항/,
  evangelization: /선교실적 누계/,
  otherNotes: /9\.\s*기타\(질의 및 건의\)/,
  councilLine: /\(평의회\)/,
  signature: /쁘레시디움\s+단장.*\(서명\)/,
};

/**
 * TABLE 레코드가 예고한 셀 수만큼만 같은 level의 LIST_HEADER를 모은다.
 * "8. 주요 활동" 글상자의 LIST_HEADER(레벨·좌표가 다르다)를 표 셀로
 * 오인하지 않기 위한 방어이기도 하다.
 */
function collectTable(records: HwpRecord[], tableIndex: number): TableSlots | null {
  const table = records[tableIndex];
  if (table.data.length < 18) return null;
  const rowCount = readU16(table.data, 4);
  const colCount = readU16(table.data, 6);
  if (table.data.length < 18 + rowCount * 2) return null;
  let totalCells = 0;
  for (let row = 0; row < rowCount; row += 1) {
    totalCells += readU16(table.data, 18 + row * 2);
  }
  const cells = new Map<string, ParaSlot>();
  let collected = 0;
  for (let i = tableIndex + 1; i < records.length && collected < totalCells; i += 1) {
    if (records[i].level < table.level) break;
    if (records[i].tag !== TAG.LIST_HEADER || records[i].level !== table.level) continue;
    if (records[i].data.length < 16) return null;
    const col = readU16(records[i].data, 8);
    const row = readU16(records[i].data, 10);
    if (col >= colCount || row >= rowCount) return null;
    collected += 1;
    for (let j = i + 1; j < records.length; j += 1) {
      if (records[j].tag === TAG.LIST_HEADER || records[j].level < table.level) break;
      if (records[j].tag === TAG.PARA_HEADER && records[j].level === table.level) {
        cells.set(`${row},${col}`, { header: records[j] });
        break;
      }
    }
  }
  if (collected !== totalCells) return null;
  return { rowCount, colCount, cells };
}

function cellBody(records: HwpRecord[], table: TableSlots, row: number, col: number): string {
  const slot = table.cells.get(`${row},${col}`);
  return slot ? getParaBody(records, slot) : "";
}

export function locateTemplate(records: HwpRecord[]): TemplateMap {
  const missing: string[] = [];
  const found: Partial<Record<keyof TemplateMap, ParaSlot | TableSlots>> = {};

  // 일반 문단: 문서 순서 첫 매치.
  for (const record of records) {
    if (record.tag !== TAG.PARA_HEADER) continue;
    const body = getParaBody(records, { header: record });
    if (!body) continue;
    for (const [key, anchor] of Object.entries(PARAGRAPH_ANCHORS)) {
      if (found[key as keyof TemplateMap]) continue;
      if (anchor.test(body)) {
        found[key as keyof TemplateMap] = { header: record };
        break;
      }
    }
  }

  // 표: 헤더 셀 텍스트로 식별.
  for (let i = 0; i < records.length; i += 1) {
    if (records[i].tag !== TAG.TABLE) continue;
    const table = collectTable(records, i);
    if (!table) continue;
    const topLeft = cellBody(records, table, 0, 0);
    if (!found.officersTable && /직\s*책/.test(topLeft)) {
      found.officersTable = table;
    } else if (!found.memberTable && /구\s*분/.test(topLeft) && /행\s*동/.test(cellBody(records, table, 0, 2))) {
      found.memberTable = table;
    } else if (!found.agendaTable && /구분/.test(topLeft) && /제\s*목/.test(cellBody(records, table, 0, 1))) {
      found.agendaTable = table;
    }
  }

  for (const key of Object.keys(PARAGRAPH_ANCHORS)) {
    if (!found[key as keyof TemplateMap]) missing.push(key);
  }
  for (const key of ["officersTable", "memberTable", "agendaTable"] as const) {
    if (!found[key]) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(`HWP 템플릿에서 다음 위치를 찾지 못했습니다: ${missing.join(", ")}`);
  }
  return found as unknown as TemplateMap;
}
