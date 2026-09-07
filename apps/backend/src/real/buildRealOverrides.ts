import type { FamilyId } from "@gold-terminal/contracts";
import { buildF2Overrides } from "./f2Rates";
import { buildF3Overrides } from "./f3Fed";
import { buildF4Overrides } from "./f4Inflation";
import { buildF5Overrides } from "./f5Employment";
import { buildF6Overrides } from "./f6Currency";
import { buildF7Overrides } from "./f7Risk";
import { buildF8Overrides } from "./f8Liquidity";
import { buildF9Overrides } from "./f9Treasury";
import { buildF10Overrides } from "./f10Flows";
import { buildF11Overrides } from "./f11GoldVol";
import { buildF12Overrides } from "./f12PhysicalGold";
import type { FamilyOverrideResult } from "./types";

/** The families with any real-data KPI (including a family whose every KPI is real-attempted-but-permanently-UNAVAILABLE, e.g. F12). The only untouched family is F13. F6 (RECONSTRUCTED_DXY, six FRED FX legs) added a prior pass — see apps/backend/src/real/f6Currency.ts. F12 (Physical/Structural Gold) is restored here as an honest UNAVAILABLE family (no free API exists) — see apps/backend/src/real/f12PhysicalGold.ts and docs/MVP_COCKPIT_CONTRACT.md's updated top-of-file note. */
export const REAL_FAMILY_IDS: readonly FamilyId[] = ["F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

/**
 * Builds the real-data overrides for all real families in parallel. Each
 * builder already wraps its own provider fetch(es) in try/catch — a single
 * family's (or a single KPI's) provider failure never throws out of this
 * function and never affects another family, matching "one family's fetch
 * failure must not take down others" from the milestone brief. Each builder
 * also has its own internal TTL cache (see ./cache.ts), so calling this on
 * every request is cheap outside of the rare cache-expiry request.
 */
export async function buildRealFamilyOverrides(): Promise<Partial<Record<FamilyId, FamilyOverrideResult>>> {
  const [f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12] = await Promise.all([
    buildF2Overrides(),
    buildF3Overrides(),
    buildF4Overrides(),
    buildF5Overrides(),
    buildF6Overrides(),
    buildF7Overrides(),
    buildF8Overrides(),
    buildF9Overrides(),
    buildF10Overrides(),
    buildF11Overrides(),
    buildF12Overrides(),
  ]);
  return { F2: f2, F3: f3, F4: f4, F5: f5, F6: f6, F7: f7, F8: f8, F9: f9, F10: f10, F11: f11, F12: f12 };
}
