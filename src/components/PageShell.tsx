import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import styles from "./PageShell.module.css";

/**
 * 거의 모든 화면이 쓰는 공통 뼈대 — 상단 헤더 + 본문 + 하단 탭.
 *
 * `wide` 를 주면 넓은 화면에서 본문이 더 넓게 퍼진다(표가 많은 서기 화면용).
 */
export function PageShell({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Header title={title} wide={wide} />
      <main className={`${styles.main} ${wide ? styles.wide : ""}`}>{children}</main>
      <BottomNav />
    </>
  );
}
