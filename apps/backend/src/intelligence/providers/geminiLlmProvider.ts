import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type {
  AdjudicatorLlmRequest,
  AdjudicatorLlmResult,
  AnalystLlmRequest,
  AnalystLlmResult,
  ChallengeLlmRequest,
  ChallengeLlmResult,
  JsonSchemaNode,
  LlmProvider,
} from "./llmProvider";
import {
  ADJUDICATOR_RESULT_SCHEMA,
  ANALYST_RESULT_SCHEMA,
  CHALLENGE_RESULT_SCHEMA,
  parseAdjudicatorResult,
  parseAnalystResult,
  parseChallengeResult,
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
import { GEMINI_PILOT_MODEL } from "./modelTiers";
import { recordRealLlmCall } from "./realCallAudit";

// Real intelligence pilot — Gemini adapter, using the current unified
// `@google/genai` SDK (not the deprecated `@google/generative-ai`), per the
// prior milestone's connectivity smoke test
// (apps/backend/src/providers/gemini.ts). Structured output uses
// `responseMimeType: "application/json"` + `responseSchema` — Gemini's
// schema shape (a `Type` enum, not JSON Schema's `"type": "string"`
// strings) differs structurally from OpenAI/Anthropic's, hence the
// dedicated converter below.

function toGeminiSchema(node: JsonSchemaNode): Schema {
  if (node.kind === "string") {
    if (node.enumValues) {
      return { type: Type.STRING, format: "enum", enum: [...node.enumValues] };
    }
    return { type: Type.STRING };
  }
  if (node.kind === "array") {
    return { type: Type.ARRAY, items: toGeminiSchema(node.items) };
  }
  const properties: Record<string, Schema> = {};
  for (const [key, child] of Object.entries(node.properties)) {
    properties[key] = toGeminiSchema(child);
  }
  return { type: Type.OBJECT, properties, required: [...node.required] };
}

async function callJsonSchema(client: GoogleGenAI, systemPrompt: string, userPrompt: string, schema: Schema): Promise<unknown> {
  const response = await client.models.generateContent({
    model: GEMINI_PILOT_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Gemini response had no text content");
  return JSON.parse(text);
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

function userPromptFor(req: { contextSummary: string }): string {
  return `Context package:\n${req.contextSummary}`;
}

export function createGeminiLlmProvider(apiKey: string): LlmProvider {
  const client = new GoogleGenAI({ apiKey });

  return {
    id: "gemini",
    model: GEMINI_PILOT_MODEL,

    async generateAnalystConclusion(req: AnalystLlmRequest): Promise<AnalystLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "gemini", model: GEMINI_PILOT_MODEL, role: `analyst-${req.role}`, kpiId: req.kpi.id, attempt });
        const raw = await callJsonSchema(client, analystSystemPrompt(req), userPromptFor(req), toGeminiSchema(ANALYST_RESULT_SCHEMA));
        return parseAnalystResult(raw);
      });
    },

    async generateChallengeFindings(req: ChallengeLlmRequest): Promise<ChallengeLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "gemini", model: GEMINI_PILOT_MODEL, role: "challenger", kpiId: req.kpi.id, attempt });
        const userPrompt = `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}`;
        const raw = await callJsonSchema(client, challengeSystemPrompt(req), userPrompt, toGeminiSchema(CHALLENGE_RESULT_SCHEMA));
        return parseChallengeResult(raw);
      });
    },

    async generateAdjudication(req: AdjudicatorLlmRequest): Promise<AdjudicatorLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "gemini", model: GEMINI_PILOT_MODEL, role: "adjudicator", kpiId: req.kpi.id, attempt });
        const userPrompt =
          `${userPromptFor(req)}\n\nAnalyst conclusions:\n${formatAnalystConclusionsForPrompt(req.analystConclusions)}` +
          `\n\nChallenge findings:\n${formatChallengeFindingsForPrompt(req.challengeFindings)}`;
        const raw = await callJsonSchema(client, adjudicatorSystemPrompt(req), userPrompt, toGeminiSchema(ADJUDICATOR_RESULT_SCHEMA));
        return parseAdjudicatorResult(raw);
      });
    },
  };
}
