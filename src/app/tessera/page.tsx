"use client";

import { PageShell } from "@/components/PageShell";
import { TesseraViewer } from "@/components/TesseraViewer";
import { useTranslation } from "@/i18n/useTranslation";

export default function TesseraPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("nav.tessera")}>
      <TesseraViewer />
    </PageShell>
  );
}
