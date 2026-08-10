"use client";

import { PageShell } from "@/components/PageShell";
import { useTranslation } from "@/i18n/useTranslation";
import { TESSERA_CHAPTERS } from "@/lib/tesseraTexts";
import styles from "./page.module.css";

/** 뗏세라(레지오 단원 기도서) 전문을 읽는 화면(`/tessera`). */
export default function TesseraPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("tessera.title")}>
      <div className={styles.content}>
        <nav className={styles.toc} aria-label={t("tessera.tocLabel")}>
          {TESSERA_CHAPTERS.map(({ id, title }) => (
            <a key={id} href={`#${id}`} className={styles.tocLink}>
              {title}
            </a>
          ))}
        </nav>
        <p className={styles.legend}>{t("tessera.legend")}</p>
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
        <p className={styles.note}>{t("tessera.sourceNote")}</p>
      </div>
    </PageShell>
  );
}
