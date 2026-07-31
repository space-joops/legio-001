"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { useTranslation } from "@/i18n/useTranslation";
import {
  CalendarIcon,
  HistoryIcon,
  HomeIcon,
  PreviewIcon,
  ReportListIcon,
  SecretarySettingsIcon,
  SettingsIcon,
} from "./icons/NavIcons";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { reports } = useMonthlyReports();
  const isSecretary = pathname.startsWith("/secretary");

  const defaultItems = [
    { href: "/", label: t("nav.home"), Icon: HomeIcon, swappable: false },
    { href: "/history", label: t("nav.history"), Icon: HistoryIcon, swappable: true },
    { href: "/schedule", label: t("nav.schedule"), Icon: CalendarIcon, swappable: true },
    { href: "/settings", label: t("nav.settings"), Icon: SettingsIcon, swappable: true },
  ];

  const previewHref = reports[0]
    ? `/secretary/report?id=${reports[0].id}&mode=preview`
    : "/secretary";

  const secretaryItems = [
    {
      href: previewHref,
      label: t("secretary.navPreview"),
      Icon: PreviewIcon,
      isActive: pathname.startsWith("/secretary/report"),
    },
    {
      href: "/secretary",
      label: t("secretary.navReportList"),
      Icon: ReportListIcon,
      isActive: pathname === "/secretary",
    },
    {
      href: "/secretary/roster",
      label: t("secretary.navSettings"),
      Icon: SecretarySettingsIcon,
      isActive: pathname.startsWith("/secretary/roster"),
    },
  ];

  return (
    <nav className={styles.nav} aria-label={t("nav.home")} data-app-chrome data-secretary={isSecretary}>
      {defaultItems.map(({ href, label, Icon, swappable }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
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
        );
      })}
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
