"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
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
  const { t } = useTranslation();
  const pathname = usePathname();
  const isSecretary = pathname.startsWith("/secretary");

  const defaultItems = [
    { href: "/", label: t("nav.home"), Icon: HomeIcon, swappable: false, isActive: pathname === "/" },
    {
      href: "/history",
      label: t("nav.history"),
      Icon: HistoryIcon,
      swappable: true,
      // A weekly report detail is part of the history flow, so the tab stays lit
      // there — mirrors how /secretary/report keeps the report-list tab active.
      isActive: pathname.startsWith("/history") || pathname.startsWith("/report"),
    },
    {
      href: "/schedule",
      label: t("nav.schedule"),
      Icon: CalendarIcon,
      swappable: true,
      isActive: pathname.startsWith("/schedule"),
    },
    {
      href: "/tessera",
      label: t("nav.tessera"),
      Icon: TesseraIcon,
      swappable: true,
      isActive: pathname.startsWith("/tessera"),
    },
    {
      href: "/settings",
      label: t("nav.settings"),
      Icon: SettingsIcon,
      swappable: true,
      isActive: pathname.startsWith("/settings"),
    },
  ];

  const secretaryItems = [
    {
      href: "/secretary",
      label: t("secretary.navReportList"),
      Icon: ReportListIcon,
      isActive: pathname === "/secretary" || pathname.startsWith("/secretary/report"),
    },
    {
      href: "/secretary/roster",
      label: t("secretary.navSettings"),
      Icon: SecretarySettingsIcon,
      isActive: pathname.startsWith("/secretary/roster"),
    },
  ];

  return (
    <nav className={styles.nav} aria-label={t("nav.menuLabel")} data-app-chrome data-secretary={isSecretary}>
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
