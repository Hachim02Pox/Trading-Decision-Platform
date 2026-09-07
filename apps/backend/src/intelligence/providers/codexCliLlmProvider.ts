import { writeFileSync } from "node:fs";
import path from "node:path";
import type {
  AdjudicatorLlmRequest,
  AdjudicatorLlmResult,
  AnalystLlmRequest,
  AnalystLlmResult,
  ChallengeLlmRequest,
  ChallengeLlmResult,
  LlmProvider,
} from "./llmProvider";
import { withOneRetry } from "./llmProvider";
import { CLI_ANALYST_JSON_SCHEMA, extractJsonObjectLoosely, mapCliAnalystOutputToAnalystLlmResult, parseCliAnalystOutput } from "./cliAnalystSchema";
import { synthesizeCliAdjudication, synthesizeCliChallengeFindings } from "./cliAdjudication";
import { resolveCliExecutable } from "./cliExecutableResolver";
import { buildCliAnalystPrompt } from "./cliPromptBuilder";
import { getCliScratchDir } from "./cliScratchDir";
import { type CliInvocation, runCliSubprocess } from "./cliSubprocess";
import { recordRealLlmCall } from "./realCallAudit";

// "No metered API" provider #2 — shells out to the user's already-
// installed, subscription/ChatGPT-authenticated Codex CLI (`codex`) in
// non-interactive mode instead of calling a metered OpenAI API key. Kept
// alongside (not replacing) openaiLlmProvider.ts.
//
// CODEX CLI PROVIDER — exact invocation:
//   codex exec --json --sandbox read-only --skip-git-repo-check
//     --output-schema <path to CLI_ANALYST_JSON_SCHEMA written to the scratch dir>
//     "<prompt text, which ALSO explicitly instructs 'respond with ONLY a
//        single JSON object ... no prose before or after' as a defensive
///       second layer in case --output-schema's structured-output
//        enforcement is ever imperfect>"
// verified live against `codex exec --help` and a real non-interactive call
// while building this feature: `--output-schema` DOES constrain Codex's
// final `agent_message` to the given JSON Schema in practice (live-tested),
// so this is the schema-constrained path the feature spec allowed as a
// fallback-of-last-resort for Codex specifically — parsing stays fully
// defensive regardless (see `parseCodexCliOutput` below), because a model
// can still occasionally emit near-miss output.
//
// SAFETY — tool/capability restriction: `--sandbox read-only` is Codex's
// own sandbox policy flag (the feature spec's guess at
// `-c 'sandbox_permissions=[...]'` turned out to be a legacy/lower-level
// config key — `codex exec --help`, live-checked, exposes the equivalent
// directly as `--sandbox {read-only|workspace-write|danger-full-access}`).
// `read-only` denies the model-generated-shell-command sandbox any
// filesystem write or execute-with-side-effects capability; Codex's web
// search tool is a separate, non-shell built-in and is unaffected by this
// flag (LIVE-VERIFIED evidence/sources still come through — see the
// on-demand live-test report). `--skip-git-repo-check` is required only
// because the scratch cwd below is intentionally not a git repo.
//
// SAFETY — cwd isolation: every invocation's `cwd` is
// `cliScratchDir.ts`'s dedicated OS-temp directory, never this repo.
//
// SAFETY — timeout: identical mechanism to claudeCliLlmProvider.ts, via the
// same shared `cliSubprocess.ts`.
//
// ADJUDICATION: identical rule-based, no-subprocess approach as
// claudeCliLlmProvider.ts — see cliAdjudication.ts.

const CLI_TIMEOUT_MS = 110_000;
const MODEL_LABEL = "codex-cli";
const OUTPUT_SCHEMA_FILE_NAME = "codex-analyst-output-schema.json";

let cachedSchemaFilePath: string | null = null;

/** Writes `CLI_ANALYST_JSON_SCHEMA` to a file once (Codex's `--output-schema` takes a file path, not an inline string) inside the same isolated scratch directory every CLI subprocess's cwd is pinned to — never anywhere in this repo. Idempotent: re-writes the same static content if called again, never appends/mutates unpredictably. */
function getCodexOutputSchemaFilePath(): string {
  if (cachedSchemaFilePath) return cachedSchemaFilePath;
  const filePath = path.join(getCliScratchDir(), OUTPUT_SCHEMA_FILE_NAME);
  writeFileSync(filePath, JSON.stringify(CLI_ANALYST_JSON_SCHEMA, null, 2), "utf8");
  cachedSchemaFilePath = filePath;
  return filePath;
}

export function buildCodexAnalystInvocation(promptText: string): CliInvocation {
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
      getCodexOutputSchemaFilePath(),
      promptText,
    ],
    cwd: getCliScratchDir(),
    timeoutMs: CLI_TIMEOUT_MS,
  };
}

interface CodexJsonlEvent {
  type?: string;
  item?: { type?: string; text?: unknown };
}

/**
 * `codex exec --json` streams JSON Lines events; the model's final answer
 * is the LAST `item.completed` event whose `item.type` is `"agent_message"`.
 * Parses defensively line-by-line (a malformed/partial line is skipped, not
 * fatal) and returns `null` (never throws) if no usable agent_message is
 * found — callers must treat that as "this analyst's contribution failed".
 */
export function extractLastCodexAgentMessage(stdout: string): unknown {
  let lastMessageText: string | null = null;
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    let event: CodexJsonlEvent;
    try {
      event = JSON.parse(trimmed) as CodexJsonlEvent;
    } catch {
      continue;
    }
    if (event.type === "item.completed" && event.item?.type === "agent_message" && typeof event.item.text === "string") {
      lastMessageText = event.item.text;
    }
  }
  if (lastMessageText === null) return null;
  return extractJsonObjectLoosely(lastMessageText);
}

export function createCodexCliLlmProvider(): LlmProvider {
  return {
    id: "codex-cli",
    model: MODEL_LABEL,

    async generateAnalystConclusion(req: AnalystLlmRequest): Promise<AnalystLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "codex-cli", model: MODEL_LABEL, role: `analyst-${req.role}`, kpiId: req.kpi.id, attempt });
        const promptText = buildCliAnalystPrompt(req, "Codex CLI");
        const invocation = buildCodexAnalystInvocation(promptText);
        const result = await runCliSubprocess(invocation);
        if (result.timedOut) {
          throw new Error(`codex-cli analyst call timed out after ${invocation.timeoutMs}ms`);
        }
        if (result.exitCode !== 0) {
          throw new Error(`codex-cli analyst call exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}`);
        }
        const raw = extractLastCodexAgentMessage(result.stdout);
        const parsed = parseCliAnalystOutput(raw);
        if (!parsed) {
          throw new Error("codex-cli analyst call returned output that failed schema validation — treating this analyst as unavailable");
        }
        return mapCliAnalystOutputToAnalystLlmResult(parsed);
      });
    },

    async generateChallengeFindings(req: ChallengeLlmRequest): Promise<ChallengeLlmResult> {
      return synthesizeCliChallengeFindings(req);
    },

    async generateAdjudication(req: AdjudicatorLlmRequest): Promise<AdjudicatorLlmResult> {
      return synthesizeCliAdjudication(req);
    },
  };
}
