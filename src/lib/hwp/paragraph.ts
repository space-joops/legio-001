import { concatBytes, readU16, readU32, utf16leEncode, writeU32 } from "./binary";
import { TAG, type HwpRecord } from "./records";

/**
 * 문단 텍스트 치환 엔진.
 *
 * 문단 하나는 PARA_HEADER 뒤에 (있다면) PARA_TEXT와 PARA_CHAR_SHAPE가
 * 한 단계 깊은 level로 따라오는 구조다. 이 파일의 규칙:
 *
 * - PARA_TEXT = [선두 컨트롤 블록(각 8 wchar, 바이트 그대로 보존)] + 본문 + CR.
 *   body 좌표계는 컨트롤 블록과 CR을 제외한 본문 기준이다.
 * - PARA_HEADER 첫 u32 = 문자 수(CR 포함, 컨트롤 블록은 8자). 최상위 비트는
 *   셀 마지막 문단 표시라 보존하고 하위 31bit만 갱신한다.
 * - PARA_CHAR_SHAPE = (u32 위치, u32 charShapeId) 쌍 배열. 길이가 변하면
 *   수정 지점 뒤의 위치를 시프트한다.
 * - 빈 문단(nChars=1)은 PARA_TEXT 레코드 자체가 없다. 값을 넣으면 만들고,
 *   본문을 비우면 다시 없앤다(템플릿 관례와 동일).
 *
 * 슬롯은 레코드 배열 인덱스가 아니라 PARA_HEADER 레코드 객체를 쥔다 —
 * PARA_TEXT 삽입/삭제로 배열이 밀려도 참조는 그대로 유효하다.
 */

export interface ParaSlot {
  header: HwpRecord;
}

export interface ParaEdit {
  /** body 좌표(선두 컨트롤 블록 제외) 기준 시작 오프셋. */
  start: number;
  /** body 좌표 기준 끝 오프셋(exclusive). */
  end: number;
  text: string;
}

const CR = 0x0d;
const LF = 0x0a;
/** 8 wchar를 차지하는 인라인/확장 컨트롤의 문자 코드 (HWP 5.0 표 55). */
const BLOCK_CONTROL_CODES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
]);
const CR_BYTES = new Uint8Array([CR, 0]);

interface DecodedParaText {
  /** 선두 컨트롤 블록들의 원본 바이트. */
  prefix: Uint8Array;
  body: string;
  /** 본문 중간에 8 wchar 컨트롤이 있거나 CR이 끝이 아니면 false — 치환 금지. */
  editable: boolean;
}

const EMPTY_TEXT: DecodedParaText = {
  prefix: new Uint8Array(0),
  body: "",
  editable: true,
};

function decodeParaText(data: Uint8Array): DecodedParaText {
  const wcharCount = Math.floor(data.length / 2);
  let i = 0;
  while (i + 8 <= wcharCount && BLOCK_CONTROL_CODES.has(readU16(data, i * 2))) {
    i += 8;
  }
  const prefix = data.slice(0, i * 2);
  let body = "";
  let editable = data.length % 2 === 0;
  let sawTrailingCr = false;
  while (i < wcharCount) {
    const code = readU16(data, i * 2);
    if (code === CR) {
      sawTrailingCr = i === wcharCount - 1;
      if (!sawTrailingCr) editable = false;
      i += 1;
      continue;
    }
    if (BLOCK_CONTROL_CODES.has(code)) {
      // 본문 중간의 컨트롤 — 텍스트는 건너뛰고 문단은 수정 불가로 표시.
      editable = false;
      i += 8;
      continue;
    }
    body += String.fromCharCode(code);
    i += 1;
  }
  if (!sawTrailingCr) editable = false;
  return { prefix, body, editable };
}

interface ParaParts {
  headerIndex: number;
  textIndex: number;
  shapeIndex: number;
}

function findParts(records: HwpRecord[], slot: ParaSlot): ParaParts {
  const headerIndex = records.indexOf(slot.header);
  if (headerIndex < 0 || slot.header.tag !== TAG.PARA_HEADER) {
    throw new Error("HWP: 문단 슬롯이 레코드 배열에 없습니다");
  }
  const level = slot.header.level;
  let textIndex = -1;
  let shapeIndex = -1;
  for (let i = headerIndex + 1; i < records.length && records[i].level > level; i += 1) {
    if (records[i].level !== level + 1) continue;
    if (records[i].tag === TAG.PARA_TEXT && textIndex < 0) textIndex = i;
    if (records[i].tag === TAG.PARA_CHAR_SHAPE && shapeIndex < 0) shapeIndex = i;
  }
  return { headerIndex, textIndex, shapeIndex };
}

function decodeSlot(records: HwpRecord[], parts: ParaParts): DecodedParaText {
  return parts.textIndex < 0 ? EMPTY_TEXT : decodeParaText(records[parts.textIndex].data);
}

/** 앵커 매칭·치환 계산에 쓰는 본문(컨트롤 블록·CR 제외). */
export function getParaBody(records: HwpRecord[], slot: ParaSlot): string {
  return decodeSlot(records, findParts(records, slot)).body;
}

export function isParaEditable(records: HwpRecord[], slot: ParaSlot): boolean {
  return decodeSlot(records, findParts(records, slot)).editable;
}

function assertCleanText(text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 32 && code !== LF) {
      throw new Error(`HWP: 치환 텍스트에 허용되지 않는 제어문자(${code})가 있습니다`);
    }
  }
}

function readShapePairs(data: Uint8Array): Array<[number, number]> {
  if (data.length % 8 !== 0) {
    throw new Error("HWP: PARA_CHAR_SHAPE 길이가 8의 배수가 아닙니다");
  }
  const pairs: Array<[number, number]> = [];
  for (let offset = 0; offset < data.length; offset += 8) {
    pairs.push([readU32(data, offset), readU32(data, offset + 4)]);
  }
  return pairs;
}

function writeShapePairs(pairs: Array<[number, number]>): Uint8Array {
  const data = new Uint8Array(pairs.length * 8);
  pairs.forEach(([pos, id], i) => {
    writeU32(data, i * 8, pos);
    writeU32(data, i * 8 + 4, id);
  });
  return data;
}

/**
 * 치환 구간 [absStart, absEnd) 기준 charshape 위치 이동:
 * 앞은 유지, 뒤는 delta만큼 이동, 구간 안은 시작점으로 클램프 후
 * 겹치면 앞선 쌍을 남긴다.
 */
function shiftCharShape(
  shape: HwpRecord,
  absStart: number,
  absEnd: number,
  delta: number,
  newCharCount: number
): void {
  const shifted = readShapePairs(shape.data).map(([pos, id]): [number, number] => {
    if (pos <= absStart) return [pos, id];
    if (pos >= absEnd) return [pos + delta, id];
    return [absStart, id];
  });
  const deduped: Array<[number, number]> = [];
  for (const pair of shifted) {
    if (deduped.length === 0 || pair[0] > deduped[deduped.length - 1][0]) {
      deduped.push(pair);
    }
  }
  if (deduped.length === 0 || deduped[0][0] !== 0) {
    throw new Error("HWP: 치환 후 charshape가 문단 시작을 덮지 않습니다");
  }
  for (const [pos] of deduped) {
    if (pos >= newCharCount) {
      throw new Error("HWP: 치환 후 charshape 위치가 문단 길이를 벗어났습니다");
    }
  }
  shape.data = writeShapePairs(deduped);
}

function replaceRange(
  records: HwpRecord[],
  slot: ParaSlot,
  start: number,
  end: number,
  text: string
): void {
  assertCleanText(text);
  const parts = findParts(records, slot);
  const old = decodeSlot(records, parts);
  if (!old.editable) {
    throw new Error("HWP: 본문 중간에 컨트롤이 있는 문단은 치환할 수 없습니다");
  }
  if (start < 0 || end < start || end > old.body.length) {
    throw new RangeError(`HWP: 치환 구간 [${start}, ${end})이 본문 길이(${old.body.length})를 벗어났습니다`);
  }
  const shape = parts.shapeIndex >= 0 ? records[parts.shapeIndex] : null;
  const newBody = old.body.slice(0, start) + text + old.body.slice(end);
  const prefixWchars = old.prefix.length / 2;
  const newCharCount = prefixWchars + newBody.length + 1;

  if (newBody.length === 0 && prefixWchars === 0) {
    if (parts.textIndex >= 0) records.splice(parts.textIndex, 1);
  } else {
    const data = concatBytes([old.prefix, utf16leEncode(newBody), CR_BYTES]);
    if (parts.textIndex >= 0) {
      records[parts.textIndex].data = data;
    } else {
      records.splice(parts.headerIndex + 1, 0, {
        tag: TAG.PARA_TEXT,
        level: slot.header.level + 1,
        data,
      });
    }
  }

  const oldFlags = readU32(slot.header.data, 0);
  writeU32(slot.header.data, 0, ((oldFlags & 0x80000000) | newCharCount) >>> 0);

  if (shape) {
    shiftCharShape(
      shape,
      prefixWchars + start,
      prefixWchars + end,
      text.length - (end - start),
      newCharCount
    );
  }
}

/** 본문 전체를 갈아끼운다. 선두 컨트롤 블록은 보존된다. */
export function setParaBody(records: HwpRecord[], slot: ParaSlot, newBody: string): void {
  const body = getParaBody(records, slot);
  replaceRange(records, slot, 0, body.length, newBody);
}

/** 본문 일부 구간들만 치환한다. edits는 서로 겹치지 않아야 한다. */
export function patchParaBody(records: HwpRecord[], slot: ParaSlot, edits: ParaEdit[]): void {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].start < sorted[i - 1].end) {
      throw new Error("HWP: 치환 구간이 겹칩니다");
    }
  }
  let shift = 0;
  for (const edit of sorted) {
    replaceRange(records, slot, edit.start + shift, edit.end + shift, edit.text);
    shift += edit.text.length - (edit.end - edit.start);
  }
}

/**
 * 출력 직전 전수 검사. 하나라도 어긋난 문단이 있으면 한글이 파일을
 * 못 열 수 있으므로 생성 자체를 중단시킨다.
 */
export function validateSection(records: HwpRecord[]): void {
  for (let i = 0; i < records.length; i += 1) {
    if (records[i].tag !== TAG.PARA_HEADER) continue;
    const parts = findParts(records, { header: records[i] });
    const charCount = readU32(records[i].data, 0) & 0x7fffffff;
    if (parts.textIndex < 0) {
      if (charCount !== 1) {
        throw new Error(`HWP: 빈 문단(레코드 ${i})의 문자 수가 ${charCount}입니다`);
      }
    } else {
      const textBytes = records[parts.textIndex].data.length;
      if (textBytes % 2 !== 0 || charCount !== textBytes / 2) {
        throw new Error(
          `HWP: 문단(레코드 ${i}) 문자 수(${charCount})와 본문 길이(${textBytes}바이트)가 다릅니다`
        );
      }
    }
    if (parts.shapeIndex >= 0) {
      const pairs = readShapePairs(records[parts.shapeIndex].data);
      if (pairs.length === 0 || pairs[0][0] !== 0) {
        throw new Error(`HWP: 문단(레코드 ${i})의 charshape가 0에서 시작하지 않습니다`);
      }
      for (let p = 0; p < pairs.length; p += 1) {
        if (p > 0 && pairs[p][0] <= pairs[p - 1][0]) {
          throw new Error(`HWP: 문단(레코드 ${i})의 charshape 위치가 어긋났습니다`);
        }
        if (pairs[p][0] >= charCount) {
          throw new Error(`HWP: 문단(레코드 ${i})의 charshape 위치가 범위를 벗어났습니다`);
        }
      }
    }
  }
}
