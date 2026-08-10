"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSwipe } from "@/hooks/useSwipe";
import { useTranslation } from "@/i18n/useTranslation";
import { ROSARY_SET_SIZE } from "@/lib/constants";
import {
  buildRosarySteps,
  getMysteryIdForDate,
  getMysterySection,
  type MysteryId,
} from "@/lib/rosaryMysteries";
import { MysteryImageDialog } from "./MysteryImageDialog";
import { RosaryStepView } from "./RosaryStepView";
import styles from "./RosaryGuide.module.css";

/**
 * 묵주기도를 처음부터 끝까지 **한 화면에 하나씩** 안내한다.
 *
 * 오늘 요일에 맞는 신비를 골라 사도신경부터 성모찬송까지 77장을 펼쳐 놓고,
 * 버튼이나 스와이프로 넘겨 가며 따라 바치게 한다. 끝까지 가면 5단을 한 번에
 * 기록할지 물어본다.
 *
 * ## 이 파일이 하는 일 / 안 하는 일
 *
 * 여기 있는 건 **상태와 조립**뿐이다.
 *   - 지금 몇 번째 화면인지(`index`), 어떤 신비인지(`mysteryId`) 등을 들고 있고
 *   - 그 값들을 아래 세 조각에 넘겨 그리게 한다
 *
 *   순서표 만들기  →  `lib/rosaryMysteries.ts`   (77장 배열)
 *   화면 한 장     →  `RosaryStepView.tsx`
 *   성화 팝업      →  `MysteryImageDialog.tsx`
 *   스와이프 감지  →  `hooks/useSwipe.ts`
 *
 * 고치고 싶은 게 있으면 위 표에서 해당 파일을 찾아 열면 된다.
 *
 * ## 어디서 열리나
 *
 * 앱 전체에서 이 컴포넌트를 그리는 곳은 `CounterGrid.tsx` 한 군데뿐이다.
 * 홈 화면의 묵주기도 카드에서 **[기도문 보기]** 를 눌렀을 때만 마운트되고,
 * 창을 닫으면 언마운트되면서 아래 상태가 전부 초기화된다.
 *
 * 자세한 설명: `docs/rosary/02-화면과-스와이프.md`
 */

interface RosaryGuideProps {
  /** 5단을 한 번에 카운터에 더한다. 실제 구현은 `useCurrentReport.addRosarySet`. */
  onRecordSet: () => void;
  /** 현재 묵주 세트에서 이미 채운 구슬 수(0~4). 이어서 바칠 위치를 정하는 데 쓴다. */
  progress?: number;
}

export function RosaryGuide({ onRecordSet, progress = 0 }: RosaryGuideProps) {
  const { t } = useTranslation();

  /** 오늘의 신비. 처음엔 null — 아래 useEffect 가 브라우저에서 정한다. */
  const [mysteryId, setMysteryId] = useState<MysteryId | null>(null);
  /** 지금 보고 있는 화면 번호. 0부터 76까지. */
  const [index, setIndex] = useState(0);
  /** 마지막 화면에서 "5단을 기록할까요?" 확인창을 띄우는 중인지. */
  const [asking, setAsking] = useState(false);
  /** 기록 완료 안내문을 보여 줄지. */
  const [recorded, setRecorded] = useState(false);
  /** 다음 화면이 어느 쪽에서 밀려 들어올지. 슬라이드 애니메이션 방향. */
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  /** 값이 있으면 성화 팝업이 열린다. null 이면 닫힌 상태. */
  const [fullScreenImage, setFullScreenImage] = useState<{
    src: string;
    title: string;
    explanation: string[];
  } | null>(null);

  /** 최상위 요소. 화면을 넘길 때마다 여기로 스크롤을 되돌린다. */
  const rootRef = useRef<HTMLElement>(null);
  /** 손가락을 따라 움직이는 요소. `useSwipe` 가 이 요소의 style 을 직접 만진다. */
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 오늘이 며칠인지는 **브라우저에서만** 알 수 있다. 이 앱은 빌드할 때 화면을
    // 미리 만들어 두는데(정적 export), 그때의 "오늘"은 배포한 날이지 사용자가
    // 앱을 여는 날이 아니기 때문이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 정적 export 라 렌더 시점에는 오늘 날짜를 알 수 없다
    setMysteryId(getMysteryIdForDate(new Date()));
  }, []);

  // 77장을 매 렌더마다 새로 만들 이유가 없다. 신비가 바뀔 때만 다시 만든다.
  const steps = useMemo(() => (mysteryId ? buildRosarySteps(mysteryId) : []), [mysteryId]);

  /**
   * "이미 바친 단은 건너뛰기"를 딱 한 번만 하기 위한 표시.
   *
   * [TS] `useRef` 에 담은 값은 바뀌어도 화면을 다시 그리지 않는다. 반면
   *      `useState` 였다면 이 플래그를 세울 때마다 렌더가 한 번 더 돌았을 것이다.
   */
  const initRef = useRef(false);
  useEffect(() => {
    // 구슬을 3개 채운 상태로 창을 열면 4단부터 보여 준다. 이미 바친 3단을 다시
    // 넘겨 가며 지나칠 이유가 없기 때문이다.
    if (steps.length > 0 && progress > 0 && !initRef.current) {
      const targetDecade = progress + 1;
      const targetIndex = steps.findIndex((s) => s.decade === targetDecade);
      if (targetIndex !== -1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 창을 열 때 한 번만 위치를 맞추는 초기화다
        setIndex(targetIndex);
      }
      // 한 번 하고 나면 다시 하지 않는다. 기록 후 progress 가 0으로 돌아갈 때
      // 화면이 멋대로 튀는 것을 막는다.
      initRef.current = true;
    }
  }, [steps, progress]);

  // 넘길 때마다 제목이 화면 맨 위로 오게 한다. 따라 바치는 화면인데 "지금 어디를
  // 읽어야 하는지" 매번 찾아야 한다면 안내의 의미가 없다.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [index]);

  const isLast = index >= steps.length - 1;

  const handleNext = () => {
    // 마지막 화면에서는 더 갈 곳이 없다. 대신 기록할지 물어본다.
    if (isLast) {
      setAsking(true);
      return;
    }
    setSlideDirection("right");
    setIndex(index + 1);
  };

  const handlePrev = () => {
    if (index > 0) {
      setSlideDirection("left");
      setIndex(index - 1);
    }
  };

  const handleConfirm = () => {
    onRecordSet();
    setAsking(false);
    setRecorded(true);
    // 처음으로 되돌린다. 이어서 다음 5단을 바칠 수 있게 하려는 것이다.
    setIndex(0);
  };

  // 확인창이 떠 있는 동안에는 스와이프를 막는다. 그러지 않으면 "기록할까요?"를
  // 읽는 중에 손가락이 스치는 것만으로 화면이 넘어가 버린다.
  //
  // ⚠️ 이 줄은 아래 조기 반환보다 **위**에 있어야 한다. useSwipe 안에도 useRef 가
  //    들어 있어서, 렌더할 때마다 훅이 같은 순서로 불려야 한다는 React 규칙을
  //    지켜야 하기 때문이다. 조기 반환 아래로 내리면 "어떤 렌더에서는 불리고
  //    어떤 렌더에서는 안 불리는" 훅이 되어 버린다.
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    enabled: !asking,
    contentRef,
  });

  // 아직 오늘 날짜를 못 읽었으면 아무것도 그리지 않는다. 훅을 전부 부른 **뒤**라야
  // 안전하다.
  if (!mysteryId || steps.length === 0) return null;

  const step = steps[index];

  // 상단에 작게 뜨는 현재 위치. 예) "환희의 신비 (월요일·토요일) · 3단"
  // 시작·마침 기도에는 단이 없으므로 신비 이름만 남는다.
  const mysteryHeading = getMysterySection(mysteryId).heading;
  const decadeLabel = step.decade ? t("rosary.decade").replace("{n}", String(step.decade)) : null;
  const context = [mysteryHeading, decadeLabel].filter(Boolean).join(" · ");

  // 묵상 문장이 없는 화면(기도문 화면 전부, 그리고 영어의 신비 선포 화면)에서는
  // 성화를 눌러도 팝업이 열리지 않도록 아예 핸들러를 넘기지 않는다.
  const canOpenImage = Boolean(step.image && step.explanation && step.explanation.length > 0);
  const openImage = canOpenImage
    ? () =>
        setFullScreenImage({
          src: step.image!,
          title: step.title,
          explanation: step.explanation!,
        })
    : undefined;

  return (
    <section
      ref={rootRef}
      className={styles.guide}
      aria-label={t("rosary.guideLabel")}
      // [TS] `{...객체}` 를 JSX 속성 자리에 쓰면 그 객체의 키가 전부 속성이 된다.
      //      여기서는 onTouchStart / onTouchMove / onTouchEnd 세 개가 붙는다.
      {...swipeHandlers}
    >
      {/* key={index} 를 준 이유: 화면이 바뀔 때마다 이 div 를 **버리고 새로 만들어야**
          CSS 슬라이드 애니메이션이 처음부터 다시 재생된다. 덤으로 스와이프 중에
          인라인으로 넣어 둔 transform 도 새 요소에서는 깨끗이 사라진다. */}
      <div
        ref={contentRef}
        key={index}
        className={`${styles.contentWrapper} ${
          slideDirection === "right" ? styles.slideInRight : styles.slideInLeft
        }`}
      >
        <RosaryStepView
          step={step}
          context={context}
          stepIndex={index}
          onImageClick={openImage}
        />

        {asking ? (
          /* 중첩 <dialog> 대신 그냥 이 자리에 그린다. 이미 열려 있는 창 안에
             모달을 또 띄우는 것보다, 같은 흐름의 한 단계로 보여 주는 편이 안전하다. */
          <div className={styles.confirm}>
            <p className={styles.confirmText}>
              {t("rosary.recordQuestion").replace("{count}", String(ROSARY_SET_SIZE))}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAsking(false)}
              >
                {t("common.cancel")}
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleConfirm}>
                {t("rosary.record")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {recorded && <p className={styles.recorded}>{t("rosary.recorded")}</p>}
            <div className={styles.bottomNav}>
              <button
                type="button"
                className={styles.bottomNavButton}
                onClick={handlePrev}
                disabled={index === 0}
                aria-label={t("rosary.previous")}
                title={t("rosary.previous")}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <polygon points="15,4 5,12 15,20"></polygon>
                </svg>
              </button>

              {/* "12 / 77" — 어디쯤 왔는지 알려 주는 유일한 표시다. */}
              <p className={styles.position}>
                {t("rosary.position")
                  .replace("{current}", String(index + 1))
                  .replace("{total}", String(steps.length))}
              </p>

              <button
                type="button"
                className={styles.bottomNavButton}
                onClick={handleNext}
                aria-label={t("rosary.next")}
                title={t("rosary.next")}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <polygon points="9,4 19,12 9,20"></polygon>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 팝업은 열려 있을 때만 아예 존재한다. 그래서 여는 코드가 따로 필요 없고,
          닫기는 이 값을 null 로 만들어 컴포넌트를 사라지게 하는 것으로 끝난다. */}
      {fullScreenImage && (
        <MysteryImageDialog
          src={fullScreenImage.src}
          title={fullScreenImage.title}
          explanation={fullScreenImage.explanation}
          onClose={() => setFullScreenImage(null)}
        />
      )}
    </section>
  );
}
