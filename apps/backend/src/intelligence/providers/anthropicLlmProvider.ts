import Anthropic from "@anthropic-ai/sdk";
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
import { ANTHROPIC_PILOT_MODEL } from "./modelTiers";
import { recordRealLlmCall } from "./realCallAudit";

// Real intelligence pilot — Anthropic adapter. Structured output is
// obtained via a single strict (`strict: true`, `additionalProperties:
// false`) forced tool call (`tool_choice: { type: "tool", name }`) rather
// than free text — the SDK guarantees the tool_use.input validates exactly
// against input_schema in strict mode. See
// apps/backend/src/providers/anthropic.ts (the prior milestone's
// connectivity-only smoke test) for the shared credential-loading
// convention this builds on.

const MAX_TOKENS = 2048;

async function callStrictTool(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  toolName: string,
  inputSchema: Record<string, unknown>
): Promise<unknown> {
  const response = await client.messages.create({
    model: ANTHROPIC_PILOT_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        name: toolName,
        description: `Return the ${toolName} result.`,
        input_schema: inputSchema as Anthropic.Tool.InputSchema,
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  if (!toolUse) throw new Error("Anthropic response had no tool_use block");
  return toolUse.input;
}

function analystSystemPrompt(req: AnalystLlmRequest): string {
  return [
    `You are independent analyst "${req.role}" in a multi-model ensemble analyzing one macro/market KPI for a gold-market research terminal.`,
    "You have NOT seen any other analyst's conclusion — form your own view strictly from the context you are given below.",
    // See openaiLlmProvider.ts's identical note: this metered path has no
    // live web-search tool wired up, unlike the CLI providers — never told
    // to "verify via search," and `dataVerification` must say so honestly.
    "You have NO live web search or browsing tool in this call — set `dataVerification` to state plainly that no live check was possible this run (never fabricate a source or a check you didn't actually perform).",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    shortReadLengthRule(req.language),
    `The base/mechanical read to weigh (not a hint to copy) is: ${req.baseFinalGoldRead}.`,
    "Call the tool with your conclusion.",
  ].join("\n");
}

function challengeSystemPrompt(req: ChallengeLlmRequest): string {
  return [
    "You are a skeptical challenge-stage reviewer in a multi-model ensemble. Your job is to find unsupported causal claims, non-independent sourcing, or mechanical-vs-contextual confusion in the analysts' conclusions below — not to re-answer the question yourself.",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    "Call the tool with at least one finding.",
  ].join("\n");
}

function adjudicatorSystemPrompt(req: AdjudicatorLlmRequest): string {
  return [
    "You are the adjudicator in a multi-model ensemble, producing the final KPI interpretation for a gold-market research terminal from the independent analysts' conclusions, any challenge findings, and the context below.",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(req.language),
    shortReadLengthRule(req.language),
    req.mechanicalRelationship !== null
      ? `This KPI has a fixed mechanical relationship ("${req.mechanicalRelationship}", mapping to finalGoldRead "${req.mechanicalFinalGoldRead}"). It is READ-ONLY: your finalGoldRead value will be IGNORED and overridden by the mechanical mapping — focus your finalGoldRead field on your best-effort answer anyway, but put your real reasoning into currentReadDetailed/whyNow/causalChain.`
      : "This KPI has no fixed mechanical relationship — your finalGoldRead is the actual, real decision for this interpretation.",
    formatPreviousInterpretationForPrompt(req.previousInterpretation),
    "Call the tool with your final interpretation.",
  ].join("\n");
}

function userPromptFor(req: { contextSummary: string }): string {
  return `Context package:\n${req.contextSummary}`;
}

export function createAnthropicLlmProvider(apiKey: string, workspaceId?: string): LlmProvider {
  // See config/env.ts's AnthropicCredentials.workspaceId doc comment — only
  // needed for "identity-linked" keys; a plain key ignores the extra header.
  const client = new Anthropic({
    apiKey,
    timeout: 30_000,
    maxRetries: 0,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });

  return {
    id: "anthropic",
    model: ANTHROPIC_PILOT_MODEL,

    async generateAnalystConclusion(req: AnalystLlmRequest): Promise<AnalystLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "anthropic", model: ANTHROPIC_PILOT_MODEL, role: `analyst-${req.role}`, kpiId: req.kpi.id, attempt });
        const raw = await callStrictTool(
          client,
          analystSystemPrompt(req),
          userPromptFor(req),
          "submit_analyst_conclusion",
          toStandardJsonSchema(ANALYST_RESULT_SCHEMA)
        );
        return parseAnalystResult(raw);
      });
    },

    async generateChallengeFindings(req: ChallengeLlmRequest): Promise<ChallengeLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "anthropic", model: ANTHROPIC_PILOT_MODEL, role: "challenger", kpiId: req.kpi.id, attempt });
        const userPrompt = `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}`;
        const raw = await callStrictTool(
          client,
          challengeSystemPrompt(req),
          userPrompt,
          "submit_challenge_findings",
          toStandardJsonSchema(CHALLENGE_RESULT_SCHEMA)
        );
        return parseChallengeResult(raw);
      });
    },

    async generateAdjudication(req: AdjudicatorLlmRequest): Promise<AdjudicatorLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "anthropic", model: ANTHROPIC_PILOT_MODEL, role: "adjudicator", kpiId: req.kpi.id, attempt });
        const userPrompt =
          `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}` +
          `\n\nChallenge findings:\n${formatChallengeFindingsForPrompt(req.challengeFindings)}`;
        const raw = await callStrictTool(
          client,
          adjudicatorSystemPrompt(req),
          userPrompt,
          "submit_adjudication",
          toStandardJsonSchema(ADJUDICATOR_RESULT_SCHEMA)
        );
        return parseAdjudicatorResult(raw);
      });
    },
  };
}
