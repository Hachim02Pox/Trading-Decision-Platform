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

// "No metered API" provider #1 — shells out to the user's already-installed,
// subscription-authenticated Claude Code CLI (`claude`) in non-interactive
// mode instead of calling the metered Anthropic API
// (anthropicLlmProvider.ts, kept intact and untouched alongside this).
//
// CLAUDE CLI PROVIDER — exact invocation:
//   claude -p --output-format json --json-schema '<CLI_ANALYST_JSON_SCHEMA>'
//     --allowedTools "WebSearch,WebFetch"
//     --disallowedTools "Edit,Write,Bash,NotebookEdit,KillShell,BashOutput,Task"
//     --permission-mode dontAsk
//     --strict-mcp-config
//     "<prompt text>"
// verified live against `claude --help` and a real non-interactive call
// while building this feature (see cliAnalystSchema.ts for the schema, and
// this file's SAFETY comments below for why each flag is present).
//
// SAFETY — tool restriction: `--allowedTools` is an ALLOWLIST (only
// WebSearch/WebFetch may run at all); `--disallowedTools` is a redundant
// DENYLIST naming every file/shell-mutating tool explicitly, as
// defense-in-depth in case a future Claude Code version ships a new
// mutating tool this allowlist didn't anticipate. `--strict-mcp-config`
// (with no `--mcp-config` of our own) discards every MCP server configured
// globally/per-project for the invoking user (verified: this workstation's
// session has Gmail/Calendar/Drive/21st MCP servers configured — none of
// them, nor any Bash-capable one, must ever be reachable from this
// subprocess). `--permission-mode dontAsk` combined with non-interactive
// `-p` mode means any tool NOT on the allowlist is silently denied rather
// than hanging on a prompt nobody can answer — LIVE-VERIFIED: a call
// instructed to write a file via the Write tool was denied
// (`permission_denials` in the response) and created no file.
//
// SAFETY — cwd isolation: every invocation's `cwd` is
// `cliScratchDir.ts`'s dedicated OS-temp directory, never this repo — see
// that file's header for why this alone makes accidental repo access
// structurally unreachable, independent of the tool restriction above.
//
// SAFETY — timeout: `cliSubprocess.ts` hard-kills the child after
// `CLI_TIMEOUT_MS` (SIGTERM, then SIGKILL shortly after) and this file
// throws on `timedOut`, which the caller (realInterpretationGenerator.ts)
// already treats as "this KPI's real analysis failed this run" — never a
// crash of the endpoint.
//
// ADJUDICATION: this provider's `generateAdjudication`/
// `generateChallengeFindings` are RULE-BASED, local computations — no
// subprocess — see cliAdjudication.ts's file header for the full rationale
// (avoiding a third, slow CLI call).

const CLI_TIMEOUT_MS = 110_000;
const MODEL_LABEL = "claude-code-cli";

export function buildClaudeAnalystInvocation(promptText: string): CliInvocation {
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
      JSON.stringify(CLI_ANALYST_JSON_SCHEMA),
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
    timeoutMs: CLI_TIMEOUT_MS,
  };
}

interface ClaudeCliJsonResponse {
  structured_output?: unknown;
  result?: unknown;
}

/** `claude -p --output-format json` wraps the model's answer in a result envelope — prefer the pre-parsed `structured_output` field (present when `--json-schema` constrained the output), falling back to a loose extraction of `result` (a JSON string) if that field is absent for any reason. Never throws — returns `null` on any shape mismatch. */
export function parseClaudeCliEnvelope(stdout: string): unknown {
  let envelope: ClaudeCliJsonResponse;
  try {
    envelope = JSON.parse(stdout) as ClaudeCliJsonResponse;
  } catch {
    return null;
  }
  if (envelope.structured_output !== undefined) return envelope.structured_output;
  if (typeof envelope.result === "string") return extractJsonObjectLoosely(envelope.result);
  return null;
}

export function createClaudeCliLlmProvider(): LlmProvider {
  return {
    id: "claude-cli",
    model: MODEL_LABEL,

    async generateAnalystConclusion(req: AnalystLlmRequest): Promise<AnalystLlmResult> {
      return withOneRetry(async (attempt) => {
        recordRealLlmCall({ provider: "claude-cli", model: MODEL_LABEL, role: `analyst-${req.role}`, kpiId: req.kpi.id, attempt });
        const promptText = buildCliAnalystPrompt(req, "Claude Code CLI");
        const invocation = buildClaudeAnalystInvocation(promptText);
        const result = await runCliSubprocess(invocation);
        if (result.timedOut) {
          throw new Error(`claude-cli analyst call timed out after ${invocation.timeoutMs}ms`);
        }
        if (result.exitCode !== 0) {
          throw new Error(`claude-cli analyst call exited ${result.exitCode ?? "null"}: ${result.stderr.slice(0, 500)}`);
        }
        const raw = parseClaudeCliEnvelope(result.stdout);
        const parsed = parseCliAnalystOutput(raw);
        if (!parsed) {
          throw new Error("claude-cli analyst call returned output that failed schema validation");
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
