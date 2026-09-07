import assert from "node:assert/strict";
import test from "node:test";
import type { AnalystConclusion, CanonicalKpi } from "../packages/contracts/src/index";
import { buildCliPreferredAssignment } from "../apps/backend/src/intelligence/ensemble/realPolicies.ts";
import {
  extractJsonObjectLoosely,
  mapCliAnalystOutputToAnalystLlmResult,
  parseCliAnalystOutput,
} from "../apps/backend/src/intelligence/providers/cliAnalystSchema.ts";
import { synthesizeCliAdjudication, synthesizeCliChallengeFindings } from "../apps/backend/src/intelligence/providers/cliAdjudication.ts";
import { buildClaudeAnalystInvocation, parseClaudeCliEnvelope } from "../apps/backend/src/intelligence/providers/claudeCliLlmProvider.ts";
import { buildCodexAnalystInvocation, extractLastCodexAgentMessage } from "../apps/backend/src/intelligence/providers/codexCliLlmProvider.ts";
import { getCliScratchDir } from "../apps/backend/src/intelligence/providers/cliScratchDir.ts";
import { parseNpmCmdShimEntry } from "../apps/backend/src/intelligence/providers/cliExecutableResolver.ts";

// This suite covers the CLI-provider (claude-cli/codex-cli) parsing,
// safety-configuration, and rule-based-adjudication logic with CANNED
// fixtures only — never a live subprocess call (that's covered separately
// by the one-time real end-to-end verification described in this feature's
// task report, which deliberately runs OUTSIDE the fast unit test suite).

const kpi = {
  id: "f2-10y",
  familyId: "F2",
  label: "US 10Y Real Yield",
  value: 2.1,
  unit: "%",
  decimals: 2,
  relationship: "neutral",
  driverSummary: null,
  provenance: "observed",
  quality: "current",
  dataState: "REAL",
  observationAt: "2026-09-01T00:00:00Z",
} as unknown as CanonicalKpi;

function analyst(role: "A" | "B" | "C", provider: string, finalGoldRead: "SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL"): AnalystConclusion {
  return {
    role,
    modelIdentity: { provider, model: `${provider}-model`, promptVersion: "cli-v1" },
    finalGoldRead,
    shortConclusion: `${provider} says ${finalGoldRead}`,
    keyPoints: [`${provider} key point 1`, `${provider} key point 2`],
    dataVerification: `${provider} confirmed the terminal value against a live source.`,
  };
}

// --- cliAnalystSchema.ts: parsing/mapping ---------------------------------

test("parseCliAnalystOutput accepts a well-formed canned CLI response", () => {
  const raw = {
    finalGoldRead: "ADVERSE",
    shortConclusion: "Higher real yields raise gold's opportunity cost.",
    keyPoints: ["Opportunity cost rises", "TIPS yields at cycle highs"],
    dataVerification: "Confirmed 10Y real yield of 2.1% against Treasury's own published curve.",
    evidence: [{ claim: "10y real yield hit 2.3%", sourceUrl: "https://example.com/a", publishedAt: "2026-08-30" }],
  };
  const parsed = parseCliAnalystOutput(raw);
  assert.ok(parsed);
  assert.equal(parsed?.finalGoldRead, "ADVERSE");
  assert.equal(parsed?.evidence[0].sourceUrl, "https://example.com/a");
});

test("parseCliAnalystOutput maps empty-string sourceUrl/publishedAt to null", () => {
  const raw = {
    finalGoldRead: "CONTEXTUAL",
    shortConclusion: "Mixed signals.",
    keyPoints: [],
    dataVerification: "Could not find a live source to confirm this value this run.",
    evidence: [{ claim: "No corroborating source found", sourceUrl: "", publishedAt: "" }],
  };
  const parsed = parseCliAnalystOutput(raw);
  assert.equal(parsed?.evidence[0].sourceUrl, null);
  assert.equal(parsed?.evidence[0].publishedAt, null);
});

test("parseCliAnalystOutput rejects (returns null, never throws) malformed shapes", () => {
  assert.equal(parseCliAnalystOutput(null), null);
  assert.equal(parseCliAnalystOutput("not an object"), null);
  assert.equal(parseCliAnalystOutput({ finalGoldRead: "BULLISH", shortConclusion: "x", keyPoints: [], dataVerification: "v", evidence: [] }), null);
  assert.equal(parseCliAnalystOutput({ finalGoldRead: "ADVERSE", shortConclusion: "", keyPoints: [], dataVerification: "v", evidence: [] }), null);
  assert.equal(
    parseCliAnalystOutput({ finalGoldRead: "ADVERSE", shortConclusion: "x", keyPoints: "not-array", dataVerification: "v", evidence: [] }),
    null
  );
  assert.equal(
    parseCliAnalystOutput({ finalGoldRead: "ADVERSE", shortConclusion: "x", keyPoints: [], evidence: [{ claim: "x" }] }),
    null
  );
  assert.equal(
    parseCliAnalystOutput({ finalGoldRead: "ADVERSE", shortConclusion: "x", keyPoints: [], dataVerification: "", evidence: [] }),
    null
  );
});

test("mapCliAnalystOutputToAnalystLlmResult folds evidence claims into keyPoints", () => {
  const mapped = mapCliAnalystOutputToAnalystLlmResult({
    finalGoldRead: "SUPPORTIVE",
    shortConclusion: "short",
    keyPoints: ["point 1"],
    dataVerification: "Confirmed against a live source.",
    evidence: [{ claim: "gold rallied", sourceUrl: "https://x.test", publishedAt: null }],
  });
  assert.equal(mapped.finalGoldRead, "SUPPORTIVE");
  assert.equal(mapped.dataVerification, "Confirmed against a live source.");
  assert.deepEqual(mapped.keyPoints, ["point 1", "gold rallied (source: https://x.test)"]);
});

test("extractJsonObjectLoosely parses a clean JSON string and a prose-wrapped one", () => {
  assert.deepEqual(extractJsonObjectLoosely('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJsonObjectLoosely('Sure, here you go:\n{"a":1}\nHope that helps!'), { a: 1 });
  assert.equal(extractJsonObjectLoosely("no json here at all"), null);
});

// --- claudeCliLlmProvider.ts: envelope parsing + invocation shape --------

test("parseClaudeCliEnvelope prefers structured_output when present", () => {
  const stdout = JSON.stringify({ structured_output: { finalGoldRead: "ADVERSE" }, result: '{"finalGoldRead":"SUPPORTIVE"}' });
  assert.deepEqual(parseClaudeCliEnvelope(stdout), { finalGoldRead: "ADVERSE" });
});

test("parseClaudeCliEnvelope falls back to parsing the result string", () => {
  const stdout = JSON.stringify({ result: '{"finalGoldRead":"CONTEXTUAL","shortConclusion":"x"}' });
  assert.deepEqual(parseClaudeCliEnvelope(stdout), { finalGoldRead: "CONTEXTUAL", shortConclusion: "x" });
});

test("parseClaudeCliEnvelope returns null on unparseable stdout", () => {
  assert.equal(parseClaudeCliEnvelope("not json at all"), null);
});

test("buildClaudeAnalystInvocation builds a safe, tool-restricted, cwd-isolated, timeout-bounded spawn config", () => {
  const invocation = buildClaudeAnalystInvocation("PROMPT_TEXT_HERE");
  assert.equal(invocation.cwd, getCliScratchDir());
  assert.ok(invocation.timeoutMs > 0 && invocation.timeoutMs <= 120_000);
  assert.ok(invocation.args.includes("--allowedTools"));
  const allowedIndex = invocation.args.indexOf("--allowedTools");
  assert.equal(invocation.args[allowedIndex + 1], "WebSearch,WebFetch");
  assert.ok(invocation.args.includes("--disallowedTools"));
  const disallowedIndex = invocation.args.indexOf("--disallowedTools");
  const disallowed = invocation.args[disallowedIndex + 1];
  for (const dangerous of ["Edit", "Write", "Bash"]) assert.ok(disallowed.includes(dangerous));
  assert.ok(invocation.args.includes("--strict-mcp-config"));
  assert.ok(invocation.args.includes("--permission-mode"));
  // The prompt text is passed as its OWN argv element — never concatenated
  // into another flag's string — which is what makes this injection-safe.
  assert.ok(invocation.args.includes("PROMPT_TEXT_HERE"));
  assert.equal(invocation.args[invocation.args.length - 1], "PROMPT_TEXT_HERE");
});

// --- codexCliLlmProvider.ts: JSONL parsing + invocation shape ------------

test("extractLastCodexAgentMessage picks the LAST agent_message from a canned JSONL stream", () => {
  const jsonl = [
    JSON.stringify({ type: "thread.started", thread_id: "t1" }),
    JSON.stringify({ type: "turn.started" }),
    JSON.stringify({ type: "item.completed", item: { id: "item_0", type: "reasoning", text: "thinking..." } }),
    JSON.stringify({
      type: "item.completed",
      item: { id: "item_1", type: "agent_message", text: '{"finalGoldRead":"ADVERSE","shortConclusion":"s","keyPoints":[],"dataVerification":"v","evidence":[]}' },
    }),
    JSON.stringify({ type: "turn.completed", usage: {} }),
  ].join("\n");
  const raw = extractLastCodexAgentMessage(jsonl);
  const parsed = parseCliAnalystOutput(raw);
  assert.ok(parsed);
  assert.equal(parsed?.finalGoldRead, "ADVERSE");
});

test("extractLastCodexAgentMessage tolerates blank lines and malformed lines without throwing", () => {
  const jsonl = ["", "not json", JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: '{"a":1}' } }), ""].join(
    "\n"
  );
  assert.deepEqual(extractLastCodexAgentMessage(jsonl), { a: 1 });
});

test("extractLastCodexAgentMessage returns null when no agent_message event is present", () => {
  assert.equal(extractLastCodexAgentMessage(JSON.stringify({ type: "turn.started" })), null);
});

test("buildCodexAnalystInvocation builds a read-only-sandboxed, cwd-isolated, timeout-bounded spawn config", () => {
  const invocation = buildCodexAnalystInvocation("PROMPT_TEXT_HERE");
  assert.equal(invocation.cwd, getCliScratchDir());
  assert.ok(invocation.timeoutMs > 0 && invocation.timeoutMs <= 120_000);
  assert.ok(invocation.args.includes("exec"));
  assert.ok(invocation.args.includes("--sandbox"));
  assert.equal(invocation.args[invocation.args.indexOf("--sandbox") + 1], "read-only");
  assert.ok(invocation.args.includes("--skip-git-repo-check"));
  assert.ok(invocation.args.includes("--output-schema"));
  const schemaPath = invocation.args[invocation.args.indexOf("--output-schema") + 1];
  // The schema file must live inside the isolated scratch dir, never the repo.
  assert.ok(schemaPath.startsWith(getCliScratchDir()));
  assert.equal(invocation.args[invocation.args.length - 1], "PROMPT_TEXT_HERE");
});

// --- cliExecutableResolver.ts: npm .cmd shim parsing ---------------------

test("parseNpmCmdShimEntry recovers the relative JS entry path from a real npm-generated shim", () => {
  const shim = [
    "@ECHO off",
    "GOTO start",
    ":find_dp0",
    "SET dp0=%~dp0",
    "EXIT /b",
    ":start",
    "SETLOCAL",
    "CALL :find_dp0",
    "",
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ") ELSE (",
    '  SET "_prog=node"',
    ")",
    "",
    'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\@openai\\codex\\bin\\codex.js" %*',
  ].join("\r\n");
  assert.equal(parseNpmCmdShimEntry(shim), "node_modules\\@openai\\codex\\bin\\codex.js");
});

test("parseNpmCmdShimEntry returns null for content that doesn't match the expected npm shim shape", () => {
  assert.equal(parseNpmCmdShimEntry("@ECHO off\r\nsome other kind of script\r\n"), null);
});

// --- cliAdjudication.ts: rule-based adjudicator/challenger ---------------

test("synthesizeCliAdjudication adopts the shared read when both CLI analysts agree", () => {
  const conclusions = [analyst("A", "claude-cli", "ADVERSE"), analyst("B", "codex-cli", "ADVERSE")];
  const result = synthesizeCliAdjudication({
    kpi,
    contextSummary: "",
    analystConclusions: conclusions,
    challengeFindings: [],
    mechanicalRelationship: null,
    mechanicalFinalGoldRead: null,
    previousInterpretation: null,
    language: "EN",
  });
  assert.equal(result.finalGoldRead, "ADVERSE");
  assert.equal(result.evidenceState, "MODERATE");
});

test("synthesizeCliAdjudication preserves CONTEXTUAL/CONFLICTED rather than forcing consensus on disagreement", () => {
  const conclusions = [analyst("A", "claude-cli", "ADVERSE"), analyst("B", "codex-cli", "SUPPORTIVE")];
  const result = synthesizeCliAdjudication({
    kpi,
    contextSummary: "",
    analystConclusions: conclusions,
    challengeFindings: [],
    mechanicalRelationship: null,
    mechanicalFinalGoldRead: null,
    previousInterpretation: null,
    language: "EN",
  });
  assert.equal(result.finalGoldRead, "CONTEXTUAL");
  assert.equal(result.evidenceState, "CONFLICTED");
});

test("synthesizeCliAdjudication mirrors the mechanical mapping when the KPI is MECHANICAL_RULE (caller still overrides upstream)", () => {
  const conclusions = [analyst("A", "claude-cli", "CONTEXTUAL")];
  const result = synthesizeCliAdjudication({
    kpi,
    contextSummary: "",
    analystConclusions: conclusions,
    challengeFindings: [],
    mechanicalRelationship: "support",
    mechanicalFinalGoldRead: "SUPPORTIVE",
    previousInterpretation: null,
    language: "EN",
  });
  assert.equal(result.finalGoldRead, "SUPPORTIVE");
});

test("synthesizeCliChallengeFindings surfaces a disagreement as a finding, and stays empty on agreement", () => {
  const agreeing = [analyst("A", "claude-cli", "ADVERSE"), analyst("B", "codex-cli", "ADVERSE")];
  const disagreeing = [analyst("A", "claude-cli", "ADVERSE"), analyst("B", "codex-cli", "SUPPORTIVE")];
  const req = (analystConclusions: AnalystConclusion[]) => ({ kpi, contextSummary: "", analystConclusions, language: "EN" as const });

  assert.deepEqual(synthesizeCliChallengeFindings(req(agreeing)), { findings: [] });
  const result = synthesizeCliChallengeFindings(req(disagreeing));
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].targetRole, "B");
});

// --- ensemble/realPolicies.ts: CLI-preferred assignment ------------------

test("buildCliPreferredAssignment uses claude-cli as Analyst A and codex-cli as Analyst B when both are available", () => {
  const assignment = buildCliPreferredAssignment(["claude-cli", "codex-cli"]);
  assert.deepEqual(
    assignment.analysts.map((a) => `${a.role}:${a.providerId}`),
    ["A:claude-cli", "B:codex-cli"]
  );
  assert.equal(assignment.challengerProviderId, null);
  assert.equal(assignment.adjudicatorProviderId, "claude-cli");
});

test("buildCliPreferredAssignment degrades to a single analyst when only one CLI provider is available", () => {
  const assignment = buildCliPreferredAssignment(["codex-cli"]);
  assert.equal(assignment.analysts.length, 1);
  assert.equal(assignment.analysts[0].providerId, "codex-cli");
  assert.equal(assignment.adjudicatorProviderId, "codex-cli");
});

test("buildCliPreferredAssignment throws on an empty input (caller contract, mirrors buildAvailablePolicyAssignment)", () => {
  assert.throws(() => buildCliPreferredAssignment([]));
});
