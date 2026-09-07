import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSecureClaudeArgs, buildSecureCodexArgs, safeCliEnvironment, parseGlobalReadTrace } from "../apps/backend/src/intelligence/providers/globalReadSecureCli";

test("prior has no tools, research exposes only web; subscription auth retained without API keys", () => {
  const prior = buildSecureClaudeArgs("PRIOR", {});
  const research = buildSecureClaudeArgs("RESEARCH", {});
  assert.equal(prior[prior.indexOf("--tools") + 1], "");
  assert.equal(research[research.indexOf("--tools") + 1], "WebSearch,WebFetch");
  for (const args of [prior, research]) {
    assert.ok(args.includes("--safe-mode")); assert.ok(args.includes("--strict-mcp-config"));
    assert.ok(args.includes("--no-session-persistence")); assert.ok(!args.includes("--bare"));
  }
  const env = safeCliEnvironment({ PATH: "system", USERPROFILE: "user", ANTHROPIC_API_KEY: "secret", OPENAI_API_KEY: "secret", NODE_OPTIONS: "preload", ANTHROPIC_BASE_URL: "evil" });
  assert.equal(env.USERPROFILE, "user"); assert.equal(env.ANTHROPIC_API_KEY, undefined); assert.equal(env.NODE_OPTIONS, undefined);
});

test("Codex analysis uses ephemeral read-only isolation and explicit live search", () => {
  const args = buildSecureCodexArgs("ANALYSIS_B", "C:/temp/schema.json");
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes("--ignore-rules"));
  assert.ok(args.includes("--ephemeral"));
  assert.ok(args.includes("read-only"));
  assert.ok(args.includes("--search"));
  const debate = buildSecureCodexArgs("DEBATE_B", "C:/temp/schema.json");
  assert.equal(debate.includes("--search"), false);
});
test("Claude trace extraction only records tool events, not model-authored URL prose", () => {
  const result = parseGlobalReadTrace([
    { type: "assistant", message: { content: [{ type: "text", text: "https://fake.test" }, { type: "tool_use", name: "WebSearch", input: { query: "official CPI release" } }] } },
    { type: "result", structured_output: { thesis: "UNCLEAR" } },
  ].map(JSON.stringify).join("\n"));
  assert.equal(result.trace.length, 1); assert.equal(result.trace[0].kind, "SEARCHED");
  assert.deepEqual(result.output, { thesis: "UNCLEAR" });
});

test("Codex web-search completion is retained as an auditable search trace", () => {
  const result = parseGlobalReadTrace([
    { type: "item.completed", item: { type: "web_search_call", query: "latest gold market narrative" } },
    { type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ thesis: "UNCLEAR" }) } },
  ].map(JSON.stringify).join("\n"));
  assert.deepEqual(result.trace, [{ kind: "SEARCHED", url: null, query: "latest gold market narrative" }]);
  assert.deepEqual(result.output, { thesis: "UNCLEAR" });
});
