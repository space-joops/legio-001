import { concatBytes, readU32, writeU32 } from "./binary";

/**
 * HWP 5.0 BodyText 섹션의 레코드 시퀀스 파서/직렬화.
 *
 * 레코드 헤더는 4바이트(tag 10bit | level 10bit | size 12bit)이고,
 * size 필드가 0xFFF이면 실제 크기가 뒤따르는 u32에 온다.
 */

export interface HwpRecord {
  tag: number;
  level: number;
  data: Uint8Array;
}

export const TAG = {
  PARA_HEADER: 66,
  PARA_TEXT: 67,
  PARA_CHAR_SHAPE: 68,
  PARA_LINE_SEG: 69,
  CTRL_HEADER: 71,
  LIST_HEADER: 72,
  TABLE: 77,
} as const;

const SIZE_SENTINEL = 0xfff;

export function parseRecords(section: Uint8Array): HwpRecord[] {
  const records: HwpRecord[] = [];
  let offset = 0;
  while (offset < section.length) {
    if (offset + 4 > section.length) {
      throw new Error("HWP 레코드 헤더가 잘렸습니다");
    }
    const header = readU32(section, offset);
    const tag = header & 0x3ff;
    const level = (header >>> 10) & 0x3ff;
    let size = (header >>> 20) & 0xfff;
    offset += 4;
    if (size === SIZE_SENTINEL) {
      if (offset + 4 > section.length) {
        throw new Error("HWP 확장 레코드 크기가 잘렸습니다");
      }
      size = readU32(section, offset);
      offset += 4;
    }
    if (offset + size > section.length) {
      throw new Error(`HWP 레코드(tag ${tag}) 본문이 잘렸습니다`);
    }
    records.push({ tag, level, data: section.slice(offset, offset + size) });
    offset += size;
  }
  return records;
}

export function serializeRecords(records: HwpRecord[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const record of records) {
    const size = record.data.length;
    if (size < SIZE_SENTINEL) {
      const header = new Uint8Array(4);
      writeU32(header, 0, (record.tag | (record.level << 10) | (size << 20)) >>> 0);
      parts.push(header);
    } else {
      const header = new Uint8Array(8);
      writeU32(header, 0, (record.tag | (record.level << 10) | (SIZE_SENTINEL << 20)) >>> 0);
      writeU32(header, 4, size);
      parts.push(header);
    }
    parts.push(record.data);
  }
  return concatBytes(parts);
}
