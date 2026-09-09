// Milestone 2A — the ONE module in apps/backend allowed to read
// process.env for provider credentials / runtime configuration. Every other
// file gets its configuration through `loadAppConfig()` (called once at
// boot, in src/server.ts's `main()`) — never through `process.env` directly.
//
// A missing/invalid credential for a given provider must NEVER throw or
// crash the server: that provider's config entry is simply `null`, and
// downstream code (apps/backend/src/providers/*) checks for that
// (`isConfigured()` returns false, status becomes "NOT_CONFIGURED"). This is
// what lets the app boot fully in DATA_MODE=MOCK (the default) with zero
// provider credentials present, and what keeps one missing/misconfigured
// provider from blocking any other.
//
// See docs/KPI_INTELLIGENCE_ARCHITECTURE.md's "mock/real safety gate" and
// apps/backend/src/intelligence/dataMode.ts — this module does NOT change
// that gate. `dataMode` here is read-only informational plumbing for the
// provider registry/status surface; getDataMode() remains the single source
// of truth the intelligence pipeline itself consults.

export interface FredCredentials {
  apiKey: string;
}

export interface BlsCredentials {
  apiKey: string;
}

export interface BeaCredentials {
  apiKey: string;
}

export interface MassiveCredentials {
  apiKey: string;
}

export interface TavilyCredentials {
  apiKey: string;
}

export interface FinnhubCredentials {
  apiKey: string;
}

export interface OpenAiCredentials {
  apiKey: string;
}

export interface AnthropicCredentials {
  apiKey: string;
  /**
   * Optional. Some Anthropic API keys are "identity-linked" (issued against
   * a multi-workspace organization) and the Messages API rejects every
   * request from them with a 400 ("anthropic-workspace-id is required...")
   * unless this header is also sent — a plain single-workspace key never
   * needs this. Set ANTHROPIC_WORKSPACE_ID in .env only if you hit that
   * error; find the id in the Anthropic Console's workspace settings.
   */
  workspaceId?: string;
}

export interface GeminiCredentials {
  apiKey: string;
}

/** JBlanked (jblanked.com) — F13 real economic-calendar source (MQL5 calendar feed). Free tier is 1 request/day; see apps/backend/src/jobs/f13CalendarIngestion.ts for the ingestion_state-backed guard that enforces this. */
export interface JblankedCredentials {
  apiKey: string;
}

export interface ProviderCredentials {
  fred: FredCredentials | null;
  bls: BlsCredentials | null;
  bea: BeaCredentials | null;
  massive: MassiveCredentials | null;
  tavily: TavilyCredentials | null;
  finnhub: FinnhubCredentials | null;
  openai: OpenAiCredentials | null;
  anthropic: AnthropicCredentials | null;
  gemini: GeminiCredentials | null;
  jblanked: JblankedCredentials | null;
}

/**
 * MySQL connection settings for apps/backend/src/db/**. `null` means "not
 * configured" — mirrors every ProviderCredentials entry above: a missing/
 * incomplete DB config must NEVER crash the app at boot (most families
 * haven't been migrated to read from MySQL yet in this phase, so the app
 * must still boot and serve mock/real-provider data with zero DB config
 * present). Only code that actually calls apps/backend/src/db/pool.ts's
 * `getPool()` fails, gracefully, when DB config is missing — see that
 * module's DbNotConfiguredError.
 */
export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Supabase Auth — holder accounts (signup/login/email confirmation). This is
 * infra, not a market-data provider, so it lives beside `db` rather than in
 * `ProviderCredentials`. `serviceRoleKey` is only needed for admin-only
 * backend operations; most auth checks (verifying a holder's JWT) only need
 * `url`. `null` means "not configured" — routes that depend on it must
 * degrade to 503, never crash the app at boot.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string | null;
}

export interface AppConfig {
  dataMode: "MOCK" | "REAL";
  port: number;
  frontendOrigin: string;
  providers: ProviderCredentials;
  db: DbConfig | null;
  supabase: SupabaseConfig | null;
}

/** Trims and returns undefined for empty/whitespace-only values — a blank .env line is treated as "not set", not as an empty-string credential. */
function readNonEmpty(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function loadFred(): FredCredentials | null {
  const apiKey = readNonEmpty("FRED_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadBls(): BlsCredentials | null {
  // BLS single-series lookups work unauthenticated (see docs/PROVIDER_SETUP.md)
  // — a missing key is NOT "not configured" in the same sense as the other
  // credentialed providers, but there is nothing to type-carry when absent.
  const apiKey = readNonEmpty("BLS_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadBea(): BeaCredentials | null {
  const apiKey = readNonEmpty("BEA_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadMassive(): MassiveCredentials | null {
  const apiKey = readNonEmpty("MASSIVE_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadTavily(): TavilyCredentials | null {
  const apiKey = readNonEmpty("TAVILY_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadFinnhub(): FinnhubCredentials | null {
  const apiKey = readNonEmpty("FINNHUB_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadOpenAi(): OpenAiCredentials | null {
  const apiKey = readNonEmpty("OPENAI_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadAnthropic(): AnthropicCredentials | null {
  const apiKey = readNonEmpty("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  const workspaceId = readNonEmpty("ANTHROPIC_WORKSPACE_ID");
  return workspaceId ? { apiKey, workspaceId } : { apiKey };
}

function loadGemini(): GeminiCredentials | null {
  // Per the research file: GEMINI_API_KEY and/or GOOGLE_API_KEY; if both are
  // set, GOOGLE_API_KEY wins per Google's current guidance.
  const apiKey = readNonEmpty("GOOGLE_API_KEY") ?? readNonEmpty("GEMINI_API_KEY");
  return apiKey ? { apiKey } : null;
}

function loadJblanked(): JblankedCredentials | null {
  const apiKey = readNonEmpty("JBLANKED_API_KEY");
  return apiKey ? { apiKey } : null;
}

/**
 * `DB_USER` and `DB_NAME` are the "is this configured at all" signal — a
 * local dev MySQL root user commonly has an empty password, so an
 * empty/missing `DB_PASSWORD` alone must not be treated as "not
 * configured". `DB_HOST`/`DB_PORT` default to the common local-dev values
 * when unset.
 */
function loadDb(): DbConfig | null {
  const user = readNonEmpty("DB_USER");
  const database = readNonEmpty("DB_NAME");
  if (!user || !database) return null;

  const host = readNonEmpty("DB_HOST") ?? "127.0.0.1";
  const port = Number(readNonEmpty("DB_PORT")) || 3306;
  const password = process.env.DB_PASSWORD ?? "";

  return { host, port, user, password, database };
}

/** Accepts either the new (SUPABASE_PUBLISHABLE_KEY/SUPABASE_SECRET_KEY) or legacy (SUPABASE_API_ANON/SUPABASE_API_service_role) Supabase key names — this repo's .env currently uses the legacy names. */
function loadSupabase(): SupabaseConfig | null {
  const restUrl = readNonEmpty("SUPABASE_API_URL") ?? readNonEmpty("SUPABASE_URL");
  const anonKey = readNonEmpty("SUPABASE_PUBLISHABLE_KEY") ?? readNonEmpty("SUPABASE_API_ANON");
  if (!restUrl || !anonKey) return null;

  // Normalize "https://<ref>.supabase.co/rest/v1/" (or without trailing
  // slash) down to the bare project URL the supabase-js client expects.
  const url = restUrl.replace(/\/rest\/v1\/?$/, "");
  const serviceRoleKey = readNonEmpty("SUPABASE_SECRET_KEY") ?? readNonEmpty("SUPABASE_API_service_role") ?? null;

  return { url, anonKey, serviceRoleKey };
}

let cachedConfig: AppConfig | null = null;

/**
 * Reads process.env and produces a typed, validated config object. Intended
 * to be called ONCE at boot (src/server.ts). Never throws — an invalid/
 * missing provider credential simply yields `null` for that provider.
 */
export function loadAppConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const dataMode: "MOCK" | "REAL" = process.env.DATA_MODE === "REAL" ? "REAL" : "MOCK";
  const port = Number(process.env.PORT) || 4001;
  const frontendOrigin = readNonEmpty("FRONTEND_ORIGIN") ?? "http://localhost:3000";

  cachedConfig = {
    dataMode,
    port,
    frontendOrigin,
    providers: {
      fred: loadFred(),
      bls: loadBls(),
      bea: loadBea(),
      massive: loadMassive(),
      tavily: loadTavily(),
      finnhub: loadFinnhub(),
      openai: loadOpenAi(),
      anthropic: loadAnthropic(),
      gemini: loadGemini(),
      jblanked: loadJblanked(),
    },
    db: loadDb(),
    supabase: loadSupabase(),
  };

  return cachedConfig;
}

/** Test-only escape hatch — never called from production code paths. */
export function __resetAppConfigCacheForTests(): void {
  cachedConfig = null;
}
