"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MysteryImageDialog } from "@/components/MysteryImageDialog";
import { PageShell } from "@/components/PageShell";
import { MYSTERY_MEDITATIONS } from "@/lib/rosaryMeditations";
import {
  DECADES_PER_ROSARY,
  getMysteryIdForDate,
  getMysterySection,
  HAIL_MARYS_PER_DECADE,
  type MysteryId,
} from "@/lib/rosaryMysteries";
import styles from "./page.module.css";

/**
 * 실험실의 "디지털 묵주"(`/lab/rosary`) — 손에 쥔 묵주 대신 화면을 두드려
 * 성모송을 한 알씩 세는 화면.
 *
 * 진짜 묵주처럼 **한 단 = 성모송 10알, 한 바퀴 = 5단(50알)** 구조를 따라간다.
 * 오늘 요일에 맞는 신비를 골라 지금 몇 단의 어느 신비를 묵상할 차례인지 보여 주고,
 * 성화를 누르면 묵상 문장 팝업(`MysteryImageDialog`)이 뜬다. 진동을 지원하는
 * 기기에서는 한 알마다 짧게, 단을 채우면 조금 길게 울린다.
 *
 * **묵주기도 안내 화면(`RosaryGuide`)과는 아무 상관이 없다.** 여기서 센 숫자는
 * 어디에도 저장되지 않고 주간 보고에도 반영되지 않는다. 화면을 벗어나면 사라진다.
 *
 * 하단 탭에는 없다. 들어오는 길은 **설정 → 실험실 → [디지털 묵주]** 하나뿐이다.
 *
 * 기도문 전문과 함께 따라 바치는 안내를 찾는다면: 홈 → 묵주기도 카드 → [기도문 보기]
 * (`src/components/RosaryGuide.tsx`, `docs/rosary/` 참고)
 */

/** 한 바퀴 = 5단 × 10알 = 50알. */
const ROSARY_TOTAL = DECADES_PER_ROSARY * HAIL_MARYS_PER_DECADE;

/**
 * 구슬 10알의 SVG 좌표. 위쪽(십자가 자리)만 60° 비워 두고 나머지 300°에
 * 고르게 놓는다. 1번 알이 오른쪽 위에서 시작해 시계 방향으로 돈다 —
 * 실제 묵주를 넘기는 방향과 같다.
 */
const BEAD_POSITIONS = Array.from({ length: HAIL_MARYS_PER_DECADE }, (_, i) => {
  const angle = ((-60 + i * (300 / (HAIL_MARYS_PER_DECADE - 1))) * Math.PI) / 180;
  return { x: 120 + 95 * Math.cos(angle), y: 120 + 95 * Math.sin(angle) };
});

/** 진동 미지원 기기(iOS Safari 등)에서는 조용히 아무 일도 하지 않는다. */
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function RosaryPage() {

  /** 오늘의 신비. 처음엔 null — 아래 useEffect 가 브라우저에서 정한다. */
  const [mysteryId, setMysteryId] = useState<MysteryId | null>(null);
  /** 이번 바퀴에서 센 성모송 수. 0~50. 50이면 완주 상태다. */
  const [beads, setBeads] = useState(0);
  /** 이 화면에 머무는 동안 완주한 바퀴 수. */
  const [rounds, setRounds] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [meditationOpen, setMeditationOpen] = useState(false);

  useEffect(() => {
    // 오늘이 무슨 요일인지는 브라우저에서만 알 수 있다(정적 export — 빌드 시점의
    // "오늘"은 배포하는 날이지 사용자가 앱을 여는 날이 아니다).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 정적 export 라 렌더 시점에는 오늘 날짜를 알 수 없다
    setMysteryId(getMysteryIdForDate(new Date()));
  }, []);

  const done = beads === ROSARY_TOTAL;
  /** 지금 바치는 단(0부터). 완주 상태에서는 마지막 단에 머문다. */
  const decadeIndex = done ? DECADES_PER_ROSARY - 1 : Math.floor(beads / HAIL_MARYS_PER_DECADE);
  /** 지금 단에서 채운 알 수. 완주 상태에서는 10알이 다 찬 채로 보여 준다. */
  const beadInDecade = done ? HAIL_MARYS_PER_DECADE : beads % HAIL_MARYS_PER_DECADE;

  const mystery = useMemo(() => (mysteryId ? getMysterySection(mysteryId) : null), [mysteryId]);
  const imageSrc = mysteryId ? `/images/rosary/${mysteryId}-${decadeIndex + 1}.jpeg` : "";
  const meditation = mysteryId ? (MYSTERY_MEDITATIONS[mysteryId]?.[decadeIndex + 1] ?? []) : [];

  const handleTap = () => {
    // 완주 상태에서 한 번 더 누르면 새 바퀴를 시작한다.
    if (done) {
      setBeads(0);
      vibrate(12);
      return;
    }
    const next = beads + 1;
    setBeads(next);
    if (next === ROSARY_TOTAL) {
      setRounds((r) => r + 1);
      vibrate([80, 60, 80, 60, 200]);
    } else if (next % HAIL_MARYS_PER_DECADE === 0) {
      vibrate([40, 60, 40]);
    } else {
      vibrate(12);
    }
  };

  const handleUndo = () => {
    if (beads === 0) return;
    // 완주 직후 되돌리면 완주 집계도 함께 되돌린다.
    if (done) setRounds((r) => Math.max(0, r - 1));
    setBeads(beads - 1);
  };

  const beadStatus = `성모송 ${beadInDecade} / ${HAIL_MARYS_PER_DECADE}`;
  const statusText = done
    ? "5단을 모두 바쳤습니다 · 눌러서 새로 시작"
    : `${decadeIndex + 1}단 · ${beadStatus}`;

  if (!mysteryId || !mystery) {
    return (
      <PageShell title="디지털 묵주">
        <div className={styles.container} />
      </PageShell>
    );
  }

  return (
    <PageShell title="디지털 묵주">
      <div className={styles.container}>
        {/* 오늘의 신비 + 지금 단의 묵상 주제. 성화를 누르면 묵상 팝업. */}
        <section className={styles.mysteryCard} aria-label={mystery.heading}>
          {meditation.length > 0 ? (
            <button
              type="button"
              className={styles.medallionButton}
              onClick={() => setMeditationOpen(true)}
              aria-label="성화와 묵상 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export + images.unoptimized 라 next/image 는 용량만 늘린다 */}
              <img
                src={imageSrc}
                alt=""
                className={styles.medallionImage}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            </button>
          ) : (
            <span className={styles.medallion}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export + images.unoptimized 라 next/image 는 용량만 늘린다 */}
              <img
                src={imageSrc}
                alt=""
                className={styles.medallionImage}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            </span>
          )}
          <span className={styles.mysteryText}>
            <span className={styles.mysteryHeading}>{mystery.heading}</span>
            <span className={styles.mysteryLine}>{mystery.lines[decadeIndex]}</span>
          </span>
        </section>

        {/* 묵주 본체. 원 전체가 버튼 하나라 어디를 눌러도 한 알이 오른다. */}
        <button
          type="button"
          className={`${styles.rosaryButton} ${done ? styles.doneState : ""}`}
          onClick={handleTap}
          aria-label={statusText}
        >
          <svg className={styles.ring} viewBox="0 0 240 240" aria-hidden="true">
            <circle className={styles.chain} cx="120" cy="120" r="95" />
            {/* 위쪽 빈자리의 작은 십자가 — 묵주의 십자가가 걸리는 자리다. */}
            <g className={styles.cross}>
              <rect x="117.5" y="10" width="5" height="28" rx="2.5" />
              <rect x="109" y="18" width="22" height="5" rx="2.5" />
            </g>
            {BEAD_POSITIONS.map((pos, i) => {
              const filled = i < beadInDecade;
              const justFilled = !done && filled && i === beadInDecade - 1;
              return (
                <circle
                  key={i}
                  className={`${styles.bead} ${filled ? styles.beadFilled : ""} ${
                    justFilled ? styles.beadPop : ""
                  }`}
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                />
              );
            })}
          </svg>
          <span className={styles.center} aria-hidden="true">
            {done ? (
              <>
                <span className={styles.doneTitle}>5단을 모두 바쳤습니다</span>
                <span className={styles.doneHint}>눌러서 새로 시작</span>
              </>
            ) : (
              <>
                <span className={styles.count}>{beadInDecade}</span>
                <span className={styles.countLabel}>
                  {beads === 0 ? "눌러서 시작하세요" : beadStatus}
                </span>
                <span className={styles.totalLabel}>
                  전체 {beads} / {ROSARY_TOTAL}알
                </span>
              </>
            )}
          </span>
        </button>

        {/* 화면 낭독기에는 여기서 진행 상황을 알린다(원 안의 글자는 aria-hidden). */}
        <p className={styles.srOnly} role="status">
          {statusText}
        </p>

        <div className={styles.stack}>
          {/* 5단 진행 표시. 색만이 아니라 ✓ 표시와 테두리 굵기로도 구분한다. */}
          <ol className={styles.decades}>
            {Array.from({ length: DECADES_PER_ROSARY }, (_, d) => {
              const isDone = done || d < decadeIndex;
              const isCurrent = !done && d === decadeIndex;
              return (
                <li
                  key={d}
                  className={`${styles.decadePill} ${
                    isDone ? styles.decadeDone : isCurrent ? styles.decadeCurrent : styles.decadeTodo
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {d + 1}단
                  {isDone && <span aria-hidden="true">✓</span>}
                </li>
              );
            })}
          </ol>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleUndo}
              disabled={beads === 0}
            >
              한 알 되돌리기
            </button>
            <button
              type="button"
              className={`${styles.controlButton} ${styles.resetButton}`}
              onClick={() => setConfirmingReset(true)}
              disabled={beads === 0}
            >
              처음부터
            </button>
          </div>

          {rounds > 0 && (
            <p className={styles.rounds}>완주 {rounds}바퀴</p>
          )}
          <p className={styles.notice}>여기서 센 숫자는 저장되지 않고, 주간 보고에도 반영되지 않습니다.</p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingReset}
        title="처음부터 다시 셀까요?"
        body={`지금까지 센 ${beads}알을 지우고 1단부터 다시 시작합니다.`}
        confirmLabel="처음부터"
        cancelLabel="취소"
        danger
        onConfirm={() => {
          setBeads(0);
          setConfirmingReset(false);
        }}
        onCancel={() => setConfirmingReset(false)}
      />

      {meditationOpen && (
        <MysteryImageDialog
          src={imageSrc}
          title={mystery.lines[decadeIndex]}
          explanation={meditation}
          onClose={() => setMeditationOpen(false)}
        />
      )}
    </PageShell>
  );
}
