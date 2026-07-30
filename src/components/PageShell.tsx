import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import styles from "./PageShell.module.css";

export function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header title={title} />
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </>
  );
}
