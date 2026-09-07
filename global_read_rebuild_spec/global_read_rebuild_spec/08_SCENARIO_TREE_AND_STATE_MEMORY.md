# 08 — ARBRE DE SCÉNARIOS ET MÉMOIRE ENTRE LES TRIGGERS

# 1. Le Global Read ne produit pas seulement un verdict

Il produit un **état vivant**.

Exemple conceptuel :

ROOT — Current regime
|
|-- Scenario A — active / primary
|     |-- Trigger A1 — waiting
|     |-- Trigger A2 — confirmed
|     |-- Invalidation A3 — not triggered
|
|-- Scenario B — alternate
|     |-- Trigger B1 — waiting
|
|-- Scenario C — adverse
      |-- Trigger C1 — waiting

Ce n’est pas une prévision unique.

C’est une carte du monde.

---

# 2. Statuts possibles d’un scénario

Conceptuellement :

- PROPOSED ;
- WATCHING ;
- ACTIVE ;
- STRENGTHENING ;
- WEAKENING ;
- INVALIDATED ;
- SUPERSEDED.

N’utiliser que les statuts réellement utiles.

---

# 3. Chaque scénario doit avoir

- thesis ;
- mechanism ;
- evidence ;
- contradictions ;
- whatIsPriced ;
- whatCouldReprice ;
- triggers ;
- expectedObservations ;
- weakeningConditions ;
- invalidationConditions ;
- flipConditions ;
- nextCatalysts ;
- timestamp ;
- source run.

---

# 4. Le prochain trigger

Lors d’un nouvel appui sur Global Read :

### Étape 1
Lire le dernier état.

### Étape 2
Demander :
**qu’est-ce qui a changé ?**

### Étape 3
Pour chaque scénario :
- trigger atteint ?
- invalidation atteinte ?
- nouvelles données ?
- nouvelle contradiction ?
- catalyst passé ?
- market response conforme ?

### Étape 4
Mettre à jour l’arbre.

### Étape 5
Seulement si nécessaire :
créer une nouvelle branche.

---

# 5. Les « cases vides »

Une branche peut contenir une condition encore non observée.

Exemple :

Scenario A devient actif si :
- CPI below expectation ;
- Fed pricing dovish repricing ;
- USD response confirms.

Tant que non observé :
case « waiting ».

Au prochain trigger :
le moteur vérifie.

---

# 6. Ne pas recréer les scénarios à chaque run

Si rien n’a changé :

le système doit pouvoir dire :

> « Aucun changement matériel. Le scénario principal reste intact. »

C’est mieux que produire une nouvelle dissertation.

---

# 7. Versionner la pensée

Chaque run doit sauvegarder :

- previousRunId ;
- currentRunId ;
- whatChanged ;
- scenarioTransitions ;
- dataChanges ;
- newCatalysts ;
- invalidations ;
- newWebDiscoveries ;
- final tree.

Le trader doit pouvoir revoir l’évolution de la thèse.

---

# 8. Monday-morning use case

Lundi :
aucun biais clair.

Le système crée :

- Scenario A ;
- Scenario B ;
- triggers.

Mardi :
nouvelle donnée.

Le moteur ne repart pas de zéro.

Il demande :
- cette donnée active-t-elle A ?
- invalide-t-elle B ?
- ne change-t-elle rien ?

C’est exactement le comportement recherché.

---

## NEXT

Lire : **`09_BIAS_ASYMMETRY_EXECUTION_LOGIC.md`**
