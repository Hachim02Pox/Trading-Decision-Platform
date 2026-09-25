# F13 — Storyboard vidéo pédagogique (v4, première version, 2026-09-25)

Même pipeline que F5-F10 : voix Henri phrase par phrase, animations calées sur les mots exacts, tout
le chapitre Knowledge F13 couvert (`apps/frontend/src/content/knowledge/chaptersF12F13.ts`).
Source : `script/f13-narration.fr.md`. 1920×1080, 30 fps, 10 min 45 (14 scènes). Pas de version v3
antérieure. Accessoires repris de F10 (props6-9) et F11 (`dash.tsx` : CheckItem, Verdict, Flow).

| # | Scène | Couvre (chapitre F13) |
|---|---|---|
| 01 | `intro` | Hachim voit « inflation jeudi 8 h 30 » : un calendrier dit QUAND, pas QUOI ni la direction |
| 02 | `calendar` | Connu à l'avance (heure, identité) vs inconnu (résultat, surprise, ampleur, direction) ; fuseaux (New York / Québec 8 h 30, Paris 14 h 30), jours fériés, révisions |
| 03 | `importance` | Importance conditionnelle (consensus serré vs déclaration imprévue) ; la proximité change liquidité et couverture, pas la direction |
| 04 | `active` | Catalyseur actif : événement nommé, règle d'activation, fenêtre bornée ; réunion de la Fed en étapes (14 h décision / communiqué / projections / 14 h 30 conférence) ; AUCUN est un état valide |
| 05 | `surprise` | Réel − consensus avec définitions cohérentes, révisions, consensus = résumé ; référence Fed (décision, trajectoire, communication) ; même surprise ≠ même effet |
| 06 | `cpi-example` | Inflation sous-jacente 0,3 % vs 0,2 % attendu (hypothétique) → +10 pb ; vérifier F3, F2, F6 puis l'or ; Hachim protagoniste |
| 07 | `transmission` | Dominos : surprise → moins d'assouplissement → 2 ans et taux réels ↑ → dollar ↑ → pression sur l'or ; inversion avec un emploi faible ; chaque flèche à vérifier |
| 08 | `when-it-fails` | Peur de croissance, surprise déjà dans les prix, révisions, liquidité, choc de confiance (dollar et or montent) ; volatilité = risque de mouvement (rappel F11) |
| 09 | `scenario-tree` | Arbre avant un rapport sur l'emploi : hausse / baisse / proche du consensus ; ni ordres ni probabilités |
| 10 | `before-after` | Avant (horloge, canaux conditionnels), pendant (préliminaire / révisé / complet), après (F3, F2, F6, F7, puis l'or) ; garder les contradictions |
| 11 | `mistakes` | 3 pièges du chapitre |
| 12 | `terminal-usage` | Façade F13 (voir faits ci-dessous), réplique fidèle du composant |
| 13 | `glossary-flash` | Catalyseur, consensus, surprise, fenêtre active, transmission |
| 14 | `recap` | Les 3 points à retenir. « Ne devine jamais. Vérifie. » |

## Faits du terminal vérifiés dans le code

- La façade F13 est `F13CalendarFace.tsx` (FamilyModule renvoie ce composant pour F13 avant toute autre
  branche ; le commentaire qui parle d'`EventFamilyFace` pour F13 est périmé).
- Un jour à la fois, flèches « jour précédent / jour suivant », date au format court.
- Seulement les événements à fort impact (High) en dollar US (`COCKPIT_IMPACTS`, `COCKPIT_CURRENCIES`
  dans `apps/backend/src/real/f13Calendar.ts`, décision produit du 14/09/2026).
- Plusieurs événements le même jour : côte à côte ; chacun = nom + explication en langage simple
  (`f13EventExplanations.ts`), jamais de consensus / prévision / chiffre précédent.
- Messages : « Aucun événement high-impact USD ce jour-là. », « Calendrier indisponible. »,
  « Données non confirmées. ». Pas de KPI chiffré, pas d'état favorable / défavorable.
- Données : fournisseur de calendrier externe, ingestion au plus une fois par jour (table `macro_events`).
- Écart avec le chapitre écrit : le chapitre parle d'« au plus trois événements à venir » dans le
  cockpit et d'un catalyseur actif affiché ; la façade actuelle est la vue jour par jour et n'affiche
  pas le catalyseur actif. La vidéo suit le code et présente le catalyseur actif comme une notion.
- Dans la réplique de la façade, les noms d'événements (« Core CPI m/m », « CPI m/m ») sont un exemple ;
  les explications affichées sont les textes réels du code.

## Rendu

`python tools/remotion/render_family.py f13 f13-evenements-catalyseurs` (4 morceaux, port 3190), lancé le
25/09 à 2 h 04, publiée à 2 h 57 → `apps/frontend/public/videos/f13-evenements-catalyseurs.mp4`
(46 Mo, 10 min 48, son = image, aucun silence > 3 s).
