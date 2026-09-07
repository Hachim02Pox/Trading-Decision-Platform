"use client";

import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import styles from "./PlaceholderSection.module.css";

interface PlaceholderSectionProps {
  titleKey: TranslationKey;
}

export function PlaceholderSection({ titleKey }: PlaceholderSectionProps) {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className={styles.pageTitle}>{t(titleKey)}</h1>
      <div className={styles.box}>
        <p className={styles.body}>{t("placeholder.body")}</p>
      </div>
    </div>
  );
}
