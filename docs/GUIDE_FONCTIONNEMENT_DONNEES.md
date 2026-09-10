# Guide de fonctionnement des donnees

Ce document explique comment le projet `trading-decision-platform` obtient ses donnees, quand il appelle chaque source, comment les reponses deviennent des KPI, et ce que l'interface affiche en cas de succes, d'erreur ou d'absence de source.

Il decrit le code actuel. Il ne remplace pas les specifications metier :

- [AI_WORKFLOW.md](../AI_WORKFLOW.md) est la regle de fonctionnement generale.
- [KPI_INTELLIGENCE_ARCHITECTURE.md](KPI_INTELLIGENCE_ARCHITECTURE.md) decrit la separation mock/reel et l'intelligence.
- [PROVIDER_SETUP.md](PROVIDER_SETUP.md) decrit l'installation et les smoke tests des fournisseurs.
- [MVP_COCKPIT_CONTRACT.md](MVP_COCKPIT_CONTRACT.md) decrit le contrat du cockpit.
- [DONNEES_MARCHE_DECISION.md](DONNEES_MARCHE_DECISION.md) reprend le meme sujet organise par famille puis par KPI (comme le cockpit Marche/Decision lui-meme), avec le detail exact de `observationAt`/`retrievedAt` et les formules de chaque valeur derivee — a lire en complement de ce guide-ci pour comprendre pourquoi un KPI precis affiche telle valeur a tel instant.

---

## 1. L'idee generale

Le projet est un terminal de decision sur l'or. Il assemble plusieurs familles de donnees macro et marche :

| Famille | Sujet | Pourquoi cela compte pour l'or |
|---|---|---|
| F2 | Taux et courbe Treasury | Le cout d'opportunite et la transmission des taux reels/ nominaux |
| F3 | Fed et politique monetaire | Le niveau des taux, la distribution des attentes et le repricing |
| F4 | Inflation | Les canaux inflation, debasement et reaction Fed |
| F5 | Emploi et croissance | La vigueur de l'economie et la reaction probable de la Fed |
| F6 | Dollar | Le canal USD/or, avec prudence en regime de stress |
| F7 | Risque et credit | Volatilite, spreads HY/IG et regime de marche |
| F8 | Liquidite et funding | TGA, reserves, SOFR/EFFR et tension de financement |
| F9 | Tresor et financement fiscal | Adjudications Treasury, demande de duration et QRA |
| F10 | Positionnement et participation | CFTC Managed Money, holdings GLD et flux physiques |
| F11 | Volatilite de l'or | GVZ et sa variation |
| F12 | Demande physique | Donnees de demande et flux institutionnels, actuellement indisponible selon les KPI |
| F13 | Calendrier et catalyseurs | Dates de releases qui peuvent changer la lecture |

Le backend construit un `MarketSnapshot`. Ce snapshot contient des familles et leurs KPI. Le frontend ne calcule pas la verite metier : il affiche les contrats renvoyes par le backend.

Le flux general est :

```text
Navigateur
   |
   | GET /api/market/snapshot
   v
Backend Express
   |
   | cache par source + TTL
   v
Providers officiels / externes
   |
   | normalisation + calculs deterministes
   v
MarketSnapshot canonique
   |
   v
Frontend: cockpit, charts, calendar, news, drawers
```

L'intelligence IA est un flux separe : elle lit le contexte et les observations deja obtenus. Elle ne remplace pas les donnees canoniques.

---

## 2. Demarrage : ce qui se passe quand le backend part

Fichier central : [apps/backend/src/server.ts](../apps/backend/src/server.ts).

1. Le backend charge `apps/backend/.env` via Node `--env-file=.env` dans les scripts de developpement et de production.
2. [apps/backend/src/config/env.ts](../apps/backend/src/config/env.ts) lit les variables une seule fois avec `loadAppConfig()`.
3. Une cle manquante ne fait pas planter le serveur. Le provider concerne devient `null`, puis son statut est `NOT_CONFIGURED`.
4. Le backend demarre Express sur `PORT`, par defaut `4001`.
5. `main()` construit un premier snapshot et initialise l'intelligence.
6. Il n'existe pas de scheduler general qui rafraichit toutes les familles en permanence.
7. Pour les familles marche, une requete qui arrive apres expiration du cache declenche le fetch necessaire.
8. Les routes de calendrier ont une garde persistante en base pour respecter les quotas de JBlanked.
9. Les news Finnhub ont leur propre polling de 60 secondes, uniquement quand le flux news est utilise.

### Regle importante : MOCK versus REAL

`DATA_MODE` vaut `MOCK` par defaut.

- `MOCK` : le cockpit peut fonctionner avec les fixtures de [apps/backend/src/mock/fixtures.ts](../apps/backend/src/mock/fixtures.ts). Les appels reels lourds d'intelligence et de recherche ne sont pas utilises.
- `REAL` : les familles qui disposent d'un override reel utilisent les providers reels. Les providers manquants donnent `UNAVAILABLE`, pas une valeur inventee.
- Les smoke tests de providers sont des tests de connectivite explicites. Leur presence dans le registre ne signifie pas qu'ils alimentent automatiquement un KPI.
- Le mode reel ne transforme pas automatiquement chaque provider de recherche en source canonique.

Le detail de la porte est dans [apps/backend/src/intelligence/dataMode.ts](../apps/backend/src/intelligence/dataMode.ts) et [apps/backend/src/real/buildRealOverrides.ts](../apps/backend/src/real/buildRealOverrides.ts).

---

## 3. Le contrat d'un KPI

Le contrat TypeScript se trouve dans [packages/contracts/src/index.ts](../packages/contracts/src/index.ts).

Un KPI canonique porte notamment :

| Champ | Signification |
|---|---|
| `id` | Identifiant stable, par exemple `f2-10y` |
| `familyId` | Famille, par exemple `F2` |
| `label` | Libelle affiche |
| `value` | Valeur numerique ou `null` si indisponible |
| `unit` | Unite : `%`, `bp`, `USD`, tonnes, etc. |
| `decimals` | Precision d'affichage |
| `provenance` | `observed`, `derived`, `estimated` ou `ai` |
| `dataState` | `REAL`, `MOCK` ou `UNAVAILABLE` |
| `quality` | `current`, `stale` ou `unavailable` |
| `sourceTag` | Source principale du KPI |
| `sourceTags` | Sources multiples lorsque necessaire |
| `observationAt` | Date/heure de l'observation economique |
| `retrievedAt` | Date/heure du fetch backend |
| `unavailableReason` | `NO_SOURCE`, `FETCH_FAILED` ou `INSUFFICIENT_HISTORY` |

### Les trois etats d'absence

- `NO_SOURCE` : le projet n'a pas de source acceptee pour ce KPI.
- `FETCH_FAILED` : une source existe mais le fetch, le parsing ou l'authentification a echoue.
- `INSUFFICIENT_HISTORY` : la source repond, mais il n'y a pas assez d'historique pour calculer le KPI.

Une erreur ne doit pas etre convertie en zero. Une ancienne valeur ne doit pas etre conservee silencieusement comme si elle etait actuelle.

### Fraicheur

Les KPI reels ne sont pas juges avec un seuil uniforme d'une heure. [apps/backend/src/cache/snapshotCache.ts](../apps/backend/src/cache/snapshotCache.ts) utilise une cadence adaptee :

| Cadence economique | Seuil approximatif avant `stale` |
|---|---:|
| Daily | 4 jours |
| Weekly | 12 jours |
| Monthly | 45 jours |
| Event | 6 heures |

Cela evite de marquer un CPI mensuel comme stale une heure apres son fetch, ou une donnee Treasury du vendredi comme stale le week-end.

---

## 4. Les appels de donnees de marche

Cette section repond a quatre questions pour chaque source :

1. Quelle URL est appelee ?
2. Quand est-elle appelee ?
3. Quel KPI l'utilise ?
4. Que se passe-t-il si elle echoue ?

### 4.1 Treasury Fiscal Data et courbes Treasury

Code : [apps/backend/src/providers/treasury.ts](../apps/backend/src/providers/treasury.ts).

#### URLs

- Auctions : `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query`
- Upcoming auctions : `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/upcoming_auctions`
- Treasury Account Statement : `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts/operating_cash_balance`
- Courbe nominale : CSV officiel `daily_treasury_rates.csv`
- Courbe reelle : CSV officiel `daily_treasury_real_yield_curve`
- Index et document QRA : pages officielles Treasury HTML

#### Quand

Les calls arrivent a la demande d'un snapshot. Les caches reels utilisent en pratique :

- courbes et niveaux de taux : environ 15 minutes pour F2 ;
- auctions et prochaines auctions : environ 6 heures pour F9 ;
- QRA : environ 24 heures et au plus une tentative par jour.

#### Utilisation KPI

- F2 : 2Y nominal, 10Y nominal, 10Y reel.
- F8 : TGA et variation quotidienne du TGA.
- F9 : high yield, bid-to-cover, part indirecte, prochaines auctions, QRA borrowing et revision.

#### Reponse et limites

Fiscal Data repond avec `{ data: [...] }`. Les courbes sont des CSV. Le QRA est du HTML dont le texte est parse strictement.

- Pas de cle API requise.
- Le parsing QRA depend de formulations recurrentes du document Treasury.
- Un echec de fetch ou de parsing rend le KPI `UNAVAILABLE`.
- Le backend ne doit pas inventer un horaire d'auction si la source ne le fournit pas.

---

### 4.2 FRED

Code : [apps/backend/src/providers/fred.ts](../apps/backend/src/providers/fred.ts).

#### URL

`https://api.stlouisfed.org/fred/series/observations`

Parametres principaux : `series_id`, `api_key`, `file_type=json`, `sort_order=desc`, `limit`.

Variable : `FRED_API_KEY`.

#### Series utilisees

| Famille | Series | Utilisation |
|---|---|---|
| F2 | `T10Y2Y`, `T10YIE` | 2s10s et breakeven 10Y, avec autres series conservees dans le code |
| F5 | `GDPNOW`, `IC4WSA`, `ICSA`, `CCSA` | GDPNow, demandes initiales et continues |
| F7 | `VIXCLS`, `BAMLH0A0HYM2`, `BAMLC0A0CM` | VIX, HY OAS, IG OAS |
| F8 | `SOFR`, `IORB`, `WRESBAL` | SOFR-IORB, EFFR-IORB et reserves |
| F11 | `GVZCLS` | volatilite implicite de l'or |

#### Quand

- F2, F7, F11 : environ 15 minutes.
- GDPNow : environ 1 heure.
- Claims : environ 6 heures ou cadence weekly selon le KPI.
- F8 journalier : environ 1 heure.
- Reserves hebdomadaires : environ 6 heures.

#### Reponse

```json
{
  "observations": [
    {
      "date": "YYYY-MM-DD",
      "value": "string",
      "realtime_start": "YYYY-MM-DD"
    }
  ]
}
```

Le sentinel FRED `"."` est ignore. Les observations sont ensuite converties en niveaux, variations, spreads et percentiles selon le KPI.

#### Echec

Une erreur d'authentification, de reseau ou de structure donne `FETCH_FAILED`. Une serie absente ne devient jamais zero.

La limite de 120 requetes/minute est souvent citee pour FRED, mais elle n'est pas verrouillee comme fait officiel dans ce depot : il faut donc la traiter comme une inconnue operationnelle.

---

### 4.3 BLS

Code : [apps/backend/src/providers/bls.ts](../apps/backend/src/providers/bls.ts).

#### URLs

- GET : `https://api.bls.gov/publicAPI/v2/timeseries/data/{seriesId}`
- POST multi-series : `https://api.bls.gov/publicAPI/v2/timeseries/data/`

Variable : `BLS_API_KEY`.

Les GET unitaires peuvent fonctionner sans cle. Le code utilise la cle quand elle est presente, notamment pour le POST multi-series.

#### Series et KPI

| Famille | Series | KPI |
|---|---|---|
| F4 | `CUUR0000SA0`, `CUSR0000SA0` | CPI headline |
| F4 | `CUUR0000SA0L1E`, `CUSR0000SA0L1E` | CPI core |
| F4 | `WPSFD4` | PPI final demand |
| F5 | `LNS14000000` | taux de chomage |
| F5 | `CES0000000001` | payrolls |
| F5 | `CES0500000003` | average hourly earnings |

#### Quand et calculs

Snapshot, avec un TTL d'environ 6 heures pour les donnees mensuelles. Le POST demande `calculations: true` afin de recuperer les variations officielles quand elles existent.

Si une variation exacte n'est pas fournie, le backend peut la deriver sur les periodes calendaires correspondantes. Les valeurs non numeriques restent `null`.

#### Format utile

```json
{
  "status": "REQUEST_SUCCEEDED",
  "Results": {
    "series": [
      {
        "seriesID": "...",
        "data": [
          {
            "year": "...",
            "period": "M07",
            "value": "...",
            "calculations": {}
          }
        ]
      }
    ]
  }
}
```

Le GET sans authentification est confirme dans le projet. Le POST sans cle a une quota quotidienne plus faible.

---

### 4.4 BEA

Code : [apps/backend/src/providers/bea.ts](../apps/backend/src/providers/bea.ts).

URL : `https://apps.bea.gov/api/data/`.

Variable : `BEA_API_KEY`.

#### Appels

- `GetParameterValues` sur le dataset NIPA pour la decouverte.
- `GetData` sur la table `T20804`, frequence mensuelle.
- `T20807` pour les variations mensuelles officielles.

Dans `T20804` :

- line `1` : PCE headline ;
- line `25` : PCE core.

Consommateur : F4.

#### Quand et sortie

Snapshot, TTL d'environ 6 heures.

```json
{
  "BEAAPI": {
    "Results": {
      "Data": [
        {
          "TimePeriod": "YYYYMmm",
          "LineNumber": "1",
          "DataValue": "..."
        }
      ]
    }
  }
}
```

Provider absent ou reponse invalide : PCE `UNAVAILABLE`.

---

### 4.5 NY Fed

Code : [apps/backend/src/providers/nyFed.ts](../apps/backend/src/providers/nyFed.ts).

URLs :

- `https://markets.newyorkfed.org/api/rates/secured/all/latest.json`
- `https://markets.newyorkfed.org/api/rates/unsecured/all/latest.json`

Aucune variable d'environnement.

#### KPI

- F3 : bornes inferieure et superieure du target range via EFFR.
- F8 : EFFR et spreads SOFR-IORB/EFFR-IORB.

#### Quand et sortie

Snapshot, generalement TTL d'une heure.

```json
{
  "refRates": [
    {
      "type": "EFFR",
      "percentRate": 3.63,
      "targetRateFrom": 3.5,
      "targetRateTo": 3.75,
      "effectiveDate": "..."
    }
  ]
}
```

Champ manque ou erreur : valeur `null`, puis KPI `UNAVAILABLE`.

---

### 4.6 Fed Board H.15

Code : [apps/backend/src/providers/fedBoard.ts](../apps/backend/src/providers/fedBoard.ts).

URL : `https://www.federalreserve.gov/feeds/data/H15_H15.XML`.

Aucune variable.

Le provider lit un feed XML RDF/RSS, extrait un premier `item`, son titre et `cb:value`.

Etat actuel :

- utilise pour le smoke test et le contexte F3 ;
- pas de pipeline KPI complet branche sur ce feed ;
- ne doit donc pas etre decrit comme la source principale de tous les taux H.15.

---

### 4.7 CFTC Commitment of Traders

Code : [apps/backend/src/providers/cftc.ts](../apps/backend/src/providers/cftc.ts).

URL : `https://publicreporting.cftc.gov/resource/72hh-3qpy.json`.

Aucune variable.

#### Requete

- filtre `contract_market_name='GOLD'` ;
- tri par `report_date_as_yyyy_mm_dd` decroissant ;
- 2 rapports recents ou 156 rapports historiques.

#### KPI F10

Champs utilises :

- `report_date_as_yyyy_mm_dd` ;
- `open_interest_all` ;
- `m_money_positions_long_all` ;
- `m_money_positions_short_all`.

Sorties :

- Managed Money net % ;
- variation hebdomadaire en points ;
- percentile du net % sur 156 semaines.

#### Quand

- snapshot ;
- donnees recentes : TTL environ 6 heures ;
- historique : TTL environ 12 heures.

Le fetch historique est un appel unique, pas 156 appels. Aucun plafond officiel chiffré n'est etabli dans le depot.

---

### 4.8 SPDR GLD

Code : [apps/backend/src/providers/spdrGld.ts](../apps/backend/src/providers/spdrGld.ts).

URL : `https://api.spdrgoldshares.com/api/v1/historical-archive?product=gld&exchange=NYSE&lang=en`.

Aucune variable.

La reponse est un fichier XLSX parse avec `exceljs`.

#### KPI F10

- holdings actuels ;
- delta 1, 5 et 20 observations ;
- flow Z-score sur 60 observations ;
- percentile du flow ;
- rendement GLD sur 5 et 20 observations ;
- matrice prix/flow ;
- breadth avec CFTC.

#### Quand et regles

- snapshot ;
- TTL environ 20 heures, donc environ une verification par jour ;
- les lignes `US Holiday` sont ignorees ;
- aucun forward-fill n'est applique ;
- moins de deux observations reelles signifie pas de delta calcule.

Une erreur d'archive, de parsing ou d'historique devient `UNAVAILABLE` ou `INSUFFICIENT_HISTORY` selon le cas.

---

### 4.9 Yahoo Finance

Code : [apps/backend/src/providers/yahooFinance.ts](../apps/backend/src/providers/yahooFinance.ts).

URL : `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`.

#### Symboles

| Symbole | Usage |
|---|---|
| `DX-Y.NYB` | F6 DXY direct |
| `GC=F` | contexte graphique uniquement |
| `^MOVE` | tentative graphique, pas KPI canonique |

#### F6

- niveau DXY ;
- variation du jour ;
- variation 5 jours ;
- etat USD.

Snapshot F6 : TTL environ 15 minutes. Les graphiques fetchent a l'ouverture ou au changement d'instrument/range.

Champs importants : `meta.regularMarketPrice`, `meta.longName`, `meta.shortName`, `timestamp`, `indicators.quote[0].close`.

Yahoo est un endpoint public non officiel. Il n'y a pas de garantie de stabilite ni de quota documentee dans ce depot.

Si Yahoo echoue, les quatre KPI F6 deviennent `UNAVAILABLE`. Il n'y a pas de retour automatique a l'ancienne reconstruction six jambes.

---

### 4.10 Investing.com Fed Rate Monitor

Code : [apps/backend/src/providers/investingFedRateMonitor.ts](../apps/backend/src/providers/investingFedRateMonitor.ts).

Page : `https://www.investing.com/central-banks/fed-rate-monitor`.

Aucune variable. Le backend utilise Playwright Chromium headless.

#### Sortie F3

- buckets de target rate ;
- probabilite actuelle ;
- probabilite veille ;
- probabilite semaine precedente ;
- prochaine reunion ;
- timestamp `Updated`.

#### Quand

A la demande d'un snapshot apres expiration d'une garde persistante :

- cadence cible : toutes les 5 heures ;
- succes persiste dans `ingestion_state` et `kpi_observations`.

#### Echecs

- Chromium absent ;
- timeout ;
- changement de DOM ;
- somme des probabilites hors tolerance.

Dans ces cas : `UNAVAILABLE/FETCH_FAILED`. Le backend ne recalcule pas lui-meme les probabilites CME/ZQ.

C'est du scraping de page publique, pas une API stable.

---

### 4.11 JBlanked : calendrier economique

Code : [apps/backend/src/providers/jblanked.ts](../apps/backend/src/providers/jblanked.ts) et [apps/backend/src/jobs/f13CalendarIngestion.ts](../apps/backend/src/jobs/f13CalendarIngestion.ts).

URL :

```text
GET https://www.jblanked.com/news/api/mql5/calendar/range/?from=YYYY-MM-DD&to=YYYY-MM-DD&currency=USD
Authorization: Api-Key <JBLANKED_API_KEY>
```

Variable : `JBLANKED_API_KEY`.

#### Donnee brute

```json
[
  {
    "Name": "...",
    "Currency": "USD",
    "Impact": "...",
    "Date": "YYYY.MM.DD HH:MM:SS",
    "Actual": "...",
    "Forecast": "...",
    "Previous": "..."
  }
]
```

#### Quand

- `/api/market/snapshot` ;
- `/api/calendar/week` ;
- `/api/calendar/day/:date`.

La ligne `ingestion_state` et la cle `jblanked:calendar` limitent l'appel a un maximum d'une fois par jour pour le tier gratuit.

#### Sortie F13

Les evenements sont normalises, dates converties en UTC, types normalises et stockes dans `macro_events` quand la base est disponible. L'interface expose les prochains evenements, les evenements du jour et les catalyseurs.

Le compte peut repondre `QUOTA_EXCEEDED` ou `AUTH_REJECTED`. Le calendrier reste alors vide ou indisponible, sans retour silencieux aux fixtures.

---

### 4.12 Finnhub : actualites Gold

Code : [apps/backend/src/news/finnhubGoldNews.ts](../apps/backend/src/news/finnhubGoldNews.ts), route dans [apps/backend/src/server.ts](../apps/backend/src/server.ts), panneau [GoldNewsLive.tsx](../apps/frontend/src/components/workspace/GoldNewsLive.tsx).

Variable : `FINNHUB_API_KEY`.

URL : `https://finnhub.io/api/v1/news`.

Trois appels REST sont faits par refresh :

- `category=general` ;
- `category=forex` ;
- `company-news?symbol=GLD&from=...&to=...`, pour recuperer les articles associes a l'ETF Gold ;
- authentification par header `X-Finnhub-Token`.

#### Quand

- ouverture de `/api/news/gold` : fetch immediat si necessaire ;
- ouverture de `/api/news/gold/stream` : demarre le polling ;
- refresh serveur : toutes les 60 secondes ;
- keepalive SSE : toutes les 20 secondes.

Les donnees ne sont pas envoyees directement au navigateur depuis Finnhub. La cle reste backend-only.

#### Filtre et sortie

Le backend conserve les articles dont le titre, le resume ou `related` contient un terme Gold :

- `gold` ;
- `xau` ;
- `bullion` ;
- `precious metal` ;
- `comex` ;
- `lbma`.

Les articles de plus de 48 heures sont exclus. Les resultats des trois endpoints sont dedupliques par `id`, puis tries du plus recent au plus ancien.

La sortie normalisee contient :

```json
{
  "id": 123,
  "category": "general",
  "headline": "...",
  "summary": "...",
  "source": "...",
  "url": "https://...",
  "image": null,
  "related": "...",
  "publishedAt": "2026-09-07T12:00:00.000Z"
}
```

Maximum : 30 articles recents, tries du plus recent au plus ancien. Le panneau affiche la date et l'heure de publication, pas seulement l'heure, pour rendre visible une eventuelle absence de news actuelle.

#### Limite importante

La documentation Finnhub presente le WebSocket News comme une fonctionnalite Premium, surtout symbol-based. Elle ne fournit pas ici un flux News Gold/XAUUSD garanti. Le projet utilise donc :

```text
Finnhub REST toutes les 60 s -> backend -> SSE local -> navigateur
```

C'est un flux live cote produit, mais ce n'est pas un WebSocket News Finnhub natif pour XAUUSD. Si Finnhub ne renvoie pas de titres Gold dans les fenetres `general`/`forex`, le panneau affiche une attente ou une indisponibilite.

---

## 5. Les providers de recherche et d'IA

Ces providers ne doivent pas etre confondus avec les donnees KPI canoniques.

### 5.1 Tavily

Code de connectivite : [apps/backend/src/providers/tavily.ts](../apps/backend/src/providers/tavily.ts).

Code du pilote reel : [apps/backend/src/intelligence/research/tavilyResearchProvider.ts](../apps/backend/src/intelligence/research/tavilyResearchProvider.ts).

URL : `https://api.tavily.com/search`.

Variable : `TAVILY_API_KEY`.

#### Deux chemins differents

1. Smoke test manuel :

   ```text
   npm run provider:test -- tavily
   ```

   Il fait une recherche bon marche et rapporte l'authentification, le resultat et la presence de `published_date`.

2. Recherche reelle du pilote IA :

   - seulement en `DATA_MODE=REAL` ;
   - plusieurs requetes selon le topic ;
   - `search_depth=advanced` ;
   - `topic=finance` ;
   - fenetre temporelle ;
   - score inferieur a `0.3` rejete ;
   - chaque resultat normalise en `RawSearchResult`.

#### Sortie

```json
{
  "title": "...",
  "url": "...",
  "content": "...",
  "published_date": "...",
  "score": 0.87
}
```

Un appel echoue n'arrete pas tout le topic : le pipeline continue avec moins de resultats. La documentation du depot retient 1 000 credits/mois pour le tier gratuit.

---

### 5.2 OpenAI

Code : [apps/backend/src/providers/openai.ts](../apps/backend/src/providers/openai.ts) et [openaiLlmProvider.ts](../apps/backend/src/intelligence/providers/openaiLlmProvider.ts).

Variable : `OPENAI_API_KEY`.

- Smoke test : `models.list()` ;
- pilote reel : Chat Completions avec schema JSON strict ;
- roles : analyst, challenger, adjudicator ;
- timeout : 30 secondes ;
- un retry applicatif ;
- actif uniquement en `DATA_MODE=REAL` et si le provider est configure.

Le depot ne verrouille pas de modele commercial ni de quota chiffre specifique.

---

### 5.3 Anthropic

Code : [apps/backend/src/providers/anthropic.ts](../apps/backend/src/providers/anthropic.ts) et [anthropicLlmProvider.ts](../apps/backend/src/intelligence/providers/anthropicLlmProvider.ts).

Variables :

- `ANTHROPIC_API_KEY` ;
- `ANTHROPIC_WORKSPACE_ID` seulement pour certaines cles liees a plusieurs workspaces.

- Smoke test : `models.list()` ;
- pilote reel : Messages API avec tool call strict ;
- maximum 2 048 tokens par appel ;
- timeout 30 secondes ;
- un retry applicatif ;
- actif uniquement en `DATA_MODE=REAL`.

---

### 5.4 Gemini

Code : [apps/backend/src/providers/gemini.ts](../apps/backend/src/providers/gemini.ts) et [geminiLlmProvider.ts](../apps/backend/src/intelligence/providers/geminiLlmProvider.ts).

Variables :

- `GOOGLE_API_KEY` prioritaire ;
- sinon `GEMINI_API_KEY`.

- Smoke test : `models.list()` ;
- pilote reel : `models.generateContent` avec sortie structuree ;
- un retry applicatif ;
- actif uniquement en `DATA_MODE=REAL`.

---

### 5.5 GDELT

Code : [apps/backend/src/providers/gdelt.ts](../apps/backend/src/providers/gdelt.ts).

URL : `https://api.gdeltproject.org/api/v2/doc/doc`.

Aucune variable.

Le smoke test demande :

- query `gold` ;
- mode `artlist` ;
- format JSON ;
- maximum 3 articles.

Etat actuel : connectivite uniquement. GDELT n'est pas branche au pipeline de recherche reel du projet. Sa limite numerique n'est pas publiee dans le depot ; un throttling defensif est possible.

---

## 6. Toutes les routes backend importantes

Toutes sont declarees dans [apps/backend/src/server.ts](../apps/backend/src/server.ts).

| Route | Fonction | Declenchement |
|---|---|---|
| `GET /health` | Verifie que le backend repond | Toutes les 15 s depuis le frontend |
| `GET /api/market/snapshot?language=EN\|FR` | Snapshot F2-F13 | Chargement/changement langue, puis refresh frontend |
| `GET /api/charts/macro/:instrument?range=...` | Serie graphique macro | Ouverture/changement instrument ou range |
| `GET /api/providers/status` | Dernier statut des providers | Ouverture Settings, aucun smoke test automatique |
| `GET /api/news/gold` | Snapshot des news Gold | Appel explicite |
| `GET /api/news/gold/stream` | Flux SSE news Gold | Ouverture du panneau NEWS |
| `GET /api/calendar/week` | Calendrier de la semaine | Ouverture calendrier |
| `GET /api/calendar/day/:date` | Detail d'une journee | Selection d'une date |
| `GET /api/external-proxy/link?url=...` | Proxy d'un lien autorise | Ouverture d'un lien externe dans l'app |
| `GET /api/external-proxy/:key` | Proxy d'une source allowlistee | Ouverture d'une source dans l'app |
| `GET /api/journal` | Liste du journal | Ouverture Journal |
| `POST /api/journal` | Cree une entree validee | Sauvegarde explicite |
| `DELETE /api/journal/:id` | Supprime une entree | Suppression explicite |
| `GET /api/intelligence/meta` | Mode/session IA | Initialisation frontend |
| `GET /api/intelligence/snapshot` | Interpretations KPI sans evidence lourde | Ouverture cockpit/intelligence |
| `GET /api/intelligence/kpi/:kpiId` | Interpretation + evidence d'un KPI | Ouverture drawer |
| `GET /api/intelligence/kpi/:kpiId/peek` | Lit l'etat cache IA | Affichage du badge sans lancer d'appel |
| `GET /api/intelligence/kpi/:kpiId/on-demand` | Demande ou verifie une analyse KPI | Ouverture du drawer, puis polling |
| `GET /api/intelligence/global-read/on-demand` | Lit le cache Global Read | Ouverture de la section |
| `POST /api/intelligence/global-read/analyze` | Lance le Global Read | Clic manuel uniquement |
| `GET /api/intelligence/gold-overnight/on-demand` | Lit le cache Overnight Gold | Ouverture de la section |
| `POST /api/intelligence/gold-overnight/analyze` | Lance le briefing Overnight | Clic manuel uniquement |

Les routes d'analyse lourde ne sont pas lancees simplement parce qu'une page est rendue.

---

## 7. Ce que fait le frontend et a quel moment

### Routes Next.js

- `/` : cockpit principal ;
- `/market` : marche et familles KPI ;
- `/chart` : graphiques ;
- `/execution` : preparation d'execution, aucun ordre ;
- `/news` : discipline de recherche, Overnight Gold et flux Finnhub ;
- `/journal` : journal persistant ;
- `/knowledge` : connaissances ;
- `/knowledge/[slug]` : chapitre ;
- `/settings` : statut des providers.

### Clients et hooks

| Fichier | Appels | Cadence |
|---|---|---|
| [marketClient.ts](../apps/frontend/src/lib/api/marketClient.ts) | snapshot et charts | snapshot au chargement puis environ toutes les 10 min dans Market ; chart a la selection |
| [providersClient.ts](../apps/frontend/src/lib/api/providersClient.ts) | `/api/providers/status` | lecture dans Settings, pas de test live automatique |
| [journalClient.ts](../apps/frontend/src/lib/api/journalClient.ts) | GET/POST/DELETE journal | chargement ou action utilisateur |
| [intelligenceClient.ts](../apps/frontend/src/lib/api/intelligenceClient.ts) | KPI, Global Read, Overnight | drawer/bouton ; polling KPI toutes les 4 s pendant `PENDING` |
| [useConnectionStatus.ts](../apps/frontend/src/lib/useConnectionStatus.ts) | `/health` | immediat puis toutes les 15 s |
| [GoldNewsLive.tsx](../apps/frontend/src/components/workspace/GoldNewsLive.tsx) | `EventSource` SSE | connexion a l'ouverture de NEWS, flux serveur toutes les 60 s |

TradingView charge aussi des scripts externes pour les graphiques, mais ce flux est visuel et hors pipeline KPI canonique.

---

## 8. Cadences en une seule table

| Flux | Quand | TTL/cadence |
|---|---|---:|
| Snapshot marche | chargement Market ou changement langue | frontend environ 10 min, provider variable |
| F2 taux | snapshot | environ 15 min |
| F3 target range | snapshot | environ 1 h |
| F3 distribution Fed | snapshot avec garde DB | environ 5 h |
| F4 CPI/PCE/PPI | snapshot | environ 6 h |
| F5 donnees mensuelles | snapshot | environ 6 h |
| F5 GDPNow | snapshot | environ 1 h |
| F5 claims | snapshot | environ 6 h / weekly selon serie |
| F7 volatilite/credit | snapshot | environ 15 min |
| F8 donnees journalieres | snapshot | environ 1 h |
| F8 reserves | snapshot | environ 6 h |
| F9 auctions | snapshot | environ 6 h |
| F9 QRA | snapshot | environ 24 h |
| F10 CFTC | snapshot | environ 6 h, historique 12 h |
| F10 GLD | snapshot | environ 20 h |
| F13 JBlanked | snapshot/calendrier | maximum 1 appel/jour |
| Finnhub news | ouverture News/SSE | polling serveur 60 s |
| SSE keepalive | connexion news ouverte | 20 s |
| backend health | frontend global | 15 s |
| analyse KPI IA | ouverture drawer | polling 4 s si `PENDING` |
| Global Read | bouton utilisateur | aucun appel automatique d'analyse |
| Overnight Gold | bouton utilisateur | aucun appel automatique d'analyse |

Ces chiffres decrivent les gardes et caches du code. Ils ne signifient pas qu'une source publie reellement une nouvelle observation a chaque expiration.

---

## 9. Variables d'environnement

Le fichier reel est `apps/backend/.env`. Ne jamais copier les valeurs secretes dans la documentation, un commit ou le frontend.

### Runtime

| Variable | Role | Defaut |
|---|---|---|
| `PORT` | port Express | `4001` |
| `FRONTEND_ORIGIN` | origine CORS autorisee | `http://localhost:3000` |
| `DATA_MODE` | `MOCK` ou `REAL` | `MOCK` |
| `APP_SESSION_ID` | identifiant injecte par `scripts/with-session-id.js` | genere par le script |
| `NEXT_PUBLIC_BACKEND_URL` | URL du backend utilisee par Next.js | `http://localhost:4001` |

### Cles providers

| Variable | Provider | Sert a |
|---|---|---|
| `FRED_API_KEY` | FRED | series macro F2/F5/F7/F8/F11 |
| `BLS_API_KEY` | BLS | CPI, PPI, chomage, payrolls, salaires |
| `BEA_API_KEY` | BEA | PCE F4 |
| `MASSIVE_API_KEY` | Massive | provider de connectivite/quotes selon le registre, pas source principale des KPI Gold actuels |
| `TAVILY_API_KEY` | Tavily | recherche news du pilote IA |
| `FINNHUB_API_KEY` | Finnhub | news Gold filtrees dans `/news` |
| `JBLANKED_API_KEY` | JBlanked | calendrier economique F13 |
| `OPENAI_API_KEY` | OpenAI | analyst/challenger/adjudicator IA en REAL |
| `ANTHROPIC_API_KEY` | Anthropic | analyst/challenger/adjudicator IA en REAL |
| `ANTHROPIC_WORKSPACE_ID` | Anthropic | header optionnel si workspace multiple |
| `GOOGLE_API_KEY` | Gemini | prioritaire sur GEMINI_API_KEY |
| `GEMINI_API_KEY` | Gemini | fallback si GOOGLE_API_KEY absent |

### Base de donnees

| Variable | Role |
|---|---|
| `SUPABASE_API_URL` (ou `SUPABASE_URL`) | deja utilisee par l'auth ; sert aussi a deriver la reference de projet pour la connexion Postgres |
| `SUPABASE_DB_PASSWORD` | mot de passe de la base Postgres (Dashboard Supabase > Project Settings > Database) |
| `SUPABASE_DB_POOLER_HOST` / `SUPABASE_DB_POOLER_PORT` | overrides optionnels, defaut `aws-0-us-east-2.pooler.supabase.com:5432` (Session Pooler) |

La base est consideree configuree si `SUPABASE_API_URL` et `SUPABASE_DB_PASSWORD` existent tous les deux — aucune variable `DB_*` separee (plus de MySQL depuis 2026-09-09, voir docs/AUTH_SUPABASE.md "Mise a jour 6").

### Autres variables presentes dans `.env`

Certaines variables historiques ou specifiques a des travaux paralleles peuvent etre presentes dans le fichier local sans etre lues par `loadAppConfig()` pour le pipeline courant. Il faut distinguer :

- variable presente dans `.env` ;
- variable lue par le code ;
- provider effectivement branche a un KPI.

La liste definitive des variables lues par le backend est dans [apps/backend/src/config/env.ts](../apps/backend/src/config/env.ts). Ne pas conclure qu'une variable est active seulement parce qu'elle apparait dans `.env`.

---

## 10. Sorties et comportements d'erreur

### Reponse normale

Un snapshot contient notamment :

```json
{
  "generatedAt": "2026-09-07T12:00:00.000Z",
  "sourceTag": "...",
  "families": [
    {
      "familyId": "F2",
      "label": "...",
      "kpis": [
        {
          "id": "f2-10y",
          "value": 4.28,
          "unit": "%",
          "dataState": "REAL",
          "quality": "current",
          "provenance": "observed",
          "sourceTag": "TREASURY",
          "observationAt": "...",
          "retrievedAt": "..."
        }
      ]
    }
  ]
}
```

Les noms exacts et les types sont autoritaires dans [packages/contracts/src/index.ts](../packages/contracts/src/index.ts).

### Erreur provider

Une erreur peut devenir :

- provider `NOT_CONFIGURED` dans `/api/providers/status` ;
- KPI `UNAVAILABLE` avec `FETCH_FAILED` ;
- KPI `UNAVAILABLE` avec `NO_SOURCE` ;
- KPI `UNAVAILABLE` avec `INSUFFICIENT_HISTORY` ;
- route HTTP `503` pour une ressource explicitement indisponible ;
- evenement SSE `provider-error` pour Finnhub news.

Le backend ne masque pas une erreur par une fixture mock lorsqu'il travaille sur une voie reelle.

### Health versus donnees

`GET /health` repond `{"status":"ok"}` si le processus backend repond. Cela ne prouve pas que FRED, BLS, Finnhub, la base de donnees ou tous les providers sont disponibles. Pour les providers, utiliser `/api/providers/status` et les smoke tests explicites.

---

## 11. Les smoke tests providers

Commande generale :

```powershell
npm run provider:test -- <providerId>
```

Exemples :

```powershell
npm run provider:test -- fred
npm run provider:test -- bls
npm run provider:test -- bea
npm run provider:test -- tavily
npm run provider:test -- gdelt
npm run provider:test -- jblanked
```

Un smoke test verifie la connectivite et parfois une capacite precise. Il ne signifie pas que l'application l'appelle automatiquement a chaque page.

Le registre est dans [apps/backend/src/providers/registry.ts](../apps/backend/src/providers/registry.ts). Les providers `tavily` et `gdelt` y apparaissent comme providers de recherche, mais leur statut ne doit pas etre confondu avec leur branchement dans chaque pipeline.

---

## 12. Quel KPI vient de quel provider ?

### F2 : taux et courbe

| KPI | Source principale | Nature |
|---|---|---|
| `f2-2y` | Treasury | observe |
| `f2-10y` | Treasury | observe |
| `f2-10y-real` | Treasury real yield curve | observe |
| `f2-be10` | Treasury/FRED selon la voie | derive/observe selon implementation |
| `f2-5y5y` | series de taux inflation/forward | derive |
| `f2-2s10s` | 10Y - 2Y | derive |

Pourquoi : les taux reels et la courbe de taux decrivent le canal de cout d'opportunite et le regime de duration. Aucun de ces KPI n'est un signal BUY/SELL autonome.

### F3 : Fed

| KPI/champ | Source | Sortie |
|---|---|---|
| `f3-target-lower` | NY Fed / EFFR | borne basse |
| `f3-target-upper` | NY Fed / EFFR | borne haute |
| `FedRateDistribution` | Investing.com scrape | buckets + probabilites |
| `f3-repricing` | pas de source canonique active | `UNAVAILABLE/NO_SOURCE` |
| `f3-path-6m` | pas de source canonique active | `UNAVAILABLE/NO_SOURCE` |

Pourquoi : distinguer le niveau officiel de la fourchette Fed de la distribution de marche. La distribution n'est pas une decision Fed et ne doit pas etre presentee comme telle.

### F4 : inflation

| KPI | Source |
|---|---|
| CPI headline/core MoM/YoY | BLS |
| CPI core annualise 3 mois | BLS + calcul deterministe |
| PPI final demand | BLS |
| PCE headline/core | BEA |

Pourquoi : le chiffre, sa surprise et sa transmission vers les attentes Fed peuvent modifier le recit de l'or. Le chiffre brut et l'interpretation IA restent separes.

### F5 : emploi et croissance

| KPI | Source |
|---|---|
| chomage | BLS |
| payrolls latest / 3 mois | BLS |
| average hourly earnings MoM | BLS |
| revisions payrolls | BLS, historique/vintages suffisants |
| claims 4 semaines | FRED |
| claims initial/continuing | FRED |
| GDPNow | FRED |
| ISM services/manufacturing | actuellement `UNAVAILABLE/NO_SOURCE` dans la map verrouillee |

Pourquoi : le marche reprice la Fed via la vigueur ou le refroidissement de l'emploi et de la croissance.

### F6 : dollar

| KPI | Source |
|---|---|
| DXY level | Yahoo `DX-Y.NYB` |
| DXY today | Yahoo |
| DXY 5d | Yahoo |
| USD state | calcul deterministe |

Pourquoi : le dollar est souvent un canal important pour l'or, mais la relation n'est pas mecaniquement inverse en crise.

### F7 : risque et credit

| KPI | Source |
|---|---|
| VIX et variation 1d | FRED |
| HY OAS et variation | FRED |
| IG OAS | FRED |
| MOVE | pas de source canonique acceptee, `NO_SOURCE` |

Pourquoi : le risque et le credit servent a qualifier le regime, pas a conclure automatiquement que l'or monte ou baisse.

### F8 : liquidite et funding

| KPI | Source |
|---|---|
| reserves level / WoW | FRED |
| TGA level / daily | Treasury DTS |
| SOFR-IORB | NY Fed/FRED selon voie |
| EFFR-IORB | NY Fed/FRED selon voie |
| funding microstate | calcul deterministe |

Pourquoi : la liquidite et le funding contextualisent les mouvements de taux, USD, risque et or.

### F9 : Treasury/fiscal

| KPI | Source |
|---|---|
| QRA borrowing | page QRA Treasury parsee |
| QRA revision | page QRA Treasury parsee |
| auction high yield | Treasury auctions |
| bid-to-cover | Treasury auctions |
| indirect share | Treasury auctions |

Pourquoi : une auction faible ou un besoin de financement revise ne devient pas mecaniquement un signal Gold. La transmission via taux reels, USD et flight from US assets doit etre verifiee.

### F10 : positionnement et participation

| KPI | Source |
|---|---|
| Managed Money net % | CFTC Gold |
| Managed Money WoW | CFTC |
| Managed Money percentile | CFTC, fenetre 156 semaines |
| GLD holdings | SPDR GLD XLSX |
| GLD delta 1/5/20 | SPDR GLD |
| GLD flow Z60 | SPDR GLD |
| GLD flow percentile | SPDR GLD |
| GLD return 5/20 | SPDR GLD |
| breadth | CFTC + GLD |

Pourquoi : F10 teste le positionnement et la participation. Une hausse de prix accompagnee de flux physiques faibles n'est pas interpretee comme une inversion automatique ; c'est une information d'asymetrie a contextualiser.

### F11 : volatilite Gold

| KPI | Source |
|---|---|
| GVZ | FRED `GVZCLS` |
| GVZ 1d | FRED + derive |
| GVZ 5d | FRED + derive |

Pourquoi : GVZ mesure l'amplitude attendue/pricer, pas la direction.

### F12 : demande physique

La famille existe dans le contrat et les fixtures, mais le code actuel expose une disponibilite limitee ou `UNAVAILABLE/NO_SOURCE` selon le KPI. Il ne faut pas presenter une fixture comme un feed physique reel.

### F13 : calendrier

Source principale : JBlanked pour le calendrier MQL5 USD, avec les calendriers officiels BLS, BEA et Fed dans le Global Read.

Pourquoi : F13 repond a la question "quand une nouvelle information peut-elle changer la lecture ?". Il ne predit pas le resultat du release.

---

## 13. Intelligence IA : ce qui arrive apres les KPI

### Analyse KPI a la demande

Le drawer d'un KPI peut demander :

1. `peek` pour lire un resultat deja cache ;
2. `on-demand` pour creer ou rafraichir une analyse ;
3. polling frontend toutes les 4 secondes si le statut est `PENDING` ;
4. lecture de l'interpretation et de l'evidence une fois prete.

L'ouverture d'une grille ne doit pas lancer automatiquement toutes les analyses couteuses.

### Global Read

- lecture cache a l'ouverture : `GET /api/intelligence/global-read/on-demand` ;
- lancement lourd : `POST /api/intelligence/global-read/analyze` apres clic utilisateur ;
- assemble toutes les familles, le calendrier, les preuves et le test de prix ;
- utilise des CLI/LLM reels seulement selon la configuration et le mode ;
- ne doit pas produire une conclusion directionnelle sans evidence admise.

### Overnight Gold Recap

- lecture cache : `GET /api/intelligence/gold-overnight/on-demand` ;
- generation : `POST /api/intelligence/gold-overnight/analyze` ;
- briefing de recherche sur l'action recente de l'or ;
- ce briefing ne remplace pas le KPI canonique de prix.

### Principes de securite metier

- faits, calculs deterministes, estimations et interpretation IA restent etiquetes separement ;
- une source non verifiee ne devient pas une preuve forte ;
- une news n'est pas automatiquement une causalite ;
- aucun BUY/SELL ne doit etre invente par commodite provider.

---

## 14. Base de donnees et persistance

**2026-09-09 : plus de MySQL.** Toute la persistance applicative (au-dela de l'auth) vit desormais dans le meme projet **Supabase Postgres** que Supabase Auth utilise deja, via le Session Pooler. Voir [docs/AUTH_SUPABASE.md](AUTH_SUPABASE.md), "Mise a jour 6", pour le detail de la migration et le raisonnement TLS.

La base sert notamment a :

- `ingestion_state` : garder les gardes de frequence et les derniers appels ;
- `kpi_observations` : persister certaines observations reelles et leur provenance ;
- `macro_events` : calendrier normalise ;
- `journal_entries` : journal de trading, entrees utilisateur persistantes ;
- `global_read_runs` : historique d'audit de la Lecture Globale.

Fichiers principaux :

- [apps/backend/src/db/pool.ts](../apps/backend/src/db/pool.ts) : pool Postgres (`pg`) partage ;
- [apps/backend/src/db/ingestionRunner.ts](../apps/backend/src/db/ingestionRunner.ts) : garde et bookkeeping ;
- [apps/backend/src/db/macroEvents.ts](../apps/backend/src/db/macroEvents.ts) : evenements calendrier ;
- [apps/backend/src/db/journalEntries.ts](../apps/backend/src/db/journalEntries.ts) : journal ;
- [apps/backend/src/db/migrations/](../apps/backend/src/db/migrations/) : schema (holders + tables ci-dessus), applique via `npm run db:migrate`.

Le code ne lance pas un cron general dans `ingestionRunner.ts`. Une fonction est appelee lorsqu'une route ou un snapshot en a besoin, puis la base decide si le fetch est du.

Une panne DB ne doit pas transformer une donnee externe valide en donnee inventee. Certaines voies repondent tout de meme avec une donnee live si la persistance secondaire echoue, selon leur contrat.

---

## 15. Structure des fichiers a connaitre

### Backend

| Dossier/fichier | Responsabilite |
|---|---|
| `src/server.ts` | Express, routes, boot, shutdown |
| `src/config/env.ts` | seul endroit central des credentials/config |
| `src/providers/` | adaptateurs et smoke tests providers |
| `src/real/` | construction des familles reelles |
| `src/mock/` | fixtures et scenarios de developpement |
| `src/cache/` | snapshot, TTL et fraicheur |
| `src/intelligence/` | contexte, recherche, IA, Global Read |
| `src/jobs/` | jobs gardes, notamment F13 |
| `src/db/` | Postgres (Supabase), observations, calendrier, journal |
| `src/proxy/` | sources externes allowlistees |
| `src/news/` | flux news Finnhub Gold |

### Frontend

| Dossier/fichier | Responsabilite |
|---|---|
| `src/app/` | routes Next.js |
| `src/components/market/` | cockpit, familles, KPI, drawers |
| `src/components/workspace/` | Chart, News, Journal, Knowledge |
| `src/hooks/` | cycles d'analyse et etats frontend |
| `src/lib/api/` | clients HTTP backend |
| `src/i18n/` | textes anglais/francais |
| `src/content/` | contenu pedagogique et liens externes |

### Packages et tests

- `packages/contracts/` : types partages backend/frontend ;
- `tests/` : tests de parsing, wiring, caches, invariants, UX et pipelines ;
- `scripts/with-session-id.js` : injecte `APP_SESSION_ID` pour une session reproductible.

---

## 16. Commandes de travail

Depuis la racine :

```powershell
# Installer les dependances
npm install

# Demarrer backend + frontend
npm run dev

# Verifier les types
npm run typecheck

# Construire les contrats, backend et frontend
npm run build

# Lancer les tests
npm test

# Tester un provider
npm run provider:test -- finnhub
npm run provider:test -- fred
npm run provider:test -- tavily

# Migrer la base (Postgres/Supabase)
npm run db:migrate
```

Le provider Finnhub news actuel n'a pas encore de smoke test dans le registre. La verification fonctionnelle se fait via l'ouverture de `/news`, la route `/api/news/gold` et le test de normalisation [tests/finnhub-gold-news.test.ts](../tests/finnhub-gold-news.test.ts).

---

## 17. Diagnostic rapide

### Le cockpit affiche `MOCK`

Verifier `DATA_MODE`. Sans `DATA_MODE=REAL`, le projet peut rester sur ses fixtures pour les familles non activees en reel.

### Un provider est `NOT_CONFIGURED`

Verifier que la variable correspondante existe dans `apps/backend/.env`, qu'elle n'est pas vide, puis redemarrer le backend. La configuration est mise en cache au boot.

### Un KPI est `UNAVAILABLE/FETCH_FAILED`

Verifier :

1. le provider et sa cle ;
2. la sortie du smoke test ;
3. le reseau et le timeout ;
4. le cache/ingestion state ;
5. la structure de la reponse upstream.

### Un KPI est `UNAVAILABLE/INSUFFICIENT_HISTORY`

La source repond mais le calcul exige plus de points : historique CFTC, GLD, vintages BLS ou fenetre de variation. Ce n'est pas une erreur d'authentification.

### Le calendrier F13 est vide

Verifier `JBLANKED_API_KEY`, les credits du compte, `ingestion_state` et les routes calendar. Un quota depasse doit rester visible comme indisponibilite.

### Les news Gold restent en attente

Verifier :

1. `FINNHUB_API_KEY` est present ;
2. le backend a ete redemarre apres modification du `.env` ;
3. `/api/news/gold` repond ;
4. Finnhub renvoie des articles dans `general` ou `forex` ;
5. les titres contiennent un terme accepte par le filtre lexical.

L'absence de titre ne signifie pas que Finnhub est hors ligne : la fenetre recente peut simplement ne contenir aucune mention Gold.

### `/health` est vert mais les donnees sont indisponibles

C'est normal : `/health` teste uniquement le processus Express. Utiliser `/api/providers/status`, les routes de donnees et les smoke tests pour le diagnostic reel.

---

## 18. Limites a garder en tete

1. Un provider de connectivite n'est pas automatiquement une source KPI.
2. Yahoo et Investing.com sont des sources externes plus fragiles que les APIs officielles.
3. Finnhub REST + SSE local donne du live a l'interface, mais pas un WebSocket News Gold natif Finnhub.
4. Les quotas exacts de certains fournisseurs gratuits ne sont pas verrouilles dans le depot.
5. F13 depend du quota JBlanked et peut rester indisponible.
6. F12 et certains KPI sont structurellement `NO_SOURCE`.
7. Une observation ancienne peut etre `current` si elle respecte la cadence economique ; `current` ne veut pas dire "publie il y a moins d'une heure".
8. Une interpretation IA peut etre recente alors que les donnees de base sont stale : les deux niveaux doivent rester visibles.
9. Le contenu de `.env` est secret. Ce guide ne contient volontairement aucune valeur de cle.
10. Pour changer une source, une formule, un provider ou une cadence, modifier le code et la documentation ensemble, puis ajouter ou mettre a jour un test.

---

## 19. Resume en une phrase par couche

- `.env` configure les acces, mais ne declenche rien a lui seul.
- `providers/` sait parler aux sources externes.
- `real/` transforme les reponses en familles et KPI reels.
- `cache/` decide quand il faut refetch et comment juger la fraicheur.
- `contracts/` fixe la forme que le frontend peut consommer.
- `server.ts` expose les routes et orchestre le cycle de vie.
- `frontend/` affiche, demande et rafraichit sans redefinir la logique metier.
- `intelligence/` interprete le contexte a la demande, sans remplacer les faits.
- `tests/` verifie les invariants, les parsers, le wiring, les caches et les sorties.
