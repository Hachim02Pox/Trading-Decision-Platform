# F5 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même approche que F3/F4 v4 (validées par Hachim) : tout le chapitre Knowledge F5 couvert, pas de
limite de durée, personnages, graphiques qui se dessinent, éléments qui « popent » au mot près.
Source : `script/f5-narration.fr.md`. 1920×1080, 30 fps, 12 min 34 (14 scènes, dont 3 s de pause finale).
L'ancienne version v3 (5 scènes) est archivée dans `_old-v3/` (rien supprimé).

## Ce qui change par rapport à F4

- **Voix moins robotique** (demande de Hachim) : toujours `fr-FR-HenriNeural` (seule option France
  sans clé payante), mais `generate_audio.py` ne lit plus une scène d'un bloc. Chaque phrase est
  synthétisée seule, coupée au ras de la parole, puis recollée avec des silences variables
  (≈0,4 s après une affirmation, ≈0,55 s après une question, ≈0,8-1 s aux marqueurs `[pause]` du
  script). Ensuite : un peu de chaleur (+2 dB sous 220 Hz), moins de brillance synthétique
  (-2,5 dB au-dessus de 6,5 kHz), compression douce, deux réflexions très faibles (petite pièce
  plutôt que silence numérique), normalisation -16 LUFS. Vitesse -4 %.
- **Échantillons de voix** : `python generate_audio.py --samples` produit le même passage (exemple
  du chômage avec Hachim) en 8 voix dans `out/voice-samples/` : Henri, Denise, Rémy, Vivienne,
  et les 4 voix « Copilot » multilingues (Andrew, Ava, Brian, Emma). Pour revoicer toute la vidéo :
  `python generate_audio.py --voice <nom>` puis re-rendu. Les animations suivent automatiquement.
- **Animations calées sur les mots exacts** : le timeline contient maintenant chaque mot (horodatage
  edge-tts). `makeCue(words)("trois conditions")` donne l'image où la phrase commence. Un mot
  introuvable fait planter le rendu au lieu de décaler une animation en silence.
- Nouveaux accessoires (`src/scenes/props5.tsx`) : baignoire stocks/flux animée, immeuble de bureaux,
  maison, porte-bloc, loupe, mallette, tracteur, nuage d'orage, jour férié, pancarte de grève,
  bouclier anti-fraude, livre de règles, tampon qui s'écrase, coche/croix qui se dessinent,
  jauge ISM centrée sur 50, machine à engrenages (modèle d'Atlanta), page de calendrier, rapport.

| # | Scène | Couvre (chapitre F5) | Visuels clés |
|---|---|---|---|
| 01 | `intro` | Accroche | Vendredi 8 h 30, le rapport tombe, l'or bondit puis chute, la Fed et ses deux bulles, économie réelle → Fed |
| 02 | `two-surveys` | Carte : 2 enquêtes, stocks et flux | Immeubles (employeurs) vs maisons (ménages), sorties de chaque enquête, courbes qui divergent « aucune n'est fausse », baignoire (niveau = stock, robinet = flux), taux = stock ÷ stock |
| 03 | `unemployment` | Chômage et participation | Fraction chômeurs ÷ population active, 3 conditions cochées (4 semaines), foule en emploi / cherche / hors calcul, Hachim qui passe de « hors population active » à « cherche », 5 silhouettes = 250 000 (100 000 en emploi, 150 000 cherchent), bonne vs mauvaise raison |
| 04 | `payrolls` | Créations d'emplois, révisions, moyenne 3 mois | 1 personne = 2 emplois, tracteur « EXCLU », échantillon d'employeurs à la loupe, « PROVISOIRE », mois révisés, exemple +190 000 vs 170 000 (Hachim content), révisions −35 000 / −25 000 qui tombent, −60 000, « CONTRASTÉ », moyenne 3 mois qui lisse mais se retourne en retard |
| 05 | `claims` | Inscriptions hebdomadaires | Semaines qui défilent, porte « assurance » (initiales), file avec allocations (continues), inscrits ≠ tous les chômeurs, 5 causes de pics (règles, férié, tempête, grève, fraude), moyenne 4 semaines, pic isolé vs hausse confirmée |
| 06 | `wages` | Gain horaire moyen | $ ÷ horloge, mois vs an, employeurs qui se disputent un candidat, inflation des services, 10 salariés (3×20 $, 7×30 $) : moyenne 27 → 30 $ sans augmentation, +4 % salaire − 3 % prix ≈ +1 %, 4 validations |
| 07 | `growth` | Croissance et pertinence monétaire | Machine PIB qui empile des pièces, « − inflation », « sort tard », 5 signaux partiels sur leurs calendriers, 3 régimes (forte / faible / contraction brutale → ruée vers le dollar) |
| 08 | `ism` | Indices de diffusion ISM | 10 directeurs d'achat avec panneaux ↑ → ↓, 30/40/30 → 30 + ½×40 = 50, jauge, piège « 49 ≠ −1 % », 48→49 et 55→52, industrie vs services « moyenne ? » barrée |
| 09 | `gdpnow` | Estimation d'Atlanta (GDPNow) | Machine à engrenages alimentée par les données, frise du trimestre, 3 « ce n'est pas » barrés, chiffre qui saute (commerce, stocks, consommation), 2,5 % annualisé ≈ 0,6 % par trimestre, « ~ estimée » |
| 10 | `gold-chain` | Transmission vers l'or et régimes | Rapport → or direct barré, dominos F3 → F2 → F6 → or, chaîne qui se rejoue à l'envers, « PAS UNE LOI », 3 exceptions (stress + dollar + ventes forcées, offre, taux réels), « F5 · Contextuel » |
| 11 | `mistakes` | Erreurs du chapitre | 5 panneaux, emplois ≠ personnes, pic / rapport / mise à jour ≠ tendance, ISM 49 ≠ −1 %, estimation ≠ prévision officielle (FAUX), titre sans révisions |
| 12 | `terminal-usage` | Workflow terminal | Maquette fidèle façade + détail, curseur, tilde, ancienne → nouvelle, « Contextuel », INDISP., « Cliquer pour voir », consensus absent, réflexe F3/F2/F6/F7/F13 |
| 13 | `glossary-flash` | Glossaire | Carrousel des 5 termes |
| 14 | `recap` | À retenir | 4 rappels + « Ne devine jamais. Vérifie. » |

Touche perso : Hachim est le protagoniste de deux exemples (il se met à chercher un emploi ; il lit
le titre +190 000), sans détail de profession ni de ville, sans phrase de conclusion « comme Hachim ».

## Vérifications faites dans le code (pour ne rien affirmer de faux)

- Façade (`FamilyModule.tsx` → `DefaultContent`, groupé par section) : KPI `visibility: "cockpit"` =
  **Unemployment Rate** et **Payrolls (Latest)** (section Emploi), **GDPNow** (section Croissance).
  Chaque cellule (`KpiMiniCell.tsx`) : libellé, étiquette RÉEL, « Contextuel », ancienne valeur →
  valeur actuelle (quand un relevé précédent existe), `~` pour une valeur estimée (`ProvenanceMark`).
- Détail (`FamilyDrawerView.tsx`) : encart « Impact sur l'or : Contextuel » (F5 n'a pas d'agrégation
  mécanique, `NOT_APPLICABLE_FAMILY_READ`), puis les 11 KPI dans l'ordre des fixtures.
- Sources (`backend/src/real/f5Employment.ts`) : BLS pour chômage (LNS14000000), créations
  d'emplois (CES0000000001), gain horaire (CES0500000003) ; FRED pour inscriptions (IC4WSA, ICSA,
  CCSA) et GDPNow. La moyenne 3 mois est calculée par le terminal (`derived`).
- Révision nette 2 mois : calculée seulement quand le même mois a été vu au moins 2 fois en base,
  sinon `INSUFFICIENT_HISTORY` → badge « INDISP. ». Jamais inventée.
- ISM Services / Manufacturing : `NO_SOURCE` + lien externe tradingeconomics.com → « Cliquer pour voir ».
- Règles (`mechanical/rules.ts`) : les 11 KPI F5 sont `CONTEXTUAL`.
- Consensus : effacé sur toute valeur réelle (`snapshotCache.ts`, `applyOverride`) → jamais affiché.
- Simplification assumée : dans la maquette, les étiquettes BLS / FRED à côté des lignes du détail sont
  des annotations de la vidéo. Dans le terminal, la source s'affiche quand on clique sur un chiffre
  (ligne « Source » du détail du KPI), pas dans la liste.

## Contrôle qualité

- Chaque MP3 de scène validé par ffprobe à la génération (le script s'arrête sinon).
- 70 images clés rendues (`scripts/stills.mjs`, un seul navigateur) et inspectées, puis deux séries de
  correctifs (`scripts/patch_v2.py`, `scripts/patch_v3.py`) : barres d'exemple qui sortaient du cadre,
  étiquette consensus sous un panneau, tampon qui masquait un texte, bulle sur des silhouettes,
  scènes sans visuel au début, éléments trop petits ou collés en haut, flèches avant leurs cartes,
  artefact de trait dans le glossaire.

## Publication

`tools/remotion/render-and-publish-f5.cmd` (processus détaché, journal `tools/remotion/render-pipeline.log`)
→ `apps/frontend/public/videos/f5-emploi-croissance.mp4` + poster, entrée F5 ajoutée dans `FAMILY_VIDEO`
(`KnowledgeChapterView.tsx`). Le succès est jugé sur la présence du fichier rendu (bug du script F4
corrigé : il testait `out4-inflation.mp4` au lieu de `out\f4-inflation.mp4`). Rien commité ni poussé.

## Publication du 2026-09-23 (et deux incidents de rendu)

1. Premier rendu (0 h 27) : échec vers la moitié. Le serveur de dev du terminal (Next.js) écoute le
   port 3000, que Remotion utilisait aussi pour servir l'audio → il recevait la page 404 du terminal.
   Correctif : `--port=3190`.
2. Deuxième rendu (0 h 56) : Chrome headless plante vers l'image 11 500 (même endroit qu'au premier
   essai). Le passage rendu seul fonctionne → saturation mémoire sur un long rendu, pas un bug de scène.
   Correctif : `render-and-publish-f5.cmd` rend maintenant 4 morceaux vidéo muets (navigateur neuf à
   chaque fois), l'audio une seule fois en WAV, puis recolle tout avec ffmpeg (concat sans ré-encodage
   de la vidéo + AAC 192 k).
3. Rendu en morceaux (11 h 42 → 12 h 58) : 0 plantage. Morceaux ≈ 13 min chacun, audio ≈ 24 min.

Contrôles sur le fichier publié (`apps/frontend/public/videos/f5-emploi-croissance.mp4`, 59 Mo) :
H.264 1920×1080 30 i/s + AAC, 754,3 s vidéo / 754,28 s audio, aucun silence de plus de 3 s
(silencedetect -45 dB), 16 images extraites dont les 3 raccords (189,9/190,1 s, 379,9/380,1 s,
569,9/570,1 s) : continuité correcte. Entrée F5 ajoutée dans `FAMILY_VIDEO`.

Défaut connu (non bloquant) : dans la scène terminal, la bulle « le même mois publié au moins 2 fois »
recouvre brièvement 2 lignes du détail (≈ 10 s). Correction possible en re-rendant seulement le
morceau 4 (frames 17100-22628) et en réutilisant `out/chunks/audio.wav`.
