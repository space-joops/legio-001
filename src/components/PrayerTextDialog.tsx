// Next.js 앱 라우터에서 이 컴포넌트가 클라이언트 사이드에서 렌더링되도록 지정합니다.
// 즉, 브라우저의 API(예: useRef, useEffect, 이벤트 리스너 등)를 사용할 수 있게 됩니다.
"use client";

import { useEffect, useRef, type ReactNode } from "react";
// 다국어 지원을 위한 훅을 가져옵니다. 텍스트를 번역할 때 사용됩니다.
import { useTranslation } from "@/i18n/useTranslation";
// 기도문 데이터 구조에 대한 타입 정의를 가져옵니다.
import type { PrayerTextEntry } from "@/lib/prayerTexts";
// CSS 모듈을 통해 컴포넌트 스코프의 스타일을 가져옵니다.
import styles from "./PrayerTextDialog.module.css";

// PrayerTextDialog 컴포넌트가 부모로부터 받는 속성(Props)들의 타입을 정의합니다.
interface PrayerTextDialogProps {
  // 모달 상단에 표시될 기도 제목
  title: string;
  // 표시할 기도문 객체 (null일 경우 모달이 닫힌 상태를 의미함)
  entry: PrayerTextEntry | null;
  // 하단 버튼에 표시될 현재 진행 횟수 (예: 몇 번 기도했는지)
  count: number;
  // 하단의 횟수 증가(기록) 버튼을 눌렀을 때 실행될 콜백 함수
  onIncrement: () => void;
  // 모달을 닫을 때 실행될 콜백 함수
  onClose: () => void;
  /**
   * 기도문 위에 표시될 선택적 가이드(도우미 뷰) 컴포넌트입니다.
   * 이 가이드가 존재할 경우, 전체 기도문은 '<details>' 태그를 통해 접을 수 있는 형태(disclosure) 뒤로 숨겨집니다.
   * 즉, 가이드가 메인 화면이 되고 전체 기도문은 참고 자료 역할을 하게 됩니다.
   */
  guide?: ReactNode;
  /**
   * "기록하려면 탭하세요(tap to record)"라는 기본 캡션을 대체하는 문자열입니다.
   * 예를 들어 '묵주기도'의 경우, 한 번 탭할 때마다 숫자가 올라가는 것이 아니라
   * 묵주알이 하나씩 채워지는 시각적 효과가 발생하기 때문에,
   * 첫 네 번의 탭 동안 아무 일도 일어나지 않는 것처럼 보일 수 있습니다.
   * 이를 방지하고 사용자에게 상황을 명확히 알리기 위해 맞춤 캡션을 제공합니다.
   */
  incrementCaption?: string;
}

// PrayerTextDialog 컴포넌트 선언부
export function PrayerTextDialog({
  title,
  entry,
  count,
  onIncrement,
  onClose,
  guide,
  incrementCaption,
}: PrayerTextDialogProps) {
  // 다국어 번역 함수 t를 추출합니다.
  const { t } = useTranslation();

  // HTML <dialog> 엘리먼트에 직접 접근하기 위해 useRef를 사용합니다.
  // 이를 통해 네이티브 dialog API인 showModal()과 close()를 호출할 수 있습니다.
  const ref = useRef<HTMLDialogElement>(null);

  // entry 객체가 존재하면(truthy) 모달을 열어야 하는 상태(true)로 판단합니다.
  const open = Boolean(entry);

  // 모달의 열림/닫힘 상태를 동기화하기 위한 useEffect 훅
  // open 상태가 바뀔 때마다 실행됩니다.
  useEffect(() => {
    const dialog = ref.current;
    // dialog DOM 엘리먼트가 아직 마운트되지 않았다면 아무 작업도 하지 않습니다.
    if (!dialog) return;

    // 모달을 열어야 하는데(open === true) 현재 dialog가 열려있지 않다면
    // 네이티브 메서드인 showModal()을 호출하여 최상단 모달로 띄웁니다.
    // showModal()은 배경을 비활성화하고 ESC 키로 닫을 수 있게 해주는 등 웹 표준 모달 기능을 제공합니다.
    if (open && !dialog.open) dialog.showModal();

    // 모달을 닫아야 하는데(open === false) 현재 dialog가 열려있다면
    // 네이티브 메서드인 close()를 호출하여 모달을 닫습니다.
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // 네이티브 <dialog> 엘리먼트를 사용합니다.
    <dialog
      ref={ref}
      className={styles.dialog}
      // 사용자가 ESC 키를 눌러 모달을 닫으려 할 때 발생하는 onCancel 이벤트
      onCancel={(e) => {
        // 브라우저의 기본 닫힘 동작을 막고 (React 상태와 동기화하기 위함)
        e.preventDefault();
        // 부모에서 전달받은 onClose 함수를 호출하여 상태를 통해 모달을 닫습니다.
        onClose();
      }}
    >
      {/* entry가 있을 때만 모달 내부 콘텐츠를 렌더링합니다. */}
      {entry && (
        <div className={styles.screen}>
          {/* 기도 제목 */}
          <h2 className={styles.title}>{title}</h2>

          <div className={styles.content}>
            {/* 가이드가 전달되었다면 최상단에 렌더링합니다. */}
            {guide}

            {/* 즉시 실행 함수(IIFE)를 사용하여 기도문 본문을 어떻게 렌더링할지 결정합니다. */}
            {(() => {
              // 기도문의 전체 텍스트를 구성하는 React 노드(요소)입니다.
              const fullText = (
                <>
                  {/* 기도문을 여러 섹션으로 나누어 렌더링합니다. */}
                  {entry.sections.map((section, i) => (
                    <div key={i} className={styles.section}>
                      {/* 섹션의 소제목이 있다면 표시합니다. */}
                      {section.heading && (
                        <span className={styles.sectionHeading}>{section.heading}</span>
                      )}
                      {/* 섹션 내의 각 줄(line)을 순회하며 단락(<p>)으로 렌더링합니다. */}
                      {section.lines.map((line, j) => (
                        <p key={j} className={styles.line}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                  {/* 기도문에 추가적인 참고 사항(note)이 있다면 하단에 렌더링합니다. */}
                  {entry.note && <p className={styles.note}>{entry.note}</p>}
                </>
              );

              // 만약 가이드(guide)가 존재한다면,
              // 전체 기도문은 너무 길 수 있으므로 접고 펼칠 수 있는 <details> 태그 안에 넣습니다.
              return guide ? (
                <details className={styles.fullText}>
                  {/* <summary>는 <details> 태그의 클릭 가능한 제목 부분입니다. */}
                  <summary className={styles.fullTextToggle}>
                    {t("prayerText.showFullText")} {/* "전체 텍스트 보기" 등으로 번역됨 */}
                  </summary>
                  {/* 클릭하면 이 fullText 영역이 펼쳐집니다. */}
                  {fullText}
                </details>
              ) : (
                // 가이드가 없다면 전체 기도문을 바로 화면에 노출합니다.
                fullText
              );
            })()}
          </div>

          {/* 하단 고정 버튼 영역 */}
          <div className={styles.footer}>
            {/* 횟수 기록(증가) 버튼 */}
            <button
              type="button"
              className={styles.incrementButton}
              onClick={onIncrement}
              // 스크린 리더 등 접근성을 위한 라벨 (예: "주님의 기도 기록하려면 탭하세요")
              aria-label={`${title} ${t("counters.tapToRecord")}`}
            >
              {/* 현재 카운트 표시 */}
              <span className={styles.incrementCount}>{count}</span>
              {/* 버튼 하단의 힌트 텍스트. incrementCaption이 전달되면 그것을 쓰고, 아니면 기본 번역 텍스트를 씁니다. */}
              <span className={styles.incrementHint}>
                {incrementCaption ?? t("counters.tapToRecord")}
              </span>
            </button>

            {/* 닫기 버튼 */}
            <button type="button" className={styles.closeButton} onClick={onClose}>
              {t("common.close")} {/* "닫기" 등으로 번역됨 */}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
