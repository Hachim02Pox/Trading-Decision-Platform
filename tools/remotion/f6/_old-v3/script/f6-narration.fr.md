# F6 — USD / Change (v1)
## Narration française — pauses naturelles, faits terminal vérifiés

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

Faits terminal vérifiés avant l'écriture de la scène 04 (terminal-usage) :
- `apps/backend/src/real/f6Currency.ts` : F6 lit directement le DXY (ICE US
  Dollar Index) via le point de terminaison graphique public de Yahoo
  Finance (symbole `DX-Y.NYB`), non officiel/non documenté, sans clé requise.
  Ce n'est pas le flux ICE sous licence. Aucun repli silencieux : si la
  lecture échoue, les 4 KPI F6 passent UNAVAILABLE plutôt que de revenir à
  une ancienne reconstruction à 6 devises FRED (désormais désactivée).
- `apps/backend/src/mock/fixtures.ts` (lignes ~548-610) : la carte F6 au
  repos ("cockpit") montre exactement 3 chiffres — DXY (niveau, ex. 104,62),
  Today % (ex. -0,18 %), 5D % (ex. +0,42 %). Le 4e KPI, "USD State" (ex.
  "Divergent: weaker intraday, firmer over 5 days"), a été retiré du cockpit
  (Milestone 1D) et n'est visible qu'en ouvrant le tiroir de la famille.
- `apps/frontend/src/components/market/FamilyModule.tsx` : F6 n'a pas de
  visage dédié (pas de fichier F6*.tsx dans components/market) — il tombe
  dans `DefaultContent`, le rendu générique partagé par les familles sans
  face sur mesure. Ça affiche les KPI cockpit groupés, puis en pied de
  carte un `RelationshipChip` (Favorable / Défavorable / Contextuel,
  `apps/frontend/src/i18n/fr.ts`) qui vient de la lecture mécanique F6→or
  (`apps/backend/src/intelligence/mechanical/rules.ts` : DXY qui baisse =
  favorable à l'or, DXY qui monte = défavorable ; "USD State" est purement
  contextuel).
- `apps/frontend/src/content/externalSourceLinks.ts` : aucune entrée pour
  F6 — contrairement à F3 (lien CME FedWatch), F6 ne renvoie vers aucune
  ressource externe. Tout ce qui est montré vient d'une lecture directe,
  affichée dans le terminal lui-même.

## SCENE 01 — id: intro
Sur le marché des devises, chaque prix est un rapport entre deux monnaies... jamais un chiffre isolé. Quand on dit EURUSD à 1,10... ça veut dire qu'un euro s'achète avec 1 dollar 10. Si ce chiffre monte, c'est l'euro qui se renforce face au dollar. S'il baisse, c'est le dollar qui devient plus fort. Mais le dollar lui-même, comment on mesure s'il est fort ou faible dans l'ensemble ? Dans le terminal, F6 répond à ça avec un indice qui résume la force du dollar face à plusieurs autres monnaies à la fois.

## SCENE 02 — id: dxy-explained
Ce dollar résumé, dans le terminal, on l'appelle le DXY. C'est un indice qui compare le dollar à six autres monnaies en même temps... l'euro, le yen japonais, la livre sterling, le dollar canadien, la couronne suédoise et le franc suisse. Mais attention, ce n'est pas une simple moyenne. L'euro pèse beaucoup plus lourd que les cinq autres réunis. Résultat... si le dollar grimpe fort face à l'euro, mais recule un peu face au yen et au dollar canadien, l'indice peut quand même monter. Il reflète surtout ce qui se passe face à l'euro. Le terminal affiche trois chiffres pour ce DXY... son niveau, par exemple 104,62... sa variation du jour, disons moins 0,18 %... et sa variation sur cinq jours, plus 0,42 % ici. Ces deux pourcentages peuvent aller dans des sens opposés, et ce n'est pas une erreur... le dollar peut s'affaiblir aujourd'hui, tout en restant plus fort qu'il y a cinq jours. Et cette lecture vient directement d'une source publique gratuite, pas du flux officiel payant... donc fiable, mais bon à savoir.

## SCENE 03 — id: trap-example
Voici le lien entre dollar et or. Parce que l'or est coté en dollars... quand le dollar se renforce, il faut mécaniquement moins de dollars pour que l'or garde la même valeur pour un acheteur hors des Etats-Unis. Imaginons... Hachim veut acheter une once d'or, à 2400 dollars, et il raisonne en euros. Au taux de 1,10 dollar pour un euro, cette once lui coûte environ 2182 euros. Maintenant, l'euro s'affaiblit, et il faut 1,05 dollar pour un euro. Le prix en dollars de l'or, lui, n'a pas bougé... toujours 2400 dollars. Mais pour Hachim, en euros, la même once coûte maintenant environ 2286 euros... presque 5 % de plus, juste à cause du taux de change. Voilà le piège classique... penser qu'un dollar fort, c'est toujours mauvais pour l'or, un point c'est tout. En réalité, l'or et le dollar peuvent aussi monter ensemble, en cas de peur sur les marchés. Et l'or peut résister à un dollar fort si les taux réels baissent, ou si la demande physique reste forte. Le lien entre les deux, c'est une tendance observée, pas une loi absolue.

## SCENE 04 — id: terminal-usage
Dans le terminal, la carte F6 reste simple... le niveau du DXY, sa variation du jour, et sa variation sur cinq jours, affichés directement, sans rien ouvrir. En cliquant sur la carte, un tiroir s'ouvre avec une lecture plus détaillée... par exemple, un état du dollar qui dit "divergent, plus faible aujourd'hui, plus fort sur cinq jours", comme dans notre exemple. En bas de la carte, une étiquette de couleur résume le lien mécanique avec l'or, à cet instant... favorable, défavorable, ou contextuel, quand aucun verdict clair ne se dégage. Contrairement à d'autres familles du terminal, ici, pas besoin d'aller voir ailleurs... tout vient d'une lecture directe, affichée dans le terminal lui-même.

## SCENE 05 — id: recap
Pour résumer. Un taux de change est toujours un rapport entre deux monnaies, jamais un chiffre isolé. Le DXY résume le dollar face à six monnaies, avec l'euro qui pèse le plus lourd... ce n'est pas toute la force du dollar dans le monde. Et un dollar fort ne veut pas dire un or en baisse automatique... c'est un lien mécanique, conditionnel, jamais une règle fixe.
