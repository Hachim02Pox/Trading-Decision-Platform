# F2 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-22)

Remplace le storyboard v2 (5 scènes, sous 5 minutes — plafond de durée maintenant levé sur
demande explicite de Hachim : la vidéo doit couvrir l'intégralité du chapitre Knowledge F2).
Source : `script/f2-narration.fr.md` v4. Résolution 1920×1080, 30 fps.

Contrairement aux versions précédentes, chaque scène applique la stack complète de la skill
`remotion-motion-graphics` : fond en mesh animé (`BgMesh`), grade + grain + vignette
(`PostStack`), entrées en `spring` (jamais linéaire), stagger, icônes SVG dessinées (banque,
lingot, pile de pièces, billet qui pop, balance, terminal) au lieu de rectangles de texte nus,
et un kit SFX synthétisé (`scripts/gen-sfx.mjs` → `public/sfx/`) calé sur les cues de sous-titres.

| # | Scène (id) | Couvre (chapitre Knowledge F2) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | Hachim, banque vs or, balance qui bascule, dézoom institutions |
| 02 | `bond-basics` | Principes de base des obligations et rendements | Levier prix ↕ rendement, exemple 96 $ → 98 $ |
| 03 | `maturities-curve` | 2 ans, 10 ans, 30 ans et courbe des taux | 3 chips maturités, courbe normale vs inversée dessinée |
| 04 | `bps-2s10s` | Points de base et 2s10s | Calcul 4,40 − 4,10 = −30 pb, pentification/aplatissement |
| 05 | `real-vs-nominal` | Taux nominaux, réels et breakevens (partie 1) | 4 % − 3 % = 1 % (taux affiché → taux réel) |
| 06 | `scenario-abc` | Taux nominaux, réels et breakevens (partie 2, exemple complet) | 3 cas (A/B/C) même mouvement nominal, résultats or différents |
| 07 | `term-premium-regimes` | Prime de terme et décomposition causale | Grille 2×2 des 4 régimes de courbe (flèches court/long) |
| 08 | `mistakes-failures` | Erreurs et régimes d'échec | 3 pièges (croix) + 2 régimes d'échec (alerte) |
| 09 | `terminal-usage` | Comment utiliser F2 dans le terminal | Façade F2 (2 ans/10 ans/2s10s) → tiroir (taux réel 10 ans + BE10) → chips F3/inflation/F6 |
| 10 | `glossary-flash` | Glossaire | 7 cartes flash (rendement, pb, taux réel, inflation implicite, deux dix, prime de terme, duration) |
| 11 | `recap` | Takeaways | 4 rappels + clôture sans tagline "Hachim vérifie" (règle round 3) |

## Vérifications factuelles faites avant l'écriture du script
- `F2RatesFace.tsx` : la façade cockpit rend les KPI passés par `FamilyModule.tsx`
  (`cockpitKpis = family.kpis.filter(k => k.visibility === "cockpit")`) → confirmé 2 ans / 10 ans / 2s10s.
- `FamilyDrawerView.tsx` : le tiroir "family" liste **tous** `family.kpis` (pas seulement cockpit),
  donc le taux réel 10 ans (`f2-10y-real`) et BE10 (`f2-be10`) y apparaissent bien.
- `mechanicalRationale.ts` : confirme que `f2-10y-real` est le canal mécanique direct vers l'or ;
  `f2-2y`/`f2-10y` sont contextuels/confirmatoires.
- Contenu narratif basé sur `chaptersF1F3.ts` → `F2_RATES` (toutes les 7 sections + glossaire + takeaways).

## Règles de production (voir aussi la mémoire persistante `gold-terminal-video-standard`)
- Voix `fr-FR-DeniseNeural`, débit -2 % (dernier choix confirmé round 3, français standard non canadien).
- Aucun terme anglais lu tel quel ; "breakeven" → "inflation implicite", "term premium" → "prime de terme".
- Hachim comme protagoniste concret dans `intro` et `scenario-abc` seulement — pas de tagline de clôture.
- Sous-titres : texte plein, ombre portée, sans carte/bordure (`Subtitles.tsx`, inchangé).
- **Plafond de 5 minutes levé pour cette refonte** : Hachim a explicitement demandé de couvrir
  l'intégralité du contenu écrit du chapitre, durée illimitée (~11m30 obtenues).
- Rendu local uniquement (`out/f2-taux-reels.mp4`), pas de commit/push tant que Hachim n'a pas validé.

## État au 2026-09-22 (fin de session)
- Master rendu : `out/f2-taux-reels.mp4` (149 Mo, crf 17). Copie compressée pour le site (crf 26,
  45 Mo) : `apps/frontend/public/videos/f2-taux-reels.mp4` + poster.
- Anciennes vidéos du site (F2 v3, F3, F4, F5, F6) déplacées, pas supprimées, vers
  `tools/remotion/_archive-videos-v3/`. Leurs entrées ont été retirées de `FAMILY_VIDEO` dans
  `KnowledgeChapterView.tsx` pour qu'aucun lecteur vide ne s'affiche.
- La vidéo mise sur le site contient 3 erreurs repérées à l'inspection des frames, **déjà corrigées
  dans le code mais pas encore re-rendues** (un rendu complet prend environ 1 h) :
  1. scène `bps-2s10s` : l'ordre affiché était 2 ans − 10 ans ; c'est 10 ans − 2 ans.
  2. scène `terminal-usage` : 10 ans à 4,10 % incohérent avec réel 1,80 % + BE10 2,40 % ; passé à 4,20 % (2s10s −20 pb).
  3. scène `scenario-abc` cas 3 : flèche verte vers le bas sur "quasi stable" ; remplacée par "≈".
- Aussi corrigé : grand vide au milieu de la grille 2×2 de `term-premium-regimes`.
