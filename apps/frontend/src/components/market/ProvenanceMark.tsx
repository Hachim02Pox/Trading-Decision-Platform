"use client";

import type { Provenance } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./ProvenanceMark.module.css";

interface ProvenanceMarkProps {
  provenance: Provenance;
}

export function ProvenanceMark({ provenance }: ProvenanceMarkProps) {
  const { t } = useTranslation();
  switch (provenance) {
    case "observed":
      return null;
    case "derived":
      return (
        <sup className={styles.derived} title={t("provenance.derivedTooltip")}>
          f
        </sup>
      );
    case "estimated":
      return (
        <span className={styles.estimated} title={t("provenance.estimatedTooltip")}>
          ~
        </span>
      );
    case "ai":
      return (
        <span className={styles.aiChip} title={t("provenance.aiTooltip")}>
          {t("provenance.aiReadBadge")}
        </span>
      );
    default:
      return null;
  }
}
