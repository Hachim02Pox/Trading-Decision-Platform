import { loadAppConfig } from "../../config/env";
import { createAnthropicLlmProvider } from "./anthropicLlmProvider";
import { isClaudeCliAvailable, isCodexCliAvailable } from "./cliAvailability";
import { createClaudeCliLlmProvider } from "./claudeCliLlmProvider";
import { createCodexCliLlmProvider } from "./codexCliLlmProvider";
import { createGeminiLlmProvider } from "./geminiLlmProvider";
import type { LlmProvider, RealLlmProviderId } from "./llmProvider";
import { createOpenAiLlmProvider } from "./openaiLlmProvider";

// Real intelligence pilot — lazy singleton registry of real LlmProvider
// instances, keyed by the same provider id used throughout
// ensemble/realPolicies.ts. Instantiated only once actually needed (never
// eagerly at module load), and only ever from real, present credentials —
// mirrors the null-if-unconfigured discipline in config/env.ts.

const instances = new Map<RealLlmProviderId, LlmProvider>();

export function isRealLlmProviderConfigured(id: RealLlmProviderId): boolean {
  const providers = loadAppConfig().providers;
  if (id === "openai") return providers.openai !== null;
  // This installation's identity-linked Anthropic key was live-tested and
  // requires the workspace header. Treat it as not pilot-ready until that
  // non-secret workspace id is configured, preventing paid OpenAI/Gemini
  // analyst calls from starting in parallel only to be discarded when the
  // Anthropic leg fails immediately.
  if (id === "anthropic") return providers.anthropic?.workspaceId !== undefined;
  if (id === "gemini") return providers.gemini !== null;
  // claude-cli/codex-cli — NOT env-var gated (no metered key involved at
  // all): "configured" means the CLI binary resolves AND is already
  // authenticated with a real session. See cliAvailability.ts.
  if (id === "claude-cli") return isClaudeCliAvailable();
  return isCodexCliAvailable();
}

export function getRealLlmProvider(id: RealLlmProviderId): LlmProvider {
  const cached = instances.get(id);
  if (cached) return cached;

  const providers = loadAppConfig().providers;
  let created: LlmProvider;
  if (id === "openai") {
    if (!providers.openai) throw new Error("getRealLlmProvider('openai') called without OPENAI_API_KEY configured");
    created = createOpenAiLlmProvider(providers.openai.apiKey);
  } else if (id === "anthropic") {
    if (!providers.anthropic) throw new Error("getRealLlmProvider('anthropic') called without ANTHROPIC_API_KEY configured");
    created = createAnthropicLlmProvider(providers.anthropic.apiKey, providers.anthropic.workspaceId);
  } else if (id === "gemini") {
    if (!providers.gemini) throw new Error("getRealLlmProvider('gemini') called without GEMINI_API_KEY/GOOGLE_API_KEY configured");
    created = createGeminiLlmProvider(providers.gemini.apiKey);
  } else if (id === "claude-cli") {
    created = createClaudeCliLlmProvider();
  } else {
    created = createCodexCliLlmProvider();
  }

  instances.set(id, created);
  return created;
}

/** Test-only escape hatch. */
export function __resetRealLlmProviderRegistryForTests(): void {
  instances.clear();
}
