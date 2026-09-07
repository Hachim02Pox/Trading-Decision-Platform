# 02 — PROTOCOLE DE VÉRIFICATION DES DONNÉES

# 1. Principe absolu

**Aucune interprétation ne commence avant que les données utilisées soient suffisamment fiables.**

Une donnée présente dans le terminal n’est pas sacrée.

Une donnée trouvée sur le web n’est pas sacrée.

Une donnée répétée sur trois sites n’est pas sacrée.

La vérité dépend :

- de la définition ;
- de la période ;
- du timestamp ;
- de la source ;
- du vintage ;
- de la méthodologie ;
- de l’instrument.

---

# 2. Le système doit distinguer « disponible » et « admissible »

Une valeur peut être disponible mais non admissible.

Exemple :

terminal :
Core PCE = 0,2.

Source officielle :
0,3.

La valeur terminal n’a pas le droit de continuer silencieusement dans la thèse.

Le système doit conserver :

- terminalValue ;
- externalVerifiedValue ;
- source ;
- période ;
- définition ;
- statut ;
- conflit éventuel ;
- valeur admise pour le run.

Jamais d’overwrite silencieux.

---

# 3. Ne pas faire un vote de sources

Interdit :

3 sites disent X, 2 sites disent Y → X gagne.

La source dépend du claim.

Exemples conceptuels :

### Macro US
- CPI / NFP / AHE / unemployment → BLS ;
- PCE / GDP → BEA ;
- Fed decision / statement → Federal Reserve ;
- Treasury issuance / auction / QRA → Treasury.

### Positionnement
- COT → CFTC.

### ETF
- holdings GLD → issuer / SPDR source primaire lorsque disponible.

### Market data
- provider direct / marché / source précisément définie.

### Opinions / narratives
- wires, desks, analystes, forums, X, etc.

Une opinion peut être précieuse sans être un fait.

---

# 4. Le type de donnée détermine le protocole

## A. Macro releases

Vérifier :

- métrique exacte ;
- headline/core ;
- MoM/YoY ;
- SA/NSA ;
- période ;
- actual ;
- previous ;
- revised previous ;
- forecast/consensus ;
- publication timestamp ;
- source primaire ;
- vintage.

Une révision future ne doit pas contaminer rétroactivement ce que le marché savait avant.

---

## B. Yields / FX / Gold / market data

Ne pas exiger un nombre identique entre providers.

Vérifier :

- instrument ;
- spot/future/ETF ;
- bid/ask/last/mid/close ;
- timestamp ;
- timezone ;
- live/delayed ;
- source ;
- fréquence.

Deux observations proches mais à deux timestamps différents ne sont pas une contradiction.

---

## C. COT

Vérifier :

- contrat/market code ;
- catégorie ;
- semaine de référence ;
- release date ;
- OI ;
- managed money ;
- éventuelle révision ;
- calculs dérivés reproductibles.

---

## D. ETF / GLD

Vérifier :

- holdings tonnes ;
- date ;
- issuer ;
- créations/redemptions si disponibles ;
- net flow si utilisé ;
- AUM si utilisé.

Ne jamais confondre :

holdings
≠
net flow
≠
AUM change
≠
price return.

---

## E. Options / vol

Vérifier :

- underlying ;
- expiration ;
- strike ;
- call/put ;
- OI vs volume ;
- timestamp ;
- source ;
- methodology ;
- IV / skew / gamma / GEX definition.

Un article qui cite un strike n’est pas automatiquement une preuve.

---

## F. Fed pricing

Vérifier :

- réunion ;
- target range ;
- implied distribution ;
- timestamp ;
- provider ;
- methodology ;
- si le chiffre est direct ou reconstruit.

Ne jamais mélanger un target officiel et une probabilité implicite de marché.

---

# 5. Fraîcheur

« Plus récent » ne veut pas dire « meilleur » sans contexte.

Une donnée weekly COT peut être parfaitement valide plusieurs jours plus tard.

Une observation intraday DXY vieille de 24h peut être invalide pour expliquer une réaction présente.

Chaque donnée doit avoir :

- observationAt ;
- publicationAt si pertinent ;
- retrievedAt ;
- expectedCadence ;
- effectiveFreshnessStatus.

---

# 6. Vérification exhaustive mais intelligente

Le trader veut que **toute donnée utilisée** soit fiable.

Cela ne signifie pas refaire 200 recherches web à chaque clic.

Architecture souhaitée :

### Verification cache
Une donnée officielle vérifiée et inchangée peut conserver un record de vérification.

### Decision-critical verification
Les faits qui changent réellement la thèse doivent être vérifiés avec le plus haut niveau de rigueur.

### Supporting data
Peuvent réutiliser une vérification récente si le vintage n’a pas changé.

Le but est :

RIGUEUR × LATENCE.

---

# 7. Si une donnée manque

Le système doit essayer, dans cet ordre conceptuel :

1. source primaire déjà connectée ;
2. source officielle accessible sur le web ;
3. provider déjà utilisé ;
4. recherche externe ciblée ;
5. autre source crédible ;
6. sinon : UNKNOWN / UNAVAILABLE.

Ne jamais fabriquer.

---

# 8. Si une donnée critique reste ambiguë

Elle ne peut pas soutenir la conclusion.

Le système peut :

- garder deux versions ;
- expliquer le conflit ;
- bloquer la thèse dépendante ;
- proposer un resolver.

---

# 9. Web de vérification ≠ web d’interprétation

Deux passes conceptuelles différentes :

### WEB VERIFY
Question fermée :
« Quelle est la valeur officielle / exacte ? »

### WEB EXPLORE
Question ouverte :
« Qu’est-ce qu’on n’a peut-être pas vu ? »

Ne pas les confondre.

---

## NEXT

Lire : **`03_FAMILY_MAP_AND_ROLES.md`**
