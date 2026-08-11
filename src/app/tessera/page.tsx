"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { VerseCommentaryDialog } from "@/components/VerseCommentaryDialog";
import { TESSERA_COMMENTARY } from "@/lib/tesseraCommentary";
import { TESSERA_CHAPTERS } from "@/lib/tesseraTexts";
import { groupSectionLines, type VerseCommentary } from "@/lib/tesseraVerses";
import styles from "./page.module.css";

/** 뗏세라(레지오 단원 기도서) 전문을 읽는 화면(`/tessera`). */
export default function TesseraPage() {
  // 지금 풀이를 열어 둔 구절. null 이면 팝업이 닫힌 상태다.
  const [openVerse, setOpenVerse] = useState<VerseCommentary | null>(null);
  // 팝업 위쪽에 원문을 다시 보여 주려면 그 구절의 줄들도 함께 들고 있어야 한다.
  const [openLines, setOpenLines] = useState<string[]>([]);

  return (
    <PageShell title="뗏세라 기도문">
      <div className={styles.content}>
        <nav className={styles.toc} aria-label="바로가기">
          {TESSERA_CHAPTERS.map(({ id, title }) => (
            <a key={id} href={`#${id}`} className={styles.tocLink}>
              {title}
            </a>
          ))}
        </nav>
        <p className={styles.legend}>○ 선창 · ● 응답 · ◎ 함께 · † 성호경</p>
        <p className={styles.guide}>
          기도문을 누르면 쉬운 풀이와 관련 성경이 나옵니다.
        </p>
        {TESSERA_CHAPTERS.map(({ id, title, entry }) => {
          const { sections, note } = entry;
          const commentaries = TESSERA_COMMENTARY[id];
          return (
            <section key={id} id={id} className={styles.chapter} aria-labelledby={`${id}-heading`}>
              <h2 id={`${id}-heading`} className={styles.chapterTitle}>
                {title}
              </h2>
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className={styles.prayer}>
                  {section.heading ? (
                    <h3 className={styles.prayerHeading}>{section.heading}</h3>
                  ) : null}
                  {groupSectionLines(section.lines, commentaries, sectionIndex).map((group) =>
                    group.commentary ? (
                      // 버튼 안에는 <p> 를 넣을 수 없다(phrasing content 만 허용).
                      // 그래서 줄은 <span>이고, CSS 에서 block 으로 세운다.
                      // aria-label 을 달지 않는 것은 일부러다 — 달면 버튼의 이름이
                      // 그 문구로 **대체되어** 기도문 본문을 읽어 주지 않는다.
                      <button
                        key={group.from}
                        type="button"
                        className={styles.verseButton}
                        onClick={() => {
                          setOpenVerse(group.commentary);
                          setOpenLines(group.lines);
                        }}
                      >
                        <span className={styles.verseLines}>
                          {group.lines.map((line, i) => (
                            <span key={i} className={styles.line}>
                              {line}
                            </span>
                          ))}
                        </span>
                        <span className={styles.hint} aria-hidden="true">
                          풀이
                        </span>
                        <span className={styles.srOnly}>풀이 보기</span>
                      </button>
                    ) : (
                      // 해설이 아직 없는 줄은 지금까지처럼 그냥 읽기만 한다.
                      <div key={group.from} className={styles.plainLines}>
                        {group.lines.map((line, i) => (
                          <p key={i} className={styles.line}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              ))}
              {note ? <p className={styles.note}>{note}</p> : null}
            </section>
          );
        })}
        <p className={styles.note}>공인 교본의 뗏세라를 기준으로 정리한 기도문입니다. 발행 판본에 따라 표현이 조금씩 다를 수 있으니, 소속 쁘레시디움의 뗏세라와 다른 부분은 그 문구를 따르세요.</p>
        <p className={styles.note}>풀이는 이해를 돕기 위한 안내이며 공식 해설이 아닙니다. 성경 인용은 한국 천주교 주교회의 「성경」을 따랐습니다.</p>
      </div>

      <VerseCommentaryDialog
        commentary={openVerse}
        lines={openLines}
        onClose={() => setOpenVerse(null)}
      />
    </PageShell>
  );
}
