import { writeFileSync } from "node:fs";
import path from "node:path";
import type { CanonicalFamilySnapshot, GlobalReadAgentOutput, Language, ModelRoleIdentity } from "@gold-terminal/contracts";
import { resolveCliExecutable } from "./cliExecutableResolver";
import { getCliScratchDir } from "./cliScratchDir";
import { type CliInvocation, runCliSubprocess } from "./cliSubprocess";
import { extractJsonObjectLoosely } from "./cliAnalystSchema";
import { parseClaudeCliEnvelope } from "./claudeCliLlmProvider";
import { extractLastCodexAgentMessage } from "./codexCliLlmProvider";
import { buildGlobalReadPrompt } from "./globalReadPromptBuilder";
import { GLOBAL_READ_JSON_SCHEMA, parseGlobalReadAgentOutput } from "./globalReadSchema";
import { recordRealLlmCall } from "./realCallAudit";

// Global Read — a deliberately separate, MUCH heavier CLI invocation than
// the per-KPI/per-family analyst call (claudeCliLlmProvider.ts/
// codexCliLlmProvider.ts's CLI_TIMEOUT_MS=110s). The 12-step methodology
// requires searching 6 blocks' worth of confirming/contradicting news plus
// 5 dedicated component deep-dives — realistically several minutes of
// genuine agentic web research per agent, not seconds. Reuses the exact
// same safety plumbing (tool allowlist via cliExecutableResolver's
// resolved command, cwd isolation via cliScratchDir, hard-kill timeout via
// cliSubprocess) — only the timeout and schema differ.
//
// Deliberately NO automatic retry (unlike withOneRetry elsewhere): a first
// attempt that fails after several minutes should surface as UNAVAILABLE
// immediately rather than silently doubling the wait — the user can always
// click again.
const GLOBAL_READ_TIMEOUT_MS = 15 * 60_000; // 15 minutes
const CLAUDE_MODEL_LABEL = "claude-code-cli";
const CODEX_MODEL_LABEL = "codex-cli";
const CODEX_OUTPUT_SCHEMA_FILE_NAME = "codex-global-read-output-schema.json";

let cachedCodexSchemaPath: string | null = null;

function getCodexGlobalReadSchemaFilePath(): string {
  if (cachedCodexSchemaPath) return cachedCodexSchemaPath;
  const filePath = path.join(getCliScratchDir(), CODEX_OUTPUT_SCHEMA_FILE_NAME);
  writeFileSync(filePath, JSON.stringify(GLOBAL_READ_JSON_SCHEMA, null, 2), "utf8");
  cachedCodexSchemaPath = filePath;
  return filePath;
}

function buildClaudeGlobalReadInvocation(promptText: string): CliInvocation {
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
      JSON.stringify(GLOBAL_READ_JSON_SCHEMA),
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
    timeoutMs: GLOBAL_READ_TIMEOUT_MS,
  };
}

function buildCodexGlobalReadInvocation(promptText: string): CliInvocation {
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
      getCodexGlobalReadSchemaFilePath(),
      promptText,
    ],
    cwd: getCliScratchDir(),
    timeoutMs: GLOBAL_READ_TIMEOUT_MS,
  };
}

export interface GlobalReadCliRunResult {
  role: "A" | "B";
  modelIdentity: ModelRoleIdentity;
  output: Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> | null;
  errorMessage: string | null;
}

async function runClaudeGlobalRead(allFamilies: readonly CanonicalFamilySnapshot[], role: "A" | "B", language: Language): Promise<GlobalReadCliRunResult> {
  const modelIdentity: ModelRoleIdentity = { provider: "claude-cli", model: CLAUDE_MODEL_LABEL, promptVersion: "global-read-v1" };
  try {
    recordRealLlmCall({ provider: "claude-cli", model: CLAUDE_MODEL_LABEL, role: `global-read-${role}`, kpiId: "global-read", attempt: 1 });
    const promptText = buildGlobalReadPrompt(allFamilies, role, "Claude Code CLI", language);
    const invocation = buildClaudeGlobalReadInvocation(promptText);
    const result = await runCliSubprocess(invocation);
    if (result.timedOut) return { role, modelIdentity, output: null, errorMessage: `claude-cli Global Read timed out after ${invocation.timeoutMs}ms` };
    if (result.exitCode !== 0) {
      return { role, modelIdentity, output: null, errorMessage: `claude-cli Global Read exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}` };
    }
    const raw = parseClaudeCliEnvelope(result.stdout);
    const parsed = parseGlobalReadAgentOutput(raw);
    if (!parsed) return { role, modelIdentity, output: null, errorMessage: "claude-cli Global Read output failed schema validation" };
    return { role, modelIdentity, output: parsed, errorMessage: null };
  } catch (err) {
    return { role, modelIdentity, output: null, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

async function runCodexGlobalRead(allFamilies: readonly CanonicalFamilySnapshot[], role: "A" | "B", language: Language): Promise<GlobalReadCliRunResult> {
  const modelIdentity: ModelRoleIdentity = { provider: "codex-cli", model: CODEX_MODEL_LABEL, promptVersion: "global-read-v1" };
  try {
    recordRealLlmCall({ provider: "codex-cli", model: CODEX_MODEL_LABEL, role: `global-read-${role}`, kpiId: "global-read", attempt: 1 });
    const promptText = buildGlobalReadPrompt(allFamilies, role, "Codex CLI", language);
    const invocation = buildCodexGlobalReadInvocation(promptText);
    const result = await runCliSubprocess(invocation);
    if (result.timedOut) return { role, modelIdentity, output: null, errorMessage: `codex-cli Global Read timed out after ${invocation.timeoutMs}ms` };
    if (result.exitCode !== 0) {
      return { role, modelIdentity, output: null, errorMessage: `codex-cli Global Read exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}` };
    }
    const raw = extractLastCodexAgentMessage(result.stdout) ?? extractJsonObjectLoosely(result.stdout);
    const parsed = parseGlobalReadAgentOutput(raw);
    if (!parsed) return { role, modelIdentity, output: null, errorMessage: "codex-cli Global Read output failed schema validation" };
    return { role, modelIdentity, output: parsed, errorMessage: null };
  } catch (err) {
    return { role, modelIdentity, output: null, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Runs every available CLI provider (claude-cli as Agent A, codex-cli as
 * Agent B — same fixed mapping as the per-KPI/per-family on-demand buttons)
 * through the full Global Read methodology, IN PARALLEL. `availableProviderIds`
 * mirrors the on-demand button's own CLI-availability check — this function
 * does not re-check availability itself.
 */
export async function runGlobalReadCli(
  allFamilies: readonly CanonicalFamilySnapshot[],
  availableProviderIds: readonly ("claude-cli" | "codex-cli")[],
  language: Language
): Promise<GlobalReadCliRunResult[]> {
  const runs: Promise<GlobalReadCliRunResult>[] = [];
  if (availableProviderIds.includes("claude-cli")) runs.push(runClaudeGlobalRead(allFamilies, "A", language));
  if (availableProviderIds.includes("codex-cli")) runs.push(runCodexGlobalRead(allFamilies, availableProviderIds.includes("claude-cli") ? "B" : "A", language));
  return Promise.all(runs);
}
