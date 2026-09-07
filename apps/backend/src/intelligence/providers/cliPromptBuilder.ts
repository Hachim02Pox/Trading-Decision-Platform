import type { AnalystLlmRequest } from "./llmProvider";
import { NO_TRADE_LANGUAGE_RULE, VERIFY_THEN_INTERPRET_STEPS, languageInstruction, shortReadLengthRule } from "./promptContext";

// Shared prompt text for both CLI providers' analyst stage — kept in one
// place so claude-cli and codex-cli are never told anything different about
// the non-negotiable guardrails (NO_TRADE_LANGUAGE_RULE, language, length
// cap) the metered providers already enforce identically via
// openaiLlmProvider.ts/anthropicLlmProvider.ts/geminiLlmProvider.ts's own
// (near-identical) analystSystemPrompt functions.

export function buildCliAnalystPrompt(req: AnalystLlmRequest, providerLabel: string): string {
  return [
    `You are independent analyst "${req.role}" (running as ${providerLabel}) in a two-analyst ensemble analyzing one macro/market KPI for a gold-market research terminal.`,
    "You have NOT seen any other analyst's conclusion — form your own view strictly from the context package below.",
    "",
    VERIFY_THEN_INTERPRET_STEPS,
    "",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    shortReadLengthRule(req.language),
    `The base/mechanical read to weigh (not a hint to copy) is: ${req.baseFinalGoldRead}.`,
    "Respond with ONLY a single JSON object matching the exact required schema — no prose before or after it, and no markdown code fences.",
    "",
    `Context package:\n${req.contextSummary}`,
  ].join("\n");
}
