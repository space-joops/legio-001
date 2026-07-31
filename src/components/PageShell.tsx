import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import styles from "./PageShell.module.css";

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
      <Header title={title} />
      <main className={`${styles.main} ${wide ? styles.wide : ""}`}>{children}</main>
      <BottomNav />
    </>
  );
}
