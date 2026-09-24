# F10 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même pipeline que F5-F9 : voix Henri phrase par phrase, animations calées sur les mots exacts, tout
le chapitre Knowledge F10 couvert. Source : `script/f10-narration.fr.md`. 1920×1080, 30 fps, ~7 min 12
(13 scènes). Images de contrôle vérifiées le 23/09 (2 corrections). Ancienne version v3 dans `_old-v3/`.

| # | Scène | Couvre (chapitre F10) |
|---|---|---|
| 01 | `intro` | « Les spéculateurs sont tous à l'achat, ça va se retourner » : pourquoi c'est trop simple |
| 02 | `stock-flow` | Position (stock) vs flux (variation) ; position nette par catégorie |
| 03 | `crowding` | Marché encombré : rang historique élevé = sensibilité, pas un minuteur |
| 04 | `cftc` | Rapport hebdomadaire de la CFTC, catégories déclarées, date d'observation |
| 05 | `lag` | Photo du mardi, publication du vendredi ; Hachim lit des positions d'avant le mouvement |
| 06 | `normalize` | 180 000 achat − 70 000 vente = 110 000 net ; ÷ 500 000 d'intérêt ouvert = 22 % |
| 07 | `etf` | Fonds cotés adossés à l'or physique : avoirs en tonnes, onces, parts |
| 08 | `etf-meaning` | Entrées / sorties : suivre ou précéder le prix, prises de bénéfices, réallocations |
| 09 | `scenarios` | Déclencheur macro + positionnement léger vs extrême |
| 10 | `mistakes` | 3 pièges : rang extrême = minuteur ; données en retard vs prix en direct ; un seul fonds = tout le marché |
| 11 | `terminal-usage` | Façade F10 (voir faits ci-dessous) |
| 12 | `glossary-flash` | Intérêt ouvert, position nette, rang historique |
| 13 | `recap` | Niveau ≠ variation ≠ rendement ; aligner les dates ; les flux décrivent, ne déclenchent pas |

## Faits du terminal vérifiés dans le code

- Façade spéciale `F10ParticipationFace` : « Le Managed Money CFTC et GLD sont deux canaux de
  positionnement observables. Ils ne représentent pas l'ensemble du marché de l'or. » + « F10 décrit le
  contexte… ce n'est pas un déclencheur d'exécution. »
- FUTURES — MANAGED MONEY CFTC : Net % of OI, WoW Δ (pp), 156W Percentile ; états « État » et « Extension ».
- ETF — SPDR GLD : Holdings Δ (tonnes), Change 5 / 20 obs., 60-obs. Flow Z, 20-Obs. Flow Extension,
  GLD Price Return 20 obs. ; bloc « Largeur de participation ».
- Mécanique : canaux FUTURES_POSITIONING et ETF_FLOWS (hausse = favorable) ; percentile et autres contextuels.
- Sources : CFTC (dataset 72hh-3qpy), archive SPDR GLD (tonnes).

## Rendu

`python tools/remotion/render_after.py f9 f10 f10-flux-positionnement` (enchaîné après F9), →
`apps/frontend/public/videos/f10-flux-positionnement.mp4`.
