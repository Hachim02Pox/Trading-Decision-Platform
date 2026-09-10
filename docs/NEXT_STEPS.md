# Prochaines étapes et statut du projet

> Doc de suivi général — contrairement à `docs/AUTH_SUPABASE.md` (spécifique à l'auth/déploiement), celui-ci suit l'avancement global et la liste des prochaines tâches. Mettre à jour à chaque session qui avance ou ajoute quelque chose.

## Où on en est (2026-09-10)

- **Rebrand "Zenith Terminal"** terminé : nom, mark gyroscope animé (`apps/frontend/src/components/brand/GyroscopeMark.tsx`), nav horizontale avec animation "vivant" au survol, ancien "Gold Terminal"/rail vertical retirés. Voir `DESIGN.md` §0/§12/§22.
- **Base de données** : MySQL local abandonné entièrement, tout (journal, historique KPI, calendrier, audit Lecture Globale) tourne sur Supabase Postgres — même projet que l'auth. TLS vérifié strictement avec le certificat racine Supabase épinglé (pas de `rejectUnauthorized: false`). Voir `docs/AUTH_SUPABASE.md` "Mise à jour 6".
- **Déploiement** : frontend Vercel et backend Railway tous les deux à jour avec le code actuel (déployé manuellement via API/CLI le 2026-09-10, le projet Vercel n'a pas d'auto-déploiement GitHub connecté — voir "Prochaine étape" ci-dessous).
- **Documentation données** : `docs/DONNEES_MARCHE_DECISION.md` documente chaque famille/KPI du cockpit (source, fetch, fraîcheur, formules).

## Prochaines étapes

### 1. Remplacer le widget TradingView par des graphiques maison (décidé le 2026-09-10)

**Statut : décision prise par Hachim après lecture de la recherche ci-dessous ("prend trop de temps pour pas grand chose") — nouveau plan, plus simple, retenu à la place. Aucun code touché — documentation uniquement pour l'instant, implémentation à venir dans une prochaine session.**

#### La décision

Abandonner l'idée de reproduire un chart TradingView interactif (chandelles + dessins) dans le terminal. À la place, pour 5 des 6 instruments actuellement affichés via le widget embarqué (`OANDA:XAUUSD`, `AMEX:GLD`, `CAPITALCOM:DXY`, `FRED:GVZCLS`, `FRED:VIXCLS`) :

**`COINBASE:BTCUSD` est retiré du périmètre (décision Hachim, 2026-09-10) — pas de BTC dans ce terminal.**

- **Un graphique fait par le terminal lui-même**, dans le même style que les graphiques macro déjà existants (`MacroTerminalChart.tsx` — ligne SVG simple, pas de chandelles, pas d'outils de dessin, juste la donnée à lire), au lieu du widget TradingView embarqué.
- **Un bouton/lien "Voir sur TradingView"** avec leur logo, qui ouvre le vrai tradingview.com (nouvel onglet, pas embarqué) sur le symbole équivalent — pour qui veut dessiner un Fibo ou une tendance, il le fait directement sur le vrai TradingView, avec son vrai compte, où ça persiste déjà parfaitement (c'est leur site, pas un iframe).

**Pourquoi c'est la bonne décision** : ça élimine le problème entièrement plutôt que d'essayer de le résoudre. Zéro outil de dessin à construire, zéro sérialisation à gérer, zéro table de sauvegarde à créer — le "problème de persistance" ne se pose plus puisqu'on n'essaie plus de reproduire une fonctionnalité de dessin nous-mêmes. Ceux qui veulent vraiment dessiner ont déjà la meilleure version possible : TradingView lui-même, en dehors du terminal.

#### Ce que ça demande concrètement

**Données — tout existe déjà dans ce projet, aucun nouveau fournisseur à intégrer** :

| Instrument | Source à réutiliser | Déjà branché où |
|---|---|---|
| DXY | Yahoo Finance `DX-Y.NYB` | F6 (`real/f6Currency.ts`) — directement réutilisable |
| GVZ | FRED `GVZCLS` | F11 (`real/f11GoldVol.ts`) — directement réutilisable |
| VIX | FRED `VIXCLS` | F7 (`real/f7Risk.ts`) — directement réutilisable |
| GLD | Archive SPDR (prix de clôture) | F10 (`real/f10Gld.ts`, `closingPrice`) — directement réutilisable |
| XAUUSD (Or) | Yahoo Finance `XAUUSD=X` | Déjà utilisé par la Lecture Globale (`intelligence/globalRead/priceTest.ts`, via `fetchYahooChart`) — directement réutilisable |

Concrètement : étendre `GET /api/charts/macro/:instrument` (ou une route sœur) pour accepter ces 5 nouveaux ids, chacun branché sur le fournisseur déjà listé ci-dessus — aucune nouvelle intégration de données à faire du tout.

**Frontend** :
- Étendre la liste `MACRO_TERMINAL_CHART_INSTRUMENTS`-style (`apps/frontend/src/lib/chartInstruments.ts`) pour couvrir ces 5 instruments avec le même composant `MacroTerminalChart`.
- Retirer `TradingViewAdvancedChart.tsx`, `tradingViewWidgetConfig.ts`, et l'entrée `COINBASE:BTCUSD`/tout le concept crypto (plus utilisés une fois la bascule faite — pas de BTC dans ce terminal).
- Ajouter le bouton/lien externe "Voir sur TradingView ↗" — le calcul de l'URL existe déjà dans le code actuel du widget (`TradingViewAdvancedChart.tsx` construit déjà `https://www.tradingview.com/symbols/{ticker}/?exchange={exchange}` pour son lien d'attribution) — à réutiliser tel quel, juste déplacé dans le nouveau composant.

**Étapes proposées, dans l'ordre** :
1. Étendre le endpoint backend `/api/charts/macro/:instrument` pour les 5 nouveaux ids (réutilisation des fournisseurs listés ci-dessus).
2. Étendre `chartInstruments.ts` + retirer les composants TradingView embarqués et BTCUSD du frontend.
3. Ajouter le bouton "Voir sur TradingView" avec leur logo, lien externe vers le symbole équivalent.
4. Vérification en direct sur les 5 instruments (comme d'habitude) : donnée correcte, lien externe fonctionnel, aucune erreur console.

C'est un chantier net **beaucoup plus petit** que l'option Lightweight Charts ci-dessous (recherche conservée pour mémoire, écartée par décision de Hachim) : pas de nouvelle librairie tierce, pas d'outils de dessin à construire, pas de nouvelle table de sauvegarde.

---

### 1a. Historique — recherche Lightweight Charts (écartée le 2026-09-10, "prend trop de temps pour pas grand chose")

**Conservé pour mémoire seulement — ne pas relancer cette piste sans qu'Hachim la redemande explicitement.**

#### Le problème, précisément

Sur `/chart`, le graphique candlestick (`TradingViewAdvancedChart.tsx`) ne garde **rien** d'une interaction à l'autre : dessiner un Fibonacci ou une tendance, puis juste naviguer vers Marché/Décision et revenir sur Chart (même session, même onglet, pas de refresh) efface tout — le composant démonte et recrée le widget à chaque changement de page. Un vrai refresh (F5) l'efface aussi, évidemment. Hachim veut que ça reste enregistré **lié à son compte du terminal** (pas à un compte TradingView externe qu'il faudrait garder connecté ailleurs).

#### Pourquoi ça ne marche pas avec TradingView, expliqué en détail

Ce qui est utilisé aujourd'hui (`apps/frontend/src/lib/tradingViewWidgetConfig.ts`) est le **widget gratuit embarqué** (`embed-widget-advanced-chart.js`) : un simple `<script>` qui génère un `<iframe>` pointant vers `tradingview-widget.com` (pas `tradingview.com` — un domaine séparé, donc aucun cookie/session partagé même si Hachim est connecté sur tradingview.com ailleurs). C'est la version "vitrine" gratuite de TradingView, pensée pour être collée sur n'importe quel site web sans compte.

Trois recherches distinctes, chacune fermant une porte :

1. **Le widget gratuit n'a aucun paramètre de sauvegarde.** Les fonctions comme `save_load_adapter`, `charts_storage_url`, `onAutoSaveNeeded`, les boutons "Save layout"/"Load layout" existent, mais uniquement dans la documentation de la **[Advanced Charts Library](https://www.tradingview.com/charting-library-docs/latest/saving_loading/)** — un produit séparé, pas le widget qu'on utilise. Vérifié sur [la doc du widget gratuit](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/) : rien de tout ça n'y figure.
2. **La Advanced Charts Library elle-même est fermée aux projets personnels.** Vérifié : *"TradingView does not provide the Advanced Charts and Trading Platform libraries for personal use, hobbies, studies, or testing. These licenses are only available to companies for use in public web projects."* Zenith Terminal ne serait pas éligible.
3. **Se connecter à TradingView depuis l'intérieur du widget n'est pas possible non plus, et ce n'est pas réparable en code.** Testé en capturant le widget réel hors de l'app (isolé, sans authentification requise) : aucune icône de connexion nulle part dans son interface. Et même si TradingView en ajoutait une, les navigateurs modernes (Chrome, Safari, Firefox) bloquent par défaut les flux de connexion/cookies tiers à l'intérieur d'un iframe cross-origine — protection anti-phishing générale du web, pas une limite spécifique à TradingView.

**Conclusion : aucune combinaison "widget TradingView + persistance" n'est accessible pour ce projet, par leur propre choix de licence et par les règles de sécurité du navigateur — pas un problème qu'on peut contourner en codant plus intelligemment.**

#### La seule voie qui reste : Lightweight Charts (remplacer le widget)

**C'est quoi Lightweight Charts** : la librairie de graphiques **gratuite et open-source** (licence Apache 2.0) de TradingView elle-même — contrairement à la Advanced Charts Library, celle-ci est explicitement autorisée pour un projet personnel. Elle dessine des chandeliers/lignes/aires très efficacement (fichier ~45 Ko), mais **ne fournit ni les données de prix ni les outils de dessin** — seulement le moteur de rendu. Tout le reste, c'est nous qui le construisons ou qui l'assemblons.

Concrètement, remplacer le widget actuel demande de construire/assembler **quatre pièces** :

**A. Le graphique lui-même (chandeliers)** — Lightweight Charts fait ça nativement, c'est la partie la plus simple.

**B. La donnée de prix (d'où viennent les chandeliers)** — le widget TradingView actuel affiche 6 instruments (`apps/frontend/src/lib/chartInstruments.ts`) : `OANDA:XAUUSD`, `AMEX:GLD`, `CAPITALCOM:DXY`, `FRED:GVZCLS`, `FRED:VIXCLS`, `COINBASE:BTCUSD` — ces prix viennent aujourd'hui du flux propre de TradingView (peu importe la source réelle, c'est leur widget qui l'agrège). Sans leur widget, il faut fournir nous-mêmes cette donnée. Bonne nouvelle : ce projet a **déjà** des fournisseurs qui couvrent la majorité de ces symboles :
   - `apps/backend/src/providers/yahooFinance.ts` (`fetchYahooChart`) couvre déjà DXY, et par le même mécanisme couvrirait GLD, l'or (`GC=F` ou `XAUUSD=X`, déjà utilisé ailleurs dans le projet comme référence Lecture Globale) et BTC (`BTC-USD`) — **mais** cette fonction ne récupère aujourd'hui que le prix de clôture (`close`), pas open/high/low. Un chandelier a besoin des 4 — extension à faire, pas une nouvelle intégration (Yahoo renvoie déjà OHLC dans sa réponse brute, juste pas encore parsé ici).
   - `VIXCLS` et `GVZCLS` sont déjà des séries FRED pleinement câblées (familles F7/F11) — réutilisables telles quelles pour l'affichage, même si FRED ne donne qu'une valeur quotidienne (pas de chandelier intrajournalier, donc ces deux resteraient en ligne simple comme les graphiques macro actuels, pas en chandelles).
   - **Limite honnête à garder visible** (même principe que le reste du projet) : Yahoo Finance est un flux non-officiel, sans SLA, potentiellement retardé ou limité en fréquence — pas un flux tick-by-tick comme celui que TradingView agrège en interne. Le graphique sera "assez bon pour lire le contexte", pas un flux d'exécution.

**C. Les outils de dessin (Fibo, tendances, etc.)** — Lightweight Charts n'en fournit aucun par défaut. Recherche faite sur ce qui existe et est activement maintenu en 2026 pour la construire sans tout écrire à la main :
   - [`lightweight-charts-drawing`](https://github.com/deepentropy/lightweight-charts-drawing) — 68 outils (tendances, Fibonacci, Gann, canaux, pitchforks, formes, annotations) pour Lightweight Charts v5.
   - [`oakview`](https://github.com/deepentropy/oakview) — wrapper Web Component avec 21 outils professionnels (tendances, Fibo, formes).
   - `CandleKit` (mentionné dans la doc communautaire, juin 2026) — bâti spécifiquement autour de la persistance (sélection/déplacement/redimensionnement/verrouillage/sauvegarde des objets dessinés).
   - **À valider avant de choisir** : licence de chacune (compatible avec un usage perso), maintenance réelle (dernier commit, issues ouvertes), et surtout — le point que la communauté elle-même signale comme le vrai défi — la facilité à **sérialiser** un dessin (le transformer en JSON simple) pour pouvoir le sauvegarder. C'est exactement ce qu'il faut vérifier en premier avant de s'engager sur l'une d'elles.

**D. La sauvegarde (le compte du terminal)** — la bonne nouvelle : l'authentification (Supabase Auth, `holders`) et la base de données (Postgres/Supabase) sont **déjà en place** depuis les passes précédentes. Ce morceau est le plus simple des quatre : une nouvelle table (ex. `chart_drawings` : `holder_id`, `instrument`, `timeframe`, `drawings jsonb`, `updated_at`), protégée par RLS comme `holders` (chacun ne voit/modifie que ses propres dessins), et deux appels API (`GET`/`PUT`) pour lire/écrire le JSON sérialisé par l'outil de dessin choisi en C.

#### Ampleur réelle, honnêtement

Ce n'est **pas** un patch — c'est remplacer un composant qui marche (même sans persistance) par un assemblage de 4 pièces dont une seule (D, la sauvegarde) est vraiment simple avec ce qui existe déjà. B (données) demande une extension ciblée d'un fournisseur existant. A et C dépendent du choix et de la qualité réelle d'une librairie tierce communautaire (pas officielle TradingView) qu'il faut d'abord tester avant de s'engager dessus.

#### Étapes proposées, dans l'ordre, avant d'écrire du code applicatif

1. **Preuve de concept isolée** (pas dans l'app) : monter une page de test seule avec Lightweight Charts + une des librairies de dessin candidates (probablement `lightweight-charts-drawing`, la plus riche en outils), des données bidon, et vérifier concrètement : le rendu est correct, le Fibo/la tendance se dessinent bien à la souris, et surtout — on arrive à extraire les dessins en JSON proprement. Si cette étape échoue ou est trop bancale, on regarde une autre librairie avant d'aller plus loin.
2. Étendre `fetchYahooChart` (ou une nouvelle fonction dédiée) pour renvoyer open/high/low en plus du close déjà géré.
3. Construire le nouveau composant chart (remplace `TradingViewAdvancedChart.tsx` pour les 6 instruments concernés) avec Lightweight Charts + la librairie de dessin retenue.
4. Migration Supabase pour la table de sauvegarde des dessins + route API + branchement au holder connecté.
5. Vérification en direct (comme d'habitude) : dessiner, naviguer, recharger, redémarrer le navigateur — confirmer que ça tient.

**Décision finale (2026-09-10)** : écarté — voir section 1 ci-dessus pour l'option retenue à la place.
