# F2 — Storyboard vidéo pédagogique (v2 vulgarisée, redo 2026-09-17)

Remplace le storyboard v1 (11 scènes, trop technique). Source : `script/f2-narration.fr.md` v2.
Résolution 1920×1080, 30 fps, même thème sombre que la v1 (`src/theme.ts`, `scenes/shared.tsx` inchangés).

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Deux icônes face à face sur une balance simple : "10 000 $ à la banque" (intérêt garanti) vs "10 000 $ en or" (aucun revenu, protège la valeur) ; bascule légère | Remplace l'ancienne balance or/taux réel par cette version concrète et immédiate |
| 02 | `real-rate` | Soustraction animée à 2 termes seulement : "Taux affiché 4 %" moins "Inflation 3 %" = "Vrai gain 1 %" qui s'assemble | Simplifié depuis l'ancien nominal/réel/breakeven à 3 termes |
| 03 | `trap-example` | Deux colonnes seulement (pas trois) : Cas A "Inflation attendue pareille → vrai gain baisse → or plus attirant" vs Cas B "Inflation attendue baisse plus → vrai gain monte → or moins attirant", à partir du même "taux affiché 4,20 % → 4,00 %" | Remplace l'ancien ScenariosABC à 3 colonnes |
| 04 | `terminal-usage` | Façade simplifiée F2 (2 ans / 10 ans / écart) qui s'ouvre vers un tiroir affichant "vrai gain 10 ans" en surbrillance | Version allégée de l'ancienne TerminalUsage, sans les renvois F3/F6/budget |
| 05 | `recap` | 3 takeaways qui défilent (pas 5), dernière ligne en petit texte discret : "...que fait Hachim avant de décider si un mouvement de taux mérite d'être suivi ou ignoré." | Touche perso unique, texte secondaire, jamais dominant |

## Règles
- Toujours réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn` de `shared.tsx`, `theme.ts` inchangés.
- Supprimer les anciens fichiers de scène qui ne sont plus utilisés (BondYield, MaturitiesCurve, BasisPoints, NominalRealBreakeven, ScenariosABC, TermPremium, CurveRegimes, CommonMistakes) et les remplacer par les 5 scènes ci-dessus.
- Durée totale visée : sous 5 minutes.
- Aucun terme anglais non traduit dans le texte affiché à l'écran non plus (pas de "breakeven", "term premium", etc.).
