# Règles mécaniques des KPI et des familles

Ce document décrit **ce qui est actuellement codé** dans le moteur mécanique du cockpit Marché / Décision (`apps/backend/src/intelligence/mechanical/`). C'est le référentiel à relire avant toute modification de couleur, de libellé, de seuil ou de relation avec l'or.

Il ne constitue pas une recommandation d'investissement. Une relation marquée « mécanique » décrit un canal économique *toutes choses égales par ailleurs* ; elle ne garantit jamais la direction future de l'or.

## 0. Modèle à trois couches

1. **Registre de règles** (`intelligence/mechanical/rules.ts`) — une entrée statique par KPI id (F2 à F12 ; F13 n'a pas de `CanonicalKpi`). Chaque entrée déclare :
   - `mode` : `OBSERVATION_DELTA` (comparer les deux derniers relevés distincts d'un **niveau**), `CURRENT_SIGN` (le KPI **est déjà** une variation — DXY Today %, MM WoW Δ, GLD Holdings Δ — on lit son signe directement, jamais recomparé à un relevé antérieur), `COMPOSITE` (uniquement au niveau famille, réservé au composite F3), ou `CONTEXTUAL` (aucun canal mécanique fixe défendable — toujours `CONTEXTUAL`, par construction).
   - `supportiveDirection` : `UP` ou `DOWN` — quel sens de la valeur du KPI est favorable à l'or. `null` uniquement en mode `CONTEXTUAL`.
   - `channelId` : le canal économique partagé (voir §2), ou `null` si le KPI ne participe à aucune agrégation familiale.
2. **Évaluateur** (`evaluateKpiMechanicalRead.ts`) — résout une règle contre les données réelles courantes d'un KPI et produit une `MechanicalEvaluation` (previous/current/delta/status/read), jamais une couleur inventée.
3. **Agrégation par famille** (`familyAggregation.ts` + `families/{f2,f3,f6,f10}.ts`) — combine les évaluations des KPI d'un même canal, puis les canaux entre eux, pour produire `FamilyMechanicalRead`.

`attachMechanicalReads.ts` est le seul point d'entrée : appelé une fois, à la fin de `cache/snapshotCache.ts#getMarketSnapshot`, après résolution des données réelles et de `previousFetch`. C'est l'**unique** endroit qui décide de la couleur d'une cellule cockpit — ni la couche IA (mock ou réelle), ni le frontend, ne recalculent jamais cette couleur.

## 1. Règle commune : avant → maintenant

Chaque KPI réel conserve la dernière observation distincte avant un nouveau fetch (`intelligence/cloud/kpiHistory.ts`, inchangé par ce moteur — déjà correct).

- À gauche : valeur du fetch précédent (`avant`).
- À droite : valeur du fetch actuel (`maintenant`).
- La flèche indique seulement le sens arithmétique de la variation.
- À la première observation, en absence de valeur précédente, aucune direction n'est attribuée (`INSUFFICIENT_HISTORY` → `CONTEXTUAL`).
- Une valeur identique après arrondi (`kpi.decimals`) reste `CONTEXTUAL` (`NO_CHANGE`) ; ni favorable ni défavorable.
- Une donnée indisponible reste `INDISPONIBLE` (`UNAVAILABLE` → `CONTEXTUAL`) : aucune valeur n'est inventée.
- Un changement d'unité entre les deux relevés (cas défensif) rend la comparaison `NON_COMPARABLE` → `CONTEXTUAL`.

**Important — deux familles de KPI, deux lectures différentes :**

- Un KPI **niveau** (`OBSERVATION_DELTA` — ex. 10Y Real, DXY niveau) compare `avant` et `maintenant`.
- Un KPI **delta** (`CURRENT_SIGN` — ex. DXY Today %, MM WoW Δ, GLD Holdings Δ) **est déjà** une variation : sa propre valeur EST le signal, jamais recomparée à un relevé antérieur. Comparer un delta à son delta précédent serait un delta-de-delta — c'est exactement le bug que ce moteur corrige (l'ébauche précédente comparait Today % à son propre historique).

## 2. Couleur d'un KPI

- **`OBSERVATION_DELTA`** : `EVALUATED` si les deux valeurs (arrondies à `kpi.decimals`) diffèrent et sont de même unité → lecture selon `supportiveDirection` (`UP` : hausse = FAVORABLE ; `DOWN` : hausse = DÉFAVORABLE). Sinon `NO_CHANGE` / `INSUFFICIENT_HISTORY` / `NON_COMPARABLE` / `UNAVAILABLE` → `CONTEXTUAL`.
- **`CURRENT_SIGN`** : lit `kpi.value` directement. `0` → `NO_CHANGE`/`CONTEXTUAL`. Sinon `EVALUATED` selon `supportiveDirection`. `UNAVAILABLE`/valeur `null` → `CONTEXTUAL`.
- **`CONTEXTUAL`** : toujours `CONTEXTUAL_BY_DESIGN` → `CONTEXTUAL`, quelle que soit la valeur.

Le KPI expose `mechanicalGoldRead` (la couleur) et `mechanicalEvaluation` (previous/current/delta/status/mode/channel — l'audit complet, visible dans le tiroir KPI).

## 3. Couleur d'une famille

Seules F2, F3, F6 et F10 ont une agrégation familiale documentée — toutes les autres (F4, F5, F7, F8, F9, F11, F12) restent `CONTEXTUAL`/`NOT_APPLICABLE` : **jamais** de vote naïf compte-les-KPI à travers une famille.

La règle partagée (`combineChannelReads`), réutilisée à chaque niveau de combinaison :

1. On ne retient que les canaux dont la lecture n'est pas `CONTEXTUAL`.
2. Aucun canal disponible → `CONTEXTUAL` / `NO_CHANNEL_AVAILABLE`.
3. Un seul canal disponible → sa lecture gagne / `SINGLE_CHANNEL_AVAILABLE`.
4. Tous les canaux disponibles s'accordent → cette lecture / `CHANNELS_AGREE`.
5. Ils divergent → `CONTEXTUAL` / `CHANNELS_DISAGREE`.

Plusieurs KPI mesurant le **même** phénomène économique (ex. DXY Level + Today % + 5D % = un seul canal USD) sont d'abord combinés ENTRE EUX via cette même règle pour produire une lecture de canal unique, avant d'être combinés aux autres canaux — un canal ne compte donc jamais deux fois (`contributingChannels` ne liste jamais plus d'entrées que de canaux distincts réellement utilisés).

## 4. Table des canaux et directions

| Famille | Canal | KPI ids | Mode | Sens favorable (`supportiveDirection`) |
|---|---|---|---|---|
| F2 | `REAL_YIELDS` (PRIMAIRE) | f2-10y-real | `OBSERVATION_DELTA` | `DOWN` (taux réel qui baisse = favorable) |
| F2 | `NOMINAL_2Y` (secondaire) | f2-2y | `OBSERVATION_DELTA` | `DOWN` |
| F2 | `NOMINAL_10Y` (repli) | f2-10y | `OBSERVATION_DELTA` | `DOWN` |
| F3 | `POLICY_RATES` | f3-target-lower, f3-target-upper | `OBSERVATION_DELTA` | `DOWN` (fourchette qui baisse = favorable) |
| F3 | `POLICY_RATES` (composite) | — (niveau famille, `ruleId: "f3-expected-move"`) | `COMPOSITE` | dérivé du composite (voir §6) |
| F6 | `USD` | f6-dxy-recon-level | `OBSERVATION_DELTA` | `DOWN` |
| F6 | `USD` | f6-dxy-recon-today, f6-dxy-recon-5d | `CURRENT_SIGN` | `DOWN` |
| F10 | `FUTURES_POSITIONING` | f10-mm-net-pct | `OBSERVATION_DELTA` | `UP` |
| F10 | `FUTURES_POSITIONING` | f10-mm-wow-pp | `CURRENT_SIGN` | `UP` |
| F10 | `ETF_FLOWS` | f10-etf-holdings | `OBSERVATION_DELTA` | `UP` |
| F10 | `ETF_FLOWS` | f10-etf-delta | `CURRENT_SIGN` | `UP` |

Tout le reste (BE10, 5Y5Y, 2s10s, f3-path-6m, f3-repricing, USD State, MM percentile, ETF change 5/20 obs., Flow Z, Flow Extension, GLD returns, tous F4/F5/F7/F8/F9/F11, F12-quarterly-demand) → `channelId: null`, `mode: "CONTEXTUAL"`. `f12-cb-net-buying` garde une entrée `OBSERVATION_DELTA`/`UP` sans canal dédié (pour la complétude du registre) mais reste `UNAVAILABLE` en pratique (NO_SOURCE).

**Correction de bug par rapport à l'ébauche précédente (non commitée) :** Today % portait `support` et 5D % portait `adverse` pour le **même** instrument (DXY) — contradictoire. Les deux sont désormais `DOWN`, cohérents avec le niveau : un dollar plus fort est mécaniquement défavorable à l'or, quel que soit l'horizon regardé.

**Choix documentés, non chiffrés explicitement par le spec produit :** le sens `UP` pour F10 (position nette / avoirs ETF qui montent = favorable) est la convention standard du secteur, pas une valeur fournie par le produit — à réviser si une source normative apparaît.

## 5. Règles par famille et KPI

### F2 — Taux

Real Yield (canal `REAL_YIELDS`, PRIMAIRE) pilote la famille dès qu'il résout une lecture non contextuelle, combiné à 2Y (`NOMINAL_2Y`, SECONDAIRE) : accord → cette direction ; Real Yield seul (2Y contextuel) → sa direction gagne ; désaccord → `CONTEXTUAL`. Si Real Yield lui-même est inexploitable (`NO_CHANGE`/`INSUFFICIENT_HISTORY`/`UNAVAILABLE`/`NON_COMPARABLE`), repli sur 2Y + 10Y nominal (`NOMINAL_10Y`) avec la même logique accord/désaccord/seul-disponible. BE10, 5Y5Y et 2s10s restent `CONTEXTUAL` en permanence : contexte et décomposition, jamais de canal.

### F3 — Fed / anticipations de taux

`f3-target-lower`/`f3-target-upper` partagent **une seule** évaluation `POLICY_RATES` (calculée une fois depuis `lower`, copiée telle quelle sur `upper` — ils bougent ensemble comme une seule décision FOMC). Combiné avec le **composite expected-move** (voir §6) via la même règle de combinaison partagée : accord, seul disponible, ou désaccord → `CONTEXTUAL`. `f3-path-6m`/`f3-repricing` sont des signaux `OBSERVATION_DELTA` séparés, **hors** canal `POLICY_RATES` (contexte, jamais agrégés dans la lecture familiale) — de toute façon en permanence `INDISPONIBLE` (NO_SOURCE), voir `real/f3Fed.ts`.

### F4 — Inflation

Core CPI MoM/YoY, Headline CPI MoM/YoY, Core PCE MoM/YoY, Headline PCE YoY, Core CPI 3M annualisé et PPI Final Demand MoM sont tous `CONTEXTUAL`. Ils décrivent l'impulsion inflationniste et doivent être lus avec la réaction F3/F2/F6. Une hausse d'inflation n'est jamais codée comme automatiquement favorable ou défavorable à l'or.

### F5 — Emploi / croissance

Unemployment Rate, Payrolls (latest et moyenne 3 mois), claims initiales/continues/moyenne 4 semaines, Average Hourly Earnings, révision 2 mois, ISM services/manufacturing et GDPNow sont `CONTEXTUAL`. Ils servent à qualifier croissance, marché du travail et réaction probable de la Fed ; aucune direction or n'est produite par leur simple variation.

### F6 — USD / change

DXY (niveau), Today % et 5D % forment un seul canal `USD` (voir §4) — combinés, jamais votés séparément. USD State reste `CONTEXTUAL` : c'est un régime descriptif (« Divergent : plus faible en intraday, plus ferme sur 5 jours »), pas un membre du canal.

### F7 — Risque / crédit / volatilité

VIX, VIX 1D, MOVE, MOVE 1D, HY OAS, HY OAS 1D et IG OAS sont tous `CONTEXTUAL`. Ils mesurent stress et amplitude anticipée, pas une direction automatique de l'or. Une hausse de stress peut coïncider avec refuge pour l'or ou avec ventes forcées : confirmation par taux réels, USD et liquidité requise.

**MOVE :** le KPI reste `NO_SOURCE`/indisponible dans le cockpit tant qu'une source de niveau certifiée n'est pas intégrée. Le clic ouvre le graphique interne MOVE, qui utilise la série Yahoo `^MOVE` comme série historique non officielle, avec avertissement visible. Ce graphique ne transforme pas le KPI en donnée certifiée ni en canal mécanique.

### F8 — Liquidité / financement

Reserves, Reserves WoW, TGA, TGA daily, SOFR−IORB et EFFR−IORB sont `CONTEXTUAL` : mesures de plomberie monétaire, à interpréter avec F7/F9 et la transmission taux/USD.

Le seul état discret est **Funding Microstate** :

- `NORMAL` si `abs(SOFR − IORB) ≤ 5 pb` ;
- `ANOMALOUS` si `abs(SOFR − IORB) > 5 pb` ;
- indisponible si le spread ne peut pas être calculé.

`NORMAL`/`ANOMALOUS` n'est pas un signal haussier ou baissier pour l'or : il diagnostique seulement une pression de financement inhabituelle. Ce KPI reste `CONTEXTUAL` dans le moteur mécanique.

### F9 — Treasury / fiscal

Net Marketable Borrowing, révision de l'estimation, high yield d'adjudication, bid-to-cover et part des indirects sont `CONTEXTUAL`. Éléments événementiels, à comparer au when-issued, à l'historique et à la réaction des taux ; aucun sens or automatique n'est codé.

### F10 — Flux / positionnement

`FUTURES_POSITIONING` (MM net % + MM WoW Δ, combinés) et `ETF_FLOWS` (GLD holdings + GLD Holdings Δ, combinés) sont deux canaux indépendants, combinés entre eux avec la même règle partagée. MM 156W Percentile reste `CONTEXTUAL`, hors canal. Les autres KPI ETF (change 5/20 obs., 60-obs. Flow Z, 20-Obs. Flow Extension, GLD Price Return 5/20 obs.) restent `CONTEXTUAL` : confirmation ou divergence, jamais causalité automatique.

### F11 — Options or / volatilité

GVZ, variation 1 jour et variation 5 jours sont `CONTEXTUAL`. GVZ est explicitement un **proxy** de la volatilité des options GLD, pas le CVOL or. La volatilité mesure le mouvement anticipé, pas son sens.

### F12 — Or physique / structurel

Central Bank Net Buying (trimestriel) garde une entrée de registre `OBSERVATION_DELTA`/`UP` pour la complétude, mais reste `UNAVAILABLE`/NO_SOURCE en pratique — aucune API gratuite certifiée n'est branchée, donc aucune lecture mécanique n'est jamais produite. Total Gold Demand (trimestriel) est `CONTEXTUAL`.

### F13 — Événements / catalyseurs

F13 n'a pas de `CanonicalKpi` scalaire : pas d'entrée dans le registre, pas de `mechanicalFamilyRead` (le champ est absent, pas `NOT_APPLICABLE`). Il affiche les événements USD à fort impact de la semaine, uniquement comme calendrier de risque.

## 6. Composite F3 — mouvement de politique attendu

`computeExpectedMoveComposite` (`families/f3.ts`) calcule un mouvement en points de base pondéré par les probabilités de la distribution Fed-funds-futures (`FedRateDistribution`), relatif au **milieu de la fourchette cible actuelle** (`f3-target-lower`/`upper`) :

```
moveBp(bucket)      = (milieu(bucket.targetRangeLabel) − milieu(fourchette actuelle)) × 100
ExpectedMoveBp(now)    = Σ bucket.probability          / 100 × moveBp(bucket)
ExpectedMoveBp(before) = Σ bucket.probabilityPreviousDay / 100 × moveBp(bucket)
delta                  = ExpectedMoveBp(now) − ExpectedMoveBp(before)
```

`delta < 0` (plus de baisses anticipées qu'hier) → `SUPPORTIVE`. `delta > 0` → `ADVERSE`. `delta === 0` → `NO_CHANGE`/`CONTEXTUAL`.

**Garde-fou `INCOMPLETE_DISTRIBUTION` :** si la somme des probabilités (aujourd'hui OU hier) s'écarte de 100 % de plus de ±2 points de pourcentage (tolérance documentée, choisie faute de seuil fourni par le spec produit), le composite résout `INCOMPLETE_COMPOSITE` → `CONTEXTUAL`, **jamais** de renormalisation silencieuse. Un bucket sans `probabilityPreviousDay` (un ou plusieurs) → `INSUFFICIENT_HISTORY` → `CONTEXTUAL`. `probabilityPreviousDay` est déjà correctement peuplé par bucket dans `intelligence/cloud/fedProbabilityHistory.ts` — aucune modification n'a été nécessaire là.

## 7. Lecture IA cloud

À chaque nouveau fetch distinct, le backend transmet à l'IA cloud les deux dernières valeurs disponibles de chaque KPI et de la famille concernée (`intelligence/cloud/cloudKpiRead.ts`). Cette lecture explique la dynamique déjà déterminée par le moteur mécanique — `finalGoldRead` y reflète toujours `mechanicalGoldRead` exactement, jamais un jugement indépendant. La demande est limitée à une explication mécanique de l'évolution observée ; elle n'utilise pas le web pour cette lecture et ne doit produire ni prévision, ni conseil, ni changement de couleur. En cas d'échec réseau/modèle, la comparaison avant → maintenant et les règles ci-dessus continuent de fonctionner sans IA.

Pour l'ensemble multi-modèle (mock et pilote réel, `docs/KPI_INTELLIGENCE_ARCHITECTURE.md` §2/§18/§19), `finalGoldRead` peut **dégrader** un `mechanicalGoldRead` actif vers `CONTEXTUAL` (rare, documenté explicitement — voir `MockScenario.forceContextualDespiteMechanical`), mais ne peut **jamais l'inverser** (SUPPORTIVE ↔ ADVERSE) — invariant vérifié structurellement par `validateInterpretation.ts`.

## 8. Sources et statut

`RÉEL` signifie qu'une observation vient d'un fournisseur intégré ; `MOCK` est une fixture de développement ; `INDISPONIBLE` signifie qu'aucune valeur honnête n'est affichable. Un graphique source non officielle est identifié comme tel et ne doit pas être assimilé à une donnée officielle.

`UNAVAILABLE` (mécanique) → `CONTEXTUAL` : une donnée manquante n'est jamais colorée FAVORABLE/DÉFAVORABLE par défaut. `STALE` (fraîcheur) est un concept séparé de la couleur mécanique — une donnée `STALE` garde sa dernière lecture mécanique valide, elle ne repasse pas automatiquement à `CONTEXTUAL` du seul fait de son âge.
