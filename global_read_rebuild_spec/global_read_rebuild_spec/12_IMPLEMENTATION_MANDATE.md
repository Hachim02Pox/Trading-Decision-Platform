# 12 — IMPLEMENTATION MANDATE

Tu as maintenant lu l’ensemble de la nouvelle logique métier.

# 1. Ce que tu dois faire

Tu dois maintenant :

1. auditer le code actuel du Global Read ;
2. mapper ce qui est réutilisable ;
3. identifier ce qui appartient à l’ancienne logique ;
4. proposer l’architecture technique la plus simple capable d’implémenter cette spécification ;
5. implémenter ;
6. tester ;
7. intégrer l’UI ;
8. produire un rapport final.

---

# 2. Tu as de la liberté

Tu n’es pas obligé de conserver :

- le nombre actuel d’appels LLM ;
- les anciens prompts ;
- l’ancien combiner ;
- l’ancien schema ;
- l’ancien verdict ;
- l’ancienne logique stateless ;
- l’ancien ordre des passes ;
- l’ancien format de report.

Si une architecture meilleure existe :
utilise-la.

Mais explique pourquoi.

---

# 3. Ce que tu ne peux pas sacrifier

Tu ne peux pas sacrifier :

- data verification avant interprétation ;
- distinction fact / interpretation / hypothesis / thesis ;
- analyse famille par famille ;
- synthèse inter-familles ;
- web comme outil de vérification + découverte + forward research ;
- deux raisonnements indépendants avant confrontation si deux IA sont utilisées ;
- confrontation question par question ;
- scénarios ;
- priced/unpriced ;
- flows/positioning après proposition de thèse ;
- invalidation + flip ;
- state memory ;
- whatChanged sur les runs suivants ;
- output humain ;
- audit complet en secondaire.

---

# 4. Ne pas garder l’ancien code juste pour éviter du travail

Si l’ancien Global Read est incompatible avec cette logique :
remplace sa logique.

Mais :

réutilise les providers, fetchers, persistence, cards, contracts, tests ou helpers qui restent utiles.

---

# 5. Avant de coder

Écris un court ADR :

## CURRENT
Comment Global Read fonctionne aujourd’hui.

## GAPS
Pourquoi cela ne répond pas à cette documentation.

## TARGET
Architecture proposée.

## LLM ROLES
Qui fait quoi.

## STATE MODEL
Comment la mémoire/scenario tree persiste.

## DATA VERIFICATION
Comment les données sont admises.

## WEB
Comment verify/explore/final scan sont séparés.

## DEBATE
Comment la confrontation fonctionne.

## OUTPUT
Comment l’UI progressive fonctionne.

## LATENCY
Comment éviter un moteur inutilisable.

Puis implémente.

---

# 6. Rapport final obligatoire

À la fin, fournir :

## A. WHAT WAS CHANGED
Architecture avant / après.

## B. FILES CHANGED
Tous les fichiers.

## C. DATA VERIFICATION
Comment ça marche désormais.

## D. FAMILY ENGINE
Comment chaque famille est analysée.

## E. CROSS-FAMILY SYNTHESIS
Comment les contradictions et le marginal driver sont construits.

## F. WEB
Verify / explore / final scan.

## G. TWO-AI DEBATE
Rounds, stop condition, unresolved disagreements.

## H. SCENARIO MEMORY
Persistence, state transitions, next run.

## I. BIAS / ASYMMETRY
Comment on passe de macro thesis à exploitability.

## J. UX
Screens/sections/interaction.

## K. TESTS
Pass/fail.

## L. LATENCY
Mesures.

## M. LIMITATIONS
Ce qui reste impossible / non calibré.

## N. BUSINESS VALUES NOT INVENTED
Toute valeur laissée configurable.

## O. FINAL STATUS
Choisir :
- READY FOR SHADOW TESTING
- NOT READY FOR SHADOW TESTING — reason.

---

# 7. Dernière philosophie

Le système idéal doit être capable de répondre :

1. Quelles données sont vraies ?
2. Que dit chaque famille individuellement ?
3. Qu’est-ce qui a changé ?
4. Quel régime domine ?
5. Qu’est-ce qui drive marginalement Gold ?
6. Pourquoi ?
7. Quelles familles confirment ?
8. Quelles familles contredisent ?
9. Pourquoi divergent-elles ?
10. Qu’est-ce qui est déjà pricé ?
11. Qu’est-ce qui ne l’est pas ?
12. Que peut-il se passer ensuite ?
13. Quel scénario est principal ?
14. Quel scénario adverse est réellement dangereux ?
15. Que disent flow/positioning ?
16. Que disent options/vol/hedging ?
17. Qui peut encore acheter/vendre ?
18. Qui est contraint ?
19. Quel est le fuse ?
20. Le prix répond-il comme prévu ?
21. Où est l’asymétrie ?
22. Qu’est-ce qui affaiblit ?
23. Qu’est-ce qui invalide ?
24. Qu’est-ce qui ferait flip ?
25. Qu’est-ce qui a changé depuis le dernier run ?
26. Que doit attendre le trader avant de considérer son setup technique ?

Le Global Read ne doit pas être un oracle.

Il doit être :

> **un analyste macro + un moteur de scénarios + un moteur de confrontation + une mémoire de marché + un filtre d’asymétrie.**

Et son output doit rester assez clair pour qu’un humain ait envie de le lire avant de risquer son capital.

---

# END

Tu as terminé la documentation.

Retourne maintenant à `00_README_FIRST.md` uniquement si tu dois vérifier un invariant, puis commence l’audit du repo et l’implémentation.
