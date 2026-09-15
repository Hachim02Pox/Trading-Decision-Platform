import type { DisplayRelationship } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import styles from "./RelationshipChip.module.css";

interface RelationshipChipProps {
  relationship: DisplayRelationship;
}

// Milestone 1C: the "CONTEXTUAL" bucket renders and reads as "Contextual" —
// rendered with the relationship-contextual (muted yellow) token, not the
// gray kpi-neutral token. See DESIGN.md §2.1 and
// docs/MVP_COCKPIT_CONTRACT.md's color-system note. Milestone 1D: the label
// is now translated (EN/FR); the color token mapping is unchanged.
const CHIP_CONFIG: Record<DisplayRelationship, { labelKey: TranslationKey; className: string }> = {
  SUPPORTIVE: { labelKey: "relationship.supportive", className: styles.support },
  ADVERSE: { labelKey: "relationship.adverse", className: styles.adverse },
  CONTEXTUAL: { labelKey: "relationship.contextual", className: styles.contextual },
};

export function RelationshipChip({ relationship }: RelationshipChipProps) {
  const { t } = useTranslation();
  const config = CHIP_CONFIG[relationship];
  return <span className={`${styles.chip} ${config.className}`}>{t(config.labelKey)}</span>;
}
