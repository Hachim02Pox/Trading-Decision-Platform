// FundedNext MCP client (Execution tab). FundedNext exposes account data through
// an MCP server (Streamable HTTP, JSON-RPC 2.0) authenticated with a personal
// bearer token (FUNDEDNEXT_API_KEY, generated in the FundedNext dashboard under
// "Connect with AI"). See docs/EXECUTION_REBUILD_PROGRESS.md for verified formats.
//
// Safety rules enforced here, not left to callers:
// - only tools in TOOL_POLICY can be called (the server exposes 177, some with
//   side effects or personal data such as get_investor_password / get_profile);
// - the API key is never logged and never appears in a thrown error message;
// - every call has a hard timeout, and results are cached in-process so a page
//   refresh cannot burn the server-side rate limit (x-ratelimit-limit: 1200).

export const DEFAULT_MCP_URL = "https://mcp.fundednext.com";
const REQUEST_TIMEOUT_MS = 15_000;
const ERROR_CACHE_TTL_MS = 30_000;
const PROTOCOL_VERSION = "2025-06-18";
const INTERNAL_MARKER = "\n[INTERNAL";

/** The only MCP tools the terminal may call, with how long a successful result stays cached. */
export const TOOL_POLICY = {
  get_accounts: { ttlMs: 60_000 },
  get_account_overview: { ttlMs: 15_000 },
  get_account_applicable_rules: { ttlMs: 600_000 },
  get_running_trades: { ttlMs: 10_000 },
  get_trading_overview: { ttlMs: 30_000 },
  get_trading_history: { ttlMs: 30_000 },
  get_futures_trade_history: { ttlMs: 30_000 },
  get_trading_calendar_month: { ttlMs: 60_000 },
  get_rule_breach_history: { ttlMs: 600_000 },
  position_size_calculator: { ttlMs: 60_000 },
} as const;

export type AllowedTool = keyof typeof TOOL_POLICY;

export type FundedNextErrorCode =
  | "NOT_CONFIGURED"
  | "TOOL_NOT_ALLOWED"
  | "UPSTREAM_HTTP"
  | "UPSTREAM_TIMEOUT"
  | "TOOL_ERROR"
  | "BAD_RESPONSE";

export class FundedNextError extends Error {
  constructor(
    readonly code: FundedNextErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "FundedNextError";
  }
}

export interface McpClientOptions {
  apiKey: string;
  url?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

interface CacheEntry {
  expiresAt: number;
  value: unknown;
  error: FundedNextError | null;
}

export interface CallOptions {
  /** Skip the cache read (the fresh result still refreshes the cache). */
  fresh?: boolean;
}

export function isAllowedTool(name: string): name is AllowedTool {
  return Object.prototype.hasOwnProperty.call(TOOL_POLICY, name);
}

function stableKey(name: string, args: Record<string, unknown>): string {
  const sorted = Object.keys(args).sort().map((key) => [key, args[key]]);
  return `${name}:${JSON.stringify(sorted)}`;
}

/** Extracts the JSON-RPC message for `id` from a plain JSON body or a text/event-stream body. */
function parseRpcBody(text: string, contentType: string, id: number): Record<string, unknown> | null {
  if (contentType.includes("text/event-stream")) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
      if (!data) continue;
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        if (parsed.id === id) return parsed;
      } catch {
        continue;
      }
    }
    return null;
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Tool results are JSON in content[].text, sometimes followed by an "[INTERNAL — FOR AI]" prompt block that must be dropped. */
function decodeToolResult(result: Record<string, unknown>): unknown {
  const content = Array.isArray(result.content) ? (result.content as Array<{ text?: unknown }>) : [];
  const text = content.map((part) => (typeof part.text === "string" ? part.text : "")).join("\n");
  const cut = text.indexOf(INTERNAL_MARKER);
  const payload = (cut === -1 ? text : text.slice(0, cut)).trim();
  let decoded: unknown;
  try {
    decoded = JSON.parse(payload);
  } catch {
    throw new FundedNextError("BAD_RESPONSE", "FundedNext returned a non-JSON tool result.");
  }
  const failed = result.isError === true || (decoded !== null && typeof decoded === "object" && (decoded as { error?: unknown }).error === true);
  if (failed) {
    const info = decoded as { message?: unknown; status?: unknown };
    const message = typeof info.message === "string" ? info.message : "FundedNext tool error.";
    const status = typeof info.status === "number" ? info.status : undefined;
    throw new FundedNextError("TOOL_ERROR", message, status);
  }
  return decoded;
}

export class FundedNextMcpClient {
  private readonly apiKey: string;
  private readonly url: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private sessionId: string | null = null;
  private sessionPromise: Promise<string | null> | null = null;
  private nextId = 0;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(options: McpClientOptions) {
    this.apiKey = options.apiKey;
    this.url = options.url ?? DEFAULT_MCP_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async callTool(name: string, args: Record<string, unknown> = {}, options: CallOptions = {}): Promise<unknown> {
    if (!isAllowedTool(name)) throw new FundedNextError("TOOL_NOT_ALLOWED", `Tool "${name}" is not allowed.`);

    const key = stableKey(name, args);
    if (!options.fresh) {
      const hit = this.cache.get(key);
      if (hit && hit.expiresAt > this.now()) {
        if (hit.error) throw hit.error;
        return hit.value;
      }
    }
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const run = this.fetchTool(name, args, key).finally(() => this.inflight.delete(key));
    this.inflight.set(key, run);
    return run;
  }

  private async fetchTool(name: AllowedTool, args: Record<string, unknown>, key: string): Promise<unknown> {
    try {
      const value = await this.rpcToolCall(name, args, true);
      this.cache.set(key, { expiresAt: this.now() + TOOL_POLICY[name].ttlMs, value, error: null });
      return value;
    } catch (error) {
      if (error instanceof FundedNextError && error.code === "TOOL_ERROR") {
        // Negative-cache upstream 500s so a broken endpoint is not hammered on every page load.
        this.cache.set(key, { expiresAt: this.now() + ERROR_CACHE_TTL_MS, value: null, error });
      }
      throw error;
    }
  }

  private async rpcToolCall(name: string, args: Record<string, unknown>, allowSessionRetry: boolean): Promise<unknown> {
    const sessionId = await this.ensureSession();
    const id = ++this.nextId;
    const response = await this.post({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, sessionId);

    if ((response.status === 400 || response.status === 404) && sessionId && allowSessionRetry) {
      this.resetSession();
      return this.rpcToolCall(name, args, false);
    }
    if (response.status === 401 || response.status === 403) {
      throw new FundedNextError("UPSTREAM_HTTP", "FundedNext rejected the API key (expired or revoked?). Generate a new one in the FundedNext dashboard.", response.status);
    }
    if (!response.ok) throw new FundedNextError("UPSTREAM_HTTP", `FundedNext MCP responded with HTTP ${response.status}.`, response.status);

    const message = parseRpcBody(response.text, response.contentType, id);
    if (!message) throw new FundedNextError("BAD_RESPONSE", "FundedNext MCP returned an unreadable response.");
    if (message.error) {
      const info = message.error as { message?: unknown };
      throw new FundedNextError("TOOL_ERROR", typeof info.message === "string" ? info.message : "FundedNext MCP error.");
    }
    if (!message.result || typeof message.result !== "object") throw new FundedNextError("BAD_RESPONSE", "FundedNext MCP response had no result.");
    return decodeToolResult(message.result as Record<string, unknown>);
  }

  private resetSession(): void {
    this.sessionId = null;
    this.sessionPromise = null;
  }

  private ensureSession(): Promise<string | null> {
    if (this.sessionId) return Promise.resolve(this.sessionId);
    if (this.sessionPromise) return this.sessionPromise;
    const opening = this.openSession().finally(() => {
      this.sessionPromise = null;
    });
    this.sessionPromise = opening;
    return opening;
  }

  private async openSession(): Promise<string | null> {
    const id = ++this.nextId;
    const init = await this.post({
      jsonrpc: "2.0",
      id,
      method: "initialize",
      params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "zenith-terminal", version: "1.0.0" } },
    }, null);
    if (init.status === 401 || init.status === 403) {
      throw new FundedNextError("UPSTREAM_HTTP", "FundedNext rejected the API key (expired or revoked?). Generate a new one in the FundedNext dashboard.", init.status);
    }
    if (!init.ok) throw new FundedNextError("UPSTREAM_HTTP", `FundedNext MCP initialize failed with HTTP ${init.status}.`, init.status);

    const sessionId = init.sessionId;
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionId);
    this.sessionId = sessionId;
    return sessionId;
  }

  private async post(body: Record<string, unknown>, sessionId: string | null): Promise<{ ok: boolean; status: number; text: string; contentType: string; sessionId: string | null }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await this.fetchImpl(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text, contentType: res.headers.get("content-type") ?? "", sessionId: res.headers.get("mcp-session-id") };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new FundedNextError("UPSTREAM_TIMEOUT", "FundedNext MCP timed out.");
      throw new FundedNextError("UPSTREAM_HTTP", "Could not reach FundedNext MCP.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
