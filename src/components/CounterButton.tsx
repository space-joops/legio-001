"use client";

import { useState, type ReactNode } from "react";
import { selectOnFocus } from "@/lib/selectOnFocus";
import styles from "./CounterButton.module.css";

/**
 * 기도 하나를 세는 큰 카드. 홈 화면에 5개가 세로로 놓인다.
 *
 * 두 가지 모습을 오간다.
 *   - 탭 모드(기본)   : 커다란 숫자를 누를 때마다 1씩 올라간다
 *   - 직접 입력 모드  : 숫자를 키보드로 쳐서 한 번에 넣는다
 *
 * 사용자층이 어르신 중심이라 손가락이 닿는 면적을 최대한 크게 잡았다. 그래서
 * 숫자 자체가 곧 버튼이다.
 *
 * 아래 `TapFace` / `NumericEntry` / `BeadRow` 는 이 파일에서만 쓰는 작은 조각들이다.
 * 한 return 안에 다 밀어 넣으면 괄호가 대여섯 겹 쌓이므로 이름을 붙여 떼어 놓았다.
 * 셋 다 자기 상태가 없고 받은 값을 그리기만 한다(state 는 전부 `CounterButton` 에 있다).
 */

interface CounterButtonProps {
  label: string;
  unitLabel?: string;
  icon: ReactNode;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetValue: (value: number) => void;
  onShowText?: () => void;
  /** 값이 있으면 탭이 숫자를 올리는 대신 이 개수만큼의 구슬을 채운다. */
  setSize?: number;
  /** 현재 세트에서 이미 채운 구슬 수(0 이상 setSize 미만). */
  setProgress?: number;
}

/** 묵주 구슬 표시줄. 채운 알과 빈 알을 그리고, 같은 내용을 글자로도 적는다. */
function BeadRow({ setSize, setProgress }: { setSize: number; setProgress: number }) {

  return (
    // 구슬 개수를 그림과 글자 양쪽으로 알린다. 채운 알과 빈 알은 색으로만
    // 구분되는데, 색만으로 상태를 나누면 알아보기 어려운 사람이 생긴다.
    <p className={styles.beads}>
      {/* aria-hidden: 이 부분은 장식이라 스크린 리더가 읽지 않게 한다. */}
      <span className={styles.beadRow} aria-hidden="true">
        {/* [TS] `Array.from({ length: n }, (_, i) => ...)` 는 파이썬의
            `[f(i) for i in range(n)]` 이다. `_` 는 "안 쓰는 값"이라는 관례적 이름.
            → docs/typescript-for-python.md#4-배열 */}
        {Array.from({ length: setSize }, (_, i) => (
          <span key={i} className={i < setProgress ? styles.beadFilled : styles.bead} />
        ))}
      </span>
      <span className={styles.beadCaption}>
        {setProgress} / {setSize}단
      </span>
    </p>
  );
}

interface TapFaceProps {
  label: string;
  count: number;
  setSize?: number;
  setProgress: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onOpenNumericMode: () => void;
}

/** 탭 모드 화면 — 커다란 숫자 버튼 + (묵주기도만) 구슬 + 빼기/직접입력 줄. */
function TapFace({
  label,
  count,
  setSize,
  setProgress,
  onIncrement,
  onDecrement,
  onOpenNumericMode,
}: TapFaceProps) {

  // [TS] `<>...</>` 는 Fragment 다. JSX 는 한 덩어리만 돌려줄 수 있는데,
  //      쓸데없는 <div> 를 하나 더 만들고 싶지 않을 때 이걸로 묶는다.
  return (
    <>
      <button
        type="button"
        className={styles.tapArea}
        onClick={onIncrement}
        aria-label={`${label} ${"탭하여 기록"}`}
      >
        <span className={styles.count}>{count}</span>
      </button>
      {setSize ? <BeadRow setSize={setSize} setProgress={setProgress} /> : null}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.minusButton}
          onClick={onDecrement}
          // 0에서 더 내려갈 곳이 없으면 버튼을 잠근다.
          disabled={count <= 0 && setProgress <= 0}
          aria-label={`${label} ${"빼기"}`}
        >
          −
        </button>
        <button type="button" className={styles.linkButton} onClick={onOpenNumericMode}>
          직접 숫자 입력
        </button>
      </div>
    </>
  );
}

interface NumericEntryProps {
  label: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onApply: () => void;
  onBlur: () => void;
  onBackToTapMode: () => void;
}

/** 직접 입력 모드 화면 — 숫자 입력칸 + 확인 버튼 + 돌아가기 링크. */
function NumericEntry({
  label,
  draft,
  onDraftChange,
  onApply,
  onBlur,
  onBackToTapMode,
}: NumericEntryProps) {

  return (
    <>
      <div className={styles.numericRow}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={onBlur}
          // 입력칸을 누르면 기존 숫자가 통째로 선택되어, 지우지 않고 바로 덮어쓸 수 있다.
          onFocus={selectOnFocus}
          aria-label={label}
          className={styles.numberInput}
        />
        <button type="button" className={styles.applyButton} onClick={onApply}>
          확인
        </button>
      </div>
      <button type="button" className={styles.linkButton} onClick={onBackToTapMode}>
        카운터로 보기
      </button>
    </>
  );
}

export function CounterButton({
  label,
  unitLabel,
  icon,
  count,
  onIncrement,
  onDecrement,
  onSetValue,
  onShowText,
  setSize,
  // [TS] `= 0` 은 기본값이다. 이 prop 을 안 넘기면 0 으로 친다.
  //      파이썬의 `def f(setProgress=0)` 과 같다.
  setProgress = 0,
}: CounterButtonProps) {
  const [numericMode, setNumericMode] = useState(false);
  // 타이핑 중인 값은 문자열로 들고 있는다. 지우는 도중의 빈 칸("")도 담아야 하고,
  // 숫자로 바꾸는 건 확정할 때 한 번만 하면 되기 때문이다.
  const [draft, setDraft] = useState(String(count));

  const openNumericMode = () => {
    setDraft(String(count));
    setNumericMode(true);
  };

  const applyDraft = () => {
    const parsed = Number.parseInt(draft, 10);
    // 숫자로 못 읽으면 0 으로 본다. `Number.isFinite` 는 NaN 과 무한대를 함께 걸러 준다.
    onSetValue(Number.isFinite(parsed) ? parsed : 0);
    setNumericMode(false);
  };

  // 예전에는 [확인]을 눌러야만 반영돼서, 숫자를 치고 다른 곳을 누르면 조용히
  // 사라졌다. 입력칸을 벗어날 때도 반영하도록 바꿨다. 단 칸이 비어 있으면
  // 0 으로 만들지 않고 원래 숫자를 그대로 둔다.
  const commitDraftOnBlur = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) onSetValue(Math.max(0, parsed));
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.headerIcon}>{icon}</span>
        <span>{label}</span>
        {/* [TS] `{값 && <JSX/>}` 는 "값이 참일 때만 그려라"라는 관용구다.
            파이썬의 `X if cond else None` 자리에 해당한다.
            → docs/typescript-for-python.md#8-jsx-읽는-법 */}
        {unitLabel && <span className={styles.unit}>({unitLabel})</span>}
        {onShowText && (
          <button type="button" className={styles.textLink} onClick={onShowText}>
            기도문 보기
          </button>
        )}
      </div>

      {numericMode ? (
        <NumericEntry
          label={label}
          draft={draft}
          onDraftChange={setDraft}
          onApply={applyDraft}
          onBlur={commitDraftOnBlur}
          onBackToTapMode={() => setNumericMode(false)}
        />
      ) : (
        <TapFace
          label={label}
          count={count}
          setSize={setSize}
          setProgress={setProgress}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onOpenNumericMode={openNumericMode}
        />
      )}
    </div>
  );
}
