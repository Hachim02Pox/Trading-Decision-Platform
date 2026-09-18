# F8 — Storyboard vidéo pédagogique (v1)

Source : `script/f8-narration.fr.md`. Résolution 1920×1080, 30 fps, même thème
sombre que F2-F6 (`src/theme.ts`, `scenes/shared.tsx`). Chaque scène révèle
ses éléments visuels au `cueFrame` exact du chunk de sous-titre qui les
mentionne — jamais un décalage de frame deviné, jamais deux éléments encore
inexpliqués affichés en même temps.

| # | Scène (id) | Visuels | Notes |
|---|---|---|---|
| 01 | `intro` | Bloc "Réserves bancaires" (icône réservoir) → équation simplifiée "Actifs Fed − Passifs hors réserves = Réserves" → chip TGA qui apparaît → exemple chiffré : TGA +120 Md$ → Réserves −120 Md$ (deux panneaux reliés par une flèche) | Nouvelle icône `ReservoirIcon` (cuve/robinet, pour la liquidité qui circule) |
| 02 | `funding-spreads` | Trois chips de taux (SOFR / EFFR / IORB) qui apparaissent un par un avec leur définition courte ; puis un panneau d'exemple : SOFR 5,37 % − IORB 5,40 % = −3 pb, avec une jauge/règle centrée sur zéro ; puis un second point à +12 pb avec une note "vérifier le calendrier" | Nouvelle icône `GaugeIcon` (jauge/aiguille, pour un écart autour d'un point neutre) |
| 03 | `trap-example` | Panneau "Piège" barré : "Baisse des réserves = resserrement" ; deux colonnes contrastées : "Rentrée fiscale saisonnière" vs "Vraie pénurie de collatéral" (même variation, causes différentes) ; puis rangée de 4 chips-canaux (Taux réels / Dollar / Risque de marché / Désendettement forcé) qui doivent être confirmés avant de relier F8 à l'or | Pas de mention Hachim ici : ce piège reste un exemple systémique (comparaison de deux causes), pas une histoire personnelle — voir décision ci-dessous |
| 04 | `terminal-usage` | Mini-carte F8 "au repos" : 2 lignes en emphase (Réserves WoW Δ / TGA Daily Δ) + légende microstate ("Financement : Normal") ; tiroir qui s'ouvre avec 4 lignes deep (Réserves niveau, TGA niveau, SOFR−IORB, EFFR−IORB) ; en bas, `RelationshipChip` figé sur "Contextuel" (jamais Favorable/Défavorable, contrairement à F6) ; pas de chip lien externe | Vérifié contre `f8Liquidity.ts`, `fixtures.ts` (~L699-790), `FamilyModule.tsx`'s `DefaultContent` (~L58-116), `rules.ts` (~L94-100, les 7 KPI F8 tous CONTEXTUAL), `externalSourceLinks.ts` (aucune entrée F8) |
| 05 | `recap` | 3 takeaways qui défilent, un par phrase de la narration | Pas de mention Hachim (aucune n'a été utilisée dans cette vidéo, voir décision ci-dessous), pas de tagline de clôture |

## Décision Hachim

Aucune mention de "Hachim" dans cette vidéo. F8 est un sujet de plomberie
monétaire (bilans, comptes de trésorerie, écarts de taux au jour le jour)
sans exemple d'achat personnel naturel comme la conversion or/euro de F6.
Forcer un "Hachim achète X" sur un écart SOFR-IORB ou une variation de TGA
aurait été artificiel — conforme à la consigne : zéro mention est acceptable
quand aucun moment naturel ne se présente.

## Règles
- Réutiliser `SceneContainer`/`Panel`/`Chip`/`fadeSlideIn`/`cueFrame`/`AmbientBackground` de `scenes/shared.tsx`, `theme.ts` inchangés (mêmes tokens que F2-F6 : bg `#05070a`, accent or `#c9a463`).
- Nouvelles icônes ajoutées à `shared.tsx`, même style ligne minimaliste colorée par token de thème : `ReservoirIcon` (cuve/robinet, liquidité qui circule), `GaugeIcon` (jauge centrée sur zéro, pour un écart de taux).
- Voix `fr-FR-DeniseNeural`, rate `-2%`, sous-titres en texte gras avec `textShadow`, sans encadré.
- Aucun terme anglais non traduit à l'écran ou à l'oral sans explication immédiate (TGA, SOFR, EFFR, IORB sont tous explicitement définis en français dès leur première mention, avant d'être réutilisés tels quels).
- Durée totale visée : sous 5 minutes.
