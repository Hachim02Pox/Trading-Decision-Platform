# F3 — Storyboard vidéo pédagogique (v2 vulgarisée, redo 2026-09-17)

Remplace le storyboard v1 (10 scènes, trop technique). Source : `script/f3-narration.fr.md` v2.
Résolution 1920×1080, 30 fps, même thème sombre que la v1 (`src/theme.ts`, `scenes/shared.tsx` inchangés).

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Deux blocs face à face : "Décision d'aujourd'hui" (contour plein, fixe) vs "Prévisions du marché" (contour pointillé, léger pulse) | Simplifié depuis la v1, sans mention de profession/ville |
| 02 | `probability` | Bar chart 3 barres animées : Rien ne change 25 %, Petite baisse 60 %, Grosse baisse 15 % ; annotation finale "40 % de chances que ce ne soit pas ça" | Version allégée de l'ancien Distribution, une seule annotation |
| 03 | `trap-example` | Carte "La Fed ne change rien" au centre, deux branches : "Prévoit moins de baisses → mauvais pour l'or" (negative) vs "Laisse entendre plus de baisses → bon pour l'or" (positive) | Remplace l'ancien Surprise (probabilités avant/après) par cette version plus directe |
| 04 | `terminal-usage` | Façade simplifiée F3 (fourchette actuelle / scénario le plus probable / probabilité) qui s'ouvre vers un tiroir "trajectoire complète + a-t-elle changé récemment ?" | Version allégée, sans renvois F2/F6 |
| 05 | `recap` | 3 takeaways qui défilent (pas 5), dernière ligne en petit texte discret : "...que Hachim vérifie toujours avant de réagir à une annonce de la Fed." | Touche perso unique, texte secondaire, jamais dominant |

## Règles
- Toujours réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn` de `shared.tsx`, `theme.ts` inchangés.
- Supprimer les anciens fichiers de scène qui ne sont plus utilisés (Fundamentals, Distribution, Repricing, Transmission, Surprise, InformationSet, CommonMistakes) et les remplacer par les 5 scènes ci-dessus.
- Durée totale visée : sous 5 minutes.
- Aucun terme anglais non traduit dans le texte affiché à l'écran non plus (pas de "repricing", "dot plot", "hawkish/dovish", etc. — dire "prévoit moins/plus de baisses" à la place).
