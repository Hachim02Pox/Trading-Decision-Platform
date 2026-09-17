# Gold V3 / Intermediate Recap Integration

> Documents the integration of the continuous-recap protocol (Sunday Read V3
> + intermediate recaps) from `Hachim02Pox/gold-market-story-brain` into this
> repository. This is an **additive** integration: the pre-existing Sunday
> Read pipeline (`apps/backend/src/sundayRead/**`, `public.sunday_reads`,
> `GET /api/sunday-read*`) is untouched and keeps working exactly as before.
> This document describes what was added alongside it.

## 1. Architecture

```
ChatGPT Work  --writes/validates-->  Google Drive
                                        │
                    "Gold Sunday Read Output" folder (GOLD_OUTPUT_FOLDER_ID)
                                        │  read-only, service account
                                        ▼
                      Railway backend — goldMarketState/ingestion/**
                                        │  validate (schema.ts) + lineage-tip select
                                        ▼
                         Postgres: public.gold_market_states
                                        │
                                        ▼
                    GET /api/gold/read/current | /history | /:runId
                                        │
                                        ▼
                               Frontend — /sunday-read page
```

Refresh is made immediate by a second, independent path:

```
ChatGPT Work --GitHub MCP--> runtime/gold-refresh-trigger.json (commit/push)
                                        │
                 .github/workflows/gold-state-refresh.yml (on: push)
                                        │  POST + X-Internal-Ingest-Secret
                                        ▼
                       POST /internal/gold/refresh (Railway)
                                        │  re-reads Drive immediately, reselects
                                        ▼
                                (same DB/selection as above)
```

The push-trigger path is a convenience, not the only way data ever appears:
`GET /api/gold/read/current` itself self-heals on a stale/missing cache (see
§5) — a failed or never-fired GitHub Action does not hide new data forever.

Google Drive's **"Gold Sunday Read Control"** folder
(`NEXT_GOLD_RECAP.json`, ChatGPT Work's own operational handoff state) is
never read by Railway and never granted beyond what the service account
already has — see `GOLD_NEXT_RECAP_HANDOFF_SPEC.md`.

## 2. Backend

### 2.1 Schema (`apps/backend/src/sundayRead/schema.ts`)

`FinalRead` (the one canonical document type, shared by V1/V2/V3 Sunday
Reads and V3 intermediate recaps) was **extended, not replaced** — every new
field is optional, so every historical document remains valid:

- `meta.document_type`, `meta.frontend_eligible`, `meta.run_type`
  (`SUNDAY`/`INTERMEDIATE`), `meta.parent_run_id`,
  `meta.origin_sunday_run_id`, `meta.evidence_cutoff_start/end`;
- top-level `direction_state`, `family_audit`, `scenario_transitions`,
  `consumed_handoff_id`, `handoff_version`, `handoff_content_hash`;
- `presentation.version` now accepts `2 | 3`; V3 adds
  `direction_state`/`scenario_tree_v3` per locale.

`validateFinalRead()` gained, purely additively:

- a V3 audit: `direction_state` + `scenario_tree_v3` required in both
  locales when `presentation.version === 3`; **zero** raw
  `[[GLOSSARY_ID|text]]` markup anywhere in V3 copy (not merely
  "unresolved" — forbidden outright); **zero** literal scenario node/edge
  IDs leaking into human-facing copy (recursive scan, skips structured
  reference fields like `node_id`/`node_refs`/`glossary_refs`);
- a lineage audit: when `meta.run_type` is set, full lineage metadata,
  `document_type === "GOLD_MARKET_STATE"`, `frontend_eligible === true`,
  and a top-level `direction_state` with valid enum values are all required.

### 2.2 Drive → DB pipeline (`apps/backend/src/goldMarketState/`)

- `ingestion/driveClient.ts` — reuses the existing Google service-account
  credentials (`GOOGLE_SERVICE_ACCOUNT_EMAIL`/`_PRIVATE_KEY`); reads only
  `GOLD_OUTPUT_FOLDER_ID` (defaults to `GOOGLE_DRIVE_FOLDER_ID`, i.e. the
  already-shared Output folder — no new Drive sharing step needed).
- `ingestion/discovery.ts` — recognizes `sunday_read_YYYY-MM-DD.json` and
  `gold_intermediate_YYYY-MM-DD_NN.json`; explicitly excludes
  `NEXT_GOLD_RECAP*`, `*HANDOFF*`, `RUN_REPORT_*`, `VALIDATION_REPORT_*` as
  defense-in-depth (the folder split is the primary safeguard). Every JSON
  file is its own candidate — unlike the legacy pipeline, candidates are
  **not** grouped by calendar date (several intermediates can share a week).
- `ingestion/ingest.ts` — download → parse → `validateFinalRead` → data_mode
  (`REAL` only) → eligibility gate (a `meta.run_type` document must be an
  explicit `frontend_eligible` `GOLD_MARKET_STATE`; a legacy document is
  grandfathered in only under the Sunday filename) → insert → publish.
  Idempotent by `(run_id, content_hash)`. A single bad candidate is
  `REJECTED` and never blocks the rest of the poll; a Drive/DB-layer failure
  fails the whole job but never touches already-`PUBLISHED` rows.
- `selection.ts` — **pure**, dependency-free lineage-tip selection (fully
  unit-tested without a DB, see `tests/gold-market-state-selection.test.ts`).
  Groups published documents by `origin_sunday_run_id`; within each lineage,
  the "tip" is the document no other document in that lineage names as its
  `parent_run_id`; "current" is the tip with the latest
  `evidence_cutoff_end` (falling back to `generated_at`, then `as_of`) across
  all lineages. Never uses Drive `modifiedTime`, filename, or array order.
  `frontend_eligible === false` and any non-`GOLD_MARKET_STATE` document
  (including a stray handoff-shaped one) are excluded before selection even
  runs.
- `store.ts` — the cache/TTL layer every `GET /api/gold/read/*` route uses
  (see §5).

### 2.3 Database (`apps/backend/src/db/migrations/009_gold_market_states.sql`)

New table `public.gold_market_states` — additive, independent of
`public.sunday_reads`. Unlike `sunday_reads` (one row per `run_date`, later
runs *supersede* earlier ones), every row here is identified by its own
document `run_id` and, once `PUBLISHED`, is **immutable and permanent** —
"current" is a `SELECT` (the lineage-tip algorithm above), never an
`UPDATE`. This directly matches the spec's requirement that a Sunday Read
and every intermediate recap remain permanently available. Applied to the
production Supabase database as part of this integration.

### 2.4 API routes (`apps/backend/src/server.ts`)

All additive — no existing route's behavior changed.

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/gold/read/current` | public | `{ run: FinalRead, meta: {...,freshness,cache_age_seconds} }` — the current lineage-tip state. |
| `GET /api/gold/read/history` | public | `{ history: [...] }` — lightweight metadata for every eligible published state, newest first, `is_current` flagged. |
| `GET /api/gold/read/:runId` | public | One specific historical state by its `run_id` (same eligibility gate as selection — a rejected/ineligible/handoff-shaped row can never be fetched this way either). |
| `POST /internal/gold/refresh` | `X-Internal-Ingest-Secret` (reuses `INTERNAL_INGEST_SECRET`, same middleware as every other internal route) | Forces an immediate Drive re-sync + reselect; idempotent; returns only `{status, run_id, document_type, run_type, as_of, generated_at, matched_expected_run_id, candidates_considered}` — never Drive credentials or a full document. |

### 2.5 Cache / freshness (`goldMarketState/store.ts`)

In-process cache, TTL `GOLD_READ_CACHE_TTL_SECONDS` (default 180s). On
expiry, a GET request triggers a best-effort Drive re-sync; **regardless of
whether that re-sync succeeds**, the current lineage-tip is recomputed from
the DB (already-published rows are untouched by a Drive failure) — the last
known-good state is never dropped, only its `meta.freshness` label changes:
`FRESH` (just re-synced successfully) / `CACHED` (within TTL) /
`CACHED_DRIVE_ERROR` (re-sync failed, serving the last good DB state). A
single-flight guard prevents concurrent requests from triggering redundant
Drive calls during a stale window.

## 3. Frontend (`apps/frontend/src/app/sunday-read/`)

- `lib/api/goldReadClient.ts` — new client for the three `GET` routes above.
  `lib/api/sundayReadClient.ts` (legacy) is untouched.
- `page.tsx`: now fetches, in priority order, `?runId=` (new API, any
  historical state) → `?date=` (legacy API, preserves old bookmarked links
  unchanged) → current (new unified API, default). Adds:
  - a badge distinguishing **"Analyse hebdomadaire — Sunday Read"** from
    **"Mise à jour intermédiaire"** (with its position number when
    derivable from history, and its America/New_York localized
    date/time — `Intl.DateTimeFormat` with `timeZone: "America/New_York"`);
  - lineage links (origin Sunday, immediate parent state);
  - a collapsible history panel (`GET /api/gold/read/history`);
  - a **"What changed since the last analysis"** section for intermediates
    only, built directly from `family_audit` (F1–F6 status chips) and
    `scenario_transitions` — never a client-side diff;
  - a **Direction / asymmetry / edge** block rendering
    `macro_direction`, `directional_asymmetry`, `positioning_asymmetry` and
    `edge` as four **separate** fields (V3 presentation display copy when
    available, otherwise a plain enum fallback) — they are never merged
    into one sentence, satisfying "a bearish direction can coexist with
    NO_EDGE."
  - a `CACHED_DRIVE_ERROR` freshness notice when applicable.
- `presentation.version === 3` is accepted everywhere the page already
  handled `=== 2` — the V3 locale object is a strict superset of V2's shape,
  so `market_story`/`horizons`/`priced_in`/`asymmetry`/`walkthrough` render
  unchanged for V3 documents automatically.
- `scenario_tree_v3` (V3's standalone node/edge display copy) is adapted, in
  `page.tsx`, into the exact `{nodes,edges}` shape
  `components/sundayRead/ScenarioTree.tsx` already accepts for V2's
  `presentation.scenario_tree` — no structural rewrite of the diagram
  component was needed. `ScenarioTree.tsx` gained optional
  `why_it_matters`/`confirmation_needed`/`display_status`/`display_category`
  rendering in the node detail drawer (additive, V2 unaffected).
- No internal node/edge IDs or `[[...]]` tokens are ever rendered — this was
  already true of the existing `GlossaryText`/`ScenarioTree` components and
  is now additionally enforced server-side by the V3 schema audit (§2.1).

## 4. `runtime/gold-refresh-trigger.json` + GitHub Action

See `runtime/README.md` for the full field-by-field format. Summary: a
tiny, secret-free JSON file ChatGPT Work updates via GitHub MCP after a
validated, Drive-read-back-confirmed publish. Its push triggers
`.github/workflows/gold-state-refresh.yml`, which validates the file,
`POST`s to `/internal/gold/refresh` with retries/timeout, verifies the
returned `run_id` matches the trigger's `market_state_run_id` when set,
and writes a secret-free summary to the workflow run. `concurrency` ensures
two refreshes never race. Reuses the existing `GOLD_TERMINAL_BACKEND_URL`
and `INTERNAL_INGEST_SECRET` repository secrets — **no new GitHub secret was
introduced**, to match this repository's existing convention (all four
prior internal-trigger workflows already share these two).

## 5. Tests

- `tests/gold-market-state-schema.test.ts` — V3 validation: historical V1/V2
  accepted, V3 Sunday/intermediate fixtures accepted, missing lineage
  rejected, `frontend_eligible: false` rejected, wrong `document_type`
  rejected, raw `[[...]]` markup rejected outright, leaked internal IDs
  rejected, missing `scenario_tree_v3` rejected, the `NEXT_GOLD_RECAP.json`
  handoff shape itself rejected as a market state.
- `tests/gold-market-state-selection.test.ts` — pure lineage-tip selection:
  an intermediate supersedes its Sunday; selection ignores array/insertion
  order and depends only on `evidence_cutoff_end`/`generated_at`;
  `frontend_eligible: false` and wrong-`document_type` candidates are
  ignored even when "newest"; a branching lineage resolves deterministically
  and logs the losing branch; history is newest-first with `is_current`
  correctly flagged.
- `tests/gold-market-state-ingestion.test.ts` — discovery (always runs) plus
  an end-to-end Drive→DB pipeline test against the real Supabase Postgres
  (skips cleanly when `DB` isn't configured, same convention as the
  pre-existing `tests/sunday-read-ingestion.test.ts`): eligibility gate,
  idempotency, and Drive-failure isolation.
- Fixtures under `tests/fixtures/gold/` are copied verbatim from the
  canonical `Hachim02Pox/gold-market-story-brain` repository
  (`tests/fixtures/FIXTURE_*.json`, `schema/minimal_v2_example.json`) — no
  fabricated market data was introduced beyond what that repository already
  ships as its own no-real-evidence fixtures.

All 275+ existing tests continue to pass unchanged; `npm run typecheck` and
`npm run build` (backend + frontend) both succeed.

## 6. Deployment / configuration checklist

**Railway environment** — nothing is strictly required beyond what is
already configured (`GOLD_OUTPUT_FOLDER_ID` defaults to
`GOOGLE_DRIVE_FOLDER_ID`); optionally set:

- `GOLD_OUTPUT_FOLDER_ID` — only if the Output folder is ever split from the
  legacy one (`1otzXd6sEBAaMn_dh-DmMxoiszs4_7aVm` per the mission brief).
- `GOLD_READ_CACHE_TTL_SECONDS` — only to change the 180s default.

**Never** set `GOLD_CONTROL_FOLDER_ID` / `NEXT_GOLD_RECAP_FILE_ID` on
Railway — no code path reads them; they are documented in `.env.example`
purely for completeness.

**GitHub repository secrets** — already present and reused as-is:
`GOLD_TERMINAL_BACKEND_URL`, `INTERNAL_INGEST_SECRET`. No new secret needed.

**Google Drive permissions** — unchanged: the existing service account
(`GOOGLE_SERVICE_ACCOUNT_EMAIL`) already has Viewer access to the "Gold
Sunday Read Output" folder for the legacy pipeline; that is sufficient for
this integration too. It must **not** be granted access to the "Gold Sunday
Read Control" folder for this backend's purposes.

**Database migration** — `009_gold_market_states.sql` was applied to the
production Supabase database as part of this change (`npm run db:migrate`).
