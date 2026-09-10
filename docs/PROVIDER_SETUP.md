# Provider Setup (Milestone 2A)

## Current runtime status (post-AI-pilot cost review)

The original Milestone 2A notes below remain as historical setup context.

**Two independent flags now govern this app, deliberately decoupled:**

1. **Free market-data overrides (F2, F3, F4, F5, F6, F7, F8, F9, F10, F11)** —
   `apps/backend/src/real/*.ts`, orchestrated by
   `apps/backend/src/cache/snapshotCache.ts`. These run **unconditionally,
   regardless of `DATA_MODE`** — they are 100% free/no-marginal-cost
   providers (Yahoo Finance, FRED, BLS, BEA, Treasury, NY Fed, CFTC), each
   with its own credential check and try/catch fallback to `UNAVAILABLE`, so
   it is always safe to attempt them. (Earlier in this project's history
   these were gated behind `DATA_MODE=REAL`, which incorrectly turned off
   genuinely free data any time the paid AI pilot below was toggled off —
   fixed.) A failed or unavailable real field is cleared (`UNAVAILABLE`)
   rather than silently retaining a mock value. **F1 (Gold) does not exist
   in this product** — it was briefly restored on Yahoo Finance's public
   chart endpoint (`GC=F`, COMEX front-month futures) and then permanently
   removed again by explicit product-owner decision: the family is not
   wanted, and the restored data was additionally found to be factually
   wrong (its displayed 1-day % change did not match the real move). Do not
   reintroduce F1 without a new, explicit product-owner decision. **F12
   (Physical/Structural Gold) was also restored**, as an honest
   permanently-`UNAVAILABLE`/`NO_SOURCE` family (the World Gold Council
   still has no public API) rather than being silently absent — see
   `apps/backend/src/real/f12PhysicalGold.ts`.
   **F13 is now real** (JBlanked economic calendar) — see the
   dedicated "F13 / Economic Calendar (JBlanked)" section near the end of
   this file for the endpoint, timezone finding, and the current
   billing-blocked status.
   **F6 was added this pass** —
   `RECONSTRUCTED_DXY` (six FRED FX legs) is now genuinely live; see
   "F6 / DXY strategy" below (no longer scaffolding-only).
2. **The paid AI/LLM intelligence pilot (5 KPIs, `realIntelligencePilot.ts`)
   and Tavily-backed real research (`realCoordinator.ts`)** — gated
   exclusively by `DATA_MODE`. `DATA_MODE=REAL` requires OpenAI, Anthropic,
   and Gemini together (Tavily too, for the research leg); `DATA_MODE=MOCK`
   (the default, and the current setting) is an unconditional, single-point
   block on all four of those providers — see
   `apps/backend/src/intelligence/dataMode.ts` and
   `apps/backend/src/intelligence/bootstrap.ts`'s `resolveInterpretation`.
   **As of this pass, `DATA_MODE=MOCK` by explicit user decision** — these
   four providers cost real money beyond the user's existing subscription,
   so real generation/search calls are intentionally paused. Real keys
   remain configured in `.env` but are not exercised by the running app;
   only `npm run provider:test -- <id>` (a metadata-only `models.list()`
   call for OpenAI/Anthropic/Gemini, one cheap search for Tavily) touches
   them, and only when a human explicitly runs that command.

The root smoke-test command loads `apps/backend/.env` automatically:

```text
npm run provider:test -- <providerId>
```

Live verification confirmed FRED, BEA, Treasury Fiscal Data, NY Fed, and CFTC market-data providers all return real values (F2/F3 target range/F4 PCE/F5 GDPNow+claims/F7 VIX+HY OAS+IG OAS/F8 reserves+SOFR-IORB+EFFR-IORB+TGA level+TGA daily delta/F9 auctions/F10 Managed Money/F11 GVZ). Massive confirmed ZQ reference contracts but the configured plan returned HTTP 403 for pricing (F3's meeting-distribution KPIs stay UNAVAILABLE, out of scope). BLS (F4 CPI/PPI, F5 employment/AHE) hit its free-tier daily request threshold during this pass — a transient, self-resolving quota exhaustion (resets daily), not a code or credential problem; those KPIs will populate again once the quota resets. Anthropic requires the workspace id noted above (irrelevant while the AI pilot is paused).

**F6-real-mode pass:** live-verified all 6 ICE USDX FRED legs (`DEXUSEU`,
`DEXJPUS`, `DEXUSUK`, `DEXCAUS`, `DEXSDUS`, `DEXSZUS`) and `T5YIFR` (F2's
new `f2-5y5y`) with the real key — all returned real observations, and the
computed DXY level from live leg values landed within ~1% of the
independently-checked current DXY quote (methodology/publication-lag
differences expected, not a bug). Separately, during this pass's own test
volume, FRED's edge (Akamai) temporarily returned `403`/"Access Denied" for
a stretch of requests — a transient rate-limit-style block from burst
traffic to the same IP, not an application-level auth failure (FRED's own
400 `error_code` path, used for real auth failures, was not triggered).
Confirmed this surfaces correctly and honestly end-to-end: every affected
FRED-backed KPI (F2/F6/F7/F8/F11 alike) reported `UNAVAILABLE` with
`unavailableReason: "FETCH_FAILED"`, no crash, no stale/fabricated
fallback — this is the intended failure path working as designed, not a
new bug introduced this pass. Massive's Options endpoints were separately
live-tested for F11 — see "Massive Options (F11 GLD)" below.

**F2/F8 source-decisions pass:** per this project's DIRECT OFFICIAL > DIRECT
FREE RELIABLE > DETERMINISTIC DERIVED > PROXY > ESTIMATE priority rule, three
sources changed (see `apps/backend/src/real/{f2Rates,f8Liquidity}.ts` for the
full rationale/comments):
- `f2-2y`/`f2-10y` moved OFF FRED (`DGS2`/`DGS10`) back onto the U.S.
  Treasury's own Daily Par Yield Curve CSV
  (`apps/backend/src/providers/treasury.ts`'s `fetchLatestParYield`,
  previously orphaned) — live-tested this pass, confirmed correct, no FRED
  fallback (Treasury failure -> UNAVAILABLE, full stop).
- `f2-10y-real` moved OFF FRED `DFII10` onto the Treasury's Daily Par REAL
  (TIPS) Yield Curve CSV (`fetchLatestRealParYield`) — live-tested, landed
  within ~0.02pp of `DFII10` the same day, confirming correctness.
- `f2-be10` moved from DERIVED (`DGS10 - DFII10`) to DIRECT `FRED T10YIE` —
  live-tested, current value ~2.31%, squarely in the normal 2-3% range.
- `f8-tga-level`/`f8-tga-daily` moved OFF FRED's `WDTGAL` proxy onto U.S.
  Treasury Fiscal Data's Daily Treasury Statement Operating Cash Balance
  dataset (`dts/operating_cash_balance`) directly — the official figure the
  product owner asked for. Live-inspection found the CURRENT schema's TGA
  `account_type` is `"Treasury General Account (TGA) Closing/Opening
  Balance"` (an older `"Federal Reserve Account"` label is retired, last
  seen 2021-09-30), and — a genuine schema quirk — `close_today_bal` is
  always `"null"` in this table; the real figure lives in `open_today_bal`
  regardless of the row's wording (verified via the accounting identity that
  one date's Closing row equals the next date's Opening row). `f8-tga-daily`
  therefore uses a day-over-day diff of the Closing-Balance reading, not the
  same-day `close_today_bal - open_today_bal` formula originally proposed.
- `f8-effr-iorb` (NY Fed EFFR minus FRED IORB) now carries an additional
  `sourceTags: ["NY_FED", "FRED"]` field alongside its existing single
  `sourceTag: "NY_FED"`, since it genuinely combines two distinct providers
  — see `CanonicalKpi.sourceTags` in `packages/contracts/src/index.ts`.
  `f8-sofr-iorb` does NOT get this field: both its legs (SOFR, IORB) are
  FRED, so a single `sourceTag` is already precise.
- Two freshness bugs fixed in `apps/backend/src/cache/snapshotCache.ts`:
  (a) `retrievedAt` for F2/F8 (and this fix generalizes to any family using
  the same pattern) was being set to `Date.now()` fresh on every snapshot
  HTTP request rather than the actual fetch time — fixed by propagating
  `real/cache.ts`'s `cached()` `fetchedAtMs` through to `retrievedAtIso`
  instead of recomputing "now" at serve time; (b) a REAL kpi id missing from
  `REAL_KPI_CADENCE` (e.g. `f8-tga-daily`, previously absent entirely, and
  `f8-tga-level`, previously mis-bucketed `"weekly"` for a genuinely daily
  source) used to silently report quality `"current"` forever via a
  defensive fallback — that fallback now reports `"stale"` instead (no
  dedicated "freshness policy gap" `QualityState` value exists to use
  instead) and logs an error, since `QualityState` only has
  `current`/`stale`/`unavailable`.

This is the manual activation guide for every real-data provider this
terminal can connect to. **This milestone is scaffolding/plumbing only** —
`DATA_MODE` stays `MOCK` by default (see
`apps/backend/src/intelligence/dataMode.ts`, unchanged), and none of these
adapters are wired into the KPI-intelligence generation path or the mock
research pipeline. They exist so connectivity can be verified independently,
one provider at a time, via `npm run provider:test -- <id>`.

**Credentials are configured only in `apps/backend/.env`** (copy from
`apps/backend/.env.example`), never in the browser and never as a
`NEXT_PUBLIC_*` variable. `apps/backend/src/config/env.ts` is the only file
that reads `process.env` for provider credentials; everything else consumes
its typed `AppConfig` output. A missing/invalid credential never crashes the
server — that provider's registry entry simply reports `NOT_CONFIGURED`.

**Public/no-key providers are already operational, right now, with zero
user action**, ahead of their numbered step below: Treasury (Fiscal Data),
NY Fed Markets Data, Fed Board H.15, CFTC (COT), and GDELT. You can smoke-test
any of them immediately.

## How to read a smoke test

```
npm run provider:test -- <id>
```

prints:

```
PROVIDER: <displayName>
CONFIGURED: YES|NO
AUTH: PASS|FAIL|N/A
REQUEST: PASS|FAIL|N/A
CAPABILITY: <capability-specific line(s)>
SAMPLE VALUE: <value, if available>
LATENCY: <ms>
RESULT: PASS|FAIL|NOT_CONFIGURED
SAFE REASON: <present only on FAIL>
```

`RESULT: PASS` requires BOTH auth (where applicable) AND the provider's
specific required capability to succeed — an auth-only success with an
unconfirmed or failed capability check renders as `RESULT: FAIL`, never a
bare `PASS`. The raw key/token is never printed anywhere in this output.

---

## PHASE A — core market

### 1. IG — F1 Gold — **removed; F1 does not exist in this product**

F1 (Gold) does not exist as a family in this product, by explicit,
standing product-owner decision — see `docs/MVP_COCKPIT_CONTRACT.md`'s
top-of-file note. The IG adapter (`apps/backend/src/providers/ig.ts`) that
used to serve F1's XAUUSD spot/quote was deleted along with the family, its
registry entry, its `IgCredentials`/`ig` config in
`apps/backend/src/config/env.ts`, and its `IG_*` variables in
`.env.example`, and IG (a broker API requiring account credentials,
explicitly ruled out by the product owner) is **not** revived. A later pass
briefly restored F1 on a Yahoo Finance public chart endpoint (`GC=F`,
COMEX Gold futures front month); that restoration was reverted — the
product owner does not want the family, and the restored data was also
found to be factually wrong (its 1-day % change did not match the real
move). Do not reintroduce F1 without a new, explicit product-owner
decision. This section is kept only as a historical pointer for anyone
looking for the old `ig` provider id.

---

## PHASE B — easy official macro

### 2. Treasury / public sources — F9 Treasury/Fiscal

- **Status:** Already operational, no key, no action needed.
- **Supplies:** F9 — auction results (`auctions_query`) and the announced
  auction calendar (`upcoming_auctions`), via `fiscaldata.treasury.gov`.
- **Smoke test:** `npm run provider:test -- treasury`
- **What a PASS looks like:** both `ENDPOINT:` capability lines `PASS`, and a `SAMPLE VALUE` naming a real recent security term/CUSIP.
- **QRA (Quarterly Refunding) — now REAL, this pass:** a prior attempt at
  "net marketable borrowing" tried deriving it from Monthly Statement of the
  Public Debt deltas, which does not cleanly work, and was left
  UNAVAILABLE. Treasury does NOT expose this as a `fiscaldata.treasury.gov`
  field at all — it publishes it only as PROSE, in a quarterly press
  release titled "Treasury Announces Marketable Borrowing Estimates".
  **VERIFIED live this pass:** the release is discovered via a stable index
  page,
  `https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding/most-recent-quarterly-refunding-documents`,
  which always links the current quarter's release under link text starting
  "Financing Estimates:" (plain HTML `<a href=/news/press-releases/sbNNNN>`,
  unquoted href attribute in Treasury's actual markup). That release page is
  plain HTML — no PDF, no structured JSON/XML. `apps/backend/src/providers/
  treasury.ts`'s `fetchQraRelease`/`parseQraReleaseText` implement a STRICT
  parser against Treasury's exact recurring boilerplate phrasing (e.g. "...
  Treasury expects to borrow $739 billion in privately-held net marketable
  debt, assuming an end-of-September cash balance of $950 billion." / "The
  borrowing estimate is $68 billion higher than announced in May 2026...")
  — confirmed live against the actual August 2026 release. `f9-qra-
  borrowing` = the current quarter's stated estimate; `f9-qra-revision` =
  the signed higher/lower-vs-prior-announcement figure (independently
  optional — borrowing can still resolve even if that one sentence isn't
  found). Both `provenance: "observed"` (direct quotes; only a sign flip
  from "higher"/"lower" is applied). A failure to find/parse the current
  release (e.g. between release windows, or a page-structure change) yields
  `UNAVAILABLE`, never a stale or best-guess figure. Polled at most once/24h
  (`ingestion_state` job key `treasury:qra`) — QRA releases happen only
  ~4x/year (early Feb/May/Aug/Nov), so frequent polling is unnecessary.
- **Note:** the Monthly Statement of the Public Debt delta approach remains
  not implemented (superseded by the QRA press-release parser above, which
  is the actual direct source for this figure).

### 3. FRED — F2/F5/F7/F8

- **Supplies:** F2 Rates (`DFII10`, `T10YIE`, `DGS2`, `DGS10`, `T10Y2Y`, `T5YIFR` — 5Y5Y forward inflation, added F6-real-mode milestone, explicit product-owner addition), F7 Risk (`VIXCLS`, `BAMLH0A0HYM2`), F8 Liquidity (`SOFR`, `RRPONTSYD`, `WALCL`, `WRESBAL`), F5 GDPNow (`GDPNOW`) and F5 jobless claims (`IC4WSA` 4-week average, plus `ICSA`/`CCSA` initial/continuing claims — added this pass, weekly-cadence). F6 USD/FX previously used FRED's six ICE USDX reconstruction legs (`DEXUSEU`, `DEXJPUS`, `DEXUSUK`, `DEXCAUS`, `DEXSDUS`, `DEXSZUS`) — **as of the Yahoo-DXY pass, F6 no longer uses FRED**; it sources DXY directly from Yahoo Finance instead (see "F6 / DXY strategy" below). The FRED-based reconstruction code still exists, unused, as a deprecated fallback.
- **Account required:** Yes (free).
- **API key required:** Yes.
- **Env var:** `FRED_API_KEY`.
- **Obtain access:** fredaccount.stlouisfed.org — free self-serve signup.
- **Free/paid:** Free.
- **Smoke test:** `npm run provider:test -- fred`
- **What a PASS looks like:** `AUTH: PASS`, `CAPABILITY: SERIES: DGS10 — FOUND: PASS`, `SAMPLE VALUE` showing the latest 10Y yield.
- **Common safe errors:** `authentication rejected` (missing/invalid key — FRED returns a clear 400 for this).
- **Note:** rate limit (commonly cited 120 req/min) is NOT independently confirmed against FRED's own docs — treat as unverified, use conservatively.

### 4. BLS — F4/F5

- **Supplies:** F4 Inflation (`CUUR0000SA0`, `CUSR0000SA0`, `CUUR0000SA0L1E`, `CUSR0000SA0L1E`, `WPSFD4` — PPI Final Demand), F5 Employment (`LNS14000000`, `CES0000000001`, `CES0500000003` — AHE).
- **Account required:** No — unauthenticated single-series GET works.
- **API key required:** Optional. A free key raises rate limits and unlocks multi-series/POST requests.
- **Env var:** `BLS_API_KEY` (optional).
- **Obtain access:** data.bls.gov/registrationEngine — free registration.
- **Free/paid:** Free.
- **Smoke test:** `npm run provider:test -- bls` (works with `CONFIGURED: NO` — this is the one provider in this registry designed to still PASS unconfigured).
- **What a PASS looks like:** `REQUEST: PASS`, `CAPABILITY: SERIES: LNS14000000 — FOUND: PASS`, a real current unemployment rate as `SAMPLE VALUE`.
- **Common safe errors:** `series id not confirmed or request rejected`.
- **Bug A fix pass — `calculations: true` LIVE-VERIFIED, not assumed:** the v2 POST `timeseries/data/` endpoint with `calculations: true` was actually called (real key, real series) for `CUSR0000SA0L1E`, `CUSR0000SA0`, `CES0000000001`, `LNS14000000`, `CES0500000003`, and `WPSFD4`. Findings: index-type series (both CPI series, PPI) never get `net_changes` from BLS ("BLS does not produce net change calculations for Series ...") but DO get exact `pct_changes` for 1/3/6/12-month lookbacks — this is now the primary path for `f4-core-cpi-mom/yoy`, `f4-headline-cpi-mom/yoy`, and `f4-ppi-final-demand` (`provenance: "observed"`). Level-type series (payrolls, AHE) get both `net_changes` and `pct_changes` — `f5-payrolls-latest` and `f5-ahe-mom` now prefer BLS's own `net_changes`/`pct_changes` directly. See `apps/backend/src/providers/bls.ts`'s `fetchSeriesHistoryWithCalculations` and `apps/backend/src/real/blsMonthly.ts`'s `resolvePctChange`/`resolveNetChange` for the direct-then-derive fallback policy (falls back to an explicit calendar-period-matched derivation, never array-offset, when BLS's calculations block doesn't cover the exact figure needed — e.g. `f4-core-cpi-3m-ann` and `f5-payrolls-3m`, neither of which BLS publishes directly).

### 5. BEA — F4 PCE

- **Supplies:** F4 Inflation — headline/core PCE (NIPA dataset).
- **Account required:** Yes (free, no visible approval workflow).
- **API key required:** Yes.
- **Env var:** `BEA_API_KEY`.
- **Obtain access:** apps.bea.gov/api/signup/
- **Free/paid:** Free.
- **Smoke test:** `npm run provider:test -- bea`
- **What this reports (never a fabricated PASS):** `AUTH: PASS` if the key is valid, but the `CAPABILITY: PCE TABLE DISCOVERY (GetParameterValues)` line always reports `NEEDS_VALIDATION`, and overall `RESULT: FAIL` with `SAFE REASON: authentication succeeded but the real headline/core PCE table id has not been confirmed yet`. The exact PCE table id (`T20804` is the most-cited secondary-source candidate, vs `2.3.4`/`2.8.4` seen elsewhere) is genuinely unconfirmed — the adapter calls `GetParameterValues` to enumerate real `NIPA` table ids rather than guessing, per design. Confirming the correct table id is manual follow-up work, not part of this milestone.
- **Common safe errors:** `authentication rejected or GetParameterValues call failed`.

### 6. NY Fed / Federal Reserve — F3 context, F8 Liquidity/Funding

- **Status:** Already operational, no key, no action needed (both sources below).
- **NY Fed Markets Data** (`markets.newyorkfed.org`) — SOFR/SOFRAI/TGCR/BGCR (secured rates), EFFR/OBFR (unsecured rates), SOMA holdings summary, ON RRP operations. Reserve balances are NOT here — see FRED's `WRBWFRBL` (Wednesday level — NOT `WRESBAL`, a weekly average; see real/f8Liquidity.ts's top-of-file comment for why the level series is the correct one for a WoW change).
  - Smoke test: `npm run provider:test -- nyFed`
  - PASS looks like: `CAPABILITY: SERIES: SOFR (secured rates) — PASS`, a real current SOFR rate as `SAMPLE VALUE`.
- **Fed Board H.15** (`federalreserve.gov/feeds/data/H15_H15.XML`) — Selected Interest Rates XML feed. No REST API/key concept.
  - Smoke test: `npm run provider:test -- fedBoard`
  - PASS looks like: `CAPABILITY: FEED: H.15 XML (RDF/RSS 1.0) — PASS`, a sample title/value pair (e.g. "US: H15 3.63 ... Federal funds").
  - Note: the legacy Data Download Program (query-builder URLs) is being partially retired (Board announced removal of "Build Your Package" around Nov 2026) — this adapter deliberately never uses it.

---

## PHASE C — specialized

### 7. Massive (formerly Polygon.io) — F3 Fed Funds futures

- **Supplies:** F3 — CME/CBOT ZQ (30-Day Fed Funds futures) repricing.
- **Account required:** Yes (free "Futures Basic" tier: 5 calls/min, 2yr history).
- **API key required:** Yes.
- **Env var:** `MASSIVE_API_KEY`.
- **Obtain access:** massive.com
- **Free/paid:** Free tier available; paid tiers $29-$199+/month for more history/real-time.
- **Smoke test:** `npm run provider:test -- massive`
- **What this reports (never a fabricated PASS):** if the key authenticates against a reference/exchanges lookup, `AUTH: PASS` — but the `CAPABILITY: INSTRUMENT: ZQ ...` line always reports `NEEDS_VALIDATION` and overall `RESULT: FAIL`, because **whether Massive's futures coverage actually includes ZQ was never confirmed** in research. CME's own FedWatch API was evaluated as the fallback candidate this note used to flag — see item 7a below for what was actually implemented instead.
- **Common safe errors:** `authentication rejected`.
- **Note:** the exact HTTP header/param convention for the API key was not confirmed either — this adapter carries forward Polygon.io's long-documented `apiKey` query parameter convention (old `api.polygon.io` endpoints reportedly still work in parallel with `api.massive.com`).

### 7a. Investing.com Fed Rate Monitor — F3 meeting-probability distribution — **homemade calc REMOVED, real source, Playwright-based**

- **Decision record — no more homemade FedWatch calculation, ever:** the prior "CME FedWatch (unofficial)" entry that used to live here computed an implied meeting-rate distribution from CME ZQ futures settlements + NY Fed EFFR (`providers/cmeFedwatch.ts` + `real/fedwatchCalc.ts`, both now **deleted**). That homemade calculation had a **confirmed bug producing wrong probabilities** (e.g. showing 48% when wrong). This is a final product-owner decision, not open for revisiting: this product will never again compute its own Fed-funds-futures-implied probabilities from raw settlement data. CME's own free FedWatch page was separately confirmed to explicitly **prohibit automated/scripted access** in its own Terms of Use — ruled out entirely, not used, not paid for.
- **Status:** Operational, no key, no account — but requires a one-time local browser-binary install (see below).
- **Supplies:** F3's real next-FOMC-meeting probability distribution — `FedRateDistribution` in `@gold-terminal/contracts` (an N-bucket structured list: `targetRangeLabel`/`probability`/`probabilityPreviousDay`/`probabilityPreviousWeek` per bucket, `nextMeetingAt`), NOT individual `CanonicalKpi` ids — the old fixed `f3-dist-hold`/`f3-dist-25bp`/`f3-dist-50bp` three-bucket ids are **removed**, since a real source can show any number of buckets. `f3-repricing` and `f3-path-6m` remain separate, unrelated `CanonicalKpi` ids that stay `UNAVAILABLE` (`NO_SOURCE`) — unchanged by this pass.
- **sourceTag:** always exactly `"INVESTING_FED_RATE_MONITOR"` — this is a THIRD PARTY displaying CME-futures-derived numbers, never CME's own feed, so it is never labeled `CME_FEDWATCH_PUBLIC` or any CME-attributed tag.
- **Technical approach:** investing.com's free, public "Fed Rate Monitor" tool (`investing.com/central-banks/fed-rate-monitor`) is validated as viable: no login/paywall, `robots.txt` does not disallow this path, and its Terms of Use only restrict commercial redistribution of the data — not personal/internal reading (the same reading a human visiting the page would do). **Confirmed live this milestone:** a plain HTTP `fetch()` against this page is blocked outright by Cloudflare bot management (HTTP 403, no content) — only an actual browser engine gets past it. This adapter (`apps/backend/src/providers/investingFedRateMonitor.ts`) launches a real headless Chromium browser via **Playwright** (`playwright-core`, explicitly approved as a backend dependency for this specific purpose), navigates to the page, waits for the real rendered probability table (`.fedRateTbl`, confirmed selector, live-verified this milestone), and extracts every target-rate bucket shown (current/previous-day/previous-week probability), the next meeting's date/time, and the page's own "Updated: ..." timestamp.
- **Why `playwright-core` (not the full `playwright` package):** the lighter option — same automation API, without bundling `@playwright/test` or auto-installing all three browser engines. This adapter only ever needs Chromium.
  - **One-time setup:** `npx playwright-core install chromium` (from `apps/backend/`) downloads the Chromium binary this adapter launches. Not run automatically on `npm install` — run it once per machine/deploy target before this provider can succeed (it degrades to `UNAVAILABLE` if the binary is missing, never crashes the backend).
  - **Production bug found and fixed (2026-09-09):** this one-time step was never wired into the Railway deploy — `railway.json`'s `buildCommand` was just `npm run build:backend`, no browser install anywhere. Locally this always worked because someone had run the command above manually at some point; in production it silently degraded to permanent `UNAVAILABLE` ("Prochaine réunion — non disponible"), confirmed by the user. Fixed by (1) `apps/backend/package.json`'s new `postinstall` script running `playwright-core install chromium` automatically on every `npm install`, and (2) a root `nixpacks.toml` declaring the OS-level shared libraries (`libnss3`, `libatk-bridge2.0-0`, etc.) headless Chromium needs, since Nixpacks' Node image doesn't ship them by default and the browser binary alone isn't enough to actually launch. **Not yet verified live in production** — needs a Railway redeploy, then check `/api/providers/status` (or the Marché/Décision cockpit's Fed card) for `investingFedRateMonitor: CONNECTED`. If it's still failing after redeploy, check the Railway build logs for the `nixpacks.toml` apt install step and the `postinstall` line — see docs/AUTH_SUPABASE.md for the general prod-verification workflow.
- **Sanity check, not a correction:** extracted bucket probabilities must sum to ~100% (±1.5pp, accounting for the page's own 1-decimal rounding) — if they don't, the fetch is treated as failed/malformed rather than trusted, exactly per the milestone brief. This never adjusts/normalizes the source's own numbers; it only decides whether to trust the scrape at all.
- **Cadence (a few times a day, matching the tool's own real-world update pace, never more aggressively):** every 5 hours, gated via `ingestion_state` (job key `"investing:fed-rate-monitor"`) — `last_attempt_at` is checked BEFORE launching a new browser instance, so cadence survives a process restart rather than resetting with an in-memory-only interval. Within a cadence window, a request reuses the last successful fetch (persisted via `kpi_observations`, sentinel `kpi_id` `"f3-fed-rate-monitor"`, a compact non-JSON encoding of the current probabilities to fit the 255-char `text_value` column — previous-day/previous-week probabilities are NOT persisted, only served fresh right after a real fetch, a documented tradeoff of that column limit).
- **On any failure** (browser launch failure, navigation/timeout, page structure changed, bad probability sum): the distribution reports `dataState: "UNAVAILABLE"` / `unavailableReason: "FETCH_FAILED"` — **never** a fallback to the deleted homemade calculation, **never** a stale-looking cached distribution served as if fresh.
- **Next-meeting date:** read from the real F13 calendar (`macro_events`, `normalized_event_type = "FOMC_RATE_DECISION"`, via the sibling F13 calendar task's own `getEventsInRange` read surface — this adapter makes no JBlanked API call of its own, respecting that provider's strict request budget) when a row exists; otherwise falls back to the Fed Rate Monitor page's own displayed "Meeting Time," never a hardcoded literal date.
- **Account required:** No. **API key required:** No.
- **Free/paid:** Free (public page; browser-driven reading, not an API).
- **Smoke test:** `npm run provider:test -- investingFedRateMonitor` (runs a real scrape — this one is not credential-gated the way the AI-pilot providers are, since it's free/no-marginal-cost, matching this project's convention for free market-data providers).
- **What a PASS looks like:** `CAPABILITY: HEADLESS BROWSER: Fed Rate Monitor table scrape — PASS`, a `SAMPLE VALUE` listing the bucket count and one example bucket's probability.

### 8. CFTC — F10 Flows/Positioning

- **Status:** Already operational, no key, no action needed.
- **Supplies:** F10 — Managed Money long/short/spread positioning for GOLD, from the Disaggregated Futures Only COT report (Socrata dataset `72hh-3qpy` — the Legacy report `6dca-aqww` lacks a Managed Money breakout and is not used). **Milestone 2C:** also supplies `f10-mm-percentile` — the current week's Managed Money net-% reading's percentile rank within the trailing 156 weeks (~3 years), computed from one bulk historical fetch (`fetchGoldCotHistory`, `apps/backend/src/providers/cftc.ts`) cached 12h, never 156 separate calls.
- **Smoke test:** `npm run provider:test -- cftc`
- **What a PASS looks like:** `CAPABILITY: INSTRUMENT: GOLD — Managed Money long/short — PASS`, current long/short figures as `SAMPLE VALUE`.

### 9. Treasury Fiscal Data

- Covered under item 2 above (same provider, same "already operational" status) — listed again here only to match the requested activation-order numbering.

### 10. Goldhub / WGC — F12 Physical/Structural Gold — **removed (F12 no longer exists)**

F12 (Physical/Structural Gold) was removed from the product entirely —
see `docs/MVP_COCKPIT_CONTRACT.md`'s top-of-file note. No public REST API
ever existed for the World Gold Council/Goldhub (only an interactive
dashboard requiring login, spreadsheet/CSV/PDF exports, and an email
newsletter — underlying reserves data ultimately traces to IMF IFS
statistics with a ~2-month publish lag), and building a scraper for it
wasn't judged worth the fragility for this MVP. The `wgc` placeholder
adapter (`apps/backend/src/providers/wgc.ts`) has been deleted along with
the family and its registry entry.

### 11. Atlanta Fed (GDPNow) — via FRED, not a separate adapter

- **Important:** GDPNow has **no native API of its own**. It is pulled via
  FRED's own `GDPNOW` series (see item 3 above) — there is no separate
  `atlantaFed` provider entry in this registry. Do not look for one.

### 12. Remaining provisional sources — NEEDS_RESEARCH / NOT_AVAILABLE_FREE

`gvz` (F11 — CBOE Gold Volatility Index) and `f7-ig-oas` (F7 — investment-
grade OAS) are **no longer in this bucket** — both are now wired for real,
free data (FRED `GVZCLS` and `BAMLC0A0CM` respectively; see
`apps/backend/src/real/f11GoldVol.ts` and `f7Risk.ts`).

**Massive Options (F11 GLD) — checked this pass, found not genuinely
usable free for an ADDITION beyond the existing GVZ proxy:** live test
calls against a real GLD contract confirmed `/v3/reference/options/contracts?underlying_ticker=GLD`
returns real reference/metadata (contracts genuinely listed, HTTP 200).
Per-contract EOD aggregates (`/v2/aggs/ticker/{optionsTicker}/range/...`)
also return real OHLC+volume data for an individual contract (HTTP 200,
non-empty `results` with real `v`/`o`/`h`/`l`/`c` fields) — this is NOT
blocked, contrary to the ambiguity flagged in the milestone brief. However:
(a) real-time/latest-quote endpoints (`/v3/snapshot/options/...`,
`/v3/trades/...`) ARE blocked — `403 NOT_AUTHORIZED "upgrade your plan"`;
(b) there is no grouped/bulk daily-bars endpoint for options (confirmed —
`/v2/aggs/grouped/locale/us/market/options/{date}` returns `400`, options is
not a valid `marketType` for that path; only `stocks`/`fx`/`crypto` are),
so computing any genuinely useful aggregate (e.g. a real EOD put/call
volume ratio for GLD) would require one aggs call PER CONTRACT across
GLD's full option chain — hundreds of strikes/expiries — which is not
feasible under a rate-limited free tier for a live cockpit/drawer refresh.
**Verdict: not implemented.** F11 is unchanged — GVZ (`GVZCLS`) remains the
only real F11 source, honestly labeled as a GLD-options proxy, per the
existing locked product decision.

Re-checked this pass, still genuinely unavailable free:

- **MOVE index (F7)** — still no genuinely usable free source, though not
  for lack of a candidate this time: MOVE is not an ICE BofA OAS-style
  series (those ARE on FRED, e.g. `BAMLH0A0HYM2`/`BAMLC0A0CM`) — it is a
  distinct, proprietary ICE BofA product (`developer.ice.com`, paid access
  only), and Yahoo Finance's `^MOVE` symbol, while carrying a plausible
  price series, has confirmed-wrong self-describing metadata (see "F7 /
  MOVE" section below) and is deliberately not used per the product owner's
  validation rule. `f7-move`/`f7-move-1d` stay `UNAVAILABLE`
  (`unavailableReason: "NO_SOURCE"`).
- **GLD physical holdings (F10) — now REAL, this pass.** SPDR's own
  historical-archive endpoint IS a genuinely free, stable, machine-readable
  source — VERIFIED live this pass: `spdrgoldshares.com/usa/historical-
  data/`'s "Historical Archive (XLSX)" link resolves to
  `https://api.spdrgoldshares.com/api/v1/historical-archive?product=gld&exchange=NYSE&lang=en`,
  which returns a freshly generated genuine `.xlsx` file (`Content-Type:
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, a
  same-day `last-modified` header) with daily history back to 2004-11-18.
  (A different, decoy-looking URL that surfaces in generic web search —
  `spdrgoldshares.com/assets/dynamic/GLD/GLD_US_archive_EN.csv` — was
  confirmed live to 301-redirect to an unrelated custodian PDF bar list, not
  holdings history; deliberately not used.) Parsed with `exceljs` (see
  "New dependency" below) — see `apps/backend/src/providers/spdrGld.ts` for
  the full column layout and the exact "US Holiday" holiday-row convention
  VERIFIED live by scanning the full ~22-year history. `f10-etf-holdings` =
  latest trading day's "Tonnes of Gold" (`provenance: "observed"`).
  `f10-etf-delta` = the tonnes delta between the two most recent rows that
  SURVIVE the holiday filter (`provenance: "derived"`) — deliberately never
  the file's dollar "Total Net Asset Value" column, which the gold price
  itself would contaminate. This is GLD-specific (one issuer), not IAU, not
  the World Gold Council/Goldhub (still no public API — see the F12 section
  above), and not Massive (no bulk holdings feed). Polled at most once/~20h
  (`ingestion_state` job key `spdr:gld`) — SPDR's exact daily publish time
  was not confirmed live this pass, so a once/day-equivalent check is used.
  Labels corrected in `apps/backend/src/mock/fixtures.ts` from the prior
  "Global ETF Holdings" (overclaiming a market-wide aggregate) to "SPDR GLD
  — Physical Holdings" / "GLD Holdings Δ (Tonnes)". The small ongoing
  sponsor-fee gold drawdown (a routine, tiny daily deduction of physical
  gold to pay the fund's expenses) is documented as an educational note in
  `apps/frontend/src/content/familyEducation.ts`'s F10 entry — not
  algorithmically corrected for in this MVP.
  **F10 participation-system expansion (2026-09-01):** a fresh live schema
  audit found 5,478 valid issuer observations from 2004-11-18 through
  2026-08-31, 204 explicit `US Holiday` rows, and zero other invalid data
  rows. The archive directly supplies closing price, ounces/share,
  NAV/share, total ounces, tonnes, and total NAV. It does not supply a
  historical Shares Outstanding field, so estimated dollar creations/
  redemptions are deliberately omitted; FMP/Finnhub are not used. F10 now
  derives physical changes over 1/5/20 valid observations, a rolling
  60-observation daily-flow Z-score, the current 20-observation flow's
  percentile within 756 trailing valid sessions, GLD price returns, the
  deterministic price/flow matrix, and cross-channel participation breadth.
  Holidays are skipped rather than forward-filled. Required tonnes and
  closing-price histories bootstrap into the database when it is available; a DB
  bookkeeping failure never suppresses the live SPDR reading.
  **F10 stabilization (2026-09-01, on the MySQL setup this project used at the time — see docs/AUTH_SUPABASE.md "Mise à jour 6" for the 2026-09-09 move to Supabase Postgres, `pg`, one shared pool with `max: 10`; this incident's root cause and fix generalize the same way, only the driver changed):** the earlier MySQL `Too many
  connections` failure was traced to numerous orphaned Node test/dev
  processes, each owning its own otherwise-correct bounded process-local
  pool. MySQL itself was configured for 151 connections; the application
  has one shared `mysql2/promise` pool with `connectionLimit: 10`. Server
  shutdown now closes that pool on SIGINT/SIGTERM, and the snapshot test
  closes its pool in teardown. After cleanup, 50 repeated snapshot requests
  and 20 frontend-load/snapshot cycles held steady at 11 connected threads
  while the backend was running, returning to 1 diagnostic connection after
  shutdown. Both SPDR series persisted 5,478 distinct dates and survived a
  backend restart without duplicate rows.

  Participation breadth is explicitly cross-horizon: CFTC's weekly WoW
  change is compared with GLD's five-valid-observation change. The UI shows
  both as-of dates and refuses to present a current breadth state when either
  input is not real/current. “20-Obs. Flow Extension” is the percentile rank
  of the current 20-observation holdings change within the trailing 756
  valid-session comparison window; it is not an investor share, remaining-
  buyer measure, capacity estimate, or reversal forecast.
- **New dependency:** `exceljs` was added to `apps/backend/package.json`
  to parse the XLSX above. `xlsx` (SheetJS) was evaluated first and
  rejected — the npm-registry build carries two unfixed HIGH-severity
  advisories (prototype pollution, ReDoS) that are directly reachable via
  parsing untrusted spreadsheet content, exactly this use case. `exceljs`
  audits with one transitive MODERATE advisory (a buffer-bounds issue in
  `uuid`'s v3/v5/v6 functions) that is not reachable here — `exceljs` only
  ever calls `uuid`'s `v4` (random) function, never v3/v5/v6.

Still `NEEDS_RESEARCH` (unchanged, not re-checked this pass — out of this
pass's focused scope):

| id | Supplies | Note |
|---|---|---|
| `ism` | F5 — ISM Services/Manufacturing PMI | No free/public API confirmed. Re-checked this pass: a `JBLANKED_API_KEY` is configured in `.env` for a separate, possibly-concurrent economic-calendar integration effort, but no `apps/backend/src/providers/jblanked.ts` (or similar) adapter exists in this repo yet — rather than build one here and risk clashing with that other effort, `f5-ism-services`/`f5-ism-manufacturing` stay `UNAVAILABLE` (`NO_SOURCE`) pending that integration. |
| `fomcCalendar` | F3/F13 — structured FOMC calendar | federalreserve.gov appears HTML/PDF only; no feed confirmed. |
| `releaseCalendars` | F13 — structured BLS/BEA release schedules | Static release-schedule pages exist; no API confirmed. |

Smoke test any of them (e.g. `npm run provider:test -- ism`) to see this
reported honestly rather than silently absent.

---

## PHASE D — research

### 13. Tavily / GDELT

- **Tavily** — F13/cross-family news research.
  - Account required: Yes (free tier: 1,000 credits/month, no card).
  - API key required: Yes, format `tvly-...`.
  - Env var: `TAVILY_API_KEY`.
  - Obtain access: tavily.com
  - Smoke test: `npm run provider:test -- tavily`
  - What a PASS looks like: `AUTH: PASS`, `CAPABILITY: SEARCH: one live query — PASS`, plus a second capability line reporting whether the `published_date` field is present on real results (this was unconfirmed in research — the smoke test actively checks it on a live response).
  - Common safe errors: `authentication rejected`.
- **GDELT** — F13/exogenous news, cross-family research.
  - Status: Already operational, no key, no action needed.
  - Smoke test: `npm run provider:test -- gdelt`
  - What a PASS looks like: `CAPABILITY: QUERY: gold (artlist) — PASS`, a real recent article title as `SAMPLE VALUE`.
  - Note: no published numeric rate limit — GDELT only documents defensive throttling on its own clusters; a transient empty result is not necessarily a bug.

---

## PHASE E — intelligence

The adapters below (`apps/backend/src/providers/{openai,anthropic,gemini,tavily}.ts`)
are **connectivity checks only** (`models.list()`/one cheap search) — they
are never called by the running app outside of an explicit
`npm run provider:test -- <id>` invocation.

A **separate** set of adapters
(`apps/backend/src/intelligence/providers/{openaiLlmProvider,anthropicLlmProvider,geminiLlmProvider}.ts`)
DOES wire these same three providers into real KPI-intelligence generation
for a small, deliberate 5-KPI pilot (`realIntelligencePilot.ts`) plus real
Tavily-backed research (`research/realCoordinator.ts`) — but only when
`DATA_MODE=REAL`. `DATA_MODE=MOCK` (current setting, by explicit user
choice — see "Current runtime status" above) is an unconditional block on
all of it; every KPI outside the 5-KPI pilot always uses the mock generator
regardless of `DATA_MODE`. The ensemble's `ModelRoleIdentity { provider,
model, promptVersion }` mock role configuration
(`apps/backend/src/intelligence/ensemble/policies.ts`) is unchanged.

### 14. OpenAI

- **API key required:** Yes.
- **Env var:** `OPENAI_API_KEY`.
- **Obtain access:** platform.openai.com
- **Smoke test:** `npm run provider:test -- openai`
- **What a PASS looks like:** `CAPABILITY: models.list() — PASS`, a model count/id as `SAMPLE VALUE`. `models.list()` is metadata-only — no generation tokens billed.

### 15. Anthropic

- **API key required:** Yes.
- **Env var:** `ANTHROPIC_API_KEY`.
- **Obtain access:** console.anthropic.com
- **Smoke test:** `npm run provider:test -- anthropic`
- **What a PASS looks like:** same shape as OpenAI above.

### 16. Gemini

- **API key required:** Yes (`GEMINI_API_KEY` and/or `GOOGLE_API_KEY` — if both are set, `GOOGLE_API_KEY` wins per Google's current guidance).
- **Env var:** `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).
- **Obtain access:** aistudio.google.com
- **SDK:** `@google/genai` (the current unified SDK — NOT the deprecated `@google/generative-ai`).
- **Smoke test:** `npm run provider:test -- gemini`
- **What a PASS looks like:** same shape as OpenAI/Anthropic above.

---

## F6 / DXY strategy — now LIVE via Yahoo Finance (DIRECT_DXY)

**Yahoo-DXY pass: DXY is now sourced DIRECTLY, not reconstructed.**
`apps/backend/src/providers/dxy/strategy.ts` defines a `DxyStrategy` type
(`"DIRECT_DXY" | "RECONSTRUCTED_DXY"`) and now locks `DIRECT_DXY` as
canonical/active. The actual live fetch happens in
`apps/backend/src/providers/yahooFinance.ts` (client) and
`apps/backend/src/real/f6Currency.ts` (KPI wiring) — Yahoo Finance's public,
**unofficial/undocumented** chart endpoint
(`https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=1mo&interval=1d`,
no auth), symbol `DX-Y.NYB`. Live-verified this pass: the response's
`meta.longName`/`shortName` correctly read "US Dollar Index" / "ICE US
Dollar Index", and the returned level was cross-checked against an
independent source — genuine, correctly-labeled current data, not a
mismatched or stale instrument. `meta.regularMarketPrice` supplies the
current level; the parallel `timestamp`/`indicators.quote[0].close` history
array (returned in the SAME call) supplies both "Today %" (vs the most
recent prior daily close) and "5D %" (vs the close 5 trading sessions back)
— no second call needed. `sourceTag: "YAHOO_FINANCE_UNOFFICIAL"`,
`provenance: "observed"` (a direct reading, not derived). **No fallback on
failure** — if the Yahoo fetch fails for any reason, all 4 F6 KPIs
(`f6-dxy-recon-level`, `f6-dxy-recon-today`, `f6-dxy-recon-5d`,
`f6-usd-state`) go `UNAVAILABLE`; there is deliberately no silent revert to
the old reconstruction formula.

**The six-FX-leg `RECONSTRUCTED_DXY` reconstruction is now deprecated and
inactive**, kept only as unused reference code
(`buildF6OverridesReconstructedDeprecated` in `f6Currency.ts`) — the prior
pass's formula (`DXY = 50.14348112 × EURUSD^(-0.576) × USDJPY^(0.136) ×
GBPUSD^(-0.119) × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)`, all 6
legs from FRED: `DEXUSEU`, `DEXJPUS`, `DEXUSUK`, `DEXCAUS`, `DEXSDUS`,
`DEXSZUS`) was mathematically valid and live-verified in its own pass, but
is superseded now that a validated direct source exists. It is NOT deleted
in case the Yahoo feed needs to be dropped later — if it is ever reactivated
as a live source again, it must go back with `provenance: "derived"` and
`proxyFor: "ICE DXY"` (see the `proxyFor` field on `CanonicalKpi`), never
`provenance: "observed"`, since it would again be a computed stand-in for
the real index rather than a direct reading of it.

KPI ids are unchanged (`f6-dxy-recon-level` etc.) despite no longer being a
reconstruction — see the top-of-file comment in `f6Currency.ts` for why the
rename was deliberately not carried through every cross-referencing file
this pass. The `dxy` smoke test entry (`npm run provider:test -- dxy`)
still reports strategy metadata only, unchanged — it has never performed
the live fetch itself; that lives in `yahooFinance.ts`/`f6Currency.ts`, used
by the actual snapshot path.

## F7 / MOVE — confirmed still `UNAVAILABLE`, now with a Yahoo-specific reason

Re-checked this pass as part of validating Yahoo Finance for DXY: Yahoo's
same chart endpoint also carries a `^MOVE` symbol. Its price series is
plausibly genuine (numerically cross-checked against an independent
source), but its `meta.longName`/`shortName` are confirmed WRONG — they
return an unrelated "Northern Trust iBoxx" product name, a genuine Yahoo
data-quality defect on that one symbol. Per the product owner's explicit
rule ("if validation is doubtful, leave UNAVAILABLE"), `^MOVE` is
deliberately NOT wired — `f7-move`/`f7-move-1d` stay `UNAVAILABLE`
(`unavailableReason: "NO_SOURCE"`). See the top-of-file comment in
`apps/backend/src/real/f7Risk.ts`. Revisit only if a cleaner source is
found, or Yahoo fixes this symbol's metadata and it can be re-validated
with more confidence.

The terminal's **Chart** workspace is intentionally separate from that
canonical F7 decision-data contract. Its solo lane uses public TradingView
symbols that were runtime-tested in the embedded Advanced Chart: Capital.com
DXY/VIX CFDs, OANDA 2Y/10Y bond CFDs, and FRED GVZ. The OANDA charts are
explicitly labeled as bond-CFD **prices**, not Treasury yields. MOVE and
2s10s remain terminal-native because the public TradingView widget refuses
MOVE redistribution.

The comparison lane uses daily backend series: Yahoo `GC=F` gold futures and
`DX-Y.NYB`/`^MOVE` (all visibly flagged unofficial), official Treasury 2Y/10Y
par yields, and FRED `DFII10`/`GVZCLS`/`VIXCLS`. `GC=F` is chart-only context:
it does not restore F1 or feed any canonical KPI. Each curve is independently
rebased to 0% at its first available observation, without interpolation. A
provider failure remains visible per series and never triggers a synthetic or
hidden substitute.

---

## Summary table

| Phase | # | Provider | Key required | Status this milestone |
|---|---|---|---|---|
| A | 1 | IG | — | **Removed, stays removed** — F1 (Gold) does not exist in this product; do not reintroduce without a new product-owner decision |
| B | 2 | Treasury | No | **Operational now** — QRA (Quarterly Refunding) borrowing estimates now REAL too (this pass) |
| B | 3 | FRED | Yes | Adapter implemented, `NOT_CONFIGURED` until key supplied |
| B | 4 | BLS | Optional | **Operational now** (works unauthenticated) |
| B | 5 | BEA | Yes | Adapter implemented; PCE table id `NEEDS_VALIDATION` even once configured |
| B | 6 | NY Fed | No | **Operational now** |
| B | 6 | Fed Board H.15 | No | **Operational now** |
| C | 7 | Massive | Yes | Adapter implemented; ZQ coverage `NEEDS_VALIDATION` even once configured |
| C | 7a | CME FedWatch (unofficial) | No | **Operational now** for the meeting distribution only — free but UNOFFICIAL/undocumented endpoint, may break without notice; repricing stays UNAVAILABLE (retention window too short) |
| C | 8 | CFTC | No | **Operational now** — includes the 156-week percentile (Milestone 2C) |
| C | 8a | SPDR GLD (`spdrGld`) | No | **Operational now** (this pass) — GLD physical holdings/delta via the historical-archive XLSX |
| C | 9 | Treasury Fiscal Data | No | Same as #2 |
| C | 10 | Goldhub/WGC | — | **Removed** — F12 no longer exists (see top-of-file note) |
| C | 11 | Atlanta Fed (GDPNow) | — | Not a separate adapter — use FRED's `GDPNOW` |
| C | 12 | ISM / MOVE / GVZ / FOMC calendar / release calendars | — | `NEEDS_RESEARCH` placeholders |
| D | 13 | Tavily | Yes | Adapter implemented, `NOT_CONFIGURED` until key supplied |
| D | 13 | GDELT | No | **Operational now** |
| E | 14 | OpenAI | Yes | Connectivity check only, `NOT_CONFIGURED` until key supplied |
| E | 15 | Anthropic | Yes | Connectivity check only, `NOT_CONFIGURED` until key supplied |
| E | 16 | Gemini | Yes | Connectivity check only, `NOT_CONFIGURED` until key supplied |
| — | — | DXY strategy | No | **Live** — `DIRECT_DXY` via Yahoo Finance's unofficial chart endpoint, symbol `DX-Y.NYB` (`apps/backend/src/providers/yahooFinance.ts` / `apps/backend/src/real/f6Currency.ts`); the prior `RECONSTRUCTED_DXY` (6 FRED FX legs) is deprecated/inactive, kept unused for reference |
| — | 17 | JBlanked (F13 calendar) | Yes | Adapter/ingestion job fully implemented; **currently blocked** — the configured key returns a billing/credits rejection on every calendar endpoint (see section below) |

## F13 / Economic Calendar (JBlanked)

**Endpoint (mql5 source only, deliberately — see `apps/backend/src/providers/jblanked.ts`'s top-of-file comment for why one source, not three):**

```text
GET https://www.jblanked.com/news/api/mql5/calendar/range/?from=YYYY-MM-DD&to=YYYY-MM-DD&currency=USD
Authorization: Api-Key <JBLANKED_API_KEY>
```

**Live status (2026-09-01):** the real key in `apps/backend/.env` was tried
against THREE calendar endpoints — `/calendar/range/`, `/calendar/week/`,
and `/calendar/today/` — each returning HTTP 401 with the identical body:
`{"message":"This endpoint requires credits, and you currently do not have
any. You can purchase some at https://www.jblanked.com/api/billing/"}`. This
is a billing/quota rejection, not an invalid-key rejection (the key is
recognized) — the adapter surfaces this as a distinct `QUOTA_EXCEEDED` error
code (see `JblankedApiErrorCode`), separate from `AUTH_REJECTED`. No
calendar data could be retrieved this pass as a result; `macro_events` has
zero JBlanked-sourced rows until this account has usable credits/quota, and
F13's cockpit face + `/api/calendar/*` routes correctly render
empty/UNAVAILABLE in the meantime (never a mock fallback — see
`apps/backend/src/real/f13Calendar.ts`).

**Timezone finding:** the milestone asked for a live check of JBlanked's
`Date` field against a known release (US Initial Jobless Claims, 08:30
America/New_York Thursdays) — blocked by the billing rejection above before
any data was retrieved. In its place, `apps/backend/src/real/f13EventTypes.ts`
documents the best available evidence: JBlanked's own official client
library (`github.com/jblanked/JB-News`) ships the same inline comment across
every language binding — `offset` parameter, `"GMT-3 = 0, GMT = 3, EST = 7,
PST = 10"` — meaning the API's native (no-offset) return value is already
GMT-3 (UTC-3). `JBLANKED_SOURCE_UTC_OFFSET_HOURS = -3` is set from that
evidence and used to convert every ingested event to true UTC at ingestion
time; `macro_events.original_timezone` stores
`"JBLANKED_RAW_UTC-3_UNVERIFIED_LIVE"` so this can be audited and re-verified
the moment the account has usable quota — see that constant's doc comment
for the exact re-verification procedure (one call, comparing a real Claims
release's raw `Date` against 08:30 ET).

**Once credits/quota are available**, no code changes are needed — the next
`/api/market/snapshot` or `/api/calendar/week` request will trigger
`runF13CalendarIngestion()` (guarded by `ingestion_state`, job key
`jblanked:calendar`) automatically.
