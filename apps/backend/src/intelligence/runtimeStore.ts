import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { GoldOvernightRecap, KpiInterpretation, ResearchRun } from "@gold-terminal/contracts";
import { RUNTIME_DIR } from "./sessionGuard";

// Patch 4 — `.runtime/` is an ephemeral session/dev cache, wiped/regenerated
// per new APP_SESSION_ID. It is NOT the product's durable analysis history
// (that role belongs to MySQL once persistence is implemented — not this
// milestone). See docs/KPI_INTELLIGENCE_ARCHITECTURE.md.

const INTERPRETATIONS_FILE = join(RUNTIME_DIR, "interpretations.json");
const RESEARCH_RUN_FILE = join(RUNTIME_DIR, "researchRun.json");
const REAL_RESEARCH_RUN_FILE = join(RUNTIME_DIR, "realResearchRun.json");
// On-demand per-KPI analysis (manual button) — a SEPARATE persisted cache
// from `interpretations.json` above, so an on-demand real result for a KPI
// never collides with (or gets silently overwritten by) that KPI's eager
// mock/pilot interpretation. Reload-safe: a page reload re-reads this file
// via onDemandAnalysis.ts's lazy in-memory hydration rather than losing the
// already-paid-for result and needing a fresh paid call to see it again.
const ON_DEMAND_INTERPRETATIONS_FILE = join(RUNTIME_DIR, "onDemandInterpretations.json");
// Overnight Gold Recap (multi-language news briefing) — its own file, keyed
// by language, same reload-safe rationale as the on-demand file above.
const GOLD_OVERNIGHT_RECAP_FILE = join(RUNTIME_DIR, "goldOvernightRecap.json");

function ensureRuntimeDir(): void {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

export type InterpretationsById = Record<string, KpiInterpretation>;

export function loadInterpretations(): InterpretationsById {
  if (!existsSync(INTERPRETATIONS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(INTERPRETATIONS_FILE, "utf-8")) as InterpretationsById;
  } catch (err) {
    // Malformed cache file — recover as if nothing were cached (a fresh
    // session's worth of interpretations will be regenerated), but never
    // silently: emit a structured warning (Milestone 1E, section 16).
    console.warn(
      JSON.stringify({
        msg: "malformed runtime state, regenerating",
        file: INTERPRETATIONS_FILE,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return {};
  }
}

export function saveInterpretations(interpretations: InterpretationsById): void {
  ensureRuntimeDir();
  writeFileSync(INTERPRETATIONS_FILE, JSON.stringify(interpretations, null, 2), "utf-8");
}

export function loadResearchRun(): ResearchRun | null {
  if (!existsSync(RESEARCH_RUN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(RESEARCH_RUN_FILE, "utf-8")) as ResearchRun;
  } catch (err) {
    // Malformed cache file — recover as if no research run had been
    // persisted yet, but never silently: emit a structured warning
    // (Milestone 1E, section 16).
    console.warn(
      JSON.stringify({
        msg: "malformed runtime state, regenerating",
        file: RESEARCH_RUN_FILE,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return null;
  }
}

export function saveResearchRun(researchRun: ResearchRun): void {
  ensureRuntimeDir();
  writeFileSync(RESEARCH_RUN_FILE, JSON.stringify(researchRun, null, 2), "utf-8");
}

export function loadRealResearchRun(): ResearchRun | null {
  if (!existsSync(REAL_RESEARCH_RUN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(REAL_RESEARCH_RUN_FILE, "utf-8")) as ResearchRun;
  } catch (err) {
    console.warn(JSON.stringify({ msg: "malformed runtime state, regenerating", file: REAL_RESEARCH_RUN_FILE, error: err instanceof Error ? err.message : String(err) }));
    return null;
  }
}

export function saveRealResearchRun(researchRun: ResearchRun): void {
  ensureRuntimeDir();
  writeFileSync(REAL_RESEARCH_RUN_FILE, JSON.stringify(researchRun, null, 2), "utf-8");
}

export function loadOnDemandInterpretations(): InterpretationsById {
  if (!existsSync(ON_DEMAND_INTERPRETATIONS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(ON_DEMAND_INTERPRETATIONS_FILE, "utf-8")) as InterpretationsById;
  } catch (err) {
    console.warn(
      JSON.stringify({
        msg: "malformed runtime state, regenerating",
        file: ON_DEMAND_INTERPRETATIONS_FILE,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return {};
  }
}

export function saveOnDemandInterpretations(interpretations: InterpretationsById): void {
  ensureRuntimeDir();
  writeFileSync(ON_DEMAND_INTERPRETATIONS_FILE, JSON.stringify(interpretations, null, 2), "utf-8");
}

// Automatic per-KPI/per-family analysis (2026-09) — a SEPARATE file (new
// value shape) from onDemandInterpretations.json above, which the old
// manual-button flow used and which this feature replaces. Each entry pairs
// the real interpretation with the exact content hash of the data snapshot
// it was generated from (see onDemandAnalysis.ts's computeKpiSnapshotHash/
// computeFamilySnapshotHash) — this hash, not a timestamp or a cooldown, is
// what lets the pipeline know whether a stored analysis still matches the
// current data or must be regenerated.
export interface AutoKpiAnalysisEntry {
  interpretation: KpiInterpretation;
  snapshotHash: string;
}
export type AutoKpiAnalysesById = Record<string, AutoKpiAnalysisEntry>;

const AUTO_KPI_ANALYSES_FILE = join(RUNTIME_DIR, "autoKpiAnalyses.json");

export function loadAutoKpiAnalyses(): AutoKpiAnalysesById {
  if (!existsSync(AUTO_KPI_ANALYSES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(AUTO_KPI_ANALYSES_FILE, "utf-8")) as AutoKpiAnalysesById;
  } catch (err) {
    console.warn(
      JSON.stringify({
        msg: "malformed runtime state, regenerating",
        file: AUTO_KPI_ANALYSES_FILE,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return {};
  }
}

export function saveAutoKpiAnalyses(entries: AutoKpiAnalysesById): void {
  ensureRuntimeDir();
  writeFileSync(AUTO_KPI_ANALYSES_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export type GoldOvernightRecapByLanguage = Record<string, GoldOvernightRecap>;

export function loadGoldOvernightRecaps(): GoldOvernightRecapByLanguage {
  if (!existsSync(GOLD_OVERNIGHT_RECAP_FILE)) return {};
  try {
    return JSON.parse(readFileSync(GOLD_OVERNIGHT_RECAP_FILE, "utf-8")) as GoldOvernightRecapByLanguage;
  } catch (err) {
    console.warn(JSON.stringify({ msg: "malformed runtime state, regenerating", file: GOLD_OVERNIGHT_RECAP_FILE, error: err instanceof Error ? err.message : String(err) }));
    return {};
  }
}

export function saveGoldOvernightRecaps(recaps: GoldOvernightRecapByLanguage): void {
  ensureRuntimeDir();
  writeFileSync(GOLD_OVERNIGHT_RECAP_FILE, JSON.stringify(recaps, null, 2), "utf-8");
}
