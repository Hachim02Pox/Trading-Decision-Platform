import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveCliExecutable } from "./cliExecutableResolver";
import { recordRealLlmCall } from "./realCallAudit";

// Observed live: the PRIOR phase finishes in ~65s, but the RESEARCH phase runs
// genuine multi-source web verification and hit the previous hard-coded 180_000ms
// cap exactly (180,844ms), so RESEARCH failed with CLI_UNAVAILABLE_OR_LIMITED on
// every run and the research stage could never complete as designed. This value is
// not a new invented threshold: it is the one this repo already used for exactly
// this workload (the prior globalReadCliRunner's GLOBAL_READ_TIMEOUT_MS), whose own
// comment reads "realistically several minutes of genuine agentic web research per
// agent, not seconds". The hard kill, single attempt and no-retry policy are unchanged.
const CLI_TIMEOUT_MS = 15 * 60_000;

export interface SecureGlobalReadRequest {
  provider: "claude-cli" | "codex-cli";
  phase: "PRIOR" | "RESEARCH" | "ANALYSIS_A" | "ANALYSIS_B" | "DEBATE_A" | "DEBATE_B" | "REPLY_A" | "REPLY_B" | "FINAL_SCAN" | "SYNTHESIS";
  prompt: string;
  schema: object;
}
export interface SecureGlobalReadResult {
  provider: SecureGlobalReadRequest["provider"];
  phase: SecureGlobalReadRequest["phase"];
  output: unknown | null;
  trace: Array<{ kind: "SEARCHED" | "FETCHED"; url: string | null; query: string | null }>;
  durationMs: number;
  isolation: "CONTROLLED" | "UNVERIFIED";
  error: string | null;
}

/** Keep OS and subscription location only. No API credentials, proxy overrides, Node preloads or custom provider flags. */
export function safeCliEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const keep = new Set(["PATH", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "HOME", "APPDATA", "LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)", "PROGRAMDATA", "LANG", "LC_ALL"]);
  return Object.fromEntries(Object.entries(env).filter(([key]) => keep.has(key.toUpperCase())));
}

const phaseUsesWeb = (phase: SecureGlobalReadRequest["phase"]) => phase === "RESEARCH" || phase.startsWith("ANALYSIS_") || phase === "FINAL_SCAN";

export function buildSecureClaudeArgs(phase: SecureGlobalReadRequest["phase"], schema: object): string[] {
  const web = phaseUsesWeb(phase);
  return ["-p", "--safe-mode", "--setting-sources", "", "--no-chrome", "--disable-slash-commands", "--no-session-persistence",
    "--output-format", "stream-json", "--verbose", "--json-schema", JSON.stringify(schema),
    "--tools", web ? "WebSearch,WebFetch" : "", "--allowedTools", web ? "WebSearch,WebFetch" : "",
    "--permission-mode", "dontAsk", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}'];
}

export function buildSecureCodexArgs(phase: SecureGlobalReadRequest["phase"], schemaPath: string): string[] {
  return [...(phaseUsesWeb(phase) ? ["--search"] : []), "exec", "--ignore-user-config", "--ignore-rules", "--ephemeral",
    "--sandbox", "read-only", "--skip-git-repo-check", "--json", "--output-schema", schemaPath, "-"];
}

export function parseGlobalReadTrace(raw: string): Pick<SecureGlobalReadResult, "output" | "trace"> {
  let output: unknown | null = null;
  const trace: SecureGlobalReadResult["trace"] = [];
  for (const line of raw.split(/\r?\n/)) {
    let event: Record<string, unknown>;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === "result" && !event.is_error && event.structured_output) output = event.structured_output;
    const item = event.item && typeof event.item === "object" ? event.item as Record<string, unknown> : null;
    if (event.type === "item.completed" && item?.type === "agent_message" && typeof item.text === "string") {
      try { output = JSON.parse(item.text); } catch { /* Schema failure is handled by the caller. */ }
    }
    // Codex's JSON event stream reports completed browser operations as items,
    // unlike Claude's assistant/tool_use blocks below. Preserve only the
    // operation metadata, never model-authored prose or page content.
    if (event.type === "item.completed" && item?.type === "web_search_call") {
      trace.push({ kind: "SEARCHED", url: null, query: typeof item.query === "string" ? item.query.slice(0, 500) : null });
    }
    if (event.type === "item.completed" && item?.type === "web_fetch_call") {
      trace.push({ kind: "FETCHED", url: typeof item.url === "string" ? item.url.slice(0, 2048) : null, query: null });
    }
    const message = event.message && typeof event.message === "object" ? event.message as Record<string, unknown> : null;
    if (event.type !== "assistant" || !Array.isArray(message?.content)) continue;
    for (const candidate of message.content) {
      if (!candidate || typeof candidate !== "object") continue;
      const block = candidate as Record<string, unknown>;
      if (block.type !== "tool_use") continue;
      const input = block.input && typeof block.input === "object" ? block.input as Record<string, unknown> : null;
      if (block.name === "WebSearch") trace.push({ kind: "SEARCHED", url: null, query: typeof input?.query === "string" ? input.query.slice(0, 500) : null });
      // A WebFetch tool request is not fetched/verified content. Completion is checked separately by the backend.
      if (block.name === "WebFetch") trace.push({ kind: "SEARCHED", url: typeof input?.url === "string" ? input.url.slice(0, 2048) : null, query: null });
    }
  }
  return { output, trace };
}

export async function runSecureGlobalReadCli(input: SecureGlobalReadRequest): Promise<SecureGlobalReadResult> {
  const started = performance.now();
  const base = { provider: input.provider, phase: input.phase, output: null, trace: [], durationMs: 0, isolation: "UNVERIFIED" as const };
  const executable = resolveCliExecutable(input.provider === "claude-cli" ? "claude" : "codex");
  if (!executable) return { ...base, error: input.provider === "claude-cli" ? "CLAUDE_NOT_FOUND" : "CODEX_NOT_FOUND" };
  const cwd = mkdtempSync(join(tmpdir(), "gold-global-read-"));
  const env = safeCliEnvironment(process.env);
  try {
    const helpArgs = input.provider === "claude-cli" ? ["--help"] : ["exec", "--help"];
    const help = execFileSync(executable.command, [...executable.prefixArgs, ...helpArgs], { cwd, env, encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 200_000 });
    if (input.provider === "claude-cli" && !["--safe-mode", "--tools", "--setting-sources"].every((flag) => help.includes(flag))) return { ...base, error: "CLAUDE_REQUIRED_ISOLATION_FLAGS_MISSING" };
    if (input.provider === "codex-cli" && !["--ignore-user-config", "--ignore-rules", "--ephemeral", "--output-schema"].every((flag) => help.includes(flag))) return { ...base, error: "CODEX_REQUIRED_ISOLATION_FLAGS_MISSING" };
    if (input.provider === "claude-cli") {
      const authRaw = execFileSync(executable.command, [...executable.prefixArgs, "auth", "status", "--json"], { cwd, env, encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 20_000 });
      const auth = JSON.parse(authRaw) as { loggedIn?: boolean; authMethod?: string };
      if (!auth.loggedIn || !["claude.ai", "oauth_token"].includes(auth.authMethod ?? "")) return { ...base, error: "SUBSCRIPTION_LOGIN_REQUIRED: API-key authentication is not allowed for Global Read." };
    } else {
      execFileSync(executable.command, [...executable.prefixArgs, "login", "status"], { cwd, env, encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 20_000 });
    }
    recordRealLlmCall({ provider: input.provider, model: input.provider, role: `global-read-${input.phase}`, kpiId: "global-read", attempt: 1 });
    let args: string[];
    if (input.provider === "claude-cli") args = buildSecureClaudeArgs(input.phase, input.schema);
    else {
      const schemaPath = join(cwd, "output-schema.json");
      writeFileSync(schemaPath, JSON.stringify(input.schema), { encoding: "utf8", mode: 0o600 });
      args = buildSecureCodexArgs(input.phase, schemaPath);
    }
    const raw = await execute(executable.command, [...executable.prefixArgs, ...args], cwd, env, input.prompt);
    const parsed = parseGlobalReadTrace(raw);
    if (!phaseUsesWeb(input.phase) && parsed.trace.length) return { ...base, error: "UNEXPECTED_TOOL_LEAKAGE" };
    return { ...base, ...parsed, durationMs: Math.round(performance.now() - started), isolation: "CONTROLLED", error: parsed.output ? null : "STRUCTURED_OUTPUT_MISSING" };
  } catch {
    // Never leak CLI stderr, auth response, filesystem paths or prompts into HTTP/UI errors.
    return { ...base, durationMs: Math.round(performance.now() - started), error: "CLI_UNAVAILABLE_OR_LIMITED: subscription login, quota, timeout or CLI execution failed." };
  } finally {
    // Only the exact fresh mkdtemp directory, not a user/config/workspace directory.
    // Cleanup must never discard a completed analysis. Observed live on Windows:
    // the just-exited CLI still holds handles under this directory during the
    // RESEARCH phase, so rmSync raises EPERM — and because this runs in `finally`,
    // that exception replaced the returned result and surfaced as "Global Read
    // failed" on every run. A leaked temp directory (which the OS reclaims) is
    // strictly less harmful than destroying a verified multi-minute analysis.
    try { rmSync(cwd, { recursive: true, force: true }); } catch { /* temp directory left for OS cleanup */ }
  }
}

function execute(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let bytes = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error("TIMEOUT")); }, CLI_TIMEOUT_MS);
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 2_000_000) { child.kill(); reject(new Error("OUTPUT_LIMIT")); return; }
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", () => { /* Drained, never exposed or persisted. */ });
    child.on("error", reject);
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve(output) : reject(new Error("CLI_EXIT")); });
    child.stdin.on("error", () => { /* Close handler determines the outcome. */ });
    child.stdin.end(prompt);
  });
}
