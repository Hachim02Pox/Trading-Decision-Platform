# HT Terminal — Histoire du marché

## Contrat et périmètre

Mission et références consommées dans `Hachim02Pox/gold-market-story-brain`, exclusivement au commit `da8eb64959b6c026128bde254c8d1703e419f19c`. Base terminal : `814dc7646499953b2f53faf97bb93e3bf97b9c87`. Les schémas exacts et les outils sémantiques Brain sont embarqués; leur provenance et leurs empreintes sont dans `apps/backend/src/goldMarketState/brain/README.md`.

Le backend valide le canonique v6, l'extension pédagogique 1.0, les références, dates, graphes, répétitions et la parité Markdown/hash. Il conserve le JSON original et expose une projection publique explicite, sans preuves d'audit, liens de sources ni identifiants techniques dans la narration. Une version pédagogique inconnue conserve une lecture canonique validée et une limite explicite; une archive sans extension conserve le lecteur précédent. Aucun filtre économique n'est recalculé par le frontend et aucune migration DB n'est nécessaire.

La page existante `/sunday-read` propose les cinq onglets : La lecture, Ce qui a changé, Arbre de scénarios, Les forces en jeu, Comprendre. La timeline utilise history/by-run; l'onglet et la profondeur restent sélectionnés lors d'un changement de run. Les mécanismes, liens causaux, puzzle et ses relations, contradictions, limites, décisions, familles/questions, concepts, leçons, calendrier et chronologie proviennent des textes validés. Les dates des faits, génération, ingestion et consultation sont distinctes; une date absente reste indisponible.

Le graphe historique conserve son layout et ses connecteurs. Son adaptateur reproduit uniquement la topologie v6, avec des hypothèses conditionnelles neutres. Chaque nœud ouvre son contenu canonique complet, son explication et ses relations; zoom, déplacement et inspection fonctionnent au clavier et sur mobile. La composition suit la référence HTML épinglée, avec les tokens sombres du terminal et une exception locale HT Terminal documentée dans DESIGN.md.

## Publication et ingestion

Les quatre artefacts Output doivent correspondre au reçu scellé Control. Les empreintes JSON canoniques et les empreintes des octets du rapport sont distinguées. Le snapshot de handoff consommé est retrouvé par identité/version/hash exacts dans Control; le handoff courant renouvelé ne remplace pas le snapshot historique. Un reçu ou snapshot manquant/ambigu bloque la publication. Les parents sont traités avant tous leurs enfants, sans plafond arbitraire d'intermédiaires; les anciens rejets concernés sont revalidés de façon ciblée.

Les deux workflows réveillent le même `/internal/gold/refresh`. La vieille exception du 14 septembre est retirée; la fenêtre dominicale reste. `workflow_dispatch` n'hérite pas du run du vieux trigger. Aucun trigger de publication, planning Work, état du dispatcher ou fichier Drive n'a été modifié par cette livraison. Le refresh importe des publications; il ne produit pas une analyse. Voir `runtime/README.md` et `GOLD_V3_INTERMEDIATE_RECAP_INTEGRATION.md` pour les droits Control et la procédure.

## Limite explicite des contrôles manuels

Le commit Brain fourni définit le protocole et le schéma du **plan**, mais ne fournit pas un schéma normatif suffisamment vérifiable pour `GOLD_MANUAL_THESIS_CHECK_RESULT` et son contenu historique 1.0. La voie de lecture des résultats manuels est donc bloquée à cette frontière, conformément à la mission. Aucun plan ou `GOLD_EDGE_CHECK_RESULT` n'est présenté comme résultat; aucun contrôle n'entre dans current, Output ou la filiation officielle. Pour débloquer : fournir le contrat résultat versionné, ses fixtures valides/historiques et l'accès en lecture de l'identité backend à `Control/manual_checks`, puis implémenter une route distincte avec héritage/source et couverture revérifiée explicites. Aucun bouton d'analyse n'est ajouté.

## Vérifications reproductibles

- `npm test` : 397 tests, 394 réussis, zéro échec, trois ignorés faute de base PostgreSQL locale.
- Reproductibilité CI : ancienne archive Brain `a633809` rematérialisée et vérifiée (80 fichiers), puis même suite complète réussie. Les tests du contrat courant utilisent les fixtures suivies de `tests/fixtures/control`, indépendamment de toute extraction locale.
- `npm run typecheck` : backend, frontend et contrats. Build frontend vérifié séparément du serveur dev.
- Couverture ciblée des nouveaux modules learning/Control/adaptateur : 96,29 % lignes, 89,74 % branches, 94,32 % fonctions. Ce chiffre n'est pas une mesure globale du dépôt.
- Tests de schémas/semantique, Markdown, whitelist publique, archives/version inconnue, scellement, snapshots, ordre parent-enfant et rendu échappé. Les tests RED ont été observés avant intégration.
- `node scripts/verifyHtLearning.mjs` : cinq onglets aux largeurs 360/768/1024/1440, contenu détaillé, 32 questions, six jugements, mécanismes/puzzle/concepts/leçons, tous les nœuds au clavier, navigation timeline avec conservation des choix, archives et version inconnue. Résultats et captures : `verification/ht-market-story/`. La référence a été ouverte et comparée dans le navigateur.
- Audit production : zéro vulnérabilité élevée/critique; deux modérées transitives ExcelJS/uuid restent, dont la correction proposée impose une rétrogradation incompatible. Aucun script lint n'est configuré; `git diff --check` et revue effectués.

Pour reproduire le navigateur, lancer `node --import tsx scripts/htLearningFixtureServer.ts` (API de fixtures, boucle locale :4102), puis le frontend sur :3100 avec `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4102` et une configuration Supabase de développement sans secret réel. Le vérificateur refuse une URL externe. Ces fixtures restent FIXTURE : aucune écriture DB/Drive ou publication de marché. Arrêter Next dev avant un build pour éviter le partage concurrent de `.next`.

## Preuve de production et limite

Lecture seule avant livraison : backend Railway healthy; current/history renvoient le Sunday réel `gold-sunday-2026-09-27-editorial-v6-01`, cutoff `2026-09-27T18:57:35.740939Z`, format 6.0, sans extension pédagogique; huit entrées historiques. Cela atteste l'ancien état publié, pas l'ingestion enrichie ni le déploiement de ce commit. Aucun refresh réel ni changement de credentials n'a été effectué. La preuve locale n'est pas une preuve live.

Après déploiement, vérifier le SHA livré et les droits Control de l'identité Railway, puis utiliser un run réel déjà scellé autorisé : dispatch de `gold-state-refresh.yml` avec son `expected_run_id`, vérifier la sélection et le contenu current/history/by-run et le rendu Vercel. Un HTTP 200 seul ne suffit pas. Une archive sans extension restera volontairement dans l'ancien lecteur.
