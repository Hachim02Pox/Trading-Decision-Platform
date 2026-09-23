# F5 — Storyboard vidéo pédagogique (v1)

Source : `script/f5-narration.fr.md`. Résolution 1920×1080, 30 fps, même thème
sombre que F2/F3 (`src/theme.ts`, `scenes/shared.tsx` copiés à l'identique,
mêmes primitives `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn`/`cueFrame`/
`AmbientBackground`).

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Titre + sous-titre façon F3 Intro ; un bloc "THERMOMÈTRE" central (icône `WorkerIcon`) avec une jauge simple qui pulse doucement ; note finale "F5 ne dit jamais seul si c'est bon ou mauvais pour l'or" apparaît en dernier | Reprend la structure centrée de F3 `Intro.tsx`, pas de gauche/droite ici — un seul concept central |
| 02 | `key-numbers` | Deux `Panel` côte à côte : "Taux de chômage" (icône `WorkerIcon`, formule chômeurs ÷ population active en petit texte mono) et "Emplois créés" (icône `BriefcaseIcon`, note "emplois ≠ personnes") ; les deux panels se révèlent au moment où le narrateur en parle | Même schéma que F3 `TrapExample` (deux `Panel` avec `fadeSlideIn`), mais alignés côte à côte dès le départ, sans branches positive/négative |
| 03 | `revisions-matter` | Carte centrale "+190k vs +170k attendu" (chip positive/accentBright) puis deux chips négatives qui apparaissent en dessous : "-35k" et "-25k" révisions, puis un total "-60k" souligné ; note finale sur la tendance | Repique la structure de F3 `TrapExample` (Panel setup + branches), adapté à un empilement révision plutôt que deux branches côte à côte |
| 04 | `terminal-usage` | Panel "FAÇADE F5" (3 lignes : Taux de chômage / Emplois créés vs attendu / GDPNow) à gauche ; Panel "DANS LE TIROIR" (moyenne 3M, inscriptions chômage, salaires, révision 2M) au centre ; Panel accent "POUR ALLER PLUS LOIN" (lien externe, enquêtes ISM) à droite avec `ExternalLinkIcon` ; note finale "jamais d'étiquette favorable/défavorable toute seule" | Reprend le schéma façade + lien externe de F3 `TerminalUsage.tsx`, mais avec 3 blocs (façade / tiroir / lien externe) au lieu de 2, pour refléter que F5 n'a pas de façade dédiée mais un rendu générique en 2 niveaux (cockpit + tiroir) |
| 05 | `recap` | 3 takeaways qui défilent verticalement, numérotés 01/02/03, identique au patron de F3 `Recap.tsx` | Aucune mention de Hachim ici (déjà utilisé une fois en scène 03) |

## Icônes ajoutées à `scenes/shared.tsx`
- `WorkerIcon` — silhouette simple (tête + épaules), style ligne fine, pour le chômage / la population active.
- `BriefcaseIcon` — mallette simple (rectangle + poignée), style ligne fine, pour les emplois créés.
(Réutilisation telle quelle de `ClockIcon` et `ExternalLinkIcon` existants pour la révision/le lien externe.)

## Règles
- Toujours réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn`/`cueFrame`/`AmbientBackground` de `shared.tsx`, `theme.ts` inchangés (copiés depuis f3/).
- Chaque révélation visuelle est calée sur `cueFrame(subtitles, index)` correspondant au moment exact où le narrateur prononce le point concerné — jamais un décalage de frame deviné. Les index de chunk ci-dessous dans le code seront vérifiés/ajustés après génération audio réelle (edge-tts groupe les mots différemment selon la voix), comme cela a été fait pour F3 round-4.
- Aucun terme anglais non traduit à l'écran, sauf noms propres d'outils externes (ex. "GDPNow", comme F3 gardait "CME FedWatch").
- Durée totale visée : sous 5 minutes.
- "Hachim" apparaît une seule fois, scène 03, comme protagoniste concret d'un exemple chiffré (lecture d'un rapport d'emploi) — pas de tagline de clôture "Hachim vérifie toujours..." en scène 05 (pattern rejeté).
