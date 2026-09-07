import { writeFileSync } from "node:fs";
import path from "node:path";
import type { GoldOvernightAgentOutput, Language, ModelRoleIdentity } from "@gold-terminal/contracts";
import { resolveCliExecutable } from "./cliExecutableResolver";
import { getCliScratchDir } from "./cliScratchDir";
import { type CliInvocation, runCliSubprocess } from "./cliSubprocess";
import { extractJsonObjectLoosely } from "./cliAnalystSchema";
import { parseClaudeCliEnvelope } from "./claudeCliLlmProvider";
import { extractLastCodexAgentMessage } from "./codexCliLlmProvider";
import { buildGoldOvernightPrompt } from "./goldOvernightPromptBuilder";
import { GOLD_OVERNIGHT_JSON_SCHEMA, parseGoldOvernightAgentOutput } from "./goldOvernightSchema";
import { recordRealLlmCall } from "./realCallAudit";

// Overnight Gold Recap — a genuinely multi-language, multi-search research
// pass (EN/ZH/JA/other + forums), heavier than a single-KPI analyst call
// but lighter than Global Read's full 12-step methodology. Longer timeout
// than the per-KPI button, shorter than Global Read.
const GOLD_OVERNIGHT_TIMEOUT_MS = 8 * 60_000; // 8 minutes
const CLAUDE_MODEL_LABEL = "claude-code-cli";
const CODEX_MODEL_LABEL = "codex-cli";
const CODEX_OUTPUT_SCHEMA_FILE_NAME = "codex-gold-overnight-output-schema.json";

let cachedCodexSchemaPath: string | null = null;

function getCodexGoldOvernightSchemaFilePath(): string {
  if (cachedCodexSchemaPath) return cachedCodexSchemaPath;
  const filePath = path.join(getCliScratchDir(), CODEX_OUTPUT_SCHEMA_FILE_NAME);
  writeFileSync(filePath, JSON.stringify(GOLD_OVERNIGHT_JSON_SCHEMA, null, 2), "utf8");
  cachedCodexSchemaPath = filePath;
  return filePath;
}

function buildClaudeGoldOvernightInvocation(promptText: string): CliInvocation {
  const resolved = resolveCliExecutable("claude");
  const command = resolved?.command ?? "claude";
  const prefixArgs = resolved?.prefixArgs ?? [];
  return {
    command,
    args: [
      ...prefixArgs,
      "-p",
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(GOLD_OVERNIGHT_JSON_SCHEMA),
      "--allowedTools",
      "WebSearch,WebFetch",
      "--disallowedTools",
      "Edit,Write,Bash,NotebookEdit,KillShell,BashOutput,Task",
      "--permission-mode",
      "dontAsk",
      "--strict-mcp-config",
      promptText,
    ],
    cwd: getCliScratchDir(),
    timeoutMs: GOLD_OVERNIGHT_TIMEOUT_MS,
  };
}

function buildCodexGoldOvernightInvocation(promptText: string): CliInvocation {
  const resolved = resolveCliExecutable("codex");
  const command = resolved?.command ?? "codex";
  const prefixArgs = resolved?.prefixArgs ?? [];
  return {
    command,
    args: [
      ...prefixArgs,
      "exec",
      "--json",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--output-schema",
      getCodexGoldOvernightSchemaFilePath(),
      promptText,
    ],
    cwd: getCliScratchDir(),
    timeoutMs: GOLD_OVERNIGHT_TIMEOUT_MS,
  };
}

export interface GoldOvernightCliRunResult {
  role: "A" | "B";
  modelIdentity: ModelRoleIdentity;
  output: Omit<GoldOvernightAgentOutput, "role" | "modelIdentity"> | null;
  errorMessage: string | null;
}

async function runClaudeGoldOvernight(role: "A" | "B", language: Language): Promise<GoldOvernightCliRunResult> {
  const modelIdentity: ModelRoleIdentity = { provider: "claude-cli", model: CLAUDE_MODEL_LABEL, promptVersion: "gold-overnight-v1" };
  try {
    recordRealLlmCall({ provider: "claude-cli", model: CLAUDE_MODEL_LABEL, role: `gold-overnight-${role}`, kpiId: "gold-overnight", attempt: 1 });
    const promptText = buildGoldOvernightPrompt(role, "Claude Code CLI", language);
    const invocation = buildClaudeGoldOvernightInvocation(promptText);
    const result = await runCliSubprocess(invocation);
    if (result.timedOut) return { role, modelIdentity, output: null, errorMessage: `claude-cli Overnight Recap timed out after ${invocation.timeoutMs}ms` };
    if (result.exitCode !== 0) {
      return { role, modelIdentity, output: null, errorMessage: `claude-cli Overnight Recap exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}` };
    }
    const raw = parseClaudeCliEnvelope(result.stdout);
    const parsed = parseGoldOvernightAgentOutput(raw);
    if (!parsed) return { role, modelIdentity, output: null, errorMessage: "claude-cli Overnight Recap output failed schema validation" };
    return { role, modelIdentity, output: parsed, errorMessage: null };
  } catch (err) {
    return { role, modelIdentity, output: null, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

async function runCodexGoldOvernight(role: "A" | "B", language: Language): Promise<GoldOvernightCliRunResult> {
  const modelIdentity: ModelRoleIdentity = { provider: "codex-cli", model: CODEX_MODEL_LABEL, promptVersion: "gold-overnight-v1" };
  try {
    recordRealLlmCall({ provider: "codex-cli", model: CODEX_MODEL_LABEL, role: `gold-overnight-${role}`, kpiId: "gold-overnight", attempt: 1 });
    const promptText = buildGoldOvernightPrompt(role, "Codex CLI", language);
    const invocation = buildCodexGoldOvernightInvocation(promptText);
    const result = await runCliSubprocess(invocation);
    if (result.timedOut) return { role, modelIdentity, output: null, errorMessage: `codex-cli Overnight Recap timed out after ${invocation.timeoutMs}ms` };
    if (result.exitCode !== 0) {
      return { role, modelIdentity, output: null, errorMessage: `codex-cli Overnight Recap exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}` };
    }
    const raw = extractLastCodexAgentMessage(result.stdout) ?? extractJsonObjectLoosely(result.stdout);
    const parsed = parseGoldOvernightAgentOutput(raw);
    if (!parsed) return { role, modelIdentity, output: null, errorMessage: "codex-cli Overnight Recap output failed schema validation" };
    return { role, modelIdentity, output: parsed, errorMessage: null };
  } catch (err) {
    return { role, modelIdentity, output: null, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

export async function runGoldOvernightCli(availableProviderIds: readonly ("claude-cli" | "codex-cli")[], language: Language): Promise<GoldOvernightCliRunResult[]> {
  const runs: Promise<GoldOvernightCliRunResult>[] = [];
  if (availableProviderIds.includes("claude-cli")) runs.push(runClaudeGoldOvernight("A", language));
  if (availableProviderIds.includes("codex-cli")) runs.push(runCodexGoldOvernight(availableProviderIds.includes("claude-cli") ? "B" : "A", language));
  return Promise.all(runs);
}
