# Données du cockpit Marché / Décision — provenance, fetch, période, fraîcheur, formules

> Ce document répond à une question précise : pour CHAQUE KPI affiché sur la page Marché/Décision, d'où vient le chiffre, quand a-t-il été récupéré, quelle période réelle représente-t-il, comment sa fraîcheur est-elle jugée, et — pour toute valeur dérivée — comment est-elle calculée exactement.
>
> Il complète [GUIDE_FONCTIONNEMENT_DONNEES.md](GUIDE_FONCTIONNEMENT_DONNEES.md) (qui documente les providers eux-mêmes, leurs URLs, leurs quotas) en adoptant l'angle inverse : organisé par FAMILLE puis par KPI, comme le cockpit lui-même, avec le niveau de détail nécessaire pour comprendre pourquoi une valeur affichée est ce qu'elle est à un instant donné.
>
> Dernière mise à jour : 2026-09-09, suite à une session d'audit déclenchée par des questions concrètes sur des écarts de date apparents dans le cockpit.

---

## 0. Mécanique générale (vraie pour toutes les familles REAL)

### 0.1 Quand un fetch réseau part réellement

Il n'existe **aucun scheduler/cron** qui rafraîchit les données en tâche de fond. Tout est **lazy** :

1. Une requête arrive sur une route qui appelle `getMarketSnapshot()` (`apps/backend/src/cache/snapshotCache.ts`) — typiquement `GET /api/market/snapshot`, mais aussi les routes d'intelligence IA qui lisent le snapshot.
2. Cette fonction appelle `buildRealFamilyOverrides()` (`apps/backend/src/real/buildRealOverrides.ts`), qui lance en parallèle un `buildF*Overrides()` par famille.
3. Chaque `buildF*Overrides()` passe par un cache mémoire par clé, `cached(key, ttlMs, fetcher)` (`apps/backend/src/real/cache.ts`) :
   - Si la dernière valeur en mémoire pour cette clé a moins de `ttlMs`, elle est réutilisée — **aucun appel réseau**.
   - Sinon, `fetcher()` part réellement, et sa valeur (ou son échec) devient la nouvelle entrée du cache.
   - **Un échec (exception ou `null`/`NaN`) n'est jamais mis en cache** — la prochaine requête retente immédiatement, jamais besoin d'attendre l'expiration du TTL après un raté (voir `cache.ts`'s "Bug B fix").

Donc : le rythme réel des appels réseau vers FRED/BLS/Treasury/etc. est gouverné par (a) le TTL propre à chaque famille/KPI et (b) la fréquence à laquelle quelqu'un consulte réellement le cockpit — pas par une horloge fixe.

Certaines familles (F3 distribution Fed, F13 calendrier JBlanked) ajoutent une **garde persistante en base de données** (`ingestion_state`) par-dessus ce cache mémoire, pour survivre à un redémarrage du process et respecter des quotas stricts (JBlanked : 1 appel/jour). Ces gardes sont détaillées dans leurs sections respectives.

### 0.2 `observationAt` vs `retrievedAt` — la source de la confusion "fetché aujourd'hui, période d'il y a 2 jours"

Chaque KPI porte deux dates distinctes, et c'est la clé pour comprendre tous les écarts de date remarqués dans le cockpit :

- **`retrievedAt`** : le moment où LE BACKEND a effectivement exécuté le fetch réseau (ou relu le cache mémoire). C'est ce que le badge "Actualisé il y a X min" affiche.
- **`observationAt`** : la date/période à laquelle LA DONNÉE ELLE-MÊME s'applique, telle que la source officielle la publie. C'est le "●  Période : ..." affiché sous certains KPI.

Ces deux dates sont **presque toujours différentes**, et c'est normal, pas un bug : une donnée gouvernementale/de marché a un calendrier de publication qui n'a rien à voir avec le moment où quelqu'un consulte le cockpit.

**Exemples concrets vérifiés en direct pendant cet audit (9 septembre 2026, données réelles) :**

| KPI | `retrievedAt` (aujourd'hui) | `observationAt` (période réelle) | Explication |
|---|---|---|---|
| 2Y / 10Y Treasury | 9 sept, ~12h20 | **8 septembre** | Treasury publie sa courbe de taux en fin de journée ; la ligne du 9 septembre n'existait pas encore au moment de la consultation. Vérifié en direct sur `home.treasury.gov` : la dernière ligne CSV disponible était bien celle du 8/09 (2Y=4,39 / 10Y=4,80 / 2s10s=41bps) — **valeurs identiques à celles affichées dans le cockpit**, donc la donnée est correcte, seulement "en retard d'un jour" par nature. |
| VIX | 9 sept | 8 septembre | FRED republie `VIXCLS` avec ~1 jour de décalage, comportement structurel de la série, pas un dysfonctionnement du backend. |
| Réserves bancaires (WoW) | 9 sept | ~1er-2 septembre | La Fed publie son H.4.1 hebdomadaire le jeudi pour le mercredi précédent — un décalage d'environ une semaine est **normal et attendu** pour cette série, largement dans le seuil de fraîcheur de 12 jours prévu pour la cadence "weekly" (voir 0.3). |

Pour une série mensuelle (CPI, PCE, payrolls), l'écart est encore plus grand par nature : `observationAt` pointe vers la fin du mois de référence (ex. "31 juillet 2026" pour un chiffre publié mi-août), ce qui peut sembler "vieux" alors que c'est la donnée officielle la plus récente qui existe.

### 0.3 Fraîcheur (`current` / `stale` / `unavailable`) — la formule exacte

Trois états seulement (`apps/backend/src/cache/snapshotCache.ts`) :

- `unavailable` : le KPI est `UNAVAILABLE` (pas de source, échec de fetch, ou historique insuffisant) — voir 0.4.
- `current` / `stale` : chaque KPI REAL est rattaché à une **cadence** dans la table `REAL_KPI_CADENCE` (une des 4 valeurs `daily` / `weekly` / `monthly` / `event`), et la règle diffère selon la cadence :

| Cadence | Seuil | Formule exacte | Se base sur |
|---|---|---|---|
| `daily` | — | `completedWeekdaySessionsSince(observationAt) <= 1` : compte le nombre de **jours ouvrés (lun-ven) complets** écoulés entre `observationAt` et aujourd'hui (minuit UTC à minuit UTC). `current` si ≤ 1 session complète s'est écoulée. Les week-ends ne comptent jamais. | `observationAt` |
| `weekly` | 12 jours | `Date.now() - observationAt < 12 jours` | `observationAt` |
| `monthly` | 45 jours | `Date.now() - observationAt < 45 jours` | `observationAt` |
| `event` | 6 heures | `Date.now() - retrievedAt < 6h` | **`retrievedAt`**, pas `observationAt` — seule exception. Un KPI "event" (ex. target range Fed) reste "current" tant que le backend a réussi un fetch récent, indépendamment de si la valeur elle-même a changé. |

**Si un KPI REAL n'a aucune entrée dans `REAL_KPI_CADENCE`** (bug de configuration, jamais censé arriver), le système ne retombe JAMAIS sur "current" par défaut — il logue une erreur et renvoie `stale` par sécurité (correctif explicite d'un bug historique où l'inverse se produisait silencieusement).

Les seuils (4j implicite pour daily via le calcul de sessions, 12j, 45j, 6h) sont choisis pour absorber le décalage de publication normal de chaque cadence (week-end + un jour férié pour daily, une semaine + un délai pour weekly, ~2-3 semaines de délai BLS pour monthly) sans jamais afficher "stale" sur la donnée officielle la plus récente qui existe légitimement.

### 0.4 Les trois façons d'être "indisponible"

- `NO_SOURCE` : aucune source acceptée n'existe pour ce KPI (ex. F12 demande physique, F3 repricing/path-6m).
- `FETCH_FAILED` : une source existe, mais la tentative a échoué (réseau, parsing, structure de page changée, quota).
- `INSUFFICIENT_HISTORY` : la source répond, mais il manque des points d'historique pour calculer le KPI (ex. une révision qui nécessite 2 vintages).

**Politique "no-fallback" stricte** : quand une famille REAL échoue, elle ne retombe JAMAIS sur une fixture MOCK, jamais sur un autre provider de secours, jamais sur l'ancienne valeur silencieusement conservée. Une valeur affichée est soit réelle et à jour au sens de sa cadence, soit explicitement marquée indisponible avec une raison.

### 0.5 Ce que ce document NE couvre PAS

Les mécaniques génériques déjà documentées ailleurs et non redupliquées ici en détail : format exact des réponses HTTP par provider (→ GUIDE_FONCTIONNEMENT_DONNEES.md §4), variables d'environnement (→ idem §9), smoke tests (→ idem §11).

---

## F3 — Fed / Anticipations de taux

Fichiers : `apps/backend/src/real/f3Fed.ts`, `apps/backend/src/providers/nyFed.ts`, `apps/backend/src/real/fedRateDistributionStore.ts`, `apps/backend/src/providers/investingFedRateMonitor.ts`, `apps/backend/src/providers/fedBoard.ts`.

### `f3-target-lower` / `f3-target-upper` (fourchette cible Fed)

- **Source** : NY Fed Markets Data API, `https://markets.newyorkfed.org/api/rates/unsecured/all/latest.json`, entrée `refRates[type=="EFFR"]`, champs `targetRateFrom`/`targetRateTo`. Pas de clé API.
- **Fetch/TTL** : clé cache `"nyFed:targetRange"`, TTL = **1h**.
- **`observationAt`** : `effr.effectiveDate` du flux NY Fed — date d'effectivité du taux telle que publiée, pas l'heure du fetch.
- **Cadence de fraîcheur** : `"event"` — **exception à la règle générale** : jugé "current" tant qu'un fetch NY Fed a réussi dans les 6 dernières heures (voir 0.3), même si le taux cible n'a pas changé depuis des mois. Ce n'est pas une fraîcheur de la valeur, c'est une fraîcheur du pipeline de collecte.
- **Dérivé ?** Non, lecture directe.
- **Échec** → `UNAVAILABLE/FETCH_FAILED` pour les deux KPI.

### `FedRateDistribution` — distribution de probabilité de la prochaine réunion FOMC

**Ce n'est pas un `CanonicalKpi` classique** : c'est un champ structurel au niveau de la famille F3 (liste de N buckets, chacun avec son propre libellé de fourchette et probabilités), géré entièrement en dehors du mécanisme générique de fraîcheur ci-dessus (0.3) — sa fraîcheur est encodée directement dans ses propres timestamps.

- **Source** : page publique `investing.com/central-banks/fed-rate-monitor`, un TIERS affichant des chiffres dérivés des futures CME ZQ (jamais un flux CME direct — `sourceTag` toujours `"INVESTING_FED_RATE_MONITOR"`). Un `fetch()` simple est bloqué par Cloudflare (HTTP 403) ; le scrape passe donc par un vrai navigateur **Chromium headless via Playwright**.
- **`observationAt`** : le texte "Updated: ..." affiché **par la page investing.com elle-même** (parsé en heure de New York, converti en UTC) — c'est-à-dire quand investing.com dit avoir mis à jour SON tableau, pas quand le backend l'a lu. Fallback sur l'heure du scrape si ce texte n'a pas pu être parsé.
- **`nextMeetingAt`** : priorité à une lecture réelle du calendrier F13 (`macro_events`, type `FOMC_RATE_DECISION`) ; sinon le texte "Meeting Time" de la page elle-même.
- **Mécanique de garde du fetch — 3 couches empilées :**
  1. **Cache mémoire process** : TTL 5h.
  2. **Garde persistante en base** (`ingestion_state`, clé `"investing:fed-rate-monitor"`, survit aux redémarrages) : si le dernier essai (réussi OU échoué) date de moins de 5h, aucun nouveau scrape n'est tenté — la dernière distribution persistée est réutilisée si elle existe, sinon `UNAVAILABLE/FETCH_FAILED`.
     - **Point important** : la tentative est enregistrée comme "faite" avant même que Playwright ne se lance, qu'elle réussisse ou échoue ensuite — un échec (ex. Chromium absent) verrouille quand même la fenêtre de 5h, le système ne retente pas plus vite après un raté.
  3. **Péremption de la distribution réutilisée** : une distribution persistée n'est resservie que si elle a moins de 15h (3× la cadence) ; au-delà, `UNAVAILABLE/FETCH_FAILED` même si une valeur existe en base.
- **Persistance** : encodage compact (pas JSON, contrainte de 255 caractères en base) — seule la probabilité **courante** de chaque bucket est sauvegardée ; `previousDay`/`previousWeek` ne sont disponibles que juste après un scrape frais, pas sur le chemin "réutilisation depuis la base".
- **Vérification de cohérence (pas une correction)** : les probabilités extraites doivent sommer à ~100% (± 1,5 point, pour absorber l'arrondi de la page) — sinon le scrape est traité comme raté plutôt que fait confiance.

**🔧 Bug de production trouvé et corrigé pendant cet audit** : le binaire Chromium n'était jamais installé sur Railway (`playwright-core` fournit seulement l'API d'automatisation, pas le navigateur lui-même — une étape d'installation unique `playwright-core install chromium` était documentée comme requise "par machine/cible de déploiement" mais n'avait jamais été branchée dans le build Railway). Résultat en production : le scrape échoue systématiquement, la garde de 5h se déclenche quand même (voir ci-dessus), donc `FedRateDistribution` reste bloqué en `UNAVAILABLE/FETCH_FAILED` en continu — exactement le "Prochaine réunion — données non disponibles" observé. **Corrigé** via un `postinstall` dans `apps/backend/package.json` + un `nixpacks.toml` déclarant les librairies système nécessaires. **Pas encore vérifié en production, nécessite un redéploiement Railway** puis un contrôle de `/api/providers/status` ou de la carte Fed du cockpit.

### `f3-repricing` / `f3-path-6m`
Toujours `UNAVAILABLE/NO_SOURCE`, inconditionnellement — aucune source identifiée, jamais tenté.

### `fedBoard.ts` (H.15) — contexte seulement
Confirmé dans le code : pas de pipeline KPI complet branché sur ce flux XML. Utilisé uniquement pour le smoke test de connectivité et du contexte qualitatif — aucun KPI F3 n'est directement alimenté par H.15.

---

## F5 — Emploi et croissance

Fichier principal : `apps/backend/src/real/f5Employment.ts`. Helpers de calcul partagés : `apps/backend/src/real/blsMonthly.ts`.

### `f5-unemployment`
- **Source** : BLS série `LNS14000000`, récupérée dans le même appel POST groupé que payrolls/AHE.
- **Fetch/TTL** : clé `"bls:calc:f5-employment"`, TTL **6h**.
- **`observationAt`** : dernier jour calendaire du mois de référence BLS (ex. "31 juillet 2026"), pas la date de publication réelle — choix qui ancre la fenêtre de fraîcheur (45j) sur la fin du mois couvert, pour absorber le délai de publication BLS de 2-3 semaines.
- **Cadence** : `monthly` (seuil 45j).
- **Dérivé ?** Non, lecture directe (`provenance: "observed"`).

### `f5-payrolls-latest`
- **Source** : BLS `CES0000000001`.
- **Formule** : priorité au `net_change` 1 mois **fourni directement par BLS** dans le bloc `calculations` (`provenance: "observed"`) ; sinon différence exacte `valeur(mois M) - valeur(mois M-1)` par correspondance calendaire stricte (jamais par décalage de tableau — un bug historique corrigé, voir plus bas), `provenance: "derived"`. Arrondi à l'entier.
- **`observationAt`** : fin du mois de référence du dernier print.
- **Cadence** : `monthly`.

### `f5-payrolls-3m`
- **Formule exacte** — moyenne de 3 diffs mensuels consécutifs, chacun calculé par différence de niveau calendaire exacte (jamais la métrique cumulative 3 mois de BLS, qui mesure autre chose) :
  ```
  diff1 = niveau(M0) − niveau(M−1)
  diff2 = niveau(M−1) − niveau(M−2)
  diff3 = niveau(M−2) − niveau(M−3)
  f5-payrolls-3m = (diff1 + diff2 + diff3) / 3
  ```
- Nécessite les 4 mois exacts M0..M-3 dans l'historique fetché ; sinon `UNAVAILABLE`. Toujours `provenance: "derived"`.
- **Cadence** : `monthly`.

### `f5-payrolls-revision-2m`
- **Formule** :
  ```
  M-1 = mois calendaire précédent le dernier print
  M-2 = deux mois calendaires avant
  révision(mois) = dernière version persistée − première version persistée (pour ce mois)
  f5-payrolls-revision-2m = révision(M-1) + révision(M-2)
  ```
- **Mécanisme de "vintages"** : à chaque fetch réussi, les niveaux bruts des 3 derniers mois calendaires sont persistés en base (append-only, une ligne par fetch qui apporte une valeur nouvelle) sous un id interne jamais exposé au frontend. Une révision n'est calculable que si un mois donné a été vu **au moins 2 fois** (le print initial, puis un fetch ultérieur qui montre potentiellement une révision BLS).
- **Si moins de 2 versions existent pour M-1 ou M-2** → `UNAVAILABLE/INSUFFICIENT_HISTORY` (comportement voulu, pas un bug — au tout début ou après une purge de base, il faut au minimum 2 cycles mensuels avant que ce KPI devienne disponible).
- **Cadence** : `monthly`.

### `f5-ahe-mom` (salaire horaire moyen)
- **Source** : BLS `CES0500000003`.
- **Formule** : priorité au `pct_change` 1 mois BLS natif (`observed`) ; sinon `((valeur(M0) / valeur(M-1)) − 1) × 100` par correspondance calendaire exacte (`derived`). Arrondi à 1 décimale.
- **Cadence** : `monthly`.

### `f5-gdpnow`
- **Source** : FRED, série `GDPNOW`.
- **Fetch/TTL** : **1h** (justifié par une republication quasi quotidienne de GDPNow pendant le trimestre).
- **`observationAt` — point subtil** : le champ `date` de FRED pour GDPNOW représente le **début du trimestre CIBLE** (ex. "01/07/2026" pour une estimation Q3), pas une date de publication. Le code utilise donc `realtime_start` (la date de vintage réelle de cette lecture) comme `observationAt`, avec repli sur l'heure du fetch si absent.
- **Cadence** : `daily` (via `completedWeekdaySessionsSince`, voir 0.3).
- **Dérivé ?** Non — lecture directe, `provenance: "estimated"` (tag distinct de "observed", puisque GDPNow est lui-même une estimation temps réel de la Fed d'Atlanta, pas un chiffre officiel définitif).

### `f5-claims-4w`, `f5-claims-initial`, `f5-claims-continuing`
- **Sources FRED** : `IC4WSA` (moyenne mobile 4 semaines), `ICSA` (inscriptions initiales hebdo désaisonnalisées), `CCSA` (continuing claims désaisonnalisées).
- **Fetch/TTL** : **6h** pour les trois.
- **Transformation** : valeur FRED brute divisée par 1000 et arrondie à l'entier (changement d'unité, pas une dérivation économique).
- **`observationAt`** : date de la semaine de référence telle que publiée par FRED, directement utilisable (pas de décalage trimestre/publication comme pour GDPNow).
- **Cadence** : `weekly` (seuil 12j).

### Notes / points d'attention F5-F3

- **Bug historique déjà corrigé (pour mémoire)** : toutes les figures MoM/YoY/3M-annualisé de F4/F5 étaient auparavant calculées par **décalage d'index de tableau** (`history[1]`, `history[12]`...), silencieusement faux dès qu'un trou existait dans la série fetchée. Remplacé par une correspondance calendaire exacte (année+mois) partout — voir `blsMonthly.ts`.
- **`f5-payrolls-revision-2m` dépend d'un historique qui s'accumule seulement depuis le déploiement de cette fonctionnalité** : ne pas s'inquiéter si ce KPI reste `INSUFFICIENT_HISTORY` pendant les 2 premiers cycles mensuels suivant une remise à zéro de la base.

---

## F2 — Taux et courbe Treasury

Fichier : `apps/backend/src/real/f2Rates.ts`. Sources : Treasury (CSV) pour 2Y/10Y/10Y-réel, FRED pour breakeven/5y5y/2s10s.

- **Déclenchement/TTL** : tous les KPI F2 partagent un TTL de **15 min** — clé `"treasury:par-yield"` (2Y+10Y, un seul fetch CSV alimente les deux), `"treasury:par-yield-real"` (10Y réel), `fred:T5YIFR`, `fred:T10YIE`, `fred:T10Y2Y`. 5 fetchs indépendants en parallèle.

### f2-2y / f2-10y
- **Source** : Treasury, Daily Par Yield Curve (CSV public), colonne `"2 Yr"` / `"10 Yr"`.
- **`observationAt`** : date de la **première ligne de données du CSV** (le fichier est trié plus-récent-en-premier) — la date de la ligne, pas l'heure du fetch. **Vérifié en direct pendant cet audit** (voir §0.2) : correspond exactement à la ligne du 8 septembre.
- **Fallback** : si le CSV de l'année en cours échoue, repli sur celui de l'année précédente — non borné dans le temps par le code (le commentaire dit "pour les premiers jours de janvier" mais rien ne l'impose réellement ; sans risque de faux "current" grâce à la règle de fraîcheur ci-dessous, mais un vrai souci Treasury en pleine année pourrait faire apparaître une donnée très ancienne).
- **Cadence** : `daily` → `completedWeekdaySessionsSince(observationAt) ≤ 1`.
- **Valeur** : brute CSV, arrondie à 3 décimales — aucune dérivation.

### f2-10y-real
- **Source** : Treasury, Daily Par **REAL** Yield Curve (dérivée TIPS), colonne `"10 YR"` (tout en majuscules — piège de casse documenté dans le code, différent de la casse de la courbe nominale).
- **`observationAt`** / cadence : identique au mécanisme f2-2y/10y.
- **Valeur** : brute, 3 décimales — remplace un ancien calcul `DGS10 - DFII10` (désormais lecture directe officielle).

### f2-be10 (breakeven 10 ans)
- **Source** : FRED, série `T10YIE`, lecture directe.
- **`observationAt`** : date d'observation FRED (`date`, pas `realtime_start`).
- **Cadence** : `daily`. **Valeur** : brute, 3 décimales.

### f2-5y5y (forward inflation 5Y5Y)
- **Source** : FRED, série `T5YIFR`, lecture directe.
- **Valeur** : brute, 2 décimales (précision différente de f2-be10 — asymétrie non documentée comme intentionnelle).

### f2-2s10s
- **Source** : FRED, série `T10Y2Y` (10Y − 2Y déjà calculé par FRED) — **plus dérivé en interne** depuis le CSV Treasury comme c'était le cas avant.
- **Formule** : `value = round(t10y2y.value × 100, 0)` — FRED publie en points de pourcentage, conversion en bps entiers. Ce n'est **pas** un recalcul `y10 - y2`, juste une conversion d'unité de la série FRED déjà-spread.
- **Cadence** : `daily`.

---

## F4 — Inflation

Fichier : `apps/backend/src/real/f4Inflation.ts`. Sources : BLS (CPI/PPI), BEA (PCE).

- **Déclenchement/TTL** : CPI+PPI en **un seul appel POST groupé** BLS avec `calculations:true` (clé cache `"bls:calc:f4-cpi-ppi"`, TTL **6h**) ; PCE via deux tables BEA distinctes (index + %-change officiel), TTL **6h** chacune, fetchées en parallèle.
- Séries BLS utilisées : `CUSR0000SA0L1E` (core CPI, désaisonnalisée), `CUSR0000SA0` (headline CPI, désaisonnalisée), `WPSFD4` (PPI final demand), `CUUR0000SA0L1E`/`CUUR0000SA0` (versions NON désaisonnalisées, utilisées **uniquement pour le YoY** — voir plus bas).

### f4-core-cpi-mom / f4-headline-cpi-mom
- **Formule** : priorité au `pct_change` 1 mois **fourni directement par BLS** dans son bloc `calculations` (`provenance: "observed"`) ; si absent, dérivé par correspondance calendaire exacte mois-sur-mois (`provenance: "derived"`). Séries **désaisonnalisées** (BLS publie les variations mensuelles en SA par convention).
- **`observationAt`** : dernier jour calendaire du mois de référence.

### f4-core-cpi-yoy / f4-headline-cpi-yoy — bascule de série, corrigée durant une passe antérieure
- **Utilisent la série NON désaisonnalisée** (`CUUR...`), pas la SA — correction documentée dans le code : le YoY **officiellement publié par BLS** est calculé sur la série NSA (vérifié en direct contre le communiqué BLS de juillet 2026 : YoY officiel = 3,4%, contre 3,3% si on utilisait à tort le `pct_change` 12 mois de la série SA — écart réel, pas un arrondi).
- **Formule** : même logique priorité `calculations` BLS natif puis dérivé calendaire exact, mais sur la série NSA.

### f4-core-cpi-3m-ann (annualisé 3 mois)
- **Formule EXACTE** : `((valeur_M0 / valeur_M-3)^4 - 1) × 100` — BLS fournit bien un `pct_change` 3 mois natif, mais c'est une variation **cumulative** sur 3 mois, PAS annualisée — donc ce KPI reste dérivé (`provenance: "derived"`) même quand BLS a un chiffre "3 mois" disponible, car ce n'est pas la même métrique.

### f4-ppi-final-demand
- Même mécanique que core-cpi-mom (série `WPSFD4`, priorité au `pct_change` BLS natif 1 mois, sinon dérivé).

### f4-headline-pce-yoy / f4-core-pce-yoy
- **Source** : BEA NIPA table `T20804` (indices de prix PCE mensuels), ligne 1 = headline, ligne 25 = core.
- **Formule** : pas de table BEA officielle pour un %-change YoY des prix PCE → dérivé via la même logique calendaire-exacte que les autres KPI de ce fichier, sur l'index.

### f4-core-pce-mom
- **Source** : table BEA `T20807` (%-change officiel publié par BEA elle-même) — lue **directement**, pas dérivée de l'index T20804 (plus précis que re-dériver depuis un index déjà arrondi).
- **`observationAt`** : fin du mois de référence de ce point.

**Sur l'écart de période observé par l'utilisateur (Core PCE "période juillet 2026" alors qu'on est le 9 septembre)** : c'est le comportement normal du BEA — le PCE (contrairement au CPI, publié ~2 semaines après le mois) sort avec un délai plus long, généralement fin du mois suivant. Un chiffre de juillet consulté début septembre est la donnée officielle la plus récente qui existe, pas une donnée périmée au sens propre.

---

## F6 — Dollar

Fichier : `apps/backend/src/real/f6Currency.ts`.

**⚠️ Point de documentation important** : la source réellement câblée est une **lecture directe de Yahoo Finance** (`DX-Y.NYB`, l'indice ICE lui-même), **pas** une reconstruction à partir de 6 paires de change FRED comme le suggèrent les ids `f6-dxy-recon-*`. Le code de reconstruction FRED (`buildF6OverridesReconstructedDeprecated`) existe toujours dans le fichier mais n'est **jamais appelé** — conservé uniquement parce que ces ids sont référencés ailleurs dans le code. `sourceTag: "YAHOO_FINANCE_UNOFFICIAL"` — endpoint non officiel Yahoo, aucune clé, aucun SLA.

- **Fetch/TTL** : clé `yahoo:DX-Y.NYB`, TTL **15 min**. Échec → les 4 KPI passent `UNAVAILABLE`, aucun repli vers la reconstruction dépréciée (règle produit explicite).

### f6-dxy-recon-level
- **Valeur** : `meta.regularMarketPrice` — cotation **live/intraday** Yahoo, pas nécessairement une clôture officielle.
- **`observationAt`** : timestamp epoch de la cotation elle-même (`regularMarketTime`).

### f6-dxy-recon-today
- **Formule** : `((prix actuel − clôture veille) / clôture veille) × 100`, où "veille" = l'avant-dernière barre de clôture journalière de l'historique 1 mois.
- **`observationAt`** : la plus ancienne des deux dates entrant dans le calcul (convention "ne jamais prétendre 'as of' plus récent que ce que chaque donnée d'entrée supporte").

### f6-dxy-recon-5d
- **Formule** : `((prix actuel − clôture il y a 5 barres) / clôture il y a 5 barres) × 100` — 5 **séances de trading**, pas 5 jours calendaires.

### f6-usd-state
- **Sentinelle texte** (`value: null`), formule de classification pure sur les signes de `today%` et `5d%` : "Aligned" si même signe (firmer/weaker des deux côtés), "Divergent" sinon — **aucun seuil de magnitude**, un mouvement de 0,01% compte comme un mouvement de 2%.

---

## F7 — Risque / Crédit / Vol

Fichier : `apps/backend/src/real/f7Risk.ts`. Source unique : FRED, TTL **15 min** pour les 3 séries.

### f7-vix / f7-vix-1d
- Série FRED `VIXCLS`. Niveau = valeur brute. Delta 1j = **diff de niveau absolue** (points, pas %) entre les deux dernières observations FRED **valides** (le sentinel `"."` de FRED pour un jour non coté est déjà filtré en amont — donc "veille" peut sauter un jour férié).

### f7-hy-oas / f7-hy-oas-1d
- Série FRED `BAMLH0A0HYM2`. FRED publie en points de %, converti ×100 en bps entiers. Le delta 1j est calculé **sur les valeurs brutes en % avant conversion**, puis ×100 — évite un double arrondi.

### f7-ig-oas
- Série FRED `BAMLC0A0CM`, même conversion pp→bps. **Pas de KPI `f7-ig-oas-1d`** câblé — décision explicite de ne pas l'ajouter tant que non vérifié en direct.

### f7-move / f7-move-1d
- **Toujours `UNAVAILABLE/NO_SOURCE`, aucun fetch tenté.** Le MOVE index est un produit ICE BofA propriétaire, pas sur FRED. Yahoo expose bien un symbole `^MOVE` avec un prix plausible, mais ses métadonnées (`longName`/`shortName`) pointent vers un produit totalement différent ("Northern Trust iBoxx") — anomalie confirmée en direct, jamais câblé par prudence plutôt que d'afficher une donnée dont l'identité n'est pas garantie.

---

## F8 — Liquidité / Financement

Fichier : `apps/backend/src/real/f8Liquidity.ts`.

### f8-reserves-level / f8-reserves-wow
- **Source** : FRED, série `WRBWFRBL` ("Reserve Balances... Wednesday Level" — un niveau ponctuel, **corrigé** dans une passe antérieure depuis `WRESBAL`, qui est une moyenne hebdomadaire et introduisait un biais méthodologique).
- **TTL** : **6h**. Formule : niveau en millions ÷ 1000 → $B. WoW = diff des deux derniers points valides (calculée sur les valeurs brutes avant conversion, puis ÷1000).
- **`observationAt`** = le mercredi exact que le point mesure — **pourquoi le décalage peut atteindre ~2 semaines tout en restant "current"** : (1) la série n'a qu'un point par mercredi, donc 1-6 jours de retard mécanique selon le jour de consultation ; (2) la Fed republie son H.4.1 le jeudi suivant — si consulté avant cette republication, on récupère encore le mercredi de la semaine PRÉCÉDENTE. Cumulé, jusqu'à ~13 jours d'écart, et le seuil "weekly" (12 jours) peut être frôlé ou tout juste dépassé selon le moment exact — **exactement le cas observé dans le cockpit ("période du 1er septembre" un 9 septembre)**, un comportement structurel normal, pas un bug.

### f8-sofr-iorb / f8-effr-iorb
- **f8-sofr-iorb** : deux séries FRED (`SOFR`, `IORB`), TTL 1h chacune. Formule : `(SOFR − IORB) × 100` en bps.
- **f8-effr-iorb** : EFFR via **NY Fed** (pas FRED, TTL 1h), IORB via FRED. Formule identique. Seul KPI F8 à porter `sourceTags` multiples (`["NY_FED","FRED"]`) car réellement multi-provider.
- **`observationAt`** des deux : la **plus ancienne** des deux dates d'observation (logique justifiée ici : deux séries à calendriers de publication indépendants).

### f8-funding-microstate
- **Sentinelle texte**, classification **basée uniquement sur SOFR-IORB** (pas EFFR-IORB, alors que ce spread est aussi suivi) : `|spread| ≤ 5 bps` → "NORMAL", sinon "ANOMALOUS". Seuil de 5 bps explicitement documenté comme un jugement de présentation, pas un seuil scientifiquement calibré.

### f8-tga-level / f8-tga-daily
- **Source** : Treasury Daily Treasury Statement (`dts/operating_cash_balance`), TTL 1h. **Piège de schéma confirmé** : le champ `close_today_bal` est toujours la chaîne littérale `"null"` dans le schéma actuel — la vraie valeur vit dans `open_today_bal`, quel que soit le libellé "Opening"/"Closing" de la ligne.
- `f8-tga-daily` = diff jour-sur-jour entre deux lectures "Closing Balance" successives (pas un calcul intra-journalier `close - open`, impossible vu le piège ci-dessus).

---

## F9 — Trésor / Fiscal

Fichier : `apps/backend/src/real/f9Treasury.ts`.

### f9-auction-high-yield / f9-auction-btc / f9-auction-indirect
- **Source** : Treasury Fiscal Data, `auctions_query`, filtré `security_term:eq:10-Year`, tri décroissant sur date d'adjudication. TTL **6h**.
- **`observationAt`** : `auction_date` de l'adjudication elle-même (pas `record_date`, pas la date de fetch).
- **f9-auction-indirect** : seul KPI vraiment dérivé — `part indirecte % = indirect_bidder_accepted / total_accepted × 100` (champ non natif du dataset, formule confirmée en direct dans la fourchette 55-70% typique pour du 10Y).
- **Cadence** : `monthly` (bucket le plus proche pour une récurrence réellement mensuelle d'un contrat 10Y).
- **⚠️ Risque identifié** : le filtre `security_term:eq:10-Year` est **strict**, sans variante pour les réémissions (Treasury les libelle parfois `"9-Year 11-Month"`, comme confirmé ailleurs dans ce même fichier pour les adjudications À VENIR). Si le dataset `auctions_query` utilise la même convention pour les adjudications passées, ces 3 KPI pourraient rater les réémissions et n'attraper que les émissions originales strictes — plus rares que "mensuel", rendant la donnée potentiellement plus périmée que le seuil de 45 jours ne le suppose. **À vérifier lors d'un prochain passage.**

### f9-qra-borrowing / f9-qra-revision
- **Source** : communiqué de presse Treasury "Marketable Borrowing Estimates" — **prose HTML**, pas un champ API structuré. Découverte via une page-index stable, puis extraction par regex stricte sur la phrase exacte ("During the [X]-[Y] [année] quarter, Treasury expects to borrow $[N] billion..."). TTL **24h**.
- **`observationAt`** : la date affichée dans le **titre** du communiqué (extraite par un sous-pattern indépendant) — si ce sous-pattern ne matche pas (formulation Treasury changée), `observationAt` retombe silencieusement sur l'heure de fetch, sans qu'aucun champ du payload ne le signale.
- **f9-qra-revision** : montant **signé** — `+magnitude` si "higher than announced", `-magnitude` si "lower".
- **Cadence** : `monthly` (bucket le plus proche pour une cadence réellement trimestrielle).

---

## F10 — Positionnement / Participation

Fichiers : `apps/backend/src/real/f10Flows.ts` (CFTC), `f10Gld.ts` + `f10ParticipationMetrics.ts` (SPDR GLD).

### f10-mm-net-pct / f10-mm-wow-pp (CFTC Managed Money)
- **Source** : CFTC Socrata, dataset COT désagrégé, filtré `contract_market_name='GOLD'`. TTL **6h** (2 rapports récents).
- **Formule net%** : `(long − short) / open_interest_all × 100`. **WoW** : diff en points de % entre les deux derniers rapports.
- **`observationAt`** : date du rapport COT (le **mardi** de recensement CFTC, pas le vendredi de publication).
- **Cadence** : `weekly`.

### f10-mm-percentile (156 semaines)
- **Fetch séparé** : historique de 156 rapports en **un seul appel bulk**, TTL **12h**.
- **Formule percentile (mid-rank, méthode statistique standard)** : `100 × (nb_valeurs_historiques_inférieures + 0,5 × nb_valeurs_égales) / N`.
- **Garde-fou** : nécessite au moins 52 semaines d'historique valide, sinon `UNAVAILABLE/INSUFFICIENT_HISTORY`.

### f10-etf-holdings / f10-etf-delta / delta-5d / delta-20d (SPDR GLD)
- **Source** : archive XLSX SPDR, TTL **20h** (cadence "quasi quotidienne", heure de publication SPDR non confirmée en direct). Les lignes "US Holiday" (valeur littérale dans le fichier) sont exclues du calcul.
- **Delta 1j** : diff entre les deux dernières lignes de trading (pas juste les deux dernières lignes du fichier — les jours fériés sont sautés). **Delta 5j/20j** : diff à N séances de trading en arrière (pas calendaires).
- **⚠️ `driverSummary` identique sur delta-5d et delta-20d** : le même texte de classification ("PERSISTENT_EXPANSION" etc., qui décrit la relation ENTRE les deux fenêtres) est dupliqué sur les deux KPI séparément.

### f10-etf-flow-z60
- **Formule z-score EXACTE** : sur les 60 derniers flux journaliers (`tonnes[i+1] - tonnes[i]`) : `z = (flux_du_jour − moyenne_60j) / écart_type_60j`, où l'écart-type est un **écart-type de population** (division par 60, pas 59 — pas de correction de Bessel). `null` si l'écart-type est nul.

### f10-etf-flow-percentile
- **Fenêtre** : ~3 ans de variations glissantes à 20 jours (chevauchantes, autocorrélées — deux valeurs consécutives partagent 19 jours sur 20).
- **⚠️ Méthode différente de f10-mm-percentile** : `100 × count(historique ≤ valeur_actuelle) / N`, **sans** split de tie à 0,5, et la valeur courante fait elle-même partie de l'échantillon comparé — biais structurel vers le haut, le percentile ne peut mathématiquement jamais atteindre 0.
- **Garde-fou** : minimum 756 observations (~3 ans de trading), sinon `INSUFFICIENT_HISTORY`.

### f10-gld-return-5d / f10-gld-return-20d
- **Formule** : rendement simple `((prix_actuel / prix_il_y_a_N_jours) − 1) × 100` (pas un log-return).

### "Breadth" (participation combinée F10)
- **⚠️ N'est PAS calculé côté backend** — la fonction backend équivalente existe mais n'est jamais appelée en dehors des tests (code mort). Le breadth affiché dans le cockpit est recalculé **côté frontend en React**, à partir de `f10-mm-wow-pp` et `f10-etf-delta-5d` (tous deux doivent être `REAL`+`current`, sinon `null`) : combinaison des signes des deux → `BROAD_PARTICIPATION` (les deux positifs), `BROAD_DE_RISKING` (les deux négatifs), `FUTURES_LED_PARTICIPATION`/`ETF_LED_PARTICIPATION` (signes opposés), `MIXED_PARTIAL_PARTICIPATION` (cas limite). Formule canonique partagée entre le code mort backend et le frontend, donc pas de divergence de logique — juste un calcul qui vit là où on ne l'attend pas forcément.

---

## F11 — Volatilité Or

Fichier : `apps/backend/src/real/f11GoldVol.ts`. Source unique : FRED, série `GVZCLS`, TTL **15 min**.

- **f11-gvz** : niveau brut, 1 décimale.
- **f11-gvz-1d** : diff vs l'observation valide précédente (pas forcément J-1 calendaire si un jour est manquant côté FRED).
- **f11-gvz-5d** : diff vs la 6ᵉ observation **valide** en arrière — donc littéralement "5 observations de trading", pas "5 jours calendaires" si un jour férié a été sauté entre-temps.

---

## F12 — Demande physique

Fichier : `apps/backend/src/real/f12PhysicalGold.ts`. **Aucune logique de fetch** — les deux KPI (`f12-cb-net-buying`, `f12-quarterly-demand`) sont mappés inconditionnellement sur `UNAVAILABLE/NO_SOURCE`. Raison : le World Gold Council (référence pour ces séries) n'a pas d'API publique, seulement un dashboard login-gated et des exports manuels. Aucun autre provider câblé dans ce projet ne les publie. **Décision produit documentée comme permanente**, pas un chantier en attente — `NO_SOURCE` signifie explicitement "jamais tenté", contrairement à `FETCH_FAILED".

---

## F13 — Calendrier

Fichiers : `apps/backend/src/real/f13Calendar.ts`, `f13EventTypes.ts`, `apps/backend/src/jobs/f13CalendarIngestion.ts`.

- **Source** : JBlanked (calendrier MQL5, USD uniquement à l'ingestion), converti depuis son fuseau propre (UTC+7, confirmé en direct par recoupement sur 6 releases connues) vers UTC.
- **Garde "1 appel/jour max"**, persistée en base (survit aux redémarrages) : le tout premier appel du jour n'a lieu qu'après 11h heure de New York (pour dépasser les fenêtres de release 08h30/10h00 ET) ; un succès le même jour UTC bloque tout nouvel appel ; un échec autorise un retry après 1h. **Conséquence assumée** : si aucune requête HTTP n'arrive après 11h ET un jour donné, l'ingestion de ce jour n'a simplement jamais lieu.
- **Cross-référencement avec les données officielles déjà calculées** : pour un événement déjà passé (`scheduledAtUtc < now`), le système essaie d'abord de remplacer le chiffre JBlanked par la valeur déjà calculée la même requête via BLS/BEA/NY Fed (CPI/PCE/Payrolls/FOMC) — n'utilise le `Actual` brut JBlanked qu'en dernier recours, et traite un JBlanked `Actual: 0` comme "pas encore publié" (bug JBlanked connu : `0` est un placeholder, pas toujours un vrai zéro).
- Aucun KPI scalaire classique — `nextEvents`/`activeCatalyst` (jusqu'à 3 événements futurs High-impact USD/JPY) et les vues semaine/jour dédiées.

---

## Bugs et incohérences relevés pendant cet audit (consolidé)

**Confirmés, avec impact réel :**

1. **🔴 F3 — Distribution Fed indisponible en production** : Chromium jamais installé dans le build Railway. **Corrigé** (`postinstall` + `nixpacks.toml`), redéploiement + vérification restants.
2. **F9 — filtre d'adjudication 10Y potentiellement trop strict** pour capter les réémissions (`security_term:eq:10-Year` exact, sans variante `"9-Year 11-Month"`) — à vérifier, pourrait sous-alimenter f9-auction-*.
3. **F6 — ids trompeurs** : `f6-dxy-recon-*` suggère une reconstruction FRED multi-devises ; la source réelle est Yahoo Finance directe. Code de reconstruction FRED présent mais mort.
4. **F10 — deux formules de percentile différentes** dans la même famille (mid-rank avec tie-split pour CFTC vs. comptage simple sans tie-split, biaisé vers le haut, pour les flux GLD) — pas cohérent, à harmoniser ou au moins documenter la différence intentionnelle si elle est voulue.
5. **F10 — `driverSummary` dupliqué** à l'identique sur `f10-etf-delta-5d` et `f10-etf-delta-20d`.
6. **F10 — "breadth" calculé côté frontend**, fonction backend équivalente jamais appelée (code mort, sans impact fonctionnel puisque la logique canonique est partagée, mais source de confusion pour qui cherche ce calcul côté API).

**Cosmétiques / sans impact fonctionnel actuel, à connaître :**

7. Commentaire de doc obsolète : `CADENCE_THRESHOLD_MS.daily` (4 jours) n'est en réalité **jamais utilisé** — toute cadence "daily" passe par `completedWeekdaySessionsSince ≤ 1`, une règle plus stricte (tolère ~1 week-end, pas 4 jours).
8. Incohérence de convention `observationAt` sur les deltas à 2 points d'une même série : F6 retient la date la plus ancienne des deux points, F7/F8/F11 retiennent la plus récente — même type de calcul, convention différente selon le fichier.
9. Précision d'arrondi incohérente entre KPI F2 apparentés (3 déc. / 2 déc. / 0 déc. selon le KPI, sans règle commune documentée).
10. `f9-qra-revision` renvoie `UNAVAILABLE/FETCH_FAILED` même quand seule la phrase de révision (et non celle de borrowing) ne matche pas — un succès partiel étiqueté comme un échec total.
11. `f8-funding-microstate` ignore le spread EFFR-IORB dans sa classification, alors que ce spread est également suivi et pourrait diverger du signal SOFR-IORB.

Aucun de ces points cosmétiques ne nécessite une action immédiate ; ils sont documentés ici pour éviter de les re-découvrir plus tard en pensant à un nouveau bug.

---

## Sur la stratégie de cache — ta suggestion d'un calendrier de release au lieu d'un TTL fixe

Le système actuel **n'appelle pas une source à chaque affichage** — chaque famille a déjà un TTL qui la protège d'un fetch inutile (15 min pour les taux, 1h pour la Fed/GDPNow, 6h pour CPI/PCE/CFTC/QRA-like, 20-24h pour GLD/QRA). Pour une donnée mensuelle avec TTL 6h, ça fait au pire ~4 tentatives de fetch par jour — pas un problème de quota en pratique (BLS/BEA/FRED supportent largement ce volume), et surtout **un fetch "inutile" (donnée inchangée depuis la dernière fois) ne coûte rien de plus qu'un fetch "utile"** : c'est le même appel réseau, juste avec la même réponse.

Ce qu'un calendrier de release ferait en plus : au lieu de "retenter toutes les 6h", "ne retenter qu'aux horaires connus de publication (ex. CPI = 8h30 ET le 2e ou 3e mardi du mois)". L'intérêt réel ne serait pas d'économiser des appels réseau (déjà peu nombreux), mais de réduire la fenêtre entre "la donnée officielle sort" et "le cockpit l'affiche" — actuellement jusqu'à 6h de retard possible après une publication, alors qu'avec un calendrier ciblé ce serait quasi immédiat.

C'est un chantier réel (il faudrait un calendrier fiable des dates de publication BLS/BEA/Fed — F13/JBlanked ne couvre aujourd'hui que les événements USD/JPY High-impact pour l'affichage, pas un déclencheur de fetch), pas une correction de bug. **Je ne l'ai pas implémenté** — dis-moi si tu veux qu'on le fasse, sachant que le gain concret est "afficher un CPI 5h30 plus tôt le jour de sa sortie", pas une économie de coût ou une correction d'un problème actuel.

---

## Réponses directes aux points soulevés dans ta capture d'écran

| Ce que tu as vu | Explication |
|---|---|
| 2Y=4,390 / 10Y=4,800, "période du 7 sept" alors qu'on est le 9 | **Donnée correcte**, vérifiée en direct contre Treasury.gov : c'est la ligne du **8 septembre** (dernière publiée), probablement mal lue comme "7" dans une lecture rapide/dictée. Le 9 septembre n'était simplement pas encore publié. |
| "Today %" DXY qui semble faux | Calculé comme `(prix live − clôture veille) / clôture veille`, source Yahoo (voir F6 ci-dessus) — pas de bug identifié dans la formule ; si un chiffre précis te semble faux, dis-le-moi et je vérifie ce cas précis en direct. |
| Fed — "probabilité de réunion non disponible" | **Bug réel, confirmé et corrigé** (Chromium absent sur Railway) — reste à redéployer. |
| Core CPI indisponible | Testé en direct pendant cet audit : l'appel BLS fonctionne et renvoie les vraies données de juillet 2026 — donc un raté ponctuel (réseau ou autre), pas un bug structurel ; un échec n'est jamais mis en cache, la prochaine requête retente automatiquement. |
| VIX "période du 7 sept" | Décalage de publication FRED d'1 jour, comportement normal de la série. |
| Réserves WoW "période du 1er sept" | Normal — la Fed publie son H.4.1 hebdomadaire le jeudi pour le mercredi précédent ; un décalage d'une bonne semaine entre "aujourd'hui" et la donnée est structurel, pas un bug (détail complet en section F8). |

---

*Document rédigé à partir d'une lecture directe du code source (`apps/backend/src/real/*.ts`, `apps/backend/src/providers/*.ts`, `apps/backend/src/cache/snapshotCache.ts`) et de vérifications en direct contre les sources officielles (Treasury.gov, FRED, BLS) le 9 septembre 2026. À maintenir à jour si la logique de calcul ou les sources changent — voir aussi [GUIDE_FONCTIONNEMENT_DONNEES.md](GUIDE_FONCTIONNEMENT_DONNEES.md) pour la mécanique générale des providers.*
