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

1. validated against `sunday_read.schema.json` / the V3 presentation audit, and
2. read back from Google Drive to confirm the write persisted.

Never before both of those succeed. Work updates the file in place via
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
