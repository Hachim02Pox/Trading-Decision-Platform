# Manual Gold edge-check runner

This is a narrow falsification workflow, not a Sunday Read or an intermediate
recap. The runner searches only material fundamental information after the
returned `source_window_start`. It must follow the canonical manual edge-check
protocol in `gold-market-story-brain`; lack of evidence is not confirmation.

All runner endpoints require `X-Internal-Ingest-Secret`. This secret is never
sent to the browser, logged, or placed in a request body.

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

{"worker_id":"chatgpt-work-gold","result":{"document_type":"GOLD_EDGE_CHECK_RESULT","frontend_eligible":true,"check_id":"<check_id>","request_id":"<request_id>","base_run_id":"<base_run_id>","base_content_hash":"<hash>","started_at":"2026-01-01T00:00:00Z","completed_at":"2026-01-01T00:02:00Z","source_window_start":"2026-01-01T00:00:00Z","source_window_end":"2026-01-01T00:02:00Z","inherited_edge":"NO_EDGE","result":"EDGE_UNCHANGED","material_change_detected":false,"materiality_explanation":"No qualifying post-cutoff fact was established.","thesis_components_tested":[],"triggered_invalidations":[],"new_material_facts":[],"non_material_items_ignored":[],"critical_unknowns":[],"sources":[],"full_intermediate_recap_required":false,"expires_when_base_state_changes":true}}
```

The service rejects mismatched lineage, invalid chronology, unrecognised fields,
illegal status changes, or a contradictory second completion. A byte-for-byte
equivalent result is idempotent. Never manufacture `EDGE_UNCHANGED` after a
runner/source failure.

4. Report an honest operational failure instead:

```http
POST /api/internal/gold/edge-checks/<check_id>/failure
X-Internal-Ingest-Secret: <secret>
Content-Type: application/json

{"worker_id":"chatgpt-work-gold","code":"SOURCE_UNAVAILABLE","message":"Required primary source was unavailable."}
```

Failure text must be short, structured, non-sensitive, and must not contain
secrets, stack traces, private reasoning, or a market verdict.
