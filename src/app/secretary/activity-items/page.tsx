"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import {
  createActivityItem,
  createDefaultActivityItems,
  sortActivityItemsByName,
} from "@/lib/activityItems";
import { storage } from "@/lib/storage";
import type { ActivityItem, ActivityLine } from "@/lib/types";
import styles from "./page.module.css";

/**
 * 활동 항목 목록을 편집하는 화면(`/secretary/activity-items`).
 *
 * 쁘레시디움마다 활동을 부르는 말이 조금씩 달라서, 내장 목록을 그대로 쓰지 않고
 * 고칠 수 있게 열어 두었다. 항목마다 공식 양식의 어느 줄로 집계될지도 정한다.
 */
const LINES: { value: ActivityLine; label: string }[] = [
  { value: "praesidium", label: "Pr.활동사항" },
  { value: "parish", label: "본당 지시사항" },
];

export default function ActivityItemsPage() {
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftLine, setDraftLine] = useState<ActivityLine>("praesidium");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setItems(sortActivityItemsByName(storage.getActivityItems()));
  }, [ready]);

  if (!ready) {
    return <PageShell title="Pr.활동사항 관리" wide>{null}</PageShell>;
  }

  /** Shown 가나다순; each item keeps its own `order`, which is what the
      report's activity lines print in. */
  const persist = (next: ActivityItem[]) => {
    setItems(sortActivityItemsByName(next));
    storage.setActivityItems(next);
  };

  const patchItem = (id: string, patch: Partial<ActivityItem>) => {
    persist(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleAdd = () => {
    const label = draftLabel.trim();
    if (!label) return;
    persist([...items, createActivityItem(label, draftLine, items.length)]);
    setDraftLabel("");
  };

  return (
    <PageShell title="Pr.활동사항 관리" wide>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          보고서 목록으로
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setResetOpen(true)}>
          기본 항목으로 되돌리기
        </button>
      </div>
      <p className={styles.hint}>단원이 활동을 입력할 때 고를 항목을 관리합니다. 항목마다 보고서의 어느 줄로 갈지 정해 두면, 월례 보고서가 알아서 나눠 적습니다.</p>
      <p className={styles.autoSaveNotice}>모든 변경 사항은 자동으로 저장됩니다.</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>항목 추가</h2>
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            value={draftLabel}
            placeholder="예: 교우 가정 방문"
            aria-label="항목 이름"
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <select
            className={styles.input}
            value={draftLine}
            aria-label="들어갈 줄"
            onChange={(e) => setDraftLine(e.target.value as ActivityLine)}
          >
            {LINES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" className={styles.primaryButton} onClick={handleAdd}>
            추가
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>항목 목록</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>항목 이름</th>
                <th>들어갈 줄</th>
                <th>사용</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={item.label}
                      aria-label="항목 이름"
                      onChange={(e) => patchItem(item.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.input}
                      value={item.line}
                      aria-label="들어갈 줄"
                      onChange={(e) =>
                        patchItem(item.id, { line: e.target.value as ActivityLine })
                      }
                    >
                      {LINES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {/* Hidden rather than deleted: removing an item outright would
                        drop it from reports that already counted it. */}
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={!item.hidden}
                      aria-label={`${item.label} ${"사용"}`}
                      onChange={(e) => patchItem(item.id, { hidden: !e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>사용을 끄면 새로 입력할 때 목록에 나오지 않습니다. 이미 입력된 기록은 그대로 남아 보고서에 계속 집계됩니다.</p>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="기본 항목으로 되돌릴까요?"
        body="직접 추가하거나 고친 항목이 모두 사라집니다. 이미 입력된 활동 기록은 남습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          persist(createDefaultActivityItems());
          setResetOpen(false);
          showToast("기본 항목으로 되돌렸습니다.");
        }}
      />
    </PageShell>
  );
}
