# F7 — Risque, crédit et volatilité (v4, 2026-09-23)
## Narration française — couvre l'intégralité du chapitre Knowledge F7

Pipeline F5 (phrase par phrase, pauses variables). Aucun terme anglais lu : "spread" → "écart de
crédit", "high yield" → "obligations à haut rendement", "investment grade" → "obligations de
bonne qualité", "risk-off" → "fuite devant le risque", "basis point" → "point de base".
VIX, MOVE et OAS sont lus comme des sigles. "S&P 500" → "le grand indice des actions américaines".

## SCENE 01 — id: intro
Quand les marchés ont peur, on entend souvent : le VIX explose, alors l'or va monter. [pause] Sauf que la peur n'a pas qu'un seul visage. Il y a la peur sur les actions. La peur sur les taux. Et la peur sur le crédit, c'est-à-dire la crainte de ne pas être remboursé. [pause] Trois thermomètres différents. Et selon lequel chauffe, l'or peut monter... ou être vendu. C'est le sujet de F7.

## SCENE 02 — id: vix
Premier thermomètre : le VIX. Il mesure la volatilité implicite des options sur le grand indice des actions américaines, pour les trente prochains jours environ. [pause] Une option, c'est une assurance. Son prix contient une compensation pour tous les scénarios possibles, et pour le risque de volatilité lui-même. Le VIX combine beaucoup de ces options pour en tirer une seule mesure, exprimée en points de volatilité annualisée. [pause] Attention au piège. Un VIX à 20 ne veut pas dire que les actions vont baisser de 20 pourcent. Il décrit l'ampleur des mouvements intégrée dans le prix des options. Pas leur direction.

## SCENE 03 — id: vix-math
Comment le traduire en mouvement concret ? Une approximation : le VIX, multiplié par la racine de trente sur trois cent soixante-cinq. [pause] Imaginons que Hachim voie un VIX à 24. Vingt-quatre fois la racine de trente sur trois cent soixante-cinq... environ 6,9 pourcent. C'est l'ordre de grandeur d'un mouvement typique sur trente jours. Dans les deux sens : vers le haut, ou vers le bas. [pause] Ce n'est pas un objectif de prix. Juste une approximation. Et les vrais rendements ne suivent pas forcément une courbe en cloche bien sage. [pause] Et quand le VIX monte, ça peut venir de plusieurs choses à la fois. Une demande de protection. Des scénarios plus larges. Ou une baisse du marché. Une chose est sûre : un VIX en hausse ne veut pas dire, mécaniquement, un or en hausse.

## SCENE 04 — id: move
Deuxième thermomètre : le MOVE. C'est la volatilité implicite des options sur les obligations d'État américaines, sur plusieurs échéances. [pause] Pourquoi la volatilité des taux compte ? Parce que quand les taux bougent fort, tout bouge avec eux. Le prix des obligations. Les besoins de couverture. Les crédits immobiliers. L'espace dans les bilans des banques. Et le coût pour financer ses positions. [pause] Le MOVE peut grimper alors que le VIX reste calme. C'est le cas quand l'incertitude porte sur l'inflation, la Fed, les émissions de dette, ou la prime de terme, plutôt que sur les actions. [pause] Pour l'or, le niveau du MOVE est contextuel. La bonne question : qu'est-ce qui fait bouger les taux ? Et est-ce que les taux réels et le dollar confirment ? Une forte volatilité des taux peut aller avec un or qui monte... comme avec un or qui baisse.

## SCENE 05 — id: credit
Troisième thermomètre : les écarts de crédit. Quand une entreprise emprunte, elle paie plus cher que l'État. Ce supplément de rendement, c'est l'écart de crédit. Il rémunère le risque de défaut, le risque de dégradation de la note, le risque de liquidité, et une prime de risque. [pause] L'OAS est un écart ajusté des options intégrées dans certaines obligations, avant de le comparer à la courbe des taux de l'État. Il se compte en points de base. Cent points de base, c'est un point de pourcentage. [pause] Les obligations à haut rendement, plus risquées, ont normalement un écart plus large que les obligations de bonne qualité. Mais la composition de l'indice et la durée comptent aussi.

## SCENE 06 — id: oas-example
Exemple. Un indice d'obligations d'entreprises rapporte 7,20 pourcent. La référence d'État de même durée rapporte 4,10 pourcent. [pause] La différence simple : 7,20 moins 4,10... 3,10 points de pourcentage. Soit 310 points de base. [pause] Maintenant, l'écart s'élargit à 410 points de base, alors que le taux de l'État ne bouge pas. Les investisseurs exigent donc 100 points de base de plus pour prendre ce risque. Le crédit se tend. [pause] Mais attention : un écart qui s'élargit ne dit pas, à lui seul, ce que va faire l'or. Il faut regarder les taux, le dollar, et la liquidité.

## SCENE 07 — id: regimes
Alors, comment le stress arrive-t-il jusqu'à l'or ? Trois scénarios, qui se font concurrence. [pause] Premier scénario : une fuite ordonnée devant le risque. Les investisseurs achètent des obligations d'État, les taux réels baissent, et l'or peut en profiter, comme actif de réserve. [pause] Deuxième scénario : une pénurie de dollars. Tout le monde cherche des dollars, et c'est la demande de dollar qui domine. [pause] Troisième scénario : le désendettement forcé. Les investisseurs doivent couvrir des appels de marge. Ils vendent ce qui est liquide... y compris l'or. Avant, parfois, qu'il ne se reprenne plus tard. [pause] Ce ne sont pas des étapes fixes. Ce sont des scénarios à vérifier, à chaque fois.

## SCENE 08 — id: mistakes
Les pièges à éviter. [pause] Piège un. Réduire le VIX, le MOVE et les écarts de crédit à une seule jauge de peur. Ils mesurent des risques différents. [pause] Piège deux. Confondre volatilité et direction. La volatilité mesure l'ampleur et l'incertitude, pas le sens du prochain mouvement de l'or. [pause] Piège trois. Compter plusieurs mesures de stress qui bougent ensemble comme autant de preuves indépendantes. [pause] Et piège quatre. Utiliser F7 pour fabriquer un signal d'achat ou de vente. F7 sert à qualifier le stress, pas à prédire l'or.

## SCENE 09 — id: terminal-usage
Dans le terminal, maintenant. La façade de F7 affiche trois chiffres. Le VIX. Le MOVE. Et l'écart de crédit des obligations à haut rendement. Tous sont étiquetés contextuels : aucun n'a de sens fixe pour l'or. [pause] Le VIX et les écarts de crédit viennent de la base de données de la Fed de Saint-Louis. Le MOVE, lui, reste volontairement indisponible. C'est un produit payant, et la seule source gratuite trouvée n'a pas pu être validée avec assez de confiance. Le terminal préfère ne rien afficher plutôt qu'un chiffre douteux. Un clic dessus ouvre plutôt l'onglet graphique. [pause] En ouvrant le détail, tu trouves la variation sur un jour du VIX, du MOVE et de l'écart à haut rendement. Et l'écart de crédit des obligations de bonne qualité. [pause] Ensuite, le réflexe. Compare, au même moment, le VIX, le MOVE, les écarts de crédit, les taux réels dans F2, le dollar dans F6, et le financement dans F8. Qualifie le régime de stress. Et seulement après, regarde ce que fait l'or.

## SCENE 10 — id: glossary-flash
Le vocabulaire de F7, en rafale. [pause] Volatilité implicite. La volatilité contenue dans le prix des options. Ce n'est pas la direction réalisée. [pause] OAS. L'écart par rapport à la courbe des taux de l'État, après ajustement des options intégrées. [pause] Et point de base. Un centième de point de pourcentage. Cent points de base font un point de pourcentage.

## SCENE 11 — id: recap
Pour résumer F7. Le VIX, le MOVE et les écarts de crédit mesurent des risques différents. [pause] La volatilité mesure l'ampleur et l'incertitude, pas la direction de l'or. [pause] Alors avant toute conclusion sur l'or, qualifie le régime de stress. Refuge, pénurie de dollars, ou vente forcée ? Ne devine jamais. Vérifie la transmission.
