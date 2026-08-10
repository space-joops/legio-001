"use client";

import { PageShell } from "@/components/PageShell";
import { TESSERA_CHAPTERS } from "@/lib/tesseraTexts";
import styles from "./page.module.css";

/** 뗏세라(레지오 단원 기도서) 전문을 읽는 화면(`/tessera`). */
export default function TesseraPage() {

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
        {TESSERA_CHAPTERS.map(({ id, title, entry }) => {
          const { sections, note } = entry;
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
                  {section.lines.map((line, lineIndex) => (
                    <p key={lineIndex} className={styles.line}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}
              {note ? <p className={styles.note}>{note}</p> : null}
            </section>
          );
        })}
        <p className={styles.note}>공인 교본의 뗏세라를 기준으로 정리한 기도문입니다. 발행 판본에 따라 표현이 조금씩 다를 수 있으니, 소속 쁘레시디움의 뗏세라와 다른 부분은 그 문구를 따르세요.</p>
      </div>
    </PageShell>
  );
}
