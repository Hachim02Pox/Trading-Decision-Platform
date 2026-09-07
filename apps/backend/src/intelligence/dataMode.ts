// Milestone 1C — mock/real safety gate. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md
// ("The mock/real safety gate"). Default is ALWAYS "DEV_MOCK" unless
// DATA_MODE=REAL is explicitly set.
//
// Real intelligence pilot update: REAL mode is now genuinely implemented,
// but ONLY for the deliberate 5-KPI pilot set (see realIntelligencePilot.ts)
// — every other cockpit KPI keeps using the mock generator even when
// DATA_MODE=REAL. That per-KPI real/mock decision is made explicitly, KPI
// by KPI, in bootstrap.ts's `resolveInterpretation` — this module no longer
// blanket-refuses REAL mode, since real generation genuinely exists now.
//
// What this module still guards against: a fully-unconfigured REAL flip —
// DATA_MODE=REAL set with not a single real LLM provider credential
// present anywhere. That is almost certainly a mistake (real mode was
// requested but nothing at all is actually wired up to serve it), and
// booting silently into a REAL-labeled session that is actually 100% mock
// underneath would be exactly the "silently do something unintended"
// failure mode this gate has always existed to prevent. Any OTHER
// real-mode code path this pilot does not implement continues to fail
// loudly at the point it is actually exercised (e.g. a pilot KPI's
// generateRealInterpretationForKpi throwing/returning null on a genuinely
// uncovered case) rather than here at boot.
import { loadAppConfig } from "../config/env";

export type DataMode = "DEV_MOCK" | "REAL";

export function getDataMode(): DataMode {
  return process.env.DATA_MODE === "REAL" ? "REAL" : "DEV_MOCK";
}

export function assertRealModeIsCoveredOrThrow(): void {
  if (getDataMode() !== "REAL") return;

  const { providers } = loadAppConfig();
  const anyRealProviderConfigured = providers.openai !== null || providers.anthropic !== null || providers.gemini !== null;
  if (!anyRealProviderConfigured) {
    throw new Error(
      "DATA_MODE=REAL is set but none of OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY is configured — " +
        "refusing to boot in an ambiguous state where 'REAL' mode would silently behave as 100% mock. Configure at " +
        "least one real LLM provider credential, or unset DATA_MODE (or set it to DEV_MOCK) to run the mock KPI " +
        "intelligence pipeline."
    );
  }
}
