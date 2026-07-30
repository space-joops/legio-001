"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { CalendarIcon, HistoryIcon, HomeIcon, SettingsIcon } from "./icons/NavIcons";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("nav.home"), Icon: HomeIcon },
    { href: "/history", label: t("nav.history"), Icon: HistoryIcon },
    { href: "/schedule", label: t("nav.schedule"), Icon: CalendarIcon },
    { href: "/settings", label: t("nav.settings"), Icon: SettingsIcon },
  ];

  return (
    <nav className={styles.nav} aria-label={t("nav.home")} data-app-chrome>
      {items.map(({ href, label, Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={styles.icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
