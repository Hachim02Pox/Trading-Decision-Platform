# 07 — PROTOCOLE DE DEUX IA ET CONFRONTATION

Le but de deux IA n’est pas de faire un vote.

Le but est d’obtenir deux raisonnements indépendants puis de confronter leurs différences.

---

# 1. Étape A — indépendance

Chaque IA reçoit :

- mêmes données vérifiées ;
- même famille map ;
- même framework ;
- mêmes contraintes ;
- accès web selon le protocole.

Elle ne voit pas l’autre.

Elle produit :

- analyse familles ;
- première thèse ;
- exploration web ;
- réponses aux questions finales ;
- scénarios ;
- invalidation ;
- flip ;
- asymétrie.

---

# 2. Étape B — confrontation question par question

Après que les deux aient fini, les réponses sont alignées par question.

Pour chaque question :

IA A voit réponse B.

IA B voit réponse A.

Chacune doit répondre :

### ACCEPT
Je considère que l’autre apporte un point qui améliore ma lecture.

### CONTEST
Je pense que l’autre a tort pour telles raisons précises.

### UNRESOLVED
Les preuves ne permettent pas de trancher.

Et surtout :

**quelle preuve me ferait changer d’avis ?**

---

# 3. Interdire la capitulation sociale

Une IA ne doit jamais changer d’avis parce que :

- l’autre paraît plus confiante ;
- l’autre utilise une meilleure prose ;
- l’autre est « Codex » ou « Claude » ;
- l’autre a plus d’arguments en nombre.

Un changement de position doit être motivé par :

- donnée meilleure ;
- source meilleure ;
- raisonnement causal supérieur ;
- contradiction détectée ;
- meilleur timing ;
- meilleure définition.

---

# 4. Interdire aussi l’entêtement artificiel

Une IA ne doit pas défendre sa position par ego.

Si son prémisse est invalidée :
elle doit l’abandonner.

Le protocole doit encourager :

> « Voici exactement pourquoi ma première lecture était fausse. »

C’est une victoire, pas un échec.

---

# 5. Nombre de tours

Éviter un chat infini.

Structure recommandée :

### Tour 1
Réponses indépendantes.

### Tour 2
Cross-examination question par question.

### Tour 3
Une seule réplique si le désaccord est matériel.

Puis :
STOP.

Si désaccord persiste :
le garder.

---

# 6. Ne jamais forcer un consensus

Si A et B restent en désaccord avec des preuves valides :

le rapport final doit montrer :

- scénario A ;
- scénario B ;
- point précis de divergence ;
- trigger qui départagera.

Le trader préfère deux scénarios honnêtes à une synthèse fausse.

---

# 7. Résolution

Après confrontation :

### CONVERGED
Les deux raisonnements se rejoignent.

### PARTIALLY_CONVERGED
Même direction / scénario principal, mais mécanisme secondaire différent.

### UNRESOLVED
Désaccord matériel.

### ONE_SIDE_INVALIDATED
Une lecture s’effondre après vérification.

---

# 8. Le système final ne doit pas montrer « Agent A / Agent B »

L’UI humaine montre :

- consensus ;
- débat ;
- divergence ;
- conditions.

Les noms d’agents restent dans l’audit.

---

# 9. Dernière exploration web après confrontation

Une passe finale vérifie :

- breaking changes ;
- info oubliée ;
- objection nouvelle ;
- next catalysts ;
- fresh expectations ;
- nouveaux triggers.

Si elle ajoute une information matérielle :
mettre à jour les scénarios.

Sinon :
ne pas rouvrir artificiellement le débat.

---

## NEXT

Lire : **`08_SCENARIO_TREE_AND_STATE_MEMORY.md`**
