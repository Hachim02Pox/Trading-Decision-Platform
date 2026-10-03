# `runtime/gold-refresh-trigger.json`

Technical trigger file for the Gold market-state refresh pipeline. Its only
purpose is to produce a Git commit/push that starts
`.github/workflows/gold-state-refresh.yml`, which in turn calls the Railway
backend's `POST /internal/gold/refresh` route to make a newly-published Drive
state visible immediately (see
`docs/GOLD_V3_INTERMEDIATE_RECAP_INTEGRATION.md` for the full architecture).

This file is **never**:

- a report or analysis;
- a source of truth (Google Drive is);
- a place for secrets, signed URLs, or credentials;
- read directly by the frontend or by Railway at request time.

## Who writes it, and when

ChatGPT Work updates this file **only after** a Sunday Read or intermediate
recap has been:

1. validated against the applicable Brain schema and semantic checks (v6
   editorial + learning experience at `da8eb64959b6c026128bde254c8d1703e419f19c`),
2. published as four immutable Output files and read back with matching hashes,
3. sealed in an immutable Control completion receipt, with its handoff
   generation/validation recorded in protocol order, and
4. completed the handoff/manual-plan steps required by the Brain protocol.

Never before the required publication/sealing steps succeed. `completed_at`
reflects the attested completion, not the start of research. Work updates the file in place via
GitHub MCP (read the current SHA, then commit a new version) — it never
creates a second file or renames this one.

## Fields

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | integer | Always `1` for this format. |
| `event` | string | `"INITIALIZED"` (initial/placeholder state, never actually processed) or `"MARKET_STATE_PUBLISHED"` (a real Sunday Read or intermediate recap was just validated and written to Drive). |
| `market_state_run_id` | string \| null | The document's own `meta.run_id` — must match what the backend reports back after refresh. |
| `document_type` | string \| null | Always `"GOLD_MARKET_STATE"` for a real event. |
| `drive_file_name` | string \| null | The Drive filename (e.g. `sunday_read_2026-09-14.json` or `gold_intermediate_2026-09-16_01.json`) — informational/audit only, never trusted for validation. |
| `completed_at` | string \| null | ISO-8601 UTC timestamp of when the run finished and was confirmed on Drive. |
| `content_hash` | string \| null | SHA-256 of the published JSON file's exact bytes — lets the workflow build an idempotency key and lets a human audit which exact upload triggered a given workflow run. |

## What actually decides "current"

This file is advisory/informational only. Railway independently re-reads
Google Drive, validates every candidate against the schema, and applies its
own lineage-based selection (see `goldMarketState/selection.ts`) — it never
trusts `market_state_run_id`/`content_hash` from this file as ground truth.
The workflow uses them only to build an idempotency key and to sanity-check
that the backend's response matches what was expected.

## Enriched ingestion and compatibility wake-up

The backend validates the complete v6 document and learning extension, the
strict pinned completion schema, chronological phase/readback evidence,
the canonical market-state hash and all four Output files against sealed
hashes. JSON uses Brain canonical SHA; text reports use exact UTF-8 bytes.
The human Markdown must equal `content_preview.markdown` exactly.

All discovered candidates are sorted by their actual parent identity before
ingestion; no 40-file truncation hides an older parent or caps intermediates.
Published rows remain immutable. Contract/seal/missing-parent/Markdown rejects
can be retried for that same immutable content; permanent gate failures remain
rejected. A missing receipt or snapshot has no permissive fallback.
For intermediates, the consumed handoff must match its retained Control/archive
snapshot by identity, version and canonical SHA, plus the parent receipt.
The current operational handoff is never substituted for that snapshot.
Keep the consumed versions in readable Control archives; if no exact copy was
retained, ingestion is blocked until that genuine snapshot is restored.

`sunday-read-ingest.yml` now calls `/internal/gold/refresh`, the same enriched
pipeline as the push-trigger workflow. Its old route remains available for
legacy callers but is not the learning ingestion path. The obsolete 14 September
one-time Monday cron/guard has been removed. The recurring Sunday wake-up does
not schedule research; an intermediate can be ingested immediately after sealing.

`gold-state-refresh.yml` already handles `workflow_dispatch` separately: an
optional operator-provided `expected_run_id`, otherwise no expected run/hash.
It never inherits a previous push trigger's run. No runtime trigger or Work
schedule was changed by the learning UI integration. CLOSED remains closed;
neither refresh route writes Control or dispatches analysis.

## Actual TTL behavior and production evidence

`getCurrentGoldReadSnapshot` performs a best-effort Drive sync only on a current
or history read when its in-process cache is absent/expired (default 180 seconds,
`GOLD_READ_CACHE_TTL_SECONDS`). Cache hits do not poll Drive. A refresh performs
the sync immediately, then recomputes DB selection. Drive failure keeps published
DB state and returns a degraded freshness status. By-run reads use DB directly.
This is request-driven recovery, not a timer or a guaranteed publication latency.
Several pending children are ordered parent-first on the next poll; missing
receipts/snapshots stay rejected. Fresh HTTP/DB cache never renews market validity.

Local tests do not attest deployed Drive grants, database ingestion or live
rendering. To verify a real already-sealed publication after deployment, manually
dispatch Gold market-state refresh with that real `expected_run_id`, verify the
Action's returned selected identity, then inspect authenticated current/history/
by-run content and the published cutoff in the terminal. Do not publish fixtures,
rerun market analysis, reactivate Work, or update a trigger merely to test UI.

## Separate manual results: explicitly blocked contract boundary

At the pinned Brain SHA, `GOLD_MANUAL_PRETRADE_CHECK_PROTOCOL.md` defines result
minimums in prose, but there is no `GOLD_MANUAL_THESIS_CHECK_RESULT` schema or
complete-result validator. `gold_manual_check_plan.schema.json` validates the
prepared plan only; the learning validator validates an optional extension only.
Field spellings/structures for verdict, covered checks, scan, source-plan linkage,
dates and separate consequences are not a sufficiently verifiable full result
contract. An inferred parser would invent a contract, so no manual-result API or
fake reader is enabled. Existing archived results are preserved in Control.

Unblocking requires a normative result envelope and full validator, source/plan/
receipt verification rules, plus confirmed read permission for the backend to
the exact `Control/manual_checks` folder. The eventual reader must preserve
`frontend_eligible: false`, source-cutoff inheritance and MANUAL_DELTA coverage,
leave source scenario topology intact and never enter Output/current/history
selection or the MARKET_STATE_PUBLISHED trigger. A plan or GOLD_EDGE_CHECK_RESULT
cannot stand in for a manual thesis-check result.

## Example after a real event

```json
{
  "schema_version": 1,
  "event": "MARKET_STATE_PUBLISHED",
  "market_state_run_id": "r-2026-09-14-sunday",
  "document_type": "GOLD_MARKET_STATE",
  "drive_file_name": "sunday_read_2026-09-14.json",
  "completed_at": "2026-09-14T16:32:00Z",
  "content_hash": "9f2c...ab41"
}
```
