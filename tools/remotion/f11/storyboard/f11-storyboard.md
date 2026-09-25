# F11 — Storyboard vidéo pédagogique (v5, 2026-09-24 : version longue « de zéro à la carte GEX »)

Demande de Hachim (24/09) : « aucune idée sur les options… comment les lire, les utiliser, les intégrer
dans mon trading… une vidéo même d'une heure s'il le faut, plein d'exemples, vulgarisation », à partir
de ses captures d'écran d'un tableau GEX sur GLD (24 sept. 2026, 11 h 29 heure de New York).

Pipeline F5 (voix Henri phrase par phrase, animations calées sur les mots exacts via `makeCue`).
Source : `script/f11-narration.fr.md` (45 scènes, ~11 300 mots, 72 min 32). La v4 (17 scènes, 13 min 52,
jamais publiée) est sauvegardée dans `storyboard/f11-narration.v4.md.bak` ; 11 de ses scènes sont
reprises mot pour mot (mêmes animations) : basics, calls-puts, premium-strike, realized-vol, greeks,
skew-term, event-risk, open-interest, hedging, gvz-cvol, terminal-usage.

Nouveaux fichiers : `src/scenes/dash.tsx` (reconstitution du tableau : cartes, graphique GEX par prix
d'exercice, profils vanna / charme, DEX, bougies GLD, + accessoires : route sèche / verglacée, échelle
de prix animée, flèches d'ordres, glaçon, bureau du teneur de marché, maison, voiture-assurance,
courbe de gains, grille de 100 parts), `ScenesC.tsx` (partie 1), `ScenesD.tsx` (partie 2),
`ScenesE.tsx` (partie 3), `ScenesF.tsx` (partie 4). Couleurs ajoutées au thème : violet, ambre,
bleu de bascule, glace.

## Publication en 4 parties (limite GitHub de 100 Mo par fichier)

| Partie | Scènes | Contenu |
|---|---|---|
| 1 · Les options de zéro | 01-17 | intro, analogie maison / assurance, contrat, achat GLD 395 (point mort 402, 4 scénarios), vente 380 comme assurance, prime et prix d'exercice, dans / à / hors de la monnaie, volatilité implicite (bande 367-412), réalisée, delta, gamma, thêta + véga, vanna + charme, asymétrie et structure par terme, risque d'événement |
| 2 · Qui est en face | 18-24 | intérêt ouvert, teneurs de marché (bureau de change), couverture en delta, gamma + (amortisseur), gamma − (accélérateur), la convention des sites (hypothèse, pas mesure), calcul d'une barre |
| 3 · Lire le tableau du 24 sept. | 25-34 | cartes (242K − 571K = −329K, murs 390/390), barres par prix d'exercice, courbes jaune / violette et lignes pointillées, bascule 394,84, murs et aimant d'échéance, vanna, charme, DEX, bougies, relecture critique du texte de l'IA |
| 4 · Dans ton trading | 35-45 | conversion GLD → or, 4 étages (pourquoi / comment / où / quand), scénario baissier, scénario de reprise, scénario « rien ne se passe », routine en 7 étapes avec le journal, 9 pièges, GVZ / CVOL, façade F11 du terminal, glossaire, récap |

## Chiffres et vérifications

- Chiffres du tableau repris tels quels des captures : prix 389,51, gamma −γ, net −329K, total achat
  242K, total vente 571K, murs 390 / 390, bascule 394,84, échéances 24 / 25 sept. et 16 oct., vanna
  (V-Flip 375,1, 405 / 385 / 355, ratio 0,86), charme total −10,7M, DEX −1,88 G$, D-Flip 394,4, texte IA
  (−171K à 390, vanna −35K, −61K vers 385).
- Les barres par prix d'exercice sont une reconstitution pédagogique, calée pour que les totaux
  tombent exactement sur les chiffres ci-dessus (achat 242, vente 571, 390 net −171).
- Exemples d'options calculés avec Black-Scholes (GLD 389,51, volatilité 20 %, 30 j, taux 4 %) :
  achat 395 ≈ 7,02 ; achat 390 ≈ 9,30 (delta 0,53, gamma 0,018, thêta −0,17/j, véga 0,44 ; 11,52 à 25 %) ;
  achat 380 ≈ 15,19 ; achat 400 ≈ 5,16 ; vente 380 ≈ 4,43. Gamma à la monnaie : 0,018 (30 j), 0,044 (5 j),
  0,097 (1 j). Vente 380 à 25 % : delta −0,33 (30 j), −0,31 (20 j), −0,19 (5 j), −0,03 (1 j) ; −0,28 à 18 %.
- Honnêteté sur les limites, dites dans la vidéo : la position des teneurs de marché n'est jamais
  observée (convention) ; GLD n'est qu'une tranche du marché des options sur l'or ; la « bascule de la
  vanna » du site (375,1) ne coïncide pas avec le passage à zéro de la courbe (~390) ; le signe du
  charme dépend de la convention du site ; le texte de l'IA contient une contradiction (achat dans la
  baisse en gamma négatif) et une interprétation discutable (baisse de la volatilité = baisse du prix).
- Conversion GLD → or illustrée avec un or hypothétique à 4 250 $ (rapport 10,91), présenté comme tel.
- Journal du terminal : vérifié qu'un trade a un champ de notes (`journalClient.ts`, `notes`).
- Façade F11 du terminal (scène v4 reprise) : GVZ avec badge PROXY, variations 1 j et 5 j, source FRED
  GVZCLS, tout contextuel ; CVOL / asymétrie / rapport vente-achat non branchés.

## Rendu

`python tools/remotion/render_parts.py F10 f11 f11-options-volatilite "1-17:…" "18-24:…" "25-34:…" "35-45:…"`
(attend la fin de F10, rendu en morceaux, puis 4 fichiers web `f11-options-volatilite-p1..p4.mp4`).
Publiée le 24/09 à 21 h 57 : parties de 24,4 / 10,5 / 20,1 / 17,8 min (71 / 32 / 59 / 51 Mo), son = image, aucun silence > 3 s.
