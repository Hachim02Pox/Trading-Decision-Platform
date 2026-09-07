import type { GoldOvernightRecapResponse, Language } from "@gold-terminal/contracts";
import { checkAndStartCooldown } from "./onDemandCooldown";
import { isRealLlmProviderConfigured } from "./providers/realLlmProviderRegistry";
import { runGoldOvernightCli } from "./providers/goldOvernightCliRunner";
import { combineGoldOvernightRuns } from "./goldOvernightCombiner";
import { loadGoldOvernightRecaps, saveGoldOvernightRecaps, type GoldOvernightRecapByLanguage } from "./runtimeStore";

// Overnight Gold Recap — user-explicit second button: pure web-research
// commentary on Gold's own overnight price action, in multiple languages.
// CLI-only, same rationale as globalReadAnalysis.ts (no metered fallback —
// this is a large multi-search call, never worth billing per-token for).
const GOLD_OVERNIGHT_COOLDOWN_MS = 10 * 60_000; // 10 minutes
const CLI_PROVIDER_IDS: readonly ("claude-cli" | "codex-cli")[] = ["claude-cli", "codex-cli"];

function cooldownKey(language: Language): string {
  return `gold-overnight::${language}`;
}

function configuredCliProviderIds(): ("claude-cli" | "codex-cli")[] {
  return CLI_PROVIDER_IDS.filter((id) => isRealLlmProviderConfigured(id));
}

let cachedRecaps: GoldOvernightRecapByLanguage | null = null;

function getCachedRecaps(): GoldOvernightRecapByLanguage {
  if (cachedRecaps === null) cachedRecaps = loadGoldOvernightRecaps();
  return cachedRecaps;
}

function persist(language: Language, recap: NonNullable<GoldOvernightRecapResponse["recap"]>): void {
  const next = { ...getCachedRecaps(), [language]: recap };
  cachedRecaps = next;
  saveGoldOvernightRecaps(next);
}

function notConfiguredResponse(): GoldOvernightRecapResponse {
  return {
    status: "NOT_CONFIGURED",
    recap: null,
    message: "No CLI provider is available. Log in to the Claude Code CLI (`claude`) or the Codex CLI (`codex`) on this machine.",
    configuredProviderCount: 0,
    cooldownRemainingMs: null,
  };
}

export function getCachedGoldOvernightRecap(language: Language): GoldOvernightRecapResponse {
  const cached = getCachedRecaps()[language];
  const configuredCount = configuredCliProviderIds().length;
  if (!cached) return { status: "NONE", recap: null, message: null, configuredProviderCount: configuredCount, cooldownRemainingMs: null };
  return { status: "OK", recap: cached, message: null, configuredProviderCount: configuredCount, cooldownRemainingMs: null };
}

export interface GoldOvernightDeps {
  sessionId: string;
}

export async function runGoldOvernightRecap(language: Language, deps: GoldOvernightDeps): Promise<GoldOvernightRecapResponse> {
  const configured = configuredCliProviderIds();
  if (configured.length === 0) return notConfiguredResponse();

  const key = cooldownKey(language);
  const cooldown = checkAndStartCooldown(key, Date.now(), GOLD_OVERNIGHT_COOLDOWN_MS);
  if (!cooldown.allowed) {
    const cached = getCachedRecaps()[language] ?? null;
    return {
      status: "COOLDOWN",
      recap: cached,
      message: `Please wait ${Math.ceil(cooldown.remainingMs / 60_000)} more minute(s) before running this again.`,
      configuredProviderCount: configured.length,
      cooldownRemainingMs: cooldown.remainingMs,
    };
  }

  const runs = await runGoldOvernightCli(configured, language);
  const recap = combineGoldOvernightRuns(runs, language, deps.sessionId);

  if (!recap) {
    const failureDetail = runs.map((r) => `${r.role}: ${r.errorMessage ?? "unknown failure"}`).join(" | ");
    return {
      status: "UNAVAILABLE",
      recap: null,
      message: `Overnight recap failed for every available agent this run — please try again. (${failureDetail})`,
      configuredProviderCount: configured.length,
      cooldownRemainingMs: null,
    };
  }

  persist(language, recap);
  return { status: "OK", recap, message: null, configuredProviderCount: configured.length, cooldownRemainingMs: null };
}

/** Test-only escape hatch. */
export function __resetGoldOvernightStateForTests(): void {
  cachedRecaps = {};
}
