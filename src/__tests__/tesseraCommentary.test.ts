import { describe, it, expect } from "vitest";
import { TESSERA_COMMENTARY } from "../lib/tesseraCommentary";
import { TESSERA_CHAPTERS } from "../lib/tesseraTexts";
import { groupSectionLines, type VerseCommentary } from "../lib/tesseraVerses";

/**
 * 해설 데이터와 기도문 원문이 어긋나지 않는지 전수 검사한다.
 *
 * 해설은 줄 **번호**로 구절을 가리키기 때문에, `tesseraTexts.ts` 에서 줄을 하나
 * 넣거나 빼면 그 뒤의 모든 해설이 조용히 밀린다. 화면에서는 엉뚱한 구절에 엉뚱한
 * 풀이가 붙을 뿐 에러가 나지 않으므로, 여기서 기계적으로 잡는다.
 */

/** 「성경」 약칭 + 장,절. 예) `루카 1,28`, `루카 1,26-28`, `2코린 13,13` */
const REF_PATTERN = /^[0-9]?[가-힣]+ \d+,\d+(-\d+)?$/;

describe("뗏세라 구절 해설 (tesseraCommentary.ts)", () => {
  it("네 장에 모두 해설이 있어야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      expect(TESSERA_COMMENTARY[chapter.id].length).toBeGreaterThan(0);
    }
  });

  it("모든 구절이 실제로 있는 줄을 가리켜야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      for (const verse of TESSERA_COMMENTARY[chapter.id]) {
        const where = `${chapter.id} §${verse.section} [${verse.from}-${verse.to}]`;
        const section = chapter.entry.sections[verse.section];

        expect(section, `${where}: 없는 section`).toBeDefined();
        expect(verse.from, `${where}: from 이 음수`).toBeGreaterThanOrEqual(0);
        expect(verse.to, `${where}: to 가 from 보다 앞`).toBeGreaterThanOrEqual(verse.from);
        expect(verse.to, `${where}: 줄 범위를 벗어남`).toBeLessThan(section.lines.length);
      }
    }
  });

  it("같은 section 안에서 구절 범위가 겹치지 않아야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      const bySection = new Map<number, VerseCommentary[]>();
      for (const verse of TESSERA_COMMENTARY[chapter.id]) {
        const list = bySection.get(verse.section) ?? [];
        list.push(verse);
        bySection.set(verse.section, list);
      }

      for (const [sectionIndex, verses] of bySection) {
        const sorted = [...verses].sort((a, b) => a.from - b.from);
        for (let i = 1; i < sorted.length; i += 1) {
          expect(
            sorted[i].from,
            `${chapter.id} §${sectionIndex}: "${sorted[i - 1].title}" 와 "${sorted[i].title}" 범위가 겹침`,
          ).toBeGreaterThan(sorted[i - 1].to);
        }
      }
    }
  });

  it("기도문의 모든 줄이 빠짐없이 해설에 덮여야 한다", () => {
    const uncovered: string[] = [];

    for (const chapter of TESSERA_CHAPTERS) {
      chapter.entry.sections.forEach((section, sectionIndex) => {
        const covered = new Set<number>();
        for (const verse of TESSERA_COMMENTARY[chapter.id]) {
          if (verse.section !== sectionIndex) continue;
          for (let i = verse.from; i <= verse.to; i += 1) covered.add(i);
        }
        section.lines.forEach((line, lineIndex) => {
          if (!covered.has(lineIndex)) {
            uncovered.push(`${chapter.id} §${sectionIndex}[${lineIndex}] ${line}`);
          }
        });
      });
    }

    expect(uncovered, `해설이 없는 줄 ${uncovered.length}개`).toEqual([]);
  });

  it("groupSectionLines 는 줄을 잃거나 겹치지 않아야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      chapter.entry.sections.forEach((section, sectionIndex) => {
        const groups = groupSectionLines(
          section.lines,
          TESSERA_COMMENTARY[chapter.id],
          sectionIndex,
        );
        const flattened = groups.flatMap((group) => group.lines);
        expect(flattened, `${chapter.id} §${sectionIndex}`).toEqual(section.lines);
      });
    }
  });

  it("모든 구절에 제목·풀이·성경이 있어야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      for (const verse of TESSERA_COMMENTARY[chapter.id]) {
        const where = `${chapter.id} §${verse.section} [${verse.from}-${verse.to}]`;
        expect(verse.title.trim(), `${where}: 제목 없음`).not.toBe("");
        expect(verse.body.length, `${where}: 풀이 없음`).toBeGreaterThan(0);
        expect(verse.quotes.length, `${where}: 성경 인용 없음`).toBeGreaterThan(0);

        for (const paragraph of verse.body) {
          expect(paragraph.trim(), `${where}: 빈 문단`).not.toBe("");
        }
      }
    }
  });

  it("성경 장절 표기가 「성경」 형식을 따라야 한다", () => {
    for (const chapter of TESSERA_CHAPTERS) {
      for (const verse of TESSERA_COMMENTARY[chapter.id]) {
        for (const quote of verse.quotes) {
          expect(quote.ref, `${verse.title}: 잘못된 장절 표기`).toMatch(REF_PATTERN);
          expect(quote.text.trim(), `${quote.ref}: 본문 없음`).not.toBe("");
          // 추출 도구가 띄어쓰기를 판정하지 못한 자리에 남기는 표시.
          expect(quote.text, `${quote.ref}: 검수 표시(¿)가 남아 있음`).not.toContain("¿");
        }
      }
    }
  });

  it("계획한 71구절이 모두 들어 있어야 한다", () => {
    const total = Object.values(TESSERA_COMMENTARY).reduce(
      (sum, verses) => sum + verses.length,
      0,
    );
    expect(total).toBe(71);
  });
});
