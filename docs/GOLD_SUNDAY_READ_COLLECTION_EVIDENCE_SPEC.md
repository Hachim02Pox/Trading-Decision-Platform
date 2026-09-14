# GOLD SUNDAY READ — COLLECTION & EVIDENCE SPEC

> **Role of this file**
>
> This document comes **before** `GOLD_MACRO_REASONING_MANUAL_SUNDAY.md`.
>
> Its job is not to interpret Gold, build a Market Story, or produce scenarios.
> Its job is to tell the research agent **what it must learn from the web, family by family, how to collect it, what to reject, how to preserve uncertainty, and how to prepare the evidence for later reasoning**.
>
> The sequence is:
>
> **1. COLLECTION & EVIDENCE SPEC (this file)**  
> → Weekly Gold recap + 6 Family Evidence Cards  
>
> **2. GOLD_MACRO_REASONING_MANUAL_SUNDAY.md**  
> → understand mechanisms, connect evidence, build competing hypotheses, identify drivers, Market Story, contexts, asymmetry, scenarios  
>
> **3. Final Sunday Read output**

---

# 0. Core philosophy

The system is **not** a BUY/SELL oracle.

It must first understand the market correctly.

The research phase therefore produces:

- facts;
- current state;
- recent dynamics;
- important changes;
- dated events;
- market reactions;
- reported attributions;
- uncertainty;
- missing information.

It does **not** yet produce:

- a global Gold direction;
- a Market Story;
- a dominant driver;
- a final causal chain;
- a scenario tree;
- a final asymmetry read.

The method is:

**observe first → connect later**.

No score.  
No indicator voting.  
No fixed weighting.

Several observations may be manifestations of the **same driver**.

Example:

`soft labor → dovish Fed repricing → 2Y ↓ → real yields ↓ → USD ↓`

This may later become **one driver**, not four independent confirmations.

The anti-double-counting work belongs to the reasoning phase, not the collection phase.

---

# 1. Data policy

## 1.1 External research only

The AI research process uses **external/web information**.

The user's personal terminal is **not** an input source for the core research process.

The terminal may later be used manually by the user for visual cross-checking, but it must not silently contaminate the evidence gathering.

## 1.2 Search freedom

The agent is **not** forced to use:

- Reuters;
- Bloomberg;
- MarketWatch;
- a fixed list of websites;
- exactly two sources;
- exactly N sources;
- a mandatory primary source for every datapoint;
- a rigid navigation path.

The Skill defines:

- what must be understood;
- what questions must be answered;
- what must be ignored;
- what common confusions must be avoided;
- what a complete answer looks like.

The agent keeps freedom to investigate intelligently.

---

# 2. Three absolute quality standards

Every important fact must satisfy, as far as reasonably possible:

## 2.1 Freshness

Does the information actually represent the current state or the requested period?

A recent article discussing old data is **not** automatically fresh evidence.

## 2.2 Truthfulness / reliability

Is the fact sufficiently reliable to use?

Important facts should be corroborated enough to avoid relying on a weak or circular claim.

There is **no fixed source count**.

## 2.3 Accuracy to the question

Did the agent answer the exact question asked?

A technically correct but adjacent answer is still a failure.

Example:

If the task asks for **next-FOMC market pricing**, a probability for the wrong meeting is not acceptable.

---

# 3. Articles: transport layer, not oracle

Articles are useful because they can efficiently transport a dynamic:

**before → event → after → observed reaction**

Example:

- Fed pricing was X;
- CPI was released;
- pricing became Y;
- 2Y moved Z;
- investors repriced policy expectations.

This is valuable.

But articles must **not** automatically provide the final causal interpretation.

The research phase may extract:

- factual numbers;
- dated changes;
- sequence of events;
- observed reactions;
- what participants were reported to be focusing on;
- what expectations changed;
- reported market attribution.

It must ignore as authoritative truth:

- Gold price targets;
- BUY/SELL recommendations;
- analyst conviction;
- unsupported causal stories;
- directional forecasts presented as fact.

---

# 4. Independent confirmation and provenance

Several URLs can still represent one source.

Example:

- Site A republishes Bloomberg;
- Site B republishes the same Bloomberg wire;
- Site C summarizes that same story.

That is **not three independent confirmations**.

When identifiable, preserve:

- publisher;
- journalist / author when useful;
- publication date;
- underlying or ultimate origin of the fact;
- whether content is syndicated / copied;
- source reference / URL or internal source identifier.

Do not impose an exact number of confirmations.

The objective is simply:

> achieve enough independent corroboration to trust the important fact.

---

# 5. Weekly Gold recap — Monday to Friday

Before the six families are connected, reconstruct the week in Gold.

For each trading day:

- Gold move;
- meaningful intraday or session behavior when available;
- important events;
- relevant cross-asset moves;
- what market participants were reported to be digesting.

Keep two things strictly separate:

## 5.1 PRICE FACTS

What actually happened.

Example:

- Gold +1.2%;
- 2Y -9 bp;
- DXY -0.5%.

## 5.2 REPORTED ATTRIBUTION

What articles or market commentary said caused or explained the move.

Example:

- “Reuters attributed the move to dovish repricing.”

This is **reported attribution**, not validated causality.

## 5.3 Timing discipline

The system must distinguish:

### Reaction to an event

The event must have already happened.

Example:

`CPI release → Gold reaction`

### Anticipation / positioning ahead of an event

The price move may happen **before** the event.

Example:

`positioning ahead of CPI → Gold move Tuesday → CPI Wednesday`

Do **not** reject a reported link merely because the scheduled event occurs later if the claim is explicitly about anticipation or positioning.

If the nature of the link is unclear, mark it as unclear rather than inventing the causal structure.

---

# 6. Common Family Evidence Card rules

Every family is an independent research mission.

Each family answers:

- current state;
- recent dynamic;
- important changes;
- relevant dated events;
- important uncertainty;
- missing information.

Do not produce a global Gold interpretation yet.

## 6.1 Status

Use when relevant:

- `ANSWERED`
- `PARTIAL`
- `UNKNOWN`

`UNKNOWN` means missing measurement, not “no signal”.

## 6.2 AS-OF

Preserve the actual date of each fact when material.

AS-OF is especially important for:

- COT;
- TIPS / real yields;
- structural data;
- delayed releases;
- data published on different schedules.

Different facts in one family may have different AS-OF dates.

## 6.3 Event fact vs reported link

Preserve the distinction:

### EVENT FACT

What objectively happened and when.

### REPORTED LINK

What a source says is the relation between the event and another move.

Validated causality does **not** exist in this phase.

## 6.4 Epistemic status

When relevant, distinguish:

- `DECLARED`
- `OBSERVED`
- `PUBLISHED`
- `ESTIMATED`
- `INFERRED`
- `CALCULATED`
- `QUALITATIVE`
- `UNKNOWN`

Do not flatten an estimate and an official declaration into the same status.

## 6.5 Shared facts and owner

Every shared fact has a canonical owner.

If another family needs that fact:

- reference it if already available;
- if it is not yet available and technically needed, it may be established temporarily;
- keep the canonical owner attached.

The fact is still one observation, not a new independent confirmation.

Example:

`USDJPY — owner: F3`

F5 may reuse it for funding/carry without turning it into a second proof.

---

# 7. Calculated metrics

A language model must **never invent** a coefficient or percentile because the Skill asks for one.

For metrics requiring historical data, such as:

- 30-day Gold-DXY correlation;
- COT percentile;
- any rolling statistical metric;

allowed outputs are:

## A. Published value

A reliable source publishes the metric directly.

Use it with:

- window;
- AS-OF;
- provenance.

## B. Deterministic calculation

A real tool has the necessary input series and computes the value deterministically.

The LLM is not mentally estimating it.

## C. Qualitative characterization

If the exact metric is unavailable but observed co-movement supports a qualitative description:

- inverse;
- weak;
- unstable;
- recently changing;

mark it explicitly as `QUALITATIVE`.

## D. UNKNOWN

If the metric cannot be established reliably.

Never invent a plausible number.

---

# 8. FAMILY 1 — FED & RATE PRICING

## Mission

Understand the **current state and recent dynamic of US monetary policy expectations**.

No global Gold interpretation.

## A. Fed pricing

Understand:

- what the market currently prices for the next FOMC;
- relevant FedWatch probabilities;
- change since the last available trading session;
- recent evolution across roughly the last five trading sessions;
- material repricings around recent events;
- whether pricing has become more dovish, more hawkish, or broadly stable;
- the magnitude of the repricing where supported.

Important:

On a Sunday Read, do not use a naïve calendar `Δ24h`.

Use:

- last available session;
- recent trading-session dynamics;
- event-based repricing.

## B. US 2Y

Owner of the raw 2Y state/dynamic: **F1**

Understand:

- current level;
- direction;
- recent dynamic;
- rise / fall / reversal / stabilization;
- behavior around important events.

Do not yet conclude bullish/bearish Gold.

## C. Recent Fed communication

Only materially relevant communication.

Understand:

- what the Fed speaker / statement actually said;
- whether it materially clarified or changed the policy outlook;
- whether an observable repricing followed.

Keep separate:

**what the Fed said**  
vs  
**how the market repriced**

## D. Next FOMC

Understand:

- date;
- what the market currently prices;
- major known catalysts that can still change the pricing.

## Exclude

- Gold forecasts;
- price targets;
- BUY/SELL recommendations;
- stale probabilities;
- wrong FOMC meeting;
- confusion between current and old pricing;
- confusion between 2Y bond price and 2Y yield;
- duplicated article copies treated as independent evidence.

## Output

- AS-OF
- Fed pricing current state
- last-session change
- recent multi-session dynamic
- material event repricings
- US 2Y state/dynamic
- material Fed communication
- next FOMC
- important uncertainty
- `GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 9. FAMILY 2 — RATES & REAL YIELDS

## Mission

Understand the **current state and recent dynamics of US nominal and real rates, and what is carrying their movement**.

No global Gold interpretation.

## A. DFII10

Understand:

- current 10Y real yield;
- recent path;
- direction;
- trend / reversal / stabilization;
- whether the recent move is material.

## B. Nominal / real / breakeven decomposition

Understand:

- how nominal yields moved;
- how real yields moved;
- how breakevens moved;
- which component is carrying the nominal move.

Always name the breakeven tenor.

Do not silently mix maturities.

Optional sanity check when possible:

`nominal - breakeven ≈ real`

This is useful but **never blocking**.

If the inputs are unavailable, continue.

If they materially conflict, report the inconsistency.

## C. Leading maturity / curve structure

Understand whether the move is:

- front-end dominant;
- long-end dominant;
- parallel;
- mixed;
- unclear.

The raw 2Y fact belongs to F1.

F2 uses the rates complex to study:

- front-end vs long-end;
- maturity leadership;
- curve behavior.

## D. 2s10s

Understand:

- current state;
- recent direction;
- which leg is driving the move.

Use steepening / flattening terminology only when it actually clarifies the situation.

## E. Event dynamics

When useful:

- identify material dated events;
- observe how nominal / real yields reacted;
- note whether a move held or reversed.

Do not yet validate the final macro causal story.

## F. MOVE

Owner: **F2**

MOVE is Treasury implied volatility.

It is **contextual**, not mandatory every Sunday.

Use when relevant to understand unusual rates uncertainty / stress.

F5 may later reference it as a fuse without recollecting it as a new fact.

## F1 overlap

Note factually when the front-end and Fed pricing moved:

- together;
- on the same days;
- around the same events.

Do not yet declare the final driver.

## Exclude

- Gold direction;
- Gold targets;
- yield forecasts presented as facts;
- stale rates;
- price/yield confusion;
- nominal/real confusion;
- mixing TIPS real yield with nominal minus realized CPI;
- fiscal / Treasury-auction analysis unless a cross-family flag is needed;
- Gold-real-yield regime analysis as a final interpretation.

## Output

- AS-OF
- DFII10 state/path
- nominal-real-breakeven decomposition
- breakeven tenor
- leading maturity
- 2s10s state/dynamic/driving leg
- MOVE if materially relevant
- material event facts / reported links
- F1 overlap observation
- important uncertainty
- `GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 10. FAMILY 3 — USD & LIQUIDITY

## Mission

Understand the **current state and recent dynamic of the dollar and relevant USD funding/liquidity conditions**.

## A. DXY

Understand:

- direction;
- recent dynamic;
- acceleration / slowdown / reversal / range;
- material changes.

If the move is material, ask:

> is DXY strength/weakness broad or mainly driven by one major component?

Do not create a huge FX checklist.

## B. Gold-DXY 30D relationship

The document explicitly asks for this context detector.

Measure when possible using the calculated-metric rules.

Allowed:

- exact published/calculated metric;
- qualitative characterization;
- UNKNOWN.

Measuring the relationship is allowed.

A final causal conclusion is not.

## C. USDJPY

Understand:

- current state;
- recent dynamic;
- material moves;
- fast / abnormal changes where relevant.

Owner: **F3**

F5 may later reference it for carry/funding.

## D. USDCNH

Understand:

- current state;
- recent dynamic;
- material changes.

## E. USD liquidity / funding

Scope of F3:

- dollar liquidity;
- USD funding conditions;
- Fed balance-sheet related liquidity when materially relevant;
- TGA / RRP when materially relevant;
- observable USD funding tensions when materially relevant.

Do not force all of these every week.

Credit spreads belong to F4.

## Exclude

- “DXY down = Gold up” as automatic conclusion;
- dollar forecasts;
- Gold targets;
- stale information;
- yen direction confusion (`USDJPY ↓` generally means stronger JPY);
- generic “liquidity” narratives without a defined observable basis.

## Output

- AS-OF
- DXY state/dynamic
- broad vs single-leg move if material
- Gold-DXY 30D context
- USDJPY state/dynamic
- USDCNH state/dynamic
- USD funding/liquidity state/dynamic
- material event facts / reported links
- uncertainty
- `GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 11. FAMILY 4 — INFLATION / GROWTH / FISCAL / CREDIT

## Mission

Understand the **recent changes in macro, fiscal, and credit conditions that are materially relevant**.

Do not turn this family into “all macro data”.

## A. Material releases vs expectations

For relevant releases, understand:

- actual;
- consensus;
- previous;
- revision;
- dynamic/trend.

Examples can include:

- CPI;
- PCE;
- NFP;
- claims;
- ISM;
- other material releases.

But do not fetch every available release just because it exists.

### Ownership rule

The **publication itself** belongs to F4.

Example:

`CPI actual / consensus / revision`

F4 may also preserve a **reported interpretation of the release**, e.g.:

- “participants described it as more inflationary than expected.”

But the asset reactions belong to their respective families:

- Fed pricing reaction → F1
- rates / real-yield reaction → F2
- FX / DXY reaction → F3

## B. Oil

Understand when materially relevant:

- recent dynamic;
- material move vs noise;
- persistence;
- reported or observable inflation implications.

Oil owner: **F4**

If the inflation implication is expressed through breakevens, reference F2.

## C. Treasury auctions / fiscal

Owner: **F4**

Understand materially relevant auctions:

- result;
- demand;
- tail / stop-through where relevant;
- Treasury reaction;
- comparison with previous auctions when useful.

Do not mechanically fetch every auction.

## D. Credit

Understand:

- HY spreads;
- IG spreads;
- widening / tightening;
- recent dynamic;
- acceleration of stress where relevant.

Credit owner: **F4**

## Exclude

- macro forecasts presented as facts;
- “soft landing / hard landing” as unquestioned truth;
- Gold directional conclusions;
- duplicate restatement of F1/F2/F3 asset reactions as separate evidence.

## Output

- AS-OF
- material macro releases vs expectations
- revisions / trend
- reported interpretation of releases
- oil state/dynamic if relevant
- Treasury auctions/fiscal if relevant
- HY/IG credit conditions
- uncertainty
- cross-family references
- `GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 12. FAMILY 5 — FLOWS & POSITIONING

## Mission

Understand **where money is actually positioned, who is acting, why, and which positioning/funding constraints may become mechanical**.

This family has two future uses:

1. describe current market state;
2. later help evaluate asymmetry/exploitability.

During collection, only perform role #1.

## Base factual layer

### COT percentile

Understand:

- current positioning;
- historical relative position;
- recent dynamic;
- whether positioning is extreme.

Important:

COT is typically a Tuesday snapshot published Friday.

Preserve the actual measurement date.

Do not compare silently with Friday price as if they were the same timestamp.

### Open Interest

Understand:

- current state;
- recent trend;
- relationship with price.

Examples:

- price ↑ + OI ↑ → compatible with fresh participation;
- price ↑ + OI ↓ → compatible with short covering.

Do not promote these relationships into final causal truth automatically.

### ETF flows

Understand:

- inflows / outflows;
- recent dynamic;
- acceleration / slowdown;
- divergence with price where relevant.

### Options

Understand when available:

- GVZ;
- skew;
- spot-vol relationship;
- whether observed demand looks more like speculation or hedging.

Sentiment is not the same as positioning.

Prefer evidence of money actually committed.

---

## Q1 — FLOW

**What capital is entering/leaving, who appears to be acting, and why now?**

Try to identify:

- buyer/seller category where evidence supports it;
- direction of capital;
- dated trigger where identifiable.

Never invent an actor just to fill the box.

---

## Q2 — FORCED BUYER / SELLER

**Is there a participant mechanically forced to act independent of opinion?**

Examples can include:

- CTA;
- shorts covering;
- dealers hedging;
- central banks;
- benchmark/career constraints.

These are examples, not a mandatory checklist.

When identifiable, note:

- what creates the constraint;
- when / under what condition the constraint may end.

If not identifiable:

`UNKNOWN`

is a valid answer.

---

## Q3 — FUNDING

**Are leveraged positions facing a material change in funding cost, funding currency, or funding stress?**

Reuse facts owned elsewhere.

Examples:

- USDJPY → owner F3;
- credit spreads → owner F4;
- MOVE → owner F2.

### BoJ / JGB

When used specifically for yen funding / carry / fuse analysis:

owner = **F5**

Search only when materially relevant.

---

## Q4 — FUSE

**Is there an observable trigger capable of forcing an unwind?**

Potential examples:

- sharp USDJPY move;
- BoJ shift;
- VIX stress;
- credit stress;
- JGB stress;
- other clearly identifiable mechanical triggers.

### VIX

Owner: **F5** when used as funding/fuse/risk-stress input.

Do not force a fuse every week.

`NONE CLEARLY IDENTIFIABLE / UNKNOWN`

is valid.

---

## Q5 — MARGINAL FLOW vs PRICE

**Is price still accompanied by fresh capital, or is marginal flow fading?**

Potential divergences:

- price ↑ / OI ↓;
- price ↑ / ETF flow weak;
- physical demand not confirming;
- options/FOMO;
- other observable divergence.

Keep the time windows visible.

Do not compare stale COT with fresh price as if they were synchronous.

### Physical premiums / discounts

Owner: **F6**

F5 references them when useful for Q5.

---

## Output

- AS-OF per metric
- COT state/dynamic
- OI state/dynamic
- ETF flows
- options/GVZ/skew/spot-vol if available
- Q1 flow
- Q2 forced buyer/seller
- Q3 funding
- Q4 fuse
- Q5 marginal-flow/price divergence
- time-window warnings
- uncertainty
- cross-family references
- `FINAL ASYMMETRY READ: NOT YET PERFORMED`
- `GLOBAL GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 13. FAMILY 6 — STRUCTURAL

## Mission

Understand the **slow structural backdrop that can alter long-term demand for Gold**.

Do not force weekly novelty into slow-moving data.

## A. Central-bank buying

Understand:

- latest available purchases;
- trend;
- acceleration / slowdown;
- important buyers where known.

Distinguish:

- `DECLARED`
- `ESTIMATED`
- `INFERRED`
- `UNKNOWN`

Do not present WGC-style estimates as official declarations.

## B. China / physical demand

Understand when available:

- recent physical demand;
- trend;
- premiums / discounts;
- imports;
- meaningful behavior change.

### SGE premiums / discounts

Owner: **F6**

F5 may reference these later for marginal-flow divergence.

## C. Dedollarization

Do not treat the narrative itself as evidence.

Prefer observable developments:

- reserve behavior;
- sovereign buying;
- actual policy;
- settlement changes;
- concrete reserve diversification;
- other materialized actions.

Keep:

`NARRATIVE`

separate from:

`OBSERVABLE ACTION`

## D. Debasement theme

Understand:

- whether the theme is genuinely active;
- which observable facts support it;
- whether it is strengthening or weakening.

Avoid ideological language.

## No-material-change rule

Structural data are often monthly / quarterly and delayed.

A fully valid output is:

`NO MATERIAL CHANGE SINCE LAST KNOWN DATA`

Do not fabricate a weekly update merely because the Sunday Read runs weekly.

## Exclude

- ideological claims;
- “fiat is dead” narratives;
- BRICS claims without concrete evidence;
- 5–10 year forecasts presented as current fact;
- stale structural data presented as new;
- tactical Gold conclusion.

## Output

- AS-OF
- central-bank demand
- declared vs estimated status
- China / physical
- dedollarization observable actions
- debasement theme
- no-material-change status where appropriate
- uncertainty
- `TACTICAL GOLD INTERPRETATION: NOT YET PERFORMED`

---

# 14. Cross-family ownership registry

Use this as the default ownership map.

| Fact / topic | Canonical owner | May be referenced by |
|---|---|---|
| FedWatch / next-FOMC pricing | F1 | F2, F4, F5 |
| Raw US 2Y state/dynamic | F1 | F2 |
| DFII10 / real yields | F2 | F1, F4, F5 |
| Breakevens | F2 | F4 |
| 2s10s / curve structure | F2 | F4 |
| MOVE | F2 | F5 |
| DXY | F3 | F1, F4 |
| USDJPY | F3 | F5 |
| USDCNH | F3 | F4, F6 |
| USD funding/liquidity | F3 | F5 |
| CPI/PCE/NFP/ISM/etc. releases | F4 | F1, F2, F3 |
| Oil | F4 | F2, F5 |
| Treasury auctions | F4 | F2 |
| HY / IG credit spreads | F4 | F5 |
| COT | F5 | later asymmetry |
| OI | F5 | later asymmetry |
| ETF flows | F5 | later asymmetry |
| GVZ / skew / options state | F5 | later asymmetry |
| BoJ/JGB when used for carry/fuse | F5 | — |
| VIX when used as fuse/stress | F5 | — |
| Central-bank Gold demand | F6 | F5 |
| SGE physical premium/discount | F6 | F5 |
| Dedollarization | F6 | later structural context |
| Debasement theme | F6 | later structural context |

Ownership exists to prevent duplicate collection and duplicate “proof”.

Ownership does **not** mean other families are forbidden to reference the fact.

---

# 15. What this phase must NOT do

After the weekly recap and six Family Evidence Cards are finished, stop.

Do **not yet**:

- identify the final dominant driver;
- force a causal chain to Gold;
- assign a market regime;
- produce a directional Gold call;
- build the final Market Story;
- decide CLEAR / LIKELY / MIXED;
- build final scenarios;
- generate the final A-read;
- decide LATE;
- perform final invalidation logic.

Those belong to the reasoning manual.

---

# 16. Handoff to the reasoning manual

When the research phase is complete, the next instruction is:

> Load and follow `GOLD_MACRO_REASONING_MANUAL_SUNDAY.md`.

Inputs passed forward:

1. Weekly Gold Recap;
2. Family 1 — Fed & Rate Pricing;
3. Family 2 — Rates & Real Yields;
4. Family 3 — USD & Liquidity;
5. Family 4 — Inflation / Growth / Fiscal / Credit;
6. Family 5 — Flows & Positioning;
7. Family 6 — Structural;
8. source/provenance metadata;
9. explicit uncertainties / gaps;
10. reported links kept separate from event facts.

The reasoning manual then handles:

- context by horizon;
- regimes as flexible synthesis;
- competing hypotheses;
- dominant-driver logic;
- anti-double-counting;
- transmission chains;
- contradictions;
- anomalies;
- priced-in logic;
- Market Story;
- qualitative orientation;
- asymmetry;
- scenarios;
- invalidations;
- final Sunday output.

---

# 17. Final principle

The research agent's job is not to be clever.

Its job is to make the next model **well-informed**.

A good collection phase is one where the later reasoning model can clearly see:

- what is known;
- what changed;
- what is stale;
- what is estimated;
- what is missing;
- what was merely reported;
- what is actually observed;
- where each fact came from;
- which family owns it.

Then, and only then, the reasoning phase begins.
