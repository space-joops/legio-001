import type { ActivityItem, MonthlyReport } from "../types";
import { deflateRaw, inflateRaw, readU32 } from "./binary";
import { buildCfb, getStream, parseCfb, setStream, type CfbDocument } from "./cfb";
import { applyReport, buildPrvText, type HwpWarning } from "./fill";
import { validateSection } from "./paragraph";
import { parseRecords, serializeRecords, type HwpRecord } from "./records";
import { locateTemplate } from "./template";

/**
 * 템플릿 .hwp에 월례 보고서 값을 치환해 제출용 .hwp를 만든다.
 *
 * 폰트·양식·서식 레코드는 일절 건드리지 않는다 — BodyText/Section0의
 * 문단 텍스트와 PrvText(미리보기 텍스트)만 바뀐다.
 */

export type { HwpWarning } from "./fill";

const FILE_HEADER_SIGNATURE = "HWP Document File";
const FLAG_COMPRESSED = 0x1;
const FLAG_PASSWORD = 0x2;
const FLAG_DISTRIBUTION = 0x4;

interface ParsedTemplate {
  doc: CfbDocument;
  records: HwpRecord[];
}

async function parseTemplate(templateBytes: Uint8Array): Promise<ParsedTemplate> {
  const doc = parseCfb(templateBytes);
  const fileHeader = getStream(doc, "FileHeader");
  for (let i = 0; i < FILE_HEADER_SIGNATURE.length; i += 1) {
    if (fileHeader[i] !== FILE_HEADER_SIGNATURE.charCodeAt(i)) {
      throw new Error("HWP: FileHeader 시그니처가 아닙니다");
    }
  }
  const flags = readU32(fileHeader, 36);
  if ((flags & FLAG_COMPRESSED) === 0) {
    throw new Error("HWP: 압축되지 않은 문서는 지원하지 않습니다");
  }
  if ((flags & (FLAG_PASSWORD | FLAG_DISTRIBUTION)) !== 0) {
    throw new Error("HWP: 암호화·배포용 문서는 치환할 수 없습니다");
  }
  const section = await inflateRaw(getStream(doc, "BodyText/Section0"));
  return { doc, records: parseRecords(section) };
}

async function writeBack(parsed: ParsedTemplate): Promise<Uint8Array> {
  validateSection(parsed.records);
  setStream(parsed.doc, "BodyText/Section0", await deflateRaw(serializeRecords(parsed.records)));
  setStream(parsed.doc, "PrvText", buildPrvText(parsed.records));
  return buildCfb(parsed.doc);
}

/** 브라우저용 최종 API. 실패는 throw — 부분 치환된 문서는 절대 내보내지 않는다. */
export async function buildMonthlyReportHwp(
  report: MonthlyReport,
  templateBytes: Uint8Array,
  activityItems: ActivityItem[]
): Promise<{ blob: Blob; warnings: HwpWarning[] }> {
  const { bytes, warnings } = await buildMonthlyReportHwpBytes(report, templateBytes, activityItems);
  return { blob: new Blob([bytes as BlobPart], { type: "application/x-hwp" }), warnings };
}

/** Node 테스트·스크립트용 — Blob 없이 바이트를 돌려준다. */
export async function buildMonthlyReportHwpBytes(
  report: MonthlyReport,
  templateBytes: Uint8Array,
  activityItems: ActivityItem[]
): Promise<{ bytes: Uint8Array; warnings: HwpWarning[] }> {
  const parsed = await parseTemplate(templateBytes);
  const map = locateTemplate(parsed.records);
  const warnings = applyReport(parsed.records, map, report, activityItems);
  return { bytes: await writeBack(parsed), warnings };
}
