# 01 — VISION ET INVARIANTS

# 1. Le Global Read doit être un moteur de raisonnement, pas un chatbot

Le moteur ne doit pas chercher « la réponse qui a l’air bonne ».

Il doit chercher :

> **la représentation la plus robuste du monde compte tenu des preuves disponibles.**

Il doit être capable de dire :

- je sais ;
- je pense ;
- je suppose ;
- je ne sais pas ;
- deux lectures restent possibles ;
- telle information ferait basculer la lecture.

L’incertitude est une information.

Elle ne doit jamais être masquée.

---

# 2. Les quatre niveaux à ne jamais mélanger

Chaque élément doit appartenir à un niveau clair :

### FACT
Ce qui est observé et vérifié.

Exemple :
- Core PCE officiel = X ;
- unemployment officiel = Y ;
- 2Y à telle valeur à tel timestamp ;
- CFTC managed money net % OI = Z.

### INTERPRETATION
Ce que ce fait signifie dans son contexte.

Exemple :
- inflation reste collante ;
- front-end reste compatible avec une Fed restrictive.

### MECHANISM / HYPOTHESIS
La chaîne causale proposée.

Exemple :
- inflation collante → policy path plus restrictive → real rates / USD → pression Gold.

### DECISION / THESIS
Ce que l’ensemble implique pour le contexte de trading.

Ces quatre couches doivent rester visibles dans le modèle de données, même si l’UI simplifie leur présentation.

---

# 3. Le Global Read doit être stateful

Un clic ne doit pas toujours recréer un monde neuf.

Il existe deux modes conceptuels :

### FIRST READ
Aucun état antérieur exploitable.

Le moteur construit la carte initiale.

### UPDATE READ
Un Global Read précédent existe.

La première question devient :

> **Qu’est-ce qui a changé depuis la dernière lecture ?**

Le système doit relire :

- scénario précédent ;
- thèse précédente ;
- hypothèses ouvertes ;
- déclencheurs attendus ;
- invalidations ;
- prochains catalysts ;
- données qui manquaient.

Puis déterminer :

- rien de matériel n’a changé ;
- un scénario a été activé ;
- un scénario a été invalidé ;
- une branche nouvelle apparaît ;
- le régime a changé ;
- la thèse a changé ;
- l’asymétrie s’est améliorée ou détériorée.

L’analyse devient une **carte évolutive**, pas une succession de rapports jetables.

---

# 4. Le passé, le présent et le futur ont trois rôles différents

### Le passé
Sert à comprendre :
- le régime ;
- le positionnement ;
- les tendances ;
- les réactions antérieures ;
- ce qui a déjà été absorbé.

### Le présent
Sert à comprendre :
- ce qui drive maintenant ;
- ce qui change marginalement ;
- ce qui est actuellement pricé ;
- où est la tension.

### Le futur
Sert à comprendre :
- le prochain catalyst ;
- ce qui peut être repricé ;
- les scénarios ;
- les conditions de validation ;
- les conditions d’invalidation ;
- les conditions de flip.

Le Global Read n’est pas un historien.

---

# 5. La contradiction est utile

Deux familles peuvent raconter des histoires différentes.

Exemple :

- inflation/rates adverse Gold ;
- USD qui faiblit ;
- crédit qui se détériore ;
- ETF inflows solides.

Ce n’est pas un bug.

Le système doit demander :

- pourquoi ces éléments divergent-ils ?
- parlent-ils du même horizon ?
- parlent-ils du même mécanisme ?
- l’un est-il un retardataire ?
- un driver est-il déjà pricé ?
- une nouvelle chaîne causale domine-t-elle ?
- les contradictions créent-elles justement une asymétrie ?

Le but n’est pas d’éliminer les contradictions.

Le but est de **les expliquer**.

---

# 6. Une famille ne peut pas conclure seule

Aucune famille ne doit produire à elle seule un biais final.

Pas :

« taux hawkish → short Gold ».

Pas :

« VIX haut → long Gold ».

Pas :

« ETF inflows → bullish ».

Pas :

« positionnement extrême → reversal ».

Chaque famille produit une lecture conditionnelle.

La synthèse inter-familles produit le scénario.

---

# 7. Le moteur doit distinguer biais et exploitabilité

Deux questions différentes :

### BIAS / THESIS
Quelle direction macro/fondamentale est la plus cohérente ?

### EXPLOITABILITY / ASYMMETRY
Même si cette thèse est juste, reste-t-il quelque chose à gagner ?

Une thèse peut être correcte mais déjà totalement pricée.

Une thèse peut être correcte mais le positionnement peut être trop crowded.

Une thèse peut être correcte mais un event dans 5 minutes rend l’exécution mauvaise.

---

# 8. Le système ne doit pas forcer un long ou un short

Sorties possibles :

- direction claire ;
- direction conditionnelle ;
- plusieurs scénarios concurrents ;
- pas d’edge exploitable ;
- attendre un trigger.

Le but est de produire un biais lorsque le monde permet réellement de le faire.

Pas de remplir un champ.

---

# 9. Le web n’est ni juge, ni oracle, ni ennemi

Le web sert à :

- vérifier ;
- découvrir ;
- compléter ;
- confronter ;
- révéler un angle oublié ;
- détecter une news ;
- trouver un catalyst ;
- comprendre une opinion de marché ;
- voir ce que différents acteurs surveillent.

Le pipeline reste souverain.

Il ne suit pas la foule.

Il n’est pas contrarian par réflexe.

Il **digère** l’information.

---

# 10. L’output final doit rester humain

Le backend peut être complexe.

Le trader ne veut pas voir :

- JSON ;
- Agent A / Agent B ;
- IDs ;
- traces techniques ;
- 80 sources ;
- un rapport académique.

Il veut comprendre.

L’audit technique doit exister, mais derrière une vue secondaire.

---

## NEXT

Lire : **`02_DATA_VERIFICATION_PROTOCOL.md`**
