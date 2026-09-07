# 11 — INVARIANTS D’IMPLÉMENTATION ET TESTS

Ce document ne dicte pas une architecture logicielle précise.

Il dicte les propriétés que le système doit garantir.

Le lead implementation model peut choisir l’architecture qu’il estime meilleure si ces invariants sont respectés.

---

# 1. Data invariants

- une donnée critique non vérifiée ne peut pas conduire silencieusement au bias final ;
- un conflit terminal/source officielle est visible ;
- un vintage futur ne contamine pas un raisonnement passé ;
- une daily observation ne devient pas une preuve intraday ;
- GC/XAU/GLD ne sont pas silencieusement interchangeables ;
- COT week A n’est pas comparé à week B comme même observation ;
- holdings ≠ flows ≠ AUM ;
- options strike/expiry doivent être exacts.

---

# 2. Reasoning invariants

- chaque famille est analysée avant la synthèse ;
- aucune famille ne conclut seule ;
- pas de factor counting ;
- marginal driver ≠ last headline ;
- contradiction doit être expliquée ou gardée ouverte ;
- price response ne peut pas être la seule preuve du driver ;
- positioning ne crée pas automatiquement le biais ;
- extension ne signifie pas reversal ;
- web opinion n’est pas un fact.

---

# 3. Two-AI invariants

- analyse indépendante d’abord ;
- confrontation ensuite ;
- pas de changement d’avis sans raison explicite ;
- pas de consensus forcé ;
- désaccord matériel conservé ;
- l’accord de deux IA ne renforce pas la force des données.

---

# 4. Stateful invariants

- chaque run peut lire le précédent ;
- scenario states persistent ;
- triggers peuvent être testés au run suivant ;
- invalidations persistent ;
- update run commence par whatChanged ;
- rien de matériel → pas besoin de réécrire toute l’histoire.

---

# 5. Web invariants

- verify pass séparée de explore pass ;
- source authority par claim type ;
- forum/X peut créer hypothesis, pas fact sans vérification ;
- web final peut ajouter une nouvelle branche mais pas remplacer une thèse sans preuve ;
- freshness obligatoire.

---

# 6. Tests adversariaux minimum

### Data
1. Terminal Core PCE faux, BEA correct → terminal value rejetée/corrigée.
2. Deux secondaires contre primaire → primaire gagne.
3. DXY sources différentes mais timestamps différents → pas faux conflit.
4. COT mauvais report week → not comparable.
5. GLD tonnes vs $ flow → not comparable.
6. Options wrong expiry → rejected.
7. daily real yield utilisé intraday → rejected.
8. stale data présent mais non visible → must be surfaced.

### Reasoning
9. Rates adverse seul → pas automatiquement Gold adverse.
10. USD favorable contredit rates adverse → contradiction explicitement traitée.
11. 5 expressions d’une même chaîne → pas 5 confirmations.
12. release mixed → pas forced bias.
13. supportive release mais no repricing → scenario weakening.
14. favorable news + price failure + extension → asymmetry warning, pas auto short.
15. structural demand supportive mais fresh hawkish repricing → background ne domine pas automatiquement.

### Web
16. article populaire répété 20 fois → pas 20 preuves.
17. forum trouve un catalyst réel oublié → hypothesis puis verify.
18. analyste connu contredit → argument évalué, pas automatiquement accepté.
19. breaking event web non vérifié → ne devient pas fact.
20. dernière passe web trouve un event nouveau → state update.

### Debate
21. IA A a tort sur un chiffre → doit abandonner après preuve.
22. IA B s’entête malgré source primaire → résolution doit marquer B invalidée.
23. A/B désaccord interprétatif avec facts identiques → conserver le désaccord.
24. A/B mêmes mots mais mécanismes différents → ne pas faux-converger.
25. A/B mêmes mécanismes avec wording différent → ne pas faux-diverger.

### Stateful
26. Monday scenarios A/B.
27. Tuesday trigger A occurs → A active.
28. Aucun changement → preserve state.
29. invalidation triggered → scenario invalidated.
30. new catalyst supersedes old thesis → new branch/version.

### UX
31. main report no JSON.
32. main report no Agent A/B labels.
33. audit still contains trace.
34. whatChanged visible on update.
35. trader can understand invalidation without opening audit.

---

# 7. Latency tests

Mesurer :

- data verification ;
- family analysis ;
- web exploration ;
- debate ;
- final web pass ;
- synthesis ;
- total.

Si une étape coûte énormément et apporte peu :
challenge-la.

L’edge disparaît si la réponse arrive trop tard.

---

# 8. Shadow validation future

Le système doit être compatible avec une future collecte :

TechnicalSetup
↔
GlobalReadRun.

Pour tous les setups éligibles, pas seulement ceux pris.

Objectif futur :

- selectivity ;
- false veto ;
- bad terrain filtered ;
- conditional expectancy ;
- MAE ;
- MFE ;
- time-to-decision ;
- calibration by scenario/driver.

Ne pas inventer cette étude maintenant.

---

## NEXT

Lire : **`12_IMPLEMENTATION_MANDATE.md`**
