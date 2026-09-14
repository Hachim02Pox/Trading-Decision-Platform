# GOLD SUNDAY READ — OUTPUT SPEC

> **Role of this file**
>
> This document defines **what the final automated Sunday Read must look like for the human user**.
>
> It comes after:
>
> 1. `GOLD_SUNDAY_READ_COLLECTION_EVIDENCE_SPEC.md`
> 2. `GOLD_MACRO_REASONING_MANUAL_SUNDAY.md`
>
> The first file tells the research system **what to collect**. The second tells the reasoning model **how to think about the evidence**. This file tells the system **how to communicate the final result**.
>
> The output must be rigorous enough for professional reasoning but understandable by a user who is still learning finance and macro.
>
> **Truth comes before beauty.** Visuals and diagrams exist to make the reasoning inspectable, not decorative.

---

# 0. Audience rule

The reader is intelligent but still a **finance / macro amateur**.

Therefore:

- keep the real financial vocabulary;
- keep the real data and numbers;
- do not replace precise concepts with vague simplifications;
- explain unfamiliar terms in plain French when they matter;
- explain **why a fact matters here**, not only what the fact is;
- avoid assuming the reader already understands the transmission mechanism;
- do not drown the reader in jargon without explanation;
- do not over-vulgarize to the point of deleting nuance.

Good style:

> Le 2Y a baissé de 14 bp, ce qui signifie que le marché demande désormais un rendement plus faible sur la partie courte de la courbe. Comme le 2Y reflète fortement les attentes de politique monétaire, ce mouvement est cohérent avec un repricing plus dovish de la Fed.

Bad style:

> 2Y -14 bp = bullish Gold.

Bad style:

> Les taux ont baissé donc l’or monte.

The output must **teach while analysing**.

---

# 1. Reading order

The final Sunday Read should be read progressively.

The default order is:

1. **Global explanatory recap / Market Story narrative**
2. **Contexts by horizon**
3. **What is priced / what could still surprise**
4. **Scenario tree**
5. **Asymmetry / edge check**
6. **Upcoming catalysts**
7. **Invalidations and unknowns**
8. **Evidence / source drill-down**

The user should be able to understand the week in roughly 60–120 seconds from the top section, then inspect progressively deeper layers.

---

# 2. Block 1 — Global explanatory recap

This is the first thing the user sees.

It is not a bullet dump.

It is a **coherent explanatory narrative** written in clear French.

It must combine:

- what happened Monday → Friday;
- the important changes discovered in the six families;
- the current Market Story;
- the main causal links the reasoning model considers credible;
- what is still uncertain;
- what materially matters for the coming week.

It should explain:

- what happened;
- why the market appears to have reacted that way;
- which driver(s) seem to matter;
- which observations are independent vs echoes of the same driver;
- what does not fit the story;
- whether the market looks clean, conflicted, or unresolved.

The top narrative should synthesize the week into a **story a human can understand**.

The system must remain explicit when causal confidence is limited.

Allowed language:

- “les données sont cohérentes avec…”
- “le marché semble surtout répondre à…”
- “l’explication la plus convaincante actuellement est…”
- “ce lien reste incertain…”
- “deux lectures restent possibles…”

Forbidden language when evidence is weak:

- “X a causé Y” without support;
- “Gold va forcément…”;
- “le marché pense…” without evidence;
- invented certainty.

---

# 3. Block 2 — Contexts by horizon

Display three real cards.

## TACTICAL

**Horizon:** minutes → days

Must answer:

1. **Orientation Gold:** `BULLISH / BEARISH / MIXED / UNCLEAR`
2. **Why:** short pedagogical explanation
3. **Evidence:** material facts supporting the view
4. **Competing thesis:** strongest alternative interpretation / counterargument
5. **Invalidation:** what observable development would make this tactical reading wrong

The tactical card answers:

> What is the market responding to now / this week?

## MEDIUM TERM

**Horizon:** days → weeks

Must answer:

1. **Orientation Gold:** `BULLISH / BEARISH / MIXED / UNCLEAR`
2. **Why**
3. **Evidence**
4. **Competing thesis**
5. **Invalidation**

The medium-term card answers:

> What repricing / positioning trend is currently developing?

## STRUCTURAL

**Horizon:** months → years

Must answer:

1. **Orientation Gold:** `BULLISH / BEARISH / MIXED / UNCLEAR`
2. **Why**
3. **Evidence**
4. **Competing thesis**
5. **Invalidation / structural weakening condition**

The structural card answers:

> What slow background remains in force?

Do not force the three horizons to agree.

Valid example:

- Tactical: bearish
- Medium: mixed
- Structural: bullish

A context may also be:

- hybrid;
- transitional;
- no clear regime.

---

# 4. Block 3 — What is priced / what would still be a surprise

This block exists because the market trades **expectations**, not raw facts.

It must answer:

### Already priced

What expectations appear substantially embedded in current market pricing?

Examples:

- next-FOMC pricing;
- expected CPI direction;
- widely expected fiscal / geopolitical development;
- already crowded positioning.

### Still capable of surprising

What new information would materially change expectations?

For each material surprise candidate, state:

- expected / baseline;
- surprise condition;
- likely first transmission channel to watch;
- which scenario branch it would affect.

Do not invent consensus numbers if they were not established during research.

If the system cannot reliably determine what is priced:

`UNKNOWN / PARTIAL`

is valid.

---

# 5. Block 4 — The scenario tree

This is the central visual object of the final Sunday Read.

## 5.1 One consolidated tree

Prefer **one consolidated tree with a shared trunk** and several branches.

Do not create several unrelated diagrams that duplicate the same evidence.

The shared trunk contains what is already established.

Branches begin where the future path or causal interpretation genuinely diverges.

## 5.2 No imposed number of scenarios

The model may produce:

- one currently dominant path;
- two branches;
- three branches;
- more if genuinely required.

Never create “bull / base / bear” merely to fill space.

Never impose a fixed number.

## 5.3 Every node must have a real meaning

A node may represent:

- an established fact;
- a current state;
- a future catalyst;
- a condition waiting to be resolved;
- a positioning constraint;
- a funding constraint;
- an options condition;
- an asymmetry test;
- a final terminal state.

Each node should expose a status where appropriate:

- `CONFIRMED`
- `WATCH`
- `PENDING`
- `UNKNOWN`
- `CONTRADICTED`

`UNKNOWN` is not the same as `PENDING`.

### UNKNOWN

We do not know / cannot measure it reliably.

### PENDING

The information or event has not happened yet.

### CONTRADICTED

Observed evidence currently conflicts with the condition.

## 5.4 Missing-node visualization

If a scenario cannot yet be validated because one material input is missing, **show the missing node**.

Do not hide uncertainty.

Example:

```text
Soft labor trend
      ↓
Fed pricing dovish
      ↓
2Y / real yields lower
      ↓
USD weak
      ↓
ETF inflows ?
[ PENDING / UNKNOWN ]
      ↓
ASYMMETRY TEST
      ↓
BULLISH
```

The unresolved node should visually contrast with confirmed nodes.

## 5.5 Branch logic

A branch can split around a future variable.

Example:

```text
              CPI
               ?
        ┌──────┴──────┐
        │             │
      SOFT           HOT
        │             │
Fed pricing ↓     Fed pricing ↑
        │             │
real yields ↓    real yields ↑
        │             │
USD ↓            USD ↑
        │             │
...
```

Once the evidence only supports one path, the current Sunday output may emphasize that path.

The Sunday Read does not need to preserve dead branches for historical display.

---

# 6. Mandatory asymmetry gate

A directional Market Story is **not sufficient**.

Before a scenario can terminate in `BULLISH` or `BEARISH`, it must pass through an **ASYMMETRY / EDGE** node.

The asymmetry analysis may include, where relevant:

- COT;
- open interest;
- ETF flows;
- options / GVZ / skew;
- funding;
- forced buyers / forced sellers;
- fuses;
- marginal flow;
- crowded consensus;
- physical confirmation / divergence;
- how much of the move has already occurred;
- positioning vulnerability.

The key question:

> Even if the directional story is correct, is there still a useful asymmetry left?

Possible terminal outputs:

- `BULLISH`
- `BEARISH`
- `NO EDGE`

`NO EDGE` is a first-class valid result.

Example:

```text
Macro story = bullish
+
everyone already long
+
options show FOMO
+
ETF inflow slowing
+
price already extended

→ NO EDGE
```

Do not convert a correct macro direction into a trade recommendation when the asymmetry is poor.

---

# 7. Scenario summary text

Each major branch / scenario should have a short human-readable paragraph above or beside the diagram.

It should explain:

- what the scenario means;
- why it exists;
- the central chain;
- what still needs to happen;
- what would kill it.

Do not repeat every node from the diagram in prose.

The prose explains the **logic**.

The diagram exposes the **mechanics**.

---

# 8. Final scenario terminals

The final directional box is placed at the **bottom/end of the scenario path**, not at the top.

Preferred visual semantics:

- `BULLISH` → positive terminal
- `BEARISH` → negative terminal
- `NO EDGE` → neutral terminal
- unresolved branch → no directional terminal yet

Do not label a scenario bullish/bearish before its reasoning chain is visible.

---

# 9. Block 5 — Asymmetry summary

Even though asymmetry is embedded in the tree, include a short summary outside it.

Answer:

- where the asymmetry currently lies;
- what positioning could amplify the move;
- what positioning could limit the move;
- whether the opportunity is early / balanced / crowded / late;
- whether there is currently an actionable edge.

Do not reduce this to a numeric score.

Use plain qualitative language.

---

# 10. Block 6 — Upcoming catalysts

Display only **material catalysts** capable of changing the current read.

For each:

- event;
- date/time if established;
- what the market currently expects;
- what question the event will answer;
- which scenario branch(es) it can activate, weaken, or invalidate.

Tier 1 events deserve stronger visual prominence.

Do not fill the calendar with low-value releases.

---

# 11. Block 7 — Invalidations, contradictions, anomalies, unknowns

This block is mandatory.

## Invalidations

List the conditions that would make the current main read wrong.

Prefer observable and quantified conditions when genuinely supported.

## Contradictions

What evidence currently pushes against the preferred story?

A report with no contradictions should be treated with suspicion.

## Anomalies / unexplained

What behavior has not been explained convincingly?

## Unknowns

What important information is unavailable, stale, delayed, or insufficiently measured?

Never convert:

`UNKNOWN`

into:

`neutral`.

---

# 12. Evidence drill-down

The interface should allow the user to inspect why a node exists.

A clickable or expandable evidence node should ideally expose:

- statement;
- value;
- change;
- AS-OF;
- measurement window;
- family;
- source(s);
- epistemic status;
- reported link vs observed fact;
- short pedagogical explanation;
- which part of the Market Story / scenario uses it.

The final UI implementation may vary.

The information requirement does not.

---

# 13. Weekly chronology drill-down

The chronological Monday → Friday recap remains accessible beneath the synthesis.

For each day:

- material Gold move;
- important events;
- relevant cross-asset move;
- reported attribution.

Keep:

`PRICE FACT`

separate from:

`REPORTED ATTRIBUTION`.

This block exists for auditability and context.

It should not dominate the first screen.

---

# 14. Output vocabulary

Preferred global confidence vocabulary:

- `CLEAR`
- `LIKELY`
- `PLAUSIBLE / MIXED`
- `INSUFFICIENT EVIDENCE / UNKNOWN`

Never invent probability percentages unless they come from an actual measured probability source.

Do not output:

- “73% bullish”
- arbitrary scores
- mechanical weighted totals

---

# 15. Visual truth rules

Every visual element must correspond to a real analytical object.

Do not:

- add arrows because they look good;
- create fake dependencies;
- merge unrelated drivers;
- hide contradictions;
- decorate missing data as if confirmed;
- color something bullish/bearish before the logic reaches that conclusion.

A beautiful diagram that lies is worse than no diagram.

---

# 16. Sunday-only scope

This specification is for the **automated Sunday Read** only.

It does not define:

- manual midweek re-triggers;
- nocturnal recap;
- intraday update logic;
- scenario replacement logic after new events;
- post-trade review.

Those will be designed separately.

---

# 17. Suggested final page skeleton

```text
┌────────────────────────────────────────────────────────┐
│ GOLD WEEKLY / SUNDAY READ                              │
│ as-of · week covered · freshness status                │
└────────────────────────────────────────────────────────┘

1. WHAT HAPPENED / CURRENT MARKET STORY
   Long explanatory narrative for a finance learner.

2. CONTEXTS BY HORIZON

   ┌────────────────┐
   │ TACTICAL       │
   │ orientation    │
   │ why            │
   │ evidence       │
   │ counter-thesis │
   │ invalidation   │
   └────────────────┘

   ┌────────────────┐
   │ MEDIUM TERM    │
   │ ...            │
   └────────────────┘

   ┌────────────────┐
   │ STRUCTURAL     │
   │ ...            │
   └────────────────┘

3. WHAT IS PRICED / WHAT CAN STILL SURPRISE

4. CONSOLIDATED SCENARIO TREE

                    CURRENT STATE
                          │
              ┌───────────┴───────────┐
              │                       │
           BRANCH A                 BRANCH B
              │                       │
          conditions               conditions
              │                       │
          transmission             transmission
              │                       │
         positioning              positioning
              │                       │
        ASYMMETRY GATE            ASYMMETRY GATE
              │                       │
       ┌──────┴─────┐           ┌─────┴──────┐
       │            │           │            │
    BULLISH      NO EDGE      BEARISH     NO EDGE

5. ASYMMETRY SUMMARY

6. UPCOMING CATALYSTS

7. INVALIDATIONS / CONTRADICTIONS / ANOMALIES / UNKNOWNS

8. WEEKLY CHRONOLOGY

9. EVIDENCE & SOURCES
```

---

# 18. Machine-readable output

The reasoning pipeline should also produce structured JSON for the UI.

Suggested top-level structure:

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

The JSON schema should be implemented and validated in code.

The UI should render from this structured representation rather than parsing prose.

---

# 19. Final communication principle

The Sunday Read must answer two human needs simultaneously:

### UNDERSTAND

> What is happening, why, and how do the pieces connect?

### DECIDE WHETHER THERE IS AN EDGE

> Even if the story is right, is there enough asymmetry to care?

The system is successful when the user can understand the market better **without being tricked into false certainty**.
