# F8 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même pipeline que F5/F6/F7 : voix Henri phrase par phrase, animations calées sur les mots exacts, tout
le chapitre Knowledge F8 couvert. Source : `script/f8-narration.fr.md`. 1920×1080, 30 fps, ~6 min 36
(11 scènes). L'ancienne version v3 est archivée dans `_old-v3/`.
Accessoires propres à F8 : `src/scenes/props8.tsx` (réservoir, tuyau, compte en T, axe des taux).

| # | Scène | Couvre (chapitre F8) |
|---|---|---|
| 01 | `intro` | La liquidité n'est pas un robinet mais une plomberie (réservoirs, tuyaux, vannes) |
| 02 | `reserves` | Réserves bancaires : dette de la Fed, actif de la banque ; actifs de la Fed moins ses autres dettes |
| 03 | `tga-example` | Exemple : le TGA monte de 120 milliards, actifs inchangés → les réserves baissent d'autant |
| 04 | `tga` | Le compte du Trésor (TGA) : impôts et émissions le remplissent, dépenses le vident |
| 05 | `funding-rates` | Taux au jour le jour : SOFR, EFFR, IORB ; ce que chacun mesure |
| 06 | `spread-example` | SOFR 5,37 % − IORB 5,40 % = −3 pb (normal) ; un jour à +12 pb, Hachim protagoniste |
| 07 | `regimes` | Lire F8 : réserves + TGA ensemble, écarts de financement, confirmation par F7 |
| 08 | `mistakes` | 3 pièges : bilan de la Fed ≠ liquidité utilisable, baisse des réserves ≠ resserrement égal, un seul chiffre |
| 09 | `terminal-usage` | Façade F8 (voir faits ci-dessous) |
| 10 | `glossary-flash` | Réserves, TGA, SOFR, IORB |
| 11 | `recap` | La liquidité = un système de bilans ; F8 agit sur l'or indirectement. « Ne devine jamais. Vérifie. » |

## Faits du terminal vérifiés dans le code

- Façade : Reserves (variation sur une semaine), TGA (variation sur un jour), ligne « Financement :
  Normal / Anormal » calculée sur |SOFR − IORB| ≤ 5 pb.
- Détail : Reserves, TGA, Funding Microstate, SOFR-IORB, EFFR-IORB.
- Sources : FRED (réserves WRBWFRBL, mercredi), Trésor (relevé quotidien), NY Fed (EFFR).

## Rendu

`python tools/remotion/render_family.py f8 f8-liquidite-financement` (3 morceaux, port 3190), lancé le
24/09 à 12 h 00 → `apps/frontend/public/videos/f8-liquidite-financement.mp4`.
