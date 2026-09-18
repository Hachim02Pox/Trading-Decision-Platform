# F8 — Liquidité et financement (v1)
## Narration française — pauses naturelles, faits terminal vérifiés

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

Faits terminal vérifiés avant l'écriture de la scène 04 (terminal-usage) :
- `apps/backend/src/real/f8Liquidity.ts` : les réserves lisent la série FRED
  `WRBWFRBL` ("Wednesday Level", un vrai niveau ponctuel — pas `WRESBAL`, une
  moyenne hebdomadaire trop lissée pour une vraie variation semaine sur
  semaine). Le TGA lit directement le Daily Treasury Statement du Trésor
  américain (`dts/operating_cash_balance`), pas un proxy FRED. SOFR et IORB
  viennent tous les deux de FRED (une seule source). EFFR vient de la Fed de
  New York, IORB de FRED (deux sources combinées pour l'écart EFFR-IORB).
  Aucun repli silencieux : un échec de lecture fait passer les KPI concernés
  en UNAVAILABLE.
- `apps/backend/src/mock/fixtures.ts` (~L699-790) : au repos ("cockpit"), la
  carte F8 met en avant seulement deux variations avec emphase — la
  variation des réserves sur une semaine (`f8-reserves-wow`) et la variation
  du TGA d'un jour sur l'autre (`f8-tga-daily`). Le niveau total des
  réserves, le niveau du TGA, et les deux écarts en points de base
  (SOFR-IORB, EFFR-IORB) sont "deep" — visibles seulement dans le tiroir,
  après un clic.
- `apps/frontend/src/components/market/FamilyModule.tsx` (`DefaultContent`,
  ~L58-116) : F8 n'a pas de visage dédié, comme F6 — il tombe dans le rendu
  générique. Mais ce rendu générique a un cas spécial pour F8 : le KPI brut
  "Funding Microstate" n'est jamais affiché comme une ligne de chiffre ; il
  est remplacé par une simple phrase de légende, "Financement : Normal" ou
  "Financement : Anormal" (`apps/frontend/src/i18n/fr.ts` L295-296), selon
  que l'écart SOFR-IORB reste ou non dans un seuil de ±5 points de base
  (`FUNDING_ANOMALY_THRESHOLD_BPS` dans `f8Liquidity.ts`).
- `apps/backend/src/intelligence/mechanical/rules.ts` (~L94-100) : les SEPT
  KPI de F8 sont tous en mode `CONTEXTUAL` — aucun n'est SUPPORTIVE ni
  ADVERSE. Contrairement à F6, l'étiquette de pied de carte
  (`RelationshipChip`) affiche donc toujours "Contextuel"
  (`apps/frontend/src/i18n/fr.ts` L230), jamais "Favorable" ni "Défavorable".
- `apps/frontend/src/content/externalSourceLinks.ts` : aucune entrée pour
  F8 — comme F6, aucun lien externe à cliquer ; tout vient d'une lecture
  directe affichée dans le terminal.

## SCENE 01 — id: intro
Les banques déposent une partie de leur argent directement à la banque centrale américaine, la Fed... on appelle ça les réserves. Ces réserves, c'est un peu le carburant du système bancaire... plus il y en a, plus le crédit et les marchés peuvent circuler sans friction. Le montant total de réserves dépend surtout de deux choses... ce que la Fed détient à son bilan, et ce qu'elle doit reverser ailleurs. Parmi ces "ailleurs", il y a le compte que le Trésor américain garde lui-même à la Fed... un peu comme un compte courant pour l'État, qu'on appelle simplement le TGA. Quand les impôts rentrent, ou quand l'État emprunte, cet argent atterrit sur le TGA... et sort, provisoirement, des réserves bancaires. Un exemple concret... si le TGA grimpe de 120 milliards de dollars pendant que tout le reste du bilan de la Fed ne bouge pas, les réserves du système bancaire baissent d'environ 120 milliards, presque au dollar près. Ce n'est pas un chiffre isolé à surveiller... c'est un système de bilans qui s'équilibrent entre eux. Et c'est précisément ce que la famille F8 du terminal surveille.

## SCENE 02 — id: funding-spreads
Pour savoir si l'argent circule facilement d'une banque à l'autre au jour le jour, le terminal regarde plusieurs taux courts. Le premier taux est garanti par des obligations d'État mises en pension, ce qu'on appelle le collatéral... on l'appelle SOFR. Le deuxième est un taux non garanti, entre banques qui se prêtent leurs réserves... on l'appelle EFFR. Le troisième n'est pas vraiment un taux de marché... c'est le taux que la Fed elle-même verse aux banques sur leurs réserves, l'IORB, un peu comme un taux plancher de référence. Ce qui compte vraiment, c'est l'écart entre ces taux de marché et ce plancher. Exemple... si SOFR fixe à 5,37 % et que l'IORB est à 5,40 %, l'écart vaut moins 3 centièmes de point, ce qu'on appelle moins 3 points de base. Un écart proche de zéro, c'est un marché qui respire normalement. Si un jour cet écart grimpe brutalement à plus 12 points de base, il faut d'abord vérifier s'il y a un effet de fin de trimestre ou de règlement avant de crier au stress... beaucoup de ces sauts sont juste calendaires, pas une vraie pénurie de liquidité.

## SCENE 03 — id: trap-example
Voici le piège classique avec la liquidité... croire qu'une baisse des réserves veut toujours dire un resserrement sévère, de la même ampleur à chaque fois. En réalité, une baisse de 120 milliards liée à une simple rentrée d'impôts saisonnière n'a rien à voir avec une baisse liée à une vraie pénurie de collatéral. Même chose pour le TGA... un TGA plus haut ou plus bas n'est pas automatiquement une bonne ou une mauvaise nouvelle pour l'or. Pour que ça compte vraiment, il faut un pont observable... est-ce que les taux réels bougent, est-ce que le dollar bouge, est-ce que le risque sur les marchés change, ou est-ce que des investisseurs sont forcés de vendre pour se refinancer. Sans un de ces canaux visible au même moment, une variation de réserves ou de TGA reste... de la plomberie interne, sans lien direct avec le prix de l'or.

## SCENE 04 — id: terminal-usage
Dans le terminal, la carte F8 ne montre pas tout d'un coup. Au repos, elle affiche seulement deux variations mises en avant... la variation des réserves sur une semaine, et la variation du TGA d'un jour sur l'autre. En dessous, une simple phrase résume l'état du financement... "Financement : Normal", ou "Financement : Anormal" si l'écart dont on parlait dépasse le seuil retenu par le terminal. En cliquant sur la carte, un tiroir s'ouvre avec le détail complet... le niveau total des réserves, le niveau du TGA, et les deux écarts en points de base, SOFR moins IORB et EFFR moins IORB. En bas de la carte, l'étiquette qui résume le lien avec l'or affiche toujours "Contextuel"... jamais favorable, jamais défavorable. Contrairement à d'autres familles du terminal, F8 ne donne jamais de verdict mécanique direct sur l'or, seulement du contexte. Et toutes ces données viennent d'une lecture directe... la Fed de New York, une base de données publique de la Réserve fédérale, et le Trésor américain... jamais un lien externe à aller consulter ailleurs.

## SCENE 05 — id: recap
Pour résumer. La liquidité n'est pas un chiffre unique... c'est un système de bilans qui s'équilibrent, entre les réserves bancaires, le TGA, et les autres passifs de la Fed. Un écart de financement ponctuel, lié au calendrier, n'a rien à voir avec une vraie rareté persistante de collatéral. Et la liquidité n'agit sur l'or que de façon indirecte et conditionnelle... à travers les taux réels, le dollar, ou le risque de marché... jamais comme un lien mécanique direct.
