# CODEX IMPLEMENTATION PROMPT — GOLD SUNDAY READ END-TO-END

You are implementing the **Gold Sunday Read** system inside my existing repository.

Do not redesign the financial methodology. The methodology has already been decided. Your job is to **inspect the repo, create the missing architecture and code, connect the research provider, create the file pipeline, validate outputs, and leave the project ready for a manual end-to-end test**.

Work carefully and iteratively. Do not stop at scaffolding.

---

## 0. First action: inspect the repository

Before editing:

1. inspect the project structure;
2. identify the frontend/backend stack;
3. identify existing environment-variable conventions;
4. identify existing scripts / CLI tooling;
5. identify whether there is already a data folder, jobs folder, API layer, database, or report page;
6. identify existing visualization libraries;
7. identify any existing OpenAI/Codex CLI integration;
8. preserve the existing architecture where reasonable.

Do **not** rewrite the app unnecessarily.

If the repo already has an appropriate convention, integrate into it.

If no suitable backend/job layer exists, default to a small **Node.js + TypeScript** implementation.

---

# 1. Required specification files

The system depends on these three methodology files:

```text
GOLD_SUNDAY_READ_COLLECTION_EVIDENCE_SPEC.md
GOLD_MACRO_REASONING_MANUAL_SUNDAY.md
GOLD_SUNDAY_READ_OUTPUT_SPEC.md
```

Search the repository for them first.

If they are not present, create a clear location such as:

```text
gold-sunday-read/
  specs/
```

and tell me exactly where I must place/copy them.

Do NOT rewrite their methodology.

The order is:

```text
01 COLLECTION SPEC
→ tells the research system what to find

02 REASONING MANUAL
→ tells the reasoning model how to connect and interpret the evidence

03 OUTPUT SPEC
→ tells the reasoning model/UI what the final Sunday Read must contain
```

---

# 2. Target architecture

Implement this logical pipeline:

```text
SUNDAY READ RUN
      │
      ▼
COLLECTION SPEC
      │
      ▼
PERPLEXITY RESEARCH
      │
      ├── Weekly Gold Recap
      ├── Family 1 Fed & Rate Pricing
      ├── Family 2 Rates & Real Yields
      ├── Family 3 USD & Liquidity
      ├── Family 4 Inflation/Growth/Fiscal/Credit
      ├── Family 5 Flows & Positioning
      └── Family 6 Structural
      │
      ▼
STRUCTURED EVIDENCE FILES + SOURCES
      │
      ▼
REASONING BUNDLE FOR GPT-6 ASTRA CLI
      │
      ▼
ASTRA FINAL STRUCTURED JSON
      │
      ▼
SCHEMA VALIDATION
      │
      ▼
SUNDAY READ UI
```

The system must be usable manually before any scheduler is added.

Scheduling/automation can be added later. Do not make cron/cloud deployment a blocker.

---

# 3. Research provider: Puter → Perplexity

Use the official Puter API / OpenAI-compatible interface for Perplexity.

Default research model:

```text
perplexity/sonar-deep-research
```

The user values **quality much more than speed**.

Do not optimize for latency.

Make the model configurable through environment variables.

Suggested env vars:

```text
PUTER_AUTH_TOKEN=
PUTER_BASE_URL=https://api.puter.com/puterai/openai/v1/
PERPLEXITY_RESEARCH_MODEL=perplexity/sonar-deep-research
```

IMPORTANT:

- verify the current official Puter documentation before coding the request/response shape;
- do not assume citation fields without checking the real response;
- preserve any returned citation/source metadata;
- never fabricate URLs or citations;
- if a response contains only inline citations, parse/preserve them carefully;
- log enough raw response metadata for debugging without exposing secrets.

The token must live in `.env` and never be committed.

Create/update `.env.example`.

---

# 4. Seven independent research jobs

Do NOT ask one giant Perplexity call to research everything.

Create seven logically independent research jobs:

```text
weekly_recap
family_1_fed
family_2_rates
family_3_usd
family_4_macro
family_5_flows
family_6_structural
```

Reason:

- preserve family independence;
- reduce contamination;
- make failures isolated;
- preserve source provenance;
- make debugging possible.

Each job receives:

1. the relevant instructions from the Collection Evidence Spec;
2. current run date / week;
3. an explicit reminder not to perform the final Gold Market Story;
4. a structured response schema.

The research system may take a long time. That is acceptable.

Do not impose artificial timeouts that would kill legitimate deep-research jobs unless technically necessary.

If the API is asynchronous, implement polling according to official docs.

If it is synchronous, handle long requests safely.

---

# 5. Research output format

Create a machine-readable JSON output for every research job, plus a human-readable Markdown rendering.

Recommended run folder:

```text
gold-sunday-read/
  runs/
    YYYY-MM-DD/
      manifest.json
      raw/
      evidence/
        weekly_recap.json
        weekly_recap.md
        family_1_fed.json
        family_1_fed.md
        family_2_rates.json
        family_2_rates.md
        family_3_usd.json
        family_3_usd.md
        family_4_macro.json
        family_4_macro.md
        family_5_flows.json
        family_5_flows.md
        family_6_structural.json
        family_6_structural.md
      reasoning/
      final/
```

Preserve raw provider responses under `raw/` for debugging/audit if practical.

Do not expose raw secrets.

---

# 6. Evidence schema requirements

Define and validate schemas in code.

Use the existing project validation library if available; otherwise use something such as Zod.

Each evidence item should be capable of representing at least:

```text
id
family
owner
statement
value
unit
as_of
measurement_window
status
type
epistemic_status
change_status
source_refs
reported_link_type
notes
```

Possible statuses include:

```text
ANSWERED
PARTIAL
UNKNOWN
```

Possible evidence types:

```text
EVENT_FACT
STATE
REPORTED_LINK
```

When relevant, epistemic status must support:

```text
OBSERVED
DECLARED
PUBLISHED
ESTIMATED
INFERRED
CALCULATED
QUALITATIVE
UNKNOWN
```

For reported links, preserve whether it is:

```text
REACTION_TO_EVENT
ANTICIPATION_AHEAD_OF_EVENT
OTHER
UNCLEAR
```

Do not create arbitrary numeric scores.

---

# 7. Source provenance

Create a source registry per run.

Each source should be able to store:

```text
source_id
title
publisher
author
published_at
url
ultimate_origin
syndication_notes
retrieved_at
provider
```

Avoid counting syndicated copies as independent evidence.

Do not attempt a perfect global deduplication engine. Implement practical normalization:

- normalized URL;
- publisher;
- title similarity where useful;
- explicit ultimate origin when Perplexity provides it.

Never delete evidence silently because two articles look similar.

Deduplicate identity, not interpretation.

---

# 8. Research reliability behavior

Research jobs must obey the Collection Evidence Spec.

Important implementation behavior:

- missing fact → `UNKNOWN`, not invented;
- stale fact → preserve AS-OF and flag it;
- metric requiring calculation → only accept:
  - published value,
  - deterministic calculation using real data,
  - qualitative characterization,
  - UNKNOWN;
- LLM must never invent correlation coefficients or percentiles;
- article attribution remains `REPORTED_LINK`, not validated causality;
- preserve Tuesday COT timing vs Friday price timing;
- no global Gold bullish/bearish conclusion in family collection jobs.

A single failed family should not destroy the whole run.

The manifest must record job status:

```text
PENDING
RUNNING
SUCCEEDED
PARTIAL
FAILED
```

Allow manual rerun of one family.

---

# 9. Reasoning stage: GPT-6 Astra via CLI, NOT API

The user does **not** want to use an Astra API.

Astra will be used through the user's local CLI/subscription environment.

Do not invent a specific Astra command unless the repository/environment proves what command exists.

Implement a `ReasoningRunner` abstraction with at least two modes.

## Mode A — manual bundle (mandatory)

Always supported.

Generate a bundle such as:

```text
runs/YYYY-MM-DD/reasoning/
  ASTRA_PROMPT.md
  evidence_bundle.json
  evidence_bundle.md
  final_output.schema.json
  README_RUN_ASTRA.md
```

`ASTRA_PROMPT.md` must instruct Astra to:

1. read the Reasoning Manual;
2. read the Output Spec;
3. read all seven evidence outputs;
4. preserve source references;
5. build the Market Story according to the methodology;
6. build contexts by horizon;
7. identify what is priced / what can surprise;
8. create one consolidated scenario tree;
9. include the mandatory asymmetry gate;
10. output JSON matching `final_output.schema.json`;
11. also output human-readable Markdown if useful;
12. never invent missing facts;
13. allow `MIXED`, `UNKNOWN`, and `NO EDGE`.

The manual mode must leave the user with a single clear command/instruction workflow:

```text
run research
→ open/read README_RUN_ASTRA.md
→ execute Astra CLI with generated prompt/bundle
→ save Astra JSON result to the documented final input path
→ run validation/render command
```

## Mode B — configurable local CLI invocation (optional)

If the user's environment already exposes a usable Astra/Codex CLI command, support an env-configurable command template such as:

```text
ASTRA_CLI_CMD=
```

Do not hard-code a command name based on assumptions.

If automatic invocation cannot be implemented safely, manual bundle mode is sufficient for the first manual test.

---

# 10. Final output schema

Implement a strict JSON schema aligned with `GOLD_SUNDAY_READ_OUTPUT_SPEC.md`.

At minimum:

```json
{
  "meta": {},
  "executive_narrative": "",
  "contexts": {
    "tactical": {},
    "medium": {},
    "structural": {}
  },
  "priced_in": {},
  "scenario_tree": {},
  "asymmetry": {},
  "catalysts": [],
  "invalidations": [],
  "contradictions": [],
  "anomalies": [],
  "unknowns": [],
  "weekly_timeline": [],
  "evidence": [],
  "sources": []
}
```

Define detailed nested schemas.

The scenario tree must support:

```text
node id
label
description
type
status
evidence refs
children / edges
terminal outcome
```

Statuses must support at least:

```text
CONFIRMED
WATCH
PENDING
UNKNOWN
CONTRADICTED
```

Terminal outcomes must support:

```text
BULLISH
BEARISH
NO_EDGE
UNRESOLVED
```

No arbitrary probability/score is required.

---

# 11. Scenario tree rules in code/UI

The visualization must reflect the Output Spec.

Important:

- one consolidated tree with a shared trunk where possible;
- branches only when the logic genuinely diverges;
- missing input remains visible;
- `UNKNOWN` ≠ `PENDING`;
- outcome appears at the end, not the beginning;
- branch must pass through an asymmetry/edge stage before ending in BULLISH/BEARISH;
- NO_EDGE must be supported;
- do not create fake nodes to make the diagram symmetrical.

The UI renderer should use the structured tree.

Do not parse arrows from prose.

---

# 12. User interface

Integrate a functional Sunday Read page into the existing frontend.

Do not prioritize visual polish over correctness.

For the first manual test, implement a clean, usable version of:

1. header / run metadata;
2. executive explanatory narrative;
3. three horizon cards;
4. priced-in / surprise block;
5. scenario-tree visualization;
6. asymmetry summary;
7. upcoming catalysts;
8. invalidations / contradictions / anomalies / unknowns;
9. expandable weekly chronology;
10. expandable evidence/source details.

Audience:

The user is still learning finance.

Keep the real terms but show explanations/tooltips/expandable definitions where useful.

Do not over-vulgarize.

If the existing frontend is React/Next and already has a suitable graph library, use it.

If no graph library exists, choose the lightest robust approach that supports:

- directed nodes/edges;
- branch layout;
- status styling;
- expandable details.

Do not add a huge dependency unless necessary.

A basic functional tree is enough for the first test.

We will redesign/polish later with a dedicated design pass.

---

# 13. CLI / scripts for manual testing

Create simple commands using the project's package manager.

Target workflow should be approximately:

```text
# 1. check configuration
... sunday:doctor

# 2. create a run and execute Perplexity research
... sunday:research

# optionally rerun one job
... sunday:research --job family_5_flows

# 3. build Astra reasoning bundle
... sunday:bundle

# 4. after the user runs Astra CLI and saves JSON:
... sunday:validate

# 5. launch/render the UI
... sunday:dev
```

Use names appropriate to the existing repo.

Create a clear README with the exact commands that actually exist.

Do not document commands you did not implement.

---

# 14. Doctor / diagnostics command

Implement a preflight diagnostic.

It should check:

- required spec files exist;
- Puter token exists;
- configured Perplexity model;
- network/API access if possible;
- run directories writable;
- schema files valid;
- frontend build available;
- optional Astra CLI configuration status.

Never print the secret token.

---

# 15. Manual test mode

The project must be usable even if we do not want to spend a real deep-research request immediately.

Implement fixtures/mocks for at least one fake run.

The fake data must be clearly labelled as fixture/demo data.

Commands should make it possible to:

```text
load fixture evidence
→ create Astra bundle
→ load fixture final JSON
→ render full UI
```

This lets us test the architecture and diagram before paying/consuming provider credits.

Then document a real-provider test separately.

---

# 16. Real manual integration test

When configuration is available, execute a minimal real test if safe.

Do not run all seven expensive Deep Research jobs without explicit need if that would consume meaningful quota.

At minimum, make the code ready and, if appropriate, test one job such as:

```text
family_1_fed
```

Validate:

- request succeeds;
- answer is fresh;
- citations/source metadata are preserved;
- JSON validation works;
- Markdown rendering works.

If provider limitations prevent the live call, leave a precise diagnostic and manual command.

---

# 17. Logging and observability

Each run should log:

```text
run_id
start/end
job name
provider
model
status
duration
error
source count if available
output path
```

Do not log secrets.

Persist a `manifest.json` summarizing the run.

---

# 18. Failure behavior

The system must be resilient.

Examples:

- F5 fails → other families remain usable;
- citation metadata missing → mark provenance partial;
- JSON from provider malformed → retry/repair only with deterministic/schema-safe handling;
- Astra final JSON invalid → validation fails with actionable errors;
- unknown facts → remain unknown;
- UI should display partial-run warning instead of crashing.

Never silently replace a failed fact with a guess.

---

# 19. Security

Mandatory:

- `.env` ignored;
- `.env.example` committed;
- no Puter token in frontend bundle;
- provider calls happen server-side / local backend/job process;
- sanitize URLs/text used in UI;
- no arbitrary shell execution from untrusted data;
- optional Astra CLI command configuration must not be constructed from provider text.

---

# 20. Do not implement yet

Do NOT build the following as part of this task unless the repo already has them and integration is trivial:

- midweek manual retrigger logic;
- nocturnal Gold recap;
- automatic scenario replacement during the week;
- trade execution;
- broker integration;
- scheduler/cloud cron;
- notification system.

This task is **Sunday Read only**.

---

# 21. Deliverables

Do not finish until these exist or you explicitly explain why one cannot.

Required:

1. integrated folder architecture;
2. spec-file locations;
3. environment configuration;
4. Puter/Perplexity client;
5. seven research job definitions;
6. structured schemas;
7. source registry/provenance handling;
8. run manifest;
9. evidence JSON + Markdown renderers;
10. Astra reasoning-bundle generator;
11. optional configurable Astra CLI adapter if safely possible;
12. final JSON schema;
13. final-output validation;
14. Sunday Read UI;
15. scenario-tree renderer;
16. fixture/demo run;
17. diagnostic/doctor command;
18. manual commands/scripts;
19. README with exact manual end-to-end procedure;
20. tests for important schemas/transformations.

---

# 22. Verification before finishing

Run what is practical locally:

- formatter/linter;
- typecheck;
- unit tests;
- schema tests;
- fixture pipeline;
- frontend build;
- manual page render.

Fix errors rather than merely listing them.

Then give me a concise implementation report containing:

```text
WHAT YOU CREATED
FILES CHANGED
HOW THE ARCHITECTURE WORKS
ENV VARS I MUST SET
HOW TO GET/SET THE PUTER TOKEN
HOW TO RUN A FAKE END-TO-END TEST
HOW TO RUN ONE REAL PERPLEXITY TEST
HOW TO RUN THE FULL 7-JOB RESEARCH
HOW TO HAND THE BUNDLE TO GPT-6 ASTRA CLI
WHERE TO SAVE ASTRA'S RESULT
HOW TO VALIDATE IT
HOW TO OPEN THE FINAL UI
KNOWN LIMITATIONS
NEXT STEP
```

---

# 23. Core rule

Do not improvise the financial logic.

If an implementation choice conflicts with the three methodology/spec files, the spec files win.

The code's job is to make the methodology **repeatable, auditable, inspectable, and testable**.
