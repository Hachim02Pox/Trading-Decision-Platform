# F4 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-22)

Même approche que F3 v4 (validée par Hachim : « c'est comme je le voulais »), avec ses deux retours
intégrés : bug des bras des personnages corrigé (bras vers l'extérieur, dessinés devant le corps,
mains visibles) et nouvelle voix `fr-FR-HenriNeural` à vitesse normale (Denise jugée un peu robotique).
Source : `script/f4-narration.fr.md` v4. 1920×1080, 30 fps, ~11 min (dont 3 s de pause finale).

Nouveaux accessoires (`src/scenes/props.tsx`) : panier de courses, articles (pain, essence, maison,
avion, ciseaux, bœuf, poulet, santé, voiture), étiquette de prix, tasse de café fumante, ticket de caisse
qui s'imprime, compteur de vitesse, usine qui fume, camion, magasin, corde de tir à la corde, fenêtre
glissante de 12 mois.

| # | Scène | Couvre (chapitre F4) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | Café de Hachim 2,00 → 2,06 $, panier, ticket de caisse, un chiffre → deux chemins (or ↑ / or ↓) |
| 02 | `what-inflation` | Ce que mesure l'inflation | Panier qui se remplit, pluie d'étiquettes, « Indice 310 », compteur de vitesse, inflation / désinflation / déflation dessinées |
| 03 | `core-cpi` | Core CPI : construction et fonction | CPI (BLS), relevé des prix, poids, panier global vs sous-jacent (alimentation + énergie qui tremblent), rythmes des composantes, correction des saisons « RÉVISABLE » |
| 04 | `mom-yoy` | Unités, effets de base, surprises | Frise 13 mois, 310 → 310,93 = +0,30 %, 301,6 → ≈ 3,09 %, fenêtre de 12 mois qui glisse : 0,45 sort, 0,35 entre, 3,2 → 3,1 %, « CONTRASTÉE » |
| 05 | `pce-vs-cpi` | PCE contre CPI | Deux paniers (BLS / BEA), santé payée pour toi, Hachim passe du bœuf au poulet, cible 2 % sur le PCE global, calendrier CPI plus tôt / PCE plus tard |
| 06 | `ppi` | PPI et chaîne de production | Usine → camion → magasin → consommateur, 3 issues (marges, productivité, répercussion avec retard), catégories PPI → PCE |
| 07 | `annualized` | Tendance et annualisation | 3 mois prolongés sur 12, vraie formule construite (2,51 %) vs raccourci (2,48 %), graphe annualisé nerveux vs sur un an en retard |
| 08 | `two-channels` | Deux canaux inflation → or | Tir à la corde : équipe pouvoir d'achat vs équipe réaction de la banque centrale, l'or glisse selon le régime, « Contextuel » |
| 09 | `mistakes` | Erreurs | 5 pièges animés (désinflation ≠ déflation, mois ≠ an, jauges de surprise, F4 seul ?, une seule chaîne) |
| 10 | `terminal-usage` | Utilisation du terminal | Maquette fidèle façade + détail, curseur, sources BLS/BEA, consensus non affiché, réflexe F3/F2/F6/F13 |
| 11 | `glossary-flash` | Glossaire | Carrousel des 5 termes |
| 12 | `recap` | Takeaways | 4 rappels, « Ne devine jamais. Vérifie. » + tir à la corde |

## Vérifications faites dans le code
- Façade (`FamilyModule.tsx` → `DefaultContent`, `KpiMiniCell.tsx`) : KPI `visibility: "cockpit"` =
  Core CPI (MoM) mis en avant, Core CPI (YoY), Core PCE (MoM), Core PCE (YoY). Chaque carte : libellé,
  étiquette de lecture, ancienne valeur → valeur actuelle.
- Détail (`FamilyDrawerView.tsx`) : tous les `family.kpis`, dont les 5 « deep » : Headline CPI (MoM),
  Headline CPI (YoY), Headline PCE (YoY), Core CPI 3M Annualized, PPI Final Demand (MoM).
- Règles (`backend/.../mechanical/rules.ts`) : les 9 KPI F4 sont en mode `CONTEXTUAL` → « Contextuel »
  partout. Conforme au chapitre.
- Sources (`backend/src/real/f4Inflation.ts`) : BLS pour CPI et PPI, BEA pour PCE ; l'annualisé 3 mois
  est calculé par le terminal avec `((récent / il y a 3 mois)^4 − 1) × 100`, la formule du chapitre.
- Le consensus n'est pas affiché dans F4 : la narration le dit explicitement.

## Incidents de production
- La première génération audio a produit un `scene-01.mp3` vide et pas de `scene-06.mp3` alors que le
  script affichait des durées valides (probable coupure réseau du service de voix). Détecté quand le rendu a
  échoué au démarrage ; tout régénéré et chaque fichier validé avec ffprobe. À faire à chaque famille :
  vérifier les MP3 avec ffprobe avant de lancer le rendu.

## Publication
`tools/remotion/render-and-publish-f4.cmd` (processus détaché, journal `tools/remotion/render-pipeline.log`)
→ `apps/frontend/public/videos/f4-inflation.mp4` + poster, entrée F4 ajoutée dans `FAMILY_VIDEO`.

## Publication du 2026-09-22
Rendu terminé à 19 h 24 (master 165 Mo, 11:01, vidéo + audio). `npx` a renvoyé un code de sortie non nul
malgré un rendu réussi, donc le script a noté un faux échec ; publication faite à la main (49 Mo sur le
site, poster à 5 s) et 6 images vérifiées. Le script teste maintenant la présence du fichier au lieu du
code de sortie.

## Correctif du 2026-09-23
Le « faux échec » venait d'un octet de contrôle : un ancien `sed` avait transformé `out4` en caractère
saut de page, donc le test cherchait un fichier impossible. Réparé (`f5/scripts/fix_f4_cmd.py`) : le script
teste bien `out4-inflation.mp4`.
