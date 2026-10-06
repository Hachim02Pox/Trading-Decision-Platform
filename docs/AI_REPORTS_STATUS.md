# AI Reports status — Night Recap, Global Read, Lecture IA contextuelle

> Lire ce fichier avant de retoucher au Night Recap, au Global Read, ou à la
> "Lecture IA" contextuelle par KPI. Mettre à jour le statut ci-dessous avant
> de terminer une session qui touche à l'un de ces trois sujets.

## STATUT — 2026-10-06 : déclenchement automatique Night Recap

- L'automatisation GitHub existait, mais son cron réel était quotidien à
  `13:05 UTC` (09:05 au Québec en été, 08:05 en hiver), contrairement aux
  anciens commentaires qui annonçaient un ping horaire.
- Le run planifié du 5 octobre (`37373402804`) a été créé à 21:02 UTC,
  puis son job annulé avant toute étape, sans runner attribué. La cause
  précise de cette annulation n'est pas établie. Le 6 octobre à 14:47 UTC,
  la lecture FR servait encore le récap du 3–4 octobre, généré le 4 à
  17:24:42 UTC.
- `.github/workflows/night-recap.yml` cible maintenant **09:00 chaque
  jour dans `America/Toronto`**, avec le champ `timezone` officiellement
  supporté par GitHub Actions. Deux pings de reprise sont programmés à
  **09:30 et 10:30** dans le même fuseau. Ils utilisent la route existante,
  sans forçage, avec sa garde persistée une réussite par jour et son
  cooldown d'une heure après échec. Aucune logique métier ni source IA
  n'a été modifiée.
- La concurrence GitHub sérialise les exécutions sans annuler celle en
  cours. Une réponse `ran: false` indiquant explicitement une réussite
  déjà acquise aujourd'hui est désormais un succès normal. Les autres
  refus, erreurs HTTP et réponses invalides continuent de faire échouer
  le job, pour ne pas masquer un récap manquant.
- **Limite inchangée :** GitHub peut retarder ou perdre un déclenchement
  planifié. 09:00 est l'heure cible, pas une garantie à la minute. Ces
  reprises améliorent la récupération, sans garantir une disponibilité
  exacte à 09:00.
- Vérification ciblée : parsing YAML, syntaxe Bash, réponses JSON simulées
  (génération, déjà réussi, cooldown, non configuré, réponse invalide), et
  conversion horaire été/hiver. La CI du commit vérifie séparément le
  projet complet.
- Rattrapage vérifié le 6 octobre : la tentative 2 du run
  `37373402804` a réussi à 14:50 UTC (`ran: true`, 17 sources). Les
  lectures FR/EN affichent la nuit du **5 au 6 octobre** : FR généré à
  `2026-10-06T14:50:35.868Z`, EN à `2026-10-06T14:49:25.502Z`.
  Le prochain déclenchement planifié sous le nouvel horaire reste à
  observer ; ce rattrapage ne prouve pas une exécution future à la minute.
- Références : [syntaxe officielle timezone](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule),
  [retards possibles des schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
  [run du 5 octobre](https://github.com/Hachim02Pox/Trading-Decision-Platform/actions/runs/37373402804).

Les sections du 15 septembre ci-dessous sont historiques ; les mentions
« ping horaire » sont remplacées par le programme décrit ci-dessus.

## STATUT — 2026-09-15

### Ce qui a été vérifié, confirmé, pas supposé

- `apps/backend/.env` (local) contient bien `GROQ_API_KEY` et `TAVILY_API_KEY`
  (valeurs non vides, longueurs plausibles). **Ce n'est pas un problème côté
  utilisateur.**
- Le site en ligne (frontend Vercel + backend Railway, voir
  `docs/AUTH_SUPABASE.md` pour les URLs) affiche partout "non configuré"
  pour le Night Recap ET pour la Lecture IA contextuelle par KPI (ex. carte
  DXY, drawer KPI). **Cause confirmée** : ces clés vivent dans le `.env`
  local de la machine de dev, jamais transmises à Railway. Railway a ses
  propres variables d'environnement, entièrement séparées, configurées sur
  son propre dashboard — un fichier `.env` local ne les atteint jamais,
  push ou pas.

### Action prioritaire #1 (utilisateur, dashboard Railway, pas automatisable d'ici)

1. Dashboard Railway → projet → service **backend** → onglet **Variables**.
2. Ajouter `GROQ_API_KEY` et `TAVILY_API_KEY` avec les mêmes valeurs que
   dans `apps/backend/.env` local (`TAVILY2_API_KEY` aussi si une clé de
   secours existe déjà en local — sert de fallback si Tavily renvoie 429).
3. Redéployer/redémarrer le service backend (Railway redémarre parfois
   automatiquement à l'ajout d'une variable — vérifier le statut du
   déploiement dans l'onglet Deployments).
4. Vérifier en rechargeant le site en ligne : le bandeau "non configuré"
   doit disparaître sur le Night Recap ET sur la Lecture IA par KPI (même
   gate `GROQ_API_KEY`, donc les deux se débloquent ensemble).

Cette étape est un prérequis pour tout ce qui suit — sans elle, rien de ce
qui touche à l'IA cloud n'est testable en production.

## Night Recap — implémenté le 2026-09-15 (contenu + automatisation)

Fichier principal : `apps/backend/src/intelligence/goldOvernightAnalysis.ts`.
Job d'automatisation : `apps/backend/src/jobs/goldOvernightAutoRecap.ts`.

### Décisions produit prises avec l'utilisateur (2026-09-15, affinées dans un 2e échange)

- **Contenu** : un seul paragraphe (`recapText: string`), pas de listes
  séparées. Explique ce qui a fait bouger l'or pendant les séances Asie et
  Londres (l'équivalent de "la nuit de Hachim", heure Québec) et signale ce
  qu'il faut surveiller pour la session de New York à venir. Remplace
  l'ancien `combinedSummary`/`combinedKeyMoves`/`combinedCatalysts` sur
  `GoldOvernightRecap` (voir `packages/contracts/src/index.ts`).
- **Sourcing multi-langue pour CORROBORATION, pas pour la sortie** :
  l'utilisateur veut que l'IA lise des articles US, FR, chinois, japonais
  et arabes et privilégie ce qui est rapporté de façon cohérente à travers
  plusieurs langues/sources indépendantes (signal plus fiable qu'une
  affirmation isolée). Implémenté dans `goldOvernightAnalysis.ts` : 10
  requêtes Tavily (2 par langue : EN/FR/ZH/JA/AR), le prompt Groq demande
  explicitement de mettre en avant ce qui est corroboré entre langues et de
  signaler un désaccord plutôt que de trancher. La sortie reste UNIQUEMENT
  en EN/FR (les deux seules langues supportées par le type `Language`) —
  seul le sourcing est multi-langue, pas la sortie.
  ⚠️ Note honnête : les requêtes en chinois/japonais/arabe sont des
  formulations approximées par l'IA, pas vérifiées par un locuteur natif —
  à surveiller si les résultats semblent hors-sujet dans ces langues.
- **Fenêtre temporelle** : Tavily n'a pas de granularité à l'heure (max
  `time_range: "day"`, donc ~24h glissantes). Décision : ne pas promettre
  une fenêtre exacte dans le texte généré, cadrer plutôt autour des
  séances de trading (Asie + Londres) que d'un nombre d'heures précis.
- **Automatisation** : une génération automatique par jour, ciblant **9h**
  heure de l'Est (`America/New_York`, le fuseau de Hachim à Québec — pas
  8h, corrigé après un premier échange). Le multi-fuseaux (Europe, etc.)
  est explicitement mis de côté pour l'instant sur demande de l'utilisateur
  — un seul fuseau cible (Est) tant que l'app reste mono-utilisateur, voir
  "Limite connue" plus bas.
- **Aucun bouton manuel** (décision explicite, 3e échange, 2026-09-15) :
  Hachim ne veut PAS de déclenchement manuel pour le Night Recap, seulement
  l'automatisation. `runGoldOvernightRecap` (le chemin "clic bouton"),
  `POST /api/intelligence/gold-overnight/analyze`,
  `triggerGoldOvernightRecap` (frontend) et toute l'UI liée (bouton,
  cooldown, état "analyzing", toast de confirmation) ont été supprimés. Le
  contrat `GoldOvernightRecapStatus` est réduit à `"OK" | "NONE"` (les
  valeurs `NOT_CONFIGURED`/`COOLDOWN`/`UNAVAILABLE` n'ont plus de chemin
  pour être produites). `GET /api/intelligence/gold-overnight/on-demand`
  reste — c'est une lecture seule du cache alimenté par l'automatisation,
  pas un déclenchement. La section garde son toggle Afficher/Masquer
  (juste un repli d'affichage, pas un déclenchement IA) et affiche
  maintenant un message "pas encore de récap" tant que la première
  exécution automatique n'a pas eu lieu.

### Ce qui a été implémenté

- `apps/backend/src/lib/timeZoneHour.ts` (nouveau) : helper partagé
  `hourInTimeZone`/`calendarDateInTimeZone`, DST-aware via `Intl`. Extrait
  de l'ancien `etHourOf` local à `f13CalendarIngestion.ts` (qui l'utilise
  toujours, via ce nouveau module, comportement inchangé et re-testé).
- `goldOvernightAnalysis.ts` : 10 requêtes Tavily (2 par langue : EN, FR,
  ZH, JA, AR — formulations naturelles, pas des traductions mot-à-mot),
  `time_range: "day"` passé à chaque appel (`WebSearchProvider.search()`
  accepte maintenant un 3e paramètre optionnel `{ timeRange }` — voir
  `intelligence/cloud/contracts.ts` et `tavilySearchProvider.ts`), prompt
  Groq renforcé (horodatage actuel, cadrage "séances Asie + Londres",
  consigne explicite de privilégier ce qui est corroboré entre plusieurs
  langues/sources). Chaque `GoldOvernightSource.language` reflète
  maintenant la vraie langue de la requête qui l'a trouvée (avant : toujours
  la valeur littérale `"web"`, jamais correcte). Nouvelle fonction
  `runGoldOvernightAutoRecap` : fait UNE recherche partagée (les 10
  requêtes) puis génère les DEUX langues de sortie (EN+FR) à partir des
  mêmes sources, pour ne pas doubler le coût Tavily par rapport à deux
  clics manuels séparés.
  ⚠️ Coût : le bouton manuel fait maintenant 10 appels Tavily par clic (
  avant : 6) — à garder en tête si le quota Tavily devient serré (le
  fallback `TAVILY2_API_KEY` existe déjà pour ça).
- `jobs/goldOvernightAutoRecap.ts` (nouveau) : garde once-per-local-day
  + target-hour + failure-cooldown, même forme exacte que
  `jobs/f13CalendarIngestion.ts` (même table `ingestion_state`, job key
  `gold-overnight:auto-recap`), logique pure testée dans
  `tests/gold-overnight-auto-recap.test.ts` (mirroring
  `tests/f13-calendar-normalization.test.ts`).
- `POST /api/internal/gold-overnight/auto-run` (nouveau, dans `server.ts`) :
  même middleware `requireIngestSecret` et même secret partagé que les
  autres routes internes (`/api/internal/calendar/ingest`,
  `/api/internal/sunday-read/ingest`) — aucun nouveau secret GitHub requis.
- `.github/workflows/night-recap.yml` (nouveau) : ping HORAIRE (pas
  quotidien) vers cette route — c'est la garde côté backend qui décide si
  une exécution donnée doit réellement tourner, exactement comme
  `calendar-ingest.yml`. Ça évite toute dérive liée au changement
  heure d'été/hiver (un cron GitHub fixe en UTC dériverait de ±1h deux
  fois par an si on visait directement "9h ET").
- Frontend (`GoldOvernightSection.tsx`, `i18n/en.ts`, `i18n/fr.ts`) : affiche
  `recapText` comme un seul paragraphe, textes d'intro corrigés (mention
  EN/FR/ZH/JA/AR côté recherche, sortie EN/FR, plus de promesse "8 dernières
  heures", horaire d'automatisation "vers 9h").

### Contrainte technique réelle (toujours vraie, inchangée)

L'API Tavily (`apps/backend/src/intelligence/cloud/tavilySearchProvider.ts`)
supporte, pour `topic: "news"` : `time_range` (`"day"` / `"week"` / `"month"`
/ `"year"`) et `days` (entier). **Elle n'a pas de granularité à l'heure** —
`time_range: "day"` (~24h glissantes) reste la meilleure approximation
native. C'est pour ça que le prompt Groq (pas Tavily) porte la
responsabilité de ne parler que des mouvements les plus récents.

### Limite connue (scope actuel, pas un bug)

Le fuseau cible (`America/New_York`, 9h) est codé en dur dans
`jobs/goldOvernightAutoRecap.ts` — correct pour Hachim (Québec, même
horloge que l'Est américain) mais pas générique multi-utilisateurs. Si le
besoin apparaît (plusieurs utilisateurs dans des fuseaux différents), il
faudra une table de préférences (fuseau + langue par utilisateur) et faire
tourner la garde par utilisateur plutôt qu'une seule fois globalement — pas
fait ici, volontairement (YAGNI tant que l'app reste mono-utilisateur).

### Vérification faite

- `npm run typecheck` (contracts + backend + frontend) : OK.
- `npm run build` : OK, 26 routes générées sans erreur.
- `npx tsx --test tests/gold-overnight-auto-recap.test.ts
  tests/f13-calendar-normalization.test.ts` : 35/35 tests passent (y
  compris la garde F13 existante, pour confirmer que l'extraction de
  `etHourOf` vers `lib/timeZoneHour.ts` n'a rien cassé, et un test dédié au
  seuil 9h vs 8h).
- **Non testé en conditions réelles** : le déploiement Railway avec
  `GROQ_API_KEY`/`TAVILY_API_KEY`/`TAVILY2_API_KEY` était en cours au
  moment de ces changements (voir Action prioritaire #1 plus haut) — le
  endpoint `/api/internal/gold-overnight/auto-run` et le workflow GitHub
  n'ont pas encore tourné pour de vrai en prod. À vérifier après le
  prochain déploiement : `workflow_dispatch` manuel sur
  `night-recap.yml`, ou attendre le prochain tick horaire, puis
  confirmer côté `/api/intelligence/gold-overnight/on-demand` que les
  deux langues se remplissent.

## Global Read

Bouton retiré du header de `/market` le 2026-09-15 sur demande explicite
(voir historique git — commit `dd638b5`). `useGlobalRead()` reste appelé
dans `apps/frontend/src/app/market/page.tsx` uniquement pour satisfaire
`tests/globalReadShell.test.ts` et garder la notification toast
route-indépendante (`GlobalReadNotifier`, montée dans `layout.tsx`)
fonctionnelle. **Il n'y a actuellement plus aucun moyen dans l'UI d'ouvrir
la modale `AiReportModal`/`GlobalReadSection`** — ce n'est pas un oubli,
c'est le résultat direct de la demande "enlève le bouton". Si le besoin
revient, il faudra soit un nouveau point d'entrée, soit réutiliser
`?globalRead=1` (actuellement un lien mort — rien ne lit ce paramètre dans
`page.tsx`).

## Lecture IA contextuelle (par KPI) — SUPERSÉDÉE le 2026-09-15

Le drawer KPI n'affiche plus de "Lecture IA" gatée par `GROQ_API_KEY`. Le
moteur mécanique déterministe (`apps/backend/src/intelligence/mechanical/`,
committé et poussé en prod le 2026-09-15, commit `f52a5f0`) calcule
maintenant `mechanicalGoldRead`/`mechanicalEvaluation`/`mechanicalFamilyRead`
côté serveur pour chaque KPI, sans appel LLM — voir
`docs/REGLES_MECANIQUES_KPI.md` pour le rulebook, et
`apps/frontend/src/lib/mechanicalRead.ts` côté frontend (lecture pure,
aucun recalcul client). Plus besoin de `GROQ_API_KEY` pour que le drawer
KPI affiche un état Favorable/Défavorable/Contextuel.

`GROQ_API_KEY`/`TAVILY_API_KEY` restent nécessaires uniquement pour le
**Night Recap** (section précédente) — l'action prioritaire #1 (Railway)
ne concerne donc plus que ça.

Ce qui a changé concrètement dans ce commit : nouveau dossier
`apps/backend/src/intelligence/mechanical/` (règles par KPI +
agrégation par famille pour F2/F3/F6/F10), `KpiDrawerView.tsx` /
`FamilyDrawerView.tsx` / `KpiMiniCell.tsx` / `F3FedFace.tsx` /
`RelationshipChip.tsx` consomment les nouveaux champs, les prompts des 4
providers LLM (Anthropic/OpenAI/Gemini/CLI) et `validateInterpretation.ts`
lisent `mechanicalGoldRead` au lieu de l'ancien `GoldRelationshipState`
statique, avec un nouvel invariant : la couche IA ne peut plus jamais
inverser un read mécanique SUPPORTIVE/ADVERSE (elle peut seulement le
dégrader vers CONTEXTUAL). Au passage, ce commit corrige aussi le seul
échec de build restant (`/chart` — `useSearchParams()` sans `Suspense`,
introduit par ce même chantier pour le lien "voir le graphique MOVE"
depuis un KPI) : `npm run build` complète maintenant les 26 routes sans
erreur.

## Rappel — modèle local / committé / déployé

Trois états distincts à ne jamais confondre :

1. **Working tree local** (fichiers modifiés/non trackés, `git status`) —
   ce que Hachim voit sur sa machine, peut inclure du travail en cours
   inachevé.
2. **Git history** (`git log`, ce qui est committé sur `main`) — la source
   de vérité pour ce qui *peut* partir en prod.
3. **Déployé** (Vercel pour le frontend, Railway pour le backend) — ce que
   voit un visiteur du site en ligne. Se met à jour uniquement par push sur
   `main` (Vercel : automatique ; Railway : voir `docs/AUTH_SUPABASE.md`,
   pas toujours automatique selon l'historique documenté là-bas) — jamais
   par une modification locale seule, committée ou non.

Un `.env` local (jamais versionné, jamais poussé) n'affecte que l'état 1.
Pour affecter l'état 3, il faut committer + push (pour le code) et
configurer séparément les variables d'environnement sur la plateforme
d'hébergement concernée (pour les secrets).
