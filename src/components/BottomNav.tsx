"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import {
  BookIcon,
  CalendarIcon,
  HistoryIcon,
  HomeIcon,
  ReportListIcon,
  SecretarySettingsIcon,
  SettingsIcon,
} from "./icons/NavIcons";
import styles from "./BottomNav.module.css";

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
      isActive: pathname.startsWith("/history") || pathname.startsWith("/report"),
    },
    {
      href: "/tessera",
      label: t("nav.tessera"),
      Icon: BookIcon,
      swappable: true,
      isActive: pathname.startsWith("/tessera"),
    },
    {
      href: "/schedule",
      label: t("nav.schedule"),
      Icon: CalendarIcon,
      swappable: true,
      isActive: pathname.startsWith("/schedule"),
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
