# F3 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-22)

Même approche que F2 v4 (validée par Hachim le 2026-09-22), avec encore plus d'animation sur sa
demande : personnages (bonhommes animés, orateur de la Fed au pupitre), faucon et colombe aux
ailes battantes, graphiques qui se dessinent en direct, dominos, curseur de souris animé.
Source : `script/f3-narration.fr.md` v4. 1920×1080, 30 fps, ~10m54 (dont 3 s de pause finale).

Nouvelle infrastructure (en plus de `shared.tsx` copié de F2) :
- `src/scenes/characters.tsx` : `Beat` (séquences qui ne se chevauchent jamais), `Pop`, `Person`,
  `Bubble`, `FedSpeaker`, `Bird` (faucon/colombe), `LiveChart`, `Domino`, `Cursor`, icônes.
- `src/scenes/stage.tsx` : titre compact en haut à gauche + scène pleine largeur (corrige le
  défaut F2 où tout était calé à gauche avec la moitié droite vide).

| # | Scène | Couvre (chapitre F3) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | Hachim + alerte « taux inchangés », l'or qui bondit, foule de parieurs face à la Fed |
| 02 | `fed-basics` | Fondamentaux : taux directeur, fonction de réaction | Fed + 8 réunions, règle de la fourchette 4,00–4,25 %, cascade vers l'inflation, faucon vs colombe, « prévu » |
| 03 | `distribution` | Mécanique : distributions | 100 bonhommes qui votent 25/60/15, barres animées, 75 % de baisse, Hachim et le tampon FAUX, 40 % ailleurs |
| 04 | `path-repricing` | Trajectoire et variation | Escalier −1,00 → −0,65 dessiné en direct, écart −0,35, faucon |
| 05 | `surprise` | Transmission : l'exemple du statu quo | Orateur au pupitre, pari 70/30, jauge de surprise, deux discours → faucon / colombe |
| 06 | `transmission` | Transmission vers l'or + règles du terminal | 6 dominos (s'inversent en rouge avec le faucon), loupes « lien à vérifier », les 2 signaux mécaniques réels |
| 07 | `information-set` | L'ensemble d'information de la Fed | Frise en 4 étapes, graphique à points qui tombent, conférence, compte rendu « PASSÉ », prix en vagues |
| 08 | `mistakes-failures` | Erreurs et régimes d'échec | Donut 70/30, faucon ? colombe, 3 questions, 4 confirmations qui fusionnent, foule qui court vers le dollar |
| 09 | `terminal-usage` | Comment utiliser F3 dans le terminal | Maquette fidèle de la façade + tiroir + modale source externe, curseur animé |
| 10 | `glossary-flash` | Glossaire | Carrousel de 7 cartes qui pivotent, une illustration par terme |
| 11 | `recap` | Takeaways | 4 rappels, puis « Qu'est-ce que le marché attendait ? » |

## Vérifications faites dans le code (et écarts avec le chapitre écrit)
Le chapitre Knowledge F3 (`chaptersF1F3.ts`) est **en partie périmé** par rapport au code. La vidéo
suit le code, pas la prose :
- Façade (`F3FedFace.tsx`, libellés `fr.ts`) : **Cible** (borne basse–haute), **Prochaine** (fourchette
  la plus probable, libellé brut de la source, ex. « 3.75 - 4.00 »), **Probabilité** (veille → aujourd'hui
  quand disponible), ligne de fraîcheur, étiquette **Favorable / Défavorable / Contextuel**.
  Source : Fed Rate Monitor d'investing.com (`f3Fed.ts`), pas un calcul maison.
- Tiroir (`FamilyDrawerView.tsx`) : `Target Range (Lower)`, `Target Range (Upper)`,
  `Implied Path (6M)` et `Repricing (2W Δ)` en **INDISP.** avec « Cliquer pour voir » → modale qui ouvre
  cmegroup.com (`externalSourceLinks.ts`). Le chapitre dit à tort que le détail montre la distribution
  statu quo/−25/−50, la trajectoire à 6 mois et sa variation : ce n'est plus vrai (les clés i18n
  `f3.meetingDistributionHeading` existent mais aucun composant ne les utilise).
- Règles mécaniques (`backend/.../families/f3.ts`, `rules.ts`) : (1) la fourchette cible (baisse =
  favorable) ; (2) le mouvement attendu pondéré par les probabilités, comparé à la veille (plus de
  baisses qu'hier = favorable). Le chapitre parle encore de règles sur les probabilités −25/−50 pb,
  qui ont été retirées (`f3-dist-*` supprimés). La narration de la scène 06 a été réécrite en conséquence.

**À faire côté terminal (non fait, hors périmètre vidéo) :** mettre à jour les sections
« Transmission vers l'or » et « Comment utiliser F3 » du chapitre écrit pour refléter le code actuel.

## Règles de production
- Voix `fr-FR-DeniseNeural`, -2 %. Aucun anglais lu : faucon/colombe, « le marché revoit son pari »,
  « graphique à points », « l'outil de probabilités du groupe CME ». Les libellés anglais du tiroir
  sont affichés tels quels à l'écran (c'est ce que montre vraiment le terminal), jamais lus.
- Hachim protagoniste dans `intro`, `distribution` et `surprise` (la même alerte, fil rouge).
- Vérification : 37 images fixes inspectées avant le rendu complet, 7 corrigées puis revérifiées.
- Rendu + publication : `tools/remotion/render-and-publish.cmd` (processus détaché, journal dans
  `tools/remotion/render-pipeline.log`). Publie `apps/frontend/public/videos/f3-fed-anticipations.mp4`.
