# Manual Gold edge-check runner

This is a narrow falsification workflow, not a Sunday Read or an intermediate
recap. The runner searches only material fundamental information after the
returned `source_window_start`. It must follow the canonical manual edge-check
protocol in `gold-market-story-brain`; lack of evidence is not confirmation.

All runner endpoints require `X-Internal-Ingest-Secret`. This secret is never
sent to the browser, logged, or placed in a request body.

## Built-in Railway worker

The backend now wakes an in-process, single-flight worker immediately after a
durable request is created, and once at backend startup for queued or expired
leases. It still claims through Postgres with `FOR UPDATE SKIP LOCKED`; the
single-flight guard is only an optimisation, never the distributed lock. The
protected recovery endpoint is `POST /api/internal/gold/edge-checks/wake`.

Each click performs at most five targeted Tavily basic/news searches (three
results each), one Groq structured analysis plus at most one bounded JSON
repair using the same corpus. Source excerpts are capped at 700 characters;
the total run is aborted before five minutes, the lease is 270 seconds and is
renewed every minute. The existing `TAVILY2_API_KEY` 429/432 fallback is used
by the shared Tavily provider. The application retains its 60-second
per-holder cooldown and does not expose provider credentials to the frontend.

1. Claim work atomically:

```http
POST /api/internal/gold/edge-checks/claim
X-Internal-Ingest-Secret: <secret>
Content-Type: application/json

{"worker_id":"chatgpt-work-gold","lease_seconds":300}
```

`204` means no eligible job. A successful response contains the private base
context, cutoff, inherited direction/asymmetries/edge, invalidations and the
result contract. Do not expose it in a user-facing surface. A lease-expired
`RUNNING` job can be claimed by another worker; `FOR UPDATE SKIP LOCKED`
prevents simultaneous claims.

2. Renew before the lease expires:

```http
POST /api/internal/gold/edge-checks/<check_id>/lease
X-Internal-Ingest-Secret: <secret>
Content-Type: application/json

{"worker_id":"chatgpt-work-gold","lease_seconds":300}
```

3. Submit exactly one canonical `GOLD_EDGE_CHECK_RESULT` under `result`:

```http
POST /api/internal/gold/edge-checks/<check_id>/result
X-Internal-Ingest-Secret: <secret>
Content-Type: application/json

{"worker_id":"chatgpt-work-gold","result":{"document_type":"GOLD_EDGE_CHECK_RESULT","frontend_eligible":true,"check_id":"<check_id>","request_id":"<request_id>","base_run_id":"<base_run_id>","base_content_hash":"<hash>","checked_at":"2026-01-01T00:02:00Z","source_window_start":"2026-01-01T00:00:00Z","source_window_end":"2026-01-01T00:02:00Z","inherited_edge":"NO_EDGE","verdict":"NO_GAME_CHANGER","game_changer":null,"core_premise_affected":null,"causal_transmission":null,"verified_sources":[],"ordinary_market_context":"ordinary market moves observed, without a verified fundamental break","full_intermediate_recap_required":false,"operational_decision":"EDGE_REMAINS_VALID","expires_when_base_state_changes":true}}
```

The service rejects mismatched lineage, invalid chronology, unrecognised fields,
illegal status changes, or a contradictory second completion. A byte-for-byte
equivalent result is idempotent. `GAME_CHANGER_DETECTED` requires NEW,
VERIFIED, CORE_PREMISE_LINK and CAUSAL_BREAK evidence and suspends the edge for
a full review; ordinary market moves never satisfy that test. Never manufacture
`NO_GAME_CHANGER` after a runner/source failure.

4. Report an honest operational failure instead:

```http
POST /api/internal/gold/edge-checks/<check_id>/failure
X-Internal-Ingest-Secret: <secret>
Content-Type: application/json

{"worker_id":"chatgpt-work-gold","code":"SOURCE_UNAVAILABLE","message":"Required primary source was unavailable."}
```

Failure text must be short, structured, non-sensitive, and must not contain
secrets, stack traces, private reasoning, or a market verdict.
