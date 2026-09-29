# Codex : terminer l'intégration v6 après 9f955cd

Tu travailles dans **Hachim02Pox/Trading-Decision-Platform**. Le compte rendu
précédent était partiel. Les contrats qui manquaient sont maintenant fournis
dans `gold-sunday-read/brain-v6/`. Termine l'implémentation, les vérifications,
la documentation et le commit/push autorisés. Préserve les changements utiles
de `9f955cd` et tout travail préexistant.

## 1. Préparer et lire

Inspecte git status/diff et lis AGENTS.md, AI_WORKFLOW.md, DESIGN.md pour le
frontend, docs/AUTH_SUPABASE.md pour toute intervention auth/déploiement.
Matérialise le kit avec la commande du README, puis lis intégralement :

- `reference/brain/README.md` et sa chaîne de documents obligatoires ;
- `reference/brain/docs/CODEX_PLATFORM_V6_INTEGRATION.md` : **mission complète** ;
- `reference/brain/specs/GOLD_DRIVE_MIGRATION_2026-09-28.md` ;
- les schémas, validateurs et tests référencés.

Ces chemins sont relatifs à `gold-sunday-read/brain-v6/`. Le prompt complet
initial mentionne Platform `51ad9b3` comme ancien snapshot ; ta base examinée
est désormais `9f955cd`, ou le main plus récent réellement présent. Les
copies historiques V3/V5 ailleurs dans Platform ne supplantent pas Brain v6.

## 2. Deux défauts confirmés dans 9f955cd

### CLOSED : mauvais discriminateur

`apps/backend/src/goldNextRecap/service.ts` lit `expiry.status === "CLOSED"`
dans `valid()` et `deriveNextRecap()`. Le contrat Brain actif utilise
**`handoff_status: "CLOSED"` à la racine**, avec **`next_execution: null`**.
Le test ajouté dans `tests/gold-next-recap.test.ts` fabrique le mauvais champ
expiry.status ; son succès ne prouve donc pas la compatibilité canonique.

Reproduction isolée du code de ce commit : une copie du handoff canonique
avec handoff_status CLOSED et next_execution null retourne **INVALID**.
Résultat requis pour un handoff CLOSED valide : **CLOSED**, sans prochaine date.
Lis les contraintes exactes du schéma et les cas de clôture dans les tests
Brain, puis ajoute un vrai cas canonique valide et les cas invalides utiles.
Préserve les autres statuts et la compatibilité historique prévue.

### Hash canonique : ordre des clés numériques

`apps/backend/src/goldNextRecap/canonicalJson.ts` trie puis reconstruit un objet
avec Object.fromEntries avant JSON.stringify. JavaScript réordonne alors les
clés entières. Sur `{"2":"two","10":"ten","a":1}`, le hash diffère de Brain.
Sur un objet à clés ordinaires, il coïncide : cela explique pourquoi les tests
actuels peuvent passer.

Adopte la sérialisation récursive **directe** du contrat Brain dans
`tools/procedural-audit.mjs` (fonction canonicalJson), sans reconstruire un
objet intermédiaire trié. Vérifie l'emplacement exact dans le snapshot.
Teste les clés numériques, les objets imbriqués, les tableaux, l'ordre des clés
et le scellement d'un artefact canonique fourni. Distingue toujours hash des
octets Drive, hash canonique JSON et hash éventuel de transport historique.
N'affaiblis pas la validation des reçus v6 pour accepter un hash incorrect.

Ces résultats viennent d'un harnais isolant les fonctions pures du code
9f955cd, sans DB ni réseau. Ils ne remplacent pas les tests d'intégration.

## 3. Achever la mission complète, pas seulement next-recap

Applique toutes les sections du prompt complet. En particulier :

- Discrimination v6 par les champs racine canoniques, validation avec les
  schémas et règles métier Brain ; compatibilité V3/V5 explicite. Pas de
  coercition silencieuse en ancien format ni d'ajout fictif à meta.
- Validation des reçus Control et des liens state/handoff/receipt, hashes,
  identités, versions et lignée. Un JSON seul ne prouve pas une livraison scellée.
- Revalidation des anciens REJECTED après évolution du validateur, même si
  le hash du fichier n'a pas changé ; idempotence conservée.
- Traitement des parents avant les enfants dans un même lot, indépendamment
  de l'ordre de découverte Drive ; cas d'échec explicites.
- API/reader/frontend français pour les six jugements, toutes les familles,
  les preuves/limites et l'arbre complet avec les vrais champs Brain.
  Le récap intermédiaire conserve la lecture complète du Sunday et ajoute
  une entrée par les changements/evolution_review. Ne pas réduire sa sortie
  à un diff qui ferait disparaître le contexte ou l'arbre de scénarios.
- Respect des cutoffs historiques : une migration ou un téléchargement
  récent ne rend pas les données marché récentes.
- Vérification des deux workflows réellement présents dans ce dépôt :
  gold-state-refresh.yml et sunday-read-ingest.yml, de leurs endpoints et de
  leur coexistence. L'Action lance une ingestion ; elle ne réveille pas Work.

Ne pas développer le bouton manuel, le module options/GEX ou une nouvelle
analyse marché dans cette mission. Ne pas déplacer à nouveau les fichiers Drive.

## 4. Identités et état observé

Les quatre fichiers officiels sont déjà dans Output. Les noms et tous les IDs
figurent dans le prompt complet et le manifeste ; les conserver.

| Usage | Identité stable |
|---|---|
| Output | `1otzXd6sEBAaMn_dh-DmMxoiszs4_7aVm` |
| Control | `1cfLw7eK4pnw33P_K4PIq6IgWgXgua8Ot` |
| NEXT_GOLD_RECAP.json actif | `1vjvIgPV7umsbaCiuUdyxu6R980zg_dsU` |
| Control/run_records | `1T881GeH72cVhoz3R0xi50KpfaBVYzt_Y` |
| Sunday migré | `gold-sunday-2026-09-27-editorial-v6-01` |

L'ancien ID `1kz-OvJ-8lYlV1Z6zOo5Q8wsIWq0Qm1uM` désigne le handoff retiré
et annulé ; ne pas l'utiliser en fallback. Une variable Railway explicitement
définie prime sur la valeur par défaut du code : contrôler sa configuration
sans imprimer les secrets, si l'accès est disponible.

Observation en lecture seule le **2026-09-29 à 03:01:41.881Z** :
`https://backend-production-470b.up.railway.app/api/gold/next-recap`
répond HTTP 200, **SCHEDULED**, requested_at `2026-09-29T11:30:00-04:00`,
parent_state_run_id `gold-sunday-2026-09-27-editorial-v6-01`.
Le précédent constat CANCELLED n'est donc plus actuel à cet instant. Ce GET
ne prouve ni le SHA déployé ni la bonne ingestion/présentation complète v6.
Recontrôler l'état courant au moment de la reprise ; ne pas figer ce statut.

Le dispatcher Work `6aab3e6089388191a39eee49ea959fc3` était **en pause** lors
de la dernière vérification des automations, pendant la migration. Il reste
à contrôler avant toute activation. Son horaire est distinct des GitHub Actions.

## 5. Critères de sortie et déploiement

Exécute la suite Brain et valide ensemble l'état livré, le handoff et le reçu
hors ligne avec les commandes du README. Ajoute les tests Platform qui prouvent
les points ci-dessus, puis exécute les tests pertinents et les typechecks
backend/frontend. Rapporte les commandes exactes et leurs résultats.

Ne pas annoncer « v6 intégré » sur la seule base de six tests next-recap ou
d'un HTTP 200. Vérifier le chemin complet découverte → validation → DB → API
→ rendu, avec parent/enfant, reçu invalide, ancien rejet et compatibilité.

Après implémentation et tests, commit et push. Vérifie le déploiement effectif
par une preuve de version si disponible. Ne déclenche pas le refresh Drive ni
la reprise du dispatcher avant que le chemin v6 soit validé et la version
déployée vérifiable. Si les outils d'accès manquent, termine tout le code et
fournis la procédure exacte restante, sans prétendre l'avoir exécutée.

Le refresh autorisé, une fois ces critères satisfaits, utilise le circuit
existant décrit dans le prompt complet, sans nouveau secret. Vérifie le run
retourné et les endpoints de lecture ; l'activation Work doit être explicitement
vérifiée via son outil disponible et ne doit pas créer de doublon.

Livraison attendue : changements réellement implémentés, commits, validations,
preuves live datées, état précis des workflows/dispatcher et limites restantes.
