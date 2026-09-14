# GOLD MACRO REASONING MANUAL — XAUUSD / SUNDAY READ

## À quoi sert ce Markdown

Ce fichier est le **manuel de compréhension et de raisonnement** donné à l'IA **après** la phase de recherche/collecte. Il ne remplace pas le Skill de collecte et il n'est pas une base de données temps réel. Les faits courants viennent du Weekly Gold Recap et des six Family Evidence Cards ; ce manuel fournit le background nécessaire pour comprendre leurs mécanismes, tester les liens possibles et construire une Market Story sans tomber dans les raccourcis classiques.

### Mode d'emploi pour l'IA — règles impératives

- **Ne lis pas ce document comme une cascade rigide.** La méthode est itérative : pars des faits disponibles, consulte les chapitres pertinents, formule une hypothèse, reviens vers d'autres mécanismes si une contradiction apparaît, puis réévalue. Tu peux naviguer vers le bas, revenir vers le haut et croiser plusieurs chapitres.
- **Ne force jamais une histoire simplement parce qu'un mécanisme existe dans ce manuel.** Un mécanisme est une possibilité, pas une preuve qu'il est actif cette semaine.
- **Les faits actuels ont priorité sur les exemples historiques.** Les dates, niveaux et épisodes de ce document sont pédagogiques ; ne les traite jamais comme l'état actuel du marché.
- **Relier, pas additionner.** Plusieurs KPI peuvent être les différentes manifestations d'un même driver. Aucun score, aucune pondération, aucun vote d'indicateurs.
- **Corrélation ≠ causalité.** Une relation historique ou roulante sert de diagnostic de contexte ; la causalité doit être soutenue par timing, transmission économique, comportement cross-asset et alternatives concurrentes.
- **Conserve les horizons séparés.** Tactical, medium-term et structural peuvent raconter des choses différentes simultanément sans contradiction.
- **Cherche activement ce qui ne colle pas.** Contradictions, divergences, anomalies et éléments non observés sont obligatoires dans une bonne analyse.
- **Le comportement réel du marché a le dernier mot.** Si la théorie dit X mais que Gold et les actifs liés ne réagissent pas conformément au mécanisme, ne force pas X : `MIXED`, `INSUFFICIENT EVIDENCE`, `UNKNOWN` ou `NO CLEAR DOMINANT STORY` sont des sorties valides.
- **Le consensus narratif est une donnée, pas une vérité.** Les explications Reuters/Bloomberg/WSJ/etc. servent à savoir ce que le marché regarde ; elles doivent être testées, pas recopiées.
- **Expectation first.** Une donnée n'est jamais interprétée sans ce qui était pricé/attendu.
- **Aucune estimation numérique improvisée.** Si un coefficient, percentile ou calcul n'est ni publié ni calculé par un outil déterministe à partir de séries traçables, utilise une caractérisation qualitative ou `UNKNOWN`.
- **La décision de trading finale reste distincte de la Market Story.** La Story explique le marché ; l'asymétrie et le timing qualifient ensuite l'opportunité.

## Périmètre de cette version

Cette version reprend les chapitres pédagogiques et méthodologiques utiles du document source : **00 à 19, puis 21**. Les chapitres centrés sur l'architecture produit du terminal, le stockage/ingestion, le verdict produit et le changelog sont volontairement retirés. Les décisions méthodologiques LOCKED lors de la conception du Sunday Read ont été intégrées directement dans les passages concernés.

---

Document de référence · Terminal personnel XAUUSD

## Comprendre le Gold, construire la Market Story, décider avec clarté

Ce document est la référence complète pour deux choses inséparables : **(1) la formation macro** — comprendre chaque mécanisme qui fait bouger l'or — et **(2) le cahier des charges de ton terminal personnel de trading XAUUSD (CFD)** : un environnement unique de préparation, compréhension, analyse, exécution et audit. Ce terminal n'est pas un robot qui dit BUY ou SELL : c'est une machine à CLARTÉ.

Vocabulaire de sortie : CLEAR · LIKELY · PLAUSIBLE · MIXED · INSUFFICIENT EVIDENCE · UNKNOWN · « NO CLEAR STORY » = OK

Le vocabulaire de sortie du système : des degrés de conviction qualitatifs et honnêtes — jamais un score inventé, jamais une fausse précision.

### La philosophie du système (verrouillée)

- VOIR — les KPI essentiels, hiérarchisés, frais, sans bruit
- COMPRENDRE — chaque donnée avec sa pédagogie intégrée (WHAT / relation Gold / WHY NOW)
- RELIER — les chaînes de transmission entre KPI : la Market Story, pas des votes indépendants
- CONTEXTUALISER — trois horizons (tactique / positioning / structurel), régime en synthèse
- CHALLENGER — hypothèses concurrentes, contradictions cherchées activement, « je ne sais pas » valide
- DÉCIDER — c'est TOI qui décides ; le terminal éclaire, il ne remplace pas ton raisonnement
- AUDITER & APPRENDRE — snapshot automatique de chaque trade, journal, post-mortem, base de connaissances

**Ce que le système NE fait PAS (décisions verrouillées)**

Pas de scoring mécanique ni de pondérations arbitraires (aucune somme de signaux, aucun vote d'indicateurs, aucun « 7 verts contre 3 rouges donc long »). Pas de BUY/SELL automatique. Pas d'order flow (footprint, delta, DOM, tape) : l'architecture n'en dépend plus — l'entrée pourra s'appuyer sur la price action / structure / zones techniques. Pas de stockage permanent massif des données externes : les sources restent la vérité, on stocke MES données et des snapshots. Pas de fausse précision (« 73.4% bullish » interdit si non calibré). L'incertitude, la contradiction et « no clear story » sont des sorties normales.

### Les 5 principes qui gouvernent toute la formation

**Principe 1 — Les marchés tradent les attentes, pas les faits**

Un chiffre n'est jamais bullish ou bearish en soi. Il l'est **relativement à ce qui était anticipé (priced in)**. C'est la clé de voûte de tout le système. Chapitre 12 entier là-dessus.

**Principe 2 — Toute relation est régime-dépendante**

« Real yields ↑ = Gold ↓ » a fonctionné de 2006 à 2022, puis a partiellement cassé quand les banques centrales sont devenues l'acheteur marginal. Aucune règle n'est permanente. Il faut savoir **dans quel contexte on se trouve** avant d'appliquer une règle.

**Principe 3 — Un seul moteur domine à la fois, et plusieurs KPI peuvent être le MÊME moteur**

À tout moment, une variable est responsable du mouvement **marginal** du Gold. Le travail n'est jamais d'additionner des facteurs : c'est d'identifier le *dominant driver*, et de reconnaître que 2Y ↓, real yields ↓, USD ↓ et Gold ↑ le même matin ne sont pas quatre confirmations indépendantes — c'est UNE SEULE histoire (un repricing Fed) vue sous quatre angles. Éviter ce double/triple comptage conceptuel est central.

**Principe 4 — Chaque information a un horizon temporel**

« Les banques centrales achètent » est un argument sur 6-24 mois. Il ne t'aide pas à décider quoi que ce soit à 10h30. Le terminal sépare physiquement trois horizons : tactique (minutes→jours), positioning (jours→semaines), structurel (mois→années).

**Principe 5 — « Je ne sais pas » est une réponse victorieuse**

Quand les mécanismes se contredisent sans hiérarchie claire, la bonne sortie est `NO CLEAR DOMINANT STORY`. Forcer une direction pour se sentir intelligent, c'est exactement l'intuition déguisée que ce système doit éliminer.

### Le cas d'école vivant : le marché de 2026

Garde cette séquence réelle en tête — on la dissèque tout au long du cours, c'est la démonstration de tous les principes à la fois :

Séquence réelle · Janvier → Juillet 2026

Gold à \$5,598 fin janvier 2026 (sommet historique) — marché price plusieurs cuts Fed, positionnement long record

↓  fin février

Guerre Iran / blocage du détroit d'Hormuz → pétrole \$65 → \$110

↓

CPI US remonte jusqu'à ~4.2% en juin (plus haut de 3 ans)

↓  le canal « inflation = Gold hedge » aurait dû être bullish… mais :

Repricing Fed violent : de « plusieurs cuts » → « ~60% de proba de HIKE en septembre » (Fed Warsh hawkish)

↓

Yields ↑, real yields ↑, USD résilient — et un positionnement record à purger

↓

Gold -26% : \$5,598 → ~\$4,100

**La leçon fondatrice**

Une **guerre majeure** + une **inflation en hausse** — les deux clichés « bullish Gold » — ont produit un Gold **-26%**, parce que la chaîne de transmission dominante était : guerre → pétrole → inflation → Fed hawkish → real yields ↑, amplifiée par un positionnement extrême. Comprendre pourquoi = l'objectif de la formation. (Sources : CME FedWatch, J.P. Morgan, Trading Economics, juillet 2026.)

### Comment utiliser ce document

- **Formation (ch. 01-15)** : connaissance macro et microstructure nécessaire pour comprendre les mécanismes qui peuvent agir sur Gold.
- **Méthode (ch. 16-19)** : outils de référence, Market Story, scénarios d'entraînement et erreurs de raisonnement.
- **Asymétrie (ch. 21)** : flux, positionnement, options, funding, fusibles et qualité de l'opportunité.
- Les anciens chapitres centrés sur l'architecture du terminal, le stockage/ingestion, le verdict produit et le changelog ne font volontairement **pas** partie de ce manuel IA : ils ne sont pas nécessaires au raisonnement du Sunday Read.


---

# Chapitre 01

## Fondations : le glossaire opérationnel

Chaque concept suit le même format : définition simple → mécanisme → pourquoi c'est important → lien avec le Gold → exemple réel → erreur fréquente. Tu peux lire ce chapitre linéairement ou y revenir comme référence. Les concepts les plus lourds (real yields, priced in, COT…) ont en plus leur chapitre dédié.

### Bloc A — Inflation & prix

#### Inflation / Désinflation / Déflation \[prix\]

**Définition:** **Inflation** = hausse généralisée des prix (ton argent perd du pouvoir d'achat). **Désinflation** = les prix montent encore, mais de moins en moins vite (inflation 6% → 4% → 3%). **Déflation** = les prix baissent en absolu (rare, associé aux crises graves).

**Mécanisme:** Trop de demande vs offre, choc de coûts (énergie, salaires), ou expansion monétaire excessive. La Fed cible 2% (sur le PCE, pas le CPI).

**Pourquoi c'est important:** L'inflation est l'input n°1 de la politique de la Fed, donc des taux, donc des real yields, donc du coût d'opportunité de détenir de l'or.

**Lien Gold:** Ambivalent — c'est LE piège. Canal 1 : inflation ↑ → l'or protège le pouvoir d'achat → bullish. Canal 2 : inflation ↑ → Fed hawkish → real yields ↑ → bearish. **Le canal 2 domine presque toujours à court terme quand la Fed a de la crédibilité.**

**Exemple réel:** 2022 : inflation US à 9%… et Gold -20% du sommet, parce que la Fed a monté de 525 bps. 2026 : CPI 4.2% en juin → proba de hike → Gold -26%. À l'inverse, années 1970 : inflation ↑ avec une Fed en retard → Gold ×24.

**Erreur fréquente:** « Inflation forte = acheter Gold. » Non. La vraie question : *la Fed va-t-elle courir après l'inflation (bearish) ou la tolérer / être en retard (bullish) ?*

#### CPI / Core CPI \[donnée · BLS\]

**Définition:** Consumer Price Index : indice des prix d'un panier de consommation, publié mensuellement par le BLS (~8h30 ET, mi-mois). **Headline** = tout inclus. **Core** = hors alimentation et énergie (composantes volatiles).

**Mécanisme:** Publié en variation mensuelle (MoM) et annuelle (YoY). Le Core est jugé plus représentatif de la tendance sous-jacente ; la Fed regarde surtout les services hors logement (« supercore »).

**Pourquoi c'est important:** Publication Tier 1 : c'est le chiffre qui reprice le plus violemment les attentes Fed en 2024-2026.

**Lien Gold:** CPI au-dessus des attentes → repricing hawkish → yields/USD ↑ → Gold ↓ (en général, en régime de Fed crédible). En dessous → l'inverse. La réaction se joue en secondes sur GC.

**Exemple réel:** 10 nov. 2022 : CPI 7.7% vs 8.0% attendu → Gold +2.8% en une journée, un des plus gros moves de l'année. Juin 2026 : CPI 4.2% (choc pétrolier Hormuz) → hausse des probas de hike → Gold sous pression.

**Erreur fréquente:** Lire seulement le headline YoY. Le marché réagit à la surprise sur le **Core MoM** autant sinon plus. Il faut lire les 4 chiffres (headline/core × MoM/YoY) + vs attentes en quelques secondes.

#### PCE / Core PCE \[donnée · BEA\]

**Définition:** Personal Consumption Expenditures price index — la mesure d'inflation **officiellement ciblée par la Fed** (2%). Publié par le BEA en fin de mois.

**Mécanisme:** Diffère du CPI : pondérations mises à jour dynamiquement, panier plus large, poids du logement plus faible. Le PCE tourne typiquement 0.3-0.5 pt sous le CPI.

**Pourquoi c'est important:** C'est la cible de la Fed. Mais il sort APRÈS le CPI et le PPI du même mois, donc il est souvent déjà largement anticipé (les desks le « nowcastent » à partir de CPI+PPI).

**Lien Gold:** Moins de volatilité que le CPI (moins de surprise résiduelle), mais un Core PCE qui dévie du nowcast bouge quand même GC.

**Erreur fréquente:** Traiter le PCE comme aussi « surprenant » que le CPI. La surprise a souvent déjà été consommée.

#### PPI \[donnée · BLS\]

**Définition:** Producer Price Index : prix à la production (ce que les entreprises paient/facturent en amont).

**Pourquoi c'est important:** Indicateur avancé de l'inflation consommateur + certaines composantes alimentent directement le calcul du PCE (santé, services financiers). Les desks l'utilisent pour affiner le nowcast PCE.

**Lien Gold:** Tier 2 : réaction plus faible que CPI, sauf grosse surprise ou composantes PCE-relevantes marquées.

**Erreur fréquente:** Ignorer que le marché regarde surtout les composantes PPI qui entrent dans le PCE, pas le headline PPI.

#### Inflation expectations / Breakevens / 5Y5Y \[marché\]

**Définition:** L'inflation *anticipée* par le marché. **Breakeven 10Y** = rendement nominal 10Y − rendement TIPS 10Y : c'est l'inflation moyenne que le marché price sur 10 ans. Le **5Y5Y forward** = l'inflation anticipée sur 5 ans… dans 5 ans (mesure les anticipations long terme, purgées du bruit court terme).

**Pourquoi c'est important:** C'est la moitié de l'équation des real yields. Et c'est le thermomètre de la **crédibilité** de la Fed : si le 5Y5Y « se désancre » (monte fort), le marché doute que la Fed contrôle l'inflation.

**Lien Gold:** Breakevens ↑ avec nominaux stables = real yields ↓ = bullish Gold. Un 5Y5Y qui se désancre est un des signaux les plus bullish structurels qui existent pour l'or (régime « débasement »).

**Où trouver:** FRED : `T10YIE` (breakeven 10Y), `T5YIFR` (5Y5Y), `DFII10` (TIPS 10Y).

### Bloc B — Taux & obligations

#### Treasury / Yield / Prix obligataire \[rates\]

**Définition:** Un **Treasury** = une obligation du gouvernement US (il t'emprunte de l'argent et te paie un intérêt). Le **yield** = le rendement annualisé que tu obtiens en l'achetant au prix actuel. Règle mécanique : *prix ↓ = yield ↑* et inversement.

**Mécanisme:** Le coupon est fixe. Si le prix de l'obligation baisse sur le marché, le même coupon rapporte proportionnellement plus → yield monte. Le 2Y reflète surtout les attentes Fed à court terme ; le 10Y ajoute croissance, inflation long terme et term premium ; le 30Y est le plus sensible au fiscal/term premium.

**Pourquoi c'est important:** Les yields US sont le « prix de l'argent » mondial. Tout actif se compare à eux — l'or en premier, puisqu'il ne rapporte rien.

**Lien Gold:** Ce n'est pas le niveau du yield qui compte, c'est sa **direction, sa vitesse, et surtout sa CAUSE** (croissance ? inflation ? term premium ? — voir chapitre 02, c'est fondamental).

**Erreur fréquente:** « US10Y monte donc Gold doit baisser. » Faux si la hausse vient des breakevens (inflation anticipée) : les real yields peuvent être stables ou baisser.

#### Nominal yield vs Real yield \[rates · clé\]

**Définition:** **Nominal** = le rendement affiché. **Réel** = le rendement après inflation anticipée : `real ≈ nominal − breakeven`. Observable directement via les TIPS (obligations indexées sur l'inflation).

**Pourquoi c'est important:** Un Treasury à 5% avec 5% d'inflation ne t'enrichit pas. Le real yield mesure le **vrai coût d'opportunité** de détenir un actif sans rendement comme l'or. Concept central de toute la formation → chapitre 02 entier.

**Lien Gold:** Corrélation inverse historique très forte (2006-2022), **partiellement cassée depuis 2022** par les achats de banques centrales. Savoir quand la relation s'applique = compétence clé.

#### Yield curve / Term premium / Duration \[rates\]

**Définition:** **Courbe des taux** = les yields à chaque maturité (3M, 2Y, 10Y, 30Y…). Pentue = long \> court (normal). Inversée = court \> long (signal récession historique). **Term premium** = le supplément de rendement exigé pour prêter longtemps plutôt que rouler du court terme — il rémunère l'incertitude (inflation future, avalanche d'émissions de dette). **Duration** = sensibilité du prix d'une obligation aux taux (30Y = duration longue = bouge beaucoup).

**Lien Gold:** Une hausse du 10Y-30Y tirée par le **term premium** (peur fiscale, dégoût de la duration US) est très différente d'une hausse tirée par la croissance : la première peut coexister avec un Gold qui MONTE (fuite hors des Treasuries vers l'or comme réserve alternative — thème 2025). Un « bear steepener » (long terme monte plus vite que le court) sur fond de peur fiscale = souvent bullish Gold. La même pente tirée par l'optimisme croissance = bearish Gold.

**Erreur fréquente:** Traiter « yields ↑ » comme un signal unique. Toujours demander : quelle maturité, et quelle cause ?

#### TIPS \[rates\]

**Définition:** Treasury Inflation-Protected Securities : obligations d'État dont le principal est indexé sur le CPI. Leur rendement EST le taux réel observable du marché.

**Lien Gold:** Le 10Y TIPS yield (FRED : `DFII10`) est LE chart de référence à superposer avec Gold (inversé). C'est le concurrent direct de l'or : un actif « sûr » qui protège de l'inflation ET paie un rendement réel.

**Exemple réel:** 2012 : TIPS 10Y à -0.8% → détenir de l'or ne « coûtait » rien → Gold ~\$1,900. 2023-2025 : TIPS ~+2% → l'or aurait « dû » souffrir… et a fait ×2. C'est l'anomalie qui a forcé tous les desks à réviser leurs modèles (chapitres 02 et 08).

### Bloc C — Fed & politique monétaire

#### Fed Funds Rate / SOFR \[fed\]

**Définition:** **Fed Funds Rate** = le taux directeur : cible fixée par la Fed pour les prêts au jour le jour entre banques. C'est LE levier de la politique monétaire. **SOFR** = Secured Overnight Financing Rate, le taux repo garanti par des Treasuries — le benchmark moderne des taux courts US (les futures SOFR servent à pricer la trajectoire Fed).

**Mécanisme:** La Fed monte le taux → tout le crédit de l'économie renchérit → demande freinée → inflation (en théorie) refroidie. Elle le baisse pour stimuler.

**Lien Gold:** Indirect mais dominant : Fed Funds → attentes de taux → yields → real yields → USD → Gold. En juillet 2026, Fed Funds à 3.50-3.75% après le cycle de cuts commencé en septembre 2025, avec un débat de hike relancé par le choc pétrolier.

**Erreur fréquente:** Trader la décision elle-même. Ce qui bouge Gold, c'est l'écart entre la décision/le discours et ce qui était pricé (chapitre 12).

#### Hawkish / Dovish / Neutral rate / Terminal rate \[fed · vocab\]

**Définition:** **Hawkish** (faucon) = ton restrictif : priorité à l'inflation, taux plus hauts / plus longtemps. **Dovish** (colombe) = ton accommodant : priorité à l'emploi/croissance, taux plus bas. **Neutral rate (r\*)** = le taux théorique qui ne stimule ni ne freine (~2.5-3% nominal selon les estimations Fed). **Terminal rate** = le sommet (ou plancher) anticipé du cycle en cours.

**Lien Gold:** Surprise hawkish = bearish Gold (real yields ↑, USD ↑). Surprise dovish = bullish. Le mot-clé est **surprise** : Powell/Warsh peut être objectivement hawkish mais MOINS que craint → Gold monte quand même.

**Exemple réel:** Juin 2026 : minutes FOMC révélant un comité divisé 9-8 sur des hikes → lecture hawkish → pression sur Gold. Puis Warsh signale « pas d'urgence à monter » après un mauvais rapport emploi → soulagement partiel.

#### QE / QT / Balance sheet \[fed · liquidité\]

**Définition:** **QE** (Quantitative Easing) = la Fed crée des réserves pour acheter des Treasuries/MBS → injecte de la liquidité, comprime les yields longs. **QT** = l'inverse : elle laisse son portefeuille fondre → draine la liquidité. Le **balance sheet** = son bilan (~\$9T au pic 2022, réduit ensuite par le QT, arrêté fin 2025).

**Lien Gold:** QE = expansion monétaire = narratif débasement + real yields écrasés → historiquement très bullish (2009-2011 : Gold \$700→\$1,920). Fin du QT (2025) = un vent contraire de liquidité qui disparaît → contribua au rally. Mais attention au raccourci « bilan ↑ = tout monte » : voir chapitre 06.

#### FOMC / SEP / Dot Plot / Minutes \[fed · événements\]

**Définition:** **FOMC** = le comité qui décide des taux, 8 réunions/an (décision 14h ET + conférence de presse 14h30). **SEP** = Summary of Economic Projections (4×/an) : prévisions des membres. **Dot plot** = dans le SEP, chaque point = le taux jugé approprié par un membre pour fin d'année N, N+1… C'est la « guidance » la plus scrutée du monde. **Minutes** = compte-rendu détaillé publié 3 semaines après chaque réunion.

**Lien Gold:** Le jour FOMC produit régulièrement 2 mouvements : réaction au communiqué/dots (14h00), puis inversion ou amplification pendant la conférence (14h30-15h15). Ne jamais juger le biais post-FOMC avant la fin de la presser.

**Erreur fréquente:** Prendre les dots pour un engagement. C'est une photo des opinions, révisée à chaque SEP — le marché price souvent une trajectoire différente, et c'est cet écart qui est tradable.

### Bloc D — Emploi & activité

#### NFP / Unemployment rate / AHE \[donnée · BLS\]

**Définition:** **NFP** (Nonfarm Payrolls) = créations nettes d'emplois du mois, 1er vendredi du mois, 8h30 ET. Livré avec le **taux de chômage** (enquête ménages, séparée !) et les **Average Hourly Earnings** (salaires = canal inflation).

**Mécanisme:** Emploi fort = économie résiliente = la Fed peut rester restrictive. Emploi faible = pression pour couper. Le mandat de la Fed est double : inflation ET plein emploi.

**Lien Gold:** NFP fort vs attentes → yields ↑, USD ↑ → Gold ↓ (canal standard). Mais lecture multidimensionnelle obligatoire : révisions des mois précédents, taux de chômage (peut monter alors que NFP est « bon »), salaires. Chapitre 11 pour l'arbre de décision complet.

**Erreur fréquente:** Lire le headline seul. Un NFP à +250k avec révisions -110k et chômage en hausse est un rapport FAIBLE.

#### Jobless Claims / JOLTS \[donnée\]

**Définition:** **Initial claims** = nouvelles inscriptions au chômage, chaque jeudi (fréquence hebdo = détection précoce des retournements). **Continuing claims** = personnes qui restent au chômage (difficulté à retrouver un emploi). **JOLTS** = postes ouverts (vacancies), démissions (quits — les gens démissionnent quand ils sont confiants), licenciements.

**Lien Gold:** Tier 2 individuellement, mais une *tendance* de claims en hausse plusieurs semaines = le marché commence à pricer des cuts = support Gold. C'est souvent le premier signal d'un pivot dovish.

#### GDP / PMI / ISM / GDPNow \[croissance\]

**Définition:** **GDP** = PIB (production trimestrielle, publié avec 1 mois de retard — donc peu « tradable »). **PMI/ISM** = enquêtes mensuelles auprès des directeurs d'achats : \>50 = expansion, \<50 = contraction (ISM Manufacturing et ISM Services sont les références US). **GDPNow** = nowcast temps réel du PIB par la Fed d'Atlanta.

**Lien Gold:** La croissance influence Gold via la Fed (croissance forte = moins de cuts) et via le risk appetite. Un ISM sous 50 qui s'enfonce + claims qui montent = narratif récession = cuts pricés = généralement bullish Gold (sauf phase de panique-liquidation, voir chapitre 10).

### Bloc E — Devises, marché & structure

#### DXY / Dollar liquidity / De-dollarization \[fx\]

**Définition:** **DXY** = indice du dollar contre un panier (EUR ~58%, JPY, GBP…). **Dollar liquidity** = la disponibilité mondiale de dollars (tout le système financier mondial emprunte en USD). **De-dollarization** = mouvement structurel de réduction de la dépendance au dollar dans les réserves et le commerce, accéléré par le gel des réserves russes en 2022.

**Lien Gold:** Corrélation inverse mécanique (l'or est coté en USD) + macro (USD fort = conditions financières serrées). MAIS les deux peuvent monter ensemble en panique ou en crise de confiance — chapitre 06. La dédollarisation est le moteur structurel n°1 du bid banques centrales depuis 2022.

#### Risk-on / Risk-off / Safe haven \[sentiment\]

**Définition:** **Risk-on** = appétit pour le risque (actions ↑, crédit ↑). **Risk-off** = fuite vers la sécurité. **Safe haven** = actif recherché en stress : USD, Treasuries, yen, franc suisse, or.

**Lien Gold:** Nuance cruciale : en risk-off MODÉRÉ, l'or monte (demande refuge). En PANIQUE de liquidité (mars 2020, oct. 2008), l'or BAISSE d'abord : les fonds vendent ce qui est liquide et profitable pour couvrir leurs appels de marge. Puis il repart quand la Fed injecte. « Gold is the last man standing, so it gets sold first. »

#### Open Interest / Contango / Backwardation / Term structure \[futures\]

**Définition:** **Open interest** = nombre de contrats futures ouverts (≠ volume : l'OI mesure les positions vivantes). **Term structure** = les prix des échéances successives. **Contango** = échéances lointaines plus chères que le spot (normal pour l'or : reflète taux d'intérêt + stockage). **Backwardation** = spot plus cher que les échéances (rare sur l'or = tension physique immédiate, signal fort).

**Lien Gold:** Prix ↑ + OI ↑ = argent neuf qui entre (tendance saine). Prix ↑ + OI ↓ = short covering (rally fragile). Une backwardation ou des primes EFP anormales (comme début 2025 avec la peur des tarifs sur les imports d'or) signalent un stress physique — bullish court terme.

#### CTA / Convexity / Gamma (aperçu) \[flux · avancé\]

**Définition:** **CTA** = fonds systématiques trend-following : ils achètent parce que ça monte et vendent parce que ça baisse — ils amplifient les tendances et les cassures de niveaux (200-DMA, etc.). **Gamma / convexity** = quand les dealers d'options sont « short gamma », leur hedging amplifie les mouvements ; « long gamma », il les amortit. Détail au chapitre 09.

**Lien Gold:** Explique pourquoi certains mouvements macro sont exagérés : un flip de biais CTA (ex : cassure sous la 200-DMA) ajoute des milliards de flux vendeurs mécaniques sans aucune nouvelle info fondamentale. Leur empreinte est visible dans le prix (cassures amplifiées, accélérations mécaniques) ; la macro t'explique pourquoi ils sont là.

**Concepts traités en profondeur dans leur propre chapitre**

Real yields (ch. 02) · Fed Funds Futures, FedWatch, OIS, implied rate (ch. 03) · Fiscal deficit, issuance, auctions, bid-to-cover, tails (ch. 07) · COT, Managed Money, commercial hedgers (ch. 08) · ETF flows (ch. 08) · Options/skew/put-call (ch. 09) · Priced in (ch. 12).

### Quiz de fondations

#### Quiz — Le CPI sort à 3.1% vs 3.4% attendu. Le 2Y baisse de 10 bps. Pourquoi le 2Y en particulier ?

**Le 2Y est la maturité qui incarne les attentes Fed à horizon ~2 ans.** Une inflation plus faible qu'attendu → le marché ajoute des cuts → le 2Y baisse en premier et le plus fort. Le 10Y bouge aussi mais est dilué par croissance/term premium.

#### Quiz — Prix d'une obligation ↓. Son yield fait quoi ? Et pourquoi ce n'est pas un détail ?

Yield ↑ (relation mécanique inverse). C'est essentiel parce que « les investisseurs vendent les Treasuries » et « les yields montent » sont LA MÊME PHRASE — et te dit qui agit : des vendeurs d'obligations, pas une abstraction.

#### Quiz — Inflation à 5%, Fed hyper-agressive qui monte les taux au-dessus. Biais Gold probable ?

**Bearish** (régime 2022) : la Fed crédible pousse les real yields en territoire très positif → coût d'opportunité élevé → Gold souffre malgré l'inflation. Le canal « hedge » ne domine que si la Fed est en retard ou perçue comme ayant abandonné (années 70).

#### Quiz — Gold monte de 2% et l'open interest GC baisse fortement. Interprétation ?

**Short covering** : des vendeurs ferment leurs positions (rachats forcés), pas d'argent neuf acheteur. Rally structurellement plus fragile qu'une hausse avec OI croissant.


---

# Chapitre 02 · Moteur n°1 historique

## Taux d'intérêt & Real Yields

L'or ne paie ni coupon ni dividende. Tout ce chapitre découle de cette phrase. Le rendement réel des actifs concurrents détermine ce que « coûte » le fait de détenir de l'or — et depuis 2022, cette logique a une exception majeure qu'il faut maîtriser aussi bien que la règle.

### 2.1 — La logique du coût d'opportunité

Tu as \$100,000. Deux options « sûres » :

- **Option A** : un TIPS 10 ans qui te garantit, disons, +2% de pouvoir d'achat PAR AN, garanti par l'État américain.
- **Option B** : de l'or, qui ne verse rien. Ton seul espoir de gain : que son prix monte.

Quand le rendement réel de l'option A est **élevé**, choisir l'or te fait renoncer à beaucoup → la demande d'investissement occidentale se tarit → pression baissière. Quand le rendement réel est **nul ou négatif** (2011-2012, 2020-2021), détenir de l'or ne coûte rien — pire, l'obligation « sûre » te fait PERDRE du pouvoir d'achat garanti → l'or devient rationnel → pression haussière.

La chaîne canonique real yields → Gold

Real yields ↓ (nominaux ↓ plus vite que les breakevens, ou breakevens ↑)

↓

Le coût d'opportunité de détenir un actif sans rendement diminue

↓

Les investisseurs occidentaux (ETF, fonds) ré-allouent vers l'or

↓  souvent en parallèle : USD ↓ (différentiel de taux)

Gold soutenu

### 2.2 — real ≈ nominal − breakeven : la formule et ses limites

La décomposition opérationnelle :

Décomposition d'un yield nominal

US10Y nominal (ex : 4.50%)  =  Real yield TIPS (ex : 2.10%)  +  Breakeven inflation (ex : 2.40%)

**Limites de la simplification** — à connaître pour ne pas sur-interpréter des variations de quelques bps :

- Le marché TIPS est moins liquide que les nominaux : en stress, une *prime de liquidité* pollue le real yield mesuré (mars 2020 : real yields en spike... artefact de liquidité).
- Le breakeven contient une *prime de risque d'inflation*, pas uniquement l'anticipation pure.
- Les TIPS indexent sur le CPI, la Fed cible le PCE — écart structurel de ~0.3-0.5 pt.

Conclusion pratique : utilise `DFII10` (10Y TIPS) et `DFII05` (5Y) comme baromètres directionnels sur des mouvements de ≥5-10 bps, pas comme des instruments de précision au bp près.

### 2.3 — LA question : pourquoi le yield bouge-t-il ?

C'est le point que 90% des analyses retail ratent. « US10Y +15 bps » n'est pas une information suffisante. Quatre causes très différentes :

| Cause de la hausse du 10Y                                                             | Signature observable                                                    | Real yields | USD     | Effet Gold typique                                         |
|---------------------------------------------------------------------------------------|-------------------------------------------------------------------------|-------------|---------|------------------------------------------------------------|
| **Croissance forte** (bonnes surprises éco)                                           | Real yields ↑, breakevens stables/↑ légers, actions ↑                   | ↑           | ↑       | Bearish                                                    |
| **Peur d'inflation** (choc énergie, salaires)                                         | Breakevens ↑ mènent, real yields stables → puis Fed reprice             | Stable→↑    | Mixte   | Neutre puis bearish si la Fed réagit (cas 2026)            |
| **Repricing Fed hawkish**                                                             | 2Y ↑ mène la courbe (bear flattener), real yields ↑                     | ↑↑          | ↑       | Très bearish                                               |
| **Term premium / peur fiscale** (émissions massives, dégradation, doute sur la dette) | 30Y ↑ mène (bear steepener), enchères faibles, actions ↓, USD parfois ↓ | ↑ mais…     | Mixte/↓ | Peut être BULLISH : fuite hors de la duration US vers l'or |

**Règle de lecture**

Avant d'interpréter un mouvement de taux, regarde **(1) quelle maturité mène** (2Y = Fed ; 30Y = fiscal/term premium), **(2) la décomposition real vs breakeven**, **(3) la réaction des actions et du dollar**. Trois secondes de plus, une erreur de biais en moins.

### 2.4 — La courbe des taux en pratique : le spread 2s10s, steepener, flattener

Rappel élémentaire : le **spread 2s10s** = yield 10 ans − yield 2 ans. C'est LA mesure standard de la pente de la courbe. Positif et large = courbe pentue (normal : on exige plus pour prêter longtemps). Proche de zéro = courbe plate. Négatif = courbe inversée (le court rapporte plus que le long — signal récession historique, chaque récession US depuis 50 ans a été précédée d'une inversion).

Quand tu lis « la courbe s'aplatit » (*flattening*) : le spread diminue. Quand elle « se pentifie » (*steepening*) : il augmente. Mais — même logique que pour un yield isolé — **la pente seule ne dit rien : il faut savoir QUELLE patte bouge.** Quatre configurations, quatre lectures :

| Configuration                                   | Mécanique                                                                                                               | Ce que ça raconte                                                                                                                                                                                                         | Gold                                                                                                                              |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **Bear flattener** (2Y ↑ plus vite que 10Y)     | Le 2Y suit la Fed → repricing hawkish ; le 10Y monte peu car la croissance future est mise en doute par le resserrement | « La Fed serre (ou va serrer) et le marché pense que ça va freiner l'économie. » C'est LA signature d'une Fed qui court après une inflation court terme — configuration 2022 et H1 2026 (hikes pricés → 2Y ↑, 10Y stable) | Bearish à court terme (real yields ↑, USD ↑)… mais chaque bear flattening rapproche la récession, donc sème le pivot dovish futur |
| **Bull flattener** (10Y ↓ plus vite que 2Y)     | Fuite vers la duration : croissance/inflation futures revues en baisse, la Fed n'a pas encore bougé                     | « Le marché sent le ralentissement avant la Fed »                                                                                                                                                                         | Mixte → devient bullish quand le 2Y finit par suivre (cuts pricés)                                                                |
| **Bull steepener** (2Y ↓ plus vite que 10Y)     | Le marché price des cuts imminents/urgents                                                                              | Début de cycle de baisse, souvent pré/début récession                                                                                                                                                                     | Historiquement le meilleur environnement Gold côté taux (real yields courts s'effondrent)                                         |
| **Bear steepener** (10Y/30Y ↑ plus vite que 2Y) | Term premium ↑ : peur fiscale, émissions massives, dégoût de la duration US                                             | « Qui va acheter toute cette dette ? »                                                                                                                                                                                    | Peut être bullish Gold (canal débasement, ch. 07) — le cas où yields ↑ et Gold ↑ coexistent                                       |

**Résumé de la logique de ta note — validée et complétée**

Oui : un aplatissement peut venir soit (a) d'une Fed trop restrictive (2Y monte car il suit la Fed, 10Y stagne/baisse car la croissance anticipée faiblit — bear flattener), soit (b) d'une anticipation de récession (10Y baisse — bull flattener). Les deux existent, et la distinction se fait en regardant **laquelle des deux pattes bouge le plus** — exactement le réflexe « quelle maturité mène » du §2.3. Ajoute le spread `TVC:US10Y-TVC:US02Y` à ta watchlist avancée : sa direction + la patte motrice = un diagnostic de régime en un chart.

### 2.5 — La relation Gold/Real Yields : quand y croire, quand s'en méfier

Les faits, honnêtement :

- **2006-2021** : corrélation inverse remarquablement stable (corrélation roulante 12 mois moyenne autour de -0.7). Le chart « Gold vs 10Y TIPS inversé » était le plus fiable de la macro or.
- **2022-2025** : rupture. La BCE elle-même documente que la corrélation négative s'est effondrée après l'invasion de l'Ukraine et le gel des réserves russes. L'or a fait des sommets historiques (\$3,000 → \$4,000 → \$5,000+) avec des real yields ~+2%, du jamais vu dans le modèle classique.
- **Cause identifiée par le consensus des desks** (CME, JPM, Amundi, ECB, WGC) : l'*acheteur marginal* a changé. Les ETF occidentaux (sensibles aux real yields) ont cédé la place aux banques centrales (motivées par la géopolitique et la diversification hors USD — insensibles aux real yields), à \>1,000 t/an en 2022-2024.

Le framework de fiabilité — à qui appartient le flux marginal ?

Qui est l'acheteur/vendeur marginal du moment ?

Flux occidental domine (ETF, fonds, CTA)

Régime « financier »

↓

La relation real yields ↔ Gold FONCTIONNE → fais-lui confiance

Indices : ETF flows corrélés au prix, COT Managed Money actif, Gold suit DFII10 tick par tick les jours de données US.

Flux souverain/physique domine (banques centrales, Chine, refuge)

Régime « géopolitique / débasement »

↓

La relation est AMORTIE ou cassée → un autre moteur domine

Indices : Gold monte malgré real yields ↑, primes Shanghai élevées, achats BC records, corrélation 30j Gold/DXY proche de 0 ou positive.

**Position honnête du débat professionnel (2026)**

Thèse A : « les real yields restent le moteur dominant, 2022-2025 est une anomalie temporaire de flux souverains ». Thèse B : « le régime a structurellement changé, la sensibilité aux real yields a diminué de façon permanente ». Le consensus des desks (formulation CME Group) : *la relation n'est pas morte, sa sensibilité relative a diminué*. Traduction opérationnelle : garde les real yields comme moteur de référence intraday/swing (les repricings Fed bougent toujours GC violemment — le H1 2026 le prouve : real yields ↑ → Gold -26%), mais ne shorte jamais l'or SEULEMENT parce que les real yields sont « trop hauts » — le bid structurel peut absorber pendant des années.

### 2.6 — Charts à superposer

| Chart                   | Symbole                                             | Usage                                                                        |
|-------------------------|-----------------------------------------------------|------------------------------------------------------------------------------|
| 10Y TIPS real yield     | FRED:DFII10 (TradingView accepte les symboles FRED) | Baromètre principal du coût d'opportunité. Superpose Gold, échelle inversée. |
| 5Y real yield           | FRED:DFII5                                          | Plus sensible au cycle Fed court.                                            |
| Breakeven 10Y           | FRED:T10YIE                                         | Décomposer : la hausse du nominal vient-elle de l'inflation anticipée ?      |
| 2Y / 10Y / 30Y nominaux | TVC:US02Y · TVC:US10Y · TVC:US30Y                   | Quelle maturité mène = quelle cause.                                         |

#### Quiz — US10Y +12 bps aujourd'hui. Breakeven 10Y +11 bps. Real yield ~flat. Gold devrait faire quoi ?

**Pas grand-chose de bearish, voire rebond.** La hausse du nominal est presque entièrement de l'inflation anticipée : le coût d'opportunité réel n'a pas bougé, et le narratif « inflation » peut même soutenir l'or. Ceux qui vendent Gold sur « yields ↑ » sans décomposer se font piéger.

#### Quiz — 30Y +18 bps, 2Y +3 bps, enchère 30Y ratée (gros tail), actions -1.5%, DXY -0.4%. Lecture ?

**Bear steepener de term premium / peur fiscale.** Le marché exige plus pour détenir la duration US. C'est le scénario où « yields ↑ » peut être BULLISH Gold : fuite hors des Treasuries, l'or comme réserve alternative. Le DXY en baisse simultanée confirme (défiance envers les actifs US, pas resserrement).


---

# Chapitre 03 · Le métronome

## La Fed & le Rate Pricing

La Fed ne bouge pas l'or directement. Elle bouge les **attentes**, qui bougent les yields, les real yields et le dollar. Ce chapitre t'apprend à lire ce que le marché price — parce que le biais Gold vit dans l'écart entre le pricing et la réalité.

### 3.1 — Ce que fait la Fed vs ce que le marché pense qu'elle fera

Distinction fondatrice. La Fed agit 8 fois par an. Le marché, lui, reprice sa trajectoire **toutes les secondes**, sur chaque donnée, chaque discours, chaque headline. Quand tu regardes GC bouger à 8h31 un jour de CPI, tu ne regardes pas la Fed : tu regardes le marché réviser son modèle de la Fed.

Le vrai canal de transmission

Donnée / discours / événement

↓  en millisecondes

Repricing des Fed Funds Futures & SOFR futures (la trajectoire anticipée change)

↓

2Y yield (l'incarnation obligataire des attentes Fed)

↓

10Y, real yields, USD

↓

GOLD

**Conséquence pratique**

Ton indicateur avancé n°1 pour GC en séance macro : **le 2Y yield** (et le contrat SOFR). Si le 2Y casse violemment à la baisse, le carburant haussier Gold arrive, souvent avec quelques secondes/minutes de propagation. Beaucoup de traders GC gardent ZT (2Y future) ou le 2Y yield en permanence à l'écran.

### 3.2 — Lire le pricing : Fed Funds Futures & FedWatch

#### Comment « le marché price 3 cuts » est calculé \[mécanique\]

**L'instrument:** Les Fed Funds Futures (CME, symbole ZQ) cotent `100 − taux moyen attendu du mois`. Un future décembre à 96.75 ⇒ le marché anticipe un Fed Funds moyen de 3.25% en décembre.

**Le calcul:** Taux actuel 3.50-3.75% (milieu 3.625%). Si le future décembre implique 2.875%, l'écart est de -0.75% = **3 cuts de 25 bps pricés d'ici décembre** (en probabilité pondérée : « 3 cuts pricés » peut être 100% de proba de 3 cuts, ou 50% de 2 et 50% de 4…).

**L'outil:** **CME FedWatch** (gratuit) convertit tout ça en probabilités par réunion : « proba de hike de 25 bps au FOMC de septembre : 47% ». C'est LA page à consulter chaque matin. L'OIS (Overnight Index Swap) donne la même info côté swaps — utile à connaître car les pros citent souvent « l'OIS price X ».

**Erreur fréquente:** Croire que le pricing est une prévision fiable. C'est une photo des anticipations — qui se trompe souvent (début 2026 : « plusieurs cuts » pricés → réalité : débat de hikes). Ce qui est tradable, c'est le CHANGEMENT du pricing.

### 3.3 — Exemple numérique complet : de « 3 cuts » à « 1 cut »

Choc : CPI beaucoup plus haut qu'attendu

Avant : marché price 75 bps de cuts d'ici décembre (« 3 cuts »)

↓  CPI +0.6% MoM vs +0.3% attendu

Après : marché ne price plus que 25 bps (« 1 cut »)

↓  effet mécanique

Front-end : 2Y +20 à +30 bps (il absorbe le gros du repricing)

↓

10Y +10 à +15 bps · Real yields ↑ (les breakevens montent moins que les nominaux si la Fed est crédible)

↓

USD ↑ (les taux US deviennent plus attractifs vs EUR/JPY)

↓

Gold : pression baissière forte, souvent -1% à -2.5% selon l'ampleur et le positionnement

Retiens l'ordre de grandeur relatif : **le 2Y encaisse le repricing, le 10Y en prend la moitié, le Gold réagit à la combinaison real yields + USD, amplifiée si le positionnement était crowded dans l'autre sens.**

### 3.4 — Le jour FOMC : anatomie

| Heure (ET)  | Événement                                | Ce qui peut surprendre                                                                                                                      |
|-------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| 14:00       | Communiqué + décision (+ SEP/dots 4×/an) | La décision elle-même (rarement — presque toujours pricée), les changements de MOTS du communiqué, les dots (médiane année en cours et N+1) |
| 14:30       | Conférence de presse                     | Le ton. Un Chair peut renverser la lecture du communiqué en 2 phrases. Les inversions de mouvement 14h00→15h00 sont fréquentes.             |
| +3 semaines | Minutes                                  | La répartition interne du comité (ex : juin 2026, split 9-8 sur les hikes → choc hawkish rétroactif).                                       |

**Règle des jours FOMC**

Jour FOMC : ton biais macro pré-14h a une **durée de vie qui expire à 13h59**. Le premier mouvement post-communiqué est souvent algo + repositionnement, contredit pendant la presser. Beaucoup de traders GC pros ne prennent la direction « propre » qu'après 15h00, quand le vrai repricing s'est installé.

### 3.5 — Personnel, nominations, indépendance

Pourquoi la nomination d'un Fed Chair bouge l'or avant toute décision : parce que le marché price une **fonction de réaction** — la façon dont la personne répondra aux données futures. Un Chair perçu dovish = distribution des trajectoires futures décalée vers le bas = cuts pricés plus tôt = real yields ↓ = Gold ↑, le jour de la rumeur, pas le jour du premier cut. Cas réel : l'arrivée de Kevin Warsh (hawkish assumé) a contribué au repricing brutal de 2026. Second canal, plus profond : toute attaque perçue contre l'**indépendance de la Fed** (pressions politiques pour couper les taux) nourrit le narratif débasement → structurellement bullish Gold, même si les taux ne bougent pas.

### 3.6 — La doctrine Warsh : deux ruptures qui changent la lecture (2026)

Deux idées circulent sur le régime Fed actuel — je les ai vérifiées, elles sont fondées, et elles ont chacune une conséquence opérationnelle directe.

**Rupture 1 — « Forcer le marché à pricer les données lui-même. »** L'ère Bernanke-Yellen-Powell reposait massivement sur la *forward guidance* : la Fed télégraphiait sa trajectoire, le marché suivait la Fed. Warsh est un critique historique et documenté de cette approche (et du gonflement du bilan) : sa doctrine est de réduire la guidance et de laisser les données parler — *la Fed va vers le marché au lieu que le marché aille vers la Fed*. Conséquence mécanique vérifiable : moins de guidance = plus d'incertitude sur la trajectoire = **chaque donnée porte plus de poids** = volatilité des taux plus élevée (surveille le MOVE) et réactions aux publications AMPLIFIÉES. Traduction pour ton système : en régime « faible guidance », les événements Tier 1 montent d'un cran en importance, le mode événement du framework devient encore plus strict, et les jours de données sont structurellement plus violents sur GC.

**Rupture 2 — « D'où vient la croissance ? »** L'ancienne heuristique (croissance forte ⇒ risque d'inflation ⇒ Fed restrictive) est remplacée par une question plus fine sur la COMPOSITION de la croissance : si elle vient de crédit facile, de demande artificiellement stimulée ou de dépense publique excessive → inflationniste → hawkish ; si elle vient d'un choc de **productivité** (produire plus avec moins de ressources) → non inflationniste, voire désinflationniste → la Fed peut tolérer une croissance forte SANS serrer. C'est de l'économie standard (le précédent : les années 1990, boom de productivité IT, croissance forte + inflation sage + Greenspan qui refuse de serrer). Conséquence pour ton biais : un chiffre de croissance fort n'est plus automatiquement hawkish/bearish Gold — il faut demander « le marché va-t-il le lire comme productif (IA, ch. 5.5) ou comme artificiel (fiscal, crédit) ? ». Le même GDP à +3.5% peut produire deux réactions opposées selon le narratif de composition dominant.

**Garde-fou**

Ces deux ruptures décrivent une *fonction de réaction annoncée* — pas encore un long historique observé. Traite-les comme un prior à confirmer par les faits : est-ce que les réactions aux données sont effectivement plus larges (compare les moves post-CPI 2026 vs 2024) ? Est-ce que la Fed a réellement toléré une croissance « productive » sans serrer ? Ton audit tranchera — comme toujours.

#### Quiz — La Fed coupe de 25 bps. Gold chute de 1.5% dans l'heure. Trois explications possibles ?

1\) Le cut était 100% pricé et les **dots/la presser sont hawkish** (« hawkish cut » : on coupe mais on signale la fin du cycle). 2) **Sell the news** : le positionnement long s'était accumulé sur l'anticipation, il se décharge. 3) Le marché pricait une petite proba de 50 bps → 25 bps est une déception relative. Dans les trois cas : la surprise relative, pas l'acte.

#### Quiz — Discours d'un gouverneur Fed régional non-votant à 13h. Le traiter comme du Powell ?

Non. Hiérarchie : Chair \>\> Vice-Chair & gouverneurs du Board (votent toujours) \> présidents régionaux votants cette année \> non-votants. Un non-votant connu pour être faucon qui dit un truc hawkish = zéro information nouvelle. Le même mot dans la bouche du Chair = repricing. Toujours pondérer par QUI parle et si c'est NOUVEAU pour cette personne.


---

# Chapitre 04 · Le paradoxe central

## Inflation

« L'or protège de l'inflation » est à la fois vrai sur 50 ans et dangereusement faux sur 5 jours. Ce chapitre résout le paradoxe : l'effet de l'inflation sur l'or dépend entièrement de la réponse anticipée de la Fed.

### 4.1 — Les deux canaux rivaux

INFLATION ↑ — qui gagne le bras de fer ?

Inflation au-dessus des attentes

Canal A — Fed crédible (domine à court terme)

Marché reprice hawkish (moins de cuts / hikes)

↓

2Y ↑, real yields ↑, USD ↑

↓

Gold ↓

Régimes : 2022, H1 2026. Condition : le marché croit que la Fed va agir.

Canal B — Débasement / Fed en retard (domine à long terme si la crédibilité craque)

Marché doute que la Fed suive (retard, pression politique, dominance fiscale)

↓

Breakevens & 5Y5Y ↑ ≥ nominaux → real yields stables/↓

↓

Gold ↑

Régimes : années 1970, 2020-2021 (Fed volontairement « behind the curve », AIT).

#### Comment déterminer quel canal domine — le test en 3 questions

- **1. Que font les real yields le jour même ?** S'ils montent sur la donnée inflation → canal A actif. S'ils sont flat/baissent (breakevens absorbent tout) → canal B.
- **2. Que fait le 5Y5Y forward ?** Ancré autour de 2-2.5% → la crédibilité tient → canal A. En dérive haussière persistante → désancrage → canal B s'installe.
- **3. La Fed a-t-elle la capacité politique/fiscale de serrer ?** Dette énorme + pressions politiques + économie fragile = le marché peut parier qu'elle tolérera l'inflation → canal B.

### 4.2 — Anatomie d'un CPI : lire 6 chiffres en 10 secondes

| Chiffre                            | Priorité | Pourquoi                                                                                                                                         |
|------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Core CPI MoM vs attentes           | 1        | La surprise la plus « propre » sur la tendance sous-jacente : c'est elle qui reprice la Fed.                                                     |
| Headline MoM vs attentes           | 2        | Réaction algo initiale ; important quand l'énergie est le sujet (2026 : oui).                                                                    |
| Core YoY / Headline YoY            | 3        | Le narratif de fond (« l'inflation est à 4.2%, plus haut de 3 ans »).                                                                            |
| Supercore (services hors logement) | 4        | Obsession Fed : capte la boucle salaires-services.                                                                                               |
| Shelter (logement)                 | 5        | ~1/3 du panier, très retardé (loyers observés avec ~12 mois de lag) : une inflation tirée uniquement par le shelter est « vieille ».             |
| Goods vs Services                  | 6        | Goods = chaînes d'appro/Chine (volatile) ; Services = domestique/salaires (persistant). Une inflation de services inquiète beaucoup plus la Fed. |

**Le réflexe pro**

La question à 8h31 n'est jamais « le chiffre est-il haut ? » mais « **ce chiffre change-t-il la trajectoire probable de la Fed par rapport à ce qui était pricé à 8h29 ?** ». Un CPI « haut » parfaitement en ligne avec les attentes = non-événement, voire rally de soulagement si le marché craignait pire (« whisper number »).

**La troisième source d'inflation : l'État (validation de ta note)**

Exact, et sous-enseigné : à côté de la demande privée et des salaires, le **gouvernement** est un moteur d'inflation à part entière, par deux canaux. **Canal demande** : un déficit de 6-7% du PIB injecte du pouvoir d'achat que le secteur privé n'a pas gagné — c'est de la demande nette qui pousse les prix (c'est le cœur du débat post-COVID 2021-22). **Canal efficacité** : dépense publique mal allouée, gaspillage, capture/corruption = des ressources consommées sans production correspondante — inflationniste par destruction d'offre relative (cas extrêmes : économies émergentes ; version douce : n'importe quel État). Pour ton système : ce canal se lit dans le pilier fiscal (ch. 07) et dans la question de composition de la croissance (ch. 3.6) — une croissance tirée par la dépense publique est le cas d'école « artificiel = inflationniste = hawkish », mais si le marché doute que la Fed puisse compenser un fiscal débridé (dominance fiscale), on bascule dans le canal B débasement, bullish Gold. Même donnée, deux issues, selon la crédibilité.

### 4.3 — Cas réel intégral : le choc pétrolier de 2026

Séquence : blocage d'Hormuz fin février → WTI \$65→\$110 → l'énergie se propage au headline CPI (4.2% en juin) → les anticipations de cuts s'évaporent, des hikes se pricent → real yields ↑ → Gold -26% depuis le pic. Puis : désescalade partielle, pétrole retombe vers \$68 → la composante énergie va mécaniquement dégonfler les prochains CPI → le marché commence à pricer le « peak hawkishness ». **Leçon** : une inflation d'origine énergétique est traitée par le marché comme potentiellement transitoire — le pétrole lui-même devient un input de ton biais Gold (WTI ↓ = désinflation à venir = re-pricing dovish possible = support Gold). En 2026, ajoute CL (pétrole) à ta watchlist Gold.

#### Quiz — CPI headline +0.5% MoM (attendu +0.3%) mais Core +0.2% (attendu +0.3%), tout l'écart vient de l'essence. Réaction Gold probable au-delà de la première minute ?

Premier spike algo bearish possible sur le headline, puis **retournement fréquent** : le Core sous les attentes est la vraie info pour la Fed (l'énergie est volatile et la Fed « voit à travers » un choc pétrole s'il ne contamine pas le core). Si le 2Y finit en baisse sur la journée, le biais Gold est haussier, pas baissier. Ne jamais trader la première bougie d'un CPI mixte.

#### Quiz — Le 5Y5Y forward passe de 2.3% à 2.9% en 6 semaines pendant que la Fed hésite à monter. Signal ?

**Début de désancrage des anticipations = le marché doute de la volonté/capacité de la Fed.** C'est un des signaux structurellement les plus bullish Gold (bascule vers le canal B / régime débasement). À confirmer avec : real yields qui ne suivent pas les nominaux, USD faible malgré yields hauts, Gold résilient aux mauvaises nouvelles.


---

# Chapitre 05

## Emploi & Croissance

L'emploi et la croissance n'agissent sur l'or qu'à travers un intermédiaire : la fonction de réaction de la Fed, et parfois le sentiment de risque. Ce chapitre t'apprend la lecture multidimensionnelle — jamais un chiffre isolé.

### 5.1 — Le canal standard emploi → Gold

NFP fort vs attentes (canal standard)

NFP 250k vs 180k attendu

↓

Économie résiliente → moins d'urgence à couper (ou plus de raisons de monter)

↓

2Y ↑ → real yields ↑ → USD ↑

↓

Gold ↓

### 5.2 — La lecture multidimensionnelle du rapport emploi

Le rapport du BLS contient DEUX enquêtes indépendantes : l'enquête établissements (→ NFP, salaires) et l'enquête ménages (→ taux de chômage, participation). Elles divergent régulièrement. L'arbre de lecture :

| Élément                  | Question à poser                                                                                   | Piège classique                                                                                                                   |
|--------------------------|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **NFP headline**         | Écart vs consensus ? vs whisper ?                                                                  | Réagir au headline seul.                                                                                                          |
| **Révisions M-1 et M-2** | Le passé vient-il d'être réécrit ? (révisions de -50k à -100k fréquentes en retournement de cycle) | Un NFP « fort » avec -110k de révisions est un rapport neutre/faible. Les algos ratent souvent ça 30 secondes, puis ça s'inverse. |
| **Taux de chômage**      | Monte-t-il alors que NFP est bon ? (divergence des enquêtes = fissures)                            | Ignorer la « Sahm rule » : +0.5 pt de chômage vs son creux 12 mois = signal récession historique.                                 |
| **AHE (salaires) MoM**   | Boucle salaires-prix ? +0.5% MoM est inflationniste (hawkish) même si NFP est moyen.               | Oublier que salaires forts + emploi faible = stagflationnaire = lecture compliquée.                                               |
| **Participation**        | Le chômage baisse-t-il « pour de mauvaises raisons » (gens qui quittent la force de travail) ?     | Lire le taux de chômage sans son dénominateur.                                                                                    |

**Cas type — le rapport « fort-faible »**

NFP +250k (fort), MAIS révisions -80k, chômage 4.1%→4.3%, salaires +0.2%. Lecture pro : rapport **faible déguisé**. Réaction fréquente : spike bearish Gold immédiat (algos sur le headline), puis inversion complète en 15-60 min quand les humains digèrent les détails. La price action montre souvent l'absorption du premier mouvement — la macro t'explique pourquoi elle a lieu, et la lecture devient haussière, pas baissière.

### 5.3 — Croissance : les régimes d'atterrissage

#### Soft landing / Hard landing / Récession / Stagflation / Reflation \[régimes\]

**Soft landing:** L'inflation revient à la cible SANS récession. La Fed coupe tranquillement, croissance OK. Gold : modérément soutenu par la baisse des taux, mais concurrencé par le risk-on actions. Biais léger + seulement.

**Hard landing / Récession:** L'économie casse : chômage ↑↑, ISM \<45, claims en tendance haussière. Fed coupe agressivement → real yields s'effondrent → très bullish Gold… APRÈS la phase éventuelle de panique-liquidation (voir ch. 10) et une fois les cuts pas encore totalement pricés.

**Stagflation:** Croissance faible + inflation élevée (choc d'offre type pétrole 2026). La Fed est coincée. Historiquement LE meilleur régime pour l'or (années 70) SI la Fed choisit de protéger la croissance. MAIS si elle choisit l'inflation (Volcker, Warsh ?), bearish. Le biais dépend de la fonction de réaction → surveiller les discours plus que les données.

**Reflation:** Rebond de croissance + d'inflation depuis un creux (post-récession, stimulus). Yields ↑ tirés par la croissance ET les breakevens : real yields souvent stables → Gold mixte, généralement dominé par le risk-on (sous-performe les actions).

### 5.4 — Matrice Croissance × Inflation × Fed × Gold

| Régime                      | Croissance | Inflation     | Réaction Fed probable                 | Real yields                   | Gold                                      |
|-----------------------------|------------|---------------|---------------------------------------|-------------------------------|-------------------------------------------|
| Goldilocks / soft landing   | Solide     | ↓ vers cible  | Cuts graduels « de confort »          | ↓ doucement                   | Légèrement +, concurrencé par les actions |
| Surchauffe                  | Forte      | ↑             | Hawkish, hikes                        | ↑↑                            | Bearish (2022, H1 2026)                   |
| Stagflation, Fed dovish     | Faible     | ↑             | Tolère l'inflation (protège l'emploi) | ↓↓ (nominaux ↓, breakevens ↑) | Très bullish (années 70)                  |
| Stagflation, Fed hawkish    | Faible     | ↑             | Combat l'inflation malgré la casse    | ↑                             | Bearish (Volcker 1980-82)                 |
| Récession désinflationniste | ↓↓         | ↓             | Cuts agressifs, QE possible           | ↓↓                            | Bullish après la phase de liquidation     |
| Reflation                   | Rebond     | Rebond modéré | Patiente                              | ~stables                      | Neutre/mixte                              |

### 5.5 — L'IA comme facteur macro (nouveau moteur, vérifié)

Ta note est juste et les chiffres tiennent : les 5 grands hyperscalers (Microsoft, Amazon, Alphabet, Meta, Oracle) ont confirmé au Q1 2026 un capex combiné d'environ **\$700-800 milliards pour 2026** (+~60% vs 2025), dont ~75% (~\$545 Md) en pur hardware/infra IA — GPU, data centers, énergie (sources : earnings calls, CreditSights, Goldman Sachs). C'est le plus grand cycle d'investissement coordonné de l'histoire (~1% du PIB US), et c'est devenu un facteur macro de plein droit, avec exactement la double temporalité que tu as notée :

L'IA et l'inflation — les deux phases

CAPEX IA massif (~\$700-800 Md/an)

Phase 1 · Court terme (maintenant) = plutôt inflationniste

Demande énorme et inélastique de puces, data centers, cuivre, ÉLECTRICITÉ (contrainte n°1)

↓

Prix de l'énergie et des inputs sous tension + croissance soutenue → moins de raisons de couper

↓

Canal Gold : croissance résiliente = Fed moins dovish = vent contraire

Phase 2 · Moyen-long terme (si ça marche) = désinflationniste

Gains de productivité : produire plus avec moins de travail/ressources

↓

Croissance forte SANS inflation (précédent : boom productivité années 90) → la Fed peut tolérer (lecture « composition de la croissance », ch. 3.6)

↓

Canal Gold ambigu : real yields modérés (ok) mais risk-on actions dominant (concurrence)

#### Les trois canaux par lesquels l'IA touche réellement le Gold

- **Canal Fed/croissance** (actif) : le capex IA soutient le GDP et l'emploi construction/énergie → repousse les cuts → bearish Gold tant que ça tient.
- **Canal fragilité financière** (le plus important pour toi) : une part croissante du capex est financée par **émission de dette** (vague obligataire des hyperscalers documentée par CreditSights ; Goldman note que les investisseurs pénalisent déjà les capex financés par dette) + une couche spéculative leveragée sur les actions IA. Un retournement de ce complexe = choc risk-off majeur → séquence classique pour l'or : liquidation éclair (canal 3, ch. 10) PUIS rally refuge/cuts. Le complexe IA est donc à la fois un frein quotidien et une option haussière géante en cas d'accident. Surveille : SMH/NVDA comme thermomètre, credit spreads (ch. 21 asymétries), et le funding (carry — ch. 21).
- **Canal électricité→inflation** : la contrainte physique (data centers = demande électrique explosive) pousse les prix de l'énergie — un contributeur au CPI qui n'existait pas au cycle précédent.

**Correction d'une simplification de ta source**

« Toute la bulle IA est financée par le carry yen » est FAUX en l'état : le capex des hyperscalers est financé d'abord par leurs cash-flows colossaux, ensuite par de l'émission de dette corporate USD. Le carry yen (~\$300-500 Md estimés au pic) finance la **couche spéculative leveragée** autour du thème (positions momentum, hedge funds) — c'est un amplificateur de fragilité, pas la source du capex. La distinction compte : un unwind du carry frappe les POSITIONS (violent, rapide — 5 août 2024), pas directement le programme d'investissement. Détail complet au chapitre 21.

#### Quiz — ISM Services passe de 52 à 48, claims montent depuis 5 semaines, mais le NFP du mois était correct. Que privilégier ?

**La tendance des indicateurs avancés (ISM, claims) sur le chiffre retardé et bruité (NFP).** Le marché aussi : il commencera à re-pricer des cuts avant que le NFP casse. Biais Gold : de plus en plus supporté (horizon swing), avec pour catalyseur de confirmation le prochain rapport emploi.


---

# Chapitre 06

## Le Dollar & la Liquidité

L'or est coté en dollars et concurrence le dollar comme réserve de valeur. La relation inverse est réelle — mais ses exceptions sont exactement les moments les plus importants de l'histoire récente de l'or.

### 6.1 — Pourquoi l'inversion Gold/USD existe

- **Mécanique de cotation** : Gold = \$/oz. USD plus fort → l'or devient plus cher pour tout acheteur non-américain (en EUR, INR, CNY) → demande mondiale freinée → prix \$ pressé. Effet symétrique à la baisse du dollar.
- **Canal macro** : USD fort accompagne généralement des taux US attractifs (real yields ↑) → double vent contraire.
- **Canal réserve de valeur** : l'or est « l'anti-monnaie ». La confiance dans le dollar et l'attrait de l'or sont deux faces de la même pièce.

### 6.2 — Quand Gold et DXY montent ENSEMBLE (les cas qui comptent)

| Situation                                        | Mécanisme                                                                                                                           | Exemple                                                             |
|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| **Panique géopolitique globale**                 | Demande simultanée des deux refuges : dollar (liquidité) ET or (valeur). Les deux montent contre tout le reste.                     | Débuts de guerres, escalades nucléaires ; épisodes de 2022 et 2026. |
| **Crise hors-USA**                               | L'Europe/Asie va mal → capitaux fuient vers USD ET or ; l'or en EUR/JPY explose, l'or en USD monte moins mais monte.                | Crise de l'euro 2010-2012.                                          |
| **Achats banques centrales insensibles au prix** | Le bid souverain achète pour des raisons géopolitiques, peu importe le niveau du dollar → la corrélation se dilue vers 0.           | 2022-2025 : périodes entières de corrélation nulle/positive.        |
| **Crise de confiance dans TOUTES les fiat**      | Le DXY mesure le dollar contre d'autres papiers ; si tout le papier est suspect, l'or monte contre tout, DXY inchangé ou en hausse. | Narratif débasement 2024-2025 (déficits G7 généralisés).            |

**Outil : la corrélation roulante 30 jours Gold/DXY**

Calcule (ou observe) la corrélation Gold-DXY sur 30 jours glissants — un KPI naturel du terminal (ch. 20). **Fortement négative (≤ -0.5)** : régime « financier » classique → le DXY est un input directionnel fiable. **Proche de 0 ou positive** : un autre moteur domine (souverain/refuge) → dégrade le poids du DXY dans ton biais. C'est un détecteur de régime automatique.

### 6.3 — Quels crosses regarder au-delà du DXY

- **EURUSD** : ~58% du DXY — il EST le DXY à peu de chose près. Regarde-le pour savoir si un mouvement DXY est « euro-driven » (BCE, politique européenne) plutôt qu'américain.
- **USDJPY** : le baromètre des taux (il colle au différentiel US-Japon) et du carry. Un USDJPY qui décroche violemment = unwind de carry = stress de liquidité global → attention aux liquidations sur tout, or compris (août 2024).
- **USDCNH** : crucial pour l'or. Un yuan qui se déprécie = les Chinois cherchent à protéger leur épargne → demande d'or physique domestique ↑ (primes SGE ↑). Et la PBoC gère le yuan tout en accumulant l'or : USDCNH est une fenêtre sur la demande chinoise structurelle. Voir chapitre 09/flux.

### 6.4 — La liquidité macro : ce que les pros regardent vraiment

Définition de travail : la **liquidité** = l'abondance de monnaie de réserve disponible dans le système pour porter des actifs. Le modèle simpliste « bilan Fed ↑ = tout monte » est un raccourci : ce qui compte, c'est la **liquidité nette** effectivement disponible pour le système bancaire :

Liquidité nette (framework façon Fed plumbing)

Réserves bancaires ≈ Bilan Fed − TGA (compte du Trésor à la Fed) − ON RRP (reverse repo)

↓  pourquoi ces deux soustractions :

Quand le Trésor remplit son compte (TGA ↑, ex : après un accord sur le debt ceiling, grosses émissions), il aspire des réserves du système → drainage. Quand les fonds monétaires parquent au RRP, idem.

↓

QT = drainage lent · Fin du QT (2025) = un frein qui saute · QE = injection

- **Lien Gold, honnêtement** : la liquidité agit sur l'or surtout via (1) les real yields et le dollar qu'elle influence, (2) l'appétit spéculatif global, (3) le narratif débasement quand l'expansion est massive (2020). C'est un moteur de *toile de fond* (swing/structurel), quasi jamais un signal intraday — sauf accident de plomberie (repo sept. 2019 → pivot Fed → bullish).
- **Où regarder** : FRED `WALCL` (bilan), `RRPONTSYD` (RRP), `WTREGEN` (TGA). Ressource de référence sur la plomberie : Joseph Wang (fedguy.com).

#### Quiz — Escalade militaire majeure dans la nuit : DXY +0.9%, Gold +1.8% simultanément. Contradiction avec la corrélation inverse ?

Non — **régime panique** : les deux refuges sont achetés en même temps contre les actifs risqués et les autres devises. La corrélation inverse est une propriété des régimes calmes « financiers ». Erreur mortelle : shorter l'or « parce que le dollar monte » un jour de crise géopolitique.

#### Quiz — USDCNH monte régulièrement depuis 3 mois (yuan faible) et les primes or de Shanghai passent de \$5 à \$45/oz au-dessus de Londres. Lecture ?

**Demande physique chinoise en surchauffe** (fuite devant la dépréciation + méfiance immobilier/actions). C'est un plancher structurel sous le marché : les corrections deviennent plus courtes et moins profondes. Biais : support structurel bullish, horizon semaines-mois — pas un signal d'achat à 10h30.


---

# Chapitre 07 · Le moteur montant

## Treasury & Dynamique Fiscale

Le thème fiscal est passé de « sujet de fond pour économistes » à moteur de premier plan de l'or depuis 2023-2025. C'est aussi le plus facile à transformer en slogan creux (« la dette explose donc achetez de l'or !!! »). Ici : la version rigoureuse.

### 7.1 — Vocabulaire opérationnel

#### Déficit, dette, issuance, auctions, bid-to-cover, tails \[fiscal\]

**Déficit / dette:** **Déficit** = dépenses − recettes d'une année (~6-7% du PIB US ces dernières années, inédit hors récession/guerre). **Dette** = le stock accumulé (\>120% du PIB). Le déficit doit être financé par l'émission (**issuance**) de Treasuries.

**Auctions:** Le Trésor vend sa dette aux **enchères** régulières (calendrier public). Métriques de santé : **bid-to-cover** (demande/offre : \>2.4 confortable pour le 10Y, en baisse = appétit qui faiblit), **tail** (l'enchère se règle à un yield PLUS HAUT que le marché pré-enchère = demande décevante ; gros tail = signal d'alerte), **indirect bidders** (proxy des acheteurs étrangers dont banques centrales — leur retrait = thème dédollarisation), **primary dealers** (obligés d'absorber l'invendu : une part dealers élevée = enchère faible).

**Bills vs coupons:** **Bills** = court terme (\<1 an, absorbés facilement par les fonds monétaires) ; **coupons** = 2Y-30Y (consomment de la « capacité de duration » du marché). Un basculement de l'émission vers les coupons longs met de la pression sur le term premium.

### 7.2 — Comment le fiscal atteint l'or : deux canaux opposés

Émissions massives de dette — les deux branches

Déficit élevé → offre de Treasuries en forte hausse

Canal 1 — Term premium (bearish Gold à court terme)

Offre \> demande → prix des Treasuries ↓ → yields longs ↑ (term premium ↑)

↓

Real yields ↑ mécaniquement

↓

Coût d'opportunité ↑ → pression Gold

Domine quand la confiance dans la dette US reste intacte : les yields plus hauts ATTIRENT les acheteurs.

Canal 2 — Débasement / défiance (bullish Gold, structurel)

Le marché commence à douter de la soutenabilité (« qui va acheter tout ça ? »)

↓

Anticipation : la Fed devra un jour monétiser (racheter la dette) ou tolérer l'inflation pour l'éroder (« dominance fiscale »)

↓

Fuite vers l'actif de réserve sans contrepartie : l'or. Yields ↑ ET Gold ↑ simultanément.

Signature : enchères ratées + USD ↓ + Gold ↑ le même jour. C'est le trade « sell America » de 2025. L'ECB note qu'en 2025 les banques centrales détiennent désormais plus d'or que de Treasuries en réserves — première historique.

**Comment distinguer les deux en pratique**

Jour d'enchère 10Y/30Y faible : si **yields ↑ + USD ↑ + Gold ↓** → canal 1, le monde achète encore l'Amérique, juste plus cher. Si **yields ↑ + USD ↓ + Gold ↑ + actions ↓** → canal 2, défiance sur les actifs US : régime le plus bullish structurellement pour l'or. Ce quadruple check (yields/USD/Gold/actions) est un des tests de régime les plus puissants de tout le système.

### 7.3 — Debt ceiling, shutdowns et TGA

**Government shutdown** : blocage budgétaire → administrations fermées, données économiques parfois non publiées (fin 2025 : « historic breakdown in government data » — la Fed a navigué à vue) → incertitude ↑, qualité du pricing ↓, légèrement bullish or par la prime d'incertitude. **Debt ceiling** : psychodrame récurrent du plafond de dette ; risque extrême jamais réalisé de défaut technique → épisodes de stress bullish or ; et après résolution, la reconstitution du TGA draine la liquidité (voir ch. 06) → vent contraire temporaire pour tous les actifs.

#### Quiz — Enchère 30Y : tail de 3.5 bps, bid-to-cover au plus bas de 2 ans, indirects en retrait. Dans l'heure : US30Y +12 bps, DXY -0.5%, Gold +0.9%, S&P -1.2%. Diagnostic ?

**Canal 2 — défiance envers la duration US (term premium + dédollarisation).** La combinaison yields↑/USD↓/Gold↑/actions↓ est la signature du « sell America ». Biais Gold haussier, horizon jours-semaines, invalidation : retour d'enchères solides + re-corrélation classique.


---

# Chapitre 08 · Qui achète, qui vend

## Flux : Banques Centrales, ETF, COT

Les chapitres précédents expliquent POURQUOI on voudrait acheter de l'or. Celui-ci regarde QUI achète effectivement, en quelle quantité, avec quel délai de données — et pourquoi le positionnement n'est jamais un signal directionnel automatique.

### 8.1 — Banques centrales : le bid structurel

#### Qui, pourquoi, combien

- **Qui** : PBoC (Chine — officiel + achats non déclarés estimés bien supérieurs), banques centrales émergentes (Inde, Turquie, Pologne, Kazakhstan, pays du Golfe…). Les achats déclarés ont plus que doublé après 2022, dépassant 1,000 t/an en 2022-2024 (~225 t/trimestre en moyenne 2021-2025, environ le double de 2016-2020).
- **Pourquoi** : le déclencheur documenté est le **gel des réserves russes (2022)** : ~\$300 Md de réserves d'un État rendues inutilisables par sanctions. Chaque banque centrale non-alignée a compris que ses Treasuries étaient saisissables. L'or détenu domestiquement ne l'est pas. Motifs : sanctions-proofing, diversification hors USD, méfiance fiscale US. Une enquête WGC 2025 : la majorité des banques centrales prévoit plus d'or et moins de dollars en réserves.
- **Jalons** : en 2025, l'or dépasse les Treasuries dans les réserves mondiales des banques centrales (rapport ECB) — première fois de l'histoire moderne.

#### Les données : où, quand, avec quel retard — et le problème du non-déclaré

| Source                                   | Contenu                                                                         | Fréquence / retard                                                                                                                    |
|------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| WGC — Gold Demand Trends                 | Le rapport de référence : demande par catégorie, achats BC (déclarés + estimés) | Trimestriel, ~1 mois de retard                                                                                                        |
| WGC — Central bank statistics (gold.org) | Achats/ventes mensuels déclarés au FMI, par pays                                | Mensuel, ~1-2 mois de retard                                                                                                          |
| FMI IFS                                  | Réserves officielles                                                            | Mensuel, retard similaire                                                                                                             |
| PBoC (annonces SAFE)                     | Réserves d'or officielles Chine                                                 | Mensuel, début de mois — signal narratif fort quand elle annonce (ex : plus gros achat mensuel en 2 ans et demi annoncé en juin 2026) |

**Le piège du « non déclaré » — cas Q1 2026**

Aucune règle n'oblige à déclarer au FMI. Q1 2026 : achats nets déclarés ~16 t seulement, ventes de 129 t (dont Turquie 60 t) → titres « les banques centrales abandonnent l'or ». Mais le WGC, en croisant les flux OTC de Londres et les données des raffineries suisses, estime que les achats réels ont en fait AUGMENTÉ (~244 t vs 208 t au Q4 2025). Leçon : ne jamais conclure sur les seuls chiffres déclarés ; suivre les estimations WGC « total including unreported ».

#### Horizon : structurel, PAS intraday

Les banques centrales achètent en OTC, par programmes étalés, souvent en accumulation sur faiblesse. Effet : un **plancher** — les corrections deviennent moins profondes, les dips sont achetés. Ça ne te dit RIEN sur GC à 10h30. Dans ton framework : ce facteur module la composante structurelle du biais et l'asymétrie (les shorts swing contre un bid souverain actif ont une espérance dégradée), jamais le timing.

### 8.2 — ETF : le baromètre de la demande d'investissement occidentale

- **Quoi** : GLD (le géant, State Street), IAU (iShares) et consorts détiennent de l'or physique en coffre ; les créations/rachats de parts se traduisent en achats/ventes de métal. Les **holdings totaux** (en tonnes) sont le meilleur proxy de la demande d'investissement financière occidentale.
- **Où** : holdings GLD publiés quotidiennement (site SPDR Gold Shares, ~fin de journée US) ; agrégats globaux par le WGC (mensuel, tous fonds/régions).
- **Lecture** : inflows soutenus = les fonds/CGP/retail occidentaux reviennent = c'est le segment SENSIBLE AUX REAL YIELDS. 2020-2022 : outflows massifs pendant que les BC achetaient — les deux flux racontent deux populations différentes. Le retour des inflows ETF en 2024-2025 a été l'accélérant du rally (les deux acheteurs en même temps).
- **Signal utile pour toi** : la *divergence*. Gold qui monte SANS inflows ETF = rally porté par souverain/futures = plus fragile aux repricings Fed. Gold qui monte AVEC inflows = participation large = tendance plus robuste. Horizon : jours-semaines.

### 8.3 — COT : lire le positionnement des futures sans se faire piéger

#### La mécanique du rapport

La CFTC publie chaque **vendredi ~15h30 ET** le Commitment of Traders, photo du **mardi** précédent (3 jours de retard — après une semaine volatile, la photo est déjà périmée). Pour l'or, utilise le rapport « Disaggregated » :

| Catégorie                               | Qui c'est                                                                            | Comportement typique                                                                                                      |
|-----------------------------------------|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Producer/Merchant (commerciaux)**     | Mineurs, raffineurs, bijoutiers, banques de métaux qui hedgent une activité physique | Structurellement net short (ils vendent leur production future). Leur position REFLÈTE le prix plus qu'elle ne le prédit. |
| **Swap Dealers**                        | Banques qui hedgent des expositions OTC/dérivés                                      | Contrepartie technique, peu de signal directionnel.                                                                       |
| **Managed Money**                       | Hedge funds, CTA — LES spéculateurs                                                  | Trend-followers dans l'ensemble : net long ↑ quand ça monte. **C'est la catégorie à analyser.**                           |
| **Other Reportables / Non-reportables** | Gros comptes divers / petits comptes (retail)                                        | Secondaire ; le non-reportable très long au sommet = contrarian classique.                                                |

#### Net long, net short, et la bonne métrique

**Net long** = longs − shorts \> 0. Le niveau absolu ne veut rien dire seul (le marché grossit avec les années). La métrique correcte : **le percentile historique du net positioning Managed Money sur fenêtre roulante 3 ans (156 semaines)**.

Managed Money extrêmement net long (percentile ≥ 90) — bullish ou risque ?

MM net long au 95e percentile 3 ans

Lecture momentum

Les fonds sont massivement engagés → la tendance est forte et validée

Vrai en TENDANCE : un extrême peut le rester des mois (2024-2025). Ne JAMAIS shorter uniquement sur « positionnement extrême ».

Lecture crowded / carburant

Il reste peu d'acheteurs marginaux à convertir ; énormément de stops au même endroit

↓

Toute surprise hawkish déclenche des liquidations en cascade → downside asymétrique

Le positionnement n'est PAS un signal directionnel : c'est un multiplicateur d'amplitude et un indicateur d'asymétrie du risque.

**Règle d'usage COT dans le framework**

Le COT ne donne jamais la direction. Il répond à deux questions : **(1) Ma thèse est-elle déjà le consensus ?** (MM très long + je suis bullish = mon edge est réduit, le mouvement est en partie fait). **(2) De quel côté le marché est-il vulnérable ?** (MM très long = les surprises bearish frapperont 2× plus fort — module ta confiance et ton risque, pas ton signe). Cas pratique : janvier 2026, positionnement historiquement long au sommet à \$5,598 → quand le choc hawkish est arrivé, -26% : l'ampleur de la chute EST l'histoire du positionnement.

#### Quiz — MM net long au 12e percentile 3 ans (très bas) après 3 mois de baisse. Un CPI dovish tombe. Pourquoi le rally peut-il être explosif ?

**Asymétrie inversée** : positionnement lavé = beaucoup de shorts à racheter et du monde sous-investi à re-rentrer, personne à liquider côté long. Même surprise, amplitude bien supérieure. Positionnement bas + catalyseur dovish = le meilleur setup asymétrique long du système.

#### Quiz — Le COT de vendredi montre un net long record… mais mercredi/jeudi le marché a chuté de 4%. Que vaut la photo ?

Presque rien : elle date de mardi, AVANT la purge. Une partie du record a déjà été liquidée. Après une semaine violente, considère le COT comme périmé et attends le suivant (ou infère : la chute sur gros volume = du MM long a déjà capitulé).


---

# Chapitre 09 · La tuyauterie de ton instrument

## Futures GC, Options, Marché Physique

Tu trades GC : autant connaître exactement la machine — sa relation au spot, ses échéances, ses options — et les grands bassins physiques (Chine, Inde, offre minière) avec une évaluation honnête de leur utilité pour ton horizon.

### 9.1 — GC et la price discovery

- **Le contrat** : COMEX (CME), 100 oz troy, coté en \$/oz, quasi 24h (Globex). Le tick 0.10 = \$10. Mois actifs : Fév, Avr, Juin, Août, Oct, Déc. **Rollover** : le volume migre vers l'échéance suivante ~fin du mois précédant l'expiration ; `GC1!` sur TradingView = continu front month.
- **Spot XAUUSD vs GC** : le spot est le marché OTC de Londres (LBMA) ; GC cote quelques dollars AU-DESSUS (la « basis ») = coût de portage (taux d'intérêt jusqu'à l'échéance + stockage − convenience). Basis normale = contango sage qui suit les taux courts. **Basis/EFP anormalement large** = stress physique ou réglementaire (début 2025 : peur de tarifs douaniers sur l'or importé aux US → ruée pour livrer du métal à New York → EFP explosif, stocks COMEX en flèche). Signal rare mais puissant de tension.
- **Price discovery** : les futures mènent le mouvement à haute fréquence (c'est là que la spéculation macro s'exprime) ; le physique (Londres, Shanghai) ancre le niveau à moyen terme. C'est pourquoi ton XAUUSD (CFD) suit GC tick par tick : le CFD réplique un marché dont les futures font le prix.
- **Delivery & warehouse stocks** : une minorité de contrats va à livraison ; les stocks des entrepôts COMEX (publiés quotidiennement par CME) ne sont un signal que lors d'épisodes de tension (2020, 2025).

### 9.2 — Options sur GC : le minimum vital et utile

#### Ce que les options t'apportent pour un biais (et rien de plus) \[options\]

**Vocabulaire:** **Call** = droit d'acheter à un **strike** donné avant l'**expiry** ; **put** = droit de vendre. **Implied volatility (IV)** = la volatilité future que le prix des options implique = le prix de l'assurance. **Skew** = écart d'IV entre calls et puts équidistants. **Put/call ratio** = volume/OI de puts vs calls.

**Signal 1 : GVZ:** L'indice CBOE Gold ETF Volatility (`GVZ`, le « VIX de l'or »). GVZ qui explose = le marché price un événement. GVZ écrasé = complaisance (les cassures partent souvent de là).

**Signal 2 : le skew:** Particularité de l'or vs actions : le skew penche souvent côté **calls** (la peur sur l'or est une peur de HAUSSE — crash du monde, débasement). Skew calls qui s'enrichit fortement = demande de convexité haussière (les fonds achètent des billets de loterie sur un spike) = confirme un régime de peur haussière. Skew qui bascule côté puts = crainte de purge.

**Signal 3 : gamma & gros OI:** Les strikes à très gros open interest (surtout à l'approche de l'expiration mensuelle des options GC) agissent comme des **aimants/murs** : les dealers hedgent autour → le prix « colle » (long gamma) ou accélère à travers (short gamma). Utile pour comprendre pourquoi GC stagne pile sur un chiffre rond en fin de mois. C'est un outil de ZONES/niveaux, pas d'orientation.

**Verdict honnête:** Pour l'analyse macro quotidienne, retiens : GVZ (niveau de peur pricé) + skew (direction de la peur). Le reste (grecques fines, gamma maps) est du raffinement non nécessaire — et le KPI options du terminal n'existera que si une source de données sérieuse est trouvée (À DÉFINIR).

### 9.3 — Chine : structurellement centrale

- **Pourquoi central** : premier producteur ET premier consommateur mondial ; la PBoC est le plus gros acheteur officiel présumé de la décennie ; le Shanghai Gold Exchange (SGE) est la plus grande plateforme physique. En 2025, régulateur autorisant les 10 plus grandes assurances chinoises à allouer jusqu'à 1% des actifs en or (~200 t potentielles ; débat sur un passage à 5%) — nouveau bassin de demande institutionnelle.
- **La prime SGE** : écart prix Shanghai vs Londres. Prime élevée (\$30-50+/oz) = demande domestique \> offre importable (quotas d'import) = signal robuste de demande chinoise (fuite hors yuan/immobilier). Décote = demande faible (2025 a connu des phases de décote après le rally — les Chinois achètent les dips, pas les sommets).
- **Canaux macro chinois** : USDCNH ↑ (dépréciation) → demande refuge domestique ↑. Crise immobilière → l'épargne cherche une alternative → or. Restrictions de capitaux → l'or est une des rares sorties. **Horizon : structurel (mois), sauf annonces PBoC qui font des headlines intraday.**

### 9.4 — Inde : la demande la plus élastique au prix

Deuxième consommateur mondial, culturellement massif (mariages, festivals — Diwali oct/nov, saison des mariages ; import duties et roupie modulent la demande). MAIS : la demande indienne est **contra-cyclique au prix** (les acheteuses de bijoux attendent les baisses) — elle amortit les corrections plus qu'elle ne propulse les rallys. **Verdict honnête pour ton usage** : facteur de saisonnalité et de plancher structurel léger ; poids quasi nul dans le biais intraday GC. À connaître, à ne pas sur-pondérer.

### 9.5 — L'offre minière : la réponse honnête

Production ~3,600 t/an, recyclage ~1,200 t. L'offre minière varie de ±1-2%/an : **lente, prévisible, quasi inélastique à court terme** (ouvrir une mine prend 10-15 ans). L'or a une particularité unique : le stock au sol (~215,000 t) écrase le flux annuel — le prix est déterminé par la volonté de DÉTENIR le stock, pas par la production. **Verdict : inutile pour ton horizon de trading.** Les AISC (all-in sustaining costs, ~\$1,400-1,600/oz) donnent au mieux un plancher théorique très lointain. Tu peux ignorer ce facteur dans le rapport quotidien ; sache juste répondre si on t'en parle.

#### Quiz — GVZ passe de 16 à 30 en deux jours, le skew calls s'enrichit violemment, primes SGE \$40. Qu'est-ce que le marché te dit ?

Le marché price un **événement à queue haussière** : demande d'assurance contre un spike UP (géopolitique/débasement), demande physique chinoise en soutien. Ce n'est pas une prédiction, mais le contexte est « peur de rater la hausse » : les corrections seront achetées agressivement. Prudence maximale sur les shorts swing.


---

# Chapitre 10 · Le moteur le plus mal tradé

## Géopolitique & Politique Américaine

« Guerre = Gold monte » est le slogan qui a coûté le plus cher aux traders retail en 2026. La géopolitique agit sur l'or par TROIS canaux qui peuvent se contredire — et le canal dominant dépend de la nature du choc.

### 10.1 — Les trois canaux d'un choc géopolitique

ESCALADE GÉOPOLITIQUE — décomposer avant de trader

Choc : guerre, attaque, blocus, sanctions…

Canal 1 — Safe haven (minutes-jours)

Demande refuge immédiate → Gold ↑ en headline

Réflexe algo + humain. Souvent le plus fort la NUIT du choc. S'estompe vite si pas d'escalade (« buy the invasion rumor, sell the invasion »).

Canal 2 — Macro second ordre (semaines-mois)

Le choc touche-t-il le PÉTROLE / les chaînes d'appro ?

↓ si oui

Énergie ↑ → inflation ↑ → Fed hawkish → real yields ↑

↓

Gold ↓ — le canal 2 ÉCRASE le canal 1 avec le temps (cas Iran/Hormuz 2026 : +spike initial, puis -26%)

Canal 3 — Liquidation forcée (heures-jours) : si le choc provoque une panique de marge globale (actions -5%, VIX \>40), l'or est VENDU d'abord — c'est l'actif liquide et profitable qu'on brade pour lever du cash (mars 2020 : -12% en une semaine avant le rally historique). USD ↑↑ pendant cette phase.

#### La grille de questions à se poser sur tout headline géopolitique

Le choc est-il **nouveau** ou une n-ième itération d'un conflit connu (déjà pricé) ?

Touche-t-il l'**énergie ou le commerce mondial** ? (si oui : le canal inflation→Fed prendra le dessus en quelques semaines)

Implique-t-il directement les **USA / la Chine / la Russie / le nucléaire** ? (magnitude du refuge)

Génère-t-il des **sanctions financières** ? (accélère la dédollarisation → bullish structurel BC)

Provoque-t-il une **panique de liquidité** (VIX, crédit) ? (si oui : l'or peut baisser d'abord)

Quelle est la **désescalade pricée** ? (un cessez-le-feu attendu qui se signe = sell the news sur l'or)

#### Études de cas condensées

| Événement                         | Réaction Gold                                       | Leçon                                                                                                                                                                                                                  |
|-----------------------------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Invasion de l'Ukraine (fév. 2022) | Spike ~\$2,070 en 2 semaines… puis -20% sur l'année | Canal 1 puis canal 2 : le choc a nourri l'inflation → Fed la plus hawkish en 40 ans. MAIS il a déclenché le gel des réserves → le bid BC structurel qui a porté 2023-2025. Trois horizons, trois réponses différentes. |
| Hamas-Israël (oct. 2023)          | +9% en 3 semaines, conservé                         | Choc sans canal 2 majeur (pétrole peu affecté durablement) + contexte de cuts anticipés : le canal refuge a dominé proprement.                                                                                         |
| COVID (mars 2020)                 | -12% éclair, puis +40% en 5 mois                    | Canal 3 (liquidation) puis QE/real yields négatifs. Acheter la panique de marge APRÈS l'intervention Fed, pas pendant.                                                                                                 |
| Iran / Hormuz (fév. 2026)         | Spike, puis -26% en 4 mois                          | Le canal 2 (pétrole→CPI 4.2%→hikes pricés) a écrasé le canal 1. La désescalade + pétrole retombé à \$68 relance maintenant le débat dovish.                                                                            |

### 10.2 — Politique américaine

- **Nominations Fed** (Chair, gouverneurs) : le marché price la fonction de réaction de la personne AVANT toute décision (cf. ch. 03 — effet Warsh 2026). Une nomination dovish anticipée = bullish or immédiat ; hawkish = l'inverse.
- **Indépendance de la Fed** : pressions présidentielles ouvertes pour baisser les taux, menaces de limogeage → prime de débasement → structurellement bullish or même sans changement de taux effectif. Thème récurrent 2025-2026.
- **Tarifs douaniers** : double canal — inflation importée (hawkish, bearish) + incertitude commerciale et défiance internationale envers les actifs US (bullish). En 2025, le canal défiance a nettement dominé. Cas spécial : la peur de tarifs SUR L'OR lui-même a disloqué la basis COMEX début 2025.
- **Élections / fiscal** : programmes creusant le déficit = canal term premium/débasement (ch. 07). Shutdowns/debt ceiling = primes d'incertitude temporaires.

#### Quiz — Headline 23h : frappes sur des installations nucléaires. Gold +2.1% en 20 minutes. Ta grille dit quoi pour la session à venir ?

1\) Canal 1 en cours, magnitude élevée (nucléaire). 2) Question décisive : le pétrole ? S'il fait +8%, prépare-toi à ce que dans les JOURS suivants le narratif bascule sur l'inflation/Fed → le gain peut se rendre. 3) Vérifie la liquidation (futures actions, VIX overnight). 4) Historiquement, sans escalade supplémentaire sous 48h, le spike se fade partiellement (« sell the invasion »). Biais intraday haussier fragile, biais swing dépendant du pétrole. Ne JAMAIS acheter le sommet du spike nocturne.


---

# Chapitre 11 · La routine

## News & Calendrier Économique

Toutes les news ne se valent pas. Ce chapitre hiérarchise les événements selon la sensibilité historique réelle du Gold, donne la fiche technique de chaque publication majeure, et t'apprend la lecture Actual / Forecast / Previous / Révisions.

### 11.1 — La hiérarchie des événements (sensibilité GC observée)

| Tier   | Événement                                                                  | Mouvement GC typique\* | Pourquoi ce rang                                                                         |
|--------|----------------------------------------------------------------------------|------------------------|------------------------------------------------------------------------------------------|
| TIER 1 | CPI                                                                        | ±0.8% à ±2.5%          | Le repriceur Fed n°1 depuis 2021. En régime « inflation scare » (2026), c'est LA donnée. |
| TIER 1 | FOMC + presser (+dots)                                                     | ±0.5% à ±2%            | La source elle-même. Double mouvement 14h/14h30.                                         |
| TIER 1 | NFP                                                                        | ±0.5% à ±1.5%          | L'autre moitié du mandat. Sensibilité maximale quand le débat du moment est l'emploi.    |
| TIER 1 | Discours du Fed Chair (Congrès, Jackson Hole)                              | ±0.3% à ±1.5%          | Peut reprogrammer les attentes à lui seul.                                               |
| TIER 1 | Choc géopolitique majeur                                                   | ±1% à ±5%              | Non planifié. Grille du chapitre 10.                                                     |
| TIER 2 | Core PCE                                                                   | ±0.2% à ±0.6%          | Cible officielle mais largement nowcastée après CPI/PPI.                                 |
| TIER 2 | PPI, Retail Sales, ISM (Mfg & Services)                                    | ±0.2% à ±0.7%          | Modulateurs du nowcast croissance/inflation.                                             |
| TIER 2 | Jobless Claims (jeudi)                                                     | ±0.1% à ±0.5%          | Faible seul, fort en TENDANCE ou en période de peur récession.                           |
| TIER 2 | Enchères 10Y/30Y, Refunding trimestriel                                    | ±0.2% à ±0.8%          | Montent en Tier 1 les années de peur fiscale (2025). 13h ET.                             |
| TIER 2 | Minutes FOMC, discours gouverneurs votants                                 | ±0.1% à ±0.6%          | Surprennent rarement, sauf révélation de division (juin 2026 : 9-8).                     |
| TIER 3 | Consumer Confidence, JOLTS, durable goods, GDP final, Beige Book, housing… | \<±0.2%                | Contexte de fond. Ne changent presque jamais un biais seuls.                             |

\*Ordres de grandeur indicatifs en régime normal ; tout dépend de la surprise et du positionnement. La hiérarchie elle-même est **régime-dépendante** : en 2019 (inflation morte), le CPI était un non-événement et l'emploi dominait ; en 2022-2026 c'est l'inverse. Demande-toi chaque trimestre : « quelle est LA variable que la Fed dit regarder en ce moment ? » — c'est elle le Tier 1 du moment.

### 11.2 — Fiches techniques des publications clés

#### CPI — la fiche complète \[tier 1\]

**Quand / source:** Mensuel, ~mi-mois, 8h30 ET. Source primaire : BLS (bls.gov). Consensus : Bloomberg/Reuters, visible sur ForexFactory/Investing.

**Ce que ça mesure:** Prix consommation. Lire : Headline & Core, MoM & YoY, vs consensus + composition (énergie, shelter, supercore).

**Canal Gold:** Surprise → repricing FedWatch → 2Y → real yields → USD → GC. Propagation en secondes.

**Réaction théorique:** Au-dessus = bearish Gold / en-dessous = bullish (régime Fed crédible). Amplitude ∝ surprise × positionnement.

**Pièges:** Headline vs core divergents (attendre la 2e vague) ; « bonne » surprise déjà pricée par un whisper number ; réaction inversée si le marché juge la composante clé transitoire (essence).

#### NFP — la fiche complète \[tier 1\]

**Quand / source:** 1er vendredi du mois, 8h30 ET. BLS. Attention : semaine décalée parfois (jours fériés).

**Lire ensemble:** NFP + révisions M-1/M-2 + taux de chômage + AHE MoM + participation. Grille du chapitre 05.

**Réaction théorique:** Fort = bearish Gold, faible = bullish — MAIS le rapport « fort-faible » (headline fort, détails faibles) s'inverse en 15-60 min. Ne pas trader la 1re bougie d'un rapport mixte.

**Pièges:** Révisions ignorées par les algos ; grèves/météo qui polluent un mois ; birth-death model en retournement de cycle.

#### FOMC — la fiche complète \[tier 1\]

**Quand:** 8×/an, mercredi 14h ET (+SEP/dots en mars, juin, sept, déc), presser 14h30. Minutes 3 semaines après.

**Ce qui surprend:** Presque jamais la décision (pricée) ; les MOTS changés du communiqué, la médiane des dots, le ton du Chair.

**Pièges:** Trader entre 14h00 et 14h30 (inversions fréquentes) ; oublier que « hawkish cut » et « dovish hike » existent ; extrapoler les dots comme des promesses.

#### Powell/Chair speeches, Jackson Hole, témoignages \[tier 1\]

**Quand:** Calendrier Fed (federalreserve.gov) ; Jackson Hole fin août (discours de doctrine) ; témoignages semi-annuels au Congrès (Humphrey-Hawkins).

**Lecture:** Comparer chaque phrase au dernier discours : le marché trade les DELTAS de langage (« some time » → « soon » = un monde). Q&A souvent plus mobile que le texte.

### 11.3 — Actual vs Forecast vs Previous vs Révisions : la méthode complète

Quatre nombres, quatre rôles :

- **Forecast (consensus)** = ce que les économistes attendent = une approximation de ce qui est pricé. C'est le POINT ZÉRO de la réaction.
- **Actual** = le chiffre. Seul l'écart `Actual − Forecast` (la surprise) crée du mouvement.
- **Previous + Révisions** = le passé réécrit. Une révision change le NIVEAU de départ : +250k après un précédent révisé de 220k→140k signifie que l'économie était plus faible qu'on croyait — la « force » du chiffre du jour est relativisée.
- **Whisper number** = l'attente officieuse des desks quand quelque chose s'est passé entre la fixation du consensus et la publication (ex : pétrole qui a explosé après le sondage). Un Actual au-dessus du consensus mais SOUS le whisper = réaction bullish paradoxale.

Arbre de décision — publication économique (exemple NFP)

8h30:00 — Actual vs Forecast : surprise brute ? (250k vs 180k = +70k, hawkish brut)

↓  8h30:05

Révisions ? (-110k cumulées → la surprise nette fond à ~-40k…)

↓  8h30:10

Chômage & salaires confirment ou contredisent ? (chômage ↑ + AHE faibles = contredisent)

↓  8h30-8h35

Verdict multidimensionnel : rapport MIXTE-FAIBLE malgré le headline fort

↓  confirmation objective

Le 2Y : s'il finit en BAISSE dans les 30 min malgré le « bon » headline, le marché a lu comme toi

↓

Biais Gold : le spike bearish initial est un piège → biais neutre à haussier post-digestion

**L'arbitre final : le 2Y**

Quand ta lecture d'une donnée est ambiguë, laisse le 2Y yield trancher : c'est le juge de paix du repricing Fed. Direction du 2Y à +30 min = la lecture que le marché a retenue. Ton biais Gold post-donnée doit être cohérent avec lui — s'il ne l'est pas, c'est probablement toi qui te trompes, pas le marché des taux.

#### Quiz — Retail Sales +0.9% vs +0.3% attendu, mais le mois précédent est révisé de +0.5% à -0.2%. Le 2Y ne bouge presque pas. Biais ?

**Neutre.** La surprise positive est annulée par la révision (le niveau des ventes atterrit presque là où on le pensait). Le 2Y flat confirme : zéro repricing Fed = zéro carburant directionnel Gold. Un Tier 2 auto-neutralisé — passe ton chemin.


---

# Chapitre 12 · Le concept-clé de voûte

## Priced In

Si tu ne devais retenir qu'un chapitre, c'est celui-ci. Un marché est une machine à anticiper : le prix d'aujourd'hui contient déjà le futur consensuel. Seul l'ÉCART entre ce qui arrive et ce qui était attendu fait bouger le prix.

### 12.1 — Définition et mécanisme

**« Priced in »** = déjà intégré dans le prix. Si 100% des participants savent que la Fed coupera mercredi, ceux qui voulaient acheter de l'or POUR cette raison l'ont déjà fait avant mercredi. Le jour J, il ne reste personne à convertir : l'événement attendu ne produit aucun flux net nouveau. Pire : ceux qui avaient acheté « pour l'événement » prennent leurs profits → **« buy the rumor, sell the news »**.

Pourquoi Gold baisse le jour où la Fed coupe (cas classique)

Semaines avant : les données faiblissent → le marché price progressivement le cut (proba 40% → 75% → 98%)

↓  pendant ce temps

Gold monte DÉJÀ — c'est LÀ que le mouvement a lieu

↓  jour J

La Fed coupe : information nouvelle ≈ 0 (98% pricé)

↓  et si en plus les dots signalent une pause…

Surprise relative HAWKISH (« hawkish cut ») + prises de profit → Gold baisse sur un cut de taux

### 12.2 — Comment estimer ce qui est pricé (les 4 instruments)

| Instrument                            | Ce qu'il révèle                                                                                       | Où                                 |
|---------------------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------|
| **Fed Funds/SOFR futures → FedWatch** | La trajectoire Fed pricée, réunion par réunion, en probabilités. Le point zéro de tout événement Fed. | CME FedWatch (gratuit)             |
| **Consensus économistes**             | Le point zéro des données macro (Forecast). Compléter par le contexte whisper.                        | ForexFactory, Investing, Bloomberg |
| **Positionnement (COT, ETF flows)**   | Combien le consensus est déjà EXPRIMÉ en positions → l'asymétrie de la réaction.                      | CFTC, WGC/SPDR                     |
| **Options (IV, skew)**                | L'amplitude d'événement pricée (straddle CPI/FOMC = le move attendu) et la direction de la peur.      | GVZ, chaînes d'options GC (CME)    |

### 12.3 — La question rituelle

**Avant CHAQUE événement, écris la réponse à :**

« **Qu'est-ce que le marché attend exactement, et que fera-t-il si c'est exactement ça ?** » — Si tu ne peux pas répondre en 2 phrases (ex : « le marché price 98% de cut + guidance prudente ; si c'est ça, réaction faible avec risque de sell-the-news ; la vraie surprise serait un signal de pause → -1.5% ; ou 50 bps → +2% »), tu n'es pas prêt à trader l'événement. Cette phrase écrite dans ton rapport quotidien est ta meilleure protection contre les narratifs a posteriori.

#### Exemples historiques du concept

- **Septembre 2025** : premier cut du cycle — pricé à ~100% des semaines à l'avance ; l'or avait rallié tout l'été EN ANTICIPATION, la réaction au jour J fut modeste : le mouvement était fait.
- **2026** : à l'inverse, le passage de « plusieurs cuts pricés » à « ~60% de proba de hike » fut une cascade de surprises NON pricées → -26%. Même Fed, réactions opposées : tout est dans l'écart aux attentes.
- **Cessez-le-feu attendu** : quand une désescalade est télégraphiée (négociations publiques), sa signature fait peu baisser l'or — elle était pricée ; c'est son ÉCHEC qui ferait bouger.

#### Quiz — FedWatch : 95% de proba de cut. La Fed coupe et Powell est neutre. Gold -0.8%. Les médias titrent « l'or chute malgré la baisse des taux, paradoxe ». Explique le non-paradoxe.

Aucun paradoxe : le cut valait 0 en information (95% pricé). Le flux du jour = prises de profit des positions accumulées en anticipation + absence de la surprise dovish supplémentaire que certains espéraient (whisper de guidance très dovish). Le prix répond à **l'écart**, pas à l'événement.

#### Quiz — Comment savoir si « la guerre » est encore un carburant haussier ou si elle est déjà pricée ?

Test de réaction : si l'or **ne monte plus sur les mauvais headlines** du conflit (voire baisse), le thème est pleinement pricé — le marché a besoin d'une ESCALADE d'un cran supérieur pour re-bouger, et une désescalade devient le risque principal (asymétrie inversée). L'insensibilité croissante aux headlines répétés est le thermomètre du priced-in géopolitique.


---

# Chapitre 13 · Le cœur du framework

## Horizons Temporels & Conflits entre Variables

Le monde réel n'aligne jamais tous les indicateurs. Ce chapitre donne les deux outils qui transforment une liste de facteurs contradictoires en décision : la matrice des horizons, et la méthode du moteur dominant.

### 13.1 — La matrice des horizons

| Facteur                                           | Intraday          | 1-5 jours            | 1-4 semaines | Mois-années |
|---------------------------------------------------|-------------------|----------------------|--------------|-------------|
| Surprise CPI / NFP / FOMC                         | ●●●               | ●●                   | ●            | —           |
| Discours Chair / headline géopolitique            | ●●●               | ●                    | —            | —           |
| Tendance du repricing Fed (FedWatch sur 1-2 sem.) | ●                 | ●●●                  | ●●●          | ●           |
| Tendance real yields / DXY                        | ●                 | ●●                   | ●●●          | ●●          |
| ETF flows                                         | —                 | ●                    | ●●           | ●●          |
| COT / positionnement                              | — (amplificateur) | ●                    | ●●           | ●           |
| Achats banques centrales                          | —                 | —                    | ●            | ●●●         |
| Déficit / term premium / dédollarisation          | —                 | ● (jours d'enchères) | ●●           | ●●●         |
| Demande Chine/Inde, primes SGE                    | —                 | —                    | ●            | ●●          |
| Offre minière                                     | —                 | —                    | —            | ●           |

**La règle anti-mélange d'horizons**

Un argument ne peut soutenir un trade QUE si son horizon recouvre l'horizon du trade. « Les banques centrales achètent » ne justifie JAMAIS une entrée longue 15 minutes après un CPI hawkish : le CPI opère sur ton horizon, les BC non. Inversement, une impulsion CPI intraday ne suffit pas à invalider un biais swing haussier construit sur 3 semaines de repricing dovish — elle demande juste d'attendre. **Chaque biais que tu produis doit porter une étiquette d'horizon, et chaque conflit entre facteurs doit d'abord être testé : est-ce un vrai conflit, ou deux horizons différents ?** (Réponse dans ~la moitié des cas : deux horizons.)

### 13.2 — Résoudre les vrais conflits : la méthode du moteur dominant

Comment pense un macro trader pro : il ne fait pas la moyenne de 12 facteurs. Il cherche **LE narratif dominant** — la variable à laquelle le marché répond en ce moment — puis classe le reste en secondaire/contradictoire.

#### Identifier le moteur dominant : 3 tests objectifs

- **Test de corrélation immédiate** : ces 5-10 dernières séances, qu'est-ce qui explique les mouvements de GC tick par tick ? Si chaque swing GC colle au 2Y/real yields → le moteur est la Fed. Si GC ignore les yields mais saute sur chaque headline Iran → le moteur est géopolitique. Si GC monte quand yields ET dollar montent → moteur souverain/débasement. *Le marché te DIT son moteur : observe à quoi il répond.*
- **Test de la presse spécialisée** : les explications quotidiennes (Reuters/Bloomberg « gold rises as… ») convergent-elles ? Le consensus narratif est une donnée (imparfaite mais informative) sur le driver que le marché regarde.
- **Test de l'agenda** : quel est le prochain événement qui peut re-programmer les attentes ? Le moteur dominant est souvent « la question que le prochain Tier 1 va trancher » (juillet 2026 : le CPI du 14 tranche « le choc pétrolier contamine-t-il encore l'inflation ? »).

Procédure de résolution de conflit

Lister les facteurs avec leur signe ET leur horizon

↓

Éliminer les faux conflits (horizons disjoints) → ne garder que les facteurs actifs sur L'HORIZON DU BIAIS demandé

↓

Identifier le moteur dominant (3 tests) → son signe pèse ~×2-3 les autres

↓

Les facteurs secondaires alignés au dominant → renforcent la confiance. Opposés → réduisent la confiance (PAS le signe), sauf s'ils sont sur le point de devenir dominants (catalyseur imminent)

↓

Sortie : signe = celui du dominant · confiance = f(alignement) · invalidation = « ce qui détrônerait le dominant »

#### Exemple complet (données du brief)

**Situation : Real yields ↓ (bullish) · DXY ↑ (bearish) · Géopolitique ↑ (bullish) · ETF outflows (bearish) · Achats BC (bullish structurel)**

1\) Horizons : achats BC = structurel → hors du biais swing, note-le comme plancher. ETF outflows = hebdo, secondaire. Restent en conflit actif : real yields ↓ vs DXY ↑ vs géopolitique.  
2) Faux conflit possible : real yields ↓ + DXY ↑ ensemble = souvent une crise HORS-USA (l'Europe va mal : capitaux vers USD ET taux US baissent par contagion) — cohérent avec le facteur géopolitique. Le "conflit" se dissout en un seul narratif : *stress global*.  
3) Test tick par tick : GC monte-t-il sur les headlines de stress malgré le DXY ? Si oui → moteur dominant = refuge/real yields, le DXY est un frein secondaire.  
4) Sortie : LÉGÈREMENT HAUSSIER horizon 1-4 semaines, confiance MOYENNE (frein DXY, ETF pas encore convertis), invalidation : désescalade OU rebond des real yields au-dessus de leur niveau pré-stress.

#### Quiz — « Contexte structurel bullish (BC, déficits) mais impulsion macro intraday violemment bearish (CPI hawkish il y a 1h). Ma zone technique me donne une entrée LONGUE parfaite. » Que dit l'analyse ?

Sur TON horizon (intraday), le moteur actif est le repricing hawkish → contexte intraday BAISSIER, peu importe la structure long terme. Une entrée longue contre l'impulsion du jour est un trade contre-tendance macro : à toi de juger, en sachant que le vent est contre toi. Le contexte structurel te dit seulement que si tu shortes, tu prends des profits plus vite (un plancher souverain existe plus bas). Deux horizons, deux réponses, zéro contradiction.


---

# Chapitre 14 · Le décor derrière la scène

## Régimes Macro

Un régime = l'environnement qui détermine QUELLES règles fonctionnent. Identifier le contexte est la PREMIÈRE question de toute analyse : il dit quelles relations sont actives et lesquelles sont cassées. (Depuis la refonte : le régime est une SYNTHÈSE par horizon, potentiellement hybride ou inclassable — ch. 17.3 ; les archétypes ci-dessous en sont la grammaire.)

### 14.1 — Les 8 régimes et leur carte

| Régime                                        | Croissance | Inflation     | Fed                   | Nominaux              | Real yields         | USD      | Actions   | GOLD                                                                   |
|-----------------------------------------------|------------|---------------|-----------------------|-----------------------|---------------------|----------|-----------|------------------------------------------------------------------------|
| **Croissance inflationniste** (surchauffe)    | ↑          | ↑             | Hawkish               | ↑                     | ↑                   | ↑        | Mixte     | Bearish (2022, H1 2026)                                                |
| **Croissance désinflationniste** (goldilocks) | ↑          | ↓             | Cuts de confort       | ↓ doux                | ↓ doux              | ~/-      | ↑↑        | Léger + (concurrence du risk-on)                                       |
| **Stagflation**                               | ↓          | ↑             | Coincée               | ↑                     | Dépend du choix Fed | Mixte    | ↓         | Très bullish si Fed protège l'emploi ; bearish si elle choisit Volcker |
| **Récession désinflationniste**               | ↓↓         | ↓             | Cuts agressifs / QE   | ↓↓                    | ↓↓                  | ↑ puis ↓ | ↓↓        | Bearish éclair (liquidation) → très bullish                            |
| **Expansion de liquidité** (QE, stimulus)     | Rebond     | Anticipée ↑   | Ultra-dovish          | Bas                   | ↓↓ (négatifs)       | ↓        | ↑↑        | Très bullish (2009-2011, 2020)                                         |
| **Contraction de liquidité** (QT + hikes)     | Freinée    | ↓ lentement   | Hawkish               | ↑                     | ↑↑                  | ↑↑       | ↓         | Bearish (2013 taper, 2022)                                             |
| **Panique géopolitique**                      | —          | Choc possible | En attente            | ↓ (flight to quality) | ↓                   | ↑        | ↓↓        | Bullish (sauf phase liquidation) — puis bascule selon le canal pétrole |
| **Peur fiscale / débasement**                 | ~          | Anticipée ↑   | Crédibilité contestée | ↑ (term premium)      | ↑ mais ignoré       | ↓        | Nerveuses | Bullish — le régime où Gold monte AVEC les yields (2024-2025)          |

### 14.2 — Diagnostiquer le régime en 5 observations

**Croissance** : ISM \> ou \< 50 et tendance ? Claims en tendance ? GDPNow ?

**Inflation** : Core au-dessus/en-dessous de la cible, en accélération ou décélération ? 5Y5Y ancré ?

**Fed** : en cycle de hausse, pause, ou baisse ? Le marché price quoi pour 12 mois ?

**Le quadruple check** : sur les 20 dernières séances, comment co-bougent yields/USD/Gold/actions ? (Gold↑ avec yields↑ et USD↓ = débasement ; Gold↓ avec yields↑ et USD↑ = contraction classique…)

**Corrélation 30j Gold-DXY et Gold-real yields** : fortement négatives = régime financier classique ; effondrées = régime souverain/débasement.

**Juillet 2026, appliqué** : inflation 4.2% en réaccélération (choc pétrole), croissance qui donne des signes de fatigue (mauvais rapport emploi de juin), Fed hawkish divisée 9-8, pétrole retombé à \$68 → on est à la frontière *surchauffe-inflationniste → stagflation légère*, avec une question binaire : le reflux du pétrole ramène-t-il la désinflation (bascule dovish = bullish Gold) ou l'inflation s'est-elle installée (hikes = bearish) ? D'où : chaque CPI est le Tier 1 absolu du moment.

#### Quiz — Pourquoi « identifier le régime » passe-t-il AVANT « analyser les real yields » dans le framework ?

Parce que le régime détermine le **poids** à donner aux real yields : en régime financier classique, ils sont le moteur n°1 ; en régime débasement/souverain, leur signal est amorti et peut être contredit des mois durant. Analyser une variable avant de savoir combien elle pèse, c'est calculer avec un coefficient inconnu.


---

# Chapitre 15 · Le laboratoire des régimes

## Histoire du Gold : 1944 → 2026

Le but n'est pas les dates : c'est de voir les MÊMES variables (Fed, real yields, USD, flux) produire des résultats opposés selon le régime. Chaque période = une leçon transférable.

[TABLE]

**Les trois méta-leçons de 80 ans**

1\) La variable maîtresse n'est ni l'inflation ni les taux, c'est **la crédibilité de la banque centrale** : Fed lâche = or roi (70s, 2020, 2024-25) ; Fed dominante = or enterré (Volcker, 2022, H1 2026). 2) **Les régimes durent plus longtemps qu'on ne croit** (20 ans de bear 1980-2000, 4+ ans de bid souverain) : ne pas trader la moyenne long terme contre le régime en cours. 3) **Chaque changement de régime a eu un marqueur identifiable en temps réel** : Nixon 1971, Volcker 1979, QE 2009, gel des réserves 2022, nomination Warsh 2026. Le travail quotidien du chapitre 17 sert exactement à détecter le prochain.


---

# Chapitre 16 · La boîte à outils

## Watchlist TradingView & Sources

Deux dashboards (minimal quotidien / avancé), la fiche de chaque chart, puis la carte complète des sources — en distinguant toujours source primaire, donnée de marché et commentaire.

> **Règle opérationnelle LOCKED pour le Sunday Read :** les fournisseurs cités dans ce chapitre sont des **exemples et repères**, pas une whitelist. Le Skill ne doit imposer ni fournisseur précis, ni nombre fixe de sources, ni source primaire obligatoire comme condition bloquante. La recherche choisit dynamiquement les sources adaptées au sujet. Les articles peuvent transporter des faits, une dynamique et une attribution rapportée ; ils ne fournissent pas automatiquement la causalité finale ni l'orientation Gold. Les critères absolus restent : **fraîcheur, véracité/corroboration suffisante, exactitude par rapport à la question**.

### 16.1 — Dashboard MINIMAL (le poste de pilotage quotidien, 8 charts)

| Chart                | Symbole TradingView                    | Ce que je regarde                                                                                       | Relation habituelle / quand elle casse                                                            | TF       |
|----------------------|----------------------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|----------|
| **Gold futures**     | CME:GC1! (ou COMEX:GC1!)               | Ton instrument. Confirme-t-il ou diverge-t-il des drivers ?                                             | — (la divergence Gold vs drivers EST une info : force/faiblesse intrinsèque)                      | H1/H4/D  |
| **2Y yield**         | TVC:US02Y                              | Le juge de paix du repricing Fed, l'indicateur avancé n°1 de GC en séance macro                         | Inverse de Gold. Casse : jours de débasement pur (Gold ↑ avec 2Y ↑)                               | M15/H1/D |
| **10Y yield**        | TVC:US10Y                              | Direction + quelle maturité mène vs le 2Y (cause du mouvement)                                          | Inverse de Gold, sauf term premium/fiscal                                                         | H1/D     |
| **Real yield 10Y**   | FRED:DFII10 (quotidien, retard 1j)     | Le coût d'opportunité — superposé à Gold en inversé                                                     | LA relation de référence. Casse : régime souverain (2022-25) → surveiller la corrélation roulante | D        |
| **DXY**              | TVC:DXY (ou CAPITALCOM:DXY en continu) | Direction + corrélation 30j avec Gold (détecteur de régime)                                             | Inverse. Casse : panique, crise hors-US, débasement                                               | H1/D     |
| **Pétrole WTI**      | NYMEX:CL1!                             | En 2026 : le pipeline direct vers le CPI → la Fed. Régime-spécifique mais actuellement Tier 1           | WTI ↑ = hawkish à venir = bearish Gold (régime actuel)                                            | H4/D     |
| **S&P futures**      | CME_MINI:ES1!                          | Risk-on/off + détection des phases de liquidation (ES -2% + VIX \>35 = danger de vente forcée sur Gold) | Variable ; utile en combinaison (quadruple check)                                                 | H1/D     |
| **USDJPY ou USDCNH** | OANDA:USDJPY · FX_IDC:USDCNH           | JPY : stress de carry/liquidité. CNH : demande refuge chinoise                                          | USDJPY qui décroche violemment = risque liquidation globale                                       | H4/D     |

### 16.2 — Dashboard AVANCÉ (analyse hebdo / profonde)

| Bloc                | Symboles                                                     | Usage                                                                                                              |
|---------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Gold spot & ratio   | OANDA:XAUUSD · GC1!/SI1! (ratio or/argent)                   | Basis futures-spot (stress physique) ; ratio Au/Ag (l'argent surperforme en phase spéculative, l'or en phase peur) |
| Courbe & breakevens | TVC:US30Y · US10Y-US02Y (spread) · FRED:T10YIE · FRED:T5YIFR | Steepening/flattening + cause ; ancrage des anticipations (5Y5Y)                                                   |
| Real yields fins    | FRED:DFII5 · TVC:US10Y-FRED:T10YIE (proxy temps réel)        | Décomposition nominal = réel + breakeven                                                                           |
| Volatilité          | TVC:VIX · CBOE:GVZ · TVC:MOVE                                | VIX \>35 = risque liquidation ; GVZ = peur pricée sur l'or ; MOVE = stress obligataire (term premium)              |
| Obligations futures | CBOT:ZN1! (10Y) · CBOT:ZB1! (30Y) · CBOT:ZT1! (2Y)           | Version tradable des yields — utile en superposition graphique                                                     |
| Proxies actions     | AMEX:GLD · AMEX:GDX                                          | GLD volume/gap (demande US retail/instit) ; GDX/Gold ratio (les minières mènent parfois les retournements)         |
| Liquidité (hebdo)   | FRED:WALCL · FRED:RRPONTSYD · FRED:WTREGEN                   | Bilan Fed, RRP, TGA → liquidité nette (toile de fond)                                                              |

**Organisation d'écran suggérée**

Layout TradingView 2×2 en séance : **GC M15 \| US02Y M15 \| DXY M15 \| ES M15**. Le matin (rapport quotidien) : passage en revue du dashboard avancé en Daily, 10 minutes. La corrélation roulante 30j Gold-DXY et Gold-DFII10 peut se coder en un indicateur Pine simple (`ta.correlation(close, request.security(...), 30)`) — tu as largement le niveau pour l'écrire.

### 16.3 — Les sources : qui produit quoi

| Catégorie                   | Source                                                                                                    | Type                            | Gratuit | Contenu / fréquence / pourquoi                                                                                                                |
|-----------------------------|-----------------------------------------------------------------------------------------------------------|---------------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Calendrier éco              | ForexFactory / Investing.com                                                                              | Agrégateur                      | Oui     | Consensus, previous, impact estimé. Vérifier l'heure (fuseau!). Base de la préparation quotidienne.                                           |
| Inflation                   | BLS.gov (CPI, PPI) · BEA.gov (PCE)                                                                        | PRIMAIRE                        | Oui     | Le chiffre officiel + les tableaux de composition (shelter, supercore) que les résumés omettent.                                              |
| Emploi                      | BLS.gov (NFP) · DOL (claims, jeudi)                                                                       | PRIMAIRE                        | Oui     | Rapport complet avec révisions et les deux enquêtes.                                                                                          |
| Séries & graphs             | FRED (fred.stlouisfed.org)                                                                                | PRIMAIRE agrégée                | Oui     | TOUT : DFII10, T10YIE, T5YIFR, WALCL, RRP, TGA… API gratuite → la source candidate n°1 du terminal (ch. 22).                                  |
| Fed pricing                 | CME FedWatch                                                                                              | Donnée de marché                | Oui     | Probabilités par réunion depuis les FF futures. LA page du matin. Pour un Sunday Read, comparer le dernier état de séance disponible, la dynamique récente sur plusieurs séances et les repricings matériels autour des événements — pas un « Δ24h » calendaire artificiel le week-end. |
| Fed                         | federalreserve.gov                                                                                        | PRIMAIRE                        | Oui     | Communiqués, SEP/dots, minutes, calendrier des discours, transcripts.                                                                         |
| Treasury                    | treasurydirect.gov (résultats d'enchères) · QRA (refunding trimestriel)                                   | PRIMAIRE                        | Oui     | Bid-to-cover, tails, répartition des acheteurs à 13h ET les jours d'enchères.                                                                 |
| Positionnement              | CFTC.gov — COT Disaggregated                                                                              | PRIMAIRE                        | Oui     | Vendredi 15h30 ET, photo du mardi. Ton pipeline percentile 3 ans se branche dessus (CSV historiques dispo).                                   |
| ETF                         | SPDR Gold Shares (holdings GLD quotidiens) · WGC ETF flows mensuels                                       | PRIMAIRE                        | Oui     | Tonnage quotidien = demande d'investissement occidentale.                                                                                     |
| Banques centrales / demande | World Gold Council (gold.org) — Gold Demand Trends + stats BC mensuelles                                  | PRIMAIRE (estimations incluses) | Oui     | Trimestriel + mensuel, ~1 mois de retard. Lire l'estimation « unreported » (leçon Q1 2026).                                                   |
| Physique Asie               | Shanghai Gold Exchange (premiums via WGC/analystes) · LBMA                                                | PRIMAIRE/mixte                  | Oui     | Primes SGE = thermomètre demande chinoise ; stats de clearing LBMA.                                                                           |
| News marchés                | Reuters, Bloomberg (terminal \$\$ / site), FT, WSJ                                                        | COMMENTAIRE de qualité          | Partiel | Le narratif consensus (« gold rises as… ») — une donnée en soi. Nick Timiraos (WSJ) = le canal officieux de la Fed.                           |
| Recherche                   | Notes publiques : CME Group articles, WGC research, ECB/BIS/FMI papers, banques (JPM/GS insights publics) | RECHERCHE                       | Souvent | Cadres analytiques, études de la relation real-yields/BC (ECB 2025 = référence sur le breakdown).                                             |

### 16.4 — Newsletters, podcasts, livres — pour progresser au-delà du cours

| Ressource                                                           | Niveau         | Sujet / pourquoi                                                                                       | Quoi observer                                                                                               |
|---------------------------------------------------------------------|----------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **fedguy.com — Joseph Wang**                                        | Intermédiaire+ | Ex-trader du desk de la Fed : plomberie monétaire (RRP, TGA, QT) sans mystique                         | Comment un pro relie liquidité → actifs sans slogans                                                        |
| **The Macro Compass — A. Peccatiello**                              | Intermédiaire  | Macro globale pédagogique, très bon sur le rate pricing et les régimes                                 | Sa façon de quantifier « ce qui est pricé »                                                                 |
| **Lyn Alden (newsletter)**                                          | Tous niveaux   | Dette, dominance fiscale, monnaie — le versant structurel bullish or, argumenté rigoureusement         | Le canal fiscal→débasement du ch. 07, en profondeur                                                         |
| **Podcast MacroVoices**                                             | Intermédiaire+ | Interviews hebdo de gérants macro (souvent métaux)                                                     | Comment les invités hiérarchisent leurs drivers et énoncent leurs invalidations                             |
| **Odd Lots (Bloomberg)**                                            | Tous niveaux   | Mécanique des marchés expliquée par les praticiens (épisodes Treasury, bases, COMEX)                   | Les épisodes plomberie Treasury/or physique                                                                 |
| **Forward Guidance (Blockworks)**                                   | Intermédiaire  | Fed, liquidité, taux — invités type Joseph Wang                                                        | Le vocabulaire de rate strategist en contexte                                                               |
| **In Gold We Trust Report (Incrementum, annuel, gratuit)**          | Intermédiaire  | LE pavé annuel de référence sur l'or (400 p.) : historique, flux, valorisations                        | Biais structurellement bullish assumé — lire pour les données, garder l'esprit critique sur les conclusions |
| **WGC Gold Demand Trends (trimestriel)**                            | Tous niveaux   | La comptabilité officielle de la demande mondiale                                                      | Le tableau BC déclaré vs estimé                                                                             |
| **Erb & Harvey — « The Golden Dilemma » (papier académique, SSRN)** | Avancé         | La critique académique la plus citée des narratifs or (hedge inflation contesté sur certains horizons) | L'antidote au confirmation bias bullish — connais les meilleurs arguments adverses                          |
| **Ray Dalio — Principles for Navigating Big Debt Crises**           | Intermédiaire  | Cycles de dette, débasement, comportement de l'or dans les grandes crises                              | Le template « austérité/défaut/monétisation » du ch. 07                                                     |
| **Bianco Research / comptes taux sérieux**                          | Avancé         | Term premium, enchères, courbe en temps réel                                                           | La lecture des enchères (tails, indirects) commentée en live                                                |

**Hygiène informationnelle**

Trois couches, toujours identifiées : **1) Source primaire** (BLS, Fed, CFTC — le fait), **2) Donnée de marché** (FedWatch, COT, prix — ce que le marché en fait), **3) Commentaire** (Reuters, newsletters, X — ce qu'on en raconte). Une opinion d'analyste n'est jamais une donnée. Méfiance particulière : les sites « gold bugs » perpétuellement bullish et les prévisions de prix sensationnalistes — consomme leurs données, jamais leurs conclusions.


---

# Chapitre 17 · La méthode

## La Méthode d'Analyse & la Market Story

Il n'existe dans ce système AUCUN score, AUCUNE pondération, AUCUN vote d'indicateurs. Le marché n'est pas une addition de variables : c'est un système de causes. La méthode consiste à observer les faits, reconstruire les chaînes de transmission, identifier le moteur dominant, chercher activement les contradictions — et produire une HISTOIRE DU MARCHÉ dont l'orientation, quand elle existe, est exprimée en degrés de conviction honnêtes.

### 17.1 — Pourquoi le scoring a été supprimé (comprendre pour ne jamais y revenir)

Trois raisons de fond. **1) Le double comptage** : le matin d'un CPI dovish, tu verrais « 2Y ↓ ✓, real yields ↓ ✓, USD ↓ ✓, FedWatch dovish ✓, Gold ↑ ✓ » — cinq points verts qui donneraient un score écrasant… alors que c'est UNE seule information (le repricing Fed) reflétée cinq fois. Un score compte cinq votes ; la réalité n'en contient qu'un. **2) La régime-dépendance** : le poids « juste » de chaque variable change avec le contexte (le DXY vote fort en régime financier, presque plus en régime souverain) — toute pondération fixe est fausse une partie du temps, et toute pondération « apprise » sur 2-3 régimes de données est du sur-apprentissage. **3) La fausse objectivité** : un score chiffré déguise des choix arbitraires en mesure, et t'invite à agir sur un nombre que personne ne peut défendre. La compréhension causale est plus lente à écrire, mais c'est la seule qui survit au changement de régime.

### 17.2 — Les familles d'observation (ce qu'on REGARDE, pas ce qu'on additionne)

Les six familles couvrent tout ce qui peut faire bouger l'or. Chacune produit des FAITS (le WHAT), jamais des points :

| Famille                                   | Faits observés                                                                                                   | Horizon naturel          |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------------|--------------------------|
| **Fed & rate pricing**                    | FedWatch : état actuel + changement depuis la dernière séance disponible + dynamique récente (~5 séances) + repricings matériels autour des événements · 2Y niveau/direction/dynamique · communications Fed matérielles · prochain FOMC                         | Tactique → positioning   |
| **Rates & real yields**                   | DFII10 niveau + tendance/dynamique · décomposition nominal/real/breakeven (tenor nommé) · quelle maturité mène · pente 2s10s et sa patte motrice · MOVE contextuel si pertinent | Tactique → positioning   |
| **USD & liquidité**                       | DXY direction/dynamique (+ mouvement généralisé ou porté par une jambe si matériel) · corrélation 30j Gold-DXY comme mesure de contexte · USDJPY/USDCNH · liquidité/funding USD       | Tactique → positioning   |
| **Inflation, croissance, fiscal, crédit** | Publications matérielles : actual/consensus/previous/révisions + lecture rapportée · pétrole · enchères Treasury · credit spreads HY/IG             | Positioning → structurel |
| **Flux & positionnement**                 | COT percentile · OI · ETF flows · options (GVZ, skew, spot-vol) · les 5 questions du ch. 21 · funding/fusibles (BoJ/JGB/VIX lorsque réellement pertinents)                      | Positioning              |
| **Structurel**                            | Achats banques centrales (déclaré vs estimé) · demande Chine/physique et primes SGE · dédollarisation (action observable vs narratif) · thème débasement · « no material change » autorisé                           | Structurel               |

**La règle anti-double-comptage**

Avant d'écrire « plusieurs éléments confirment », demande-toi : combien de DRIVERS INDÉPENDANTS y a-t-il réellement derrière ces observations ? Le test : « si le driver X n'existait pas, cette observation existerait-elle encore ? ». 2Y ↓ + real yields ↓ + USD ↓ le même matin de CPI = un driver. 2Y ↓ (Fed) + primes SGE ↑ (Chine) + enchère 30Y ratée (fiscal) = trois drivers réellement indépendants — ça, c'est une confluence.

#### Contrat d'entrée des six familles — décisions LOCKED

Les six Family Evidence Cards ont été collectées **avant** l'utilisation de ce manuel. Elles doivent préserver l'état actuel et la dynamique récente plutôt qu'une simple photo statique. Quand la date fait partie du sens du fait, l'`AS-OF` est explicite ; `ANSWERED / PARTIAL / UNKNOWN` distingue une mesure connue d'une absence de mesure. Un fait partagé entre familles peut être réutilisé, mais ne devient jamais une deuxième confirmation indépendante.

- **F1 — Fed & rate pricing** possède l'état brut du **US 2Y**, ainsi que FedWatch, les communications Fed matérielles et le prochain FOMC. Le Sunday Read compare la dernière séance disponible, la dynamique récente (~5 séances) et les repricings autour d'événements ; il n'invente pas un Δ24h calendaire pendant le week-end.
- **F2 — Rates & real yields** utilise le 2Y pour lire la **structure** des taux (leading maturity, 2s10s, front-end vs long-end), possède real yields/breakevens et le **MOVE** lorsqu'il apporte une information contextuelle. Le tenor des breakevens doit être nommé. Un sanity check `nominal − breakeven ≈ real` peut être tenté quand les données le permettent, mais il n'est jamais bloquant.
- **F3 — USD & liquidité** possède USDJPY/USDCNH et la liquidité/funding USD. Si le DXY fait un mouvement matériel, il faut distinguer si le mouvement est généralisé ou surtout porté par une composante. Mesurer la corrélation Gold-DXY 30j est permis ; en déduire une causalité ne l'est pas encore.
- **F4 — Inflation/croissance/fiscal/crédit** possède les publications elles-mêmes (actual/consensus/previous/révisions), leur lecture rapportée, le pétrole, les enchères Treasury et HY/IG. Les réactions Fed/taux/USD appartiennent respectivement à F1/F2/F3.
- **F5 — Flux & positionnement** possède COT/OI/ETF/options et les cinq questions du ch. 21. BoJ/JGB/VIX ne deviennent des recherches que s'ils sont réellement nécessaires pour funding/fusibles. Les faits déjà établis dans une autre famille sont référencés et ne sont jamais recomptés comme nouvelle preuve. Les fenêtres temporelles doivent rester visibles, notamment pour le COT (photo du mardi, publiée le vendredi). `UNKNOWN` est une vraie réponse, particulièrement pour forced buyer/fuse.
- **F6 — Structurel** possède la demande souveraine et physique. Les achats BC doivent distinguer `DECLARED / ESTIMATED / INFERRED / UNKNOWN`. `NO MATERIAL CHANGE SINCE LAST KNOWN DATA` est une réponse complète et valide.

**Articles et causalité.** `EVENT FACT` (ce qui s'est produit) et `REPORTED LINK` (ce qu'un article attribue au mouvement) restent séparés. Une attribution de **réaction** exige que l'événement ait déjà eu lieu ; une attribution d'**anticipation/positionnement avant événement** peut légitimement précéder l'événement. Un lien rapporté reste une hypothèse à tester, jamais une causalité déjà validée.

**Métriques calculées.** Le LLM ne fabrique jamais un coefficient de corrélation, un percentile ou une statistique nécessitant une série historique. La valeur exacte est autorisée seulement si elle est publiée par une source fiable ou calculée par un outil déterministe à partir d'inputs traçables ; sinon, caractérisation explicitement qualitative ou `UNKNOWN`.

### 17.3 — Le contexte par horizon (le « régime » assoupli)

Le régime n'est plus une étiquette rigide remplie une fois pour toutes : c'est une **synthèse**, reconstruite à partir des états séparés (inflation, croissance, Fed, rates, USD, fiscal, crédit, géopolitique, flux), et exprimée PAR HORIZON :

- **Tactical context** (minutes→jours) : à quoi le marché répond-il cette semaine ? Quel est l'événement qui domine l'agenda ?
- **Medium-term context** (jours→semaines) : quelle tendance de repricing/positionnement est en cours ?
- **Structural backdrop** (mois→années) : quel est le décor de fond (bid souverain, fiscal, dédollarisation) ?

Les archétypes du ch. 14 (financier, inflation scare, souverain/débasement, panique, récession…) restent la GRAMMAIRE pour décrire ces contextes — mais un contexte peut être **hybride** (« souverain en fond, inflation scare en tactique » = exactement 2026), **en transition**, ou **inclassable**. « No clear regime » est une réponse valide et fréquente. Les outils de diagnostic restent les mêmes : corrélations roulantes 30j, quadruple check yields/USD/Gold/actions, 5Y5Y, tendance ISM/claims.

### 17.4 — La Market Story : relier au lieu d'additionner

La sortie centrale du système. Une Market Story est une reconstruction causale : *quel(s) driver(s), par quelles chaînes de transmission, expliquent le comportement actuel de l'or et des actifs liés — et qu'est-ce qui cloche.*

Exemple de Market Story (forme cible)

FAITS : claims ↑ 5e semaine · ISM Services 48 · FedWatch +0.4 cut en 5j · 2Y -18 bps · DFII10 -11 bps · DXY -0.8% · Gold +2.1% · COT pctl 41 · GLD +6 t

↓  chaîne de transmission identifiée

Données d'emploi molles → repricing dovish → 2Y ↓ → real yields ↓ → USD ↓ → Gold ↑  (UN driver : la croissance qui faiblit)

↓  confirmations indépendantes / contradictions / anomalies

Confirme (indépendant) : GLD inflows = l'Ouest participe. Contradiction : aucune majeure. Anomalie : rien d'inexpliqué. Non-observé : réaction BC/physique (données en retard).

↓  sortie

STORY : « ralentissement → pivot dovish » — orientation haussière LIKELY, horizon jours→semaines. Invalidations : rebond des claims 2 sem. / CPI core ≥ 0.4% MoM / 2Y qui reprend +15 bps.

#### Ce que la Story doit toujours identifier

- **Le(s) chaîne(s) de transmission** actives, écrites maillon par maillon ;
- **Le driver commun** derrière les co-mouvements (anti-double-comptage) ;
- **Le moteur dominant** — les 3 tests du ch. 13 restent la méthode : à quoi GC/XAUUSD répond-il tick par tick ? que dit le narratif consensus ? quel événement va trancher ? ;
- **Les confirmations réellement indépendantes** vs les échos du même driver ;
- **Les contradictions et divergences**, cherchées ACTIVEMENT (un rapport sans contradiction listée est suspect) ;
- **Les anomalies / l'inexpliqué** — ce que la story n'explique pas est aussi important que ce qu'elle explique ;
- **Les invalidations**, écrites à l'avance, datées/chiffrées quand possible.

### 17.5 — La sortie : orientation qualitative, jamais un chiffre

| Vocabulaire                         | Signification                                                                                               | Usage                                                                                                     |
|-------------------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| **CLEAR**                           | Un driver dominant identifié, chaînes cohérentes, contradictions mineures, confirmations indépendantes      | Rare. L'orientation peut être énoncée franchement (« haussier, horizon X »), toujours avec invalidations. |
| **LIKELY**                          | Story cohérente mais un élément manque (confirmation indépendante, ou contradiction non résolue secondaire) | Orientation énoncée avec sa réserve explicite.                                                            |
| **PLAUSIBLE / MIXED**               | Plusieurs hypothèses tiennent, ou drivers opposés actifs sans hiérarchie nette                              | Pas d'orientation ferme — la story décrit le conflit et ce qui le tranchera.                              |
| **INSUFFICIENT EVIDENCE / UNKNOWN** | Mouvement inexpliqué, données manquantes/périmées, ou aucun mécanisme convaincant                           | « No clear dominant story ». Sortie parfaitement valide — et fréquente.                                   |

**Les trois règles de sur-couche (conservées, sans score)**

**1. Mode événement** : Tier 1 sous 24h → toute story porte la mention `EXPIRE À [heure]` et la conviction est plafonnée — l'événement peut tout réécrire. **2. Le moteur dominant a le dernier mot** : aucune orientation ne peut contredire ce à quoi le marché répond effectivement en ce moment ; si tes mécanismes disent une chose et le comportement du prix une autre, la sortie est MIXED, pas ta préférence. **3. L'écart-au-prix** : si le mouvement a déjà largement eu lieu (tag `LATE`), la story reste vraie mais l'opportunité s'est dégradée (ch. 12) — à croiser avec l'analyse d'asymétrie du ch. 21.

### 17.6 — Le rapport quotidien (référence pédagogique, version sans score)

GOLD DAILY — MARKET STORY REPORT (15-20 min le matin)

> **Usage actuel du projet : Sunday Read.** Ce template quotidien est conservé comme référence de méthode, pas comme UI finale. Pour le Sunday Read, « depuis hier » devient « ce qui a changé pendant la semaine », l'analyse reçoit le Weekly Gold Recap + les six Family Evidence Cards, et le format final/scénarios sera spécifié séparément dans le Skill. Les principes 17.3→17.5 restent inchangés.

```
DATE : ____ · XAUUSD : ____ · Δ overnight : ____ %
──────────────────────────────────────────────
0 · AGENDA — Tier 1 aujourd'hui ? ____ à ____ ET → story EXPIRE à cette heure
    Qu'attend exactement le marché (consensus / FedWatch / whisper) : ____________
──────────────────────────────────────────────
1 · FAITS PAR FAMILLE (le WHAT, brut, sans interprétation)
    Fed pricing : ____ (dernière séance / dynamique ~5 séances) · 2Y : ____   Rates/RY : DFII10 ____ (Δ5j) · 2s10s ____
    USD : DXY ____ · corr30j ____              Inf/Croiss/Fiscal/Crédit : ____
    Flux/Posit. : COT pctl ____ · OI ____ · GLD ____ · GVZ/skew ____
    Structurel (dernier connu) : ____
──────────────────────────────────────────────
2 · QU'EST-CE QUI A CHANGÉ depuis hier ? ______________
──────────────────────────────────────────────
3 · HYPOTHÈSES CONCURRENTES (minimum 2)
    H1 : ____________  H2 : ____________  H3 : ____________
    Test cross-asset (laquelle colle au comportement réel ?) : ____
──────────────────────────────────────────────
4 · MARKET STORY (3-6 phrases, chaînes écrites maillon par maillon)
    ______________________________________________
    Driver dominant : ______ · Preuve : ______
    Drivers indépendants qui confirment : ______  · Contradictions : ______
    Anomalies / inexpliqué : ______
──────────────────────────────────────────────
5 · CONTEXTES : tactique ____ · medium ____ · structurel ____ (hybride/transition OK)
──────────────────────────────────────────────
6 · ORIENTATION : CLEAR / LIKELY / PLAUSIBLE / MIXED / INSUFFICIENT / UNKNOWN
    Si énonçable : sens ____ · horizon ____ · tag LATE ? __ · EXPIRE À ? __
──────────────────────────────────────────────
7 · ASYMÉTRIE (bloc du ch. 21) : positionnement / options / fusibles / catalyseur → A-read : ____
──────────────────────────────────────────────
8 · INVALIDATIONS (écrites AVANT, chiffrées si possible) : ______________
──────────────────────────────────────────────
9 · POST-MORTEM d'hier : la story a-t-elle tenu ? __ Qu'est-ce qui l'a confirmée/détruite ? ____
```

**Les deux lignes qui font tout le système**

La ligne 8 (invalidations écrites AVANT) tue le narratif a posteriori. La ligne 9 (post-mortem) transforme le rapport en historique auditable : chaque Story est conservée telle quelle dans l’historique — jamais réécrite — puis confrontée aux faits lors du post-mortem. C'est comme ça qu'on apprend : pas en notant un score, en confrontant ses histoires d'hier à la réalité d'aujourd'hui.


---

# Chapitre 18 · L'entraînement

## 30 Scénarios Pratiques

La méthode : lis les données, produis TON analyse complète (raisonnement → driver dominant → contradictions → biais → confiance → invalidation), PUIS ouvre la correction. Ne triche pas — c'est la répétition qui construit le réflexe. Les scénarios montent en difficulté par bloc.

### Bloc A — Données macro simples (1-8)

#### SCÉNARIO 01 · INFLATION · CPI net sous les attentes, tout confirme

*CPI +0.1% MoM (att. +0.3%) · Core +0.2% (att. +0.3%) · US2Y -12 bps · US10Y -7 bps · DFII10 -8 bps · DXY -0.6% · Gold +1.2% dans l'heure*

**Raisonnement** : surprise désinflationniste propre (headline ET core sous les attentes). Le marché ajoute des cuts → 2Y mène la baisse (signature repricing Fed) → real yields -8 bps → USD suit. Chaîne canonique complète, tous les maillons confirment. Gold +1.2% est la réaction « juste » — ni retard ni exagération.

**Driver dominant** : repricing Fed (F1), transmis via F2/F3. **Contradictions** : aucune.

HAUSSIER horizon 1-5 jours · confiance HAUTE.

**Invalidation** : le 2Y reprend ses 12 bps (un discours Fed hawkish qui « repousse » le chiffre) ou le prochain print d'inflation contredit. Note : après +1.2%, tag `LATE` partiel pour l'intraday — le gros du repricing du jour est fait ; le biais sert surtout à filtrer les setups des prochaines séances.

#### SCÉNARIO 02 · INFLATION · CPI au-dessus… mais guerre majeure annoncée le même jour

*CPI +0.5% MoM (att. +0.3%) · US2Y +15 bps · DXY +0.8% · MAIS escalade militaire majeure annoncée à midi · Gold clôture +2%*

**Raisonnement** : deux chocs opposés le même jour. Le CPI hawkish (2Y +15 bps = repricing réel) aurait dû donner Gold -1% à -2%. Le +2% final signifie que le flux refuge a ÉCRASÉ le flux taux — le marché te montre son moteur dominant en temps réel (test de corrélation immédiate, ch. 13). Attention : c'est la hiérarchie du JOUR, pas de la semaine.

**Driver dominant** : géopolitique (canal 1 refuge). **Contradictions** : F1 franchement bearish, non résolu — juste dominé temporairement.

LÉGÈREMENT HAUSSIER intraday/1-2 jours · confiance BASSE-MOYENNE.

**Invalidation & vigilance** : désescalade sous 48h → le CPI hawkish « reprend ses droits » et le -1.5% différé arrive d'un coup (double peine : refuge dégonflé + taux). Si le conflit touche le pétrole, rappelle-toi 2026 : le canal 2 finit par gagner en semaines. Un +2% sur du refuge AU-DESSUS d'un repricing hawkish est un rally à ne surtout pas chasser.

#### SCÉNARIO 03 · FED · Powell dovish… mais les cuts déjà totalement pricés

*Discours clairement dovish (« le moment des baisses approche ») · FedWatch pricait DÉJÀ 100% le cut + 3 autres sur 12 mois · 2Y -2 bps seulement · Gold +0.1% puis -0.6% en clôture*

**Raisonnement** : le discours confirme ce qui est pricé → information nouvelle ≈ 0 → le 2Y quasi immobile le prouve (l'arbitre a parlé). Le -0.6% = prises de profit des positions accumulées en anticipation, classique « buy the rumor sell the news ». Aucun paradoxe.

**Driver dominant** : priced in / positionnement (F5). **Contradictions** : aucune — l'apparente contradiction « dovish mais baisse » se dissout dans le concept d'écart aux attentes (ch. 12).

NEUTRE · confiance MOYENNE (le contexte dovish de fond reste, mais sans carburant frais).

**Invalidation / relance** : il faudrait une surprise dovish AU-DELÀ du pricing (50 bps, annonce de fin de QT anticipée…) pour relancer. Leçon : mesure toujours le discours contre FedWatch d'AVANT, jamais dans l'absolu.

#### SCÉNARIO 04 · EMPLOI · Le rapport « fort-faible »

*NFP +250k (att. +180k) · MAIS révisions M-1/M-2 : -110k cumulées · chômage 4.1% → 4.3% · AHE +0.2% MoM (att. +0.3%) · Gold -0.9% à 8h31, puis remonte*

**Raisonnement** : headline fort → spike algo bearish. Mais la lecture multidimensionnelle (ch. 05/11) : surprise nette ~ -40k après révisions, chômage en hausse (Sahm rule qui se rapproche), salaires mous. Rapport FAIBLE déguisé. Le juge de paix : où finit le 2Y à +30/60 min ? S'il passe en baisse, le marché a relu comme toi.

**Driver dominant** : F1 via la relecture du rapport. **Contradiction** : entre le headline et les détails — résolue par la hiérarchie (révisions + ménages \> headline).

LÉGÈREMENT HAUSSIER 1-5 jours (économie plus faible que pricé → cuts reviennent) · confiance MOYENNE.

**Invalidation** : 2Y qui clôture en HAUSSE (le marché garde la lecture headline) → la lecture redevient baissière. Sur le graphique : le retournement post-spike de 8h35-9h30 est un des patterns macro-alignés les plus propres qui existent — l'absorption du spike bearish se lit dans la price action.

#### SCÉNARIO 05 · FED · Le « hawkish cut »

*FOMC : cut de 25 bps comme pricé à 96% · MAIS dots : plus que 1 cut l'an prochain (le marché en pricait 3) · Presser : « le rythme va ralentir » · 2Y +14 bps · Gold -1.4%*

**Raisonnement** : l'acte (cut) valait zéro (pricé). L'information, c'est la TRAJECTOIRE : 2 cuts retirés du pricing via les dots = surprise hawkish nette. Le 2Y +14 bps un jour de baisse de taux dit tout : le marché a monté ses anticipations FUTURES. « Hawkish cut » — décembre 2024 en fut l'exemple parfait.

**Driver dominant** : F1 (guidance \> décision). **Contradictions** : aucune.

BAISSIER 1-5 jours · confiance HAUTE.

**Invalidation** : données faibles dans les jours suivants qui « effacent » les dots (le marché reprice contre la Fed), ou discours corrigeant le tir. Leçon : jour de FOMC, ton unité d'analyse est *Δ(trajectoire pricée)*, jamais la décision.

#### SCÉNARIO 06 · INFLATION · CPI mixte : headline chaud, core froid

*Headline +0.5% MoM (att. +0.3%, essence +9%) · Core +0.2% (att. +0.3%) · Gold -0.8% en 3 minutes puis +0.5% à 10h · 2Y finit -4 bps*

**Raisonnement** : les algos vendent le headline ; les humains lisent le core sous les attentes — la Fed « voit à travers » un choc essence isolé si le core reste sage. Le 2Y en baisse en clôture = la lecture core a gagné. Le pattern V-shape des CPI mixtes est un classique.

**Driver dominant** : F1, version core. **Contradiction** : headline vs core — tranchée par « qu'est-ce qui change la trajectoire Fed ? » : le core.

LÉGÈREMENT HAUSSIER 1-5 jours · confiance MOYENNE.

**Invalidation** : si le pétrole CONTINUE de monter (le choc essence de ce mois devient le core de dans 6 mois — leçon Hormuz), le biais bascule. Surveille CL comme un **canal contextuel majeur** dans ce régime, sans en faire une nouvelle famille ni un vote supplémentaire. Ne jamais trader la première bougie d'un CPI mixte.

#### SCÉNARIO 07 · CROISSANCE · La peur de récession s'installe

*ISM Services 48.2 (3e mois sous 50) · Claims : 5e semaine de hausse · GDPNow 0.4% · FedWatch : 3 cuts pricés dans l'année (vs 1 il y a un mois) · DFII10 -25 bps sur le mois · Gold +4% sur le mois · ES -6%*

**Raisonnement** : régime en bascule vers « récession qui s'installe ». Le repricing dovish est engagé mais PAS terminé (3 cuts pricés — un vrai hard landing en voit 5-6+). Real yields en tendance baissière = la chaîne canonique travaille pour toi. Gold +4% avec ES -6% = découplage refuge sain, pas de liquidation (VIX à vérifier).

**Driver dominant** : F1/F2 en tendance. **Contradiction/risque** : la phase de liquidation (canal 3) si la récession devient panique — l'or peut prendre -5% éclair AVANT de continuer.

HAUSSIER 1-4 semaines · confiance HAUTE.

**Invalidation** : rebond ISM \>50 + claims qui refluent 2 semaines, ou inflation qui réaccélère et coince la Fed (bascule stagflation → tout re-analyser). Plan pour le spike de VIX \>38 : ne pas paniquer sur la purge, c'est historiquement une fenêtre d'achat une fois la Fed activée.

#### SCÉNARIO 08 · DONNÉE NEUTRALISÉE · Retail Sales fort… annulé par sa révision

*Retail Sales +0.9% (att. +0.3%) · M-1 révisé de +0.5% à -0.2% · 2Y +1 bp · DXY flat · Gold -0.1%*

**Raisonnement** : le NIVEAU des ventes atterrit quasi où le marché le croyait (le +0.9% part d'une base abaissée de 0.7). Surprise nette ≈ 0 → le 2Y immobile le confirme → zéro repricing → zéro carburant Gold. Un Tier 2 auto-neutralisé.

**Driver dominant** : aucun activé aujourd'hui. NEUTRE — le biais de fond d'hier reste en vigueur, inchangé.

**Leçon** : la moitié des publications se neutralisent ainsi. Savoir dire « non-événement » en 60 secondes t'économise des dizaines de faux signaux par an. Actual − Forecast ± Révisions = surprise NETTE, toujours.

### Bloc B — Priced in, positionnement, flux (9-16)

#### SCÉNARIO 09 · PRICED IN · La guerre que le marché n'écoute plus

*Conflit majeur en cours depuis 3 mois · Nouveau headline d'escalade (frappes) · Gold +0.3% pendant 40 min puis clôture NÉGATIVE · 3e occurrence de ce pattern en 2 semaines*

**Raisonnement** : le test de réaction (ch. 12) est formel : un marché qui ne monte plus sur les mauvaises nouvelles du thème a fini de le pricer. La prime refuge est pleine. L'asymétrie s'est INVERSÉE : l'upside exige une escalade d'un cran supérieur (improbable au quotidien), le downside se déclenche sur toute désescalade (de plus en plus probable avec le temps).

**Driver dominant** : F4 épuisé → le marché va se re-brancher sur F1/F2 (surveille ce que GC suit tick par tick cette semaine).

LÉGÈREMENT BAISSIER 1-4 semaines (risque de dégonflage de prime) · confiance MOYENNE.

**Invalidation** : escalade qualitativement supérieure (nouvel acteur, nucléaire, énergie). Leçon : le même headline n'a pas la même valeur au jour 1 et au jour 90.

#### SCÉNARIO 10 · POSITIONNEMENT · Crowded long + surprise hawkish = cascade

*COT : MM net long au 96e percentile 3 ans · Gold +11% en 6 semaines · CPI ressort +0.4% core (att. +0.2%) · Gold -3.1% EN UNE SÉANCE (vs -1% « attendu » pour cette surprise)*

**Raisonnement** : l'amplitude anormale (-3.1% pour une surprise qui en vaut « fondamentalement » -1) EST l'effet positionnement : stops de MM en cascade, CTA qui flippent, longs tardifs qui capitulent. Le COT n'a pas prédit la direction — il a prédit l'AMPLITUDE et l'asymétrie (ch. 08). C'est exactement janvier-février 2026 en miniature.

**Driver dominant** : F1 (détonateur) × F5 (charge explosive).

LÉGÈREMENT BAISSIER 1-5 jours (les purges de positionnement mettent des jours à s'épuiser, les rebonds sont vendus) · confiance MOYENNE.

**Invalidation** : donnée dovish franche, ou signes d'épuisement de la purge (OI qui se stabilise, price action qui montre l'absorption des ventes). Règle pratique : quand percentile COT \>90, réduis d'un cran la conviction de toute lecture haussière et considère chaque événement Tier 1 comme un risque asymétrique baissier.

#### SCÉNARIO 11 · POSITIONNEMENT · Marché lavé + catalyseur dovish

*COT : MM net long au 9e percentile 3 ans après 3 mois de baisse · GLD : outflows depuis 8 semaines · CPI core -0.1% sous attentes · Gold +2.6% en une séance, +5% sur la semaine*

**Raisonnement** : le miroir du scénario 10. Positionnement au plancher = shorts à racheter + un monde entier sous-investi. Une surprise dovish modeste produit un mouvement énorme : personne à liquider côté long, tout le monde à convertir côté achat. Le meilleur profil asymétrique long du système (ch. 08).

**Driver dominant** : F1 (détonateur) × F5 (asymétrie inversée).

HAUSSIER 1-4 semaines · confiance HAUTE (le re-positionnement s'étale : MM met des semaines à reconstruire, chaque dip est acheté).

**Invalidation** : re-surprise hawkish nette (2Y +15 bps) ; ou COT qui repasse \>70e percentile (le carburant est consommé, retour au régime normal).

#### SCÉNARIO 12 · FLUX · Rally sans les ETF : qui porte le prix ?

*Gold +6% en 3 semaines · GLD holdings : FLAT (aucun inflow) · OI futures +14% · Primes SGE \$38/oz · Annonce PBoC : plus gros achat mensuel en 2 ans*

**Raisonnement** : rally porté par futures (spéculatif, OI ↑) + physique asiatique/souverain — SANS l'investisseur occidental. Deux lectures simultanées vraies : (a) il reste un réservoir d'acheteurs entiers pas encore convertis (les ETF) = potentiel de 2e jambe ; (b) le rally repose sur des jambes plus étroites = plus vulnérable à un repricing Fed qui frapperait les futures.

**Driver dominant** : F6/F5 souverain-physique. **Contradiction** : absence de confirmation occidentale.

LÉGÈREMENT HAUSSIER 1-4 semaines · confiance MOYENNE.

**Signal de bascule à surveiller** : le jour où GLD imprime des inflows sérieux, la confirmation occidentale **renforce qualitativement** la conviction ; si à l'inverse l'OI se dégonfle sans inflows, le rally était locatif → conviction dégradée.

#### SCÉNARIO 13 · PRICED IN · Le cessez-le-feu télégraphié

*Négociations publiques depuis 2 semaines, « accord imminent » titré partout · Gold a déjà rendu -4% depuis le pic du conflit · L'accord est signé dimanche · Lundi : Gold -0.4% seulement puis stabilise*

**Raisonnement** : la désescalade était le scénario central pricé — les -4% AVANT la signature étaient le mouvement. Le -0.4% résiduel = les derniers retardataires. C'est le symétrique exact du « buy rumor sell news » : « sell the rumor of peace, done before the peace ». La stabilisation rapide montre que la prime géopolitique est purgée.

**Driver dominant** : plus personne — F4 vient de mourir comme moteur. Le marché va élire un nouveau dominant (généralement retour à F1/F2).

NEUTRE · confiance MOYENNE — laisse les familles Fed/taux/USD reprendre le rôle de moteur si les faits le justifient.

**Invalidation du calme** : violation du cessez-le-feu (re-pricing refuge violent car plus personne n'est couvert).

#### SCÉNARIO 14 · ÉVÉNEMENT IMMINENT · La veille d'un CPI, biais « parfait » au tableau

*Toutes tes familles d'observation pointent haussier (repricing dovish, DFII10 -12 bps/5j, DXY faible) · Story haussière LIKELY · MAIS CPI demain 8h30 · COT percentile 88*

**Raisonnement** : Mode événement (ch. 17.5) : Tier 1 sous 24h → la story EXPIRE à 8h30 demain et la conviction est plafonnée, quel que soit l'alignement. En plus : COT à 88 = le consensus dovish est déjà très exprimé → un CPI même « en ligne » peut décevoir les espoirs les plus dovish (whisper), et un CPI chaud déclenche le scénario 10.

HAUSSIER (LIKELY) mais tag `EXPIRE 8:30` · conviction plafonnée.

**Traduction opérationnelle** : trades longs envisageables aujourd'hui, position à plat ou réduite avant 8h30 (le CPI est une loterie), rapport flash post-CPI avant de re-trader. La méthode ne sert pas qu'à donner un sens : elle te dit QUAND ton sens ne vaut plus rien.

#### SCÉNARIO 15 · WHISPER · « En ligne » et pourtant ça monte

*Depuis le consensus (fixé il y a 10 jours), le pétrole a fait +12% · CPI ressort PILE au consensus +0.3% · Gold +0.9% dans l'heure, 2Y -6 bps*

**Raisonnement** : le whisper number s'était décalé AU-DESSUS du consensus officiel (tout le monde craignait la contamination pétrole). Un chiffre « en ligne » avec le consensus = SOUS le whisper = soulagement dovish. Le 2Y -6 bps confirme. Le point zéro de la réaction n'est pas le consensus imprimé : c'est l'attente réelle du marché au moment T.

**Driver dominant** : F1 via surprise-vs-whisper.

LÉGÈREMENT HAUSSIER 1-5 jours · confiance MOYENNE.

**Leçon pratique** : quand un choc survient ENTRE la fixation du consensus et la publication (pétrole, tarifs…), écris dans ton rapport pré-événement : « consensus officiel X, attente réelle probablement X+ ». C'est une des rares vraies asymétries informationnelles accessibles à un indépendant attentif.

#### SCÉNARIO 16 · ETF DIVERGENCE · Prix qui baisse, ETF qui accumulent

*Gold -5% en 3 semaines (repricing hawkish modéré) · MAIS GLD +28 t sur la période (inflows soutenus) · COT MM percentile passé de 82 à 51 · Primes SGE remontent*

**Raisonnement** : la baisse est portée par les futures (dé-risking spéculatif) pendant que l'argent « lent » (ETF = allocataires) ACHÈTE la faiblesse, et le physique asiatique revient. Le positionnement se nettoie (82→51) sans que la demande de fond ne parte. Profil de correction saine dans une tendance, pas de retournement.

**Driver dominant** : F1 hawkish à court terme, mais en voie d'épuisement face à F5/F6 acheteurs.

NEUTRE intraday · LÉGÈREMENT HAUSSIER horizon 2-4 semaines · confiance MOYENNE.

**Invalidation** : les ETF basculent en outflows (la dernière jambe de soutien lâche) → la correction change de nature. Ce scénario illustre le double-biais par horizon : parfaitement légitime tant que chaque étiquette d'horizon est explicite.

### Bloc C — Régimes, fiscal, liquidité, cas tordus (17-24)

#### SCÉNARIO 17 · FISCAL · L'enchère 30Y ratée — quel canal ?

*Enchère 30Y : tail 3.2 bps, bid-to-cover plus bas de 2 ans, indirects en retrait · US30Y +14 bps, US2Y +2 bps · DXY -0.6% · S&P -1.4% · Gold +1.1%*

**Raisonnement** : le quadruple check (ch. 07) : yields ↑ + USD ↓ + Gold ↑ + actions ↓ = signature « sell America » / canal 2 débasement. Le 30Y qui mène seul (2Y immobile) = term premium pur, pas repricing Fed. Le monde exige plus pour financer les USA et une partie du capital préfère l'or à la duration US.

**Driver dominant** : F4-fiscal / F6. **Contradiction apparente** : « yields ↑ mais Gold ↑ » — dissoute par la CAUSE du mouvement (ch. 02).

LÉGÈREMENT HAUSSIER 1-4 semaines · confiance MOYENNE (les épisodes de term premium avancent par vagues, entrecoupés d'accalmies).

**Invalidation** : la prochaine grosse enchère passe bien + re-corrélation classique (Gold qui rebaisse quand yields montent) = l'épisode est clos.

#### SCÉNARIO 18 · LIQUIDATION · Le crash où l'or baisse « alors qu'il devrait monter »

*Choc systémique (faillite/credit event) · S&P -4.5%, VIX 44, spreads crédit +60 bps · USD +1.4% · Treasuries achetés (10Y -18 bps) · Gold -2.8% ( !! )*

**Raisonnement** : canal 3 (ch. 10) — panique de marge. Les fonds leveragés vendent CE QUI EST LIQUIDE ET EN PROFIT pour couvrir les appels de marge : l'or, précisément parce qu'il a bien performé. « Last man standing gets sold first. » Mars 2020 : -12% en une semaine. Ce n'est PAS un signal fondamental bearish — c'est de la mécanique de bilan.

**Driver dominant** : liquidité forcée (mécanique de bilan, distincte des drivers macro habituels).

BAISSIER tactique tant que VIX >40 et que la liquidation forcée domine · puis potentiellement FORTEMENT HAUSSIER une fois une intervention monétaire crédible confirmée (facilités, cuts d'urgence, QE) — séquence 2008/2020 : liquidation → intervention → real yields écrasés → or en orbite.

**Plan écrit à l'avance** : ne pas acheter le couteau pendant la marge ; le signal d'entrée historique = l'annonce Fed + stabilisation du crédit, pas le point bas du prix. Et ne JAMAIS shorter la « cassure » d'un or en liquidation : le retournement est brutal.

#### SCÉNARIO 19 · RÉGIME · Gold ignore les real yields depuis 2 mois — qui a raison ?

*DFII10 +35 bps sur 2 mois (de 1.8% à 2.15%) · Le modèle classique « prédit » Gold -6/8% · Réel : Gold +3% · Corr 30j Gold-DFII10 : -0.7 → -0.05 · Achats BC records au dernier WGC · Enchères Treasury moyennes*

**Raisonnement** : le marché te notifie un CHANGEMENT DE RÉGIME (financier → souverain/débasement). La corrélation effondrée n'est pas un « retard » du prix qu'il faudrait shorter : c'est le signe que l'acheteur marginal a changé (2022-2025 en fut la démonstration historique). L'analyse bascule en contexte « souverain » : le structurel et les flux physiques passent devant les real yields dans la hiérarchie de lecture.

**Driver dominant** : F6 structurel. **Piège mortel évité** : shorter l'or « parce que le modèle dit qu'il est trop cher » — le trade qui a ruiné des desks entiers en 2023-2024.

LÉGÈREMENT HAUSSIER 1-4 semaines · confiance MOYENNE (un régime souverain amortit aussi les upside rapides : c'est un grind, pas un spike).

**Invalidation du régime** : la corrélation 30j qui replonge sous -0.5 (le financier reprend la main) — recharge alors la table de poids classique.

#### SCÉNARIO 20 · STAGFLATION · La Fed coincée : le biais dépend d'une phrase

*ISM 47 · Claims en hausse · MAIS core CPI 3.8% et pétrole +20% · FedWatch : marché partagé 50/50 entre « hike » et « cuts d'ici 6 mois » · Discours du Chair demain*

**Raisonnement** : stagflation = le régime où la donnée compte MOINS que la fonction de réaction. Les deux issues sont écrites : Fed choisit l'emploi (tolère l'inflation) → real yields s'effondrent avec la crédibilité → régime années 70 → très bullish. Fed choisit l'inflation (Volcker/Warsh) → hikes dans la faiblesse → très bearish. Le pricing 50/50 dit que le marché ne sait pas — et toi non plus : c'est PRÉCISÉMENT le cas d'école du NEUTRE légitime.

NEUTRE — NO CLEAR STORY jusqu'au discours · confiance HAUTE dans le neutre lui-même.

**Plan** : le discours de demain est l'événement binaire qui élira le régime. Prépare les DEUX lectures à l'avance (2 phrases chacune, ch. 12), et laisse le 2Y trancher à +30 min. Forcer un biais aujourd'hui, c'est parier à pile ou face avec un déguisement analytique.

#### SCÉNARIO 21 · POLITIQUE · Nomination surprise d'un Fed Chair dovish

*Rumeur sourcée : le prochain Chair sera un dovish assumé, favorable à des cuts rapides · Aucune décision de taux avant 5 mois · 2Y -9 bps, 10Y -4 bps, breakevens +6 bps · DXY -0.8% · Gold +1.6%*

**Raisonnement** : le marché price la FONCTION DE RÉACTION future (ch. 03/10) : distribution des trajectoires décalée vers le bas → cuts anticipés plus tôt → 2Y ↓. Le détail qui enrichit : breakevens +6 avec nominaux -9 = real yields -15 bps ET prime de crédibilité/débasement qui s'installe (un Chair perçu comme politiquement complaisant = anticipations d'inflation moins ancrées). Double carburant. Symétrique exact de l'effet Warsh de 2026, en sens inverse.

**Driver dominant** : F1 anticipé + F6 crédibilité.

HAUSSIER 1-4 semaines · confiance MOYENNE-HAUTE.

**Invalidation** : démenti de la rumeur, ou audition de confirmation où le nominé se révèle plus orthodoxe que sa réputation (repricing inverse).

#### SCÉNARIO 22 · USD PIÈGE · DXY +1.2%… à cause de l'euro

*Crise politique en zone euro (gouvernement qui tombe, spreads souverains +25 bps) · EURUSD -1.5% → DXY +1.2% · Taux US quasi inchangés · Gold en EUR : +2.1% · Gold en USD : +0.3%*

**Raisonnement** : le DXY monte SANS force américaine — c'est une faiblesse européenne (le DXY est ~58% euro). Le canal habituel « DXY ↑ = conditions US serrées = bearish Gold » ne s'applique pas : les taux US n'ont pas bougé. Au contraire, le stress européen crée une demande refuge (l'or en EUR explose). L'or en USD résiste au dollar fort = force intrinsèque remarquable.

**Driver dominant** : F4 (stress hors-US). **Leçon** : toujours demander « le DXY monte-t-il parce que l'Amérique est forte ou parce que l'Europe est faible ? » — regarder EURUSD et les taux US pour trancher. L'or dans TOUTES les devises est le vrai tableau de bord du refuge.

LÉGÈREMENT HAUSSIER 1-5 jours · confiance MOYENNE. **Invalidation** : résolution politique rapide, ou contagion qui devient panique de liquidité globale (→ scénario 18).

#### SCÉNARIO 23 · CHINE · Yuan sous pression, primes SGE en feu

*USDCNH +2.5% en 6 semaines (plus bas du yuan en 2 ans) · Primes SGE \$52/oz (extrême) · Immobilier chinois : nouvelles défaillances · PBoC annonce son 8e mois consécutif d'achats · Gold global : +1.5% sur la période, calme*

**Raisonnement** : triple signal chinois convergent (ch. 06/09) : dépréciation → fuite de l'épargne vers l'or ; immobilier cassé → réallocation structurelle ; PBoC en accumulation assumée. La prime SGE à \$52 dit que la demande dépasse l'offre importable — un aspirateur physique est branché sous le marché mondial.

**Driver dominant** : F6/F5 physique. **Nuance d'horizon capitale** : ce moteur ne produit PAS de spike — il produit un PLANCHER : corrections plus courtes, dips achetés, grind haussier.

LÉGÈREMENT HAUSSIER structurel (semaines-mois), 0 intraday · confiance HAUTE sur l'asymétrie (« les shorts swing ont une espérance dégradée »), pas sur le timing.

**Invalidation** : primes SGE qui basculent en décote durable + pause PBoC (demande chinoise rassasiée — c'est arrivé après les grands rallys).

#### SCÉNARIO 24 · PLOMBERIE · Le drainage de liquidité post-debt-ceiling

*Accord sur le plafond de dette signé · Le Trésor annonce la reconstitution du TGA : ~\$500 Md d'émissions de bills en 8 semaines · RRP déjà bas · Actions nerveuses · Gold : quel effet ?*

**Raisonnement** : TGA qui se remplit = réserves aspirées hors du système (ch. 06) ; RRP bas = pas de coussin pour amortir → drainage net de liquidité pendant 2 mois. Vent contraire modéré pour TOUS les actifs, or compris — mais indirect et lent (via conditions financières et appétit spéculatif), pas un choc directionnel.

**Driver dominant** : la liquidité seule est rarement dominante — elle DÉGRADE le contexte sans donner de signe fort.

NEUTRE à légèrement défavorable aux longs comme **modificateur** : conserve la Story issue des autres familles, mais réduis qualitativement la confiance dans les setups longs pour 4-8 semaines.

**Leçon** : la plomberie (TGA/RRP/QT) se traite comme un **contexte/modificateur**, pas comme un vote directionnel autonome — sauf accident aigu (repo 2019) où elle devient Tier 1 en forçant la main de la Fed (bullish).

### Bloc D — Synthèses multi-facteurs & pièges finaux (25-30)

#### SCÉNARIO 25 · CONFLIT TOTAL · Cinq facteurs, trois directions

*Real yields -6 bps/5j (bullish) · DXY +0.9%/5j (bearish) · Escalade géopolitique fraîche (bullish) · ETF outflows -12 t/5j (bearish) · Achats BC solides au dernier WGC (bullish structurel) · GC : +0.4% sur 5j, monte la nuit sur les headlines, rend tout en séance US*

**Raisonnement (procédure ch. 13)** : 1) Horizons : BC = structurel, hors biais swing → plancher noté. 2) Le COMPORTEMENT du prix est l'indice décisif : monte la nuit (refuge Asie/headlines), vend en séance US (les flux financiers occidentaux — DXY/ETF — dominent aux heures US). Le marché est littéralement coupé en deux par fuseau. 3) Ni le refuge ni le financier n'a gagné : +0.4% net en 5j = bruit.

**Moteur dominant** : indéterminable — les tests donnent deux réponses selon l'heure.

NEUTRE — NO CLEAR DOMINANT STORY · confiance HAUTE dans le neutre.

**Traduction opérationnelle** : trades techniques possibles dans les deux sens, exposition standard, aucun avantage directionnel à revendiquer. Et c'est très bien ainsi : déclarer NO CLEAR STORY ici est la sortie la plus professionnelle possible — la méthode a fait exactement son travail.

#### SCÉNARIO 26 · PIÈGE NARRATIF · L'explication inventée après le mouvement

*Gold -1.8% sans AUCUNE donnée, headline ni mouvement notable des taux/DXY · Les médias du soir titrent « l'or baisse sur des prises de profit et les craintes de taux » · Ton framework matinal disait HAUSSIER / LIKELY*

**Raisonnement** : quand le prix bouge sans catalyseur identifiable, les explications publiées sont des narratifs a posteriori (« craintes de taux » alors que le 2Y n'a pas bougé = récit vide). Causes probables réelles : flux mécaniques — gros ordre institutionnel, roll d'échéance, flip CTA sur cassure d'un niveau, dégagement d'options. Le graphique (volume, niveaux, heure du mouvement) en dit plus que Reuters ici.

**Ce que fait le framework** : un mouvement SANS invalidation déclenchée ne change PAS le biais. Tes invalidations écrites le matin (2Y, désescalade, niveaux) n'ont pas sonné → la Story haussière tient, et la baisse est potentiellement une meilleure entrée, pas un signal.

ORIENTATION MAINTENUE · confiance inchangée.

**Leçon anti-confirmation-bias inversé** : ne pas réécrire son analyse pour coller au dernier tick. Le prix a le droit de faire du bruit ; ton biais ne meurt que par ses invalidations, jamais par une bougie inexpliquée. (Si le mouvement persiste 2-3 jours sans explication, LÀ, enquête : le marché sait peut-être quelque chose.)

#### SCÉNARIO 27 · JOUR FOMC COMPLET · 14h00 vs 14h30 : l'inversion classique

*14h00 : statu quo + communiqué durci d'un mot (« inflation remains elevated » ajouté) → Gold -0.8% en 10 min · 14h35 : en Q&A, le Chair lâche « nous sommes probablement au pic des taux » → 2Y -16 bps · 15h30 : Gold +1.4% sur la journée*

**Raisonnement** : anatomie type (ch. 03/11). Le communiqué (rédigé en comité, prudent) a donné le premier mouvement ; la presser (le Chair en direct) a donné la VRAIE information : « pic des taux » = fin du cycle de hausse = repricing dovish massif. Le 2Y -16 bps est l'arbitre : la journée est dovish, point. Le -0.8% de 14h05 était un piège pour quiconque tradait le communiqué.

**Driver dominant** : F1, version presser.

HAUSSIER 1-5 jours (un « pic des taux » déclenche des semaines de repricing et de re-positionnement) · confiance HAUTE.

**Règle gravée** : jour FOMC, aucun verdict avant 15h15. Le biais du jour = là où le 2Y CLÔTURE, pas là où il a spiké.

#### SCÉNARIO 28 · CAS 2026 COMPLET · Reconstituer le -26% : l'examen final rétrospectif

*Jan : Gold \$5,598, COT ~record, plusieurs cuts pricés · Fév : guerre Iran, Hormuz bloqué, pétrole \$65→\$110, Gold spike initial · Mars-juin : CPI grimpe jusqu'à 4.2%, Warsh hawkish, comité 9-8, ~60% de hike pricé · Juil : Gold ~\$4,100 (-26%)*

**Déroulé par le framework, mois par mois** :

**Janvier** : contexte structurel haussier MAIS COT percentile ~99 + « plusieurs cuts » pricés = tout le monde du même côté, asymétrie baissière maximale (A-read PIÈGE). La méthode n'aurait pas prédit le choc — elle aurait dit : conviction réduite, vulnérabilité extrême aux surprises hawkish.

**Février (guerre)** : spike refuge (canal 1). La grille du ch. 10 pose LA question : « le choc touche-t-il le pétrole ? » — OUI, massivement (Hormuz) → alerte écrite : le canal 2 (pétrole → CPI → Fed) va concurrencer le refuge sous quelques semaines.

**Mars-juin** : chaque CPI en hausse + chaque discours Warsh = repricing hawkish séquentiel (la lecture Fed se dégrade cran après cran), sur un positionnement encore long = cascades (scénario 10 en boucle). Le moteur dominant a changé de main : l'or répond aux taux, plus aux headlines de guerre (test tick-par-tick). Story : baissière CLEAR pendant tout le trimestre.

**Juillet (aujourd'hui)** : pétrole revenu ~\$68 → la mécanique s'inverse potentiellement : l'énergie va dégonfler les prochains CPI → le « peak hawkishness » se discute → chaque CPI redevient l'événement binaire (régime frontière du ch. 14). Positionnement purgé = asymétrie redevenue favorable aux surprises dovish (scénario 11 en embuscade).

**Les leçons condensées** : (1) guerre ≠ bullish quand elle passe par le pétrole ; (2) le positionnement extrême est l'amplificateur qui a transformé un repricing en -26% ; (3) le bid BC est un plancher, pas un airbag ; (4) le moteur dominant CHANGE en cours de route et le marché le dit en temps réel à qui observe à quoi il répond.

#### SCÉNARIO 29 · DOUBLE HORIZON · Biais swing haussier, impulsion intraday baissière : le cas quotidien

*Ton rapport : HAUSSIER 1-4 sem (repricing dovish en tendance, ETF inflows, COT 45) · Ce matin 8h30 : PPI ressort chaud, 2Y +9 bps, Gold -0.8% en 30 min · Ta lecture technique te donne une opportunité SHORT propre à 10h15*

**Raisonnement** : deux horizons, deux biais, zéro contradiction (ch. 13). Intraday : le moteur ACTIF du jour est le PPI hawkish → orientation intraday LÉGÈREMENT BAISSIÈRE (un Tier 2 seul justifie rarement une conviction forte). Swing : un PPI seul n'invalide pas 3 semaines de tendance dovish (vérifie : ton invalidation écrite disait « 2Y +15 bps ou CPI chaud » — 9 bps sur un PPI ne déclenche pas).

**Décision** : le short de 10h15 est macro-aligné SUR SON HORIZON (intraday) — cohérent, MAIS objectifs raccourcis : tu shortes CONTRE un courant swing haussier — prends les profits vite, ne laisse pas un short intraday devenir une position de conviction. (La décision reste la tienne : la méthode fournit le contexte, pas l'ordre.)

BAISSIER intradayHAUSSIER swing maintenu

**Leçon** : la méthode ne produit pas UNE lecture mais une lecture PAR horizon — et ta gestion de trade (durée de détention, take profit) doit être cohérente avec l'horizon de la lecture qui la justifie.

#### SCÉNARIO 30 · L'EXAMEN NEUTRE · Tout est calme : le piège de l'ennui

*Aucun Tier 1 sous 5 jours · 2Y ±2 bps/5j · DFII10 flat · DXY en range de 3 semaines · COT 55e pctl · GLD flat · Pas de headline · GC en range de \$60 depuis 8 séances · Tu n'as pas pris de trade depuis 3 jours et ça te démange*

**Raisonnement** : aucune famille n'apporte de driver dominant, aucun catalyseur ne tranche → le système sort **NEUTRE / NO CLEAR DOMINANT STORY** avec une forte confiance dans cette absence de direction. Le danger ici n'est pas analytique, il est PSYCHOLOGIQUE : l'envie de « trouver » un biais pour justifier de l'action (le confirmation bias ne fabrique pas que des biais faux — il fabrique aussi des biais inutiles).

NEUTRE — et c'est la bonne réponse

**Traduction opérationnelle** : en range macro, ton edge vient à 100% de ta lecture technique (les ranges sont d'excellents environnements de mean-reversion) — la macro dit simplement « pas de vent, naviguez aux rames ». Le trader qui force une orientation imaginaire ici prendra des breakout trades directionnels dans un marché sans carburant : la pire combinaison espérance/frustration qui existe.

**Rappel final** : sur ~250 jours de trading par an, un système honnête sort NEUTRE peut-être 40-50% du temps. Si le tien sort un biais directionnel tous les jours, il ne mesure pas le marché — il mesure ton envie de trader.


---

# Chapitre 19 · L'immunisation

## Les Erreurs qui Détruisent une Analyse Macro Gold

Chaque erreur ci-dessous a coûté de l'argent réel à des traders réels — plusieurs ont coûté des milliards à des desks professionnels. Format : l'erreur → pourquoi le cerveau la commet → le cas réel → l'antidote intégré à ta routine.

### 19.1 — Erreurs de variables

| Erreur                                             | Pourquoi on la commet                                                                                             | Cas réel                                                                                                                                                    | Antidote de routine                                                                                                |
|----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| **Regarder seulement le DXY**                      | C'est le chart le plus simple et le plus cité                                                                     | 2022-2025 : des mois entiers de corrélation Gold-DXY nulle ou positive — quiconque tradait « DXY ↑ donc short Gold » s'est fait broyer par le bid souverain | La corrélation roulante 30j est DANS le rapport quotidien : elle te dit chaque matin si le DXY a le droit de voter |
| **Regarder seulement le US10Y nominal**            | « Les taux montent » semble suffisant                                                                             | 2024-2025 : 10Y en hausse par term premium → Gold en hausse AVEC lui ; ceux qui shortaient sur « yields ↑ » combattaient un régime débasement               | Toujours décomposer : quelle maturité mène (2Y vs 30Y) + real vs breakeven (ch. 02, tableau des 4 causes)          |
| **Confondre taux nominal et taux réel**            | Le nominal est affiché partout, le réel demande un chart de plus                                                  | 2011 : nominaux « bas mais positifs », real yields NÉGATIFS → l'or à \$1,920. Lire le nominal seul rendait le rally « incompréhensible »                    | DFII10 est un fait central de **F2 Rates & real yields**, pas une option. Le nominal seul ne suffit jamais à expliquer le mouvement                   |
| **Utiliser la même logique dans tous les régimes** | Le cerveau adore les règles permanentes ; les backtests longs les « confirment » en moyennant des régimes opposés | « Inflation = bullish Gold » : vrai 1971-1980, faux 2022 (-20%), faux H1 2026 (-26%)                                                                        | La première question de l'analyse est le CONTEXTE, avant toute variable ; la hiérarchie de lecture change avec lui |
| **Acheter Gold automatiquement sur une guerre**    | Le réflexe refuge est le cliché le plus ancré du marché                                                           | 2026 : guerre majeure + Hormuz → spike puis -26%, parce que le canal pétrole→CPI→Fed a écrasé le refuge (ch. 10)                                            | La grille géopolitique en 6 questions, dont LA question : « le choc touche-t-il le pétrole ? »                     |

### 19.2 — Erreurs d'attentes

| Erreur                                           | Pourquoi                                                                                                    | Cas réel                                                                                                                                                               | Antidote                                                                                                                         |
|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| **Analyser l'Actual sans le Forecast**           | Le chiffre absolu semble être « la donnée » ; l'attente semble secondaire                                   | « CPI à 4.2%, c'est haut, short Gold » — si le marché attendait 4.4%, c'est une surprise DOVISH et Gold monte                                                          | Ne jamais écrire un chiffre dans le rapport sans son consensus à côté ; la surprise est la seule colonne qui compte              |
| **Ignorer les révisions**                        | Elles sont en petit, en bas du communiqué, et les algos les ratent 30 secondes                              | Le rapport « fort-faible » (scénario 04) : NFP +250k, révisions -110k → le spike bearish initial était un piège                                                        | Ligne « révisions » obligatoire dans la lecture des 60 premières secondes ; verdict seulement après                              |
| **Ignorer ce qui est priced in**                 | On croit que l'événement crée le mouvement, alors que l'anticipation l'a déjà créé                          | Sept. 2025 : cut pricé à ~100% → réaction minuscule le jour J ; ceux qui « achetaient la baisse des taux » achetaient du vide                                          | La question rituelle écrite AVANT chaque événement : « qu'attend le marché, et que fera-t-il si c'est exactement ça ? » (ch. 12) |
| **Confondre biais structurel et biais intraday** | Un argument vrai semble utilisable partout ; « les banques centrales achètent » est vrai, donc réconfortant | Tenir un long intraday perdant « parce que la dédollarisation »… contre un CPI hawkish du jour. Deux horizons, l'argument structurel n'a pas voix au chapitre intraday | Chaque lecture porte une étiquette d'horizon ; la matrice du ch. 13 interdit à un facteur de parler hors de son horizon          |
| **Suivre les news sans hiérarchie**              | Tout headline semble important quand on est en position                                                     | Réagir à un discours d'un gouverneur régional non-votant comme à du Powell ; trader un JOLTS comme un NFP                                                              | La hiérarchie Tier 1/2/3 (ch. 11) + la hiérarchie des voix Fed (ch. 03) sont affichées à côté de l'écran                         |

### 19.3 — Erreurs de raisonnement (les plus chères)

#### Le narratif a posteriori (post-hoc storytelling) \[biais cognitif\]

**Définition:** Construire l'explication APRÈS le mouvement : le prix baisse → le cerveau (et les médias) fabriquent instantanément une cause plausible (« craintes sur les taux ») même quand rien n'a bougé sur les taux.

**Pourquoi c'est mortel:** Ça donne l'illusion de comprendre le marché, donc une fausse confiance dans des « règles » qui n'ont jamais existé. Pire : ça te fait réécrire ton biais pour coller au dernier tick, détruisant toute discipline.

**Antidote:** Le biais ne change que si une **invalidation écrite à l'avance** se déclenche (ligne 6 du rapport). Un mouvement inexpliqué sans invalidation déclenchée = bruit, biais maintenu (scénario 26). Et le post-mortem quotidien (ligne 7) se fait contre les invalidations écrites, jamais contre le récit du soir.

#### Confirmation bias — définition et protocole anti-biais \[biais cognitif\]

**Définition:** La tendance automatique du cerveau à chercher, remarquer, retenir et surpondérer les informations qui confirment ce qu'il croit déjà — et à filtrer, minimiser ou réinterpréter celles qui le contredisent. Ce n'est pas un défaut de discipline : c'est le fonctionnement PAR DÉFAUT de la cognition. On ne le supprime pas, on l'encadre.

**Comment il se manifeste sur l'or:** Tu es long → tu ouvres d'abord les newsletters bullish, tu retiens l'achat PBoC et tu « oublies » l'outflow ETF ; tu qualifies chaque donnée hawkish de « bruit » et chaque donnée dovish de « signal » ; tu surpondères mentalement la famille qui va dans ton sens (« de toute façon le COT ne marche plus »). Le cherry-picking — sélectionner les seules données favorables — en est la forme active.

**Le protocole en 5 verrous (intégré à la routine):** **1. Couverture complète, raisonnement itératif** : les six familles doivent être couvertes avant une orientation finale, mais la phase de connexion n'est pas une cascade rigide ; elle peut revenir d'un mécanisme à un autre pour tester une hypothèse. **2. Faits objectifs, pas scores** : conserver niveaux, variations, percentiles, fenêtres et AS-OF ; ne jamais convertir ces mesures en points. **3. La ligne contradictions est obligatoire** : un rapport sans facteur contradictoire listé est suspect. **4. Le test de l'avocat adverse** : avant de valider une orientation CLEAR/LIKELY, écris le meilleur argument contre elle — si tu n'en trouves pas, tu n'as pas cherché. **5. Post-mortem auditable** : confronter la Story et ses invalidations écrites à la réalité observée ; ne jamais réécrire rétroactivement l'ancienne Story pour la rendre correcte.

#### Le biais de récence & le sur-apprentissage du dernier régime \[biais cognitif\]

**Définition:** Surpondérer ce qui vient de marcher : après 2 ans de « buy the dip » souverain, on oublie que les repricings Fed existent (janvier 2026...) ; après un -26%, on n'ose plus être haussier au moment exact où le positionnement purgé rend l'asymétrie favorable.

**Antidote:** Le chapitre Histoire (15) existe pour ça : 8 régimes différents en 80 ans, aucun n'a été permanent. Et la détection de régime du framework est RÉVISÉE chaque matin — le régime est une hypothèse de travail datée, jamais une identité.

### 19.4 — La checklist d'immunisation (à relire chaque lundi)

Ai-je décomposé chaque mouvement de taux (maturité qui mène + real vs breakeven) avant de l'interpréter ?

Chaque chiffre de mon rapport a-t-il son consensus, ses révisions et sa lecture vs whisper ?

Ai-je écrit ce que le marché attendait AVANT chaque événement de la semaine ?

Chaque Story/orientation émise portait-elle horizon + conviction qualitative + invalidation écrite ?

Ai-je changé une Story/orientation cette semaine SANS raison factuelle ou invalidation déclenchée ? (si oui : pourquoi ? — c'est le symptôme n°1)

Ma ligne « contradictions » était-elle remplie chaque jour ?

Ai-je accepté MIXED / UNKNOWN / NO CLEAR STORY lorsque les faits ne permettaient pas de trancher ? (un système qui force toujours une direction mesure ton envie de trader, pas le marché)

Mon post-mortem est-il fait sur données stockées, pas de mémoire ?


---

# Chapitre 21 · Le cœur de l'edge

## Asymétries, Flux, Positionnement & Carry

Le biais macro te dit dans quel SENS le vent souffle. Ce chapitre te dit QUAND le pari vaut la peine : quand tu risques peu pour gagner beaucoup. C'est la chasse à l'asymétrie — macro, de positionnement, de volatilité et de funding — avec les outils concrets pour la mesurer. Chaque idée issue de tes notes a été vérifiée ; les corrections sont signalées.

### 21.1 — C'est quoi une asymétrie ? (version élémentaire)

Une **asymétrie** = une situation où les issues possibles d'un trade ne sont pas équilibrées : le scénario défavorable te coûte peu (il est proche, identifiable, tu peux couper vite) et le scénario favorable rapporte beaucoup (il y a du carburant pour un grand mouvement). Formellement : espérance = P(gain)×gain − P(perte)×perte. Tu peux avoir raison seulement 40% du temps et être très rentable si tes gains font 4× tes pertes. **Le métier n'est pas de prédire — c'est de ne parier que quand la distribution est déformée en ta faveur.**

D'où viennent les déformations ? Presque toujours de la même source : *des participants qui seront FORCÉS d'agir dans une direction, quel que soit leur avis*. Un marché où tout le monde est libre est symétrique ; un marché plein de gens coincés est asymétrique. Quatre familles d'asymétries exploitables :

| Type                     | Définition                                                                                              | Exemple Gold                                                                                                                    | Outil de mesure                                   |
|--------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| **Macro / régime**       | Le contexte pousse structurellement dans un sens (les ch. 1-17)                                         | Repricing dovish engagé + régime souverain = plancher sous le prix                                                              | La Market Story : orientation qualitative + conviction                  |
| **Positionnement**       | Un camp est surchargé → toute surprise adverse le force à liquider ; le camp vide n'a personne à purger | COT MM au 96e pctl en janv. 2026 → le choc hawkish a fait -26% ; à l'inverse, un marché lavé + surprise dovish = rally explosif | Percentile COT 156 sem., OI, ETF flows            |
| **Volatilité / options** | Le prix de la peur (IV, skew) révèle où le marché est mal couvert ou en FOMO                            | Skew calls or extrême = peur de RATER la hausse ; put blowout post-crash = hedging massif                                       | GVZ, skew, put/call, spot-vol corr (§21.4)        |
| **Funding / carry**      | Des positions entières reposent sur un financement fragile → un signal peut tout renverser d'un coup    | Unwind du carry yen → liquidation globale → Gold vendu puis racheté (août 2024)                                                 | USDJPY, taux BoJ/JGB, credit spreads, VIX (§21.5) |

**La recette validée de ta note — et complétée**

« Il faut un régime macro compatible ET un positionnement extrême » — exact, et j'ajoute les deux ingrédients manquants pour en faire une recette complète : **ASYMÉTRIE EXPLOITABLE = (1) régime macro compatible + (2) positionnement extrême du mauvais côté + (3) un catalyseur daté capable de forcer le repricing + (4) un fusible identifié qui borne ta perte.** Sans le (3), un positionnement extrême peut le rester des mois (on ne shorte pas un extrême sans détonateur). Sans le (4), tu ne sais pas où tu as tort, donc tu ne peux pas dimensionner. Les scénarios 10 et 11 du ch. 18 sont les deux faces de cette recette.

### 21.2 — Les 5 questions avant de toucher un trade (ton framework, vérifié et outillé)

Ce questionnaire est excellent — c'est la grille d'analyse de flux qu'utilisent les macro traders institutionnels. Le voici validé, expliqué de façon élémentaire, et surtout OUTILLÉ : pour chaque question, comment y répondre concrètement sur le Gold.

#### Q1 · FLUX — Quel capital entre, et pourquoi MAINTENANT ? \[qui achète\]

**L'idée:** Un prix ne monte pas « parce que c'est bien » : il monte parce que du capital NET entre. Identifier QUI entre (BC ? ETF ? hedge funds ? retail ? shorts qui rachètent ?) et POURQUOI MAINTENANT (quel événement a déclenché le flux ?) te dit la solidité et la durée probable du mouvement.

**Comment savoir (Gold):** La grille du ch. 08 : ETF holdings (occidentaux, sensibles aux real yields) · COT par catégorie (Managed Money = spéculatif rapide) · achats BC WGC (souverain lent) · primes SGE (physique asiatique) · Open Interest (prix ↑ + OI ↑ = argent neuf ; prix ↑ + OI ↓ = short covering = fragile). Chaque combinaison raconte un acheteur différent → une durabilité différente.

**Le « pourquoi maintenant »:** Cherche le déclencheur DATÉ : un repricing Fed ? une cassure technique (CTA) ? un headline ? un début de mois/trimestre (rebalancing) ? Un flux sans déclencheur identifiable est suspect — soit tu as raté l'info, soit c'est mécanique (roll, options) et ça ne durera pas.

#### Q2 · ACHETEUR FORCÉ — Benchmark, carrière, capex ou couverture ? \[le concept clé\]

**Définition:** Un **acheteur forcé** (ou vendeur forcé) est un participant qui achète/vend pour des raisons NON liées au prix — il est insensible au niveau, il DOIT exécuter. C'est l'or pur de l'analyse de flux : les acheteurs forcés créent des tendances qui ignorent les valorisations, et les vendeurs forcés créent les meilleurs points d'entrée de l'histoire.

**Les 4 motifs (ta liste, explicitée):** **Benchmark** : un gérant comparé à un indice DOIT détenir ce qui pèse dans l'indice, sinon il « parie contre » par omission — quand un actif entre dans un indice ou y grossit, les fonds indiciels et les gérants benchmarkés achètent mécaniquement. **Carrière (career risk)** : rater le rally que tout le monde a = se faire virer ; y participer et perdre avec tout le monde = pardonné. Résultat : les gérants achètent ce qui a déjà monté, par peur professionnelle — un carburant de fin de tendance. **Capex** : une entreprise engagée dans un programme d'investissement DOIT acheter ses inputs (les hyperscalers doivent acheter GPU et électricité quel que soit le prix — c'est le moteur de la tension 2026). **Couverture (hedging)** : un producteur d'or DOIT vendre sa production future ; un dealer d'options DOIT hedger son gamma ; une compagnie aérienne DOIT acheter son kérosène. Le hedger exécute quoi qu'il arrive.

**Comment savoir (Gold):** Les acheteurs forcés/insensibles au prix du Gold actuel : **banques centrales** (motif géopolitique — le grand acheteur forcé structurel 2022-2026, ch. 08) ; **CTA** (forcés par leurs règles : ils DOIVENT acheter les cassures haussières et vendre les cassures baissières — repère les niveaux systématiques type 50/200-DMA) ; **shorts en squeeze** (un short perdant devient un acheteur forcé — OI qui fond dans un rally = eux) ; **dealers short gamma** (forcés d'acheter la hausse et vendre la baisse → amplification) ; **gérants en career risk** quand l'or fait la une (fin 2025 : personne ne pouvait plus NE PAS en avoir). Leur empreinte est visible dans le prix ; cette grille te dit qui ils sont et combien de temps ils durent.

**Erreur fréquente:** Confondre acheteur forcé et acheteur convaincu. Le forcé n'a pas d'opinion — donc il ne « capitule » pas sur une mauvaise nouvelle (les BC continuent d'acheter dans les baisses), MAIS il s'arrête net quand sa contrainte disparaît (l'indice rebalance, le programme capex finit, le gamma expire). Date les contraintes, pas les convictions.

#### Q3 · FUNDING — Qui prête, dans quelle devise, à quel coût ? \[carry\]

**L'idée:** Toute position leveragée a un financement. Tant que le financement est bon marché et stable, la position tient ; quand le coût monte ou la devise de funding s'apprécie, la position devient perdante MÊME SI l'actif n'a pas bougé. Comprendre le funding = savoir où sont les châteaux de cartes. Développement complet au §21.5 (carry yen).

**Comment savoir:** Les 3 questions concrètes : dans quelle devise le monde emprunte-t-il en ce moment ? (réponse 2026 : encore le yen, de moins en moins confortablement, + le franc suisse qui prend le relais) · le coût monte-t-il ? (taux BoJ, JGB 10Y, taux courts US) · la devise de funding s'apprécie-t-elle ? (USDJPY ↓ = alarme). Bonus : le funding OBLIGATAIRE — les hyperscalers financent une part croissante du capex IA par émission de dette : surveille leurs spreads de crédit.

#### Q4 · FUSIBLE — Quel signal transforme le carry en perte ? \[le déclencheur\]

**L'idée:** Le **fusible** = l'événement/niveau précis qui force le débouclage des positions financées. Le connaître AVANT te donne deux super-pouvoirs : tu sais quoi surveiller pour anticiper une liquidation (et t'écarter/te positionner), et tu sais où mettre l'invalidation de ton propre trade.

**Les fusibles concrets du système actuel:** **1. USDJPY qui décroche** (yen qui s'apprécie vite = le funding devient perdant = unwind réflexif — LE fusible du carry, cf. 5 août 2024). **2. Réunions/ton BoJ** (chaque hike ou signal hawkish resserre le nœud — trajectoire 2026 : 0.75% → 1% attendu). **3. VIX \> 25-30 sans catalyseur évident** = du stress de funding se propage avant d'apparaître dans les prix (littérature BIS sur les unwinds). **4. Credit spreads qui s'écartent** (voir la fiche ci-dessous). **5. Enchères JGB faibles / JGB 10Y qui accélère** (≈2.8% en 2026, plus haut depuis 1997 : les capitaux japonais rentrent à la maison = moins d'acheteurs pour les actifs US).

**Application Gold:** Quand un fusible saute : phase 1 = liquidation globale, l'or est VENDU avec tout (canal 3, ch. 10) ; phase 2 = flight to safety + anticipation de réponse Fed = l'or surperforme. Le fusible est donc pour toi : un signal de réduction de risque immédiat + une alerte d'opportunité différée. Ne sois jamais long leveragé quand plusieurs fusibles chauffent en même temps.

#### Q5 · PRIX FINAL — La valo décroche-t-elle du flux marginal ? \[fin de cycle\]

**L'idée:** En fin de mouvement, le prix continue de monter alors que le flux marginal (l'argent NEUF qui entre) faiblit : le prix est porté par la raréfaction des vendeurs et le FOMO, plus par des achats réels. Ce découplage prix/flux = le mouvement vit sur ses réserves = asymétrie qui s'inverse.

**Comment savoir (Gold):** Les divergences à guetter : prix qui monte avec **OI en baisse** (short covering, pas d'argent neuf) · prix qui monte avec **ETF flat/outflows** (scénario 12, ch. 18) · prix qui monte avec **volume décroissant** · primes SGE qui passent en DÉCOTE pendant la hausse (l'Asie ne suit plus — signe classique de sommet : les acheteurs physiques attendent plus bas) · et côté options, le FOMO mesurable du §21.4. Janvier 2026 cochait plusieurs cases.

### 21.3 — Sentiment vs positionnement : la distinction qui change tout

Ta note est exacte et c'est un point que 95% du retail rate : **le sentiment** (ce que les gens DISENT — sondages, réseaux, titres de presse) est mou, gratuit, et souvent contrarian de façon peu fiable. **Le positionnement** (ce que les gens ONT FAIT — positions ouvertes, primes payées) est de l'argent engagé : il est mesurable, et surtout il crée une MÉCANIQUE — des gens qui devront agir. Un marché « bullish en sondage » ne force personne ; un marché long au 95e percentile est une bombe de stops. De même, un blowout de volatilité implicite et une demande massive de puts APRÈS un crash ne signifient pas « le marché pense que ça va baisser » : la plupart de ces puts sont du **hedging** de détenteurs qui GARDENT leurs positions — c'est du positionnement défensif, pas une opinion directionnelle. Interpréter les options demande donc toujours de se demander : qui achète ça, pour se couvrir ou pour spéculer ?

### 21.4 — Mesurer le FOMO avec le prix des options (et pas avec le sentiment)

Version élémentaire d'abord. Une **option** = une assurance sur le prix (un put protège contre la baisse, un call donne droit à la hausse). La **volatilité implicite (IV)** = le prix de cette assurance : chère quand le marché a peur d'un grand mouvement, bon marché quand il est serein. Le comportement NORMAL des marchés d'actifs risqués : *quand le prix monte, la peur baisse → l'IV baisse ; quand le prix chute, la peur monte → l'IV explose* (c'est la corrélation spot-vol négative classique).

Le détecteur de FOMO : la corrélation spot-vol qui s'inverse

Prix qui MONTE + IV qui MONTE en même temps = anomalie

↓  qu'est-ce qui peut faire monter le prix de l'assurance pendant que tout va bien ?

Une demande frénétique de CALLS : des participants paient cher le droit de ne pas rater la hausse

↓

= FOMO MESURÉ EN ARGENT RÉEL (pas en sondage). Documenté sur les meme stocks 2021, sur les semi-conducteurs 2024-25.

**Ton exemple SMH vs IGV, vérifié dans son principe** : SMH (ETF semi-conducteurs) avec prix haut ET IV élevée = FOMO sur le complexe IA-hardware ; IGV (ETF software) avec prix qui baisse et IV qui monte = comportement classique de peur. Les deux ensemble racontent un marché **surchargé des deux côtés** — des chasseurs de hausse d'un côté, des hedgers de baisse de l'autre — donc une variance énorme et un risque de rotation violente : quand tout le monde est déjà positionné, chaque surprise force quelqu'un à courir. (La configuration exacte évolue chaque semaine — c'est l'OUTIL qu'il faut retenir, pas la photo.)

**Application Gold** : le même détecteur s'applique avec GVZ (l'indice de vol de l'or) et le skew. Rappel du ch. 09 : l'or a naturellement un skew côté calls (la peur historique sur l'or est une peur de HAUSSE). Donc : GVZ qui explose avec un skew calls en fusion pendant un rally = FOMO or (fin 2025) ; GVZ élevé avec demande de puts après un crash = hedging du stock existant (2026 post -26%), pas une prédiction baissière. Ajoute au rapport hebdo : niveau GVZ + sens du skew + ta lecture (spéculation ou couverture ?).

### 21.5 — Le carry yen : le funding du monde, expliqué de zéro (et corrigé)

**C'est quoi un carry trade ?** Emprunter dans une devise à taux bas, convertir, investir dans des actifs à rendement plus haut, empocher l'écart (« le carry »). Pendant 25 ans, le Japon a maintenu ses taux à ~0% : emprunter en yen était quasi gratuit. Le monde entier (hedge funds, assureurs, particuliers japonais) a donc emprunté en yen pour acheter des Treasuries, des actions US, de l'émergent — encours estimé du trade spéculatif : **\$300-500 milliards au pic** (estimations citées par Bloomberg), plus les énormes avoirs étrangers structurels des institutions japonaises.

**Pourquoi c'est fragile** : le trade perd de l'argent si (a) le coût d'emprunt monte, ou (b) le yen s'apprécie (il faut rembourser en yen devenu plus cher), ou (c) l'actif acheté baisse. Et il est *réflexif* : quand le yen monte, les carry traders rachètent du yen pour couper → le yen monte encore → d'autres coupent → cascade. **Le cas d'école : 5 août 2024** — hike BoJ + mauvais chiffre emploi US → unwind éclair → Nikkei -12.4% en une séance (pire depuis 1987, ~\$790 Md effacés), liquidation mondiale des positions momentum. L'or a d'abord été vendu dans la purge, puis a repris sa marche.

**État 2026, vérifié** : la BoJ normalise pour de vrai — taux relevé à 0.75% en décembre 2025 (plus haut en 30 ans), 1% attendu mi-2026 ; le JGB 10 ans est vers ~2.8%, un plus haut depuis 1997 ; pendant ce temps la Fed a baissé vers 3.50-3.75% : **l'écart de taux se referme des deux côtés**. Conséquences documentées : les institutions japonaises peuvent enfin gagner leur vie À DOMICILE sans risque de change (moins d'achats d'actifs US), le carry résiduel a un coussin plus mince, et BCA Research qualifiait le trade de « bombe à retardement » en février 2026. Le débouclage est graduel — le risque est qu'il devienne soudain.

**La correction de ta note (importante)**

« Toute la bulle IA / les achats forcés reviennent à une seule source de funding : le carry yen » — séduisant, mais inexact. Le capex IA est financé d'abord par les **cash-flows des hyperscalers** (les entreprises les plus rentables de l'histoire), ensuite par une vague d'**émissions de dette corporate USD** (documentée — et le marché pénalise déjà les capex financés par dette). Le carry yen finance la **couche spéculative leveragée** qui entoure le thème (positions momentum, fonds leveragés) et, plus largement, une partie de la demande étrangère pour les actifs US. Pourquoi la nuance compte pour ton trading : un unwind du carry frappe les POSITIONS (krach de marché rapide, liquidation, l'or vendu puis racheté — un événement de FUSIBLE), pas le programme d'investissement lui-même (qui casserait, lui, sur les cash-flows/le crédit — un événement plus lent, visible dans les credit spreads). Deux fragilités différentes, deux signaux différents, deux vitesses différentes.

#### Credit spreads — la fiche complète que tu as demandée \[crédit · fusible\]

**Définition simple:** Le **credit spread** = l'écart entre le rendement d'une obligation d'ENTREPRISE et celui d'un Treasury de même durée. C'est le prix du risque de défaut : prêter à Microsoft rapporte un peu plus qu'à l'État US (spread Investment Grade, « IG ») ; prêter à une entreprise fragile rapporte beaucoup plus (High Yield, « HY » / junk).

**Mécanisme:** Spreads SERRÉS (bas) = le marché ne craint aucun défaut = complaisance/confiance. Spreads qui S'ÉCARTENT = le marché commence à pricer des défauts = stress qui monte. Le crédit est réputé « plus intelligent » (plus tôt) que les actions : les spreads s'écartent souvent AVANT que les indices actions ne craquent.

**Pourquoi c'est important ici:** Triple rôle dans ton système : **1) Fusible** (§21.2-Q4) : l'écartement des spreads est le signal que le funding se grippe — précurseur de liquidations. **2) Détecteur de régime** : spreads qui s'écartent + claims qui montent = la récession se price (bascule de régime, ch. 14). **3) Canal IA** : la dette des hyperscalers/du complexe data-center est le maillon à surveiller si le capex déçoit.

**Lien Gold:** Séquence type : spreads s'écartent → risk-off → phase 1 possible de liquidation (or vendu) → Fed reprice dovish → phase 2 : real yields ↓ + refuge = or en tête. Comme le VIX : un signal de danger immédiat ET d'opportunité différée.

**Où le suivre (gratuit):** FRED : `BAMLH0A0HYM2` (spread High Yield — LE baromètre, quotidien) et `BAMLC0A0CM` (spread IG). Repères historiques : HY \< 3.5% = complaisance ; 4-5% = normal ; \> 6% = stress sérieux ; \> 8-10% = crise. Ces deux séries peuvent servir de repères de crédit lorsque le contexte l’exige.

### 21.6 — Intégration au système : le bloc ASYMÉTRIE du rapport quotidien

La Market Story (ch. 17) donne la lecture directionnelle qualitative. L'asymétrie est une SECONDE lecture, qui qualifie l'opportunité d'engagement — c'est une seconde lecture, distincte de la Market Story, qui qualifie la qualité de l'opportunité :

BLOC ASYMÉTRIE (ligne 7 du rapport quotidien, ch. 17.6)

```
POSITIONNEMENT : COT pctl __ · OI trend __ · ETF 5j __ → extrême ? (≥85 ou ≤30) O/N
VOL/OPTIONS    : GVZ __ · skew (calls/puts/neutre) __ · spot-vol anormale ? O/N
                 lecture : spéculation / hedging / neutre
FUNDING/FUSIBLES: USDJPY __ · HY spread __ (Δ5j __) · VIX __ · prochain BoJ : __
                 fusibles qui chauffent : ______
FLUX MARGINAL  : le prix confirme-t-il le flux (Q5) ? O/N — divergences : ______
CATALYSEUR DATÉ: ______ (sans catalyseur, un extrême n'est PAS un trade)
──────────────────────────────────────────────
A-READ (lecture qualitative) : FORTE / MOYENNE / FAIBLE / PIÈGE
  FORTE  = contexte compatible + positionnement extrême adverse + catalyseur + fusible borné
  PIÈGE  = story séduisante MAIS positionnement déjà dans mon sens à l'extrême (je suis le retardataire)
```

**Comment la Story et l'A-read travaillent ensemble**

La Story te donne le SENS quand il existe ; l'A-read te dit si l'opportunité vaut l'engagement. Story haussière CLEAR avec A-read FORTE (marché lavé, catalyseur dovish à venir, fusibles froids) = la meilleure configuration du système : conviction élevée, patience longue. Story haussière avec A-read PIÈGE (tout le monde est déjà long à l'extrême) = le sens reste mais tu sais que tu es tardif — prudence, profits rapides, et conscience que la vraie asymétrie est en embuscade DE L'AUTRE CÔTÉ au premier choc (janvier 2026 : contexte structurel haussier, A-read PIÈGE absolu → cette lecture aurait évité le -26%). Et l'asymétrie maximale de toutes : une story SANS conviction qui bascule — un marché indécis + un positionnement extrême + un catalyseur binaire (FOMC, CPI) = c'est là que naissent les plus grands mouvements. Comment traduire tout ça en taille de position relève de TON jugement et de tes règles de risque — le terminal fournit la lecture, jamais l'ordre.

#### Quiz — Gold en rally de 8 semaines. COT MM 93e pctl, prix ↑ mais OI ↓ depuis 2 semaines, primes SGE passées en décote, GVZ en hausse AVEC le prix, skew calls en fusion. CPI dans 3 jours. Diagnostic complet ?

Toutes les alarmes de fin de mouvement en même temps : positionnement extrême long (Q2 : les acheteurs restants sont des forcés tardifs — career risk), flux marginal qui décroche (Q5 : OI ↓ = short covering, l'Asie n'achète plus), FOMO mesuré aux options (spot-vol anormale + skew calls). La story macro peut rester haussière, mais **A-read = PIÈGE** : l'asymétrie est inversée — downside violent sur toute surprise hawkish au CPI, upside limité (qui reste-t-il à convertir ?). Conduite : réduire les longs, interdire de chasser, préparer le plan pour le scénario 10. C'est littéralement la photo de janvier 2026.
