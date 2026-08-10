"use client";

import { useState } from "react";
import { PRAYER_ITEMS, ROSARY_SET_SIZE } from "@/lib/constants";
import { PRAYER_TEXTS } from "@/lib/prayerTexts";
import type { PrayerCounts, PrayerItemKey } from "@/lib/types";
import { CounterButton } from "./CounterButton";
import { PrayerTextDialog } from "./PrayerTextDialog";
import { RosaryGuide } from "./RosaryGuide";
import { AspirationIcon } from "./icons/AspirationIcon";
import { ChainPrayerIcon } from "./icons/ChainPrayerIcon";
import { MassIcon } from "./icons/MassIcon";
import { PriestIcon } from "./icons/PriestIcon";
import { RosaryIcon } from "./icons/RosaryIcon";

/**
 * 홈 화면의 카운터 5개를 세로로 늘어놓고, 기도문 보기 창을 함께 관리한다.
 *
 * 이 컴포넌트에는 "몇 번 눌렀는지"가 없다. 숫자는 부모(`app/page.tsx`)가 들고
 * 있고 여기는 받아서 그리기만 한다. 대신 "어떤 기도문 창이 열려 있는지"는
 * 다른 화면과 상관없는 순수한 표시 상태라 여기서 직접 들고 있다.
 *
 * 카운터를 추가·삭제하거나 순서를 바꾸려면 이 파일이 아니라
 * `src/lib/constants.ts` 의 `PRAYER_ITEMS` 를 고치면 된다.
 */

/**
 * 설정에 적힌 아이콘 이름("mass" 등)을 실제 아이콘 컴포넌트로 바꿔 주는 표.
 *
 * [TS] 값이 컴포넌트(함수)다. JS 에서 함수는 그냥 값이라 이렇게 객체에 담거나
 *      인자로 넘길 수 있다. 파이썬과 같다.
 */
const ICONS = {
  mass: MassIcon,
  priest: PriestIcon,
  chain: ChainPrayerIcon,
  rosary: RosaryIcon,
  aspiration: AspirationIcon,
};

interface CounterGridProps {
  counts: PrayerCounts;
  onIncrement: (key: PrayerItemKey) => void;
  onDecrement: (key: PrayerItemKey) => void;
  onSetValue: (key: PrayerItemKey, value: number) => void;
  /** 현재 묵주 세트에서 채운 구슬 수. */
  rosarySetProgress: number;
  onRosaryRecordSet: () => void;
}

export function CounterGrid({
  counts,
  onIncrement,
  onDecrement,
  onSetValue,
  rosarySetProgress,
  onRosaryRecordSet,
}: CounterGridProps) {
  // 지금 기도문 창이 열려 있는 카운터. null 이면 창이 닫힌 상태다.
  const [viewingKey, setViewingKey] = useState<PrayerItemKey | null>(null);

  const viewingItem = viewingKey ? PRAYER_ITEMS.find((item) => item.key === viewingKey) : null;
  // [TS] `PRAYER_TEXTS[viewingKey] ?? null` — 그 카운터에 기도문이 없으면
  //      undefined 가 나오므로 `??` 로 null 을 대신 넣는다.
  //      → docs/typescript-for-python.md#5-널-다루기
  const viewingEntry = viewingKey ? (PRAYER_TEXTS[viewingKey] ?? null) : null;

  // 묵주기도 창에만 5단 안내와 진행 표시가 따로 붙는다. JSX 안에 조건을 끼워
  // 넣으면 괄호가 겹치므로, 값으로 먼저 계산해 두고 아래에서는 넘기기만 한다.
  const isRosary = viewingKey === "rosaryDecades";
  const rosaryGuide = isRosary ? (
    <RosaryGuide onRecordSet={onRosaryRecordSet} progress={rosarySetProgress} />
  ) : undefined;
  const rosaryCaption = isRosary ? `${rosarySetProgress} / ${ROSARY_SET_SIZE}단` : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {/* [TS] 배열을 `.map()` 으로 돌려 컴포넌트 목록을 만든다. 파이썬의
          리스트 컴프리헨션과 같다. `key` 는 React 가 각 줄을 구분하는 데 쓰는
          필수 표시로, 화면에는 보이지 않는다. → docs/typescript-for-python.md#8-jsx-읽는-법 */}
      {PRAYER_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const hasText = Boolean(PRAYER_TEXTS[item.key]);
        return (
          <CounterButton
            key={item.key}
            label={item.label}
            unitLabel={item.unitLabel}
            icon={<Icon />}
            count={counts[item.key]}
            onIncrement={() => onIncrement(item.key)}
            onDecrement={() => onDecrement(item.key)}
            onSetValue={(value) => onSetValue(item.key, value)}
            // 기도문이 없는 카운터는 "기도문 보기" 링크 자체를 만들지 않는다.
            onShowText={hasText ? () => setViewingKey(item.key) : undefined}
            setSize={item.setSize}
            setProgress={item.setSize ? rosarySetProgress : undefined}
          />
        );
      })}
      {/* 기도문 창은 카운터마다 하나씩 두지 않고 전체에 하나만 둔다.
          어느 카운터를 눌렀는지는 viewingKey 로 구분한다. */}
      <PrayerTextDialog
        title={viewingItem?.label ?? ""}
        entry={viewingEntry}
        count={viewingKey ? counts[viewingKey] : 0}
        onIncrement={() => viewingKey && onIncrement(viewingKey)}
        onClose={() => setViewingKey(null)}
        guide={rosaryGuide}
        incrementCaption={rosaryCaption}
      />
    </div>
  );
}
