import type { GoldOvernightAgentOutput, GoldOvernightSource } from "@gold-terminal/contracts";

// Overnight Gold Recap — JSON Schema for one CLI agent's multi-language
// research pass. Both claude-cli and codex-cli consume this exact schema —
// see goldOvernightCliRunner.ts.

export const GOLD_OVERNIGHT_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keyMoves: { type: "array", items: { type: "string" } },
    catalysts: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: { type: "string" },
          publisher: { type: "string" },
          url: { type: "string" },
        },
        required: ["language", "publisher", "url"],
        additionalProperties: false,
      },
    },
    dataVerification: { type: "string" },
  },
  required: ["summary", "keyMoves", "catalysts", "sources", "dataVerification"],
  additionalProperties: false,
} as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

/** Defensively parses one agent's raw Overnight Gold Recap output. Returns `null` (never throws) on any shape mismatch. */
export function parseGoldOvernightAgentOutput(raw: unknown): Omit<GoldOvernightAgentOutput, "role" | "modelIdentity"> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.summary !== "string" || obj.summary.length === 0) return null;
  if (!isStringArray(obj.keyMoves)) return null;
  if (!isStringArray(obj.catalysts)) return null;
  if (typeof obj.dataVerification !== "string" || obj.dataVerification.length === 0) return null;
  if (!Array.isArray(obj.sources)) return null;

  const sources: GoldOvernightSource[] = [];
  for (const item of obj.sources) {
    if (typeof item !== "object" || item === null) return null;
    const s = item as Record<string, unknown>;
    if (typeof s.language !== "string" || s.language.length === 0) return null;
    if (typeof s.publisher !== "string" || s.publisher.length === 0) return null;
    if (typeof s.url !== "string") return null;
    sources.push({ language: s.language, publisher: s.publisher, url: emptyToNull(s.url) });
  }

  return { summary: obj.summary, keyMoves: obj.keyMoves, catalysts: obj.catalysts, sources, dataVerification: obj.dataVerification };
}
