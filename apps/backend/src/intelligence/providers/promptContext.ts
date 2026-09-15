import type { AnalystConclusion, ChallengeFinding, KpiInterpretation, Language } from "@gold-terminal/contracts";
import type { KpiContextPackage } from "../contextPackageBuilder";
import { MAX_SHORT_READ_CHARS } from "../constants";
import { PREVIOUS_INTERPRETATION_CONTEXT_RULE } from "../ensemble/runAdjudicator";

// Real intelligence pilot — shared prompt-construction helpers. Every real
// LLM call (analyst/challenger/adjudicator, any provider) is built from the
// SAME context summary and the SAME non-negotiable guardrails, so no single
// provider adapter can silently drift on what the model is told.

/** Never framed as a trade recommendation — mirrors the schema-first ban already enforced at validateInterpretation.ts. */
export const NO_TRADE_LANGUAGE_RULE =
  "You are producing analytical context for a research terminal, never a trade recommendation. Never suggest buying, " +
  "selling, a position size, a numeric confidence/probability score, or a directional call the user should act on. " +
  "Describe mechanisms, evidence, and uncertainty only.";

export function languageInstruction(language: Language): string {
  return language === "FR"
    ? "Respond entirely in French (Français). Do not leave any English sentence in your output. Financial acronyms and instrument shorthand (CPI, PCE, DXY, VIX, FOMC, BE10, 2s10s, TGA, HY OAS, etc.) are never translated, in either language."
    : "Respond entirely in English. Financial acronyms and instrument shorthand (CPI, PCE, DXY, VIX, FOMC, BE10, 2s10s, TGA, HY OAS, etc.) stay as-is.";
}

/**
 * User-explicit requirement: before interpreting anything, an analyst must
 * first verify the terminal's own data point(s) against a live source, then
 * search recent news (favoring the last 5h, always within 24h absent
 * anything that recent), and only then interpret. Shared verbatim by every
 * analyst prompt builder (CLI and metered) so no provider is held to a
 * looser standard than another — see the required `dataVerification` field
 * on AnalystConclusion/AnalystLlmResult that this step's output feeds.
 */
export const VERIFY_THEN_INTERPRET_STEPS =
  "Follow these steps IN ORDER — do not skip or reorder them:\n" +
  "1. VERIFY FIRST: before anything else, use web search to check the terminal's own data point(s) below against " +
  "at least one live, authoritative source (official statistics agency, central bank, exchange, or a major wire " +
  "service reporting the figure directly). Prefer the primary institution for this exact metric type over any " +
  "secondary aggregator — e.g. BEA for PCE, BLS for CPI/payrolls/unemployment/AHE, CFTC for COT, U.S. Treasury for " +
  "auctions/TGA/QRA, SPDR for GLD holdings, the Federal Reserve for FOMC/target-range communication — and use the " +
  "terminal's own stated source below as a hint for which institution that is. State the outcome in the required " +
  "`dataVerification` field: what you checked, what you found, and whether it matches — including the exact " +
  "period/vintage you checked, since a revised or differently-dated figure is not the same fact as this one. " +
  "Never leave this generic or skip the check.\n" +
  "2. TARGETED WEB RESEARCH: search for information that specifically helps you answer, for THIS metric: was there " +
  "a revision since last time, what was the prior value, what changed since the previous release, and is there a " +
  "dated upcoming event (next scheduled release, or a specific Fed/other communication) that could change how this " +
  "reading should be read. Prioritize the most recent coverage you can find — ideally published within the last 5 " +
  "hours, and always within the last 24 hours unless nothing that recent exists for this topic. This is targeted " +
  "research with specific questions, never generic browsing (do not search things like \"gold outlook today\") — " +
  "record only what you actually found (do not invent sources, and do not pad it with old/generic background once " +
  "recent coverage exists).\n" +
  "3. ONLY THEN interpret: form your conclusion using steps 1-2's findings, not before.";

export function shortReadLengthRule(language: Language): string {
  return language === "FR"
    ? `Le champ "court" (shortConclusion / currentReadShort) doit tenir en une phrase, au maximum ${MAX_SHORT_READ_CHARS} caractères.`
    : `The "short" field (shortConclusion / currentReadShort) must be about one sentence, at most ${MAX_SHORT_READ_CHARS} characters.`;
}

function formatClaim(claim: KpiContextPackage["claims"][number]): string {
  const published = claim.source.publishedAt ?? "undated";
  return `- [${claim.verificationState}, ${claim.epistemicStatus}] "${claim.claim}" — source: ${claim.source.name} (${claim.source.authorityClass}, ${published})`;
}

/**
 * Textual rendering of a KpiContextPackage for the model to reason over.
 * Deliberately plain, labeled prose rather than raw JSON — every field a
 * real prompt needs is named explicitly so nothing is left implicit.
 */
export function buildContextSummary(ctx: KpiContextPackage): string {
  const { kpi } = ctx;
  const lines: string[] = [];

  lines.push(`KPI: ${kpi.id} ("${kpi.label}"), family ${kpi.familyId}.`);
  lines.push(`Current value: ${kpi.value ?? "null"}${kpi.unit ? ` ${kpi.unit}` : ""} (as of ${kpi.observationAt}).`);
  lines.push(`This terminal's own recorded source for this value: ${kpi.sourceTag}.`);
  if (kpi.consensus !== undefined && kpi.consensus !== null) lines.push(`Consensus: ${kpi.consensus}.`);
  if (kpi.previous !== undefined && kpi.previous !== null) lines.push(`Previous value: ${kpi.previous}.`);
  if (kpi.surprise) lines.push(`Surprise vs consensus: ${kpi.surprise}.`);
  lines.push(
    `Deterministic mechanical read (server-computed, READ-ONLY): "${kpi.mechanicalGoldRead}" ` +
      `(${kpi.mechanicalGoldRead === "CONTEXTUAL" ? "no active mechanical constraint right now — this is a CONTEXTUAL_AI read" : "a fixed mechanical channel is currently active — you must never propose overriding it"}).`
  );
  if (kpi.driverSummary) lines.push(`Driver summary: ${kpi.driverSummary}.`);

  if (ctx.siblingKpis.length > 0) {
    lines.push("");
    lines.push("Sibling KPIs in the same family:");
    for (const sib of ctx.siblingKpis) {
      lines.push(`- ${sib.id} ("${sib.label}"): ${sib.value ?? "null"}${sib.unit ? ` ${sib.unit}` : ""}, mechanicalGoldRead=${sib.mechanicalGoldRead}.`);
    }
  }

  if (ctx.crossFamilyKpis.length > 0) {
    lines.push("");
    lines.push("Related cross-family KPIs (per the documented mechanism map, not invented here):");
    for (const cross of ctx.crossFamilyKpis) {
      lines.push(`- ${cross.id} ("${cross.label}", family ${cross.familyId}): ${cross.value ?? "null"}${cross.unit ? ` ${cross.unit}` : ""}.`);
    }
  }

  const activeCatalysts = ctx.relevantEvents.filter((e) => e.activeCatalyst).map((e) => e.activeCatalyst!);
  if (activeCatalysts.length > 0) {
    lines.push("");
    lines.push("Active catalysts:");
    for (const ev of activeCatalysts) lines.push(`- ${ev.title} (scheduled ${ev.scheduledAt}).`);
  }

  if (ctx.claims.length > 0) {
    lines.push("");
    lines.push("Research evidence (deduplicated, corroboration-checked claims):");
    for (const claim of ctx.claims) lines.push(formatClaim(claim));
  } else {
    lines.push("");
    lines.push("No research evidence is attached for this KPI this session.");
  }

  return lines.join("\n");
}

export function formatAnalystConclusionsForPrompt(conclusions: AnalystConclusion[]): string {
  return conclusions
    .map(
      (c) =>
        `Analyst ${c.role} (${c.modelIdentity.provider}/${c.modelIdentity.model}) concluded finalGoldRead=${c.finalGoldRead}: "${c.shortConclusion}" Key points: ${c.keyPoints.join("; ")}`
    )
    .join("\n");
}

export function formatChallengeFindingsForPrompt(findings: ChallengeFinding[]): string {
  if (findings.length === 0) return "No challenge findings.";
  return findings.map((f) => `Challenge on Analyst ${f.targetRole} [${f.epistemicStatus}]: ${f.concern}`).join("\n");
}

export function formatPreviousInterpretationForPrompt(previous: KpiInterpretation | null): string {
  if (!previous) {
    return "No previous interpretation exists for this KPI in this session or a prior one — this is the first analysis. Say so plainly; there is nothing to compare against yet.";
  }
  return (
    `Previous interpretation (from ${previous.interpretationAnalyzedAt}), supplied as CONTEXT ONLY: ${PREVIOUS_INTERPRETATION_CONTEXT_RULE}\n` +
    `Previous currentRead: "${previous.currentRead}"\n` +
    `Previous finalGoldRead: ${previous.finalGoldRead}`
  );
}
