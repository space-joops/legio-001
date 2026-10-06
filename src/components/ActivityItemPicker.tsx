"use client";

import { useEffect, useRef, useState } from "react";
import { matchesKoreanQuery, matchesTextQuery } from "@/lib/koreanSearch";
import styles from "./ActivityItemPicker.module.css";

/**
 * 활동 입력 창 안에서 항목을 고르는 화면. 검색칸 + 묶음별 버튼 목록.
 *
 * 예전에는 <select> 하나에 50개 넘는 항목이 들어 있어 휴대폰에서 끝없이 스크롤해야
 * 했다. 여기서는 검색어(초성 가능)로 바로 좁히고, 묶음 이름으로 찾으면 그 묶음
 * 전체가 나온다("교우돌봄" → 교우돌봄 칸 8개). 맞는 항목이 없으면 검색어 그대로
 * 직접 입력할 수 있다.
 */

export interface PickerOption {
  /** 목록 안에서만 쓰는 고유값. */
  id: string;
  label: string;
}

export interface PickerGroup {
  label: string;
  options: PickerOption[];
}

interface Props {
  groups: PickerGroup[];
  /** 검색어를 그대로 쓰는 버튼의 문구. 예: (q) => `"${q}" 기타 활동으로 입력` */
  customActionLabel: (query: string) => string;
  onPick: (optionId: string) => void;
  onPickCustom: (label: string) => void;
}

export function ActivityItemPicker({ groups, customActionLabel, onPick, onPickCustom }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim();
  const visible = groups
    .map((group) =>
      matchesTextQuery(group.label, query) && trimmed
        ? group
        : { ...group, options: group.options.filter((o) => matchesKoreanQuery(o.label, query)) }
    )
    .filter((group) => group.options.length > 0);
  const resultCount = visible.reduce((sum, g) => sum + g.options.length, 0);

  return (
    <div className={styles.picker}>
      <div className={styles.searchBar}>
        <input
          ref={inputRef}
          type="search"
          className={styles.search}
          value={query}
          placeholder="활동 검색 (예: 연도, ㅇㄷ)"
          aria-label="활동 검색"
          enterKeyHint="search"
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className={styles.count} role="status">
          {trimmed ? `${resultCount}개 찾음` : "검색하거나 아래 목록에서 골라 주세요."}
        </p>
      </div>

      <div className={styles.results}>
        {visible.map((group) => (
          <section key={group.label} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.label}</h3>
            <div className={styles.options}>
              {group.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.option}
                  onClick={() => onPick(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        ))}

        {trimmed && (
          <section className={styles.group}>
            <h3 className={styles.groupTitle}>
              {resultCount === 0 ? "찾는 항목이 없습니다" : "찾는 항목이 없으면"}
            </h3>
            <button
              type="button"
              className={styles.customOption}
              onClick={() => onPickCustom(trimmed)}
            >
              {customActionLabel(trimmed)}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
