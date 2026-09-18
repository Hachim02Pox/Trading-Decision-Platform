# F4 — Storyboard vidéo pédagogique (v1)

Suit exactement le standard validé F2/F3 : résolution 1920×1080, 30 fps, thème
sombre partagé (`src/theme.ts`, `src/scenes/shared.tsx` — mêmes tokens que
F3, copiés tels quels). Source narration : `script/f4-narration.fr.md`.
Source de contenu : `apps/frontend/src/content/knowledge/chaptersF4F6.ts`
(chapitre F4).

## Faits terminal vérifiés (scène 04)

- `apps/frontend/src/components/market/FamilyModule.tsx` : F4 n'a pas de
  façade dédiée (pas de fichier `F4Face.tsx`, contrairement à F2/F3). Le
  routeur `FamilyContent` ne matche ni `F13`, ni `isEventOnly`, ni `F3`, ni
  `F2`, ni `F10` pour `familyId === "F4"` → il tombe dans le
  `DefaultContent` générique : KPI groupés par section, cases cliquables
  (`KpiMiniCell`), badge `RelationshipChip` en pied de carte.
- `apps/backend/src/mock/fixtures.ts` (F4 block) : 4 KPI en visibilité
  `"cockpit"` → `f4-core-cpi-mom` (emphase, avec `consensus`/`previous`/
  `surprise: "inline"`), `f4-core-cpi-yoy`, `f4-core-pce-mom` (avec
  `consensus`/`previous`/`surprise: "inline"`), `f4-core-pce-yoy`. 5 KPI en
  visibilité `"deep"` (dans le tiroir, pas sur la façade) →
  `f4-headline-cpi-mom`, `f4-headline-cpi-yoy`, `f4-headline-pce-yoy`,
  `f4-core-cpi-3m-ann`, `f4-ppi-final-demand`.
- `apps/backend/src/real/f4Inflation.ts` (top-of-file) : CPI/PPI viennent de
  BLS, PCE vient de BEA — tout est `dataState: "REAL"` en usage normal (pas
  de lien externe requis, contrairement à F3/CME FedWatch). Le fichier ne
  fabrique plus de faux évènement `nextEvents` (liste vide explicite).
- `apps/backend/src/intelligence/mechanical/rules.ts` : toutes les entrées
  `"f4-*"` sont en `mode: "CONTEXTUAL"`, `supportiveDirection: null` — F4 ne
  colore jamais la carte (`CARD_TINT_CLASS`) ni n'affiche de flèche
  directionnelle, contrairement à des familles à canal unique. Le
  `RelationshipChip` reste donc toujours neutre/contextuel pour F4.
- Conclusion pour la scène : façade = 4 chiffres Core cliquables (avec
  attendu/précédent/résultat), tiroir = CPI global + PPI + tendance 3 mois,
  jamais de badge coloré. Aucun lien externe à représenter pour F4.

## Table des scènes

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Titre + deux blocs opposés : "Valeur refuge → soutient l'or" (contour plein, positif) vs "Réaction de la banque centrale → pèse sur l'or" (contour pointillé, négatif, léger pulse) | Pose le paradoxe central de F4 avant toute définition technique |
| 02 | `headline-vs-core` | Haut : panel "CPI global" (toutes catégories) vs panel "Core CPI" (alimentation + énergie barrées) + petite mention PCE. Bas : icône panier de courses (`BasketIcon`, nouvelle), exemple Hachim avec deux chiffres qui apparaissent au bon cue — "+0,3 % (mensuel)" puis "+3 % (annuel)" | Seule apparition de "Hachim", comme protagoniste concret de l'exemple MoM vs YoY, avec de vrais chiffres — aucune tagline de clôture |
| 03 | `trap-example` | Frise : "0,20 % (mois précédent)" → "0,35 % (ce mois)" avec flèche montante (accent) ; en parallèle "3,2 % → 3,1 %" avec flèche descendante (context) ; panel d'explication "effet de base : un mois à 0,45 % sort de la fenêtre de 12 mois" | Reprend l'exemple chiffré exact du chapitre (cooling YoY, firmer month) |
| 04 | `terminal-usage` | Panel "FAÇADE F4" : 4 lignes cliquables (Core CPI MoM, Core CPI YoY, Core PCE MoM, Core PCE YoY), la première avec un mini-badge "attendu / précédent". Panel "EN PROFONDEUR" : CPI global, PPI, tendance 3 mois annualisée. Chip neutre en bas : "Toujours contextuel — jamais de badge coloré" | Reflète exactement `DefaultContent` + `RelationshipChip` CONTEXTUAL, aucun lien externe (différent de F3) |
| 05 | `recap` | 3 takeaways qui défilent, style F3 `Recap.tsx` | Pas de tagline "Hachim vérifie toujours..." — pattern explicitement rejeté |

## Règles (reprises de F2/F3, inchangées)

- Toujours réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn`/`cueFrame`
  de `scenes/shared.tsx`, `theme.ts` inchangé (bg `#05070a`, accent
  `#c9a463`).
- `AmbientBackground` rendu une seule fois dans `F4Video.tsx`, jamais par
  scène.
- Chaque révélation visuelle est calée sur `cueFrame(subtitles, index)` —
  jamais un décalage de frame deviné. Les index exacts sont fixés après
  génération de `audio/timeline.json` par `generate_audio.py` (le découpage
  réel dépend des `WordBoundary` d'edge-tts, pas du texte source).
- Voix `fr-FR-DeniseNeural`, débit `-2%`, sous-titres en `Subtitles.tsx`
  (texte gras + `textShadow`, jamais de fond/bordure).
- Aucun terme anglais non traduit à l'écran (pas de "headline"/"core"/"MoM"/
  "YoY" bruts sans explication — dire "chiffre global", "Core [nom]",
  "rythme mensuel", "rythme annuel"). CPI/PCE/PPI sont conservés tels quels
  (identifiants propres de statistiques américaines nommées, même logique
  que la conservation de "Fed" / "CME FedWatch" dans F2/F3).
- Icône nouvelle : `BasketIcon` (panier de courses, style ligne minimaliste,
  couleurs theme) — utilisée uniquement dans `headline-vs-core`, pour
  incarner "ce que les gens paient vraiment". Pas d'icône forcée dans
  `trap-example` (juste des chiffres/comparaisons, comme F2/F3's TrapExample).
- Durée totale visée : sous 5 minutes.
