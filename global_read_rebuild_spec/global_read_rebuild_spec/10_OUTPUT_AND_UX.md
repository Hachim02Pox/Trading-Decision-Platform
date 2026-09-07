# 10 — OUTPUT ET UX

# 1. Principe

Le trader ne veut pas lire un rapport d’audit.

Il veut comprendre.

L’output principal doit être :

- beau ;
- structuré ;
- progressif ;
- pédagogique ;
- vivant ;
- suffisamment profond ;
- sans jargon technique backend inutile.

---

# 2. Ne pas montrer dans la vue principale

Pas :

- JSON ;
- IDs ;
- raw sources ;
- Agent A / Agent B ;
- trace d’outil ;
- hashes ;
- schema ;
- verification internals.

Ces éléments restent dans un Audit Drawer.

---

# 3. Structure proposée

## SECTION 1 — « Où en est le Gold ? »

Une introduction très complète mais lisible :

- ce qui s’est passé ;
- où nous sommes ;
- ce qui drive ;
- ce que le marché surveille ;
- principales tensions ;
- ce qui est déjà pricé ;
- ce qui peut changer.

Pas encore de détail par famille.

---

## SECTION 2 — « Le monde derrière le Gold »

Progressive disclosure.

Chaque famille a une carte :

- Taux ;
- Fed / anticipations ;
- USD / change ;
- Inflation ;
- Emploi / croissance ;
- Risque / crédit / vol ;
- Liquidité / financement ;
- Structurel / demande officielle ;
- Trésor / fiscal ;
- Options / vol ;
- Flux / positionnement.

Chaque carte contient :

- lecture ;
- pourquoi ;
- contradiction ;
- ce qui manque ;
- lien avec Gold.

L’utilisateur peut ouvrir une famille.

---

## SECTION 3 — « Comment tout cela s’assemble »

La synthèse inter-familles :

- convergence ;
- contradictions ;
- driver marginal ;
- background ;
- ce qui est pricé ;
- ce qui ne l’est pas.

C’est la partie « vraie puissance du trader ».

---

## SECTION 4 — « Les questions qui comptent »

Présenter les grandes questions du fichier 06 sous forme lisible.

Pas forcément toutes ouvertes par défaut.

Les plus importantes d’abord.

L’utilisateur peut approfondir.

---

## SECTION 5 — « Le débat »

Pas « Agent A vs Agent B ».

Mais :

### Points solides
Ce sur quoi les deux analyses convergent.

### Débat réel
Ce qui reste disputé.

### Ce qui départagera
Le trigger / data / event.

---

## SECTION 6 — « Scénarios »

Arbre visuel.

### Principal
### Alternative
### Adverse

Pour chacun :

- condition ;
- trigger ;
- ce qui est pricé ;
- ce qui reste ;
- invalidation ;
- status.

---

## SECTION 7 — « Positionnement et asymétrie »

Seulement après la thèse.

- COT ;
- ETF ;
- options ;
- flow ;
- crowding ;
- price response ;
- trap candidate éventuel.

---

## SECTION 8 — « Ce que je ferais maintenant »

Très important.

Pas un ordre d’achat/vente aveugle.

Forme possible :

### CONSIDER SUPPORTIVE SETUPS
ou
### CONSIDER ADVERSE SETUPS
ou
### WAIT FOR TRIGGER
ou
### NO CLEAN EDGE

Puis expliquer :

- pourquoi ;
- dans quelles conditions ;
- prochain risque ;
- ce qui invalide ;
- ce qui flip.

Le trader reste responsable de la zone et de l’exécution.

---

# 4. Progressive reveal

Le rapport peut être interactif :

1. résumé ;
2. bouton « pourquoi ? » ;
3. familles ;
4. scénarios ;
5. positionnement ;
6. audit.

Le trader doit avoir envie de progresser.

---

# 5. Questions possibles à l’utilisateur

Le système peut proposer :

- « Veux-tu voir pourquoi le scénario adverse n’est pas dominant ? »
- « Veux-tu ouvrir la famille Taux ? »
- « Veux-tu voir ce qui ferait basculer la thèse ? »

Mais ne pas rendre l’analyse dépendante d’un dialogue obligatoire.

---

# 6. Update mode

Au prochain trigger, l’UI commence par :

## « Ce qui a changé depuis la dernière lecture »

Puis :

- scenario transition ;
- nouvelles données ;
- nouvelle news ;
- trigger activé ;
- invalidation ;
- nouveau bias.

---

# 7. Audit

Le full audit reste accessible :

- data verification ;
- sources ;
- raw model outputs ;
- debate ;
- rejected claims ;
- timestamps ;
- state transitions.

Mais pas dans la narration principale.

---

## NEXT

Lire : **`11_IMPLEMENTATION_INVARIANTS_AND_TESTS.md`**
