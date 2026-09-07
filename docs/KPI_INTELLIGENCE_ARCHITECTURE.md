# KPI Intelligence Architecture (Milestone 1C + 1D)

This is the authoritative reference for the per-KPI intelligence system
introduced in Milestone 1C: what each type means, why the mechanical/
contextual split works the way it does, how sessions are identified, how
research evidence is deduplicated and stored, and where the safety
boundaries are. Write new code against this document, not against chat
history. It supersedes nothing in `docs/MVP_COCKPIT_CONTRACT.md` except
the color-system note, which that file now points back here for.

**Milestone 1D** extends this architecture with three additions,
documented in their own sections below: (16) bilingual EN/FR output,
(17) the deterministic-text vs. dynamic-AI-text boundary stated
explicitly, (18) `mechanicalRelationship` vs. `finalGoldRead` (the
Milestone 1C `displayRelationship` field, renamed), and (19) the
multi-model ensemble architecture (analysts, challenger, adjudicator).
Sections 1-15 below are Milestone 1C's original content, updated in place
wherever a 1D field rename or addition touches them.

**A later refinement pass** (semantic correction, not a redesign) adds
three more sections and fixes a real gap found in Milestone 1D: (20) makes
the static/deterministic vs. dynamic/AI-generated boundary **explicit and
authoritative** (superseding the informal §17 list below with the
canonical two-category list), and separates data freshness from
interpretation freshness into a three-timestamp model
(`dataAsOf`/`interpretationAnalyzedAt`/`evidenceLatestPublishedAt`,
`analyzedAt` renamed); (21) the "previous interpretation is context, not
anchor" rule and its `previousReadSummary`/`whatChangedSincePreviousRead`/
`currentRead` fields; (22) closes the French-translation gap this same
pass discovered: §19's "Language note" previously said the ensemble audit
trail (`AnalystConclusion`, `ChallengeFinding`, `adjudicatorNotes`) was
*intentionally* English-only regardless of `?lang=` — that decision is
reversed here, and §19 is updated in place to describe the fix rather than
the old (now incorrect) behavior.

**Scope boundary:** this document describes the *automatic, per-KPI*
system only — one `KpiInterpretation` per cockpit-visible KPI, generated
at startup (deep/event KPIs lazily on first request). It does **not**
describe, and has no relationship to, a later manual, global
`[ INTERPRET MARKET ]` feature that has not been built yet. Do not
conflate the two when planning future milestones.

**MOCK MODE ONLY, this milestone.** Every interpretation, every research
claim, and every session's data is produced by deterministic mock logic
in `apps/backend/src/intelligence/`. No real LLM, search/research API, IG,
FRED, BLS, or MySQL integration exists yet. See "The mock/real safety
gate" below.

---

## 1. Type model

All wire types live in `packages/contracts/src/index.ts`. Backend-internal
types (context packages, dependency maps, research pipeline internals)
deliberately do NOT live there — they are implementation detail the
frontend never needs to know about.

### 1.1 Epistemic primitives

```ts
type EpistemicStatus = "FACT" | "INFERENCE" | "HYPOTHESIS" | "UNKNOWN";

interface EpistemicClaim {
  statement: string;
  status: EpistemicStatus;
}
```

`EpistemicClaim` is the unit of a `causalChain` step: every step of "why
this KPI reads the way it does" is individually tagged as an observed
fact, a reasoned inference from facts, a plausible-but-unconfirmed
hypothesis, or an explicit admission of not knowing. The frontend renders
this tag visibly next to every causal-chain step — never collapses it into
plain prose — so a reader can tell "the Fed cut rates" (FACT) apart from
"this will likely support Gold for the next week" (HYPOTHESIS) at a
glance.

`AuthorityClass` classifies a research source's institutional standing:

```ts
type AuthorityClass =
  | "OFFICIAL_STATISTICS"  // e.g. BLS, BEA
  | "CENTRAL_BANK"         // e.g. the Federal Reserve
  | "GOVERNMENT"           // e.g. U.S. Treasury
  | "WIRE_SERVICE"         // e.g. Reuters, AP, Bloomberg
  | "FINANCIAL_MEDIA"      // e.g. WSJ, FT, CNBC
  | "RESEARCH_DESK"        // e.g. an exchange or industry research desk
  | "OTHER";
```

### 1.2 `ClaimRecord` and `ResearchRun`

```ts
type VerificationState = "VERIFIED" | "CORROBORATED" | "UNVERIFIED_DISCOVERY" | "DISPUTED";
type EvidenceState = "STRONG" | "MODERATE" | "LIMITED" | "CONFLICTED";

interface ClaimRecord {
  id: string;
  claim: string;
  epistemicStatus: EpistemicStatus;
  source: { name: string; url: string | null; authorityClass: AuthorityClass; publishedAt: string | null };
  retrievedAt: string;
  verificationState: VerificationState;
  corroboratingIndependentSources: number;
  associatedKpiIds: string[];
}

interface ResearchRun {
  sessionId: string;
  runAt: string;
  evidenceById: Record<string, ClaimRecord>;
}
```

A `ClaimRecord` is a single, deduplicated, normalized research finding.
One session has exactly ONE `ResearchRun`, holding every claim discovered
that session in a flat `evidenceById` map. A claim about one CPI release
can be — and in the shipped mock fixtures, is — referenced by several
KPIs' interpretations at once (F4's CPI KPIs, F2's real-yield KPIs, F3's
Fed-pricing KPIs, F6's USD KPIs) via their `*EvidenceIds` arrays, without
ever being duplicated in storage. See §4 for the full pipeline that
produces this store.

### 1.3 `KpiInterpretation` and `KpiInterpretationResponse`

```ts
interface KpiInterpretation {
  kpiId: string;
  familyId: FamilyId;
  interpretationAnalyzedAt: string;      // renamed from analyzedAt, see §20
  dataAsOf: string;
  evidenceLatestPublishedAt: string | null; // see §20
  language: Language;              // "EN" | "FR" — Milestone 1D, see §16
  currentReadShort: string;       // hard cap MAX_SHORT_READ_CHARS (140)
  currentReadDetailed: string;
  previousReadSummary: string | null;         // see §21
  whatChangedSincePreviousRead: string | null; // see §21
  currentRead: string;                         // see §21
  relationshipBasis: RelationshipBasis;
  mechanicalRelationship: GoldRelationshipState | null; // Milestone 1D, see §18
  finalGoldRead: DisplayRelationship;                   // renamed from displayRelationship, see §18
  whyNow: string;
  causalChain: EpistemicClaim[];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  uncertaintyOrUnknowns: string[];
  whatWouldStrengthen: string[];
  whatWouldWeakenOrInvalidate: string[];
  relevantRecentDevelopmentIds: string[];
  researchSourceIds: string[];
  evidenceState: EvidenceState;
  modelIdentity: { provider: string; model: string };
  promptVersion: string;
  isMock: boolean;
  sessionId: string;
  auditTrail: InterpretationAuditTrail; // Milestone 1D, see §19 — debug/audit info only
}

interface KpiInterpretationResponse {
  interpretation: KpiInterpretation;
  evidence: Record<string, ClaimRecord>; // only the *Ids this interpretation actually references, resolved server-side
}
```

`GET /api/intelligence/kpi/:kpiId` accepts `?lang=EN|FR` (default `EN`,
any other/missing value falls back to `EN`) — see §16.

One `KpiInterpretation` exists per KPI — **never** collapsed into a
family-level summary, even though several KPIs in a family will often
share the same underlying research claims. `KpiInterpretationResponse` is
the wire shape for `GET /api/intelligence/kpi/:kpiId`: the backend resolves
only the evidence ids this specific interpretation references out of the
session's full `evidenceById`, so the frontend never has to fetch or filter
the whole store itself.

**Schema-first ban on trade language.** Neither type above, nor any other
type in this milestone, has a field resembling `recommendation`,
`tradeAction`, `buySell`, or `confidencePercent`. See §7.

---

## 2. `relationshipBasis` / `mechanicalRelationship` / `finalGoldRead` — the mechanical/contextual rule

```ts
type RelationshipBasis = "MECHANICAL_RULE" | "CONTEXTUAL_AI";
type DisplayRelationship = "SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL";
```

**Milestone 1D renamed `displayRelationship` to `finalGoldRead`** and added
a new, separate `mechanicalRelationship: GoldRelationshipState | null`
field — see §18 for the full rationale and the "never silently
overwritten" rule. The derivation rule below is otherwise unchanged and
still requires **zero new per-KPI configuration** — it reads directly off
the already-existing canonical `CanonicalKpi.relationship` field
(`"support" | "adverse" | "neutral"`):

- **`relationship !== "neutral"`** (i.e. the canonical fixture already
  asserts `"support"` or `"adverse"`) → `relationshipBasis: "MECHANICAL_RULE"`,
  and `mechanicalRelationship` is copied verbatim from the canonical tag.
  `finalGoldRead` is programmatically derived from that tag —
  `"support"` → `"SUPPORTIVE"`, `"adverse"` → `"ADVERSE"` — in
  `mockInterpretationGenerator.ts`'s `deriveMechanicalDisplayRelationship`,
  and normally mirrors `mechanicalRelationship` exactly. The (mock, for
  now) AI layer only ever writes the *explanatory* fields (`whyNow`,
  `causalChain`, evidence references, caveats) for these KPIs; it never
  invents the color, and it never writes `mechanicalRelationship` itself.
- **`relationship === "neutral"`** → `relationshipBasis: "CONTEXTUAL_AI"`,
  `mechanicalRelationship: null`. `finalGoldRead` comes from the (mock)
  multi-model ensemble's adjudicator step (§19), and **`"CONTEXTUAL"` is a
  fully valid, expected, non-fallback outcome** — not a failure case, not
  "we couldn't decide." In the shipped mock fixtures
  (`MOCK_SCENARIOS` in `mockScenarios.ts`), the large majority of
  contextual-basis KPIs resolve to `"CONTEXTUAL"`, with a deliberate
  handful (documented inline, e.g. `f2-10y`, `f5-payrolls-latest`,
  `f7-hy-oas`, `f8-tga-daily`) resolving to `"SUPPORTIVE"`/`"ADVERSE"` under
  a stated mock scenario, specifically so `"CONTEXTUAL"` never reads as
  "the only thing that ever comes out of this branch."

This is inspectable end to end: the KPI-level drawer view shows
`relationshipBasis` plainly ("Mechanical rule: Adverse" vs. "Contextual AI
read: Contextual") alongside either the canonical `driverSummary`
(mechanical case) or `whyNow` (contextual case), so "why is this
green/red/yellow" is always one click away, never a black box. When
`mechanicalRelationship` and `finalGoldRead` diverge (the rare exception —
see §18), the drawer shows both explicitly: "Mechanical channel: Adverse"
alongside "Final read: Contextual."

---

## 3. `APP_SESSION_ID` — deterministic session identity

Previous milestones considered a heartbeat/timing heuristic to decide
"is this a new run or a hot reload." Milestone 1C replaces that with a
single environment variable set once per real process tree.

- `scripts/with-session-id.js` generates ONE `crypto.randomUUID()` and
  spawns whatever command follows `--` (in practice, `concurrently` running
  both workspaces' dev scripts) with that id set as `APP_SESSION_ID` in the
  child's environment.
- The root `npm run dev` script routes through this wrapper:
  ```json
  "dev": "npm run build:contracts && node scripts/with-session-id.js -- concurrently -n backend,frontend -c blue,magenta \"npm run dev --workspace apps/backend\" \"npm run dev --workspace apps/frontend\""
  ```
- `tsx watch` (the backend's own dev script) only restarts **its own**
  child process on a file save — it does not touch the wrapper or
  `concurrently` that spawned it. Since `APP_SESSION_ID` was set as an
  environment variable on that unbroken process tree, every `tsx watch`
  restart inherits the exact same value. A hot-reloaded backend therefore
  sees an *unchanged* `APP_SESSION_ID`.
- Stopping the whole `npm run dev` process tree and starting it again runs
  `with-session-id.js` fresh, generating a brand new UUID.
- If `apps/backend`'s dev script is run standalone (bypassing the root
  wrapper — e.g. `npm run dev --workspace apps/backend` directly),
  `APP_SESSION_ID` is unset. `apps/backend/src/intelligence/appSessionId.ts`
  detects this, generates a random id on the spot, and logs a one-line
  warning that this workspace wasn't started via the root wrapper — every
  restart of that standalone process will then look like a new session.

`apps/backend/src/intelligence/sessionGuard.ts` implements the actual
guard: it reads `.runtime/session.json` (`{ sessionId,
startupAnalysisCompletedAt }`), creating `.runtime/` if missing. If the
stored `sessionId` equals the current `APP_SESSION_ID`, this is the same
logical session — startup analysis is **not** re-run, and whatever is
cached in `.runtime/interpretations.json` / `.runtime/researchRun.json` is
reused as-is. Otherwise (different id, or no file yet), a new session
starts: the full mock research + interpretation pipeline runs, and the new
session id + timestamp are written back.

This is why the mechanism is "fully deterministic": there is no clock,
no debounce, no "has it been N seconds" heuristic anywhere in the guard —
just an identity comparison against a value whose lifetime is tied
exactly to the real process tree the user actually started.

---

## 4. `.runtime/` — ephemeral, not durable

`.runtime/` (gitignored) holds exactly three files:

- `session.json` — the session guard's own record (§3).
- `interpretations.json` — every KPI's current `KpiInterpretation`, keyed
  by `kpiId`.
- `researchRun.json` — the session's single `ResearchRun` (its
  `evidenceById` map).

**This directory is a temporary session/dev cache, wiped and regenerated
per new `APP_SESSION_ID`. It is explicitly NOT the product's durable
analysis history.** That role belongs to MySQL once persistence is
implemented — not in this milestone, and no MySQL code exists anywhere in
this codebase yet. Do not read `.runtime/` as "the database." Do not add
retention, migration, or backup logic for it — its entire purpose is to be
disposable within a session and cheaply reproducible across sessions
(re-running the mock pipeline is deterministic and instant). When real
persistence is designed, `.runtime/`'s *shape* (one `ResearchRun`, one
interpretations map) is a reasonable starting point for the MySQL schema,
but the file-based store itself should be deleted, not migrated.

---

## 5. Research pipeline (Patch 5)

`apps/backend/src/intelligence/research/` implements the full pipeline as
real, callable, independently-testable-shaped functions — even though this
milestone has no real search provider, so the pipeline runs against a
small set of hand-authored, illustrative `RawSearchResult[]` per topic
(`mockRawResults.ts`). The point is that the *architecture* is provably
correct before any real provider is wired in.

**Pipeline stages, in order** (`coordinator.ts` calls these in sequence
for every topic referenced anywhere in `KPI_CONTEXT_DEPENDENCIES`):

1. **Shared search** (mock) — `MOCK_RAW_RESULTS[topic]` returns a small
   canned `RawSearchResult[]`. Topics with no canned entry return `[]` — a
   legitimate "nothing researched for this topic yet" state, not a bug.
2. **`dedupeResults`** — collapses raw hits that are the same underlying
   result, matched by EITHER (a) a normalized URL (tracking params like
   `utm_*` stripped, host lowercased and `www.`-stripped, path
   normalized) OR (b) `(normalized publisher, normalized headline,
   publishedAt rounded to the hour)`.
3. **`extractClaims`** — turns deduped results into `ClaimRecord`-shaped
   drafts. In mock mode this is a deterministic fixture mapping (headline
   → claim statement, a keyword heuristic → `EpistemicStatus`, publisher →
   `AuthorityClass`), explicitly not real NLP. A real implementation
   replaces only this file's internals.
4. **`dedupeClaims`** — collapses claims whose normalized statement text
   (lowercased, punctuation stripped, whitespace collapsed) matches
   closely, using **Jaccard similarity on word sets** (token overlap ÷
   token union) at a **0.8 threshold**. No embeddings. Tracks every raw
   claim that was merged into the group (`mergedFrom`), which is what
   `corroboration.ts` counts sources over.
5. **`corroboration.ts`** — assigns `verificationState` and
   `corroboratingIndependentSources`:
   - **Independent-source counting / the syndication heuristic:** sources
     sharing the same detected wire-service byline (`byline: "Reuters"`,
     `"AP"`, `"Bloomberg"`, etc.) count as **ONE** underlying source for
     corroboration, no matter how many domains republished that wire
     story. This is a simple byline-normalization dedup key
     (`normalizeSourceKey`) — not real syndication detection. Example: a
     Reuters CPI story picked up verbatim by CNBC still counts as one
     independent source; if Bloomberg's own, independently-worded story
     merges into the same claim group (via step 4's Jaccard match), that
     is a second independent source.
   - `VERIFIED`: exactly one source, but that source is a primary
     authority (`OFFICIAL_STATISTICS` / `CENTRAL_BANK` / `GOVERNMENT`) —
     e.g. the BLS's own CPI release.
   - `CORROBORATED`: **>= 2 genuinely independent sources** (post
     syndication-collapse).
   - `UNVERIFIED_DISCOVERY`: exactly one non-primary source.
   - `DISPUTED`: see §6.
6. **KPI association** — claims are tagged with `associatedKpiIds` via the
   topic → KPI inverse of `KPI_CONTEXT_DEPENDENCIES` (every KPI whose
   `researchTopics` includes this topic gets the claim).
7. **Write into `evidenceById`** — the coordinator assembles one
   `ResearchRun` per session covering every topic in play.

The shipped mock fixtures include a worked "CPI shared across F2/F3/F4/F6"
example: one CPI release, reported by Reuters (and re-published verbatim
on CNBC under the same byline — collapsed to one source), independently
also reported by Bloomberg (a second, distinct source) and the BLS itself
(a primary, `VERIFIED` release) — demonstrating `CORROBORATED` and
`VERIFIED` side by side from one real-world-shaped scenario.

---

## 6. `VerificationState` and `DISPUTED`

```ts
type VerificationState = "VERIFIED" | "CORROBORATED" | "UNVERIFIED_DISCOVERY" | "DISPUTED";
```

`DISPUTED` means the coordinator detected two claims about the same
underlying fact that assert **incompatible** things. Real contradiction
detection is an NLP/LLM problem out of scope for this mock milestone —
rather than fake it with an unreliable keyword heuristic, the coordinator
(which hand-authors the small illustrative claim set) passes explicit
`knownDisputePairs` index pairs into `corroborate()`. **Both conflicting
claims stay in `evidenceById`** — neither is silently dropped — and get
cross-referenced via `contradictingEvidenceIds` on any KPI whose
interpretation cites the disputed topic. The shipped example: one claim
that "Fed officials increasingly convinced labor market is cooling" versus
another that "Fed officials downplay labor cooling, call it noise" — both
retained, both surfaced.

`CORROBORATED` specifically requires the independent-source check from
§5 — multiple republications of one wire story never qualifies on their
own.

---

## 7. Schema validator (primary) vs. keyword guard (secondary)

`apps/backend/src/intelligence/validateInterpretation.ts` is the
**primary** control against trade-language leaking into this system. It:

(a) Checks the object has exactly the allowed key set for
`KpiInterpretation` — anything extra is stripped and logged as an issue.
This matters once real LLM JSON output is involved; today's hand-authored
mock fixtures trivially conform, but the check exists so drift is caught
structurally, not by hoping the author remembered the schema.

(b) Checks every enum field (`relationshipBasis`, `finalGoldRead`,
`mechanicalRelationship`, `language`, `evidenceState`, every
`causalChain[].status`, `auditTrail.policy`, `auditTrail.modelAgreement`,
and — separately, in `isValidVerificationState` — every
`ClaimRecord.verificationState`) is one of its allowed literal values.

(c) Enforces the `currentReadShort` length cap (§8) — truncates (with an
ellipsis) rather than hard-rejecting, so a minor overage degrades
gracefully instead of dropping the whole interpretation.

Only *after* all of the above does a **secondary, best-effort** keyword
guard scan `currentReadShort` / `currentReadDetailed` / `whyNow` for a
short denylist of imperative trade phrases, anchored at sentence-start or
as standalone phrases: `/\b(buy now|sell now|go long now|go short now|
strong buy|strong sell)\b/i` and a `"NN% bullish/bearish"` pattern.
Deliberately **not** a bare `buy`/`sell` word match, so legitimate
defensive phrasing ("this is not a buy signal") never false-positives.

The schema check is the real control; the keyword guard is a cheap,
imperfect backstop layered on top — never rely on it alone.

---

## 8. `ResearchTopicPlan` and recency windows (Patch 8)

`apps/backend/src/intelligence/research/topicPlans.ts` defines
`RESEARCH_TOPIC_PLANS: Record<TopicTag, ResearchTopicPlan>`, one entry per
of the 12 `TopicTag`s, each with plausible mock `queries[]`,
`preferredSourceClasses`, a `recencyWindow` (`"24h" | "7d" | "30d" | "90d"
| "1y"`), and a `maxResults` cap. Fast-moving topics (`CPI_RELEASE`,
`FED_COMMUNICATION`, `TREASURY_SUPPLY`) get short windows (`"24h"`–`"7d"`);
slow-moving structural topics (`PHYSICAL_GOLD_DEMAND`) get long windows
(`"90d"`–`"1y"`). No real search provider consumes these plans yet, but
every mock `ClaimRecord` still carries a real `publishedAt` and
`retrievedAt`, so the recency-prioritization concept is demonstrably wired
end to end, not just declared in a type.

---

## 9. Automatic scope: cockpit-eager, deep/event-lazy (Patch 10) + concurrency limiter

The startup pass generates exactly one `KpiInterpretation` for **every KPI
across every remaining family whose `visibility === "cockpit"`**, computed
programmatically (`computeCockpitVisibleKpiIds` filters
`KPI_FIXTURES` — never a hand-maintained duplicate id list). (F1's former
"Gold cannot be a causal input to itself" exclusion from this set — Patch
12 — is moot now that F1 has been removed from the product entirely; see
§11.) Deep/event-tier KPIs are generated lazily, on first request to `GET
/api/intelligence/kpi/:kpiId` (`bootstrap.ts`'s `getInterpretation`
falls through to `generateInterpretationForKpi` on a cache miss, then
persists the result for the rest of the session).

`apps/backend/src/intelligence/concurrencyLimiter.ts` is a minimal
Promise-based semaphore/queue (`ConcurrencyLimiter`, no new dependency),
with `MAX_CONCURRENT_LLM_CALLS = 4` (`constants.ts`). Every per-KPI
generation call in the eager startup batch is routed through it
(`generateCockpitInterpretations`). Today's mock generation is
synchronous/instant, so the limiter is a structural placeholder — its job
is making sure a future *real* LLM-backed implementation doesn't fire ~30
simultaneous provider calls on boot by default. **The exact concurrency
value and model choice are a later benchmarking decision, not locked by
this milestone.**

Every KPI — cockpit or lazy — gets its own independent context package
(§11) and its own final `KpiInterpretation`. Interpretations are never
collapsed to a family-level summary, even when several KPIs in a family
share research claims.

---

## 10. `MAX_SHORT_READ_CHARS` (Patch 11)

`apps/backend/src/intelligence/constants.ts` exports
`MAX_SHORT_READ_CHARS = 140` — "about one sentence, max ~2 visual lines."
`validateInterpretation.ts` enforces this by truncating (with an ellipsis)
any `currentReadShort` that exceeds it. Every hand-authored mock fixture
in `mockScenarios.ts` (in both EN and FR) is written to genuinely respect
this cap already — the truncation is a safety net for future real-LLM output,
not the intended path for mock fixtures.

---

## 11. (Removed) F1's exemption (Patch 12)

**Historical section — F1 (Gold) was removed from the product entirely**
(see `docs/MVP_COCKPIT_CONTRACT.md`'s top-of-file note), which makes this
section moot: there is no F1 for anything to be exempt from anymore. This
section previously documented that F1's four cockpit KPIs were excluded
from the automatic interpretation set ("Gold cannot be a causal input to
itself") via a `familyId === "F1"` filter in
`computeCockpitVisibleKpiIds`, plus a frontend-only `PriceDirection` glyph
concept for F1's Today/5D/1M cells. Both the filter and
`apps/frontend/src/lib/priceDirection.ts` were deleted along with F1 —
every remaining family now goes through the same automatic interpretation
path uniformly, with no special-cased exemption anywhere in the system.

---

## 12. `KPI_CONTEXT_DEPENDENCIES` (Patch 13) and the context package builder

`apps/backend/src/intelligence/kpiDependencyMap.ts` exports
`KPI_CONTEXT_DEPENDENCIES: Record<string, KpiContextDependencies>`,
authored **exhaustively** for every cockpit-visible KPI id (the same set
Patch 10 computes) — no placeholders, no skipped entries. Each entry:

```ts
interface KpiContextDependencies {
  siblingKpiIds: string[];       // other KPI ids in the same family
  crossFamilyKpiIds: string[];   // representative KPI ids from other families
  researchTopics: TopicTag[];
  relevantEventFamilies: FamilyId[]; // whose nextEvents/activeCatalyst matter here
}
```

This is the single most important artifact for reproducibility: every
cross-family link is already documented in
`apps/frontend/src/content/familyEducation.ts` and
`docs/MVP_COCKPIT_CONTRACT.md` — nothing here is a new financial
relationship. It reads as plumbing, not a product decision. For example,
`f2-10y`: `siblingKpiIds: ["f2-2y", "f2-10y-real", "f2-be10", "f2-2s10s"]`,
`crossFamilyKpiIds: ["f3-repricing"]`, `researchTopics: ["TREASURY_SUPPLY",
"FED_COMMUNICATION"]`, `relevantEventFamilies: ["F3", "F9"]`.

`apps/backend/src/intelligence/contextPackageBuilder.ts`'s
`KpiContextPackageBuilder` reads this map to assemble, per KPI, a
`KpiContextPackage` (backend-internal only, never exposed to the
frontend): the KPI's own canonical fields, its resolved sibling and
cross-family KPI snapshots, the relevant families' scheduled events, the
claims retrieved for its `researchTopics`, and the **previous session's**
`KpiInterpretation` for this KPI if one exists in
`.runtime/interpretations.json` (continuity across sessions — even in mock
mode, this lookup is wired so the shape is proven before any real model
needs it). The builder never decides dependencies ad hoc — it only ever
reads `KPI_CONTEXT_DEPENDENCIES`.

---

## 13. The mock/real safety gate

```ts
type DataMode = "DEV_MOCK" | "REAL";
function getDataMode(): DataMode {
  return process.env.DATA_MODE === "REAL" ? "REAL" : "DEV_MOCK";
}
```

Default is always `"DEV_MOCK"` unless `DATA_MODE=REAL` is explicitly set.
Even then — **this milestone has no real research/LLM provider adapters
at all**. `assertMockModeOrThrow()` (called once at boot, in
`initializeIntelligence`) throws a clear `"REAL mode not implemented in
this milestone"` error rather than silently falling through to mock
behavior, so a misconfigured `DATA_MODE=REAL` fails loudly instead of
quietly serving mock data under a "real" label.

---

## 14. Frontend integration summary

- `apps/frontend/src/lib/api/intelligenceClient.ts` —
  `fetchKpiInterpretation(kpiId, language)` (returns `null` on a 404, never
  throws for "not generated yet"; `language` defaults to `"EN"` and is
  threaded to the backend as `?lang=`) and `fetchIntelligenceMeta()`.
- `FamilyModule.tsx` fetches interpretations for a family's cockpit KPIs
  when that family's snapshot loads — not lazily on
  hover — since cockpit-visible ones are already cached server-side and
  this is fast. Each cockpit KPI renders as a bordered mini-cell
  (`.miniCell` in `FamilyModule.module.css`) with label, value, the
  relationship color treatment (`relationship-supportive` /
  `relationship-adverse` / `relationship-contextual`), and — once loaded —
  a one-line `currentReadShort` with a "DEV · MOCK AI READ" tag when
  `isMock`.
- `FamilyDetailDrawer.tsx` is one component with two modes
  (`DrawerView = { mode: "family" } | { mode: "kpi"; kpiId }`), not two
  overlapping drawers. Clicking a mini-KPI cell — from the resting face or
  from inside an already-open family-level view — switches the same
  drawer into KPI-level mode with a "← Back to family" affordance. A
  deep/event KPI's interpretation is fetched lazily, only when the user
  actually opens it in this view.

---

## 15. What's NOT built yet

- No MySQL persistence (§4) — `.runtime/` is the entire "storage layer"
  this milestone, and it is explicitly disposable.
- No real search/LLM provider adapters (§13) — `DATA_MODE=REAL` throws
  rather than doing anything.
- No manual, global `[ INTERPRET MARKET ]` feature — this document
  describes only the automatic, per-KPI system. **Reconfirmed unchanged in
  Milestone 1D**: nothing in the bilingual output, the
  `mechanicalRelationship`/`finalGoldRead` split, or the multi-model
  ensemble (§§16-19) builds or wires up this feature. It remains a later
  milestone's scope.
- No real contradiction-detection NLP (§6) — `DISPUTED` in this milestone
  is demonstrated via hand-authored fixture pairs, not detected
  algorithmically.
- No real translation/LLM call anywhere in the language pipeline (§16) —
  every French string is either hand-authored fixture content or a
  deterministic template, never a runtime machine-translation call.
- No real multi-model provider wiring (§19) — every analyst/challenger/
  adjudicator "model" is a `provider: "mock"` placeholder identity; the
  ensemble's role/policy shape is provider-agnostic and ready for real
  models later, but none are connected in this milestone.

---

## 16. Bilingual EN/FR architecture (Milestone 1D)

**Frontend UI chrome** (nav labels, page/section titles, status words,
buttons, drawer headings, tooltips, empty/error-state copy, dev-mode
badges) is translated by a **deterministic, hand-authored dictionary
lookup** — never a runtime translation call:

- `apps/frontend/src/i18n/en.ts` / `fr.ts` — flat-keyed dictionaries
  (`Record<TranslationKey, string>`), with simple `{token}` interpolation
  for the handful of templated strings (e.g. `"market.failedToLoad"`).
- `apps/frontend/src/i18n/useTranslation.ts` — `useTranslation()` reads
  `SettingsContext.language` and returns `t(key, vars?)` plus
  `tFamily(familyId)` for the translatable family display-name lookup
  (`family.F2`..`family.F13`, one key per remaining `FamilyId` — distinct
  from `CanonicalFamilySnapshot.label`, which is raw canonical data and is
  never translated).
- `SettingsContext` (`apps/frontend/src/context/SettingsContext.tsx`) holds
  `language: "EN" | "FR"` alongside the existing `directionalColoring`
  preference, persisted to `localStorage` under `goldTerminal.language`,
  SSR-safe (defaults to `"EN"` on both server and initial client render,
  then applies the stored value after mount — same pattern as
  `directionalColoring`).
- **Never translated, in either language:** financial acronyms/instrument
  shorthand (CPI, PCE, DXY, VIX, MOVE, HY OAS, GVZ, GDPNow, ISM, FOMC,
  BE10, 2s10s, etc.) and — per explicit product rule — **`CanonicalKpi.label`
  values are never routed through the i18n dictionary at all**. A KPI
  labeled "Core CPI MoM" renders exactly that string in French mode too.

**Backend intelligence output** (`currentReadShort`, `currentReadDetailed`,
`whyNow`, causal-chain statements, uncertainty/strengthen/weaken lists) is
threaded through an explicit `outputLanguage: Language` field on
`KpiContextPackage` (backend-internal, `contextPackageBuilder.ts`), set
from the request's `?lang=` query param (`GET /api/intelligence/kpi/:kpiId`,
default `"EN"`). Every `KpiInterpretation` carries a `language` field
matching what was requested.

**Mock fixtures are independently authored per language, never machine-
translated.** `apps/backend/src/intelligence/mockScenarios.ts` stores each
hand-authored scenario as `{ en: ScenarioContent; fr: ScenarioContent }` —
the French text is genuinely, independently written prose simulating what
a future French-language AI analysis would say, not a translated pass over
the English string (the same rule the frontend i18n dictionaries follow
for UI chrome, extended in spirit to these DEV_MOCK fixtures). The
generic deep/event-tier fallback generator (`genericFallbackScenario`) is
a parameterized template authored in **both** languages — still a
template, not a runtime translation function — and `kpi.driverSummary`
(canonical backend data) is wrapped in French scaffolding language without
ever having its own text translated.

Interpretations are cached per `(kpiId, language)` pair
(`bootstrap.ts`'s `interpretationCacheKey`). Eager boot-time generation for
the cockpit-visible KPI batch always runs in English (the default); a
non-default language (or any deep/event-tier KPI) is generated lazily on
first request, exactly like the existing lazy deep-KPI path, and then
cached for the rest of the session.

---

## 17. Deterministic-text vs. dynamic-AI-text boundary

This boundary is the single most important distinction in this whole
system, and it does not change across DEV_MOCK/REAL modes — only *how* the
dynamic side is produced changes.

**Never AI, never translated by an LLM at runtime (deterministic,
authored/computed once):**

- UI labels, navigation, page/section titles, status words, buttons
  (`apps/frontend/src/i18n/`).
- KPI names/labels, units, and canonical values (`CanonicalKpi.label`,
  `.unit`, `.value`, etc.) — always exactly what the backend sends.
- Basic definitions and family education copy
  (`apps/frontend/src/content/familyEducation.ts`).
- Translations themselves (§16) — hand-authored dictionaries/fixtures, not
  a translation model call.
- Data values, provenance tags, and timestamps (`observationAt`,
  `retrievedAt`, `sourceTag`, `provenance`).
- Formulas/derivations (e.g. `deriveFedSummary.ts`'s max/sum composition).

**AI-generated in REAL mode (DEV_MOCK: a deterministic fixture simulating
this output today):**

- `currentReadShort`, `currentReadDetailed`, `whyNow`, `causalChain`,
  `supportingEvidenceIds`/`contradictingEvidenceIds` (evidence selection),
  `uncertaintyOrUnknowns`, `whatWouldStrengthen`,
  `whatWouldWeakenOrInvalidate`.
- The ensemble's `AnalystConclusion`s and `ChallengeFinding`s (§19).
- The adjudicator's `finalGoldRead` decision for `CONTEXTUAL_AI` KPIs
  (never for `MECHANICAL_RULE` KPIs — see §18).

**Restated verbatim, as required:** in DEV_MOCK, `currentReadShort` is
**a deterministic fixture simulating future AI output**. Once REAL mode is
enabled, it becomes **generated by the final KPI intelligence consensus
pipeline**. Every other AI-generated field above follows the same rule.

---

## 18. `mechanicalRelationship` vs. `finalGoldRead` (Milestone 1D rename/extend)

`displayRelationship` is renamed to **`finalGoldRead`** — explicitly the
OUTPUT of the (mock) adjudication process, and what drives the visible
cell color. A new field, **`mechanicalRelationship: GoldRelationshipState
| null`**, is set verbatim from `CanonicalKpi.relationship` when it is
`"support"`/`"adverse"` (a defensible fixed mechanical channel exists), or
`null` when the canonical tag is `"neutral"` (no defensible fixed
mechanical channel — the KPI is purely contextual).

**`mechanicalRelationship` is NEVER written or altered by the (mock)
analyst/adjudicator generation logic** — it is copied read-only from
canonical data in `mockInterpretationGenerator.ts`'s `buildInterpretation`,
before the ensemble ever runs. `relationshipBasis` keeps its Milestone 1C
meaning unchanged (whether `mechanicalRelationship` is non-null).

**Generation rule:**

- For `MECHANICAL_RULE` KPIs, `finalGoldRead` normally equals the mapped
  `mechanicalRelationship` (support→SUPPORTIVE, adverse→ADVERSE) —
  enforced in `ensemble/runAdjudicator.ts`.
- **Rare, intentional exception:** a mechanical channel can still be
  adjudicated `CONTEXTUAL` when the mock scenario demonstrates other
  forces are strong enough to make a directional read unreliable right
  now. This is flagged explicitly via `MockScenario.forceContextualDespiteMechanical`
  (`mockScenarios.ts`) and is never silent — `runAdjudicator.ts` sets
  `adjudicatorNotes` to state plainly that the mechanical channel exists
  and was deliberately set aside for this session, not overwritten or
  forgotten. The one illustrative KPI demonstrating this is `f2-10y-real`
  (10Y Real yield — normally fixed `adverse`/`ADVERSE`, adjudicated
  `CONTEXTUAL` under a scenario where intraday real-yield direction is
  whipsawing alongside an unusually large simultaneous breakeven
  repricing). **This divergence is intentional and rare, documented here
  and in code comments — never a bug.**
- For `CONTEXTUAL_AI` KPIs, `finalGoldRead` is genuinely decided by the
  mock adjudicator step (§19), and `"CONTEXTUAL"` remains a common,
  non-fallback outcome — never forced toward green/red for visual variety.

The frontend (`FamilyDetailDrawer.tsx`'s `GoldRelationshipSection`) reads
`finalGoldRead` for cell/chip color everywhere `displayRelationship` used
to be read, and additionally shows `mechanicalRelationship` distinctly
whenever the two diverge ("Mechanical channel: Adverse" alongside "Final
read: Contextual"), or a single confirming line when they agree
("Mechanical rule: Adverse").

---

## 19. Multi-model ensemble architecture (Milestone 1D, mock only)

`apps/backend/src/intelligence/ensemble/` implements a provider-agnostic
analyst → challenger → adjudicator pipeline. No real model is called
anywhere in this milestone — every identity is a `provider: "mock"`
placeholder (`ModelRoleIdentity { provider, model, promptVersion }`, open
strings, never a closed union of real provider names).

**Policies** (`policies.ts`, `ANALYSIS_POLICIES: Record<AnalysisPolicy, ...>`):

- `STANDARD` — 2 analysts + adjudicator, no challenger. Applied to all
  cockpit-visible KPIs by default.
- `HIGH_SCRUTINY` — 3 analysts + challenger + adjudicator. Applied to a
  small illustrative subset (`HIGH_SCRUTINY_KPI_IDS`: `f2-10y`,
  `f4-core-cpi-mom`, `f7-hy-oas`, `f5-payrolls-latest`, `f8-tga-daily`) —
  chosen because they already carry rich hand-authored mock content, so
  the challenge stage has something substantive to work with.
  **Policy-per-family assignment is a future benchmarking decision, not
  locked by this milestone** — today's assignment is a flat allowlist,
  not derived from `FamilyId`.

**Independence-before-challenge ordering** (`runIndependentAnalysts.ts`):
analysts are never shown each other's conclusions — the code is
structured as N separate, independently-computed `AnalystConclusion`s
from the same shared context/scenario, never "generate A, then feed A's
output into generating B," even though today's generation is
synchronous/deterministic. This is deliberate so swapping in real,
genuinely-parallel model calls later requires no restructuring. Generic
(non-illustrative) KPIs synthesize analyst variance deterministically:
the first analyst's conclusion mirrors the base scenario read; subsequent
analysts hedge toward `"CONTEXTUAL"` when the shared evidence is
`"LIMITED"` — an evidence-driven, not random, source of genuine
disagreement. Illustrative KPIs carry fully hand-authored, genuinely
distinct per-role conclusions (`MockScenario.analystConclusions`).

**Challenge stage** (`runChallenge.ts`) only runs under `HIGH_SCRUTINY`.
`f7-hy-oas`'s hand-authored `challengeFindings` are the genuinely
substantive illustration required by the milestone: they flag an
unsupported causal leap ("complacent credit → reduced safe-haven demand →
adverse for Gold") as exactly the kind of mechanical-vs-current-causality
confusion this stage exists to catch, and downgrade an uncorroborated
"historically coincided" claim from an implied fact to an explicit
`HYPOTHESIS`/`UNKNOWN`.

**Adjudicator** (`runAdjudicator.ts`) implements the **disagreement-
preservation rule**: if analysts materially disagree (not unanimous) and
the evidence doesn't clearly resolve it, `finalGoldRead` becomes
`"CONTEXTUAL"` rather than a forced false consensus, and `modelAgreement`
reflects the actual disagreement (`"MIXED"` or a `"MAJORITY"` not backed
by `"STRONG"` evidence). **Note on evidence state naming:** the milestone
spec describes this outcome informally as evidenceState "MIXED", but the
`EvidenceState` contract type is unchanged this milestone
(`"STRONG" | "MODERATE" | "LIMITED" | "CONFLICTED"` — no new literal was
added); analyst disagreement maps onto the existing `"CONFLICTED"` value,
which already means "the evidence base doesn't cleanly resolve." This
mapping is a deliberate, documented interpretation of the spec, not an
oversight.

**Language note (revised — see §22):** an earlier version of this
milestone left the audit trail English-only regardless of `?lang=`,
reasoning that it was secondary/debug content not worth localizing. The
user has since explicitly rejected that as wrong: **everything the user
can read must be translated when French is selected**, and the audit
trail is user-visible (it renders inside an expandable `<details>` in the
KPI-level drawer), so "secondary content" was never a legitimate reason to
leave it untranslated. This is now fixed:

- The audit trail's generically-synthesized analyst content
  (`runIndependentAnalysts.ts`) is generated from the **requested**
  language's scenario content (`content`, not a hardcoded `"EN"`), and its
  hedge-role prefixes (`"A second independent read: "` /
  `"A third independent take: "`) are themselves authored per-language
  (`HEDGE_PREFIX_BY_INDEX: Record<Language, readonly string[]>`), not
  spliced in as English literals onto French prose.
- Hand-authored `analystConclusions`/`challengeFindings` (the illustrative
  KPIs — `f2-10y`, `f4-core-cpi-mom`, `f5-payrolls-latest`, `f7-hy-oas`,
  `f8-tga-daily`) are now authored in **both** languages
  (`mockScenarios.ts`'s `BilingualAnalystConclusions`/
  `BilingualChallengeFindings`), resolved by the requested language before
  being handed to the ensemble stages — same "genuinely
  independently-written, not machine-translated" standard as
  `ScenarioContent`.
- `runChallenge.ts`'s generic fallback finding (used by any HIGH_SCRUTINY
  KPI without hand-authored `challengeFindings`, e.g. `f2-10y` and
  `f5-payrolls-latest`) and `runAdjudicator.ts`'s `adjudicatorNotes`
  (all four decision branches) are now bilingual too.
- The frontend drawer's every enum-driven display label
  (`ModelAgreement`, `EpistemicStatus`, `VerificationState`,
  `AuthorityClass`, `AnalysisPolicy`, `EvidenceState`,
  `RelationshipBasis`, `QualityState`, `Visibility`, `Surprise`,
  `Provenance`) is now routed through `apps/frontend/src/i18n/` at render
  time (`FamilyDetailDrawer.tsx`'s per-enum label helpers) — the
  TypeScript literal values stay English (that is code, not user-facing
  copy), but nothing rendered on screen is a raw untranslated enum value
  in French mode anymore.

**The audit-trail-is-debug-info-not-cockpit-content boundary:**
`InterpretationAuditTrail { policy, analystConclusions, challengeFindings,
modelAgreement, adjudicatorNotes }` is attached to every
`KpiInterpretation` but is **never** read by the cockpit mini-cell
(`FamilyModule.tsx`'s `KpiRow` shows only `finalGoldRead` +
`currentReadShort`, exactly as before). The KPI-level drawer
(`FamilyDetailDrawer.tsx`) renders it as a second, visually secondary,
collapsed `<details>` section (same treatment as the existing "Data &
sources"/"Data Status" footers) below all headline content, labeled
"Model agreement: …" and expandable to the per-analyst conclusions and
challenge findings — explicitly framed as audit/debug information, never
primary content. **No numeric confidence appears anywhere in this model.**

---

## 20. The static/deterministic vs. dynamic/AI-generated boundary — authoritative statement, and the three-timestamp model

§17 above states this boundary informally. **This section is the
authoritative, unambiguous version** — where the two disagree in wording,
this section governs. The rule does not change across DEV_MOCK/REAL modes
— only *how* the dynamic side is produced changes.

**STATIC/DETERMINISTIC — never AI, never changes with current market
context:**

- UI labels, navigation, KPI names, units, and formulas.
- Basic educational definitions of what a KPI measures (e.g. "a real
  yield is a nominal yield adjusted for inflation expectations").
- The LOCKED mechanical economic relationship definitions
  (`mechanicalRelationship` and its plain-language reason) — e.g. F2's
  "real yields ↓ → opportunity cost of holding Gold falls → supportive."
- Source/provenance metadata and timestamps (`sourceTag`, `provenance`,
  `observationAt`, `retrievedAt`, `dataAsOf`).

**DYNAMIC/INTELLIGENCE-GENERATED — must come from the KPI intelligence
pipeline; in DEV_MOCK these exist ONLY as explicitly-labelled "DEV · MOCK
AI READ" fixtures, never as unlabelled static production copy:**

- `currentReadShort`, `currentReadDetailed`, `whyNow`.
- The current Gold implication (`finalGoldRead` for `CONTEXTUAL_AI` KPIs)
  and `currentRead` — the current rationale for it.
- Causal interpretation (`causalChain`), supporting-evidence narrative,
  contradictions, current risks/caveats (`uncertaintyOrUnknowns`), what
  would strengthen/weaken the read, relevant recent developments.
- "What may be missing" (`uncertaintyOrUnknowns`).
- The explanation of *why* the KPI currently shows its GREEN/RED/YELLOW
  state — i.e. everything in `GoldRelationshipSection`'s explanatory text,
  never the color/enum itself for `MECHANICAL_RULE` KPIs (that is derived
  programmatically, §2/§18).
- The ensemble's `AnalystConclusion`s, `ChallengeFinding`s, and
  `adjudicatorNotes` (§19, §22).
- `previousReadSummary` / `whatChangedSincePreviousRead` (§21).

**Audit result of this pass (Part A of the refinement request):** every
static content file was inspected —
`apps/frontend/src/content/familyEducation.ts` (family-level "What is
this?" / "Why does it matter for Gold?" / mechanical-relationship-
definition copy) is entirely definitional/mechanism prose (what a family
measures and how its locked mechanical channel works), never a
current-market-state assertion — it correctly belongs in the STATIC
category above and needed no change. `mockScenarios.ts`'s hand-authored
scenario content already lives entirely inside the `KpiInterpretation`
system, is always marked `isMock: true`, and is always rendered behind the
"DEV · MOCK AI READ" tag — **no static file was found asserting a
current-market-state sentence** (e.g. "10Y yields are currently…") as
permanent product copy outside this system. No fix was required for Part
A; this section exists to make the boundary explicit and authoritative
going forward, not to correct a violation that was found.

### The three-timestamp model

`KpiInterpretation` carries three independent timestamps. They are
deliberately never derived from one another:

| Field | Meaning | Changes when… |
|---|---|---|
| `dataAsOf` | The canonical KPI's own observation timestamp — data freshness. Copied from `CanonicalKpi.observationAt`. | The underlying market data point itself updates. |
| `interpretationAnalyzedAt` | When this specific interpretation was (re-)computed. Renamed from `analyzedAt`. | A new interpretation run happens for this KPI — which can occur even when `dataAsOf` is unchanged (see below). |
| `evidenceLatestPublishedAt` | The most recent `ClaimRecord.source.publishedAt` among the evidence actually consulted for this interpretation, or `null` if no dated evidence was used (e.g. a purely mechanical read with no research attached). | New, more recent evidence is consulted on a later interpretation run. |

These three are independent **by design**: a KPI's `dataAsOf` can be
static for weeks (e.g. a monthly CPI print) while `interpretationAnalyzedAt`
and `evidenceLatestPublishedAt` keep advancing as new context arrives. The
UI reflects this split deliberately (see "UI placement" below) rather than
collapsing it into one freshness word.

**UI placement:** the cockpit-face freshness word (`FreshnessDot`'s
LIVE/UP TO DATE/STALE/UNAVAILABLE) continues to represent **data
freshness only** (`dataAsOf`/`quality`) and gained no new relative-age
text — that rule from Milestone 1C stands unchanged. Interpretation
freshness lives exclusively in the KPI-level drawer's "Data Status"
section, presented as "Data: `<freshness word>` · AI read: refreshed
`<interpretationAnalyzedAt>`" (`kpi.dataAiReadCombined` in
`apps/frontend/src/i18n/`), so a reader can see at a glance that the two
concepts are independent without the cockpit face gaining any new chrome.

---

## 21. "Previous interpretation is context, not anchor" + continuity fields

`KpiInterpretation` adds three fields for the continuity narrative:

- `previousReadSummary: string | null` — what the last interpretation (any
  prior session, or none) concluded. `null` when this is the first
  analysis this session — there is nothing to compare against yet.
- `whatChangedSincePreviousRead: string | null` — what is different now:
  new evidence, new context, or explicitly "no material change." `null`
  alongside `previousReadSummary`.
- `currentRead: string` — always present (never null). The up-to-date,
  continuity-aware conclusion given everything now known. Distinct from
  `currentReadDetailed`: `currentReadDetailed` is the full explanatory
  writeup; `currentRead` is the "here's where we land now" statement that
  explicitly may confirm, partially revise, or reject `previousReadSummary`.
  When there is no previous read to compare against, `currentRead` simply
  states the read on its own (in the mock generator, it defaults to that
  language's `currentReadShort`).

**The literal rule, as it must be carried into any future real prompt:**
the previous interpretation is supplied to the model as **CONTEXT ONLY**,
to help identify what has changed since it was written. It is **NEVER an
anchor** the new interpretation must remain consistent with. The
adjudicator (and any future real-LLM prompt built on this pipeline) MUST
re-evaluate a KPI from its **current** canonical data and **current**
evidence every time, exactly as if starting fresh, and is free to fully
confirm, partially revise, or outright reject the prior read. **The new
interpretation must never be forced to remain consistent with the
previous one purely for continuity's sake.** This exact instruction is
codified as a literal string constant,
`PREVIOUS_INTERPRETATION_CONTEXT_RULE`, exported from
`apps/backend/src/intelligence/ensemble/runAdjudicator.ts`, so a future
real-prompt implementation has the rule available verbatim rather than
having to reconstruct it from this document.

`KpiContextPackage.previousInterpretation`
(`contextPackageBuilder.ts`) already carried the previous session's
interpretation for this purpose (continuity across sessions, wired since
Milestone 1C so the shape is proven before any real model needs it) — this
pass documents, at the point of definition, that it must only ever be
consulted this way.

**A KPI can receive a new interpretation even if its raw value did not
change.** This is the core principle the continuity fields exist to
demonstrate. The canonical illustrative example (from the original
request, describing the general phenomenon): Core CPI's official print is
weeks old and does not change between releases, but new PCE data, new Fed
communication, or a commodity move can change the *read* of what that
print means well before the next print arrives — the interpretation
legitimately moves while `dataAsOf` sits still.

**Concrete demonstration in the mock generator:** rather than force every
KPI into an elaborate change-narrative (dishonest — most sessions in this
mock system genuinely are the first analysis, with nothing to compare
against), exactly one illustrative KPI, **`f2-10y`**, hand-authors a
plausible previous-vs-current story (`MockScenario.continuity` in
`mockScenarios.ts`, both EN and FR): the previous read had judged the
nominal 10Y's rise as breakeven-led (leaning supportive for Gold); new Fed
communication pushing back on near-term cut expectations, a firmer PCE
print, and a stronger crude-oil impulse into breakevens have since shifted
that read toward "weakening, not confirmed" — **even though the 10Y print
itself (4.287%) has not moved since the prior session.** Every other KPI
uses the simpler, honest "first analysis this session, no prior read to
compare" state: `previousReadSummary`/`whatChangedSincePreviousRead` are
`null`, and `currentRead` falls back to that language's `currentReadShort`.

---

## 22. French-translation completeness (ensemble content)

See the revised "Language note" in §19 above for the full description of
what was fixed (generic hedge-prefix text, hand-authored
`analystConclusions`/`challengeFindings`, `runChallenge.ts`'s fallback
finding, `runAdjudicator.ts`'s `adjudicatorNotes`, and every enum-driven
display label in the drawer). The governing principle, stated once here
for clarity: **when French is selected, everything the user can read must
be French**, except genuinely-untranslatable technical vocabulary
(financial acronyms/instrument shorthand — CPI, DXY, VIX, FOMC, GVZ, bps,
etc. — which correctly stay as-is per the existing, unchanged rule from
§16) and canonical KPI `label` values from backend data (also correctly
untranslated per that same existing rule). "Secondary" or "debug" content
is not an exemption from this — if a human can read it in the rendered
UI, it must be translated.
## UI/Knowledge boundary and complete-read rule

`currentReadDetailed` is the canonical, complete adjudicated interpretation and has no presentation-length limit. Evidence, causal mechanisms, contradictions, uncertainty, alternative explanations, recent developments, and invalidating evidence belong in that complete read. The cockpit must not create a second abbreviated intelligence product: it renders the canonical detailed string through a CSS line clamp and opens the full KPI drawer on activation.

The KPI drawer presents Current Read, Why Now, Gold Implication and any mechanical relationship, Causal Chain, Supporting Evidence, Contradictions / Mixed Evidence, Alternative Explanations, Missing Evidence, Strengthening and Invalidating Evidence, Recent Developments, Sources, and Data Status / Provenance.

Knowledge content is a separate static frontend subsystem. Stable family slugs and KPI section anchors live in frontend product metadata. Its EN/FR chapters teach timeless mechanics and never consume evidence-store state, session intelligence, providers, or live market data. Dynamic interpretations may link into Knowledge; Knowledge never masquerades as a current-market read.
