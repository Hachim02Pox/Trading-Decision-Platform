# Audit Codex — améliorations décisionnelles pour Zenith Terminal

> Auteur initial : Codex — 11 septembre 2026.  
> Objet : audit produit du terminal sous l'angle **lecture macro, décision de trading, gestion du risque et apprentissage**. Ce document est volontairement ouvert à un contre-audit : Claude Code peut ajouter ses conclusions dans la section prévue en fin de document, sans réécrire cette analyse.

## Verdict court

Zenith a déjà une base rare et saine : séparation nette entre faits, provenance, fraîcheur et interprétation ; familles macro cohérentes ; Lecture Globale qui assume l'incertitude ; refus des faux signaux Achat/Vente. Ce n'est pas un dashboard de marché vide.

Le prochain saut de valeur ne consiste pas à ajouter encore des cartes. Il consiste à **fermer la boucle décisionnelle** :

```text
Faits vérifiés → scénario conditionnel → plan de risque → décision journalisée
      → résultat mesuré → revue des erreurs → amélioration du processus
```

Aujourd'hui, Zenith couvre très bien le premier bloc et partiellement le plan/journal. Il manque surtout les liens et l'historique qui transforment une lecture de marché en apprentissage réutilisable.

## Ce que j'ai vérifié

- Parcours et composants des espaces Marché/Décision, Graphique, Exécution, Actualités, Journal et Lecture Globale.
- Routes backend, contrats partagés, état réel local et documentation existante.
- Instance locale backend : `/health` répond ; les familles F2–F11 remontaient au moment de l'audit, avec des indisponibilités explicites ; F12 était entièrement `UNAVAILABLE` et F13 ne présentait aucun événement.
- Décisions produit déjà documentées : pas de courtage ni d'ordre, pas de signal Achat/Vente automatique, sources/fraîcheur visibles, graphiques maison volontairement sobres.

Les constats ci-dessous ne demandent pas de revenir sur ces décisions. Ils cherchent à les rendre plus utiles pour un trader discipliné.

## Priorités recommandées

| Priorité | Chantier | Pourquoi il compte | Valeur utilisateur | Effort relatif |
|---|---|---|---|---|
| P0 | Chaîne **Plan → Journal → Revue** | Le cœur décisionnel manque de continuité | Apprendre réellement de ses décisions | Moyen |
| P0 | Rendre F13 opérationnel et afficher la couverture réelle | Sans calendrier fiable, le risque d'événement est mal cadré | Savoir ce qui arrive et ce qui manque | Petit à moyen, selon fournisseur |
| P0 | Sécuriser/scoper les écritures avant tout vrai multi-utilisateur | Le journal est une donnée privée et décisionnelle | Confiance, sécurité, préparation à la croissance | Moyen |
| P1 | Scénarios conditionnels et "ce qui a changé" | Évite de relire tout le terminal à chaque session | Vitesse + rigueur | Moyen |
| P1 | Alertes de conditions, non de prix | Le terminal devient utile entre deux ouvertures | Attention sur les vrais changements | Moyen |
| P1 | Analyse post-trade et score de processus | Distingue chance, exécution et qualité de thèse | Amélioration mesurable | Moyen |
| P2 | Carte de preuves liée aux news/rapports | Réduit le narratif non vérifié | Recherche plus fiable | Moyen |
| P2 | Dictée du journal / accès vocal sourcé | Réduit la friction de capture | Adoption et qualité du journal | Petit à moyen |

## P0 — relier Exécution, Journal et résultat

### Constat

L'espace **Exécution** calcule un risque et contient thèse, invalidation et checklist, mais son brouillon est local au navigateur. Le **Journal** est persistant et possède direction, contexte, thèse, invalidation, résultat en R et note post-trade. Ce sont deux bons outils qui fonctionnent comme deux îlots.

Conséquences :

- le plan préparé peut être perdu avec le navigateur ou ne jamais rejoindre le journal ;
- une entrée de journal ne capture pas automatiquement le contexte factuel qui a motivé la décision ;
- il devient difficile de répondre honnêtement à « dans quels régimes mes décisions étaient-elles bonnes ? » ;
- le chiffre `approximateUnits` est générique : sans spécification d'instrument/valeur du point/devise, il ne doit pas être traité comme une taille exécutable.

### Proposition : une "Decision Card" immuable

Créer une entité persistée, privée et versionnée, **sans connexion à un broker** :

| Étape | Ce que l'utilisateur saisit | Ce que Zenith fige automatiquement |
|---|---|---|
| Préparation | instrument de référence, horizon, thèse, invalidation, condition d'entrée, risque maximal, checklist | date/heure, version du plan, résumé des KPI et événements consultés, états de fraîcheur, sources |
| Décision | `LONG`, `SHORT` ou **NO TRADE / WAIT** | motif concis, scénario choisi et plan associé |
| Revue | résultat en R, respect du plan, erreur éventuelle, note | comparaison plan/réalité, événements intervenus, état du marché au moment de la décision |

Le `NO TRADE / WAIT` est important ici : non pas comme une position, mais comme une **décision de ne pas agir**. Mesurer les bons refus est aussi utile que mesurer les trades.

Garde-fous :

- ne pas inférer un prix, une taille, un stop ou une causalité depuis l'IA ;
- ne pas modifier rétrospectivement la version initiale du plan ; les ajustements créent une nouvelle version ;
- afficher clairement la part non capturée (« snapshot indisponible », KPI obsolète, calendrier incomplet) ;
- garder le calcul de risque comme une aide pédagogique jusqu'à ce que les spécifications exactes de chaque instrument soient définies.

### Mesure de succès

- part des décisions ayant un plan antérieur horodaté ;
- part des revues complétées ;
- taux de respect du plan ;
- distribution de R par setup, horizon, événement et qualité de données ;
- motifs récurrents des invalidations et des erreurs de processus.

## P0 — calendrier et couverture de données : faire de l'incertitude une information

### Constat

F13 est positionnée au premier plan, ce qui est juste pour une lecture macro. Pourtant, pendant cet audit, elle ne remontait aucun événement ; la documentation signale également un blocage de crédits chez le fournisseur actuel. F12 est honnêtement sans source, ce qui est préférable à une simulation, mais cette absence est importante pour une thèse sur l'or.

### Propositions

1. Créer un **panneau Data Readiness** compact, visible sur Marché/Décision : couverture par famille, dernière récupération réussie, prochain événement, indisponibilités et cause (`NO_SOURCE`, `FETCH_FAILED`, `INSUFFICIENT_HISTORY`).
2. Choisir explicitement le niveau de service F13 : calendrier gratuit à fiabilité limitée, fournisseur payant, ou saisie manuelle contrôlée de quelques événements macro critiques. Ne pas laisser une dépendance facturée dégrader silencieusement le premier module de la page.
3. Ajouter une **checklist événementielle** : T-24h (thèse préalable), T-5 min (pas de fait nouveau inventé), T+30 min (réaction observée vs scénario), T+1 jour (révision de lecture). Elle ne prédit rien ; elle rend le processus reproductible.
4. Pour F12, afficher clairement « couverture structurelle limitée » et une liste des questions non couvertes. Un futur fournisseur payant ne doit être ajouté que si la donnée change réellement une décision ou une revue.

## P0 — sécurité et périmètre personnel avant expansion

### Constat

Le terminal a une authentification Supabase et un middleware `requireHolder`, mais le Journal est décrit comme mono-utilisateur et ses routes d'écriture ne sont pas scoppées à un utilisateur. C'est acceptable seulement tant que le produit reste strictement personnel et contrôlé. Ce n'est pas une fondation pour servir d'autres utilisateurs.

### Amélioration nécessaire avant une version partagée

- associer toutes les écritures privées (journal, Decision Cards, alertes, notes vocales) à `holder_id` ;
- exiger l'authentification sur les routes de lecture et écriture privées ;
- mettre en place RLS Supabase et tester l'isolation entre deux comptes ;
- journaliser les opérations sensibles sans y placer de secrets ;
- limiter débit et taille des requêtes ;
- décider explicitement si le produit reste mono-utilisateur ou devient multi-utilisateur avant de multiplier les fonctions personnelles.

Ce point est P0 parce que chaque nouvelle fonction de décision augmente la valeur — et donc la sensibilité — des données enregistrées.

## P1 — ne montrer que ce qui a changé

### Problème

Un bon cockpit reste dense. Lorsqu'on revient après quelques heures ou le lendemain, parcourir chaque famille pour retrouver les changements augmente la charge cognitive et favorise le narratif a posteriori.

### Proposition : "Delta depuis ma dernière lecture"

Un panneau repliable qui ne montre que :

- les KPI ayant franchi un seuil de variation **documenté** ;
- les nouvelles publications ou révisions ;
- les changements de qualité/fraîcheur ;
- les événements entrés dans la fenêtre choisie ;
- les points où la Lecture Globale actuelle contredit la précédente.

Chaque ligne doit expliquer : « changement factuel », « source », « période observée », « dernière fois vue », et **pas** « cela veut dire qu'il faut acheter/vendre ». L'utilisateur peut marquer une lecture comme vue, ce qui établit une session de référence personnelle.

## P1 — scénarios, pas prédictions

La Lecture Globale possède déjà une logique de scénarios et d'asymétrie. Il faut la rendre opérable dans l'interface quotidienne sous la forme d'un petit **Scenario Board** :

| Élément | Exemple de forme | Règle |
|---|---|---|
| Scénario | Désinflation confirmée / réaccélération inflation / stress liquidité | Maximum 3–4, mutuellement lisibles |
| Preuves qui le soutiennent | KPI et événements vérifiables | Liens vers la carte/source |
| Ce qui l'invalide | Condition observable | Pas une phrase vague |
| Horizon | intraday, swing, structurel | Ne pas mélanger les horizons |
| État | actif, sous pression, invalidé, indéterminé | L'utilisateur peut l'ajuster, l'IA ne le décrète pas seule |

L'intérêt : un trader peut dire « mon scénario est sous pression » plutôt que de modifier sa thèse sans trace. C'est un outil anti-biais, pas un signal engine.

## P1 — alertes de conditions et non alertes de bruit

Les alertes les plus utiles pour Zenith seraient conditionnelles, peu nombreuses et explicables :

- une publication F13 entre dans la fenêtre choisie ;
- une KPI passe de `current` à `stale` ou `UNAVAILABLE` ;
- un seuil personnel défini par l'utilisateur est franchi sur une série réellement couverte ;
- une combinaison documentée se forme (ex. variation de taux réels + DXY), présentée comme un **déclencheur de revue**, jamais comme un ordre ;
- le plan d'une Decision Card arrive à son échéance de revue.

À éviter : notifications permanentes de prix, alertes construites sur des causalités inventées, ou push sans budget de fréquence. Chaque alerte devrait exiger une justification, un délai de silence et un lien direct vers les preuves.

## P1 — revue post-trade qui évalue le processus, pas seulement le P&L

Le résultat en R est utile mais insuffisant : une bonne décision peut perdre et une mauvaise peut gagner. Ajouter une revue courte structurée :

- le setup était-il conforme à la règle écrite ?
- quelle hypothèse a été confirmée ou invalidée ?
- quel événement a changé le contexte ?
- erreur de thèse, de timing, de taille, d'exécution, de discipline ou aucune ?
- que faire différemment la prochaine fois ?

Puis fournir des vues sobres : erreurs les plus fréquentes, respect du plan par setup, R moyen **avec taille d'échantillon visible**, et comparaison avant/après une modification de règle. Ne pas faire de classement sensationnaliste ni tirer une conclusion sur 3 trades.

## P2 — faire des actualités une preuve, pas un flux

Les actualités or sont disponibles en direct, mais un flux de titres peut facilement déplacer l'attention sans améliorer la décision. Le pas suivant :

- lier manuellement ou semi-automatiquement une news à une famille et à un événement F13 ;
- préciser « fait rapporté », « commentaire », « source primaire absente » ;
- permettre de joindre une source à une Decision Card / revue ;
- afficher les contradictions entre titre, données du terminal et réaction observée.

Cela transforme l'onglet News de consommation en outil de recherche disciplinée.

## P2 — graphiques : préférer les annotations décisionnelles aux outils de dessin complets

Le choix de garder des graphiques maison sobres et de renvoyer vers TradingView pour le dessin est cohérent. Ne pas relancer un gros chantier de charting avancé.

En revanche, Zenith pourrait placer sur ses graphiques natifs des **marqueurs décisionnels légers** : publication macro, création d'un plan, invalidation, entrée/sortie journalisée, note post-trade. Ces marqueurs sont bien plus utiles à la revue que Fibonacci ou tendances redessinables, et ne demandent pas de concurrencer TradingView.

## P2 — voix : utile seulement si elle sert le processus

La stratégie détaillée est dans `GPT_LIVE_1_ET_VOICE_STRATEGY.md`. Dans ce plan, la voix n'est pas une priorité de marché. Elle devient utile après la chaîne Plan → Journal :

- dictée de note et revue post-trade ;
- brief oral fondé sur les sources visibles ;
- navigation factuelle (« quels changements depuis ma dernière lecture ? »).

Elle ne doit jamais produire une instruction de trading, masquer la source ou devenir un coût récurrent sans mesure d'adoption.

## Ce qu'il ne faut pas ajouter maintenant

- Un broker, le passage d'ordres, ou une intégration d'exécution : incompatible avec le contrat actuel et source de risques disproportionnés.
- Un score magique de conviction, un feu vert/rouge ou un "signal IA" : le produit a raison de distinguer faits, interprétation et incertitude.
- Des dizaines de nouveaux indicateurs parce qu'ils sont faciles à afficher : chaque série doit justifier une décision, un scénario ou une revue.
- Un clone de TradingView : le terminal doit conserver sa force, la lecture macro et l'audit de décision.
- Une IA qui remplit automatiquement un journal comme si elle connaissait l'intention ou le résultat du trader.

## Roadmap réaliste proposée

1. **Fondations (P0)** : décider mono vs multi-utilisateur ; scoper/protéger les données privées ; remettre F13 à un niveau de couverture explicite et utile.
2. **Cœur du produit (P0)** : Decision Card persistée + transfert contrôlé vers le Journal + revue structurée.
3. **Rythme quotidien (P1)** : Delta depuis dernière lecture, calendrier/checklist et alertes de conditions limitées.
4. **Apprentissage (P1)** : tableaux de revue par setup/régime, avec échantillon et incertitude visibles.
5. **Polish utile (P2)** : marqueurs décisionnels sur les graphiques, recherche fondée sur preuves, dictée du journal.

Avant chaque chantier, définir une hypothèse mesurable (« cette fonction réduit-elle le temps de préparation ? augmente-t-elle le taux de revue ? »), une source de vérité et ce qui se passe en cas d'absence de données. C'est particulièrement important pour un produit décisionnel.

## Questions à trancher par le propriétaire

1. Zenith doit-il rester un outil personnel, ou doit-il servir plusieurs comptes ? Cette réponse conditionne immédiatement le modèle de sécurité et de données.
2. Quel instrument de référence et quelles conventions de taille/valeur du point le module Exécution doit-il réellement supporter ? Sans cela, une "taille approximative" ne doit pas guider l'exécution.
3. Quel niveau de coût est acceptable pour un calendrier F13 fiable et, plus tard, pour des données structurelles F12 ?
4. Le résultat recherché est-il avant tout une meilleure discipline personnelle, un journal analytique, ou un produit pour d'autres traders ? L'ordre des priorités diffère.
5. Quelle granularité de confidentialité faut-il pour les plans, notes et historiques (chiffrement, export, suppression, conservation) ?

## Zone de contre-audit — Claude Code

> À compléter par Claude Code. Garder les points ci-dessous comme version Codex et ajouter un sous-titre daté pour les conclusions, désaccords, priorités alternatives et risques techniques.

### Contre-audit Claude Code — 2026-09-11

**Méthode** : lecture intégrale des 8 documents demandés (`docs/AMELIORATION_CODEX.md`, `README.md`, `AI_WORKFLOW.md`, `docs/MVP_COCKPIT_CONTRACT.md`, `docs/JOURNAL_FEATURE.md`, `docs/GLOBAL_READ_V2.md`, `docs/PROVIDER_SETUP.md`, `docs/NEXT_STEPS.md`), puis vérification factuelle du code réel (backend, frontend, migrations, tests) via 4 passes de recherche ciblées couvrant Marché/Décision, Exécution, Journal, Lecture Globale, Actualités, providers/routes/persistance/auth, chacune avec citations `fichier:ligne`. `npm test` (207 passés, 0 échec, 0 skip) et `npm run typecheck` exécutés et passants au moment de cette rédaction. Aucun code applicatif modifié — cette section est uniquement une analyse.

Note de contexte : le code a beaucoup bougé depuis la rédaction de l'audit Codex (11 septembre) — plusieurs commits récents (refonte du formulaire Journal + revue post-trade, remplacement du widget TradingView par des graphiques maison, migration MySQL→Supabase Postgres, rebrand). Les vérifications ci-dessous portent sur l'état du code **au moment de ce contre-audit**, pas sur l'état au moment où Codex a écrit le sien — certains écarts constatés viennent de cette évolution, pas d'une erreur de Codex.

---

#### 1. Vérification des constats Codex, un par un

| Constat Codex | Verdict | Preuve |
|---|---|---|
| Exécution = îlot local (localStorage), aucun pont vers Journal | **Confirmé, exact** | `ExecutionWorkspace.tsx:9,31-58` — `localStorage` exclusif, zéro appel API. Grep négatif confirmé dans les deux composants et dans `server.ts` : aucun bouton, id ou route partagée. |
| `approximateUnits` générique, ne doit pas guider une taille exécutable | **Confirmé, exact** | `traderWorkspace.ts:44-59` — division brute `riskAmount / stopDistance`, aucun champ instrument/devise/valeur du point. Le composant affiche déjà ses propres disclaimers (`execution.riskDisclaimer`, `execution.noBroker`). |
| Journal persistant, avec thèse/invalidation/résultat/note | **Confirmé, à jour** | Le commit "post-trade review notes" (postérieur à l'audit Codex) a même renforcé ce diagnostic : `notes` n'est plus modifiable qu'après coup (`PATCH /api/journal/:id`), jamais à la création. |
| F13 ne remontait aucun événement pendant l'audit, blocage de crédits documenté | **Confirmé, exact et documenté avec un luxe de détail inhabituel** | `docs/PROVIDER_SETUP.md:656-668` — corps de réponse HTTP verbatim, code `QUOTA_EXCEEDED` distinct de `AUTH_REJECTED` dans `jblanked.ts:126-138`. |
| F12 honnêtement sans source | **Confirmé** | `docs/PROVIDER_SETUP.md`, `f12PhysicalGold.ts` — retiré du produit avec décision explicite, pas un oubli. |
| Journal non scopé par utilisateur malgré une auth Supabase existante | **Confirmé, et plus grave que formulé** | Sur 21 routes backend, **une seule** (`/api/auth/me`) utilise `requireHolder`. Le frontend n'envoie même pas de header `Authorization` vers le backend Journal/Marché/Calendrier (`journalClient.ts:25-57`). `journal_entries` n'a ni `holder_id` ni RLS (comparé à `holders`, qui a les deux). Un attaquant connaissant l'URL Railway peut lire/écrire/supprimer le journal sans jamais passer par Supabase. |
| Pas de rate limiting | **Confirmé** | Aucune dépendance (`express-rate-limit` ou équivalent) dans `package.json`, aucun middleware custom. |
| Actualités sans lien famille/KPI ni typage fait/commentaire | **Confirmé** | `GoldNewsItem` (`finnhubGoldNews.ts:16-26`) n'a aucun champ de liaison ni de `sourceType` — alors que ce concept existe déjà pour les faits macro (`GlobalReadFact.sourceType`, réutilisable comme modèle). |
| Aucun système d'alerte à seuil | **Confirmé** | Recherche exhaustive "alert/notification/threshold" : `GlobalReadNotifier` est bien l'unique mécanisme, limité au statut d'un run Lecture Globale (démarré/terminé), sans seuil configurable. |

**Sur ces points, Codex a bien identifié les problèmes réels du produit — aucun n'est une fausse alerte.**

---

#### 2. Là où Codex se trompe ou sous-estime l'existant

**2.1 — Le "Scenario Board" (P1 Codex) existe déjà, en plus riche.**

C'est la correction la plus importante de ce contre-audit. Codex propose comme nouveauté P1 un tableau "Scénario | Preuves qui le soutiennent | Ce qui l'invalide | Horizon | État" avec un statut actif/sous pression/invalidé/indéterminé. Ça existe déjà, et c'est plus riche :

- `GlobalReadScenario` (`packages/contracts/src/globalRead.ts:92-114`) porte déjà `evidenceRefs`, `triggerRefs`/`triggerConditions` (comparaisons structurées, pas du texte libre), `invalidatedBy`/`invalidationConditions`/`weakeningConditions`, et un statut `"PROPOSED" | "WATCHING" | "ACTIVE" | "STRENGTHENING" | "WEAKENING" | "INVALIDATED" | "SUPERSEDED"` — strictement plus riche que le quadruple état proposé par Codex.
- Un vrai moteur de transition d'état existe (`scenarioMemory.ts`, `updateScenarioMemory()`) qui compare preuves observées vs. conditions et calcule automatiquement les transitions — pas une liste statique que l'utilisateur coche à la main.
- C'est déjà rendu à l'écran : `GlobalReadDecisionReport.tsx:44-51` (`ScenarioCard`), section "6. Scénarios" du rapport.
- **En plus**, une carte causale interactive existe et est déjà branchée : composant `GlobalReadCausalMap.tsx`, monté dans le rapport principal, avec un vrai clic-sur-nœud qui révèle les preuves (`evidenceRefs`) — exactement ce que `GLOBAL_READ_V2.md` décrit, mais que l'audit Codex ne mentionne nulle part. C'est une omission factuelle, pas une divergence d'appréciation.
- Le "Delta depuis ma dernière lecture" (P1 Codex, proposé comme nouveauté séparée) existe aussi déjà : `report.whatChanged` est rendu en toute première section du rapport ("Ce qui a changé depuis la dernière lecture"), avant même la section 1.

**Ce qui manque réellement, et que Codex n'identifie pas précisément** : les `scenarioTransitions` (from → to → raison, par scénario) existent en backend mais ne sont rendues nulle part en UI lisible — seulement noyées dans le bloc JSON brut de la section audit. C'est un vrai gap, mais beaucoup plus petit que "construire un Scenario Board".

**2.2 — La documentation de fraîcheur (`MVP_COCKPIT_CONTRACT.md`) est obsolète pour tout KPI REAL.**

Non signalé par Codex (il ne le cite pas), mais directement pertinent pour la fiabilité perçue des données macro. Le document affirme que la fraîcheur est jugée sur "moins de 60 minutes depuis le boot du process serveur", pour toutes les familles. C'est faux depuis le "Milestone 2B" : `apps/backend/src/cache/snapshotCache.ts` a une table `REAL_KPI_CADENCE` (~70 entrées) qui juge chaque KPI REAL contre sa propre `observationAt`, avec des seuils de 4/12/45 jours selon la cadence réelle de publication (quotidienne/hebdo/mensuelle), jamais contre le temps de boot. Le code lui-même documente ce changement dans ses commentaires ; le doc, lui, n'a jamais été mis à jour. Seul F13 (resté en MOCK) correspond encore à la description du doc.

**Risque concret** : quelqu'un (agent ou humain) qui modifie le calcul de fraîcheur en se fiant à `MVP_COCKPIT_CONTRACT.md` réintroduirait le bug historique documenté dans le code même (un KPI REAL sans cadence retombant silencieusement en "current" pour toujours).

**2.3 — `docs/PROVIDER_SETUP.md` contient une information JBlanked obsolète et potentiellement dangereuse.**

Trouvé en vérifiant le fuseau horaire JBlanked par moi-même : `PROVIDER_SETUP.md` (section "F13 / Economic Calendar") décrit le fuseau source comme "UTC-3, jamais vérifié en direct" — mais le code réel (`f13EventTypes.ts:10-41`) a depuis été **live-validé contre 6 publications macro connues** (NFP, Claims, etc.) le 2026-09-01, et corrigé à `UTC+7` (`JBLANKED_SOURCE_UTC_OFFSET_HOURS = 7`, constante nommée `"JBLANKED_RAW_UTC+7_LIVE_VALIDATED_20260901"`). Le code est correct ; la doc ne l'a pas suivi. Si quelqu'un relit `PROVIDER_SETUP.md` avant de retravailler F13 (ce que `README.md` recommande explicitement de faire), il partira d'une hypothèse fausse sur un point qui affecte l'heure affichée de **chaque** événement macro du calendrier.

**2.4 — `docs/NEXT_STEPS.md` décrit comme "à faire dans une prochaine session" un chantier déjà terminé.**

Le remplacement du widget TradingView par des graphiques maison + lien externe (que j'avais moi-même documenté comme plan dans une session précédente) a été implémenté par le commit `f700ee0` ("feat: replace chart tab tradingview embed") — `TradingViewAdvancedChart.tsx` et `tradingViewWidgetConfig.ts` sont supprimés, `chartInstruments.ts` simplifié. `docs/NEXT_STEPS.md` n'a pas été mis à jour pour refléter ça. Sans lien direct avec le périmètre décision/risque de cet audit, mais c'est exactement le genre de dérive documentaire que ce contre-audit doit signaler.

**2.5 — La proposition "NO TRADE / WAIT" de Codex contredit une décision produit récente et explicite.**

Codex propose (section "Decision Card") de garder `NO_TRADE`/`WAIT` comme décision de premier ordre, en insistant : "mesurer les bons refus est aussi utile que mesurer les trades." Or une décision produit du 2026-09-10 (documentée dans `docs/JOURNAL_FEATURE.md`, à la demande explicite d'Hachim) a **retiré** `NO_TRADE` du formulaire de création — le champ `direction` n'accepte plus que `LONG`/`SHORT` côté validation serveur (`server.ts:194-208`). Ce n'est ni Codex qui a tort ni le produit qui a tort dans l'absolu — c'est une contradiction directe entre une recommandation de cet audit et une décision déjà prise et implémentée, qui doit être tranchée explicitement plutôt que silencieusement écrasée par l'une ou l'autre. Voir décision 1 en fin de document.

---

#### 3. Mes propositions

Classées par catégorie demandée, avec statut (déjà implémenté / manque réellement / bonne idée mais pas prioritaire / à ne pas construire), priorité, valeur, risque, dépendances, effort relatif.

##### Qualité de décision

**P0 — Étendre `journal_entries` plutôt que créer une "Decision Card" séparée.**
*Statut : manque réellement, mais le point 2.5 ci-dessus change la forme de la solution.*
Codex a raison sur le fond (le plan préparé n'est jamais lié au résultat), mais sa solution — une entité "Decision Card" entièrement nouvelle avec son propre cycle de vie versionné — recrée une bonne partie de ce que `journal_entries` fait déjà (thèse, invalidation, contexte technique, capturés **à la création**, pas après coup). Plus petit et plus cohérent avec l'existant : ajouter une colonne `context_snapshot jsonb` (nullable) sur `journal_entries`, remplie automatiquement à la création avec un résumé figé de ce qui était visible à ce moment (quelles familles étaient `REAL` vs `UNAVAILABLE`, quels événements F13 étaient à venir, éventuellement le dernier `whatChanged` de la Lecture Globale si un run existe). Ça répond à la vraie question de Codex ("dans quels régimes mes décisions étaient-elles bonnes ?") sans dupliquer l'infrastructure Journal.
*Valeur* : élevée — c'est le seul chantier qui transforme vraiment le Journal en outil d'apprentissage plutôt qu'un simple registre. *Risque* : faible, additif, aucune donnée existante touchée. *Dépendances* : aucune (la DB Postgres/holders existe déjà). *Effort* : petit à moyen — une colonne, un appel de lecture du snapshot marché déjà exposé par `/api/market/snapshot`, pas de nouvelle UI complexe.

**P0 — Décider explicitement du sort de `NO_TRADE`/refus tracés.**
*Statut : décision produit à trancher, pas une construction technique.*
Voir point 2.5 et décision 1. Techniquement trivial dans un sens (rouvrir la validation) — la vraie question est produit, pas ingénierie.

##### Discipline et gestion du risque

**P1 — Indicateur de discipline visible dans le Journal (nouveau, pas dans Codex).**
*Statut : manque réellement, idée originale de ce contre-audit.*
Un simple pourcentage "plan respecté" sur les 20 dernières entrées, affiché en tête du Journal (pas un score de conviction, une simple statistique descriptive sur une case déjà cochée à chaque entrée). Zéro nouvelle donnée à collecter — `followed_plan` existe déjà en base.
*Valeur* : moyenne, discipline directement visible sans ouvrir un tableau. *Risque* : très faible (juste un calcul sur des données existantes). *Dépendances* : aucune. *Effort* : petit.

**P2 — Rappel "invalidation" visible pendant qu'un trade est ouvert.**
*Statut : bonne idée, pas prioritaire.*
Puisqu'Exécution reste volontairement un outil informatif (pas d'ordre, pas de broker), pas de raison d'y ajouter un état "position ouverte" — mais une fois qu'un trade est journalisé, afficher son invalidation écrite en évidence tant qu'aucun résultat n'est renseigné serait un filet anti-biais simple. Reste secondaire tant que le lien Exécution↔Journal (P0 ci-dessus) n'existe pas.

##### Lecture macro de l'or

**Ne pas construire — le "Scenario Board" de Codex.**
*Statut : déjà implémenté, plus riche que la proposition.* Voir 2.1. Construire ce que Codex propose reviendrait à dupliquer une fonctionnalité qui existe déjà et qui a un vrai moteur de transition d'état — pure perte de temps.

**P1 — Rendre visibles les `scenarioTransitions` déjà calculées, section par section.**
*Statut : manque réellement, mais très petit par rapport à ce que Codex proposait.*
Le vrai gap identifié en 2.1 : afficher, pour chaque scénario du rapport, sa transition depuis le run précédent (from → to → raison) — la donnée existe déjà en backend (`rebuild.scenarioTransitions`), il ne manque qu'un petit bloc de rendu dans `GlobalReadDecisionReport.tsx`, à côté de chaque `ScenarioCard` existante. Pas une nouvelle fonctionnalité, un rendu manquant d'une donnée déjà calculée.
*Valeur* : moyenne-haute pour peu d'effort — répond directement au besoin réel derrière la proposition Codex. *Risque* : très faible, aucune nouvelle donnée ni nouveau calcul. *Dépendances* : aucune. *Effort* : petit.

**P2 — Étendre `sourceType` (déjà utilisé pour les faits Lecture Globale) aux actualités.**
*Statut : manque réellement, rejoint la proposition Codex "News = preuve, pas flux".*
Réutiliser le modèle `GlobalReadFact.sourceType` (`PRIMARY | SECONDARY | UNOFFICIAL | UNKNOWN`) déjà défini plutôt que d'en inventer un nouveau pour les news — cohérence de vocabulaire dans tout le produit. Le lien news↔famille peut rester manuel dans un premier temps (un simple menu déroulant "famille concernée" à la lecture d'une news), pas besoin d'un moteur de classification automatique.
*Valeur* : moyenne. *Risque* : faible. *Dépendances* : aucune. *Effort* : petit à moyen selon si le lien est manuel (petit) ou semi-auto (moyen).

##### Journalisation et revue post-trade

**P1 — Taxonomie d'erreur structurée, en plus (pas à la place) du champ notes libre.**
*Statut : manque réellement, Codex a raison sur le fond.*
Un seul champ supplémentaire nullable sur `journal_entries` — une liste à cocher parmi thèse / timing / taille / exécution / discipline / aucune — à côté du champ `notes` déjà existant, plutôt que la "revue structurée" plus large que Codex esquisse. Permet déjà les vues "erreurs les plus fréquentes" que Codex demande, sans construire un sous-système de revue séparé.
*Valeur* : moyenne-haute pour un effort minimal. *Risque* : faible. *Dépendances* : aucune. *Effort* : petit.

**P2 — Vue agrégée "R moyen par setup, avec taille d'échantillon".**
*Statut : bonne idée, pas prioritaire tant que le volume d'entrées journalisées est faible.*
Codex a raison de exiger la taille d'échantillon visible pour éviter les conclusions sur 3 trades — mais avec un journal jeune (migration DB du 2026-09-09/10), ça n'a pas encore de valeur réelle. À reprendre une fois qu'il y a un historique significatif.

##### Données, fraîcheur, provenance et événements

**P0 — Corriger `MVP_COCKPIT_CONTRACT.md` (fraîcheur) et `PROVIDER_SETUP.md` (fuseau JBlanked).**
*Statut : erreur documentaire confirmée, pas une construction — mais explicitement demandé par Hachim comme standing instruction ("toujours documenter à jour").* Voir 2.2 et 2.3. Pas de code à toucher, juste corriger les deux documents pour refléter le code réel actuel.
*Valeur* : élevée — évite qu'une future session (Claude, Codex, ou Hachim lui-même) reparte d'une hypothèse fausse sur la fraîcheur ou l'heure des événements. *Risque* : nul, documentation seulement. *Effort* : petit.

**P0 — Rendre le statut d'indisponibilité de F13 visible sur la face cockpit (pas un nouveau panneau Data Readiness complet).**
*Statut : manque réellement, mais le vrai mécanisme existe déjà en backend, mort côté frontend.*
Codex propose un panneau "Data Readiness" complet par famille — plus large que nécessaire dans l'immédiat. Le vrai problème concret, trouvé en vérifiant : `resolveIngestionStatus()` (`NEVER_RUN`/`FAILED`/`OK`/`STALE`) existe déjà côté backend pour F13, exposé par des routes (`/api/calendar/week`, `/api/calendar/day/:date`) qu'aucun composant frontend n'appelle — la vue qui les consommait a été retirée volontairement en septembre pour simplifier l'UI. Résultat : quand JBlanked est bloqué, "Active Catalyst" affiche juste "NONE", indiscernable d'une semaine réellement calme. Le fix minimal : faire lire ce statut déjà calculé par le composant `EventFamilyFace` existant de F13, et afficher un badge "calendrier indisponible" au lieu de "NONE" quand le statut est `FAILED`/`STALE` — pas un nouveau panneau, un branchement d'une donnée déjà là.
*Valeur* : élevée — évite de confondre "aucun événement" avec "on ne sait pas". *Risque* : faible. *Dépendances* : aucune (donnée déjà calculée). *Effort* : petit à moyen.

**P1 — Piste alternative pour F13, non envisagée par Codex : calendrier officiel BLS/BEA/Fed pour les publications américaines récurrentes.**
*Statut : bonne idée, complémentaire à JBlanked, pas un remplacement complet.*
Codex propose 3 options pour F13 (gratuit limité / payant / saisie manuelle). Il en manque une quatrième, gratuite et déjà cohérente avec ce que fait le reste du produit : BLS et BEA publient tous les deux un calendrier officiel de publication plusieurs mois à l'avance (dates connues pour CPI, PCE, NFP), et le Fed publie ses dates FOMC officiellement. Ce sont des sources déjà utilisées ailleurs dans ce projet (providers BLS/BEA/officiels existants) — un scraping léger de leurs pages de calendrier officiel couvrirait le sous-ensemble le plus important (les publications macro US récurrentes et connues à l'avance), sans dépendre de JBlanked ni payer, et avec une source de meilleure qualité (officielle, pas un agrégateur tiers MQL5). JBlanked resterait utile pour les événements moins prévisibles/internationaux, ou en saisie manuelle en dernier recours.
*Valeur* : élevée si F13 reste bloqué — répond à une vraie question laissée ouverte par Codex ("quel niveau de coût acceptable"). *Risque* : moyen — dépend de la stabilité du HTML de ces pages officielles (même limite que le scraping F3 déjà en place pour Investing.com). *Dépendances* : aucune. *Effort* : moyen.

##### Sécurité/confidentialité si multi-utilisateur

**P0 — Confirmé exactement comme Codex le décrit, avec une gravité supérieure.**
Voir tableau section 1. Une seule route protégée sur 21, aucun token envoyé par le frontend, aucune colonne `holder_id`/RLS sur `journal_entries` ni sur les 4 autres tables de persistance. C'est déjà en ligne (Railway, accessible publiquement) — ce n'est pas un risque théorique futur, c'est un état actuel.
*Valeur* : la plus haute de tout ce document — c'est une question de confidentialité des données déjà en production, pas une amélioration produit. *Risque si non traité* : élevé et déjà actif (pas "deviendra un risque si multi-utilisateur" — le backend est déjà exposé publiquement sur Railway aujourd'hui, mono-utilisateur ou non). *Dépendances* : le pattern RLS existe déjà et fonctionne pour `holders` — pas une nouvelle techno à apprendre. *Effort* : moyen (ajouter `holder_id` + RLS à 5 tables, brancher `requireHolder` sur les routes d'écriture au minimum, idéalement toutes).

**Nuance sur l'urgence relative des 5 tables** : `journal_entries` est la seule avec des routes CRUD complètes exposées publiquement sans auth — c'est la priorité absolue. `kpi_observations`/`macro_events`/`ingestion_state`/`global_read_runs` sont des caches de données macro publiques (pas des données personnelles), sans route de lecture brute exposée — leur absence de RLS est un problème de propreté générale, pas une fuite de données privées dans l'immédiat. Ne pas traiter les 5 comme un seul chantier au même niveau d'urgence.

---

#### 4. Désaccords de priorisation avec Codex

- **Alertes de conditions (Codex : P1) → je le classerais P2.** Zéro infrastructure de notification n'existe dans ce produit aujourd'hui (confirmé : `GlobalReadNotifier` est un toast in-app, rien de plus). Construire des alertes fiables (dédup, fenêtre de silence, livraison garantie) est un vrai chantier d'infrastructure, pas une fonctionnalité d'affichage — le classer au même niveau que "Delta depuis ma dernière lecture" (qui, lui, existe déjà à 80%) sous-estime l'écart d'effort réel entre les deux items P1 de Codex.
- **Scenario Board (Codex : P1) → à retirer de la liste, remplacé par "rendre visibles les scenarioTransitions" (P1, effort bien plus petit).** Voir 2.1 et section 3.
- **Sécurité (Codex : P0, "avant toute expansion") → d'accord sur le P0, en désaccord sur le cadrage "avant expansion multi-utilisateur".** Ce n'est pas une précaution pour un futur multi-utilisateur : le backend Railway est déjà en ligne, publiquement accessible, sans aucune protection sur 20 routes sur 21, dès aujourd'hui, mono-utilisateur. Le cadrer comme un prérequis "avant" une décision future minimise l'urgence réelle.

---

#### 5. Ce qu'il ne faut pas construire (confirmation + ajout)

Je suis d'accord avec toute la liste de Codex (pas de broker, pas de score magique, pas de dizaines de nouveaux indicateurs, pas de clone TradingView, pas d'IA qui remplit le journal seule). J'ajoute un point trouvé pendant cette vérification :

- **Ne pas construire un nouveau "Scenario Board"** — voir 2.1 et 4. C'est le cas concret le plus net d'un risque que ce contre-audit devait justement chercher : proposer de reconstruire quelque chose qui existe déjà, plus riche, faute d'avoir vérifié l'existant en profondeur.
- **Ne pas construire un panneau "Data Readiness" complet et générique tout de suite** — le besoin réel immédiat (F13 visible comme indisponible plutôt que silencieusement vide) est beaucoup plus petit et déjà à 90% résolu côté backend ; un panneau générique par famille peut attendre que ce besoin précis soit traité et que sa vraie utilité soit mesurée.

---

#### Résumé — décisions à trancher par le propriétaire

1. **`NO_TRADE` au Journal — garder le retrait du 2026-09-10, ou le réintroduire comme le propose Codex ?** Contradiction directe entre une décision déjà prise à ta demande explicite et une recommandation de cet audit (voir 2.5). Les deux points de vue sont défendables ; c'est un choix produit, pas technique.
2. **Sécurité : à traiter maintenant, avant toute autre fonctionnalité de décision ?** Le backend est déjà en ligne sans protection réelle sur 20 routes/21 — je recommande de le traiter avant le point 3 ci-dessous, pas en parallèle ni après, mais c'est ton arbitrage de priorité.
3. **F13 : accepter JBlanked bloqué (saisie manuelle en attendant), payer, ou investir dans un scraping BLS/BEA/Fed officiel (piste que je propose, pas dans l'audit Codex) ?** Détermine si "Decision Card"/snapshot de contexte (item P0 section 3) capture un calendrier fiable ou un calendrier vide.
4. **"Decision Card" séparée (Codex) ou extension de `journal_entries` (ma proposition, plus petite) ?** Les deux répondent au même besoin ("relier plan et résultat"), avec un écart d'effort et de complexité significatif.
5. **Quel niveau d'investissement pour la Lecture Globale maintenant qu'on sait que le Scenario Board/carte causale existent déjà ?** Le vrai reste-à-faire est petit (afficher les transitions de scénario) — vaut-il la peine de le prioriser, ou le budget doit-il aller ailleurs (sécurité, F13, lien Exécution↔Journal) ?
