# Cartographie des données et des fetches — Gold Terminal

> Document de référence, en français, pour comprendre par famille : quelles API sont
> branchées, à quel rythme le backend les interroge **réellement aujourd'hui**, à
> quel moment la donnée sort officiellement chez le fournisseur, et comment chaque
> valeur dérivée est calculée. Écrit pour servir de base à un retravail de
> l'architecture des fetches (ne plus fetcher "bêtement", aligner le rythme sur la
> vraie fréquence de publication).
>
> Sources : lecture complète du code (`apps/backend/src/real/*.ts`,
> `apps/backend/src/cache/*.ts`, `apps/backend/src/db/ingestionState.ts`,
> `apps/backend/src/jobs/*.ts`, `apps/backend/src/providers/*.ts`) + vérification
> web des limites officielles et des horaires de publication de chaque fournisseur
> (liens en bas de chaque section). `docs/PROVIDER_SETUP.md` reste la référence pour
> l'activation/les clés — ce document-ci se concentre sur le **rythme** et le
> **calcul**, pas sur la mise en route.
>
> Dernière mise à jour : 2026-09-10.

---

## 0. Comment lire ce document — l'architecture actuelle en 3 points

**1. Il n'existe aucun cron/planificateur dans ce backend.** Pas de `setInterval`
qui va chercher les données toutes les X minutes en tâche de fond. Le modèle est
**paresseux et déclenché par la requête** : une donnée n'est re-fetchée que quand
quelqu'un charge une page (`/market`, `/journal`, etc.) **et** que le cache de
cette donnée précise a expiré. Zéro trafic = zéro appel API, même si le serveur
tourne 24/7. C'est une bonne base — le problème n'est pas "ça fetch tout le temps
sans raison", c'est plutôt, pour certaines familles, "le délai avant refetch (TTL)
est plus court que ce qui serait nécessaire vu la vraie fréquence de publication".

**2. Le cache n'est pas global, il est par clé de donnée.** `GET
/api/market/snapshot` ré-exécute la chaîne complète (F2 à F13) à **chaque** appel
— mais chaque fournisseur individuel (ex. `fred:VIXCLS`, `treasury:par-yield`,
`spdr:gld`) a sa propre entrée dans une `Map` en mémoire
(`apps/backend/src/real/cache.ts`, fonction `cached(clé, ttlMs, fetcher)`) avec
sa propre durée de vie (TTL). Tant que le TTL n'est pas expiré, la requête est
servie depuis la mémoire, zéro appel réseau. Si un fetch échoue, l'entrée est
supprimée immédiatement pour que la requête suivante retente (un échec n'est
jamais "gelé" pour toute la durée du TTL).

**3. Deux notions à ne pas confondre :**
- **Cadence de fraîcheur** (`REAL_KPI_CADENCE` dans `snapshotCache.ts`) : sert
  uniquement à décider si l'interface affiche "à jour" ou "obsolète" (`daily` =
  obsolète après 4 jours, `weekly` après 12 jours, `monthly` après 45 jours,
  `event` après 6h). Ça ne déclenche **aucun** fetch.
- **TTL de cache** (par fichier, listé famille par famille ci-dessous) : c'est
  le vrai levier qui détermine "au bout de combien de temps un prochain visiteur
  déclenche un vrai appel réseau". C'est ce qu'il faut retravailler si tu veux
  changer le rythme des fetches.

Sur 11 familles, **seules deux** ont une garde supplémentaire, persistée en base
(`ingestion_state`), qui survit à un redémarrage du serveur : le scraper
Investing.com Fed Rate Monitor (F3, 5h) et le calendrier JBlanked (F13, 1×/jour).
Toutes les autres familles reposent uniquement sur le TTL en mémoire — donc un
redémarrage du serveur remet leur compteur à zéro.

---

## 1. Vue d'ensemble — une ligne par famille

| Famille | API(s) branchées | Limite officielle fournisseur | Rythme réel de publication | TTL actuel dans le code |
|---|---|---|---|---|
| **F2** — Taux | Treasury (Par Yield Curve), FRED | Treasury : non publiée · FRED : 120 req/min avec clé | 1×/jour, ~15h30 ET | 15 min |
| **F3** — Fed / Anticipations de taux | NY Fed Markets Data, Investing.com Fed Rate Monitor (scrape) | NY Fed : non publiée · Investing.com : aucune (scrape, non officiel) | Range cible : ponctuel (annonce FOMC 14h00 ET) · Distribution de probabilités : continu en journée | 1h (range cible) · 5h (scrape, garde `ingestion_state`) |
| **F4** — Inflation | BLS (CPI/PPI), BEA (PCE) | BLS : 500 req/jour avec clé (25 sans) · BEA : 1000 req/min | Mensuel, 8h30 ET, dates calendaires BLS/BEA | 6h |
| **F5** — Emploi & Croissance | BLS (emploi), FRED (GDPNow, claims) | BLS : idem F4 · FRED : 120 req/min | Emploi : mensuel 8h30 ET (1er vendredi) · Claims : hebdo, jeudi 8h30 ET · GDPNow : 6-8×/mois, 10h30-12h00 ET | BLS 6h · GDPNow 1h · Claims 6h |
| **F6** — Devises (DXY) | Yahoo Finance (non officiel) | Non documentée (endpoint non officiel) | Continu (marché FX 24/5) | 15 min |
| **F7** — Risque / Crédit / Volatilité obligataire | FRED (VIX, HY OAS, IG OAS) | 120 req/min avec clé | Continu (séance US) | 15 min |
| **F8** — Liquidité / Funding | FRED (réserves, SOFR, IORB), NY Fed (EFFR), Treasury (TGA) | FRED 120 req/min · NY Fed n/a · Treasury n/a | SOFR ~8h00 ET · EFFR ~9h00 ET · TGA ~16h00 ET (J+1) · Réserves hebdo (mercredi) | 1h (SOFR/EFFR/TGA) · 6h (réserves) |
| **F9** — Treasury / Fiscal | Treasury Fiscal Data, page prose QRA | Non publiée | Adjudications : calendrier d'enchères · QRA : ~4×/an (fév/mai/août/nov) | 6h (adjudications) · 24h (QRA) |
| **F10** — Flux / Positionnement | CFTC (COT), SPDR (archive GLD) | CFTC : non publiée (public, sans clé) · SPDR : non publiée (fichier statique) | COT : hebdo, vendredi 15h30 ET (données du mardi précédent) · GLD holdings : avant l'ouverture US, horaire exact non confirmé publiquement | CFTC 6h (+ 12h pour l'historique 156 semaines) · SPDR 20h |
| **F11** — Volatilité de l'or (options) | FRED (GVZ) | 120 req/min avec clé | Continu (séance US) | 15 min |
| **F13** — Calendrier économique | JBlanked | 1 req/seconde, mais **compte actuellement à 0 crédit (bloqué)** | Continu (mises à jour d'événements) | 1×/jour max, forcé après 11h00 ET (garde `ingestion_state`) |
| **Actus (hors famille)** | Finnhub, GDELT (secours), Tavily (secours) | Finnhub : 60 req/min · GDELT : ~1 req/5s (non officiel) · Tavily : 1000 crédits/mois | Continu | **5 secondes, en continu, 24/7 — voir section 3, c'est le vrai problème** |

---

## 2. Détail par famille

### F2 — Taux (Rates)

- **KPIs** : `f2-2y`, `f2-10y`, `f2-10y-real`, `f2-be10`, `f2-5y5y`, `f2-2s10s`.
- **API connectées** :
  - **U.S. Treasury** (Daily Par Yield Curve + Daily Par Real Yield Curve, CSV public, aucune clé) — `f2-2y`, `f2-10y`, `f2-10y-real`.
  - **FRED** (`T10YIE`, `T5YIFR`, `T10Y2Y`) — `f2-be10`, `f2-5y5y`, `f2-2s10s`. Clé : `FRED_API_KEY`.
- **Limite officielle** : Treasury — aucune limite documentée publiquement, aucune clé requise. FRED — **120 requêtes/minute** avec clé enregistrée (confirmé via la doc officielle FRED).
- **Quand la donnée sort réellement** : les taux du jour sont fixés sur des cotations bid-side relevées par la Fed de New York **vers 15h30 heure de l'Est**, puis publiés par le Treasury en fin de journée. Une seule mise à jour par jour ouvré.
- **Rythme actuel dans le code** : `TREASURY_TTL_MS` et `FRED_TTL_MS` = **15 minutes** (`f2Rates.ts`).
- **Valeurs dérivées** : **aucune** — les 6 KPIs sont tous des lectures directes (`provenance: "observed"`). `f2-be10` (breakeven 10 ans) et `f2-2s10s` (spread 2s10s) étaient auparavant calculés (`DGS10-DFII10`, `y10-y2`) mais ont été basculés sur des séries FRED directes (`T10YIE`, `T10Y2Y`) lors d'un passage "source directe > dérivée".
- **Remarque** : la donnée ne change qu'une fois par jour vers 15h30 ET. Un TTL de 15 min pendant les heures de marché US peut générer jusqu'à ~26 refetchs possibles par jour ouvré si le trafic est constant — sans gravité vu la limite FRED (120/min), mais c'est un candidat naturel à un TTL plus long (ex. 1h, voire "jusqu'à 16h ET puis fige jusqu'au lendemain") si tu veux vraiment aligner sur la publication réelle plutôt que sur un TTL générique.

### F3 — Fed / Anticipations de taux

- **KPIs** : `f3-target-lower`, `f3-target-upper` (fourchette cible officielle) ; la distribution de probabilités de la prochaine réunion FOMC (pas un KPI scalaire, un champ structuré à part) ; `f3-repricing`/`f3-path-6m` restent `UNAVAILABLE` (aucune source gratuite trouvée).
- **API connectées** :
  - **NY Fed Markets Data** (fourchette cible EFFR) — pas de clé.
  - **Investing.com "Fed Rate Monitor"** (scrape via navigateur headless Playwright, page publique, pas d'API officielle) — pas de clé, pas de compte.
- **Limite officielle** : NY Fed — non documentée. Investing.com — **aucune limite officielle**, c'est un scrape d'une page publique (Cloudflare bloque les requêtes HTTP simples, d'où le navigateur headless).
- **Quand la donnée sort réellement** : la fourchette cible ne change qu'à l'annonce FOMC, **14h00 heure de l'Est**, le 2ᵉ jour de chacune des 8 réunions annuelles. La distribution de probabilités, elle, évolue en continu tout au long de la journée au gré des prix des futures Fed Funds.
- **Rythme actuel dans le code** : fourchette cible NY Fed = **1h** (`TTL_MS`, `f3Fed.ts`). Scrape Investing.com = **5 heures**, avec une garde persistée en base (`ingestion_state`, clé `investing:fed-rate-monitor`) qui survit à un redémarrage du serveur ; une distribution de plus de 15h (3× le cycle) est jugée trop vieille et renvoyée `UNAVAILABLE` plutôt que réutilisée.
- **Valeurs dérivées** : **aucune** — la fourchette cible est une lecture directe, et la distribution de probabilités est une **copie honnête** de ce qu'affiche Investing.com (`sourceTag: "INVESTING_FED_RATE_MONITOR"`), jamais recalculée. Une ancienne méthode de calcul maison à partir des futures ZQ + EFFR a été **définitivement abandonnée** après un bug confirmé de probabilités fausses — décision produit à ne jamais revenir en arrière là-dessus.
- **Remarque** : c'est déjà l'exemple le mieux réglé du projet — un cycle de 5h, choisi pour matcher le rythme réel de mise à jour de l'outil source, pas pour matcher une contrainte technique arbitraire. Rien à changer ici.

### F4 — Inflation

- **KPIs** : `f4-core-cpi-mom/yoy`, `f4-headline-cpi-mom/yoy`, `f4-core-cpi-3m-ann`, `f4-ppi-final-demand` (BLS) ; `f4-headline-pce-yoy`, `f4-core-pce-mom/yoy` (BEA).
- **API connectées** :
  - **BLS** (Bureau of Labor Statistics, API v2) — clé optionnelle (`BLS_API_KEY`).
  - **BEA** (Bureau of Economic Analysis, table NIPA `T20804`/`T20807`) — clé requise (`BEA_API_KEY`).
- **Limite officielle** : BLS — **25 requêtes/jour sans clé, 500/jour avec clé** enregistrée gratuite (v2 déverrouille aussi le POST multi-séries, utilisé ici). BEA — **1000 requêtes/minute** (avec un seuil séparé de 30 erreurs/min et 50 Mo/min).
- **Quand la donnée sort réellement** : CPI et PPI sortent **une fois par mois, 8h30 heure de l'Est**, à une date fixée à l'avance par le calendrier officiel BLS (généralement autour du 10-15 du mois pour le CPI). Le PCE (BEA) sort aussi **une fois par mois, 8h30 ET**, généralement en toute fin de mois (27-31).
- **Rythme actuel dans le code** : **6 heures** pour le paquet BLS (un seul appel POST combiné pour les 5 séries CPI/PPI) et **6 heures** pour les deux tables BEA (`f4Inflation.ts`, `blsMonthly.ts`).
- **Valeurs dérivées** :
  - `f4-core-cpi-mom`/`f4-headline-cpi-mom`/`f4-ppi-final-demand` : le `pct_change` officiel du BLS s'il est présent, sinon calcul `(dernier/dernier-1 mois - 1) × 100`.
  - `f4-core-cpi-yoy`/`f4-headline-cpi-yoy` : même logique, mais sur la série **non désaisonnalisée (NSA)** — c'est bien la convention officielle du BLS pour le glissement annuel (un écart réel de 2,5 % SA vs 3,4 % NSA a été confirmé pour juillet 2026, d'où ce choix).
  - `f4-core-cpi-3m-ann` : **toujours calculé** — `((dernier / dernier-3 mois)^4 - 1) × 100` (le BLS ne publie qu'un cumul sur 3 mois, jamais annualisé).
  - `f4-headline-pce-yoy`/`f4-core-pce-yoy` : **toujours calculé** — ratio d'indices sur la table BEA `T20804` (aucune table BEA officielle ne publie directement un glissement annuel en %).
  - `f4-core-pce-mom` : lecture directe de la table BEA `T20807`, qui publie déjà le %-mensuel officiellement (pas recalculé depuis l'indice arrondi).
- **Remarque** : donnée mensuelle interrogée toutes les 6h — largement suffisant vu que la vraie fréquence de changement est ~1×/mois ; le seul vrai enjeu ici n'est pas la sur-consommation de quota (BLS/BEA ont une marge énorme), c'est de s'assurer qu'un TTL de 6h ne fait pas louper la fraîcheur exacte le jour même d'une publication à 8h30 ET (le prochain visiteur après 8h30 déclenchera de toute façon un fetch si le cache a expiré depuis la dernière visite — pas un vrai risque en pratique).

### F5 — Emploi & Croissance

- **KPIs** : `f5-unemployment`, `f5-payrolls-latest`, `f5-payrolls-3m`, `f5-payrolls-revision-2m`, `f5-ahe-mom` (BLS) ; `f5-gdpnow` (FRED) ; `f5-claims-4w`, `f5-claims-initial`, `f5-claims-continuing` (FRED) ; `f5-ism-services`/`f5-ism-manufacturing` restent `UNAVAILABLE` (pas de source gratuite confirmée).
- **API connectées** : **BLS** (même clé que F4) ; **FRED** (`GDPNOW`, `IC4WSA`, `ICSA`, `CCSA`).
- **Limite officielle** : identique à F4/F2 (BLS 500/jour avec clé, FRED 120/min).
- **Quand la donnée sort réellement** : rapport emploi mensuel (NFP) — **1er vendredi du mois, 8h30 ET**. Inscriptions au chômage (claims) — **chaque jeudi, 8h30 ET**. GDPNow — **pas un jour fixe** : l'Atlanta Fed le recalcule **6 à 8 fois par mois**, entre 10h30 et 12h00 ET, à chaque nouvelle donnée d'input publiée (pas un horaire fixe).
- **Rythme actuel dans le code** : BLS = **6h**. GDPNow = **1h** (choix délibéré : "FRED republie GDPNow quasi quotidiennement pendant le trimestre", donc un TTL court capture les mises à jour sans horaire fixe). Claims FRED = **6h** (corrigé récemment — partageait auparavant, à tort, le TTL 1h de GDPNow alors que les claims ne sortent qu'une fois par semaine).
- **Valeurs dérivées** :
  - `f5-payrolls-latest` : `net_change` officiel du BLS si présent, sinon diff calendaire exacte.
  - `f5-payrolls-3m` : **toujours calculé** — moyenne des 3 derniers changements nets mensuels exacts (aucune source ne publie cette moyenne directement).
  - `f5-payrolls-revision-2m` : **toujours calculé**, et c'est la formule la plus élaborée du projet — le backend garde en base, à chaque fetch, la valeur brute du niveau des payrolls ("vintage") pour chaque mois de référence ; pour les 2 derniers mois, il compare la toute première valeur publiée à la valeur la plus récente pour ce même mois, fait la différence, et additionne les deux écarts. Résultat indisponible tant qu'un mois n'a pas au moins 2 versions enregistrées dans l'historique.
  - `f5-ahe-mom` : même logique observé/dérivé que le CPI mensuel.
  - `f5-claims-*` : lectures directes FRED, divisées par 1000 pour l'affichage en milliers.
- **Remarque** : GDPNow à 1h est justifié (pas d'horaire fixe, mise à jour imprévisible) — ne pas y toucher. Les claims à 6h sont déjà corrects depuis le bugfix récent.

### F6 — Devises (DXY)

- **KPIs** : `f6-dxy-recon-level`, `f6-dxy-recon-today`, `f6-dxy-recon-5d`, `f6-usd-state`.
- **API connectée** : **Yahoo Finance**, endpoint de graphique **non officiel et non documenté** (`query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB`), aucune clé.
- **Limite officielle** : **aucune** — c'est un endpoint non officiel, sans documentation publique de limite. Le comportement observé ailleurs (blocages/429 en cas de rafale) n'est pas garanti stable dans le temps.
- **Quand la donnée sort réellement** : le DXY est un indice de marché coté en continu tant que le marché des changes est ouvert (dimanche 17h ET à vendredi 17h ET).
- **Rythme actuel dans le code** : **15 minutes** (`YAHOO_TTL_MS`, `f6Currency.ts`) — choix volontairement conservateur malgré une cotation continue, précisément parce que l'endpoint n'est pas officiel et que sa tolérance réelle aux rafales est inconnue.
- **Valeurs dérivées** : `f6-dxy-recon-today` (variation vs. dernière clôture quotidienne connue) et `f6-dxy-recon-5d` (variation vs. il y a 5 séances) sont calculées à partir de l'historique renvoyé dans le **même** appel (pas d'appel supplémentaire). `f6-usd-state` est un texte ("Aligned"/"Divergent") selon que les deux variations ont le même signe ou non.
- **Remarque** : une ancienne formule de reconstruction du DXY à partir de 6 paires FX FRED existe encore dans le code, **désactivée et non appelée** — gardée uniquement en réserve si Yahoo devait un jour être abandonné. Rien à nettoyer côté fetch actif, mais bon à savoir si ce code mort te semble être du bruit.

### F7 — Risque / Crédit / Volatilité obligataire

- **KPIs** : `f7-vix`, `f7-vix-1d`, `f7-hy-oas`, `f7-hy-oas-1d`, `f7-ig-oas`. (`f7-move`/`f7-move-1d` restent `UNAVAILABLE` — pas de source gratuite fiable, voir remarque.)
- **API connectée** : **FRED** (`VIXCLS`, `BAMLH0A0HYM2`, `BAMLC0A0CM`), clé `FRED_API_KEY`.
- **Limite officielle** : 120 req/min avec clé.
- **Quand la donnée sort réellement** : VIX et les spreads de crédit ICE BofA sont calculés en continu pendant la séance US et FRED publie la valeur de clôture quotidienne le jour même en fin d'après-midi/soirée ET.
- **Rythme actuel dans le code** : **15 minutes** pour les 3 séries (`TTL_MS`, `f7Risk.ts`).
- **Valeurs dérivées** : `f7-vix-1d` et `f7-hy-oas-1d` sont de simples diffs jour/jour entre les deux dernières observations valides. Le reste est une lecture directe (HY OAS et IG OAS multipliés ×100 pour convertir des points de pourcentage en points de base).
- **Remarque sur MOVE** : l'indice MOVE (volatilité obligataire) reste volontairement `UNAVAILABLE` — ce n'est pas une série FRED, c'est un produit propriétaire ICE BofA payant, et le symbole `^MOVE` de Yahoo Finance a des métadonnées confirmées fausses (nom de produit erroné) — décision produit : ne jamais afficher une donnée dont la validation est douteuse.

### F8 — Liquidité / Funding

- **KPIs** : `f8-tga-level`, `f8-tga-daily`, `f8-reserves-level`, `f8-reserves-wow`, `f8-sofr-iorb`, `f8-effr-iorb`, `f8-funding-microstate`.
- **API connectées** : **FRED** (`WRBWFRBL`, `SOFR`, `IORB`) ; **NY Fed Markets Data** (EFFR) ; **U.S. Treasury** Fiscal Data (Daily Treasury Statement, solde du TGA).
- **Limite officielle** : FRED 120/min ; NY Fed et Treasury non documentées.
- **Quand la donnée sort réellement** : **SOFR ~8h00 ET** (jour ouvré suivant), **EFFR ~9h00 ET** (jour ouvré suivant), tous deux publiés directement par la Fed de New York. Le solde du TGA (Daily Treasury Statement) est publié **~16h00 ET, le jour ouvré suivant** la date couverte. Les réserves bancaires (`WRBWFRBL`) sont une série **hebdomadaire** (niveau du mercredi).
- **Rythme actuel dans le code** : **1 heure** pour SOFR/IORB, EFFR et TGA ; **6 heures** pour les réserves (cohérent avec leur cadence hebdomadaire).
- **Valeurs dérivées** :
  - `f8-tga-daily` : diff entre les deux dernières valeurs "Closing Balance" — **contournement documenté** d'une bizarrerie du jeu de données Treasury où le champ `close_today_bal` attendu est toujours `null`.
  - `f8-reserves-wow` : diff simple semaine/semaine.
  - `f8-sofr-iorb` : `(SOFR - IORB) × 100` en points de base, un seul fournisseur (FRED).
  - `f8-effr-iorb` : `(EFFR - IORB) × 100` en points de base — **deux fournisseurs** (NY Fed + FRED), d'où un double `sourceTags`.
  - `f8-funding-microstate` : texte "NORMAL" ou "ANOMALOUS" selon que `|SOFR-IORB|` dépasse 5 points de base.
- **Remarque** : TGA à 1h alors que la donnée ne change qu'une fois par jour à ~16h ET — même logique que F2, un TTL plus long (voire aligné sur l'horaire de publication) réduirait le nombre d'appels sans rien perdre en fraîcheur réelle, mais l'impact quota est négligeable ici (Treasury n'a pas de limite documentée).

### F9 — Treasury / Fiscal

- **KPIs** : `f9-auction-high-yield`, `f9-auction-btc`, `f9-auction-indirect` (dernière adjudication du 10 ans) ; `f9-qra-borrowing`, `f9-qra-revision`.
- **API connectée** : **U.S. Treasury Fiscal Data** — `auctions_query` pour les adjudications, et une page de communiqué de presse en HTML/prose pour le QRA (pas d'API structurée pour cette dernière — le communiqué "Treasury Announces Marketable Borrowing Estimates" est parsé directement via un analyseur de texte strict).
- **Limite officielle** : non documentée, aucune clé requise.
- **Quand la donnée sort réellement** : les résultats d'adjudication suivent le calendrier des enchères du Treasury (variable, plusieurs fois par mois pour le 10 ans). Le QRA ("Quarterly Refunding") ne sort que **4 fois par an**, début février/mai/août/novembre.
- **Rythme actuel dans le code** : **6 heures** pour les adjudications et le calendrier à venir ; **24 heures** pour le QRA (cohérent avec sa fréquence trimestrielle — au plus un vrai appel réseau par jour).
- **Valeurs dérivées** : **aucune** — adjudications et QRA sont tous deux des lectures/parsings directs (`provenance: "observed"`). Le QRA n'est jamais recalculé depuis les variations de dette mensuelle (approche essayée puis abandonnée car elle ne fonctionnait pas proprement).
- **Remarque** : c'est le deuxième exemple bien réglé du projet — le TTL de 24h pour une donnée trimestrielle est délibérément généreux, pas un oubli.

### F10 — Flux / Positionnement

- **KPIs** : `f10-mm-net-pct`, `f10-mm-wow-pp`, `f10-mm-percentile` (CFTC) ; `f10-etf-holdings`, `f10-etf-delta`, `f10-etf-delta-5d/-20d`, `f10-etf-flow-z60`, `f10-etf-flow-percentile`, `f10-gld-return-5d/-20d` (SPDR).
- **API connectées** : **CFTC** (Commitments of Traders, dataset Socrata `72hh-3qpy`, public, sans clé) ; **SPDR** (archive historique XLSX de `spdrgoldshares.com`, publique, sans clé).
- **Limite officielle** : ni l'une ni l'autre ne publie de limite documentée.
- **Quand la donnée sort réellement** : le rapport COT (positionnement) sort **chaque vendredi à 15h30 heure de l'Est**, et reflète la situation du **mardi précédent** (délai structurel de ~3 jours, propre à ce rapport, pas un problème de fetch). L'archive SPDR des avoirs physiques du GLD est mise à jour **avant l'ouverture du marché US** — l'horaire exact n'a pas pu être confirmé publiquement (ni dans la doc SPDR, ni via recherche web), d'où le TTL conservateur ci-dessous.
- **Rythme actuel dans le code** : CFTC **6 heures** pour les 2 derniers rapports, **12 heures** pour l'historique complet (156 semaines, utilisé pour le percentile, mis en cache séparément pour ne jamais refaire 156 appels). SPDR **20 heures**.
- **Valeurs dérivées** — la famille la plus riche en calculs du projet :
  - `f10-mm-net-pct` : `(long Managed Money - short Managed Money) / open interest total × 100`.
  - `f10-mm-wow-pp` : diff en points de pourcentage entre les 2 derniers rapports hebdomadaires.
  - `f10-mm-percentile` : **rang percentile empirique** de la lecture actuelle dans les **156 dernières semaines** (~3 ans) — nécessite au moins 52 semaines d'historique, sinon `UNAVAILABLE`.
  - `f10-etf-delta`/`-5d`/`-20d` : diffs de tonnage entre jours de bourse valides (les jours fériés du fichier SPDR, marqués explicitement, sont exclus, jamais interpolés).
  - `f10-etf-flow-z60` : **Z-score glissant sur 60 jours** des flux quotidiens de tonnage — `(flux du jour - moyenne 60j) / écart-type 60j`.
  - `f10-etf-flow-percentile` : rang percentile du flux sur 20 jours dans un historique glissant de **756 observations** (~3 ans de séances).
  - `f10-gld-return-5d`/`-20d` : rendement en % du prix de clôture du GLD, avec une classification texte comparant le signe du rendement 20j à celui de la variation physique 20j (ex. "confirme la force du prix" vs "divergence négative").
- **Remarque** : les fenêtres de percentile (756 observations) et de Z-score (60 jours) viennent d'un **seul** appel d'historique en masse mis en cache 12h/20h, jamais recalculées appel par appel — c'est déjà le bon pattern pour ce genre de fenêtre glissante.

### F11 — Volatilité de l'or (options)

- **KPIs** : `f11-gvz`, `f11-gvz-1d`, `f11-gvz-5d`.
- **API connectée** : **FRED**, série unique `GVZCLS` (CBOE Gold ETF Volatility Index).
- **Limite officielle** : 120 req/min avec clé.
- **Quand la donnée sort réellement** : continu pendant la séance US, clôture quotidienne publiée par FRED en soirée ET.
- **Rythme actuel dans le code** : **15 minutes** (`TTL_MS`, `f11GoldVol.ts`).
- **Valeurs dérivées** : `f11-gvz-1d` et `f11-gvz-5d` sont de simples diffs (dernière observation moins l'observation 1 ou 5 jours en arrière).
- **Remarque** : une piste "options GLD via Massive/Polygon" a été testée et abandonnée — les métadonnées de contrats individuels fonctionnent, mais il n'existe aucun endpoint groupé, et calculer un vrai ratio put/call agrégé demanderait un appel par contrat sur des centaines de strikes/échéances, infaisable sous un plan gratuit limité à 5 appels/min. GVZ reste donc le seul proxy, assumé comme tel.

### F13 — Calendrier économique (JBlanked)

- **Pas de KPI scalaire** — cette famille alimente le calendrier (`nextEvents`, `activeCatalyst`, et les routes dédiées `/api/calendar/*`).
- **API connectée** : **JBlanked** (source `mql5`), clé `JBLANKED_API_KEY`.
- **Limite officielle** : **1 requête/seconde** selon la doc JBlanked — mais en pratique, le compte configuré est actuellement **à 0 crédit**, donc **tous les appels sont bloqués** avec une erreur de facturation (`401`, "this endpoint requires credits"). Ce n'est pas un bug de code, c'est un compte à recharger sur `jblanked.com/api/billing/` si tu veux réactiver cette famille.
- **Quand la donnée sort réellement** : le calendrier économique lui-même est mis à jour en continu par JBlanked (nouveaux événements, révisions), mais ce que ce backend en fait est volontairement plafonné (voir ci-dessous).
- **Rythme actuel dans le code** — c'est la garde la plus élaborée du projet, entièrement pensée pour respecter un budget de requêtes serré :
  - **Au plus 1 appel réel par jour calendaire (UTC)**, imposé par une table Postgres (`ingestion_state`, clé `jblanked:calendar`) qui survit à un redémarrage.
  - Le premier appel du jour est **délibérément retardé jusqu'à 11h00 heure de l'Est**, pour qu'il arrive après les publications courantes de 8h30/10h00 ET plutôt qu'avant (bug vécu et corrigé : un appel à 9h25 ET ratait des données JOLTS/ISM publiées à 10h00).
  - Après un échec (y compris le blocage facturation actuel), un **cooldown d'1 heure** empêche de retenter en boucle.
  - Une fenêtre glissante de J-2 à J+9 est demandée à chaque appel réussi.
- **Valeurs dérivées** : la "surprise" (`actual - forecast`) et le remplacement du champ "Actual" de JBlanked par la vraie valeur déjà calculée par les autres familles (F4/F5/etc.) une fois l'heure de publication passée — pour ne jamais afficher un `0` de JBlanked comme si c'était une vraie valeur nulle.
- **Remarque** : rien à retravailler ici côté rythme — c'est déjà exactement le modèle "1 fetch/jour, pas plus" que tu decris vouloir pour les autres familles. Le seul point d'action est une décision business (recharger des crédits JBlanked ou non), pas un chantier technique.

---

## 3. Le vrai point chaud : les actualités (Finnhub / GDELT / Tavily)

C'est **la seule vraie source de "fetch bête"** trouvée dans ce projet, et elle
ne fait pas partie des familles F2-F13 — elle vit dans
`apps/backend/src/news/finnhubGoldNews.ts`.

**Ce qui se passe concrètement :**
- Dès qu'**une seule** personne charge la page News (ou que l'endpoint
  `/api/news/gold` est appelé une fois), une boucle `setInterval` démarre côté
  serveur — et **elle ne s'arrête jamais**, même si plus personne ne regarde la
  page. Elle continue de tourner jusqu'au redémarrage du serveur.
- Cette boucle vérifie **toutes les 5 secondes** si le titre le plus récent en
  cache a moins de 60 secondes. Une vraie actualité gold ne sort évidemment pas
  toutes les 60 secondes — donc cette condition est presque toujours fausse, et
  la boucle **relance un vrai fetch réseau presque à chaque tick de 5 secondes**.
- Chaque relance appelle **3 endpoints Finnhub** en parallèle (`/news?general`,
  `/news?forex`, `/company-news?symbol=GLD`).
- Ça donne, en continu, 24 heures sur 24 : **jusqu'à 36 appels Finnhub par
  minute**, sur un quota gratuit Finnhub de **60 appels/minute** — soit 60 % du
  budget total englouti en permanence par une seule fonctionnalité, pour une
  donnée qui n'a besoin d'être fraîche qu'à l'échelle de la minute, pas de la
  seconde.
- Côté frontend (`GoldNewsLive.tsx`), il y a en plus un **double mécanisme
  redondant** : un flux SSE (push en temps réel) **et** un polling de secours
  toutes les 15 secondes qui tourne en parallèle, même quand le flux SSE
  fonctionne très bien. Ça ne tape pas directement Finnhub (ça tape notre propre
  backend), mais c'est du trafic inutile.

**Pourquoi ce n'est pas grave aujourd'hui** : le quota Finnhub (60/min) n'est
pas dépassé, donc ça ne casse rien pour l'instant. Mais c'est exactement le
genre de chose qui casse le jour où le trafic augmente un peu, où Finnhub
resserre son quota gratuit, ou si un jour cette même logique de polling sert de
modèle à une autre intégration.

**Piste de correction (à valider avec toi avant de coder quoi que ce soit)** :
remplacer la boucle "toutes les 5s, pour toujours" par le même modèle que les
familles F2-F13 : un TTL de cache raisonnable (1 à 5 minutes semble largement
suffisant pour de l'actu marché) et un arrêt du `setInterval` quand plus aucun
client SSE n'est connecté, plutôt qu'une boucle infinie démarrée une fois pour
toutes.

---

## 4. Clés API présentes dans `.env` mais jamais utilisées dans le code

En auditant `apps/backend/src/config/env.ts` et l'ensemble du code, ces
variables existent dans `.env`/`.env.example` mais **aucun fichier ne les lit** :

- `FMP_API_KEY` (Financial Modeling Prep)
- `ALPHAVINTAGE_API_KEY` (Alpha Vantage)
- `SSGA_GLD_URL`

Ce ne sont pas des bugs — probablement des pistes explorées puis abandonnées
(`docs/PROVIDER_SETUP.md` mentionne explicitement que FMP/Finnhub ont été
écartés pour F10 au profit de l'archive SPDR directe). Mais elles ne coûtent
rien à fetcher puisqu'elles ne sont jamais appelées — pas une priorité, juste à
savoir si tu fais un jour un nettoyage de `.env`.

---

## 5. Fournisseurs IA (OpenAI / Anthropic / Gemini / Tavily-recherche)

Ces 4 fournisseurs sont **hors du système de fetch de marché** décrit ci-dessus
— ils ne sont jamais appelés par `/api/market/snapshot`. Ils sont gérés par un
seul interrupteur global, `DATA_MODE` (`apps/backend/src/intelligence/dataMode.ts`),
actuellement réglé sur `MOCK` **par décision explicite** (pour ne pas engager de
coût au-delà de tes abonnements existants). Tant que `DATA_MODE=MOCK`, aucun de
ces 4 fournisseurs n'est jamais appelé par l'application qui tourne — seule la
commande manuelle `npm run provider:test -- <id>` les touche, et seulement sur
demande explicite d'un humain. Rien à retravailler ici tant que ce mode reste
désactivé ; si tu réactives `DATA_MODE=REAL` un jour, ce sera un chantier à part
(coûts par appel de génération, pas un sujet de "rythme de fetch").

---

## 6. Recommandations concrètes, par ordre de priorité

1. **Corriger la boucle Finnhub (section 3)** — c'est le seul vrai problème
   actif du projet. Remplacer la boucle infinie 5s par un TTL classique (comme
   toutes les familles F2-F13) et arrêter le polling quand personne n'écoute.
2. **Allonger les TTL des séries "1×/jour à horaire connu"** (F2 taux à 15 min,
   F8 TGA à 1h) vers quelque chose de plus proche de leur vrai rythme de
   publication (ex. 1h pour F2, ou une logique "fige jusqu'au lendemain une
   fois l'horaire de publication passé"). Impact quota négligeable aujourd'hui
   (FRED/Treasury sont généreux), mais ça rapproche l'architecture de ce que tu
   décris vouloir : ne pas fetcher avant que ça sorte.
3. **Rien à toucher sur F3 (scrape 5h), F9 (QRA 24h), F13 (JBlanked 1×/jour)**
   — ces trois-là appliquent déjà exactement le principe que tu demandes.
4. **F13 reste bloqué par un problème de facturation, pas de code** — décision
   à prendre : recharger des crédits JBlanked ou laisser le calendrier
   `UNAVAILABLE`.
5. **Nettoyage optionnel** : `FMP_API_KEY`/`ALPHAVINTAGE_API_KEY`/`SSGA_GLD_URL`
   dans `.env` ne servent à rien aujourd'hui — à retirer ou à documenter le
   pourquoi si tu préfères les garder en réserve.
