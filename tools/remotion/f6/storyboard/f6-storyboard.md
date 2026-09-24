# F6 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même pipeline que F5 (validée) : voix Henri phrase par phrase, animations calées sur les mots exacts,
tout le chapitre Knowledge F6 couvert. Source : `script/f6-narration.fr.md`. 1920×1080, 30 fps,
10 min 42 (13 scènes). L'ancienne version v3 est archivée dans `_old-v3/` (rien supprimé).
Accessoires propres à F6 : `src/scenes/props6.tsx` (pièces-devises, balançoire dollar/or, tableau de
cotation, poids du DXY, barres de poids, flèches de mouvement).

| # | Scène | Couvre (chapitre F6) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | Balançoire dollar / or, qui marche souvent, casse parfois |
| 02 | `pairs` | Paires, devise de base / de cotation | EUR/USD 1,10, USD/JPY 150, même hausse, sens économique inverse |
| 03 | `who-trades` | Qui échange des devises | Banques, fonds, entreprises, États, banques centrales ; flux multiples |
| 04 | `dxy` | Construction du DXY | 6 devises, poids fixes (euro > 50 %), indice géométrique, exemple euro dominant |
| 05 | `dxy-limits` | Angles morts + source du terminal | Yuan et émergents exclus, poids figés, indice large ; lecture Yahoo non officielle mais niveau publié |
| 06 | `momentum` | Niveau vs variations | 104,62 / −0,18 % jour / +0,42 % 5 séances = divergent, même horizon pour l'or |
| 07 | `drivers` | Ce qui fait bouger le dollar | Taux relatifs (États-Unis, zone euro, Japon), financement et refuge, flux purs |
| 08 | `gold-mechanics` | Canal mécanique vers l'or | Hachim achète en euros : 2 400 $ fixe, 1,10 → 1,05, 2 182 € → 2 286 € (≈ +5 %) |
| 09 | `regimes` | Quand la balançoire casse | Les deux montent (peur), l'or résiste (taux réels, banques centrales), liquidation forcée |
| 10 | `mistakes` | 5 pièges | Niveau ≠ impulsion, sens de paire, source non officielle, corrélation ≠ loi, étiquette ≠ ordre |
| 11 | `terminal-usage` | Façade F6 | Maquette DXY / Today % / 5D %, étiquettes mécaniques, un seul canal USD, état aligné / divergent, renvois F2-F13 |
| 12 | `glossary-flash` | Vocabulaire | Devise de base, DXY, différentiel de taux, dynamique, toutes choses égales par ailleurs |
| 13 | `recap` | À retenir | 4 cartes + « Ne devine jamais. Vérifie. » |

## Faits du terminal vérifiés dans le code

- Façade : DXY (mis en avant), Today %, 5D %. Lecture mécanique : variation négative = dollar en
  baisse = « Favorable » pour l'or ; hausse = « Défavorable » ; le niveau est comparé au relevé précédent.
- Les trois chiffres forment un seul canal USD (combineChannelReads) : accord → la famille prend ce
  sens ; désaccord → « Contextuel » avec « Les contributeurs mécaniques disponibles pointent dans des
  directions différentes. »
- État USD (aligné / divergent entre jour et 5 séances) : étiquette calculée, pas une donnée.
- Source : page publique Yahoo, lecture directe, non officielle (pas le flux sous licence ICE).

## Rendu

`python tools/remotion/render_family.py f6 f6-dollar-change` (4 morceaux, port 3190). Publiée dans
`apps/frontend/public/videos/f6-dollar-change.mp4` le 23/09 à 23 h 28 (47 Mo, 10 min 42, audio =
vidéo, aucun silence > 3 s).
