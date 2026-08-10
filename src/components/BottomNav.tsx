"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  HistoryIcon,
  HomeIcon,
  ReportListIcon,
  SecretarySettingsIcon,
  SettingsIcon,
  TesseraIcon,
} from "./icons/NavIcons";
import styles from "./BottomNav.module.css";

/**
 * 화면 맨 아래 고정된 탭 바.
 *
 * 주소가 `/secretary` 로 시작하면 탭 두 개가 서기용으로 바뀐다. 개인용 화면과
 * 서기용 화면을 오갈 때 길을 잃지 않게 하려는 장치다.
 */
export function BottomNav() {
  const pathname = usePathname();
  const isSecretary = pathname.startsWith("/secretary");

  const defaultItems = [
    { href: "/", label: "홈", Icon: HomeIcon, swappable: false, isActive: pathname === "/" },
    {
      href: "/history",
      label: "기록",
      Icon: HistoryIcon,
      swappable: true,
      // A weekly report detail is part of the history flow, so the tab stays lit
      // there — mirrors how /secretary/report keeps the report-list tab active.
      isActive: pathname.startsWith("/history") || pathname.startsWith("/report"),
    },
    {
      href: "/schedule",
      label: "일정",
      Icon: CalendarIcon,
      swappable: true,
      isActive: pathname.startsWith("/schedule"),
    },
    {
      href: "/tessera",
      label: "뗏세라",
      Icon: TesseraIcon,
      swappable: true,
      isActive: pathname.startsWith("/tessera"),
    },
    {
      href: "/settings",
      label: "설정",
      Icon: SettingsIcon,
      swappable: true,
      isActive: pathname.startsWith("/settings"),
    },
  ];

  const secretaryItems = [
    {
      href: "/secretary",
      label: "보고서",
      Icon: ReportListIcon,
      isActive: pathname === "/secretary" || pathname.startsWith("/secretary/report"),
    },
    {
      href: "/secretary/roster",
      label: "명단 관리",
      Icon: SecretarySettingsIcon,
      isActive: pathname.startsWith("/secretary/roster"),
    },
  ];

  return (
    <nav className={styles.nav} aria-label="주 메뉴" data-app-chrome data-secretary={isSecretary}>
      {defaultItems.map(({ href, label, Icon, swappable, isActive }) => (
        <Link
          key={href}
          href={href}
          className={`${styles.item} ${swappable ? styles.swappable : ""} ${
            isActive ? styles.itemActive : ""
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className={styles.icon} />
          <span>{label}</span>
        </Link>
      ))}
      {secretaryItems.map(({ href, label, Icon, isActive }) => (
        <Link
          key={href}
          href={href}
          className={`${styles.item} ${styles.secretaryOnly} ${isActive ? styles.itemActive : ""}`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className={styles.icon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
