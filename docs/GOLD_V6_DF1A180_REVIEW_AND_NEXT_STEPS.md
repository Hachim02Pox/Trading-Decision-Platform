# Revue de df1a180 et consigne de clôture v6

Revue du 29 septembre 2026 UTC (nuit du 28 à New York).
Base vérifiée : `df1a1804de4251f40688915f0e34463d76052860`, main au moment de
la revue. Contrat Brain : `a633809fed6af805da2634edbf01586935004145`, déjà
fourni dans `gold-sunday-read/brain-v6/reference-bundle.zip`.

**État : intégration partielle, non prête pour une reprise du dispatcher.**
Les changements de CLOSED et de sérialisation canonique sont présents dans le
commit. L'accès réel du compte backend à Control reste à vérifier. Toutefois,
les éléments manquants ne sont pas uniquement des opérations de déploiement :
le validateur, le scellement avant publication, l'API et le lecteur demandent
encore du code et des tests.

## 1. Admission v6 insuffisante — reproduit

`apps/backend/src/goldMarketState/v6.ts` ne charge ni le schéma canonique ni les
règles de `editorialProblems`. Il vérifie surtout la présence des clés et
quelques identités. Sur une copie de `FIXTURE_editorial_sunday.json` :

| Modification isolée | Erreurs Platform | Schéma Brain |
|---|---:|---|
| Aucune, cas de référence | 0 | Valide |
| opening_thesis = null et decision_panel = null | 0 | Rejeté |
| six_judgments = Array(6).fill(null) | 0 | Rejeté |
| scenario_tree = {nodes: [], edges: []} | 0 | Rejeté |
| sources = [], research_audit = {}, procedural_audit = {} | 0 | Rejeté |

Les fonctions pures du fichier TS exact de df1a180 ont été exécutées sous Node
24.19 avec stripTypeScriptTypes, et comparées au schéma Brain via Ajv 2020 et
ajv-formats. Aucune DB ni requête Drive n'a été utilisée. Ces essais testent
l'admission structurelle : les fixtures restent FIXTURE et n'ont pas été
publiées. Certains objets admis feraient échouer les accès `.map()` du lecteur.

**À faire :** appliquer d'abord le schéma strict canonique, puis les règles
sémantiques Brain sur un document structurellement valide, avec le vrai parent
pour un intermédiaire. Ne pas appeler les règles sur un objet malformé sans
gestion d'erreur. Intégrer ces ressources dans les artefacts réellement livrés
du backend, avec chemins corrects après compilation ; ne pas dépendre d'une
extraction manuelle locale absente du build Railway. Tester les règles de
preuves, filtres Futures/CFD, cycle, dates, identité des jugements, scénarios,
continuité, parité Markdown et aperçu, pas seulement quelques clés racine.

## 2. Control et publication — code manquant

`ingestion/driveClient.ts` liste seulement Output. `ingest.ts` peut publier un
v6 après les contrôles locaux, sans rechercher son reçu dans Control/run_records
ni vérifier le handoff scellé. L'absence d'accès Control ne doit pas équivaloir
à une permission de publier un v6 sans preuve.

Implémenter un lecteur Control en lecture seule avec la même identité backend,
configuration validée, pagination et dépendances injectables. Tester hors ligne
avec des doubles de Drive/DB. Une preuve d'accès live manque éventuellement,
mais elle n'empêche pas d'écrire et de tester ce code.

Identités à conserver :

- Output : `1otzXd6sEBAaMn_dh-DmMxoiszs4_7aVm`.
- Control : `1cfLw7eK4pnw33P_K4PIq6IgWgXgua8Ot`.
- run_records : `1T881GeH72cVhoz3R0xi50KpfaBVYzt_Y`.
- NEXT_GOLD_RECAP stable : `1vjvIgPV7umsbaCiuUdyxu6R980zg_dsU`.
- Reçu historique Sunday : `1YSbjdmbNX2R8W_Yr3o6prwQ1OEmvoe41`.
- Run Sunday : `gold-sunday-2026-09-27-editorial-v6-01`.

Valider le schéma du reçu, son identité, ses phases, les quatre rôles de
livrables, leurs identités/hashes selon le contrat, l'état scellé et le handoff
exact. Pour un intermédiaire : parent publié et scellé, index/cutoffs, handoff
consommé avec ID/version/hash, non-réutilisation et nouveau handoff. Tenir compte
du renouvellement du fichier NEXT_GOLD_RECAP : sa version actuelle ne remplace
pas silencieusement la version historique scellée ou consommée. Si une preuve
nécessaire n'est pas disponible, retourner un diagnostic explicite et ne pas
publier. Ne pas inventer l'historique manquant.

Le contrôle s'applique aussi aux chemins de reprise d'une ligne VALID, de
revalidation REJECTED et au second endpoint d'ingestion du dimanche. Ne pas
modifier aveuglément les lignes PUBLISHED historiques ; documenter leur
traitement et le résultat de leur audit sans réécrire le passé.

Attention : `goldMarketState/store.ts` relance l'ingestion lors d'un GET
current/history avec cache expiré. « Aucun refresh manuel » ne signifie donc
pas « aucune ingestion ». Les gardes de publication doivent protéger tous les
points d'entrée, pas seulement l'Action. Aucun GET current/history ni refresh
n'a été lancé pendant cette revue.

## 3. API et complétude — pas de projection effective

`store.ts:toEnvelope()` renvoie encore `row.jsonPayload` entier, typé FinalRead.
Les routes transmettent ce contenu. Un type TypeScript décrit comme whitelist
dans le frontend n'enlève aucun champ à l'exécution. `presentation.ts` renvoie
encore presentation_complete=true lorsque presentation.version n'est ni 3 ni 4,
ce qui inclut v6 sans contrôle de sa complétude.

Implémenter une union typée et une projection publique réelle, en conservant
les métadonnées nécessaires et les liens internes de l'arbre. Conserver l'audit
intégral dans le stockage adapté sans l'inclure dans le récit public. Tester
current, history, by-run et presentationCompleteness pour v6, ainsi que legacy.
Écrire un test qui injecte des sentinelles dans audit/sources/IDs techniques et
vérifie les propriétés réellement sérialisées/rendues, pas une simple recherche
de mots dans le fichier TSX.

## 4. Lecteur encore incomplet

Constats sur `V6EditorialReader.tsx`, comparés à readerSections et au prompt Brain :

- Les nœuds sont une liste plate. parent_id n'est pas utilisé pour représenter
  la hiérarchie ; les arêtes affichent « Transition de scénario » sans relier
  les titres source/destination. Les IDs ne servent qu'aux clés React.
- Horizons complets, weekly_bridge, glossary_fr et explications des observations
  manquantes (obstacle, conséquence, prochaine récupération) ne sont pas rendus.
- Le calendrier omet l'heure/date `at` et l'attente `expected` ; les questions
  omettent checked_at. Des codes bruts de statut/direction apparaissent.
- scheduled_expiry et earlier_expiry ne sont pas exploités pour distinguer une
  conclusion historique d'une validité actuelle. Le bandeau de page utilise
  generated_at, qui peut être la date de migration, plutôt que le cutoff marché.
- La branche v6 de page.tsx ne représente explicitement que SCHEDULED/CLOSED
  pour le prochain récap et ne vérifie pas son rattachement à l'état affiché.

Terminer la topologie accessible (clavier, mobile, textes longs) avec titres
lisibles et détails des nœuds/arêtes ; garder les IDs dans le modèle. Assurer la
parité de contenu avec readerSections/Markdown officiel, en détail progressif.
Même profondeur Sunday/intermédiaire, avec « Depuis le dernier récap » en entrée
et tout le contexte accessible. Présenter cutoff, horizon et expiration sans
inventer un nouveau biais lorsque le temps passe. Préserver tous les statuts du
handoff, son parent et le délai de confirmation, sans fausse date annoncée.

## 5. CI en échec et reproductibilité

La [CI de df1a180](https://github.com/Hachim02Pox/Trading-Decision-Platform/actions/runs/36516708199)
est **completed/failure**. Le job confirme : installation et typecheck réussis,
étape Test échouée, Production build ignoré. Les 12 tests ciblés et le build
local annoncés dans le compte rendu ne démontrent pas une CI complète verte.
Les journaux détaillés/annotations n'étaient pas accessibles par l'outil utilisé
pour cette revue : ne pas attribuer tous les échecs à une cause unique sans logs.

Un défaut reproductible de checkout propre est néanmoins visible :
`tests/gold-market-state-v6.test.ts` lit les fixtures sous
`gold-sunday-read/brain-v6/reference/`, dossier ignoré par Git. La CI ne lance
pas materialize.py avant npm test. Rendre l'extraction vérifiée reproductible
avant les tests (ou livrer explicitement les ressources de test nécessaires),
et aligner Node sur engines >=22 au lieu du Node 20 actuellement configuré.
Ne pas faire dépendre le backend de production d'un dossier généré seulement
sur le poste local de Codex.

Les deux tests UI ajoutés inspectent du texte source avec des expressions
régulières. Ils ne prouvent ni le rendu ni la complétude. Les remplacer/compléter
par des tests des sorties réelles : cas Sunday, intermédiaire, arbre, contenu
manquant, échéance, sentinelles d'audit, tous statuts next-recap. Ajouter des
tests d'ingestion avec doubles Drive/DB, parent et enfant dans le même lot,
reçus absents/invalides, handoff renouvelé, rejeu, hash identique REJECTED.

## Prompt de reprise

Tu reprends **Trading-Decision-Platform**, après df1a180 et ce rapport. Lis
AGENTS.md, AI_WORKFLOW.md et les instructions applicables. Inspecte status/diff
et préserve le travail existant. Lis ce rapport, le README du kit, matérialise
les références, puis relis le prompt Brain complet :
`gold-sunday-read/brain-v6/reference/brain/docs/CODEX_PLATFORM_V6_INTEGRATION.md`.

Termine les points 1 à 5 ci-dessus en code et en tests. Le manque d'accès live
à Control n'empêche pas l'implémentation testable du lecteur, du scellement et
des refus de publication. Ne présente plus ce manque comme l'unique reste à
faire. Ne pas réécrire les analyses marché ni les schémas pour rendre les tests
verts. Ne pas republier les snapshots historiques du kit.

Vérifie sur checkout propre la matérialisation, la suite Brain, les tests
Platform pertinents et complets, les typechecks et le build. Les tests DB
ignorés doivent être signalés et compensés par des tests déterministes utiles
pour les nouveaux chemins ; ne pas annoncer une intégration testée sur DB si
elle ne l'a pas été. Vérifie la CI après commit/push.

Pour la preuve de déploiement, lire d'abord docs/AUTH_SUPABASE.md. Utilise les
métadonnées de déploiement disponibles ou expose une version non sensible et
fiable issue du build, côté backend et frontend. Un HTTP 200 ne suffit pas.
Quand l'accès à l'identité backend est disponible, vérifier la lecture effective
de Control/run_records et des artefacts exacts, sans afficher les secrets.

Garder le dispatcher en pause et ne pas déclencher le refresh tant que ces
gardes, tests et preuves de version ne sont pas réunis. Puis exécuter le circuit
existant autorisé, vérifier la lignée réellement sélectionnée et le rendu.
Rapporter précisément ce qui est implémenté, testé, déployé, ingéré, affiché et
activé. Toute étape inaccessible reste explicitement non attestée.

Cette revue livre des constats et une consigne ; elle ne corrige pas elle-même
le runtime. Aucun secret, variable Railway, fichier Drive ou automation n'a
été modifié. Aucun état live d'ingestion ou de déploiement n'est affirmé ici.
