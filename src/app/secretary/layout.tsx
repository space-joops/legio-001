import type { ReactNode } from "react";
import { SecretaryModeBanner } from "@/components/SecretaryModeBanner";
import styles from "./layout.module.css";

export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.themed}>
      <SecretaryModeBanner />
      {children}
    </div>
  );
}
