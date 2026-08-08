import styles from "./Header.module.css";

/** 화면 맨 위의 제목 줄. `PageShell` 이 붙여 준다. */
export function Header({ title, wide }: { title: string; wide?: boolean }) {
  return (
    <header className={styles.header} data-app-chrome>
      {/* Mirrors <main>'s width so the title lines up with the content below
          instead of drifting to the far edge on a wide screen. */}
      <div className={`${styles.inner} ${wide ? styles.wide : ""}`}>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </header>
  );
}
