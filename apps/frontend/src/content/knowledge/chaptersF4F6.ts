/**
 * Deterministic bilingual Knowledge content for F4-F6.
 *
 * Examples are hypothetical teaching devices. Nothing in this module is a
 * current-market observation, provider claim, forecast, or trading signal.
 */

import type {
  KnowledgeChapter as BaseKnowledgeChapter,
  KnowledgeExample,
  KnowledgeGlossaryEntry,
  KnowledgeSection,
  LocalizedText,
} from "./chaptersF1F3";

type KnowledgeFamilyIdF4F6 = "F4" | "F5" | "F6";
type KnowledgeChapter = Omit<BaseKnowledgeChapter, "familyId" | "relatedTopics"> & {
  familyId: KnowledgeFamilyIdF4F6;
  relatedTopics: ("F2" | "F3" | KnowledgeFamilyIdF4F6)[];
};

const text = (EN: string, FR: string): LocalizedText => ({ EN, FR });

const F4_INFLATION: KnowledgeChapter = {
  id: "knowledge-f4-inflation",
  familyId: "F4",
  title: text("Inflation: measurement, momentum, and policy transmission", "Inflation : mesure, dynamique et transmission monétaire"),
  description: text(
    "Learn how CPI, PCE, PPI, monthly momentum, annual rates, and base effects fit together—and why an inflation print has two competing transmission channels to Gold.",
    "Comprendre l'articulation entre CPI, PCE, PPI, dynamique mensuelle, taux annuels et effets de base — et pourquoi un chiffre d'inflation emprunte deux canaux concurrents vers l'or.",
  ),
  learningObjectives: [
    text("Distinguish headline from core inflation and CPI from PCE.", "Distinguer inflation globale et sous-jacente, ainsi que CPI et PCE."),
    text("Convert monthly changes into annualized trend measures without confusing them with YoY inflation.", "Annualiser des variations mensuelles sans les confondre avec l'inflation sur un an."),
    text("Trace both the purchasing-power and Fed-reaction channels from inflation to Gold.", "Suivre les canaux du pouvoir d'achat et de la réaction de la Fed entre inflation et or."),
    text("Use surprise, composition, revisions, and cross-family confirmation instead of reading the headline alone.", "Utiliser surprise, composition, révisions et confirmations inter-familles plutôt que le seul titre."),
  ],
  sections: [
    {
      id: "inflation-fundamentals",
      title: text("What inflation measures", "Ce que mesure l'inflation"),
      summary: text("Inflation is the rate of change of a price index, not the price level itself.", "L'inflation est le taux de variation d'un indice de prix, pas le niveau des prix lui-même."),
      paragraphs: [
        text("A price index compresses the prices of many goods and services into one normalized level. Inflation compares that index with an earlier reference. Falling inflation means prices are rising more slowly; it does not normally mean the overall price level is falling. A sustained decline in the index is deflation.", "Un indice de prix rassemble les prix de nombreux biens et services dans un niveau normalisé. L'inflation compare cet indice à une référence antérieure. Une inflation en baisse signifie généralement que les prix augmentent moins vite, non que le niveau général baisse. Une diminution durable de l'indice constitue une déflation."),
        text("Households, firms, governments, central banks, and investors use inflation measures for wage negotiation, contract indexation, budgeting, policy, and valuation. No single index is a complete cost-of-living measure for every household because baskets, geography, substitution, and individual spending differ.", "Ménages, entreprises, administrations, banques centrales et investisseurs utilisent ces mesures pour les salaires, l'indexation, les budgets, la politique monétaire et la valorisation. Aucun indice ne représente parfaitement le coût de la vie de chaque ménage : paniers, géographie, substitutions et dépenses individuelles diffèrent."),
      ],
    },
    {
      id: "core-cpi",
      title: text("Core CPI: construction and purpose", "Core CPI : construction et fonction"),
      summary: text("Core CPI excludes food and energy to reveal a less volatile—but not automatically persistent—underlying signal.", "Le Core CPI exclut alimentation et énergie pour dégager un signal moins volatil — sans garantir qu'il soit persistant."),
      paragraphs: [
        text("The Bureau of Labor Statistics constructs CPI from sampled prices for a consumer basket and expenditure weights. Headline CPI includes the full basket. Core CPI excludes food and energy because their short-run volatility can obscure broader dynamics. Exclusion does not make those costs unimportant, nor does it make core inflation a forecast.", "Le Bureau of Labor Statistics construit le CPI à partir de prix échantillonnés pour un panier de consommation et de pondérations de dépenses. Le CPI global couvre tout le panier. Le Core CPI exclut alimentation et énergie, dont la volatilité à court terme peut masquer la dynamique générale. Cette exclusion ne rend pas ces coûts secondaires et ne transforme pas le core en prévision."),
        text("Composition matters. Shelter can move slowly because rents enter with lags; used vehicles can reverse sharply; medical and other services can follow different clocks. Two identical core prints may therefore imply different persistence. Seasonal adjustment makes adjacent months comparable but can later be revised.", "La composition compte. Le logement peut évoluer lentement car les loyers entrent avec retard ; les véhicules d'occasion peuvent se retourner vivement ; les services médicaux et autres suivent des rythmes distincts. Deux chiffres core identiques peuvent donc signaler des persistances différentes. L'ajustement saisonnier facilite la comparaison mensuelle mais peut être révisé."),
      ],
      bullets: [
        text("MoM answers how the index changed from the prior month; YoY compares with the same month one year earlier.", "MoM mesure la variation depuis le mois précédent ; YoY compare au même mois un an auparavant."),
        text("A release is interpreted relative to consensus, prior, composition, and revisions—not by level alone.", "Une publication s'interprète face au consensus, au précédent, à la composition et aux révisions — pas par son seul niveau."),
      ],
    },
    {
      id: "cpi",
      title: text("CPI units, base effects, and surprises", "Unités du CPI, effets de base et surprises"),
      summary: text("Monthly and yearly rates share an index but answer different questions.", "Les taux mensuels et annuels partent du même indice mais répondent à des questions différentes."),
      paragraphs: [
        text("If an index rises from 310.0 to 310.93, the monthly change is 0.30%. If it stood at 301.6 one year earlier, YoY inflation is about 3.09%. Percentage points describe differences between inflation rates; basis points can also express rate differences, where 10 bp equals 0.10 percentage point.", "Si l'indice passe de 310,0 à 310,93, la variation mensuelle est de 0,30 %. S'il valait 301,6 un an plus tôt, l'inflation YoY est d'environ 3,09 %. Les points de pourcentage décrivent l'écart entre taux ; les points de base aussi, 10 pb valant 0,10 point de pourcentage."),
        text("A base effect occurs when an unusually large or small month exits the twelve-month comparison. YoY can fall even while the latest monthly pace accelerates. Markets often react to the surprise versus a well-defined consensus and to the details most relevant for policy, not simply whether YoY rose or fell.", "Un effet de base apparaît lorsqu'un mois exceptionnellement fort ou faible sort de la comparaison sur douze mois. Le YoY peut baisser alors que le dernier rythme mensuel accélère. Les marchés réagissent souvent à l'écart face à un consensus bien défini et aux détails pertinents pour la politique monétaire, pas seulement au sens du YoY."),
      ],
      examples: [{
        id: "f4-cpi-base-effect-example",
        title: text("Example: cooling YoY, firmer month", "Exemple : YoY en baisse, mois plus ferme"),
        setup: text("Assume core CPI is 0.35% MoM after 0.20%, while YoY falls from 3.2% to 3.1% because a 0.45% month left the window.", "Supposons un Core CPI de 0,35 % MoM après 0,20 %, tandis que le YoY recule de 3,2 % à 3,1 % parce qu'un mois à 0,45 % sort de la fenêtre."),
        steps: [
          text("The latest monthly pulse accelerated by 0.15 percentage point.", "L'impulsion mensuelle accélère de 0,15 point de pourcentage."),
          text("The annual rate fell because the new 0.35% replaced an older 0.45% in the twelve-month sum.", "Le taux annuel baisse car le nouveau 0,35 % remplace un ancien 0,45 % dans la fenêtre annuelle."),
          text("Neither statistic is wrong; they describe different horizons.", "Aucune statistique n'est erronée ; elles décrivent des horizons différents."),
        ],
        conclusion: text("Call the report mixed until composition and policy-market transmission clarify which horizon matters.", "Qualifier la publication de contrastée jusqu'à ce que composition et transmission monétaire précisent l'horizon dominant."),
      }],
    },
    {
      id: "pce",
      title: text("PCE versus CPI", "PCE contre CPI"),
      summary: text("PCE uses broader expenditures and chain weighting; the Fed's 2% goal is defined on headline PCE.", "Le PCE couvre des dépenses plus larges et utilise une pondération chaînée ; l'objectif de 2 % de la Fed porte sur le PCE global."),
      paragraphs: [
        text("The Bureau of Economic Analysis builds the PCE price index from business and administrative expenditure data across a broader consumption universe, including some spending made on households' behalf. Chain weighting better captures substitution as spending patterns change. CPI relies more directly on a household out-of-pocket basket and uses different weights and formulas.", "Le Bureau of Economic Analysis construit l'indice PCE à partir de données d'entreprises et administratives sur un univers de consommation plus large, incluant certaines dépenses réalisées pour le compte des ménages. La pondération chaînée saisit mieux les substitutions. Le CPI repose davantage sur un panier payé directement par les ménages, avec d'autres pondérations et formules."),
        text("Core PCE is closely watched for underlying policy-relevant inflation, but the Fed's long-run 2% objective is stated for headline PCE. CPI arrives earlier and influences expectations for PCE; they are complementary measures, not interchangeable labels.", "Le Core PCE est très suivi pour l'inflation sous-jacente pertinente pour la politique, mais l'objectif de long terme de 2 % de la Fed est formulé sur le PCE global. Le CPI paraît plus tôt et influence les attentes de PCE ; ces mesures sont complémentaires, pas interchangeables."),
      ],
    },
    {
      id: "ppi",
      title: text("PPI and the production pipeline", "PPI et chaîne de production"),
      summary: text("PPI measures producer selling prices; selected components help inform PCE estimates but pass-through is neither one-for-one nor guaranteed.", "Le PPI mesure les prix de vente des producteurs ; certaines composantes éclairent les estimations PCE, sans transmission automatique ni intégrale."),
      paragraphs: [
        text("PPI Final Demand tracks prices received by domestic producers for goods, services, and construction sold into final demand. Its basket and perspective differ from consumer indexes. Producer-cost pressure may be absorbed in margins, offset by productivity, or passed to consumers with a lag.", "Le PPI Final Demand suit les prix reçus par les producteurs domestiques pour les biens, services et constructions destinés à la demande finale. Son panier et son point de vue diffèrent des indices consommateurs. Une pression sur les coûts peut être absorbée par les marges, compensée par la productivité ou transmise aux consommateurs avec retard."),
        text("Some PPI categories feed the accounting used to estimate PCE components. That makes component detail useful, while the PPI headline alone is not a mechanical preview of CPI or PCE.", "Certaines catégories du PPI alimentent la comptabilité servant à estimer des composantes du PCE. Le détail est donc utile, tandis que le titre PPI ne prédit mécaniquement ni CPI ni PCE."),
      ],
    },
    {
      id: "trend-inflation",
      title: text("Trend inflation and annualization", "Inflation tendancielle et annualisation"),
      summary: text("Short annualized windows reveal recent momentum but magnify noise.", "Les fenêtres courtes annualisées révèlent la dynamique récente mais amplifient le bruit."),
      paragraphs: [
        text("A three-month annualized rate compounds the index change over three months to a twelve-month equivalent: [(latest index ÷ index three months earlier)^4 − 1] × 100. It is not the last three monthly percentages added and multiplied by four, although that shortcut can approximate small changes.", "Un taux annualisé sur trois mois compose la variation de l'indice sur trois mois vers un équivalent annuel : [(indice récent ÷ indice trois mois plus tôt)^4 − 1] × 100. Il ne s'agit pas d'additionner trois variations mensuelles puis de multiplier par quatre, même si cette approximation peut fonctionner pour de petits chiffres."),
        text("Compare multiple windows and components. One volatile month can dominate a three-month annualized rate, while YoY may be stale to a turning point. Trend measures are derived lenses, not new observations.", "Comparer plusieurs fenêtres et composantes. Un mois volatil peut dominer le taux annualisé sur trois mois, tandis que le YoY peut réagir tard à un retournement. Les tendances sont des lectures dérivées, pas de nouvelles observations."),
      ],
    },
    {
      id: "inflation-gold-transmission",
      title: text("Two channels from inflation to Gold", "Deux canaux entre inflation et or"),
      summary: text("Inflation can strengthen Gold's store-of-value narrative or provoke a policy response that raises real yields and the dollar.", "L'inflation peut renforcer le récit de réserve de valeur de l'or ou provoquer une réponse monétaire relevant taux réels et dollar."),
      paragraphs: [
        text("The purchasing-power channel can increase demand for scarce stores of value when confidence in money or policy erodes. The policy-reaction channel can work the other way: a hot surprise raises expected policy rates, nominal and real yields, and sometimes USD, increasing the opportunity cost and non-USD price of Gold.", "Le canal du pouvoir d'achat peut accroître la demande de réserves de valeur rares lorsque la confiance dans la monnaie ou la politique s'érode. Le canal de réaction monétaire peut agir à l'inverse : une surprise forte relève les taux directeurs anticipés, les taux nominaux et réels, parfois l'USD, augmentant le coût d'opportunité et le prix de l'or pour les acheteurs hors dollar."),
        text("Regime decides which channel dominates. With credible tightening capacity, hot inflation may initially be adverse through F3, F2, and F6. With falling policy credibility, negative real rates, fiscal dominance concerns, or supply-driven inflation that tightening cannot easily cure, Gold may rise alongside inflation expectations. This is why every F4 relationship remains contextual in the terminal.", "Le régime détermine le canal dominant. Avec une capacité de resserrement crédible, une inflation forte peut d'abord être défavorable via F3, F2 et F6. En cas de crédibilité déclinante, de taux réels négatifs, de craintes de dominance budgétaire ou d'inflation d'offre difficile à combattre, l'or peut monter avec les anticipations d'inflation. C'est pourquoi toutes les relations F4 restent contextuelles dans le terminal."),
      ],
    },
    {
      id: "inflation-terminal-use",
      title: text("Terminal workflow, mistakes, and cross-family checks", "Utilisation du terminal, erreurs et contrôles inter-familles"),
      summary: text("F4 defines the inflation evidence; F3, F2, and F6 reveal how markets transmit it.", "F4 définit les preuves d'inflation ; F3, F2 et F6 montrent leur transmission par les marchés."),
      paragraphs: [
        text("The cockpit is a starting map, not a verdict. Keep the release timestamp and measurement horizon attached to each observation, then use the detailed view to separate the print from the market's subsequent interpretation.", "Le cockpit est une carte de départ, pas un verdict. Conserver l'horodatage de publication et l'horizon de mesure avec chaque observation, puis utiliser la vue détaillée pour séparer le chiffre de son interprétation ultérieure par le marché."),
      ],
      bullets: [
        text("Read Core CPI and Core PCE MoM for current pulse, YoY for longer context, then open deep metrics for headline, trend, and PPI composition.", "Lire Core CPI et Core PCE MoM pour l'impulsion, YoY pour le contexte, puis ouvrir les indicateurs détaillés pour global, tendance et PPI."),
        text("Do not call lower inflation deflation; do not compare MoM directly with YoY; do not ignore consensus or revisions.", "Ne pas confondre inflation plus faible et déflation ; ne pas comparer directement MoM et YoY ; ne pas ignorer consensus ou révisions."),
        text("Do not infer Gold direction from F4 alone. Check F3 repricing, F2 real yields and breakevens, F6 USD, and F13 event timing.", "Ne pas déduire la direction de l'or depuis F4 seul. Contrôler le repricing F3, taux réels et breakevens F2, USD F6 et calendrier F13."),
        text("Avoid double-counting CPI, Fed pricing, real yields, and USD as independent evidence if they are one causal chain.", "Éviter de compter CPI, pricing Fed, taux réels et USD comme preuves indépendantes s'ils appartiennent à une même chaîne causale."),
      ],
    },
  ],
  relatedTopics: ["F2", "F3", "F5", "F6"],
  glossary: [
    { id: "f4-cpi", term: "CPI", definition: text("A BLS consumer price index based primarily on household out-of-pocket consumption weights.", "Indice BLS des prix à la consommation fondé principalement sur les dépenses directes des ménages.") },
    { id: "f4-core", term: "Core inflation / Inflation sous-jacente", definition: text("An inflation measure excluding food and energy; less volatile, but not guaranteed to be persistent.", "Mesure excluant alimentation et énergie ; moins volatile, sans être forcément persistante.") },
    { id: "f4-pce", term: "PCE price index", definition: text("A broad, chain-weighted BEA consumer-expenditure price index used for the Fed's inflation objective.", "Indice BEA large et pondéré en chaîne des dépenses de consommation, utilisé pour l'objectif d'inflation de la Fed.") },
    { id: "f4-base-effect", term: "Base effect / Effet de base", definition: text("A YoY change caused by the comparison month entering or leaving the annual window.", "Variation YoY due au mois de comparaison qui entre ou sort de la fenêtre annuelle.") },
    { id: "f4-annualized", term: "Annualized / Annualisé", definition: text("A shorter-period compounded rate expressed as if that pace persisted for a year.", "Taux composé sur une période courte, exprimé comme si ce rythme persistait un an.") },
  ],
  takeaways: [
    text("Inflation is a rate of change; disinflation is not deflation.", "L'inflation est un taux de variation ; la désinflation n'est pas la déflation."),
    text("CPI and PCE differ by scope, weights, formulas, and data sources.", "CPI et PCE diffèrent par périmètre, pondérations, formules et sources."),
    text("Composition and surprise often matter more than a headline direction.", "Composition et surprise comptent souvent davantage que le sens du titre."),
    text("Inflation has competing Gold channels, so validate the actual response in Fed pricing, real yields, and USD.", "L'inflation emprunte des canaux concurrents vers l'or ; valider la réponse dans le pricing Fed, les taux réels et l'USD."),
  ],
};

const F5_EMPLOYMENT_GROWTH: KnowledgeChapter = {
  id: "knowledge-f5-employment-growth",
  familyId: "F5",
  title: text("Employment and growth: the economy behind the reaction function", "Emploi et croissance : l'économie derrière la fonction de réaction"),
  description: text("Learn how labor surveys, payrolls, claims, wages, ISM diffusion indexes, and GDPNow describe different slices of activity and reach Gold mainly through policy expectations.", "Comprendre comment enquêtes emploi, payrolls, inscriptions, salaires, indices ISM et GDPNow décrivent différentes facettes de l'activité et atteignent surtout l'or via les anticipations monétaires."),
  learningObjectives: [
    text("Separate labor-market levels, flows, surveys, revisions, and model estimates.", "Séparer niveaux, flux, enquêtes, révisions et estimations modélisées du marché du travail."),
    text("Interpret payrolls, unemployment, claims, and wages as a system rather than isolated headlines.", "Interpréter payrolls, chômage, inscriptions et salaires comme un système plutôt que des titres isolés."),
    text("Use ISM and GDPNow without mistaking diffusion or nowcasting for measured GDP.", "Utiliser ISM et GDPNow sans confondre diffusion ou nowcast avec PIB mesuré."),
    text("Trace regime-dependent transmission through F3 policy pricing, F2 real yields, and F6 USD.", "Suivre la transmission dépendante du régime via le pricing F3, les taux réels F2 et l'USD F6."),
  ],
  sections: [
    {
      id: "labor-market",
      title: text("Labor-market map: stocks, flows, and two surveys", "Carte du marché du travail : stocks, flux et deux enquêtes"),
      summary: text("No single release measures employment completely; each uses a different population and clock.", "Aucune publication ne mesure totalement l'emploi ; chacune utilise une population et une horloge différentes."),
      paragraphs: [
        text("The monthly employment report combines the establishment survey of employers with the household survey of people. Payroll jobs and average hourly earnings come primarily from establishments; unemployment and labor-force participation come from households. Definitions and sampling differ, so the surveys can diverge without either being fraudulent or useless.", "Le rapport mensuel combine l'enquête établissements auprès des employeurs et l'enquête ménages auprès des personnes. Les payrolls et gains horaires viennent surtout des établissements ; chômage et participation viennent des ménages. Définitions et échantillons diffèrent, donc les enquêtes peuvent diverger sans que l'une soit fausse ou inutile."),
        text("A stock measures a level at a point in time, such as the number unemployed. A flow measures change over an interval, such as jobs added. Initial claims are a high-frequency flow into unemployment insurance; payroll growth is a monthly net change; the unemployment rate is a ratio of stocks.", "Un stock mesure un niveau à un instant, comme le nombre de chômeurs. Un flux mesure une variation sur une période, comme les emplois ajoutés. Les initial claims sont un flux hebdomadaire vers l'assurance chômage ; la croissance des payrolls est une variation nette mensuelle ; le taux de chômage est un ratio de stocks."),
      ],
    },
    {
      id: "unemployment",
      title: text("Unemployment rate and participation", "Taux de chômage et participation"),
      summary: text("The unemployment rate is unemployed divided by labor force, so both numerator and denominator matter.", "Le taux de chômage est le nombre de chômeurs divisé par la population active ; numérateur et dénominateur comptent."),
      paragraphs: [
        text("To be unemployed under the standard definition, a person must not be employed, be available for work, and generally have actively searched recently. The labor force equals employed plus unemployed; people outside it are not counted in the denominator. The participation rate is labor force divided by the civilian noninstitutional population.", "Pour être chômeur selon la définition standard, il faut ne pas avoir d'emploi, être disponible et généralement avoir cherché activement récemment. La population active égale personnes employées plus chômeurs ; les personnes hors population active ne sont pas au dénominateur. Le taux de participation rapporte la population active à la population civile non institutionnelle."),
        text("Unemployment can rise for weak reasons—job loss—or for healthier reasons—more people entering the labor force before finding work. It can fall because hiring is strong or because people stop searching. Read employment, participation, and underemployment context before assigning a macro story.", "Le chômage peut augmenter pour une raison négative — pertes d'emplois — ou plus saine — entrées dans la population active avant embauche. Il peut baisser grâce aux recrutements ou parce que des personnes cessent de chercher. Lire emploi, participation et sous-emploi avant d'imposer une histoire macro."),
      ],
      examples: [{
        id: "f5-unemployment-example",
        title: text("Example: unemployment rises with employment", "Exemple : chômage et emploi augmentent ensemble"),
        setup: text("Employment rises by 100k, unemployment rises by 150k, and the labor force rises by 250k.", "L'emploi augmente de 100k, le chômage de 150k et la population active de 250k."),
        steps: [
          text("All new labor-force entrants are not immediately employed.", "Tous les nouveaux entrants ne trouvent pas immédiatement un emploi."),
          text("The unemployment numerator rises even though employment also rises.", "Le numérateur du chômage monte malgré la hausse de l'emploi."),
          text("Participation improves, making the report more nuanced than 'higher unemployment equals pure weakness.'", "La participation progresse, rendant le rapport plus nuancé que « chômage en hausse égale faiblesse pure »."),
        ],
        conclusion: text("A ratio needs its denominator and flow context.", "Un ratio exige le contexte de son dénominateur et de ses flux."),
      }],
    },
    {
      id: "payrolls",
      title: text("Payrolls, revisions, and the three-month average", "Payrolls, révisions et moyenne sur trois mois"),
      summary: text("Payrolls estimate net jobs on employer payrolls; the latest print is noisy and revisable.", "Les payrolls estiment les emplois nets sur les fiches de paie ; le dernier chiffre est bruité et révisable."),
      paragraphs: [
        text("Nonfarm payrolls count jobs, not unique people, so a person with two jobs may appear twice. They exclude farm workers and several other categories by design. The monthly change is an estimate from a sample later benchmarked to more complete records.", "Les nonfarm payrolls comptent des emplois, pas des personnes uniques ; une personne ayant deux emplois peut donc apparaître deux fois. Les travailleurs agricoles et certaines catégories sont exclus par construction. La variation mensuelle est une estimation échantillonnée, ensuite étalonnée sur des données plus complètes."),
        text("The first estimate is revised as responses arrive and seasonal factors update. The two-month net revision sums changes to the two prior estimates. A three-month average reduces one-month noise but turns more slowly. A headline beat with large negative revisions may describe less strength than the first number suggests.", "La première estimation est révisée avec les réponses tardives et l'actualisation saisonnière. La révision nette sur deux mois additionne les changements des deux estimations précédentes. Une moyenne sur trois mois réduit le bruit mais tourne plus lentement. Un titre supérieur au consensus accompagné de fortes révisions négatives peut signaler moins de vigueur qu'il n'y paraît."),
      ],
      examples: [{
        id: "f5-payroll-revision-example",
        title: text("Example: headline beat, weaker history", "Exemple : titre supérieur, historique plus faible"),
        setup: text("Payrolls print +190k versus +170k consensus; the prior two months are revised by −35k and −25k.", "Les payrolls ressortent à +190k contre +170k attendu ; les deux mois précédents sont révisés de −35k et −25k."),
        steps: [
          text("Headline surprise is +20k.", "La surprise du titre est de +20k."),
          text("Two-month net revision is −60k.", "La révision nette sur deux mois est de −60k."),
          text("Across the three published changes, the new information is not simply +20k stronger.", "Sur l'ensemble des trois variations publiées, l'information nouvelle n'est pas simplement supérieure de +20k."),
        ],
        conclusion: text("Treat the report as mixed and inspect the trend rather than trading the first headline mechanically.", "Traiter le rapport comme contrasté et examiner la tendance plutôt que de réagir mécaniquement au premier titre."),
      }],
    },
    {
      id: "claims",
      title: text("Jobless claims as a high-frequency signal", "Inscriptions au chômage comme signal haute fréquence"),
      summary: text("Claims arrive weekly and can flag turning points, but eligibility, seasonality, and disruptions create noise.", "Les inscriptions paraissent chaque semaine et peuvent signaler des retournements, mais éligibilité, saisonnalité et perturbations créent du bruit."),
      paragraphs: [
        text("Initial claims count new unemployment-insurance claims; continuing claims track people receiving benefits after an initial claim. They are not the total unemployed population. State rules, processing, strikes, holidays, weather, and fraud controls can distort individual weeks.", "Les initial claims comptent les nouvelles demandes d'assurance chômage ; les continuing claims suivent les bénéficiaires après une demande initiale. Elles ne représentent pas tous les chômeurs. Règles des États, traitement, grèves, jours fériés, météo et contrôles antifraude peuvent déformer une semaine."),
        text("The terminal uses a four-week average to reduce weekly noise. A persistent inflection corroborated by continuing claims and payroll breadth is more informative than one spike.", "Le terminal utilise une moyenne sur quatre semaines pour réduire le bruit hebdomadaire. Une inflexion persistante confirmée par les continuing claims et l'étendue des payrolls est plus informative qu'un pic isolé."),
      ],
    },
    {
      id: "wages",
      title: text("Average hourly earnings", "Gains horaires moyens"),
      summary: text("Wage growth informs labor demand and service inflation, but averages can shift with workforce composition.", "La croissance salariale informe sur la demande de travail et l'inflation des services, mais les moyennes varient avec la composition de l'emploi."),
      paragraphs: [
        text("Average hourly earnings measure average pay per hour for covered private nonfarm payroll workers. MoM captures the latest pace; YoY gives longer context. Nominal wage growth is not real purchasing-power growth unless adjusted for consumer inflation.", "Les gains horaires moyens mesurent la rémunération horaire moyenne des salariés privés non agricoles couverts. Le MoM saisit le rythme récent ; le YoY fournit le contexte. La croissance nominale des salaires n'est pas celle du pouvoir d'achat réel sans ajustement de l'inflation."),
        text("Composition can mislead: if many lower-paid workers lose jobs, the average wage can rise without anyone receiving a raise. Hours, industry mix, revisions, and broader compensation measures help validate the signal.", "La composition peut tromper : si de nombreux salariés moins payés perdent leur emploi, le salaire moyen peut monter sans hausse individuelle. Durée du travail, mix sectoriel, révisions et mesures plus larges de rémunération aident à valider le signal."),
      ],
    },
    {
      id: "growth",
      title: text("Growth: output, demand, and policy relevance", "Croissance : production, demande et pertinence monétaire"),
      summary: text("Growth data indicate economic momentum, but different indicators cover different sectors and are published on different schedules.", "Les données de croissance indiquent la dynamique économique, mais couvrent des secteurs différents et paraissent selon des calendriers distincts."),
      paragraphs: [
        text("Real GDP measures inflation-adjusted value added across the economy. Employment, production, income, spending, and surveys provide partial earlier signals. Strong growth can keep inflation pressure and policy rates higher; weak growth can bring easing closer, but an acute contraction can also trigger liquidity stress and dollar demand.", "Le PIB réel mesure la valeur ajoutée corrigée de l'inflation. Emploi, production, revenus, dépenses et enquêtes fournissent des signaux partiels plus précoces. Une croissance forte peut maintenir pression inflationniste et taux élevés ; une croissance faible peut rapprocher l'assouplissement, mais une contraction aiguë peut aussi déclencher stress de liquidité et demande de dollars."),
      ],
    },
    {
      id: "ism",
      title: text("ISM diffusion indexes", "Indices de diffusion ISM"),
      summary: text("ISM measures the breadth and direction of reported change, not the percentage growth rate of output.", "L'ISM mesure l'étendue et le sens des changements déclarés, pas le taux de croissance de la production."),
      paragraphs: [
        text("Purchasing managers report whether conditions such as new orders, production, employment, and prices are better, the same, or worse. A diffusion index combines the share reporting improvement with half the unchanged share. Fifty is the conventional dividing line between more reports of expansion and contraction for the covered sector.", "Les directeurs d'achat indiquent si commandes, production, emploi et prix sont meilleurs, stables ou moins bons. Un indice de diffusion combine la part en amélioration avec la moitié de la part inchangée. Cinquante sépare conventionnellement davantage de réponses d'expansion que de contraction dans le secteur couvert."),
        text("An index rising from 48 to 49 remains below 50 but shows less widespread contraction; falling from 55 to 52 still indicates expansion, but less breadth. Manufacturing and services describe different economic mixes and should not be averaged casually.", "Un indice passant de 48 à 49 reste sous 50 mais montre une contraction moins généralisée ; de 55 à 52, il indique encore une expansion, mais moins étendue. Industrie et services couvrent des structures différentes et ne doivent pas être moyennés sans méthode."),
      ],
    },
    {
      id: "gdp",
      title: text("GDPNow: a model estimate, not official GDP", "GDPNow : estimation modélisée, pas PIB officiel"),
      summary: text("GDPNow maps incoming releases into a current-quarter real-GDP estimate and changes as inputs arrive.", "GDPNow traduit les publications entrantes en estimation du PIB réel du trimestre courant et évolue avec les données."),
      paragraphs: [
        text("GDPNow is a nowcast built from a documented model and available source data. It is not a judgmental forecast, not an official BEA release, and not a promise. Its level can change sharply when trade, inventories, consumption, or other inputs update.", "GDPNow est un nowcast construit à partir d'un modèle documenté et des données disponibles. Ce n'est ni une prévision discrétionnaire, ni une publication officielle du BEA, ni une promesse. Son niveau peut changer fortement avec commerce, stocks, consommation ou autres entrées."),
        text("A 2.5% GDPNow reading is typically an annualized quarter-over-quarter growth estimate under US convention, not 2.5% growth within one quarter and not a YoY rate. The terminal marks it estimated to preserve that epistemic difference.", "Une lecture GDPNow de 2,5 % est généralement une estimation annualisée de croissance trimestrielle selon la convention américaine, pas 2,5 % sur le seul trimestre ni un taux YoY. Le terminal la marque comme estimée pour préserver cette différence épistémique."),
      ],
    },
    {
      id: "employment-gold-regimes",
      title: text("Gold transmission, regimes, and terminal workflow", "Transmission vers l'or, régimes et workflow terminal"),
      summary: text("F5 influences Gold indirectly and conditionally through the Fed, yields, USD, risk, and liquidity.", "F5 influence l'or indirectement et conditionnellement via Fed, taux, USD, risque et liquidité."),
      paragraphs: [
        text("A weaker-than-priced labor or growth report can increase cut pricing in F3, lower the 2Y and real yields in F2, and weaken USD in F6, conventionally supporting Gold. A stronger report can reverse that chain. But weak data during acute stress may strengthen USD or force liquidation; supply-constrained growth can coexist with inflation; and good growth need not hurt Gold if real yields fall for another reason.", "Un rapport emploi/croissance plus faible qu'intégré peut accroître le pricing de baisse F3, réduire 2 ans et taux réels F2, et affaiblir l'USD F6, ce qui soutient conventionnellement l'or. Un rapport plus fort peut inverser la chaîne. Mais des données faibles en stress aigu peuvent renforcer l'USD ou provoquer des liquidations ; une croissance contrainte par l'offre peut coexister avec l'inflation ; une bonne croissance ne pénalise pas forcément l'or si les taux réels baissent pour une autre raison."),
        text("In the terminal, start with Unemployment Rate, latest Payrolls, and GDPNow. Open event metrics for wages and revisions, then deep metrics for trend, claims, and ISM. Compare surprise with revisions and composition; verify F3/F2/F6 transmission; use F7 and F13 to identify stress and event timing. F5 remains contextual because no single direction has a fixed Gold meaning.", "Dans le terminal, commencer par taux de chômage, derniers Payrolls et GDPNow. Ouvrir les métriques événementielles pour salaires et révisions, puis les métriques détaillées pour tendance, claims et ISM. Comparer surprise, révisions et composition ; vérifier la transmission F3/F2/F6 ; utiliser F7 et F13 pour stress et calendrier. F5 reste contextuel car aucune direction n'a un sens fixe pour l'or."),
      ],
      bullets: [
        text("Mistake: treating payroll jobs as employed people or the two surveys as identical.", "Erreur : confondre emplois payroll et personnes employées, ou supposer les deux enquêtes identiques."),
        text("Mistake: reading a one-week claims spike, one payroll print, or one GDPNow update as a confirmed trend.", "Erreur : lire un pic hebdomadaire des claims, un payroll ou une mise à jour GDPNow comme tendance confirmée."),
        text("Mistake: calling ISM 49 a 1% contraction or GDPNow an official GDP forecast.", "Erreur : interpréter ISM 49 comme contraction de 1 % ou GDPNow comme prévision officielle du PIB."),
      ],
    },
  ],
  relatedTopics: ["F2", "F3", "F4", "F6"],
  glossary: [
    { id: "f5-labor-force", term: "Labor force / Population active", definition: text("People employed plus people unemployed under the active-search definition.", "Personnes employées plus chômeurs selon la définition de recherche active.") },
    { id: "f5-payrolls", term: "Nonfarm payrolls", definition: text("An establishment-survey estimate of jobs on US nonfarm employer payrolls.", "Estimation par enquête établissements des emplois salariés non agricoles américains.") },
    { id: "f5-revision", term: "Revision / Révision", definition: text("A change to a previously published estimate as additional data or seasonal factors become available.", "Modification d'une estimation publiée lorsque de nouvelles données ou facteurs saisonniers deviennent disponibles.") },
    { id: "f5-diffusion", term: "Diffusion index / Indice de diffusion", definition: text("An index summarizing the breadth of respondents reporting improvement, no change, or deterioration.", "Indice résumant la part des répondants signalant amélioration, stabilité ou détérioration.") },
    { id: "f5-nowcast", term: "Nowcast", definition: text("A model estimate of the current or very near-term period using data already arriving.", "Estimation modélisée de la période actuelle ou très proche à partir des données déjà disponibles.") },
  ],
  takeaways: [
    text("Employment data combine different surveys, populations, stocks, and flows.", "Les données d'emploi combinent enquêtes, populations, stocks et flux différents."),
    text("Revisions and trend can overturn the message of the payroll headline.", "Révisions et tendance peuvent renverser le message du titre payroll."),
    text("ISM measures breadth; GDPNow is a changing model estimate, not observed GDP.", "L'ISM mesure l'étendue ; GDPNow est une estimation modélisée évolutive, pas un PIB observé."),
    text("Validate the indirect Gold chain through Fed pricing, real yields, and USD, especially across stress regimes.", "Valider la chaîne indirecte vers l'or via pricing Fed, taux réels et USD, surtout en régime de stress."),
  ],
};

const F6_USD_FX: KnowledgeChapter = {
  id: "knowledge-f6-usd-fx",
  familyId: "F6",
  title: text("USD and FX: quotation, index construction, and Gold transmission", "USD et change : cotation, construction d'indice et transmission vers l'or"),
  description: text("Learn how exchange-rate quotations and DXY work, what drives dollar momentum, and why USD is a powerful but non-exclusive mechanical channel to dollar-priced Gold.", "Comprendre les cotations de change et le DXY, les moteurs de la dynamique du dollar et pourquoi l'USD est un canal mécanique puissant mais non exclusif vers l'or coté en dollars."),
  learningObjectives: [
    text("Read base and quote currencies without reversing the economic meaning.", "Lire devise de base et devise de cotation sans inverser le sens économique."),
    text("Understand what DXY measures, how a weighted geometric index is reconstructed, and what its coverage omits.", "Comprendre ce que mesure le DXY, comment reconstruire un indice géométrique pondéré et ce que sa couverture omet."),
    text("Separate level, daily momentum, five-day momentum, and cross-sectional breadth.", "Séparer niveau, dynamique quotidienne, dynamique cinq jours et étendue entre devises."),
    text("Test the conventional inverse USD-Gold channel while recognizing joint-rally and decoupling regimes.", "Tester le canal inverse conventionnel USD-or tout en reconnaissant les régimes de hausse conjointe et de décorrélation."),
  ],
  sections: [
    {
      id: "fx-fundamentals",
      title: text("FX fundamentals: every price is a ratio", "Fondamentaux FX : chaque prix est un ratio"),
      summary: text("An exchange rate values one currency in units of another, so strength is always relative.", "Un taux de change valorise une devise dans une autre ; la force est donc toujours relative."),
      paragraphs: [
        text("In EURUSD, EUR is the base currency and USD the quote currency. EURUSD 1.10 means one euro costs 1.10 dollars. A rise means EUR strengthens against USD; a fall means USD strengthens against EUR. In USDJPY, USD is the base, so a rise means USD strengthens against JPY. Pair orientation must be checked before interpreting direction.", "Dans EURUSD, EUR est la devise de base et USD la devise de cotation. EURUSD 1,10 signifie qu'un euro coûte 1,10 dollar. Une hausse indique un euro plus fort face au dollar ; une baisse, un dollar plus fort. Dans USDJPY, l'USD est la base : une hausse indique un dollar plus fort face au yen. Vérifier l'orientation avant toute interprétation."),
        text("Currencies are traded and used by banks, asset managers, corporations, governments, central banks, importers, exporters, and hedgers. Flows reflect rate differentials, expected policy, trade and capital flows, funding needs, risk appetite, reserve management, and positioning—not a single national scorecard.", "Devises sont traitées et utilisées par banques, gérants, entreprises, gouvernements, banques centrales, importateurs, exportateurs et hedgers. Les flux reflètent différentiels de taux, politique anticipée, commerce, capitaux, financement, appétit pour le risque, réserves et positionnement — pas une note unique du pays."),
      ],
    },
    {
      id: "dxy",
      title: text("DXY: basket, weights, and reconstruction", "DXY : panier, pondérations et reconstruction"),
      summary: text("DXY is a fixed six-currency geometric basket with heavy euro weight; it is not every form of dollar strength.", "Le DXY est un panier géométrique fixe de six devises, fortement pondéré en euro ; il ne représente pas toutes les formes de force du dollar."),
      paragraphs: [
        text("The ICE US Dollar Index compares USD with EUR, JPY, GBP, CAD, SEK, and CHF using fixed weights and a geometric formula. The euro has the largest weight. Pair terms are oriented so a higher index consistently means a stronger USD. A geometric index multiplies powered exchange rates rather than taking a simple arithmetic average.", "L'ICE US Dollar Index compare l'USD à EUR, JPY, GBP, CAD, SEK et CHF avec pondérations fixes et formule géométrique. L'euro porte le poids principal. Les termes sont orientés pour qu'un indice plus haut signifie toujours un USD plus fort. Un indice géométrique multiplie des taux élevés à leurs pondérations plutôt que d'en faire une moyenne arithmétique simple."),
        text("The terminal's current DXY value is a direct reading from Yahoo Finance's public chart endpoint (unofficial, undocumented, no key required) — it is not the official licensed ICE feed, but it is a direct observation of that feed's own published level, not a reconstruction from underlying FX legs. That provenance distinction affects source authority, not the financial meaning of Today % or 5D %, which are deterministic changes computed from the same source's own history.", "La valeur DXY actuelle du terminal est une lecture directe issue du point de terminaison graphique public de Yahoo Finance (non officiel, non documenté, sans clé requise) — ce n'est pas le flux officiel sous licence ICE, mais c'est une observation directe du niveau publié par ce flux, pas une reconstitution à partir des paires de change sous-jacentes. Cette distinction de provenance concerne l'autorité de la source, pas le sens financier de Today % ou 5D %, variations déterministes calculées à partir de l'historique de cette même source."),
        text("DXY excludes currencies such as CNY and many emerging-market units and retains historical fixed weights. A broad trade-weighted dollar index can tell a different story. DXY is a useful liquid benchmark, not a complete map of global dollar conditions.", "Le DXY exclut des devises comme le CNY et de nombreuses monnaies émergentes, tout en conservant des pondérations historiques fixes. Un indice large pondéré par le commerce peut raconter une autre histoire. Le DXY est une référence liquide utile, pas une carte complète des conditions mondiales en dollar."),
      ],
      examples: [{
        id: "f6-dxy-euro-example",
        title: text("Example: one large leg can dominate", "Exemple : une grande jambe peut dominer"),
        setup: text("Assume USD strengthens materially against EUR but weakens modestly against CAD and JPY.", "Supposons que l'USD se renforce nettement face à l'EUR mais baisse légèrement face au CAD et au JPY."),
        steps: [
          text("EUR has the largest DXY weight, so EURUSD falling pushes DXY higher strongly.", "L'EUR a le plus grand poids ; une baisse d'EURUSD pousse fortement le DXY à la hausse."),
          text("Smaller opposing moves in CAD and JPY may not offset that contribution.", "Des mouvements opposés plus modestes en CAD et JPY peuvent ne pas compenser cette contribution."),
          text("The index can rise even though USD did not strengthen against every constituent.", "L'indice peut monter sans que l'USD se renforce contre chaque composante."),
        ],
        conclusion: text("DXY direction describes the weighted basket, not unanimous dollar breadth.", "Le sens du DXY décrit le panier pondéré, pas une force unanime du dollar."),
      }],
    },
    {
      id: "usd-momentum",
      title: text("Level, Today %, 5D %, and momentum", "Niveau, Today %, 5D % et dynamique"),
      summary: text("Level locates the index; signed returns describe changes over explicit reference windows.", "Le niveau situe l'indice ; les rendements signés décrivent ses variations sur des fenêtres explicites."),
      paragraphs: [
        text("DXY 104.00 is a level, not intrinsically strong or weak without history and regime. Today % compares with the designated daily reference; 5D % compares with five sessions earlier. A negative daily move within a positive five-day change is a pullback inside recent strength, not a data contradiction.", "DXY 104,00 est un niveau, ni intrinsèquement fort ni faible sans historique et régime. Today % compare à la référence quotidienne désignée ; 5D % à cinq séances auparavant. Un jour négatif dans une variation positive sur cinq jours est un repli au sein d'une force récente, pas une contradiction de données."),
        text("Momentum can arise from repricing of rate differentials, safety demand, funding stress, growth divergence, or positioning. The same +1% move has different implications depending on whether US real yields rose, global risk deteriorated, or a crowded position unwound.", "La dynamique peut venir du repricing des différentiels de taux, de la recherche de sécurité, du stress de financement, des écarts de croissance ou du positionnement. Une même hausse de 1 % n'a pas le même sens selon que les taux réels US montent, que le risque mondial se dégrade ou qu'une position encombrée se déboucle."),
      ],
      examples: [{
        id: "f6-horizon-example",
        title: text("Example: divergent clocks", "Exemple : horloges divergentes"),
        setup: text("DXY is 104.62, down 0.18% today but up 0.42% over five sessions.", "Le DXY vaut 104,62, baisse de 0,18 % aujourd'hui mais gagne 0,42 % sur cinq séances."),
        steps: [
          text("Intraday USD softness is mechanically less burdensome for dollar-priced Gold, all else equal.", "La faiblesse intrajournalière de l'USD est mécaniquement moins pesante pour l'or coté en dollars, toutes choses égales."),
          text("The five-day window still records net USD strength, mechanically more burdensome over that horizon.", "La fenêtre cinq jours conserve une force nette de l'USD, mécaniquement plus pesante sur cet horizon."),
          text("The correct state is divergent, not a forced single-direction verdict.", "L'état correct est divergent, pas un verdict univoque forcé."),
        ],
        conclusion: text("Always attach the Gold relationship to the same horizon as the USD change.", "Toujours relier la relation à l'or au même horizon que la variation de l'USD."),
      }],
    },
    {
      id: "usd-drivers",
      title: text("What moves the dollar mechanically", "Ce qui déplace mécaniquement le dollar"),
      summary: text("Expected relative returns, hedging costs, funding demand, and flows connect macro information to FX prices.", "Rendements relatifs anticipés, coûts de couverture, demande de financement et flux relient macro et prix FX."),
      paragraphs: [
        text("Relative—not absolute—policy matters. If expected US short rates rise relative to euro-area or Japanese rates, USD assets may become more attractive after accounting for hedging and risk. F3 Fed repricing and F2 nominal/real yields therefore matter, but identical US moves can produce different FX reactions when foreign expectations also change.", "La politique relative — pas absolue — compte. Si les taux courts US anticipés montent face à ceux de la zone euro ou du Japon, les actifs USD peuvent devenir plus attractifs après couverture et risque. Le repricing Fed F3 et les taux F2 comptent donc, mais un même mouvement US peut produire une autre réaction si les attentes étrangères changent aussi."),
        text("USD is also a funding and reserve currency. During stress, borrowers may seek dollars to meet liabilities and investors may prefer liquid US assets. Trade receipts, corporate hedging, reserve operations, month-end rebalancing, and crowded positioning can dominate rate stories temporarily.", "L'USD est aussi devise de financement et de réserve. En période de stress, les emprunteurs peuvent chercher des dollars pour leurs engagements et les investisseurs préférer les actifs US liquides. Recettes commerciales, couverture d'entreprise, réserves, rééquilibrages de fin de mois et positions encombrées peuvent temporairement dominer les taux."),
      ],
    },
    {
      id: "usd-gold-regimes",
      title: text("USD-to-Gold transmission and failure regimes", "Transmission USD-or et régimes d'échec"),
      summary: text("A stronger USD usually raises Gold's effective price for non-USD buyers, but both assets can respond to a third force.", "Un USD plus fort renchérit généralement l'or pour les acheteurs hors dollar, mais les deux actifs peuvent répondre à une troisième force."),
      paragraphs: [
        text("Because XAUUSD is quoted in dollars, USD appreciation tends to reduce the dollar Gold price required to preserve a roughly unchanged foreign-currency price, and it can constrain non-USD demand. USD depreciation tends to ease that constraint. This is a direct mechanical channel, but it is ceteris paribus—not a complete price equation.", "Parce que XAUUSD est coté en dollars, l'appréciation de l'USD tend à réduire le prix dollar de l'or nécessaire pour préserver un prix approximativement stable en devise étrangère, et peut limiter la demande hors dollar. La dépréciation tend à alléger cette contrainte. Ce canal est mécanique mais toutes choses égales — pas une équation complète du prix."),
        text("Gold and USD can rise together during geopolitical fear, confidence shocks, or demand for liquid defensive assets. Gold can resist USD strength when real yields fall, central-bank or physical demand is strong, or supply/positioning dominates. During forced liquidation, both the conventional hedge story and inverse correlation can fail. Correlation is an observed regime statistic, not causation or permanence.", "Or et USD peuvent monter ensemble lors de peur géopolitique, choc de confiance ou demande d'actifs défensifs liquides. L'or peut résister à un USD fort si les taux réels baissent, si la demande officielle ou physique est forte, ou si offre et positionnement dominent. En liquidation forcée, récit de couverture et corrélation inverse peuvent échouer. La corrélation est une statistique de régime observée, ni causalité ni permanence."),
      ],
      examples: [{
        id: "f6-gold-currency-example",
        title: text("Example: USD Gold and euro Gold", "Exemple : or en USD et en euros"),
        setup: text("Gold is unchanged at $2,400 while EURUSD falls from 1.10 to 1.05.", "L'or reste à 2 400 $ tandis qu'EURUSD baisse de 1,10 à 1,05."),
        steps: [
          text("At 1.10 USD per EUR, Gold is about €2,182 per ounce.", "À 1,10 USD par EUR, l'or vaut environ 2 182 € l'once."),
          text("At 1.05 USD per EUR, the same $2,400 Gold price is about €2,286.", "À 1,05 USD par EUR, le même prix de 2 400 $ vaut environ 2 286 €."),
          text("Gold became roughly 4.8% more expensive in euros despite being flat in dollars.", "L'or devient environ 4,8 % plus cher en euros malgré sa stabilité en dollars."),
        ],
        conclusion: text("Currency translation can alter non-USD demand and explains why XAUUSD alone is not every buyer's Gold experience.", "La conversion de devise modifie la demande hors USD et explique pourquoi XAUUSD ne représente pas l'expérience de tous les acheteurs."),
      }],
    },
    {
      id: "usd-terminal-use",
      title: text("Terminal workflow, mistakes, and cross-family links", "Workflow terminal, erreurs et liens inter-familles"),
      summary: text("Read horizon-consistent USD momentum, verify the driver, then compare Gold's actual response.", "Lire la dynamique USD sur un horizon cohérent, vérifier son moteur, puis comparer la réponse réelle de l'or."),
      paragraphs: [
        text("The resting F6 face shows the direct DXY level, Today %, and 5D %. The deep USD State names divergence without creating a new observation. Use F2 to test rate and real-yield differentials, F3/F4/F5 to identify policy catalysts, F7/F8 for stress and funding, F10 for positioning, and F13 for event timing. Then compare with Gold's own move over the same window.", "La face F6 affiche le niveau direct du DXY, Today % et 5D %. L'USD State détaillé nomme la divergence sans créer une nouvelle observation. Utiliser F2 pour taux et différentiels réels, F3/F4/F5 pour catalyseurs monétaires, F7/F8 pour stress et financement, F10 pour positionnement, F13 pour calendrier. Puis comparer le mouvement de l'or lui-même sur la même fenêtre."),
      ],
      bullets: [
        text("Mistake: treating a high DXY level as a fresh adverse impulse without measuring change.", "Erreur : traiter un DXY élevé comme nouvelle impulsion défavorable sans mesurer la variation."),
        text("Mistake: reversing pair direction, assuming DXY covers every currency, or hiding that this reading is unofficial/undocumented rather than a licensed ICE feed.", "Erreur : inverser le sens d'une paire, supposer que DXY couvre toutes les devises ou masquer le fait que cette lecture est non officielle/non documentée plutôt qu'un flux ICE sous licence."),
        text("Mistake: assuming USD and Gold must always move inversely or counting USD, yields, and Fed repricing as unrelated confirmations.", "Erreur : supposer que l'USD et l'or doivent toujours évoluer en sens inverse ou compter USD, taux et repricing Fed comme confirmations indépendantes."),
        text("Never convert supportive/adverse mechanical labels into BUY/SELL conclusions.", "Ne jamais transformer les libellés mécaniques favorable/défavorable en conclusions ACHAT/VENTE."),
      ],
    },
  ],
  relatedTopics: ["F2", "F3", "F4", "F5"],
  glossary: [
    { id: "f6-base-currency", term: "Base currency / Devise de base", definition: text("The first currency in a pair; one unit is priced in the quote currency.", "Première devise d'une paire ; une unité est valorisée dans la devise de cotation.") },
    { id: "f6-dxy", term: "DXY", definition: text("The ICE US Dollar Index, a fixed geometric basket of six currencies against USD.", "L'ICE US Dollar Index, panier géométrique fixe de six devises face à l'USD.") },
    { id: "f6-rate-differential", term: "Rate differential / Différentiel de taux", definition: text("The interest-rate gap between two currencies or economies for a comparable horizon.", "Écart de taux entre deux devises ou économies sur un horizon comparable.") },
    { id: "f6-momentum", term: "Momentum / Dynamique", definition: text("The direction and magnitude of price change over an explicitly defined interval.", "Sens et amplitude d'une variation sur un intervalle explicitement défini.") },
    { id: "f6-ceteris-paribus", term: "Ceteris paribus", definition: text("A mechanical relationship stated while holding other relevant forces constant.", "Relation mécanique formulée en maintenant constantes les autres forces pertinentes.") },
  ],
  takeaways: [
    text("FX strength is relative, and pair orientation determines how a quote is read.", "La force d'une devise est relative et l'orientation de la paire détermine la lecture."),
    text("DXY is a weighted six-currency benchmark, not universal dollar breadth; the terminal's provenance (a direct, unofficial Yahoo Finance reading) is explicit.", "Le DXY est un benchmark pondéré de six devises, pas une étendue universelle du dollar ; la provenance du terminal (une lecture directe et non officielle via Yahoo Finance) est explicite."),
    text("Separate level from Today % and 5D % and keep the Gold interpretation on the same horizon.", "Séparer niveau, Today % et 5D %, et conserver le même horizon pour l'interprétation de l'or."),
    text("The inverse USD-Gold channel is mechanical but conditional; verify rates, stress, flows, and Gold's actual response.", "Le canal inverse USD-or est mécanique mais conditionnel ; vérifier taux, stress, flux et réponse réelle de l'or."),
  ],
};

export const KNOWLEDGE_CHAPTERS_F4_F6: readonly KnowledgeChapter[] = [
  F4_INFLATION,
  F5_EMPLOYMENT_GROWTH,
  F6_USD_FX,
];

export const KNOWLEDGE_CHAPTERS_F4_F6_BY_ID: Readonly<
  Record<KnowledgeFamilyIdF4F6, KnowledgeChapter>
> = {
  F4: F4_INFLATION,
  F5: F5_EMPLOYMENT_GROWTH,
  F6: F6_USD_FX,
};

// Compile-time guards keep the content aligned with the shared chapter shape.
const _sectionShape: KnowledgeSection | undefined = F4_INFLATION.sections[0];
const _exampleShape: KnowledgeExample | undefined = F4_INFLATION.sections[2]?.examples?.[0];
const _glossaryShape: KnowledgeGlossaryEntry | undefined = F4_INFLATION.glossary[0];
void _sectionShape;
void _exampleShape;
void _glossaryShape;
