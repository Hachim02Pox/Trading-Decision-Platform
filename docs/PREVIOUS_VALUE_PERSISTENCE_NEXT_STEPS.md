# Persistance "ancienne valeur → valeur actuelle" — état et prochaines étapes

> Document préparé le 2026-09-16 sur demande explicite de Hachim, pour reprendre ce chantier dans une nouvelle conversation. **Réécrit une 2e fois le même jour** après que Hachim a précisé exactement l'architecture qu'il veut (section 3). Rien de la section 3 n'est implémenté — c'est le plan, pas ce qui tourne aujourd'hui.

> ⚠️ **SI CE DOCUMENT EST LU DANS LE CADRE DE `OVERNIGHT_TASKLIST_2026-09-16.md`** (session de nuit, Hachim absent) : **ignore tout "à confirmer avec Hachim" / "poser la question" ci-dessous** — ces phrases supposaient une session où Hachim était disponible pour répondre. Cette nuit, il ne l'est pas. Pour chaque point marqué comme "à confirmer" : applique la recommandation déjà écrite dans ce document (elle est motivée et réfléchie, pas un simple deux-choix à pile ou face), documente que c'est un choix pris en autonomie, et continue. Ne bloque sur AUCUN point de ce fichier ce soir.

---

## 1. Ce qui tourne AUJOURD'HUI en production (2026-09-16, avant la section 3)

- Table Postgres `public.kpi_observations` (existait déjà avant aujourd'hui) : historique **append-only**, une ligne par observation réelle distincte (`kpi_id`, `observation_at`, `retrieved_at`, `numeric_value`, `source_tag`, `provenance`). Rien n'est jamais supprimé. Utilisée aussi par F10 pour calculer un percentile CFTC sur 156 semaines et un Z-score de flow GLD sur 60 observations — **ces deux calculs ont besoin de l'historique complet, pas juste des 2 dernières valeurs**.
- `apps/backend/src/intelligence/cloud/kpiHistory.ts`'s `rememberKpiObservation()` (commit `2a6cc8a`) lit cette table pour trouver "la dernière observation réellement antérieure" (`getPreviousDistinctObservation`, `apps/backend/src/db/kpiObservations.ts`), avec repli sur un fichier éphémère si rien n'est trouvé en base.
- **Vérifié en direct sur la vraie base aujourd'hui** (requête `select kpi_id, count(*), max(observation_at) from kpi_observations group by kpi_id`) — état exact des lignes par KPI à 2026-09-16 ~05h UTC, utile pour la prochaine session :
  - Historique déjà riche : `f10-etf-holdings`/`f10-gld-closing-price` (5488 lignes), `f10-etf-delta` (147), `f3-fed-rate-monitor` (20, mécanisme séparé — voir 3.4).
  - Historique correct mais court : `f2-*` (5 lignes chacun), `f8-*` (2-5 lignes).
  - **Une seule ligne** (donc PAS ENCORE de "précédent" affichable) : `f11-gvz`, `f7-vix`, `f7-hy-oas`, `f7-ig-oas`, `f4-core-pce-mom/yoy`, `f4-headline-pce-yoy`, `f5-ahe-mom`, `f5-payrolls-latest`, `f5-payrolls-3m`, `f5-unemployment`, `f9-qra-borrowing/revision` — branchés à la persistance seulement aujourd'hui ou publiés rarement, il faut un 2e fetch avec une valeur différente pour qu'une comparaison apparaisse.
  - **Complètement absent de la table** (aucune ligne, jamais persisté) : `f3-target-lower`, `f3-target-upper`, `f9-auction-high-yield`, `f9-auction-btc`, `f9-auction-indirect`, `f10-mm-net-pct`, `f10-mm-wow-pp`, `f10-mm-percentile`, toutes les variantes "delta"/"1D"/"5D"/"today" (`f6-dxy-recon-today`, `f6-dxy-recon-5d`, `f7-vix-1d`, `f7-hy-oas-1d`, `f11-gvz-1d`, `f11-gvz-5d`) — seul le NIVEAU de chaque série a été persisté, pas ses dérivées.

---

## 2. Ce qui est déjà fait et pushé (2026-09-16, avant la clarification de la section 3)

Commit `8bd8263` :
- Night Recap automatisé (F13/calendrier JBlanked déclenche un pré-fetch pour F4/F5 après une vraie publication BLS/BEA).
- F10 (Flux/Positionnement) redimensionné, défilement interne.
- F3 : cadence 5h → 3h, fix d'un bug de garde de re-tentative après un restart en plein scrape.

Commit `2a6cc8a` :
- `previousFetch` lit `kpi_observations` (Postgres, durable) en priorité, repli sur fichier éphémère.
- Familles branchées à `kpi_observations` : F2, F4, F5, F6 (DXY niveau), F7 (VIX/HY OAS/IG OAS niveaux), F8, F9 (QRA seulement), F10 (GLD seulement), F11 (GVZ niveau).

**Ce mécanisme (section 1) sera probablement REMPLACÉ par celui de la section 3, pas juste complété** — lire la section 3 avant de continuer à combler les trous listés en section 1.

---

## 3. Ce que Hachim veut vraiment (précisé le 2026-09-16, message explicite) — À IMPLÉMENTER

> **Règle d'or (Hachim, message du 2026-09-16, répétée/confirmée deux fois) : peu importe le détail d'implémentation, ce qui compte c'est d'avoir en permanence les 2 dernières valeurs DIFFÉRENTES pour chaque KPI, les plus FRAÎCHES possible.** Pas un historique, pas un nombre de lignes précis — juste : `previous` != `current` toujours (sauf tout premier fetch), et les deux sont les plus récentes disponibles. Tout le reste de cette section (table dédiée, colonnes exactes, etc.) est un moyen d'y arriver, pas la contrainte elle-même — si une implémentation différente arrive au même résultat (2 valeurs distinctes + fraîcheur maximale), c'est tout aussi valide.

### 3.1 L'algorithme exact, dans ses mots

> "La table doit être simple : 1 ligne par KPI. Il y a toujours la dernière valeur différente du fetch le plus récent. Cette donnée est mise à jour à chaque fois qu'il y a un fetch avec une nouvelle valeur : le dernier fetch prend la place de celui d'avant, et le nouveau fetch prend sa place dans le cache. Exemple : ancienne valeur en BDD de 2Y = 4%, fetch actuel = 5%. Je refetch, fetch = 5%, aucun changement. Je refetch, 6% : alors le 4% disparaît, le 5% prend sa place en BDD (affiché à gauche), et le 6% est affiché à droite. Ça, pour littéralement tous les KPI (~30 en comptant le Fed Rate odds), pour toujours avoir 2 valeurs différentes, les plus récentes possible, à gauche/droite des flèches."

Autrement dit — **une table à exactement 1 ligne par KPI (pas un historique)**, avec un slot "previous" et un slot "current", mise à jour comme ceci à chaque fetch réel :

1. Si la table n'a pas de ligne pour ce `kpi_id` → l'insérer avec seulement `current` rempli, `previous` vide (= "Première valeur enregistrée", comme aujourd'hui).
2. Si la nouvelle valeur fetchée == `current` déjà en base → ne rien faire (aucun changement, comme demandé explicitement : *"aucun changement"*).
3. Si la nouvelle valeur fetchée != `current` déjà en base → `previous` prend l'ancien contenu de `current`, `current` devient la nouvelle valeur. **Une seule ligne UPDATE, pas un INSERT** — pas d'accumulation.

### 3.2 Décision technique que j'ai prise en écrivant ce doc (Hachim n'a pas demandé, mais c'est nécessaire) — À CONFIRMER avec lui en premier

**Ne PAS supprimer/remplacer `kpi_observations`** (Hachim avait suggéré "supprimer la table et la repeupler" dans son message). Cette table alimente déjà F10 (percentile CFTC 156 semaines, Z-score GLD flow 60 observations) — la vider à 1 ligne casserait ces deux fonctionnalités déjà construites (elles passeraient en `UNAVAILABLE/INSUFFICIENT_HISTORY` en permanence).

**Recommandation** : créer une **NOUVELLE table dédiée**, séparée, juste pour ce besoin précis (previous/current, 1 ligne par KPI) :

```sql
create table if not exists public.kpi_latest_values (
  kpi_id varchar(64) primary key,
  current_value double precision,
  current_text_value varchar(255),
  current_observation_at timestamptz not null,
  current_retrieved_at timestamptz not null,
  previous_value double precision,
  previous_text_value varchar(255),
  previous_observation_at timestamptz,
  previous_retrieved_at timestamptz,
  source_tag varchar(64) not null,
  provenance varchar(32) not null,
  updated_at timestamptz not null default now()
);
```

- `kpi_observations` continue d'exister EXACTEMENT comme avant, alimentée par les mêmes `persistObservation(...)` déjà en place dans `real/*.ts` — rien à changer là, ça reste le socle de F10.
- `kpi_latest_values` est une nouvelle table, alimentée en PARALLÈLE (même endroit dans le code où `persistObservation(...)` est déjà appelé aujourd'hui — ajouter un deuxième appel juste à côté, pas remplacer le premier).
- `kpiHistory.ts`'s `rememberKpiObservation()` lit `kpi_latest_values` au lieu de faire une requête `ORDER BY ... LIMIT 1` sur `kpi_observations` — plus simple, 1 seule ligne à lire, pas de tri.

**Si Hachim confirme qu'il veut vraiment fusionner/supprimer `kpi_observations`** (pas juste ajouter une table à côté), il faut d'abord résoudre comment F10 recalculerait ses percentiles/Z-scores sans historique — probablement en gardant `kpi_observations` quand même, juste sous un autre nom/rôle plus explicite. **Poser la question à Hachim en premier si ce n'est pas clair**, ne pas supprimer `kpi_observations` sans confirmation explicite.

### 3.3 Logique d'écriture (à implémenter en TypeScript, pas en SQL magique)

Nouveau fichier suggéré : `apps/backend/src/db/kpiLatestValues.ts`, à côté de `kpiObservations.ts` :

```typescript
export async function rememberLatestValue(input: {
  kpiId: string;
  value: number | null;
  textValue?: string | null;
  observationAt: Date;
  retrievedAt: Date;
  sourceTag: string;
  provenance: string;
}): Promise<void> {
  // 1. SELECT la ligne existante pour kpi_id (ou rien si première fois).
  // 2. Si elle n'existe pas : INSERT avec current = input, previous = NULL.
  // 3. Si elle existe et current_value == input.value (et/ou current_observation_at == input.observationAt,
  //    à décider) : ne rien faire (return).
  // 4. Si elle existe et différente : UPDATE — previous_* = ancien current_*, current_* = input.
}
```

Puis appeler `rememberLatestValue(...)` **juste à côté** de chaque `persistObservation(...)` déjà existant dans `real/f2Rates.ts`, `f4Inflation.ts` (via `blsMonthly.ts`), `f5Employment.ts` (via `blsMonthly.ts`), `f6Currency.ts`, `f7Risk.ts`, `f8Liquidity.ts`, `f9Treasury.ts`, `f10Gld.ts`, `f11GoldVol.ts` — et l'AJOUTER à `f3Fed.ts`, `f9Treasury.ts` (résultats d'enchères), `f10Flows.ts` (CFTC), qui n'appellent encore aucune des deux fonctions aujourd'hui (voir liste complète en section 4).

### 3.4 Cas particulier F3 — "Fed Rate odds" (mentionné explicitement par Hachim)

`f3-fed-rate-monitor` n'est PAS un KPI scalaire classique — c'est la distribution de probabilités (plusieurs buckets), stockée séparément (`apps/backend/src/real/fedRateDistributionStore.ts`, table `kpi_observations` avec un encodage texte compact dans `text_value`, voir `tests/f3-fed-rate-monitor.test.ts`). Elle a DÉJÀ 20 lignes en base et affiche déjà une comparaison "Probabilité 89.5% → 89.5%" dans le screenshot de Hachim (donc ça fonctionne déjà, au moins partiellement). **À vérifier avant de toucher à quoi que ce soit ici** : est-ce que ce mécanisme suit déjà la même logique 1-ligne-par-KPI que Hachim demande, ou est-ce qu'il faut aussi le migrer vers `kpi_latest_values` pour rester cohérent avec le reste ? Probablement le migrer aussi pour la cohérence, mais confirmer avec Hachim que ça ne casse pas le format spécial déjà utilisé (buckets multiples, pas une seule valeur numérique).

---

## 4. Liste complète des ~57 KPI id réels (Hachim en comptait ~30 à vue de nez, la vraie liste est plus longue — donnée ici exhaustivement, extraite de `apps/backend/src/mock/fixtures.ts`, source de vérité des ids)

Permanently `UNAVAILABLE/NO_SOURCE` — **à exclure**, jamais de vraie valeur donc jamais de previous/current à afficher : `f12-cb-net-buying`, `f12-quarterly-demand`, `f3-path-6m`, `f3-repricing`, `f7-move`, `f7-move-1d`, `f5-ism-services`, `f5-ism-manufacturing`.

Tous les autres (réellement fetchables) :

| Famille | KPI ids |
|---|---|
| F2 | `f2-2y`, `f2-10y`, `f2-10y-real`, `f2-be10`, `f2-5y5y`, `f2-2s10s` |
| F3 | `f3-target-lower`, `f3-target-upper` (+ `f3-fed-rate-monitor`, cas spécial — voir 3.4) |
| F4 | `f4-core-cpi-mom`, `f4-core-cpi-yoy`, `f4-headline-cpi-mom`, `f4-headline-cpi-yoy`, `f4-core-pce-mom`, `f4-core-pce-yoy`, `f4-headline-pce-yoy`, `f4-core-cpi-3m-ann`, `f4-ppi-final-demand` |
| F5 | `f5-unemployment`, `f5-payrolls-latest`, `f5-payrolls-3m`, `f5-claims-4w`, `f5-claims-initial`, `f5-claims-continuing`, `f5-ahe-mom`, `f5-payrolls-revision-2m`, `f5-gdpnow` |
| F6 | `f6-dxy-recon-level`, `f6-dxy-recon-today`, `f6-dxy-recon-5d` (`f6-usd-state` est un texte catégoriel calculé, pas une valeur numérique fetchée — à part) |
| F7 | `f7-vix`, `f7-vix-1d`, `f7-hy-oas`, `f7-hy-oas-1d`, `f7-ig-oas` |
| F8 | `f8-reserves-level`, `f8-reserves-wow`, `f8-tga-level`, `f8-tga-daily`, `f8-sofr-iorb`, `f8-effr-iorb` (`f8-funding-microstate` catégoriel, à part) |
| F9 | `f9-qra-borrowing`, `f9-qra-revision`, `f9-auction-high-yield`, `f9-auction-btc`, `f9-auction-indirect` |
| F10 | `f10-mm-net-pct`, `f10-mm-wow-pp`, `f10-mm-percentile`, `f10-etf-holdings`, `f10-etf-delta`, `f10-etf-delta-5d`, `f10-etf-delta-20d`, `f10-etf-flow-z60`, `f10-etf-flow-percentile`, `f10-gld-return-5d`, `f10-gld-return-20d` |
| F11 | `f11-gvz`, `f11-gvz-1d`, `f11-gvz-5d` |

**Décision à prendre avec Hachim** : les variantes "delta"/"1D"/"5D"/"today"/"WoW" (ex. `f7-vix-1d`, `f6-dxy-recon-today`, `f10-etf-delta-5d`...) sont elles-mêmes DÉJÀ des différences calculées (aujourd'hui moins hier, etc.) — est-ce que Hachim veut VRAIMENT une comparaison "previous vs current" sur un delta lui-même (ex. "hier le VIX a bougé de +0.5, aujourd'hui de -0.2"), ou seulement sur les valeurs de NIVEAU (`f7-vix`, `f6-dxy-recon-level`, etc.) ? Les deux sont défendables, mais ça double le nombre de lignes à écrire dans `kpi_latest_values` si on fait les deux. À clarifier avant de tout implémenter — poser la question si pas évident au début de la session.

---

## 5. Autres sujets ouverts (non liés à l'architecture previous/current, mentionnés plus tôt le 2026-09-16)

### 5.1 Core PCE affiche "Période : juillet 2026" — probablement PAS un bug

Le BEA publie PCE avec un délai plus long que le BLS pour le CPI (~4 semaines après fin de mois, contre ~2 pour le CPI) — au 16 septembre 2026, août 2026 n'est probablement pas encore publié. **Vérifié en direct dans la base aujourd'hui** : `f4-core-pce-mom` n'a qu'UNE ligne, datée du 31 juillet 2026 — confirme qu'aucune donnée d'août n'a jamais été vue par ce backend, cohérent avec "pas encore publié" plutôt qu'un bug de fetch. À confirmer avec la vraie date de publication BEA (bea.gov/news/schedule) si un doute persiste.

### 5.2 F12 (Central Bank Net Buying / Total Gold Demand) — remplacer "INDISPONIBLE" par un renvoi vers gold.org

Demande explicite de Hachim, pas encore implémentée. Il y a déjà un petit lien externe affiché à côté du nom du KPI dans le screenshot — vérifier s'il est déjà fonctionnel (`getExternalSourceLink` dans `KpiMiniCell.tsx`) avant de construire quoi que ce soit de nouveau. Décision produit à prendre avec Hachim : texte exact à afficher à la place de "Indisponible".

---

## 6. Checklist pour démarrer la prochaine session

1. Lire ce document en entier.
2. Confirmer avec Hachim : nouvelle table séparée (`kpi_latest_values`, section 3.2) plutôt que remplacer `kpi_observations` — sauf s'il insiste explicitement pour supprimer/fusionner, auquel cas trouver d'abord une solution pour F10.
3. Confirmer avec Hachim : les KPI "delta" (1D/5D/today/WoW) sont-ils inclus dans previous/current, ou seulement les KPI de niveau ? (section 4)
4. Implémenter `db/kpiLatestValues.ts` + la table (migration SQL), brancher `kpiHistory.ts` dessus.
5. Ajouter l'appel `rememberLatestValue(...)` dans tous les fichiers `real/*.ts` listés en section 3.3, y compris les 3 familles encore jamais branchées (F3 target range, F9 auctions, F10 CFTC).
6. Vérifier le cas spécial F3 Fed Rate Monitor (section 3.4).
7. Traiter séparément les sujets 5.1 (vérifier, probablement rien à faire) et 5.2 (discussion produit + implémentation UI).
8. `npm run typecheck && npm run build`, tests pertinents (mirroring `tests/kpi-history-cache.test.ts`'s style), puis commit/push seulement si Hachim le demande explicitement (comme pour tout le reste de cette session).
