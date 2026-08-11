"use client";

import type { RosaryStep } from "@/lib/rosaryMysteries";
import styles from "./RosaryGuide.module.css";

/**
 * 묵주기도 안내의 **화면 한 장**을 그린다.
 *
 * 위에서부터: 묵상 문장(단 안에서만) → 기도 이름 → 성화 → 기도문 본문.
 * "환희의 신비 · 3단" 같은 현재 위치는 여기가 아니라 창 제목 라인이 보여 준다
 * (`RosaryGuide` 가 `onContextChange` 로 올려 보낸다).
 *
 * 자기 상태가 하나도 없다. 어느 단계를 보여 줄지, 성화를 눌렀을 때 무엇을 할지는
 * 전부 부모(`RosaryGuide`)가 정한다. 그래서 이 파일은 "어떻게 생겼는가"만 담고,
 * "언제 무엇이 바뀌는가"는 담지 않는다.
 *
 * CSS 는 `RosaryGuide.module.css` 를 그대로 쓴다 — CSS 모듈은 여러 파일이
 * 함께 import 해도 된다.
 */

interface RosaryStepViewProps {
  step: RosaryStep;
  /**
   * 몇 번째 화면인지. 값을 쓰지는 않고 `key` 로만 쓴다 — 아래 설명 참고.
   */
  stepIndex: number;
  /** 성화를 눌렀을 때. 묵상 문장이 없으면 부모가 아무것도 넘기지 않는다. */
  onImageClick?: () => void;
  /**
   * 이전/다음 화면으로. 기도 이름 양끝의 화살표가 부른다.
   * 안 넘기면 화살표 대신 빈 칸을 그려 이름이 가운데를 지킨다 —
   * 첫 화면의 ◀, 확인창이 떠 있는 동안의 양쪽이 그 경우다.
   */
  onPrev?: () => void;
  onNext?: () => void;
}

export function RosaryStepView({
  step,
  stepIndex,
  onImageClick,
  onPrev,
  onNext,
}: RosaryStepViewProps) {
  const canOpenImage = Boolean(onImageClick);

  return (
    <>
      <div className={styles.stickyHead}>
        {/* 단이 진행되는 동안 계속 떠 있는 묵상 문장. 예) "예수님께서 우리를
            위하여 피땀 흘리심을 묵상합시다" — 성모송을 세는 중에도 무엇을
            묵상하는지 잊지 않게 한다. 시작·마침·선포 화면에는 없다. */}
        {step.meditation && <p className={styles.meditation}>{step.meditation}</p>}

        {/* [◀] 기도 이름 [▶] — 이름은 가운데, 화살표는 양끝. 화살표가 없을 때도
            빈 칸을 그려 이름이 흔들리지 않게 한다. */}
        <div className={styles.headingRow}>
          {onPrev ? (
            <button
              type="button"
              className={styles.stepArrow}
              onClick={onPrev}
              aria-label="이전"
              title="이전"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <polygon points="15,4 5,12 15,20"></polygon>
              </svg>
            </button>
          ) : (
            <span aria-hidden="true" />
          )}

          {/* key 가 바뀌면 React 는 이 <p> 를 고치는 게 아니라 **버리고 새로 만든다.**
              그래야 CSS 깜박임 애니메이션이 처음부터 다시 재생된다. 기도가 넘어갔다는
              걸 눈으로 알리는 게 목적이라 매 단계마다 다시 깜박여야 하는데, 성모송처럼
              제목 글자가 같으면 React 가 노드를 그대로 재사용해 애니메이션이 안 뛴다. */}
          <p key={stepIndex} className={styles.heading}>
            {step.title}
            {/* [TS] `{값 && <JSX/>}` — 값이 있을 때만 그린다. ordinal 은 반복되는
                기도("3 / 10")에만 있다. → docs/typescript-for-python.md#8-jsx-읽는-법 */}
            {step.ordinal && <span className={styles.ordinal}>{step.ordinal}</span>}
          </p>

          {onNext ? (
            <button
              type="button"
              className={styles.stepArrow}
              onClick={onNext}
              aria-label="다음"
              title="다음"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <polygon points="9,4 19,12 9,20"></polygon>
              </svg>
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </div>

      {/* 성화는 신비 선포 화면 5장에만 붙는다. */}
      {step.image && (
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export + images.unoptimized 라 next/image 는 용량만 늘린다 */}
          <img
            src={step.image}
            alt={step.title}
            className={styles.mysteryImage}
            // 경로가 코드로 조립되기 때문에(`/images/rosary/joyful-1.jpeg`) 파일이
            // 없어도 빌드는 통과한다. 그 경우 깨진 이미지 아이콘 대신 조용히 숨긴다.
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onClick={onImageClick}
            style={{ cursor: canOpenImage ? "pointer" : "default" }}
          />
        </div>
      )}

      {/* 신비 선포 화면은 제목이 곧 본문이라 lines 가 빈 배열이다. */}
      {step.lines.length > 0 && (
        <div className={styles.body}>
          {step.lines.map((line, i) => (
            <p key={i} className={styles.line}>
              {line}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
