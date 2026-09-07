# 03 — CARTE DES FAMILLES ET LEUR RÔLE

Ce document reprend les familles actuellement visibles dans le terminal.

Les valeurs courantes ne font pas partie de cette spécification ; seules les familles et leurs sous-composants comptent.

---

# 1. TAUX

Données actuellement visibles :

- 2Y ;
- 10Y ;
- 2s10s.

À intégrer si disponibles / existantes dans le terminal :

- real yields ;
- breakevens ;
- curve decomposition ;
- autres maturités nécessaires.

### Rôle

Famille de :
- régime ;
- policy transmission ;
- opportunity cost Gold ;
- growth/inflation expectations ;
- term premium / fiscal transmission.

Ne jamais conclure depuis le niveau seul.

Question centrale :
**qu’est-ce qui fait bouger quelle partie de la courbe, et pourquoi ?**

---

# 2. FED / ANTICIPATIONS DE TAUX

Données visibles :

- target range actuel ;
- prochaine range / scénario ;
- probabilité(s) de marché.

### Rôle

Comprendre :
- réaction function ;
- ce que le marché price ;
- changement de path ;
- surprise dovish/hawkish ;
- différence entre discours officiel et pricing.

La valeur principale n’est pas :
« Fed cuts ».

Mais :
**comment le pricing a changé par rapport à ce qui était déjà attendu.**

---

# 3. USD / CHANGE

Données visibles :

- DXY ;
- variation today ;
- variation 5D.

À explorer selon valeur décisionnelle :

- USDJPY ;
- USDCNH ;
- autres FX liés au carry / Chine / risk.

### Rôle

Transmission vers Gold.

Mais aussi :
- dollar regime ;
- stress ;
- carry ;
- cross-asset confirmation / contradiction.

Un DXY fort n’est pas automatiquement bearish Gold si un autre driver domine.

---

# 4. INFLATION

Données visibles :

- Core CPI MoM ;
- Core CPI YoY ;
- Core PCE MoM ;
- Core PCE YoY.

Peut inclure selon terminal :
- headline ;
- wages ;
- breakevens ;
- autres composantes.

### Rôle

Comprendre :
- inflation regime ;
- stickiness ;
- trend ;
- surprise ;
- reaction function Fed ;
- divergence CPI/PCE ;
- inflation impulse future.

---

# 5. EMPLOI / CROISSANCE

Données visibles :

EMPLOI :
- unemployment ;
- payrolls.

CROISSANCE :
- GDPNow.

Peut inclure selon terminal :
- AHE ;
- claims ;
- ISM ;
- autres activity data.

### Rôle

Comprendre :
- labour cooling/strength ;
- growth risk ;
- Fed dual mandate ;
- recession / soft landing / reacceleration ;
- surprises et révisions.

---

# 6. RISQUE / CRÉDIT / VOL

Données visibles :

- VIX ;
- MOVE ;
- HY OAS.

Peut inclure :
- IG OAS ;
- autres spreads.

### Rôle

Comprendre :
- stress ;
- financial conditions ;
- risk-off ;
- rate vol ;
- credit deterioration ;
- possible safe-haven demand.

Important :
VIX faible ne prouve pas « pas de risque ».
MOVE fort ne prouve pas seul un biais Gold.

---

# 7. LIQUIDITÉ / FINANCEMENT

Données visibles :

- reserves WoW ;
- TGA Daily Δ ;
- état financement.

Peut inclure :
- SOFR-IORB ;
- EFFR-IORB ;
- balance sheet ;
- QT/QE ;
- funding stress.

### Rôle

Comprendre :
- disponibilité de liquidité ;
- retrait/injection ;
- funding ;
- stress monétaire ;
- environnement de levier ;
- interaction avec risk assets / USD / Gold.

---

# 8. STRUCTUREL / DEMANDE OFFICIELLE

Données visibles :

- Central Bank Net Buying (quarterly) ;
- Total Gold Demand (quarterly).

### Rôle

Background structurel.

Important :
la demande officielle peut soutenir le régime de fond mais ne doit pas être utilisée comme explication automatique d’un mouvement intraday.

---

# 9. TRÉSOR / FISCAL

Données visibles :

- prochaines adjudications 10Y ;
- prochaines adjudications 30Y.

Peut inclure :
- QRA ;
- issuance ;
- auction results ;
- tail ;
- bid-to-cover ;
- fiscal impulse ;
- term premium.

### Rôle

Comprendre :
- supply duration ;
- pressure long-end ;
- fiscal narrative ;
- future catalysts ;
- possible transmission yields → USD/Gold.

---

# 10. OPTIONS OR / VOL

Données visibles :

- Gold Vol / GVZ ;
- proxy 1D change ;
- proxy 5D change.

À ajouter uniquement si source fiable :
- gamma ;
- GEX ;
- call/put walls ;
- skew ;
- OI ;
- expiries ;
- 0DTE context.

### Rôle

Pas nécessairement créer le biais macro.

Souvent :
- état de convexité ;
- hedging ;
- pinning/amplification ;
- asymétrie mécanique ;
- catalyst sensitivity.

---

# 11. FLUX / POSITIONNEMENT

## Futures — CFTC Managed Money

Données visibles :

- Managed Money Net % OI ;
- WoW Δ ;
- 156W percentile ;
- état ;
- extension.

## ETF — SPDR GLD

Données visibles :

- holdings Δ tonnes ;
- change 5 observations ;
- change 20 observations ;
- 60-observation flow Z ;
- 20-observation flow extension ;
- GLD price return 20 observations ;
- participation ;
- flow intensity ;
- flow extension ;
- price/flow state ;
- breadth / participation.

### Rôle

Cette famille est centrale pour **l’exploitabilité**.

Elle répond notamment :

- le marché est-il déjà chargé dans le sens de la thèse ?
- le flow marginal confirme-t-il ?
- la participation est-elle large ou concentrée ?
- est-ce que la thèse est déjà crowded ?
- y a-t-il une divergence prix/flow ?
- une news favorable échoue-t-elle ?

Important :

positioning ≠ prediction.

extension ≠ reversal.

---

# 12. Familles par rôle par défaut

Ce ne sont pas des prisons ; une famille peut changer de rôle selon le régime.

## A. Construction du biais / régime
- inflation ;
- emploi/croissance ;
- Fed/anticipations ;
- taux ;
- USD/change ;
- liquidité/financement ;
- Trésor/fiscal ;
- risque/crédit ;
- structural.

## B. Transmission / validation de la chaîne
- Fed pricing ;
- taux ;
- USD ;
- crédit ;
- vol ;
- liquidity/funding ;
- Gold price response si disponible.

## C. Exploitabilité / asymétrie
- COT ;
- ETF flows/holdings ;
- positioning ;
- options ;
- gamma/hedging ;
- vol ;
- price/flow ;
- open interest.

La synthèse finale doit utiliser toutes les familles, mais pas leur donner le même rôle ni le même poids.

---

## NEXT

Lire : **`04_FAMILY_ANALYSIS_FRAMEWORK.md`**
