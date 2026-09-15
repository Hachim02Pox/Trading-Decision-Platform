import OpenAI from "openai";
import type {
  AdjudicatorLlmRequest,
  AdjudicatorLlmResult,
  AnalystLlmRequest,
  AnalystLlmResult,
  ChallengeLlmRequest,
  ChallengeLlmResult,
  LlmProvider,
} from "./llmProvider";
import {
  ADJUDICATOR_RESULT_SCHEMA,
  ANALYST_RESULT_SCHEMA,
  CHALLENGE_RESULT_SCHEMA,
  parseAdjudicatorResult,
  parseAnalystResult,
  parseChallengeResult,
  toStandardJsonSchema,
  withOneRetry,
} from "./llmProvider";
import {
  formatAnalystConclusionsForPrompt,
  formatChallengeFindingsForPrompt,
  formatPreviousInterpretationForPrompt,
  languageInstruction,
  NO_TRADE_LANGUAGE_RULE,
  shortReadLengthRule,
} from "./promptContext";
import { OPENAI_PILOT_MODEL } from "./modelTiers";
import { recordRealLlmCall } from "./realCallAudit";

// Real intelligence pilot — OpenAI adapter. Uses Chat Completions'
// Structured Outputs (`response_format: { type: "json_schema", strict:
// true }`) so a response either parses exactly against the schema or the
// API itself refuses to emit it — never free text we have to hope parses.
// See apps/backend/src/providers/openai.ts (the prior milestone's
// connectivity-only smoke test) for the shared credential-loading
// convention this builds on; this file is the first to actually wire
// OpenAI into KPI-intelligence generation.

async function callJsonSchema(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string,
  schemaName: string,
  schema: Record<string, unknown>
): Promise<unknown> {
  const response = await client.chat.completions.create({
    model: OPENAI_PILOT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, schema, strict: true },
    },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI response had no message content");
  return JSON.parse(text);
}

function analystSystemPrompt(req: AnalystLlmRequest): string {
  return [
    `You are independent analyst "${req.role}" in a multi-model ensemble analyzing one macro/market KPI for a gold-market research terminal.`,
    "You have NOT seen any other analyst's conclusion — form your own view strictly from the context you are given below.",
    // NOTE: unlike the CLI providers (claudeCliLlmProvider.ts/codexCliLlmProvider.ts),
    // this metered path has NO live web-search tool wired up (the `tools`
    // array in this file is only a structured-output-forcing mechanism, not
    // a real browsing capability) — so it deliberately does NOT get
    // VERIFY_THEN_INTERPRET_STEPS's "use web search" instruction, which
    // would be an impossible/dishonest ask for this provider as currently
    // implemented. `dataVerification` is still a required schema field; this
    // provider must state plainly that no live check was possible rather
    // than fabricate one.
    "You have NO live web search or browsing tool in this call — set `dataVerification` to state plainly that no live check was possible this run (never fabricate a source or a check you didn't actually perform).",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    shortReadLengthRule(req.language),
    `The base/mechanical read to weigh (not a hint to copy) is: ${req.baseFinalGoldRead}.`,
    "Return ONLY the requested JSON.",
  ].join("\n");
}

function challengeSystemPrompt(req: ChallengeLlmRequest): string {
  return [
    "You are a skeptical challenge-stage reviewer in a multi-model ensemble. Your job is to find unsupported causal claims, non-independent sourcing, or mechanical-vs-contextual confusion in the analysts' conclusions below — not to re-answer the question yourself.",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    "Return ONLY the requested JSON with at least one finding.",
  ].join("\n");
}

function adjudicatorSystemPrompt(req: AdjudicatorLlmRequest): string {
  return [
    "You are the adjudicator in a multi-model ensemble, producing the final KPI interpretation for a gold-market research terminal from the independent analysts' conclusions, any challenge findings, and the context below.",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    shortReadLengthRule(req.language),
    req.mechanicalGoldRead !== "CONTEXTUAL"
      ? `This KPI has a fixed mechanical read ("${req.mechanicalGoldRead}"). It is READ-ONLY: your finalGoldRead value will be IGNORED and overridden by the mechanical read — focus your finalGoldRead field on your best-effort answer anyway, but put your real reasoning into currentReadDetailed/whyNow/causalChain.`
      : "This KPI has no fixed mechanical read — your finalGoldRead is the actual, real decision for this interpretation.",
    formatPreviousInterpretationForPrompt(req.previousInterpretation),
    "Return ONLY the requested JSON.",
  ].join("\n");
}

function userPromptFor(req: { kpi: AnalystLlmRequest["kpi"]; contextSummary: string }): string {
  return `Context package:\n${req.contextSummary}`;
}

export function createOpenAiLlmProvider(apiKey: string): LlmProvider {
  const client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 0 });

  return {
    id: "openai",
    model: OPENAI_PILOT_MODEL,

    async generateAnalystConclusion(req: AnalystLlmRequest): Promise<AnalystLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "openai", model: OPENAI_PILOT_MODEL, role: `analyst-${req.role}`, kpiId: req.kpi.id, attempt });
        const raw = await callJsonSchema(
          client,
          analystSystemPrompt(req),
          userPromptFor(req),
          "analyst_conclusion",
          toStandardJsonSchema(ANALYST_RESULT_SCHEMA)
        );
        return parseAnalystResult(raw);
      });
    },

    async generateChallengeFindings(req: ChallengeLlmRequest): Promise<ChallengeLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "openai", model: OPENAI_PILOT_MODEL, role: "challenger", kpiId: req.kpi.id, attempt });
        const userPrompt = `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}`;
        const raw = await callJsonSchema(
          client,
          challengeSystemPrompt(req),
          userPrompt,
          "challenge_findings",
          toStandardJsonSchema(CHALLENGE_RESULT_SCHEMA)
        );
        return parseChallengeResult(raw);
      });
    },

    async generateAdjudication(req: AdjudicatorLlmRequest): Promise<AdjudicatorLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "openai", model: OPENAI_PILOT_MODEL, role: "adjudicator", kpiId: req.kpi.id, attempt });
        const userPrompt =
          `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}` +
          `\n\nChallenge findings:\n${formatChallengeFindingsForPrompt(req.challengeFindings)}`;
        const raw = await callJsonSchema(
          client,
          adjudicatorSystemPrompt(req),
          userPrompt,
          "adjudication",
          toStandardJsonSchema(ADJUDICATOR_RESULT_SCHEMA)
        );
        return parseAdjudicatorResult(raw);
      });
    },
  };
}
