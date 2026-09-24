# F10 — Flux et positionnement (v4, 2026-09-23)
## Narration française — couvre l'intégralité du chapitre Knowledge F10

Pipeline F5. Aucun terme anglais lu : "managed money" → "les gérants de fonds spéculatifs"
(le libellé Managed Money reste à l'écran), "open interest" → "intérêt ouvert", "short covering" →
"rachat de positions vendeuses", "long / short" → "à l'achat / à la vente". Sigles : CFTC, ETF.

## SCENE 01 — id: intro
Qui est déjà dans le marché de l'or ? Et est-ce qu'ils achètent encore, ou est-ce qu'ils sortent ? [pause] C'est la question du positionnement et des flux. On l'entend souvent comme ça : les spéculateurs sont tous à l'achat, alors ça va forcément se retourner. [pause] Sauf que le positionnement ne donne ni la direction, ni le moment. Il décrit qui est exposé, et comment la participation évolue. C'est le sujet de F10.

## SCENE 02 — id: stock-flow
D'abord, une distinction simple. Une position, c'est une exposition en cours, à un instant donné. Un flux, c'est une variation, sur une période. [pause] La position nette, c'est les positions à l'achat moins les positions à la vente, pour une catégorie d'intervenants et un ensemble de contrats. [pause] Attention : une position nette positive ne veut pas dire qu'ils ont acheté la semaine dernière. C'est la variation d'une semaine sur l'autre qui répond à cette question. [pause] Et le prix peut monter alors que les positions à l'achat baissent. Parce que d'autres vendeurs rachètent leurs positions, parce qu'il y a de l'activité hors du rapport, ou parce qu'une autre demande domine.

## SCENE 03 — id: crowding
Et quand tout le monde est déjà à l'achat ? On dit que le marché est encombré. [pause] Un rang historique très élevé peut rendre le marché plus sensible à une mauvaise surprise. Parce qu'il y a plus d'exposition qui peut être réduite d'un coup. [pause] Mais ça ne dit ni quand, ni même si, cette sortie aura lieu. Une tendance peut continuer longtemps, avec un positionnement extrême.

## SCENE 04 — id: cftc
La source principale, c'est le rapport hebdomadaire de la CFTC, l'autorité américaine des marchés à terme. Il classe les positions déclarées sur les contrats à terme et les options, à une date d'observation chaque semaine. [pause] Les catégories, comme les gérants de fonds spéculatifs, sont des classements réglementaires. Pas une stratégie unique, ni une intention commune. [pause] L'intérêt ouvert, c'est le nombre de contrats en cours. Diviser la position nette par l'intérêt ouvert permet de comparer des périodes où le marché n'a pas la même taille. [pause] Et un rang sur cent cinquante-six semaines, environ trois ans, situe la semaine actuelle dans cet historique. Ce n'est ni une probabilité, ni une valeur juste.

## SCENE 05 — id: lag
Un détail change tout : le décalage. La photographie est prise le mardi. Le rapport est publié le vendredi. [pause] Imaginons que l'or bouge fortement mercredi. Vendredi, Hachim lit le rapport... mais les positions affichées datent d'avant ce mouvement. [pause] Les révisions, les contrats couverts, les positions croisées entre échéances, et la façon de compter les options limitent aussi les comparaisons trop naïves.

## SCENE 06 — id: normalize
Exemple. Les gérants de fonds spéculatifs déclarent cent quatre-vingt mille contrats à l'achat, soixante-dix mille à la vente, et l'intérêt ouvert total est de cinq cent mille contrats. [pause] Position nette : cent quatre-vingt mille moins soixante-dix mille... cent dix mille contrats. [pause] Part de l'intérêt ouvert : cent dix mille divisé par cinq cent mille... 22 pourcent. [pause] Maintenant, si l'intérêt ouvert double, les mêmes cent dix mille contrats ne pèsent plus que 11 pourcent. [pause] Le nombre de contrats et l'exposition rapportée à la taille du marché répondent à deux questions différentes. Et aucun des deux n'est une règle d'achat ou de vente.

## SCENE 07 — id: etf
Deuxième canal : les fonds cotés adossés à de l'or physique. Leurs avoirs suivent le métal attribué à un ensemble défini de fonds. Leurs variations représentent un des canaux de la demande d'investissement. [pause] Un flux peut s'exprimer en tonnes, en onces, en parts, ou en dollars. Mais un flux en dollars mélange la quantité et la variation du prix de l'or. Les tonnes sont souvent plus propres pour suivre le stock physique. [pause] Les créations et les rachats de parts relient les parts au métal. Mais les heures de clôture, les fonds couverts, les frais et les conversions de devises doivent rester clairs.

## SCENE 08 — id: etf-meaning
Que disent ces flux ? Des entrées peuvent accompagner un or qui monte, parce que les investisseurs ajoutent de l'exposition. Mais elles peuvent aussi suivre le mouvement, avec retard. [pause] Des sorties peuvent être des prises de bénéfices, des changements d'allocation, ou un simple passage vers un autre produit. [pause] Et surtout, beaucoup de demande échappe à une série de fonds cotés. Les achats des banques centrales, les contrats à terme, les lingots, les pièces, la bijouterie, et les échanges de gré à gré.

## SCENE 09 — id: scenarios
Comment combiner tout ça ? [pause] Un déclencheur macro favorable, avec peu d'exposition spéculative, peut laisser de la place pour que de nouveaux acheteurs arrivent. Mais ça ne garantit pas une hausse. [pause] Le même déclencheur, avec une exposition déjà extrême, peut donner une réaction plus faible, ou des prises de bénéfices agitées. Et pourtant, la tendance peut continuer. [pause] Des entrées dans les fonds cotés qui confirment le prix et la participation sur les contrats à terme forment un ensemble de preuves plus large qu'une seule série.

## SCENE 10 — id: mistakes
Les pièges à éviter. [pause] Piège un. Utiliser un rang extrême comme un minuteur de retournement. [pause] Piège deux. Comparer des données hebdomadaires en retard avec le prix en direct, comme si les dates correspondaient. [pause] Et piège trois. Prendre un seul ensemble de fonds cotés pour toute la demande mondiale d'or.

## SCENE 11 — id: terminal-usage
Dans le terminal, maintenant. La façade de F10 est la plus détaillée. Elle commence par rappeler que ces deux canaux ne représentent pas tout le marché de l'or, et que F10 décrit un contexte, pas un déclencheur. [pause] Premier bloc : les gérants de fonds spéculatifs, d'après la CFTC. La position nette en pourcentage de l'intérêt ouvert, sa variation sur une semaine, et son rang sur cent cinquante-six semaines. Avec deux états écrits en clair : est-ce qu'ils ajoutent ou réduisent leur exposition, et est-ce que la position est historiquement étendue ou légère. [pause] Deuxième bloc : le fonds GLD, en tonnes, d'après son émetteur. La variation du jour, sur cinq observations, sur vingt observations. L'intensité du flux, en écarts-types. Son extension. Et le rendement du prix sur vingt observations, pour voir si le flux confirme le prix. [pause] Enfin, la largeur de participation : large, menée par les contrats à terme, menée par le fonds, ou en réduction. Avec la date de chaque canal, pour ne jamais oublier le décalage. [pause] Les variations portent une étiquette mécanique : une hausse est favorable. Les rangs et les intensités restent contextuels. Et le réflexe : ce sont les déclencheurs, dans F2 et F13, qui donnent le moment.

## SCENE 12 — id: glossary-flash
Le vocabulaire de F10, en rafale. [pause] Intérêt ouvert. Le nombre de contrats dérivés en cours. [pause] Position nette. Les positions à l'achat moins les positions à la vente, pour une catégorie définie. [pause] Rang historique. Une place dans un échantillon passé, pas une probabilité. [pause] Et flux de fonds coté. Une variation des parts, des actifs, ou du métal attribué, sur une période et un ensemble de fonds définis.

## SCENE 13 — id: recap
Pour résumer F10. Le niveau d'une position, sa variation, et le rendement du prix sont trois choses différentes. [pause] Aligne toujours la date d'observation de la CFTC avec l'heure du marché. [pause] Et les flux décrivent la participation et une asymétrie possible. Ils ne décident pas seuls de la direction. Ne devine jamais. Vérifie.
