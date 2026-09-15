import type { DisplayRelationship } from "@gold-terminal/contracts";
import type { TranslationKey } from "@/i18n/en";

/**
 * Exact `finalGoldRead` -> color-token mapping (Milestone 1E, section 15
 * locks this down with a test): SUPPORTIVE -> support (green) token,
 * ADVERSE -> adverse (red) token, CONTEXTUAL -> relationship-contextual
 * (yellow) token. No other combination is valid. Keys here name the CSS
 * Modules class (defined in FamilyModule.module.css) rather than the raw
 * token, since the class is what components actually apply.
 */
export const DISPLAY_RELATIONSHIP_ROW_CLASS_KEY: Record<DisplayRelationship, "rowSupport" | "rowAdverse" | "rowContextual"> = {
  SUPPORTIVE: "rowSupport",
  ADVERSE: "rowAdverse",
  CONTEXTUAL: "rowContextual",
};

export const DISPLAY_RELATIONSHIP_LABEL_KEY: Record<DisplayRelationship, TranslationKey> = {
  SUPPORTIVE: "relationship.supportive",
  ADVERSE: "relationship.adverse",
  CONTEXTUAL: "relationship.contextual",
};
