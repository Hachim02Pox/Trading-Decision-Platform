# F10 — Positioning & Participation Methodology

F10 answers one repeatable question: **what do observable futures positioning and GLD participation look like now?** It does not decide whether to enter or exit a Gold trade.

## Observable channels and limits

- **CFTC Managed Money** is the futures-positioning channel. It reports regulatory trader classifications for COMEX Gold, not a single strategy or intention.
- **SPDR GLD** is the ETF-participation channel. Its issuer-reported physical holdings describe one major ETF, not all Gold ETFs or the entire physical market.

Together they still do not directly observe London OTC positioning, central banks, Asian physical demand, producer hedging, all options dealers, or every institutional investor.

## Deterministic pipeline

Every displayed interpretation follows:

`real facts → deterministic calculation → deterministic state → fixed EN/FR template`

F10 does not use an LLM. Missing required facts produce an unavailable state; the terminal never guesses a neutral interpretation.

## CFTC Managed Money

`net % of open interest = (managed-money longs − managed-money shorts) / total open interest × 100`

- **Position stock:** current net percentage.
- **Position change:** current net percentage minus the previous report's net percentage, in percentage points.
- **156-week extension:** percentage of observations in the trailing 156-report window at or below the current net percentage.

A percentile is a historical rank. It is not a probability and does not measure how many future participants are available.

## GLD physical participation

Only valid issuer observations are used. Explicit holidays and missing rows are excluded; there is no forward-fill and no fabricated zero-flow day.

`change N = latest tonnes − tonnes N valid observations earlier`

- 1 observation: latest physical impulse.
- 5 observations: short-horizon participation.
- 20 observations: medium-horizon participation.

The participation state compares the signs of the 5- and 20-observation changes: persistent expansion, persistent contraction, short-term reversal toward expansion, short-term reversal toward contraction, or mixed/flat. Existing exact-sign methodology is retained because issuer tonnage is reported with sufficient precision and no validated alternative tolerance exists.

## Flow intensity and extension

**Daily Flow Intensity** is the Z-score of the latest one-observation holdings change against the latest 60 daily holdings changes:

`z = (latest daily change − 60-change mean) / 60-change standard deviation`

It measures whether the latest physical change is normal or unusually large. It is not long-term crowding or a reversal forecast.

**20-Obs. Flow Extension** ranks the current 20-valid-observation holdings change against comparable changes over the trailing 756 valid sessions:

`percentile = comparable 20-observation changes at or below current / 756 × 100`

Participation and extension are deliberately separate. Recent 5-observation contraction can coexist with a historically large positive 20-observation extension.

## Price / flow relationship

GLD price return and GLD physical-holdings change are compared over the same 20-valid-observation horizon:

- both positive: flow confirms price strength;
- price positive, holdings negative: negative ETF-flow divergence;
- price negative, holdings positive: positive ETF-flow divergence;
- both negative: flow confirms price weakness;
- either flat or unavailable: neutral/non-confirmation or unavailable as appropriate.

“Confirms” means moves in the same direction. It does not mean ETF participation caused the price move.

## Participation breadth and timing

Breadth compares deterministic direction states, never a numeric aggregate score:

| Futures weekly change | GLD 5-observation change | State |
|---|---|---|
| adding | expanding | broad participation |
| adding | contracting | futures-led participation |
| reducing | expanding | ETF-led participation |
| reducing | contracting | broad recent reduction |
| flat/mixed | any | mixed/partial participation |

CFTC is weekly and GLD is daily. Each channel retains its own `As of` date and horizon; breadth does not claim both groups acted on the same day. If either input is stale, unavailable, or non-real, breadth is unavailable.

## Extension is not an entry signal

Historically extreme positioning can remain extreme for a long time. Its relevance is conditional: a later catalyst and an unusual market response may make an unwind risk more informative, but F10 does not compute a failure trade or a capacity/fuel score.

The broader workflow is:

`macro regime → F10 positioning/participation context → catalyst → market response → execution analysis`
