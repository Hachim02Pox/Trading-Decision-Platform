# F9 — Émissions du Trésor et transmission budgétaire (v4, 2026-09-23)
## Narration française — couvre l'intégralité du chapitre Knowledge F9

Pipeline F5. Aucun terme anglais lu : "bills" → "titres courts", "notes / bonds" → "titres à
coupons", "stop / high yield" → "taux haut", "when-issued" → "taux de marché juste avant la
clôture", "tail" → "écart de fin d'adjudication", "bid-to-cover" → "ratio de couverture",
"dealers" → "teneurs de marché". Les libellés anglais du terminal restent à l'écran.

## SCENE 01 — id: intro
Chaque semaine, le Trésor américain emprunte des centaines de milliards de dollars. Il vend de la dette aux enchères, à des investisseurs du monde entier. [pause] Parfois, une enchère se passe mal, et les taux bondissent. Alors on entend : trop de dette, l'or va monter. [pause] Sauf que le chemin entre le budget, les enchères, les taux et l'or est plus long qu'il n'y paraît. C'est le sujet de F9.

## SCENE 02 — id: issuance
D'abord, combien le Trésor doit-il emprunter ? L'emprunt net, c'est le besoin de trésorerie après les recettes, les dépenses, les remboursements, et la variation du solde qu'il veut garder sur son compte à la Fed. [pause] Les émissions brutes sont bien plus grosses. Parce que toute la dette qui arrive à échéance doit aussi être renouvelée. [pause] Et un même montant peut être financé de plusieurs façons. Avec des titres courts, à quelques semaines ou quelques mois. Ou avec des titres à coupons, sur plusieurs années. Le choix change la quantité de risque de durée proposée aux investisseurs.

## SCENE 03 — id: duration
Les titres courts portent peu de risque de durée. Les titres longs en portent beaucoup plus. [pause] Si le Trésor propose beaucoup plus de titres longs, et que la demande ne suit pas, il faudra peut-être un taux plus élevé, ou une prime de terme plus haute, pour les placer. [pause] Attention : c'est un raisonnement d'équilibre. Pas une règle où l'offre, à elle seule, décide des taux.

## SCENE 04 — id: auctions
Comment le Trésor vend-il sa dette ? Par adjudication. Une enchère révèle le prix nécessaire pour placer un montant précis, sur une durée précise, à un moment précis. [pause] Le taux haut, c'est le taux auquel l'enchère se termine. On le compare au taux de marché juste avant la clôture. Si le taux haut est au-dessus, l'enchère a été plus difficile que prévu : c'est un écart de fin d'adjudication. S'il est en dessous, la demande a été plus forte que prévu. [pause] Le ratio de couverture, c'est le total des offres, divisé par le montant accepté. Mais il dépend des habitudes d'enchères, et il faut le comparer à l'historique. [pause] Enfin, les allocations sont réparties entre enchérisseurs indirects, directs, et teneurs de marché. Ce sont des catégories. Elles ne disent ni pourquoi ils achètent, ni qui garde finalement les titres. Une forte part des teneurs de marché peut signifier qu'ils ont absorbé plus d'offre... sans prouver une faiblesse durable de la demande.

## SCENE 05 — id: tail-example
Exemple. Juste avant la clôture, le taux de marché du dix ans est à 4,280 pourcent. L'enchère se termine à 4,305 pourcent. [pause] L'écart : 4,305 moins 4,280... 0,025 point de pourcentage. Soit 2,5 points de base. L'enchère s'est placée à un taux plus élevé que la référence de marché. [pause] Imaginons que Hachim voie ce chiffre. Le bon réflexe : l'appeler un écart de 2,5 points de base, le comparer à l'historique de ce titre, et regarder comment le marché réagit juste après. [pause] Mais surtout, ne pas en déduire une direction pour l'or.

## SCENE 06 — id: term-premium
Parlons de la prime de terme. Un taux long, c'est deux choses. Les taux courts attendus dans le futur. Et une compensation pour accepter de prêter longtemps, avec de l'incertitude. [pause] Cette prime ne se voit nulle part directement. Elle est estimée par un modèle. Elle peut monter avec l'incertitude sur l'inflation, l'offre de titres longs, la volatilité, ou une moindre demande pour les obligations longues. [pause] Et les modèles ne sont pas toujours d'accord. C'est une estimation, pas une cotation.

## SCENE 07 — id: gold-transmission
Alors, et l'or ? Deux scénarios très différents. [pause] Premier scénario. Les émissions font monter les taux nominaux et les taux réels, et le dollar reste ferme. Détenir de l'or, qui ne rapporte rien, coûte plus cher. Ce canal peut être défavorable à l'or. [pause] Deuxième scénario. Les taux montent parce que la confiance dans la dette américaine s'effrite, et le dollar baisse. Là, l'or peut réagir tout autrement. [pause] C'est la décomposition du mouvement des taux, et la réaction des autres marchés, qui disent quel scénario tient la route.

## SCENE 08 — id: mistakes
Les pièges à éviter. [pause] Piège un. Confondre un gros déficit, un gros montant d'émissions brutes, et une enchère ratée. Ce sont trois choses différentes. [pause] Piège deux. Prendre une prime de terme estimée pour un prix observé sur le marché. [pause] Et piège trois. Transformer une seule enchère faible en signal. Une enchère faible peut être du bruit. Plusieurs placements difficiles, sur plusieurs durées, c'est une autre histoire.

## SCENE 09 — id: terminal-usage
Dans le terminal, maintenant. F9 est une famille d'événements. Sa façade n'affiche pas de chiffres, mais les prochains événements : les prochaines enchères, à deux ans, cinq ans, dix ans, vingt ans, trente ans, ou indexées sur l'inflation, avec le nombre de jours restants. [pause] En ouvrant le détail, tu trouves cinq données. L'emprunt net négociable, et sa révision par rapport à l'estimation précédente, tirés du communiqué trimestriel du Trésor. Puis trois mesures de la dernière enchère à dix ans terminée : le taux haut, le ratio de couverture, et la part des enchérisseurs indirects. Tout est contextuel. [pause] Attention : le terminal n'affiche ni l'écart de fin d'adjudication, ni la prime de terme. Ces calculs-là, il faut les faire toi-même. [pause] Le réflexe. Avant une enchère : note la durée, le montant, le contexte, et les autres règlements du jour. Après : compare le taux haut au marché, le ratio de couverture à son historique, les allocations, et la réaction des taux dans les cinq à trente minutes. Puis vérifie F2 pour les taux réels, F6 pour le dollar, F7 pour la volatilité des taux, et F8 pour le financement.

## SCENE 10 — id: glossary-flash
Le vocabulaire de F9, en rafale. [pause] Écart de fin d'adjudication. Le taux haut de l'enchère, moins le taux de marché juste avant. [pause] Ratio de couverture. Les offres reçues, divisées par le montant accepté. [pause] Et prime de terme. La compensation estimée pour porter un titre long et son incertitude, au-delà des taux courts attendus.

## SCENE 11 — id: recap
Pour résumer F9. Sépare l'emprunt net, les émissions brutes, et le mélange des durées. [pause] Les mesures d'enchère n'ont de sens qu'avec l'historique et le contexte de marché. [pause] Et avant de relier le budget à l'or, décompose le mouvement des taux. Ne devine jamais. Vérifie.
