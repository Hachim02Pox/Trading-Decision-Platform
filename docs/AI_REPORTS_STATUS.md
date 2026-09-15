# AI Reports status — Night Recap, Global Read, Lecture IA contextuelle

> Lire ce fichier avant de retoucher au Night Recap, au Global Read, ou à la
> "Lecture IA" contextuelle par KPI. Mettre à jour le statut ci-dessous avant
> de terminer une session qui touche à l'un de ces trois sujets.

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

## Night Recap — écart entre ce qui est codé et ce qui est voulu

Fichier : `apps/backend/src/intelligence/goldOvernightAnalysis.ts`.

Le Night Recap fait une **vraie** recherche web (Tavily) + une **vraie**
synthèse IA (Groq) à chaque clic — ce n'est pas du mock. Mais l'implémentation
actuelle est plus simple que ce que le texte d'intro du bouton promet
("recherche web multi-langue... anglais, chinois, japonais") et que ce que
l'utilisateur veut réellement :

- **Requêtes fixes, anglais uniquement** : `"overnight gold markets"`,
  `"Asia macro overnight"`, `"global macro geopolitics overnight"`.
- **Pas de fenêtre temporelle explicite.** Aucun paramètre de fraîcheur
  n'est passé à Tavily.
- **Le prompt Groq** demande juste "un récap factuel de la nuit" à partir
  des sources — rien qui force à parler du mouvement de la fenêtre précise
  plutôt que d'un mouvement plus ancien resurgissant dans les sources.

### Ce que l'utilisateur veut

À chaque clic : une recherche web fraîche, dans toutes les langues
pertinentes, sur les articles des ~8 dernières heures concernant le
mouvement de l'or **de ces mêmes 8 dernières heures** (pas l'explication
d'un mouvement antérieur qui traînerait encore dans les résultats).

### Contrainte technique réelle à connaître avant de coder ça

L'API Tavily (`apps/backend/src/intelligence/cloud/tavilySearchProvider.ts`)
supporte, pour `topic: "news"` : `time_range` (`"day"` / `"week"` / `"month"`
/ `"year"`) et `days` (entier, nombre de jours en arrière). **Elle n'a pas de
granularité à l'heure.** Le plus proche de "8 dernières heures" atteignable
nativement est `time_range: "day"` ou `days: 1` (dernières 24h) — pas une
fenêtre de 8h exacte. Le prompt Groq peut ensuite recevoir l'heure actuelle
et consigne explicite de se concentrer sur les mouvements les plus récents
des sources fournies, mais Tavily lui-même ne filtrera jamais à l'heure
près. **Ne pas promettre "8 heures" dans l'UI si le filtre réel est "24h"
— corriger soit le texte, soit accepter que ce soit une fenêtre glissante
approximative.**

Pour le multi-langue : Tavily n'a pas de paramètre "langue" fiable pour
restreindre les résultats. La façon pratique d'obtenir des sources en
chinois/japonais/etc. est de **formuler des requêtes séparées dans ces
langues** (ex. `"黄金 隔夜 走势"`, `"ゴールド 価格 動向"`), le moteur
sous-jacent renvoie alors naturellement des sources dans ces langues-là.

### À faire (pas commencé)

1. Étendre le tableau `queries` avec des requêtes formulées en plusieurs
   langues (pas juste des traductions mot-à-mot — des formulations
   naturelles de recherche dans chaque langue).
2. Passer `time_range: "day"` (ou équivalent) à chaque appel
   `search.search(...)` — nécessite d'étendre `WebSearchProvider.search()`
   pour accepter ce paramètre, actuellement il ne prend que
   `(query, maxResults)`.
3. Renforcer le prompt Groq : lui donner l'horodatage actuel et lui dire
   explicitement de ne synthétiser que les mouvements les plus récents des
   sources, pas un contexte plus ancien qui s'y trouverait aussi.
4. Décider si le texte UI ("8 dernières heures") doit être corrigé pour
   correspondre à la fenêtre réellement atteignable, ou si on accepte
   l'approximation "24h" en interne tout en gardant "8h" comme
   simplification côté utilisateur — **décision produit, pas technique**,
   à trancher avec l'utilisateur avant de coder.

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
