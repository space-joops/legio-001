"use client";

import { useTranslation } from "@/i18n/useTranslation";
import styles from "./RosaryGuide.module.css";

/**
 * 성화를 크게 보면서 그 단의 묵상을 읽는 전체화면 팝업.
 *
 * 묵주기도 안내 화면에서 성화를 누르면 열린다. 열려 있는 동안 화면을 꽉 채우고,
 * ESC · 배경 클릭 · 닫기 버튼 세 가지로 닫을 수 있다.
 *
 * ## `<dialog>` 를 쓰는 이유
 *
 * 직접 만든 `<div>` 오버레이 대신 브라우저 기본 `<dialog>` + `showModal()` 을 쓴다.
 * 그러면 브라우저가 알아서 해 주는 것들이 있다.
 *   - 화면 맨 위 레이어(top layer)에 올려 준다 → z-index 를 다툴 일이 없다
 *   - 팝업 밖 요소를 못 누르게 막아 준다
 *   - 키보드 초점이 팝업 안에 갇힌다(포커스 트랩)
 *   - ESC 키를 알아서 받아 준다
 *
 * ## 여는 방식이 특이하다 — useEffect 가 아니라 콜백 ref
 *
 * 이 저장소의 다른 다이얼로그(`ConfirmDialog`, `PrayerTextDialog`)는 `useEffect`
 * 안에서 `showModal()`/`close()` 를 부른다. 그건 다이얼로그가 **항상 렌더돼 있고**
 * `open` 값만 오가기 때문이다.
 *
 * 여기는 다르다. 부모가 `image` 가 있을 때만 이 컴포넌트를 렌더하므로
 * **마운트되는 순간이 곧 열리는 순간**이고, 사라지는 순간이 곧 닫히는 순간이다.
 * 그래서 "요소가 붙는 그 순간" 한 번만 실행되는 콜백 ref 로 충분하다.
 *
 * 자세한 설명: `docs/rosary/03-성화-팝업.md`
 */

interface MysteryImageDialogProps {
  src: string;
  title: string;
  /** 묵상 문장들. 화면에 그릴 때 1. 2. 3. … 번호를 자동으로 붙인다. */
  explanation: string[];
  onClose: () => void;
}

export function MysteryImageDialog({ src, title, explanation, onClose }: MysteryImageDialogProps) {
  const { t } = useTranslation();

  return (
    <dialog
      className={styles.fullScreenDialog}
      // [TS] ref 자리에 함수를 넣으면 React 가 "요소가 붙었을 때" 그 요소를,
      //      "떨어질 때" null 을 넣어 불러 준다. 그래서 el 검사가 필요하다.
      ref={(el) => {
        if (el && !el.open) {
          el.showModal();
        }
      }}
      // ESC 키. preventDefault 로 브라우저 기본 닫기를 막고 React 로만 닫는다 —
      // 안 그러면 화면은 닫혔는데 부모의 state 는 아직 "열림"이라 어긋난다.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // 배경(어두운 부분) 클릭. e.target === e.currentTarget 은 "팝업 안쪽 내용이
      // 아니라 <dialog> 자기 자신이 눌렸다"는 뜻이다.
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.fullScreenContent}>
        <button
          type="button"
          className={styles.closeFullScreenBtn}
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <div className={styles.fullScreenScroll}>
          <h2 className={styles.fullScreenTitle}>{title}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export + images.unoptimized 라 next/image 는 용량만 늘린다 */}
          <img src={src} alt={title} className={styles.fullScreenImg} />
          <div className={styles.fullScreenText}>
            {explanation.map((line, i) => (
              <p key={i} className={styles.fullScreenLine}>
                {/* 번호는 데이터에 없다. 여기서 붙인다. */}
                {i + 1}. {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
