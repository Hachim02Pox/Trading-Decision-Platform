# Nuit du 2026-09-23 — vidéos Knowledge F6 à F13 (demande de Hachim)

Demande : « fais toutes les autres familles, 1 par 1, commit push ». Même style que F5 (validé),
voix Henri retravaillée (generate_audio.py phrase par phrase), tout le chapitre couvert, faits du
terminal vérifiés dans le code avant d'écrire la narration.

F12 n'a PAS de chapitre Knowledge (knowledgeMap.ts : « no dedicated F12 knowledge chapter exists
yet ») → pas de page vidéo possible. Familles à faire : F6, F7, F8, F9, F10, F11, F13.

## Outillage (tools/remotion)
- `new_family.py fN` : crée fN/ depuis la base F5 (ancien contenu → fN/_old-v3, node_modules =
  jonction vers f5/node_modules). Copier aussi props6/7/8/9 depuis une famille précédente si utiles.
- `fN/generate_audio.py` : lit `script/*-narration.fr.md`, écrit audio/, public/audio/, src/data/timeline.json.
- `fN/scripts/stills.mjs v1 all` + `scripts/grid.py v1 9` : images de contrôle → out/check/grid_*.jpg.
- `render_family.py fN slug` : rendu en 4 morceaux, port 3190, publie apps/frontend/public/videos/slug.mp4.
- `render_after.py fPrev fN slug` : attend « FPrev DONE » dans render-pipeline.log puis rend (file d'attente).
  Lancer toujours en détaché : PowerShell `Start-Process f5\.venv\Scripts\python.exe -ArgumentList ...`.

## Publication d'une famille (après « FN PUBLISHED » dans render-pipeline.log)
1. Vérifier le fichier (ffprobe durée vidéo/audio, silencedetect, 3-4 images extraites).
2. Ajouter l'entrée dans `apps/frontend/src/components/knowledge/KnowledgeChapterView.tsx` (FAMILY_VIDEO).
3. Écrire `fN/storyboard/fN-storyboard.md` (scènes + faits vérifiés dans le code).
4. Commit (seulement les fichiers de la famille + la vidéo du site + FAMILY_VIDEO) et push sur main.
   Ne pas commiter out/ (masters > 100 Mo). Terminer le message par la ligne Co-Authored-By.

## État
| Famille | Slug site | Narration/audio | Scènes + contrôle | Rendu | Publié/commit |
|---|---|---|---|---|---|
| F6 dollar | f6-dollar-change | ✅ 10m39 | ✅ | ✅ 23:28 (10m42) | ✅ 1c1b944 |
| F7 risque | f7-risque-credit-vol | ✅ 7m12 | ✅ | ✅ 00:23 (7m15) | ✅ (voir git log) |
| F8 liquidité | f8-liquidite-financement | ✅ 6m36 | ✅ | EN PAUSE (pas lancé) | — |
| F9 Trésor | f9-tresor-budget | ✅ 6m26 | ✅ | EN PAUSE (pas lancé) | — |
| F10 flux | f10-flux-positionnement | ✅ 13 scènes | ✅ (grilles vérifiées, 2 corrections) | EN PAUSE (pas lancé) | — |
| F11 options or | (pas encore de slug, proposé : f11-options-volatilite) | ✅ 13m52 (17 scènes) | scènes écrites + tsc OK, images de contrôle PAS faites | — | — |
| F13 événements | — | — | — | — | — |

## PAUSE demandée par Hachim (24/09 vers 0 h 20)
« Fais une pause, commit push les vidéos déjà prêtes, continue le reste quand je l'ordonne. »
- Arrêtés : files d'attente F8/F9/F10 (render_after tués), images de contrôle F11.
- F7 laissée finir (était sur son dernier morceau) puis commit/push.
- Pour reprendre : lancer en détaché `render_family.py f8 f8-liquidite-financement`, puis
  `render_after.py f8 f9 f9-tresor-budget`, `render_after.py f9 f10 f10-flux-positionnement`.
  F11 : `node scripts/stills.mjs v1 all` + `grid.py v1 9`, corriger, puis `render_after.py f10 f11 <slug>`.
  F13 : tout reste à faire (chapitre dans chaptersF12F13.ts, façade F13CalendarFace / EventFamilyFace).

## Faits terminal vérifiés (résumé)
- F6 : façade DXY (emphasis) / Today % / 5D %, lecture mécanique Favorable/Défavorable (dollar ↓ =
  favorable), combinée en un canal USD ; désaccord → Contextuel + « Les contributeurs mécaniques
  disponibles pointent dans des directions différentes. » USD State (deep, texte non affiché dans le
  détail). Source Yahoo (non officielle, lecture directe).
- F7 : façade VIX / MOVE / HY OAS, tout Contextuel. VIX + OAS via FRED. MOVE indisponible (NO_SOURCE,
  « — »), clic → /chart?instrument=MOVE ; dans le détail MOVE = « Cliquer pour voir » (tradingview).
  Détail : VIX 1D Δ, MOVE 1D Δ, HY OAS 1D Δ, IG OAS.
- F8 : façade Reserves (WoW Δ), TGA (Daily Δ), ligne « Financement : Normal/Anormal » (|SOFR−IORB| ≤ 5 pb).
  Détail : Reserves, TGA, Funding Microstate, SOFR-IORB, EFFR-IORB. Sources FRED (WRBWFRBL mercredi),
  Trésor (relevé quotidien), NY Fed (EFFR).
- F9 : famille événementielle → façade = « Prochains événements » (Next 2Y/5Y/10Y/20Y/30Y/TIPS Auction,
  « dans Xj »). Détail : Net Marketable Borrowing, Borrowing Est. Revision vs Prior (QRA Trésor),
  High Yield, Bid-to-Cover, Indirect Bidder Share (dernière adjudication 10 ans terminée). Pas de tail
  ni de prime de terme affichés. Tout Contextuel.
- F10 : façade spéciale F10ParticipationFace. Texte : « Le Managed Money CFTC et GLD sont deux canaux
  de positionnement observables. Ils ne représentent pas l'ensemble du marché de l'or. » + « F10 décrit
  le contexte… ce n'est pas un déclencheur d'exécution. » Section FUTURES — MANAGED MONEY CFTC :
  Managed Money Net % of OI, WoW Δ (pp), 156W Percentile ; États « État » (Ajout / Réduction d'exposition
  nette longue / Inchangé) et « Extension » (Long historiquement étendu / Historiquement léger / court /
  Zone médiane). Section ETF — SPDR GLD : GLD Holdings Δ (Tonnes), Change 5 obs., Change 20 obs.,
  60-obs. Flow Z (σ), 20-Obs. Flow Extension, GLD Price Return 20 obs. ; États Participation, Intensité
  du flux, Extension du flux, Prix / Flux. Bloc « Largeur de participation » (large / menée par les
  futures / menée par l'ETF / réduction large / mixte) + Futures Ajout/Réduction « Au {date} », ETF
  Expansion/Contraction · 5 obs. Mécanique : canal FUTURES_POSITIONING (Net % en variation, WoW Δ
  signe ; hausse = favorable) + canal ETF_FLOWS (holdings en variation, Δ tonnes signe) ; percentile et
  autres = contextuels. Sources : CFTC (dataset 72hh-3qpy), archive SPDR GLD (tonnes, pas la valeur $).
- F11 : façade « Options Or / Vol » = Gold Vol (GVZ) avec badge PROXY (infobulle « Gold options
  volatility / true Gold CVOL »), 1D Change, 5D Change (différences de niveau, arrondies à 0,1). Source FRED
  série GVZCLS, quotidienne, cache 15 min. Tout Contextuel (NOT_APPLICABLE). CVOL / skew / put-call non
  branchés (source payante). Graphiques : Gold / GVZ et VIX / GVZ.

## Reprise après compaction
Pour chaque famille : lire son script/*.md, afficher les sous-titres (timeline), écrire src/scenes/*.tsx
(voir f9/src/scenes/ScenesA.tsx/ScenesB.tsx comme modèle), index.ts, tsc, bundle, stills, grid, corriger,
puis `render_after.py <famille précédente> fN slug` en détaché. Surveiller render-pipeline.log pour
« PUBLISHED » puis faire la publication (section plus haut).
