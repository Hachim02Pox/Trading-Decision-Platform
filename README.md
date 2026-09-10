# Zenith Terminal

Terminal personnel de lecture macro et decisionnelle pour l'or. Il rassemble donnees reelles, provenance, graphiques, calendrier macro et Lecture Globale manuelle. Il ne passe pas d'ordres et ne produit pas de signal Achat/Vente.

## Reprise par un nouvel agent

Lire avant toute modification :

1. `AI_WORKFLOW.md` : regles de travail, perimetre et verite des donnees.
2. `DESIGN.md` : design system obligatoire.
3. `docs/MVP_COCKPIT_CONTRACT.md` : familles et decisions UI.
4. `docs/KPI_INTELLIGENCE_ARCHITECTURE.md` : faits, IA, provenance et etats.
5. `docs/PROVIDER_SETUP.md` : fournisseurs et configuration.
6. `docs/GLOBAL_READ_V2.md`, puis `global_read_rebuild_spec/global_read_rebuild_spec/00_README_FIRST.md` : Lecture Globale v2.
7. `docs/AUTH_SUPABASE.md` : statut a jour de l'auth et du deploiement (ce qui est en ligne, ce qui reste, ce qu'il ne faut pas refaire).

Ne jamais inventer une valeur, une source, une date de publication, une causalite ou un fallback. Une source inconnue ou en erreur doit etre `INDISPONIBLE`, jamais simulee.

## Demarrage local

Prerequis : Node.js et npm. La persistance (journal, historique KPI, calendrier) utilise Supabase Postgres — optionnelle mais recommandee pour l'historique et l'audit durable ; sans `SUPABASE_DB_PASSWORD` configure, ces fonctionnalites degradent honnetement en `DB not configured` plutot que de planter.

```powershell
npm install
Copy-Item apps/backend/.env.example apps/backend/.env
npm run dev
```

Frontend : `http://localhost:3000`. Backend : `http://localhost:4001`. Page initiale : `/market`.

```powershell
npm test
npm run typecheck
npm run build
npm run provider:test
npm run db:migrate
```

Ne jamais committer une cle API. `apps/backend/.env` est local; `.env.example` ne contient que les noms des variables.

## Architecture et flux

- `apps/frontend/` : Next.js 16 + React 19, interface, graphiques et i18n.
- `apps/backend/` : Express, snapshots, fournisseurs, cache, DB et intelligence.
- `packages/contracts/` : types TypeScript partages frontend/backend.
- `tests/` : tests Node/tsx.
- `docs/` : specifications produit et guides.
- `global_read_rebuild_spec/` : specification complete de la Lecture Globale.

Flux de marche : source -> `apps/backend/src/providers` -> `apps/backend/src/real` -> `snapshotCache` -> `GET /api/market/snapshot` -> frontend.

`packages/contracts/src/index.ts` est le contrat central. Toute KPI porte valeur, unite, source, provenance, etat, `observationAt` et `retrievedAt`.

## Dates, etats et fraicheur

- `observationAt` est la periode ou l'instant mesure par la valeur.
- `retrievedAt` est le dernier fetch backend ayant produit la valeur.
- Une date de publication est distincte et ne doit etre affichee que si un calendrier officiel la fournit.

Exemple : un CPI de juillet est ancre a fin juillet pour identifier sa periode, mais il peut etre publie mi-aout. L'UI affiche `Periode : juillet 2026`, jamais `Donnee du 31 juillet`.

| Etat | Sens |
|---|---|
| `REAL` | Valeur recue depuis une source reelle identifiee. |
| `UNAVAILABLE` | Erreur de fetch ou source inexistante. |
| `MOCK` | Valeur de developpement, uniquement en `DATA_MODE=MOCK`. |

La qualite est calculee dans `apps/backend/src/cache/snapshotCache.ts` : `A JOUR`, `MISE A JOUR A VERIFIER`, ou `INDISPONIBLE`. Le deuxieme statut signifie qu'une verification est due selon la cadence; il ne prouve pas qu'une nouvelle publication existe. Les week-ends ne doivent pas rendre une serie quotidienne faussement stale. Marche se rafraichit silencieusement toutes les dix minutes sans vider l'ecran en cas d'echec de refresh.

## Familles de marche

Il y a 12 familles, F2 a F13. **F1 est volontairement absente et ne doit pas etre reintroduite sans decision explicite.**

| Famille | Objet |
|---|---|
| F2 | Taux, taux reels, breakevens, pente 2s10s |
| F3 | Fed et probabilites de taux |
| F4 | Inflation : CPI, PCE, PPI |
| F5 | Emploi et croissance |
| F6 | Dollar / DXY |
| F7 | Risque, credit et volatilite |
| F8 | Liquidite, reserves, funding, TGA |
| F9 | Tresor, fiscal, adjudications |
| F10 | Flux et positionnement : CFTC et GLD/ETF |
| F11 | Options or / vol, GVZ proxy |
| F12 | Or physique / structurel, gap explicite si sans source |
| F13 | Calendrier macro et catalyseurs |

### Couleurs relationnelles

- `FAVORABLE` : relation mecanique explicite favorable a l'or.
- `DEFAVORABLE` : relation mecanique explicite adverse a l'or.
- `CONTEXTUEL` : la valeur seule ne permet pas une lecture directionnelle.

Ces couleurs ne sont jamais un conseil de trading. 2Y, 10Y nominal et 2s10s sont contextuels car il faut connaitre le role des taux reels, breakevens et du repricing Fed. La couleur de famille est decidee par une KPI **visible** sur la carte, jamais par une KPI deep-only cachee. Voir `apps/frontend/src/lib/designatedKpi.ts`.

## Sources et graphiques

| Source | Usage |
|---|---|
| FRED | taux, credit, liquidite et macro |
| BLS | CPI, PPI, emploi |
| BEA | PCE |
| US Treasury | courbes de taux et tresor |
| CFTC | positionnement futures |
| SPDR / GLD | flux ETF quand disponible |
| Yahoo Finance | prix publics, dont DXY; non officiel |
| TradingView | widget graphique, pas API backend |
| Massive | capacites documentees selon la cle configuree |

Priorite : officiel, puis public fiable, sinon `UNAVAILABLE`. En `DATA_MODE=REAL`, une fixture ne doit jamais etre visible comme donnee reelle.

Graphique utilise TradingView seulement pour les symboles verifies compatibles au widget; les series macro utilisent les graphiques natifs backend. Les comparaisons conservent dates observees et recuperees. `US2Y` et `US10Y` sont des series Treasury reelles, pas des CFD obligataires ambigus. Ne pas ajouter un symbole non verifie uniquement pour remplir un graphe.

## Lecture Globale v2

La Lecture Globale est manuelle, potentiellement longue et ne donne ni entree, ni stop, ni taille, ni ordre Achat/Vente.

Cycle : nouveau fetch complet -> verification valeur/fraicheur contre sources autoritaires -> `WEB_ONLY` explicite si le terminal est stale/absent -> analyses independantes + self-audit -> broad web scan Gold recent et forward-looking -> debat evidence-based si deux agents -> post-audit, scenarios, exploitabilite et comparaison precedente -> rapport et carte causale.

Invariants : les LLM recherchent et interpretent mais ne font pas de calcul financier improvise; un forum est une piste et non une preuve; le prix ne prouve pas une causalite; un conflit ne devient pas consensus par confort; `WEB_ONLY` est local au run et ne reecrit pas la DB KPI; direction et exploitabilite sont distinctes (`OPPORTUNITY`, `WATCH`, `NO CLEAN EDGE`).

Le run doit survivre a la navigation interne : `GlobalReadProvider` vit au niveau application, la progression apparait dans tous les onglets, et la notification finale ouvre le rapport. Lire `docs/GLOBAL_READ_V2.md` et tout `global_read_rebuild_spec/` avant de modifier ce pipeline.

## Base de donnees, design et UX

Supabase Postgres (meme projet que l'auth) permet `kpi_observations` (historique append-only et revisions), `ingestion_state` (fetches/cooldowns), `journal_entries` et `global_read_runs` (rapports et comparaisons). Une panne DB ne doit pas transformer les donnees de marche en mock; degrader honnetement.

Respecter `DESIGN.md` : terminal dense dark-only, IBM Plex Sans/Mono, surfaces sombres, bordures fines, chiffres monospace, couleurs semantiques, clavier et focus visible. Ne pas transformer le produit en dashboard SaaS decoratif. Toute KPI porte `REAL`, `MOCK` ou `UNAVAILABLE`; une longue tache ne doit pas bloquer la navigation par une modal centrale.

Navigation : Marche/Decision, Graphique, Execution, Actualites/Recherche, Journal/Historique, Connaissances et Parametres.

## Procedure de changement

Avant : lire les documents de tete, inspecter `git status`, preserver le worktree et ajouter un test de regression pour chaque bug/regle. Apres :

```powershell
npm test
npm run typecheck
git diff --check
```

Lancer `npm run build` lorsqu'un serveur Next ne verrouille pas `.next`. Ne jamais annoncer un build passe sans l'avoir execute.

Etat de verification au moment de cette mise a jour : `npm test` passe avec 206 tests (0 skip — le test de persistance DB tourne pour de vrai contre Supabase) et `npm run typecheck` passe. Mettre ce nombre a jour apres les prochains changements.

## Limites a conserver visibles

- Une API gratuite n'est pas un feed tick-by-tick.
- TradingView payant ne donne pas automatiquement une API backend ou des widgets redistribuables temps reel.
- Les fournisseurs gratuits peuvent etre retardes ou limites; l'UI doit l'indiquer.
- Un run Claude/Codex peut utiliser les disponibilites des abonnements CLI; ne pas le lancer comme simple test sans accord.
- Options, physical gold et ETF peuvent ne pas avoir de source gratuite fiable : un gap explicite est meilleur qu'une simulation.

## Deploiement

**Deploye** (voir `docs/AUTH_SUPABASE.md` pour le statut a jour et les URLs) : frontend sur Vercel, backend Express sur Railway, auth + base de donnees sur Supabase (Postgres). `docs/AUTH_SUPABASE.md` est la source de verite sur ce qui est en ligne, ce qui reste, ce qu'il ne faut pas refaire — le lire avant toute nouvelle demande touchant l'auth, le deploiement ou la persistance.

Avant tout changement touchant l'exposition publique du backend/DB (nouvelles cles, nouveaux endpoints), executer `/security-review` : le projet n'est plus un usage local de confiance, c'est une surface accessible depuis internet.

## Points d'entree utiles

| Besoin | Emplacement |
|---|---|
| Snapshot/fraicheur | `apps/backend/src/cache/snapshotCache.ts` |
| Fournisseurs | `apps/backend/src/providers/` |
| Familles reelles | `apps/backend/src/real/` |
| Routes backend | `apps/backend/src/server.ts` |
| Contrats | `packages/contracts/src/index.ts` |
| Marche | `apps/frontend/src/app/market/page.tsx` |
| Composants terminal | `apps/frontend/src/components/market/` |
| Shell/notifications | `apps/frontend/src/components/shell/` |
| Graphiques | `apps/frontend/src/components/workspace/` |
| Fraicheur UI | `apps/frontend/src/lib/formatFreshness.ts` |
| Lecture Globale | `apps/backend/src/intelligence/globalRead/` |
| Tests | `tests/` |

Si une decision produit est ambigue, ne pas remplacer une decision par une commodite technique : documenter le point et demander une decision au proprietaire.
