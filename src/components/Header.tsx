import styles from "./Header.module.css";

export function Header({ title }: { title: string }) {
  return (
    <header className={styles.header} data-app-chrome>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
