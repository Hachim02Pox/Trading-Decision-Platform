# F6 — Storyboard vidéo pédagogique (v1)

Source : `script/f6-narration.fr.md`. Résolution 1920×1080, 30 fps, même thème
sombre que F2/F3 (`src/theme.ts`, `scenes/shared.tsx`). Chaque scène révèle
ses éléments visuels au `cueFrame` exact du chunk de sous-titre qui les
mentionne — jamais un décalage de frame deviné, jamais deux éléments encore
inexpliqués affichés en même temps.

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Paire EURUSD affichée comme un ratio ("1 EUR = 1,10 USD"), flèche vers le haut/bas selon devise de base/cotation, puis teasing du DXY (un badge "DXY" qui apparaît en dernier) | Icône `CurrencyPairIcon` (deux disques qui s'échangent) |
| 02 | `dxy-explained` | Panier de 6 chips devise (EUR, JPY, GBP, CAD, SEK, CHF), EUR visuellement plus large/plus lourd que les 5 autres ; puis 3 lignes façade DXY (Niveau 104,62 / Today % -0,18 / 5D % +0,42) qui apparaissent au fil de la narration | Reprend le pattern `FaceRow` de F3 (`TerminalUsage.tsx`) pour la façade, mais ici dans la scène pédagogique, pas la scène terminal |
| 03 | `trap-example` | Bloc "Or coté en dollars" → exemple Hachim : deux colonnes comparant "1,10 $/€ → ~2182 €" et "1,05 $/€ → ~2286 €" (le prix en $ ne bouge pas, affiché en commun au-dessus) ; puis un panneau "Piège" barré suivi de deux contre-exemples (Favorable: or+dollar montent ensemble / Favorable: or résiste, taux réels baissent) | Seule apparition de "Hachim", comme protagoniste concret d'un exemple chiffré (cf. standard F2) ; `GoldIcon` sur le bloc prix or |
| 04 | `terminal-usage` | Reprend l'exact rendu générique `DefaultContent` : mini-carte F6 avec 3 lignes (DXY / Today % / 5D %), puis un tiroir qui s'ouvre révélant "USD State: Divergent..." ; en bas, `RelationshipChip` avec les 3 états possibles (Favorable vert / Défavorable rouge / Contextuel jaune) qui se surligne sur celui actif ; pas de chip lien externe (F6 n'en a pas, contrairement à F3) | Vérifié contre `FamilyModule.tsx` (`DefaultContent`), `fixtures.ts` (KPI ids `f6-dxy-recon-*`, `f6-usd-state`), `rules.ts` (mapping SUPPORTIVE/ADVERSE/CONTEXTUAL), et `externalSourceLinks.ts` (aucune entrée F6) |
| 05 | `recap` | 3 takeaways qui défilent, un par phrase de la narration | Pas de mention Hachim ici (déjà utilisée une fois en scène 03), pas de tagline de clôture |

## Règles
- Réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn`/`cueFrame`/`AmbientBackground` de `scenes/shared.tsx`, `theme.ts` inchangés (mêmes tokens que F2/F3 : bg `#05070a`, accent or `#c9a463`).
- Nouvelles icônes ajoutées à `shared.tsx`, même style ligne minimaliste colorée par token de thème : `CurrencyPairIcon` (échange de deux devises), `GoldIcon` (once/lingot, réutilisable si une famille future en a besoin).
- Voix `fr-FR-DeniseNeural`, rate `-2%`, sous-titres en texte gras avec `textShadow`, sans encadré.
- Aucun terme anglais non traduit à l'écran ou à l'oral sans explication immédiate (DXY est explicitement défini dès sa première mention comme "un indice qui résume la force du dollar face à six autres monnaies").
- Durée totale visée : sous 5 minutes.
