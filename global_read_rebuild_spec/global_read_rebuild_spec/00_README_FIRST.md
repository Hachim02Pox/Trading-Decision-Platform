# GLOBAL READ — READ THIS FIRST
## Nouvelle source d’autorité pour la refonte complète du Récap Global

### Instruction absolue

À partir de maintenant, **considère ce dossier comme la source d’autorité métier du Global Read**.

Ne pars pas de l’ancienne logique du Récap Global pour décider comment le moteur doit raisonner. Tu peux réutiliser l’infrastructure existante — connecteurs, providers, composants UI, persistence, tests, utilitaires — si elle est utile, mais **la logique de raisonnement, l’ordre des étapes, le rôle du web, la confrontation des IA, la construction des scénarios et la sortie finale doivent être évalués à partir de cette documentation**.

Ne préserve pas une ancienne règle simplement parce qu’elle existe déjà dans le code.

Ne supprime pas non plus quelque chose de fonctionnel par réflexe.

La règle est :

> **Comprendre le besoin métier d’abord. Auditer le code ensuite. Réutiliser ce qui sert ce besoin. Remplacer ce qui ne le sert pas.**

---

# 1. Ce que le trader veut réellement

Le trader est un retail / prop-firm trader spécialisé principalement sur Gold.

Il conserve lui-même :

- TradingView ;
- ses supports et résistances ;
- ses zones d’inflexion ;
- son footprint / order flow ;
- son timing d’entrée ;
- son ordre limite éventuel ;
- son stop ;
- sa taille ;
- sa gestion du risque.

Le Global Read n’a donc pas pour mission de fabriquer un setup technique.

Il doit faire ce que le trader humain ne veut plus refaire manuellement à chaque fois :

1. rassembler énormément d’informations ;
2. vérifier qu’elles sont vraies ;
3. les interpréter séparément ;
4. comprendre comment elles interagissent ;
5. résoudre les contradictions ;
6. chercher ce qui manque ;
7. construire des scénarios ;
8. déterminer ce qui est déjà pricé ;
9. identifier ce qui peut encore être repricé ;
10. analyser l’asymétrie ;
11. expliquer ce qui invalide la lecture ;
12. mettre à jour cette lecture au fil du temps.

L’objectif final est de répondre à une question simple :

> **Si mon propre setup technique apparaît près de ma zone, le contexte macro/fondamental/mécanique actuel me donne-t-il une raison suffisamment forte de considérer ce trade, ou est-ce que je dois m’abstenir / attendre ?**

---

# 2. Le mot « edge »

Le but est réellement de construire un **avantage**.

Pas un edge magique parce qu’un LLM est puissant.

L’avantage recherché peut venir de plusieurs endroits :

- meilleure vérification des données ;
- plus grande largeur d’information ;
- meilleure hiérarchisation ;
- meilleure compréhension des interactions ;
- meilleure détection de ce qui est pricé ;
- meilleure détection d’un repricing potentiel ;
- meilleure lecture du positionnement ;
- meilleure compréhension du timing ;
- meilleure capacité à ne pas trader ;
- meilleure vitesse d’analyse ;
- meilleure mémoire entre deux analyses ;
- meilleure discipline que le cerveau humain sous émotion.

Le système ne doit jamais confondre :

**analyse sophistiquée**  
avec  
**edge réel**.

Une analyse très longue mais construite sur de mauvaises données n’a aucune valeur.

Une analyse très élégante qui ne distingue pas ce qui est déjà pricé n’a presque aucune valeur.

Une analyse correcte reçue trop tard n’a peut-être plus de valeur.

---

# 3. Le système n’est pas un compteur de facteurs

Interdit de raisonner :

- 7 facteurs bullish ;
- 4 facteurs bearish ;
- donc bullish.

Les familles ne sont pas indépendantes.

Exemple :

Fed pricing → 2Y → DXY → Gold

peut être une seule chaîne causale, pas quatre votes.

La vraie puissance recherchée est :

> **comprendre quelle logique domine aujourd’hui, quelles autres logiques la renforcent ou la contredisent, pourquoi elles divergent, et dans quelles conditions le rapport de force change.**

---

# 4. Ce dossier est séquentiel

Lis tous les documents dans l’ordre avant de coder.

Ordre :

1. `00_README_FIRST.md`
2. `01_VISION_AND_INVARIANTS.md`
3. `02_DATA_VERIFICATION_PROTOCOL.md`
4. `03_FAMILY_MAP_AND_ROLES.md`
5. `04_FAMILY_ANALYSIS_FRAMEWORK.md`
6. `05_WEB_RESEARCH_PROTOCOL.md`
7. `06_FINAL_QUESTIONS_FRAMEWORK.md`
8. `07_TWO_AI_DEBATE_PROTOCOL.md`
9. `08_SCENARIO_TREE_AND_STATE_MEMORY.md`
10. `09_BIAS_ASYMMETRY_EXECUTION_LOGIC.md`
11. `10_OUTPUT_AND_UX.md`
12. `11_IMPLEMENTATION_INVARIANTS_AND_TESTS.md`
13. `12_IMPLEMENTATION_MANDATE.md`

**Ne code pas avant d’avoir lu les 13 documents.**

---

## NEXT

Lire maintenant : **`01_VISION_AND_INVARIANTS.md`**
