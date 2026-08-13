"use client";

import { useEffect, useRef } from "react";
import type { VerseCommentary } from "@/lib/tesseraVerses";
import styles from "./VerseCommentaryDialog.module.css";

interface VerseCommentaryDialogProps {
  /** 열어 둘 구절. `null` 이면 닫힌 상태다(`PrayerTextDialog` 와 같은 규칙). */
  commentary: VerseCommentary | null;
  /** 그 구절의 기도문 원문. 팝업 맨 위에 다시 보여 준다. */
  lines: string[];
  onClose: () => void;
}

/**
 * 뗏세라 한 구절의 뜻풀이와 관련 성경을 보여 주는 전체화면 팝업.
 *
 * 여닫는 방식은 `PrayerTextDialog` 와 같다: 항상 마운트해 두고 `commentary` 가
 * 있으면 `showModal()`, 없으면 `close()`. `onCancel`(ESC)에서 기본 동작을 막고
 * React 상태로 닫는다.
 *
 * `stopPropagation()` 을 함께 부르는 이유는 `docs/rosary/03-성화-팝업.md` 에 적힌
 * 실측 때문이다 — React 는 버블링하지 않는 네이티브 `cancel` 이벤트를 제 트리 아래로
 * 다시 흘려보내서, 다이얼로그 안에 다이얼로그가 있으면 ESC 한 번에 **둘 다** 닫힌다.
 * 지금은 `/tessera` 가 다이얼로그가 아니라 문제가 없지만, 나중에 기도문 팝업 안에서
 * 이 컴포넌트를 다시 쓰게 되면 바로 그 버그를 만나므로 미리 막아 둔다.
 */
export function VerseCommentaryDialog({
  commentary,
  lines,
  onClose,
}: VerseCommentaryDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const open = Boolean(commentary);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 다른 구절을 열면 지난번에 읽던 위치가 남아 있어 본문 중간부터 보인다. 맨 위로 되돌린다.
  useEffect(() => {
    if (commentary) contentRef.current?.scrollTo(0, 0);
  }, [commentary]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={commentary ? `${commentary.title} 풀이` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      {commentary && (
        <div className={styles.screen}>
          <h2 className={styles.title}>{commentary.title}</h2>

          <div className={styles.content} ref={contentRef}>
            <div className={styles.original}>
              {lines.map((line, i) => (
                <p key={i} className={styles.originalLine}>
                  {line}
                </p>
              ))}
            </div>

            <section className={styles.block}>
              <h3 className={styles.blockTitle}>쉬운 풀이</h3>
              {commentary.body.map((paragraph, i) => (
                <p key={i} className={styles.bodyText}>
                  {paragraph}
                </p>
              ))}
            </section>

            <section className={styles.block}>
              <h3 className={styles.blockTitle}>관련 성경</h3>
              {commentary.quotes.map((quote) => (
                <figure key={quote.ref} className={styles.quote}>
                  <figcaption className={styles.quoteRef}>
                    {quote.link ? (
                      <a href={quote.link} target="_blank" rel="noopener noreferrer" className={styles.quoteLink}>
                        {quote.ref}
                      </a>
                    ) : (
                      quote.ref
                    )}
                  </figcaption>
                  <blockquote className={styles.quoteText}>{quote.text}</blockquote>
                </figure>
              ))}
              <p className={styles.credit}>
                성경 인용 — 한국 천주교 주교회의 「성경」
              </p>
            </section>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
