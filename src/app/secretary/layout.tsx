import type { ReactNode } from "react";
import styles from "./layout.module.css";

export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return <div className={styles.themed}>{children}</div>;
}
