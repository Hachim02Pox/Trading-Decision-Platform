# F7 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même pipeline que F5/F6 : voix Henri phrase par phrase, animations calées sur les mots exacts, tout
le chapitre Knowledge F7 couvert. Source : `script/f7-narration.fr.md`. 1920×1080, 30 fps, 7 min 15
(11 scènes). L'ancienne version v3 est archivée dans `_old-v3/`.
Accessoires propres à F7 : `src/scenes/props7.tsx` (thermomètre, parapluie, courbe en cloche,
obligation, barres d'écart de crédit).

| # | Scène | Couvre (chapitre F7) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | « le VIX explose donc l'or monte », trois peurs (actions, taux, crédit), trois thermomètres |
| 02 | `vix` | VIX | Options sur le grand indice américain, option = assurance, 20 ≠ −20 % |
| 03 | `vix-math` | Traduire le VIX | Hachim voit 24 → 24 × √(30/365) ≈ 6,9 % sur 30 jours, dans les deux sens, cloche, causes d'une hausse |
| 04 | `move` | MOVE | Options sur obligations d'État, pourquoi les taux comptent, MOVE haut / VIX calme, contextuel |
| 05 | `credit` | Écarts de crédit, OAS | Entreprise vs État, 4 composantes, points de base, haut rendement vs bonne qualité |
| 06 | `oas-example` | Exemple chiffré | 7,20 % − 4,10 % = 310 pb, élargissement à 410 pb, « le crédit se tend » |
| 07 | `regimes` | Transmission vers l'or | Fuite ordonnée (or soutenu), pénurie de dollars, désendettement forcé (or vendu) |
| 08 | `mistakes` | 4 pièges | Une seule jauge, volatilité ≠ direction, preuves non indépendantes, pas de signal |
| 09 | `terminal-usage` | Façade F7 | VIX / MOVE / HY OAS tous Contextuels, MOVE indisponible (« — », clic → graphique), détail 1D Δ + IG OAS |
| 10 | `glossary-flash` | Vocabulaire | Volatilité implicite, OAS, point de base |
| 11 | `recap` | À retenir | 3 cartes + « Ne devine jamais. Vérifie la transmission. » |

## Faits du terminal vérifiés dans le code

- Façade : VIX, MOVE, HY OAS ; tous « Contextuel » (pas d'agrégation mécanique pour F7).
- VIX et OAS : FRED (Réserve fédérale de Saint-Louis). MOVE : volontairement indisponible (NO_SOURCE,
  affiché « — »), un clic ouvre /chart?instrument=MOVE ; dans le détail, « Cliquer pour voir ».
- Détail : VIX 1D Δ, MOVE 1D Δ, HY OAS 1D Δ, IG OAS.

## Rendu

`python tools/remotion/render_family.py f7 f7-risque-credit-vol` (3 morceaux, port 3190), publiée le 24/09 à 0 h 23 (31 Mo, 7 min 15, audio = vidéo, aucun silence > 3 s) dans
`apps/frontend/public/videos/f7-risque-credit-vol.mp4`.
