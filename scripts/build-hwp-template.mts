/**
 * report.hwp(실물 편집본) → public/report-template.hwp(배포용 경량 템플릿).
 *
 * 1) PrvImage(파일의 84%, 미리보기 썸네일)를 제거하고
 * 2) 실명·실값을 견본 값으로 스크럽한다 — 실제 치환 엔진을 그대로 태우므로
 *    엔진의 첫 실전 검증을 겸한다.
 * 3) 마지막으로 앵커 전수 locate를 다시 돌려 템플릿이 유효한지 확인한다.
 *
 * 실행: npx tsx scripts/build-hwp-template.mts
 * (report.hwp를 새 실물로 바꾼 뒤에도 이 스크립트만 다시 돌리면 된다.)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildMonthlyReportHwpBytes } from "../src/lib/hwp/index";
import { inflateRaw } from "../src/lib/hwp/binary";
import { buildCfb, getStream, parseCfb, removeStream } from "../src/lib/hwp/cfb";
import { parseRecords } from "../src/lib/hwp/records";
import { buildSampleMonthlyReport } from "../src/lib/hwp/sampleReport";
import { locateTemplate } from "../src/lib/hwp/template";

const root = process.cwd();
const source = new Uint8Array(readFileSync(path.join(root, "report.hwp")));

const doc = parseCfb(source);
removeStream(doc, "PrvImage");
const slimmed = buildCfb(doc);

const { bytes, warnings } = await buildMonthlyReportHwpBytes(
  buildSampleMonthlyReport(),
  slimmed,
  []
);
if (warnings.length > 0) {
  throw new Error(`스크럽 치환에서 예상치 못한 경고: ${JSON.stringify(warnings)}`);
}

// 스크럽을 거친 뒤에도 모든 앵커가 살아 있어야 템플릿으로 쓸 수 있다.
const rebuilt = parseCfb(bytes);
locateTemplate(parseRecords(await inflateRaw(getStream(rebuilt, "BodyText/Section0"))));

const target = path.join(root, "public", "report-template.hwp");
writeFileSync(target, bytes);
console.log(
  `${target} 생성 완료 — ${bytes.length.toLocaleString("ko-KR")} bytes (원본 ${source.length.toLocaleString("ko-KR")})`
);
