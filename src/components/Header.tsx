"use client";

import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export function Header({ title, wide }: { title: string; wide?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  // M3 tints and lifts the app bar once content passes under it. Without the
  // old 2px outline this is the only thing separating it from the page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
      data-app-chrome
    >
      {/* Mirrors <main>'s width so the title lines up with the content below
          instead of drifting to the far edge on a wide screen. */}
      <div className={`${styles.inner} ${wide ? styles.wide : ""}`}>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </header>
  );
}
