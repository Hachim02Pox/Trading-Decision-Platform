# Global Read rebuild — architecture decision record

Authority: `global_read_rebuild_spec/global_read_rebuild_spec`, read sequentially on
2026-09-05. This record supersedes the earlier sequential planner/challenger proposal.

## Decision record (before implementation)

Scope: Global Read and its strictly necessary evidence, execution and UI support.
Existing family calculations, F10 methodology and chart workspace remain unchanged.

**Old:** two symmetric web-enabled CLI agents, text context, self-reported verification,
three mandatory horizons, self-rated confidence, concatenated narratives and a 20-minute cache.
**Problems confirmed in code:** no evidence registry, no backend source adjudication,
no causal time boundary, no reaction-reference instrument, no cache dependency invalidation.
The old asymmetry combiner even selected the *first* caution ordering item rather than
the most cautious item. The obsolete path will not make new decisions.

## CURRENT

The legacy path calls two agents and concatenates prose and horizon votes. The partial v2
path verifies some facts but then runs a planner followed by one challenger. It has no
complete family output, question-by-question debate, scenario transitions or update-first
memory. Its JSON-heavy UI is incompatible with the human output specification.

## GAPS

- verification does not cover every terminal family;
- the two analyses are not independent and do not each perform the complete framework;
- no cross-examination, convergence classification or evidence-based opinion change;
- scenario records are not stateful and have no previous-run transition;
- no family-by-family model is shown before cross-family synthesis;
- the main UI exposes audit internals and lacks the prescribed progressive sections.

## TARGET

One deterministic orchestrator executes: snapshot and previous-state load → claim-specific
verification → two independent full analyses in parallel → cross-examination in parallel →
bounded reply only for material disputes → final web scan → deterministic validation and
synthesis → append-only state save. Facts, interpretations, hypotheses and decisions are
separate contract fields. No factor score or model confidence can produce readiness.

## LLM ROLES

Analyst A and Analyst B receive the same admitted evidence, family manifest, framework and
previous state, but never each other's output. Each analyses all families, explores the web,
answers the 18 questions and proposes scenarios. During debate, each sees the other's answers
and must mark each material point ACCEPT, CONTEST or UNRESOLVED with a reason and a concrete
change-of-mind proof. Agent identity remains audit-only. A/B agreement never upgrades data.

## STATE MODEL

Every report points to `previousRunId`, stores `whatChanged`, data changes, scenario
transitions and a versioned scenario tree. An update compares snapshots and evaluates existing
triggers/invalidation before creating branches. No material change preserves scenario identity
and avoids rewriting the narrative. The database remains append-only; latest-state reads are
ordered by `as_of`, never inferred from the browser cache.

## DATA VERIFICATION

All family observations enter an evidence registry with metric definition, unit, period,
instrument, observation/publication/retrieval timestamps, cadence, freshness and vintage.
Authority is selected by claim type. Official correction is run-local and preserves the
terminal value. Non-comparable instruments/periods/units and future vintages are rejected.
Decision-critical unknowns block dependent conclusions.

## WEB

`VERIFY` is a closed claim check against an allowed authority. `EXPLORE` happens independently
inside each analyst and may create facts only after backend verification. `FINAL_SCAN` runs
after debate for fresh catalysts, objections and expectations. Every fetched URL is re-fetched
through the backend SSRF-safe allowlist; model prose and popularity remain non-facts.

## DEBATE

Independent round, cross-examination round, then at most one reply for a material dispute.
Stop after that. Result is CONVERGED, PARTIALLY_CONVERGED, UNRESOLVED or ONE_SIDE_INVALIDATED.
Unresolved disagreement becomes a visible branch and a resolver, never forced consensus.

## OUTPUT

The primary UI follows the eight sections in the specification and begins update runs with
what changed. Raw JSON, IDs, agent labels, hashes and traces are restricted to an audit drawer.
The operational language is context-only: CONSIDER SUPPORTIVE/ADVERSE SETUPS, WAIT FOR TRIGGER,
or NO CLEAN EDGE. The user retains technical setup, entry, stop, size and risk decisions.

## LATENCY

Verification is cached by exact observation/vintage; independent and debate calls run in
parallel; calls are bounded and never auto-retried. Timings are recorded per verification,
family analysis, web exploration, debate, final scan, synthesis and total. No business timeout,
freshness, event guard or price-response threshold is invented: undefined policy is surfaced.

**Verification:** identity/units/period/vintage first, claim-specific authority next,
independent corroboration recorded separately. A fresh primary re-fetch can correct a
terminal value *for this run*, with both values retained; it never overwrites the KPI DB.
Unknown metrics, unparsed options claims, prose-derived prices and unsupported sources
remain inadmissible. A quote match proves the source contains the quote, not the causal
inference or the completeness/latestness of that source.

**Readiness:** OPPORTUNITY means only a coherent macro environment for the trader's own
setup. WATCH requires a concrete recoverable resolver. Permanent missing requirements,
invalidated central evidence or unsupported asymmetry produce NO_OPPORTUNITY, not eternal
WATCH. Optional missing observations do not veto an otherwise complete core. A trap needs
both established extension and a valid favourable-news failure test; a percentile alone
does not qualify. No voting, numerical confidence, mandatory horizons, entries or stops.

**Undefined rather than invented:** execution-reference instrument, reaction window,
materiality, event guard duration, report maximum age and capture cadence. Data collection
is not turned on merely because a family lacks local history. Existing Yahoo history is
an unofficial observation source, not automatically an execution-quality GC/XAU feed.

**Trade-offs and risks:** backend source identity and field verification are stronger
than URL prose, but are not economic causality. Limited primary parsers deliberately
reduce eligible claims; honest missing publication vintages reduce retrospective coverage.
An unavailable CLI, missing policy or evidence conflict is surfaced, never silently
replaced. Actual predictive usefulness must be tested on *all* eligible technical setups,
not just trades taken. No claim of profitability follows from this implementation.

Implementation details, measured probes, tests and limitations are appended after verification.

## FINAL IMPLEMENTATION REPORT (A-O)

### A. Before / after

Before, Global Read relied on a sequential planner/challenger interpretation whose output could
hide missing provenance and did not implement the complete rebuild protocol. It now performs a
deterministic verification pass before interpretation, two independent full analyses, bounded
cross-examination, an optional single reply, final web verification, state comparison and a
progressive human report. The former pipeline remains historical code only; the active version is
`global-read-rebuild-1.0.0`.

### B. Files changed for this pass

- Contracts: `packages/contracts/src/globalRead.ts`, `packages/contracts/src/index.ts`.
- Orchestration: `apps/backend/src/intelligence/globalRead/rebuildPipeline.ts`,
  `rebuildPrompts.ts`, `rebuildSchema.ts`, `scenarioMemory.ts`, `globalReadAnalysis.ts`.
- Evidence/data: `evidence.ts`, `snapshot.ts`, `primaryData.ts`, `calendar.ts`, `priceTest.ts`,
  `method.ts`, `thesis.ts`, `safeFetch.ts`.
- CLI isolation: `apps/backend/src/providers/globalReadSecureCli.ts`.
- Persistence/configuration: `apps/backend/src/db/globalReadRuns.ts`,
  `apps/backend/src/db/migrations/003_global_read_runs.sql`, `apps/backend/.env.example`.
- UI: `apps/frontend/src/components/market/GlobalReadDecisionReport.tsx`,
  `GlobalReadSection.tsx`, `GlobalReadSection.module.css`,
  `apps/frontend/src/hooks/useGlobalReadAnalysis.ts`.
- Verification: `tests/globalReadEvidence.test.ts`, `globalReadRebuild.test.ts`,
  `globalReadRebuildPipeline.test.ts`, `globalReadSafeFetch.test.ts`,
  `globalReadSecureCli.test.ts`, `globalReadThesis.test.ts`, `globalReadTiming.test.ts`,
  `globalReadUx.test.ts`, `scripts/global-read-primary-probe.ts`,
  `scripts/global-read-recoverability.ts`.

### C. Data and verification

All 69 currently mapped KPI observations receive explicit provenance, cadence, timestamps,
freshness and verification state. Claim authority is metric-specific; a primary source outranks a
secondary one without voting. Stale, non-comparable, look-ahead, conflicting and unknown evidence
is rejected or visibly downgraded. F3 market-implied facts are admitted only for the two exact
registered Investing.com fields and are never presented as CME or Federal Reserve data. Backend web
fetching enforces HTTPS, an exact host allowlist, public DNS resolution, redirect refusal, content
and size limits, timeouts and exact quote matching.

### D. Family engine

Each run covers F2 through F13 as eleven independent families (F2 Rates, F3 Fed, F4 Inflation,
F5 Employment/Growth, F6 USD, F7 Risk, F8 Liquidity, F9 Treasury, F10 Positioning/Flows,
F11 Options, F12 Structural, F13 Calendar). Each analysis must return the required structured
assessment for all eleven families and answer the eighteen ordered decision questions. Missing or
invalid families make the model output invalid rather than silently shortening the read.

### E. Synthesis and operational decision

Synthesis is deterministic and does not average agents or invent confidence. It preserves supported
agreement, labels unresolved alternatives and keeps facts, interpretation, hypotheses and thesis
separate. OPPORTUNITY additionally requires admitted expectation, repricing and transmission
evidence, a converged directional thesis, a complete calendar check, a confirming price test and a
completed final scan. Otherwise the result is WATCH only when a concrete recoverable resolver
exists, or NO CLEAN EDGE / NO_OPPORTUNITY.

### F. Web passes

Research requests are separated into VERIFY, EXPLORE and FINAL phases. Only actual CLI web-tool
events enter the audit trace. Every proposed factual quote is re-fetched by the backend verifier;
unverified web prose remains a hypothesis and cannot become a core fact.

### G. Debate protocol

Analysis A and B run independently and in parallel with identical admitted evidence and no access
to each other's answer. Each then cross-examines the other question by question with
ACCEPT/CONTEST/UNRESOLVED outcomes. A single parallel reply occurs only for material disputes;
the pipeline stops after it. Unresolved disagreement is retained with its evidence resolver.

### H. Stateful rebuild

Runs are append-only in `global_read_runs`. A rebuild loads only the latest compatible prior state,
compares evidence status/value/vintage, lists data changes and new official catalysts, and carries
scenario identity through NO_CHANGE, NEW_BRANCH, TRIGGERED and INVALIDATED transitions.
Invalidation never silently flips into the opposite scenario.

### I. Bias and asymmetry

Directional bias and exploitability are distinct outputs. Price/flow validation happens after the
macro thesis. Scenario trigger, weakening and invalidation conditions reference real admitted facts;
undefined business thresholds remain undefined. No entry, stop, sizing instruction or profitability
claim is generated.

### J. Human interface

The main report uses the required eight-section progressive structure, starts updates with “what
changed”, localizes family labels and timestamps, retains prior interpretation during cooldowns,
and exposes loading changes through an ARIA live region. Agent labels, raw IDs, hashes, traces and
JSON are confined to the secondary audit drawer. Historical reports are forced to NO CLEAN EDGE.

### K. Tests and coverage

Final automated result: **163 passed, 0 failed**. The complete workspace production build and
TypeScript checks pass, including 21 generated Next.js routes. Scoped Global Read coverage is
70.51% statements/lines, 74.27% branches and 83.23% functions. The active rebuild orchestrator is
93.77% covered by statements/lines, but the complete scope remains below the required 80% line
threshold because legacy pipeline, primary live parsers, calendar and network paths are only
partially exercised.

### L. Measured timings and live probe

A successful primary probe observed 69 facts, 15 admitted, with snapshot collection around 1.62 s
and verification around 0.31 s. A later rate-limited probe still produced 69 explicit facts but only
8 admitted, with snapshot collection around 1.35 s and verification around 0.25 s. The variation is
material and is not hidden: FRED returned HTTP 403 and BLS HTTP 429 during the later probe.

### M. Known limitations

- The real seven-call subscription orchestration was not executed, so no Claude/Codex credits were
  consumed and end-to-end model behavior remains unproven.
- Live primary coverage is unstable under current FRED/BLS access limits; the latest probe admitted
  only eight observations.
- Complete official-calendar coverage, detailed Gold options/volatility/hedging evidence and exact
  historical first-release vintages are not yet available.
- F10's deterministic trap extension is not integrated into this rebuild; trap status therefore
  remains NOT_ESTABLISHED unless its complete evidence test exists elsewhere.
- Broad web opinions can only remain hypotheses. Exact quote presence does not prove causality or
  source completeness.
- Execution-reference symbol, reaction window, materiality, event guard and report-age policies are
  intentionally blank until the owner defines them; the price gate blocks rather than guessing.
- The costly endpoint has an in-process running lock but no same-snapshot cooldown and no
  user-authenticated quota layer; deployment beyond a personal local terminal requires one.
- Dependency audit reports three moderate advisories (`qs` and the `uuid` path through `exceljs`);
  no high or critical advisory was found. The suggested `exceljs` force fix is breaking and was not
  applied.

### N. Required configuration

Configure `GLOBAL_READ_REFERENCE_SYMBOL`, `GLOBAL_READ_REACTION_WINDOW_SECONDS`,
`GLOBAL_READ_MATERIALITY_PCT`, `GLOBAL_READ_MAX_BAR_DISTANCE_SECONDS`,
`GLOBAL_READ_EVENT_GUARD_SECONDS`, `GLOBAL_READ_MAX_REPORT_AGE_SECONDS` and
`GLOBAL_READ_ACCEPT_UNOFFICIAL_REFERENCE` only from an approved business/data policy. Claude must
remain authenticated through `claude.ai`; Codex must have a valid subscription login. No API-key
fallback is used.

### O. Final verdict

**NOT READY FOR SHADOW TESTING.** The implementation and build are complete, but the acceptance bar
is intentionally not waived. Readiness requires: a successful non-trading end-to-end subscription
run, stable/admissible live core evidence and official calendar coverage, configured price-response
policy, full F10/options requirements where claimed, and at least 80% line coverage for the scoped
Global Read implementation. Until then the terminal must display NO CLEAN EDGE when those gates are
missing.

## FINAL OPERATIONAL PASS — 2026-09-06 (A–O)

### A. What changed

The active engine is now `global-read-rebuild-1.1.0`. This pass did not rebuild the architecture.
It added explicit run-local provenance, structured pre-debate self-audits, structured post-debate
audits, an anti-false-consensus gate, and a separate exploitability gate.

### B. Data fallback

- Terminal value present: it is checked against the registered authoritative web source and retains
  `TERMINAL_VERIFIED` provenance when it matches.
- Terminal value contradicted by a comparable primary observation: the primary value is admitted
  run-locally as `TERMINAL_CORRECTED`; terminal storage is not overwritten.
- Terminal value absent: an authoritative structured observation can be admitted as
  `WEB_ONLY_VERIFIED`; the rest of the analysis continues.
- Comparable authoritative observations conflict: `WEB_ONLY_CONFLICTED`, no value is admitted.
- No authority establishes the claim: `UNVERIFIED`/`UNAVAILABLE`; unrelated drivers still continue.

### C. Source verification

Claim-specific authority remains deterministic. BEA/BLS/Treasury/CFTC/SPDR observations outrank
secondary repetition for their registered official metrics. Comparable identity, timestamp,
period, unit, instrument, vintage, freshness and information cutoff are checked before admission.

### D. Provenance

Each admission now carries a compact provenance state while retaining the complete source URL,
source type, observation/publication availability, retrieval time, vintage and supporting raw
observations in audit data.

### E. Self-audit

Each independent analysis must return `selfAudit` inside its existing analysis call. It records
KEEP/REVISE/REMOVE checks, actual revisions and remaining risks covering unverified facts,
level/change confusion, causality, hindsight, recency, double-counting, invented flows/thresholds
and alternatives. A removed thesis or remaining material risk cannot pass readiness.

### F. Debate

Question-by-question cross-examination remains bounded. Backend synthesis rejects `CONVERGED` when
the agents merely ACCEPT without admitted evidence or label their convergence reasoning-only.
Disagreement remains unresolved with a resolver.

### G. Post-debate audit

The existing debate/reply calls now include `postDebateAudit`: thesis survival, convergence basis,
weakened/unsupported premises, strongest alternative, dangerous gap and concrete resolver. This
adds the requested reasoning discipline without increasing the seven-call ceiling.

### H. Readiness

OPPORTUNITY still requires a directional thesis, evidence-backed convergence, complete admitted
causal chain, verified calendar, confirming price test and completed final scan. It now also
requires clean pre/post audits and favorable evidence-backed exploitability. Recoverable gaps may
produce WATCH; unsupported core logic produces NO CLEAN EDGE / NO_OPPORTUNITY.

### I. Asymmetry

Direction is no longer sufficient even in the rebuild pipeline. Both analyses must separately
establish favorable positioning/marginal-flow exploitability using admitted references. Extended
or unfavorable positioning, absent marginal flow, or unclear evidence blocks OPPORTUNITY.

### J. Human report

The eight-section report remains intact. Important admitted facts are now shown as compact
`definition: value (source)` lines. Web recovery is explicit as
`(web-only: source; terminal source unavailable)`. Raw metadata stays in the audit drawer.

### K. Tests

`npm test`: **167 passed, 0 failed**. New tests cover terminal-versus-web provenance, primary
authority over repeated secondary claims, explicit web-only display, false model consensus and
direction without exploitable positioning.

### L. Build / typecheck / coverage

`npm run typecheck` and `npm run build` pass; Next.js generated 21 routes. Scoped Global Read
coverage is **71.29% lines/statements, 76.16% branches, 83.23% functions**. The active rebuild
pipeline is **93.60% lines/statements**. The complete Global Read scope remains below the required
80% line threshold, primarily in live parsers/network paths and the legacy pipeline.

### M. Real end-to-end run

No paid/subscription seven-call model run was launched, so no Claude/Codex credits were consumed.
A real primary-data probe did run: 69 facts, 14 VERIFIED, 1 CORRECTED, 44 UNVERIFIED and 10
UNAVAILABLE; snapshot 3393 ms and verification 467 ms. Fifteen facts were admitted across rates,
inflation, employment, COT and GLD.

### N. Remaining blockers

- FRED/BLS instability: **PARTIAL**. It no longer kills unrelated analysis and authoritative
  web-derived observations receive explicit provenance; not every missing metric has a registered
  structured alternative.
- Price-response policy: **STILL BLOCKING OPPORTUNITY**. No arbitrary symbol/window/materiality was invented.
- F10: **PARTIAL**. COT/GLD were live-admitted and exploitability is wired; the complete deterministic
  trap test is still not integrated here.
- Options: **PARTIAL, not globally required**. Unavailable options remain unknown and do not veto a
  driver that does not depend on them.
- Real seven-call run: **STILL BLOCKING**.
- Coverage ≥80% for the whole scoped implementation: **STILL BLOCKING** (71.29%).
- Calendar completeness and owner-approved event/report-age policies: **STILL BLOCKING where required**.
- Dependency audit: three moderate advisories remain (`qs`, and `uuid` through `exceljs`); no
  high/critical advisory. A breaking forced downgrade was not applied.

### O. Final verdict

**NOT READY FOR SHADOW TESTING.** The operational logic is materially safer and more available:
API failure no longer means global abandonment, provenance is human-visible, self-audits are
machine-enforced, agreement is not treated as evidence, and direction is not treated as
exploitability. The remaining acceptance blockers are real: no seven-call E2E evidence, incomplete
policy configuration/calendar guarantees, partial F10 trap coverage, and 71.29% scoped line
coverage. Until those are resolved, missing gates must continue to yield NO CLEAN EDGE.

## DELTA POST-GLOBAL_READ_V2 — AUDIT MATRIX (2026-09-06)

| Rule | Current status | File / function | Gap found | Change made |
|---|---|---|---|---|
| A. Web-only fallback | YES for registered authoritative metrics; PARTIAL for unmapped metrics | `primaryData.ts:verifyPrimaryFacts`, `evidence.ts:admitEvidence` | Provenance was not explicit in the original implementation | Run-local `WEB_ONLY_VERIFIED`; no KPI DB write; explicit reason and test |
| B. Terminal data verification | YES | `rebuildPipeline.ts:buildGlobalReadRebuildDecision`, `evidence.ts:admitEvidence` | None after the prior pass | Terminal facts are verified before either analyst; primary correction/conflict retained |
| C. Provider failure isolation | YES when another registered authority recovers the exact fact | `primaryData.ts:verifyPrimaryFacts` (`Promise.allSettled`), rebuild pipeline | Missing explicit pipeline regression test | Added simulated terminal-provider failure + Treasury recovery test; both analyses continue |
| D. Pre-debate self-audit | YES | `rebuildPrompts.ts:buildAnalysisPrompt`, `rebuildSchema.ts:parseIndependentAnalysis` | None after the prior pass | Structured KEEP/REVISE/REMOVE inside existing analysis calls; no extra calls |
| E. Post-debate self-audit | YES | `rebuildPrompts.ts:buildReplyPrompt`, `rebuildSchema.ts:parseDebateReview`, `rebuildPipeline.ts` | Human synthesis could still repeat a rejected pre-debate thesis | Rejected central synthesis is withheld; final thesis becomes UNCLEAR and alternatives remain visible |
| F. False consensus | YES | `rebuildPipeline.ts:evidencedAgreement` | None after the prior pass | ACCEPT without admitted evidence or evidence-based post-audit stays UNRESOLVED |
| G. Direction ≠ exploitability | YES | `GlobalReadIndependentAnalysis.exploitability`, rebuild readiness gates | None after the prior pass | Favorable, admitted positioning/flow evidence is independently required for OPPORTUNITY |
| H. Human provenance | YES | `GlobalReadDecisionReport.tsx:sourceLabel/formatFactValue` | Unit omitted from compact fact line | Human line now shows localized value, unit, source and explicit web-only wording; raw JSON remains audit-only |

The active method version after this delta is `global-read-rebuild-1.2.0`.

### Delta verification

- Full test suite: **168 passed, 0 failed**.
- Typecheck: **PASS**.
- Production build: **PASS**, including 21 Next.js routes.
- Scoped coverage: **71.36% lines/statements, 76.69% branches, 83.23% functions**.
- Active rebuild pipeline: **93.67% lines/statements**.
- Real seven-call subscription run: not repeated; no Claude/Codex credits consumed.

### Delta verdict

**NOT READY FOR SHADOW TESTING.** Rules B, D, E, F, G and H are now complete in the active
implementation. Rules A/C are complete for registered authoritative metrics and safely partial for
unmapped metrics: the system never invents an unregistered fallback. Remaining acceptance blockers
are the real seven-call E2E run, complete scoped coverage above 80%, owner-approved price-response
policy, and complete calendar/F10 trap evidence where the selected driver depends on them.

## DELTA MANUAL FRESHNESS, BROAD SCAN & CAUSAL MAP (2026-09-06)

This pass implements the precise operating rules agreed for a manual Global Read. The active
method version is now `global-read-rebuild-1.3.0`.

### What a new manual run does

1. A click starts a fresh fetch and a fresh interpreted run. There is no same-snapshot cooldown.
   The only refusal is a duplicate click while a run is already in progress.
2. Terminal observations are checked against registered authoritative public observations. The
   initial check is value/freshness first; identity, cadence, vintage and revision investigation is
   reserved for a disagreement.
3. If the terminal observation is old or unavailable and a newer authoritative public observation
   exists, the newer observation is admitted only for this run as `WEB_ONLY_VERIFIED`. It never
   silently rewrites terminal KPI storage.
4. Prompts explicitly prohibit LLM arithmetic. Agents may read a source that states
   actual/consensus/previous or an established backend result, but may not calculate surprise,
   spread, delta, threshold or causal result themselves.
5. Each independent analysis performs a structured self-audit and then a separate broad,
   recent and forward-looking Gold web sanity scan before either agent sees the other’s view. The
   scan asks what the data set or first thesis may have missed, current narratives, alternative
   explanations and forthcoming catalysts. An auditable live-search trace is required.
6. A forum, trader comment or general article is a discovery lead, not proof. A factual claim
   discovered there must be supported by an admissible stronger source before it can support the
   synthesis.
7. Only then can the two-agent A/B debate, reply cycle and final objection scan run. A single
   available agent completes the same data, analysis, self-audit, broad-scan and final-scan path
   without a fabricated debate; the resulting report explicitly says it is unilateral. If neither
   agent is available, the run explains that no interpreted read can be produced.

### Scenarios and the interactive map

Scenarios are now dynamic (one to eight, always including `BASE`) rather than forced into three
preselected branches. The report also carries a deterministic, structured causal graph: family
signals feed the marginal driver, which branches into scenarios. Nodes and edges preserve stable
identifiers and show whether they are new, unchanged, strengthened, weakened, invalidated or
unresolved versus the previous Global Read. The terminal exposes this in an optional French
interactive map; clicking a node reveals its evidence references. It is data-driven UI, not an
image or model-generated diagram.

### Verification

- `npm test`: **173 passed, 0 failed**.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**; Next.js generated 21 routes.
- `git diff --check`: **PASS**.
- Scoped Global Read coverage: **73.32% lines/statements, 77.10% branches, 83.52% functions**.
  The rebuilt pipeline itself is **94.40% lines/statements**. The broad historical scope remains
  below the project 80% target, mainly in live network/parser paths not covered by this pass.

### Explicit remaining work

The release does not claim implementation of policies that still need a concrete data-method
definition: XAUUSD/GC reaction methodology and adaptive materiality, the 24h/15h event guard and
30-minute post-release refresh, optional manual technical-context annotations, and a fully
registered secondary-source admission policy for every source suggested in discovery. No paid
Claude/Codex end-to-end run was launched in this pass, so real subscription CLI behavior remains
to be exercised manually before any shadow-trading claim.

## DELTA XAUUSD REACTION & EVENT RISK POLICY (2026-09-06)

The local Global Read method is now configured in `apps/backend/.env` and documented in
`.env.example` as follows:

- `XAUUSD=X` is the price-reaction reference; it is visibly retained as an accepted **unofficial
  Yahoo reference**, never a causal proof, execution feed or entry signal.
- The reaction window is 30 minutes. Bar closure is inferred from actual chart spacing rather than
  assuming every bar is one minute.
- Materiality is deterministic and adaptive: p80 of absolute completed 30-minute changes drawn
  from the last 20 available trading dates before the release. If the required distribution is not
  available, the result remains `INCONCLUSIVE`; no threshold is invented.
- A verified official event is a visible warning in the next 24 hours. It removes `OPPORTUNITY`
  in the final 15 hours before release, and for the first 30 minutes after release. A fresh manual
  run then refetches and reassesses the information set.

Verification for this delta: `npm test` **177 passed, 0 failed**; `npm run typecheck` **PASS**;
`npm run build` **PASS** (21 Next.js routes). No subscription model run or external deployment was
performed.
