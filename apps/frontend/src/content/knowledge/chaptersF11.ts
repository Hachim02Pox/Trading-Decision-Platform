/**
 * Deterministic bilingual Knowledge content for F11 — Gold Options / Volatility.
 *
 * Educational only. Examples are hypothetical. Public option-chain fields are
 * observations; dealer inventory, net gamma, and future direction are not
 * observable from open interest alone and are never presented here as facts.
 */

export type KnowledgeLanguage = "EN" | "FR";
export type KnowledgeFamilyId = "F11";

export interface LocalizedText { EN: string; FR: string }
export interface KnowledgeExample {
  id: string;
  title: LocalizedText;
  setup: LocalizedText;
  steps: LocalizedText[];
  conclusion: LocalizedText;
}
export interface KnowledgeSection {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  paragraphs: LocalizedText[];
  bullets?: LocalizedText[];
  examples?: KnowledgeExample[];
}
export interface KnowledgeGlossaryEntry {
  id: string;
  term: string;
  definition: LocalizedText;
}
export interface KnowledgeChapter {
  id: string;
  familyId: KnowledgeFamilyId;
  title: LocalizedText;
  description: LocalizedText;
  learningObjectives: LocalizedText[];
  sections: KnowledgeSection[];
  relatedTopics: string[];
  glossary: KnowledgeGlossaryEntry[];
  takeaways: LocalizedText[];
}

const text = (EN: string, FR: string): LocalizedText => ({ EN, FR });

const F11_GOLD_OPTIONS: KnowledgeChapter = {
  id: "gold-options-vol",
  familyId: "F11",
  title: text("Gold Options / Volatility", "Options sur l’or / Volatilité"),
  description: text(
    "A practical reference for Gold option contracts, volatility, Greeks, surface data, open interest, hedging mechanics, and the strict limits of what public data can reveal.",
    "Une référence pratique sur les contrats d’options sur l’or, la volatilité, les Greeks, les données de surface, l’open interest, les mécanismes de couverture et les limites strictes de ce que les données publiques permettent d’inférer.",
  ),
  learningObjectives: [
    text("Distinguish a call from a put and a buyer's right from a seller's obligation.", "Distinguer call et put, ainsi que le droit de l’acheteur de l’obligation du vendeur."),
    text("Separate intrinsic value, time value, moneyness, implied volatility, and realized volatility.", "Séparer valeur intrinsèque, valeur temps, moneyness, volatilité implicite et volatilité réalisée."),
    text("Read delta, gamma, theta, vega, and rho as local sensitivities rather than forecasts.", "Lire delta, gamma, theta, vega et rho comme des sensibilités locales, non comme des prévisions."),
    text("Interpret skew, term structure, volume, and open interest without inventing trader intent.", "Interpréter skew, structure par terme, volume et open interest sans inventer l’intention des intervenants."),
    text("Use GVZ and CME Gold CVOL with the correct underlying, horizon, methodology, and provenance caveats.", "Utiliser GVZ et CME Gold CVOL avec les bonnes réserves sur le sous-jacent, l’horizon, la méthodologie et la provenance."),
  ],
  sections: [
    {
      id: "options-basics",
      title: text("What an option is", "Ce qu’est une option"),
      summary: text("An option is a time-limited contract whose payoff depends on an underlying price and a strike.", "Une option est un contrat à durée limitée dont le payoff dépend d’un prix sous-jacent et d’un strike."),
      paragraphs: [
        text("A Gold option references a specified Gold instrument—commonly a futures contract or an exchange-traded product—not an abstract universal Gold price. Its contract specification defines the underlying, contract size, strike, expiration, exercise style, settlement, tick, and trading hours. Those details must be checked before comparing or valuing contracts.", "Une option sur l’or référence un instrument précis — souvent un future ou un produit coté — et non un prix universel abstrait de l’or. Les spécifications définissent sous-jacent, taille, strike, échéance, style d’exercice, règlement, tick et horaires. Il faut les vérifier avant de comparer ou valoriser les contrats."),
        text("The buyer pays a premium for a right. The seller receives the premium and accepts a contractual obligation if exercised or assigned. Buying and selling are therefore asymmetric: the buyer's initial outlay is the premium, while the seller may face substantially larger variation in value and must meet margin requirements.", "L’acheteur paie une prime pour obtenir un droit. Le vendeur reçoit la prime et accepte une obligation contractuelle en cas d’exercice ou d’assignation. Achat et vente sont donc asymétriques : la dépense initiale de l’acheteur est la prime, tandis que la valeur de la position du vendeur peut varier bien davantage et exige des garanties."),
      ],
      bullets: [
        text("Observed: quotes, trades, volume, open interest, strikes, expiries, and published contract terms.", "Observé : cotations, transactions, volume, open interest, strikes, échéances et spécifications publiées."),
        text("Calculated/modelled: implied volatility, Greeks, probability-like measures, and volatility indices.", "Calculé/modélisé : volatilité implicite, Greeks, mesures assimilées à des probabilités et indices de volatilité."),
        text("Not directly observed: each holder's motive, dealer net inventory, OTC exposure, or the next price direction.", "Non directement observé : motif de chaque détenteur, inventaire net des dealers, exposition OTC ou prochaine direction du prix."),
      ],
    },
    {
      id: "calls-puts",
      title: text("Calls, puts, buyers, and sellers", "Calls, puts, acheteurs et vendeurs"),
      summary: text("Calls convey a right to buy; puts convey a right to sell. Neither label reveals the complete trade or its intent.", "Un call confère un droit d’achat ; un put, un droit de vente. Aucune étiquette ne révèle à elle seule le trade complet ni son intention."),
      paragraphs: [
        text("At expiration, a call's intrinsic payoff per unit is max(underlying minus strike, 0); a put's is max(strike minus underlying, 0). Profit also depends on the premium, fees, multiplier, exercise and settlement rules. A call can hedge a short exposure; a put can insure a long exposure; either can be one leg of a spread.", "À l’échéance, le payoff intrinsèque unitaire d’un call vaut max(sous-jacent moins strike, 0) ; celui d’un put vaut max(strike moins sous-jacent, 0). Le profit dépend aussi de la prime, des frais, du multiplicateur et des règles d’exercice et de règlement. Un call peut couvrir une exposition vendeuse ; un put peut protéger une exposition acheteuse ; chacun peut constituer une jambe de spread."),
        text("Every open contract has a long and a short side. Therefore, many open calls do not prove bullish positioning, and many puts do not prove bearish positioning. Directional intent requires transaction context that aggregate open interest does not provide.", "Chaque contrat ouvert possède un côté long et un côté short. Un grand nombre de calls ouverts ne prouve donc pas un positionnement haussier, pas plus qu’un grand nombre de puts ne prouve un positionnement baissier. L’intention directionnelle exige un contexte transactionnel absent de l’open interest agrégé."),
      ],
    },
    {
      id: "premium-strike-expiry",
      title: text("Premium, strike, and expiry", "Prime, strike et échéance"),
      summary: text("Price, contractual level, and remaining time are separate dimensions.", "Prix de l’option, niveau contractuel et temps restant sont trois dimensions distinctes."),
      paragraphs: [
        text("The premium is the option's market price. The strike is the contractual comparison level. Expiry defines when the right ends and often which futures month or settlement process matters. Quoted premium must be converted using the contract multiplier to understand currency exposure.", "La prime est le prix de marché de l’option. Le strike est le niveau contractuel de comparaison. L’échéance définit la fin du droit et souvent le mois de future ou le processus de règlement pertinent. Il faut convertir la prime avec le multiplicateur du contrat pour comprendre l’exposition monétaire."),
        text("Two options with the same strike can have different premiums because expiry, underlying forward, rates, volatility, liquidity, and exercise terms differ. Comparing raw premiums without normalizing those dimensions is usually misleading.", "Deux options de même strike peuvent avoir des primes différentes à cause de l’échéance, du forward sous-jacent, des taux, de la volatilité, de la liquidité et des modalités d’exercice. Comparer les primes brutes sans normaliser ces dimensions est généralement trompeur."),
      ],
    },
    {
      id: "moneyness",
      title: text("Intrinsic value, extrinsic value, and moneyness", "Valeur intrinsèque, valeur extrinsèque et moneyness"),
      summary: text("Moneyness locates the strike relative to the underlying; it is not a verdict on whether an option is attractive.", "La moneyness situe le strike par rapport au sous-jacent ; elle ne dit pas si l’option est attractive."),
      paragraphs: [
        text("An option is in the money (ITM) when immediate exercise has positive intrinsic value, at the money (ATM) when strike and relevant underlying are near one another, and out of the money (OTM) when immediate exercise has no intrinsic value. For futures options, use the correct referenced futures price rather than casually substituting spot.", "Une option est in the money (ITM) si son exercice immédiat possède une valeur intrinsèque positive, at the money (ATM) si strike et sous-jacent pertinent sont proches, et out of the money (OTM) si l’exercice immédiat n’a pas de valeur intrinsèque. Pour une option sur future, il faut utiliser le bon future de référence plutôt que remplacer négligemment celui-ci par le spot."),
        text("Premium equals intrinsic value plus extrinsic value under the relevant convention. Extrinsic value reflects remaining uncertainty and time, not a guaranteed payout. It generally decays toward zero at expiry, but the path is nonlinear and can be offset by changes in the underlying or implied volatility.", "La prime égale la valeur intrinsèque plus la valeur extrinsèque selon la convention pertinente. La valeur extrinsèque reflète le temps et l’incertitude restants, non un payoff garanti. Elle tend vers zéro à l’échéance, mais sa trajectoire est non linéaire et peut être compensée par les variations du sous-jacent ou de la volatilité implicite."),
      ],
    },
    {
      id: "implied-volatility",
      title: text("Implied volatility (IV)", "Volatilité implicite (IV)"),
      summary: text("IV is the volatility input that reconciles an option-pricing model with an observed option price.", "L’IV est le paramètre de volatilité qui réconcilie un modèle de valorisation avec un prix d’option observé."),
      paragraphs: [
        text("Implied volatility is solved from market price, not directly measured from future returns. It bundles the market price of uncertainty, supply and demand, model assumptions, and quoting conventions. Different strikes and expiries generally have different IVs, producing a surface rather than one universal number.", "La volatilité implicite est déduite du prix de marché ; elle n’est pas directement mesurée à partir des rendements futurs. Elle agrège prix de l’incertitude, offre et demande, hypothèses du modèle et conventions de cotation. Les strikes et échéances ont généralement des IV différentes : on obtient une surface, non un nombre universel."),
        text("IV is conventionally annualized. A higher IV usually raises both call and put values, all else equal, because the range of possible outcomes widens. It does not say whether Gold will rise or fall, nor does it guarantee that future realized volatility will match the implied level.", "L’IV est conventionnellement annualisée. Une IV plus élevée augmente généralement la valeur des calls et puts, toutes choses égales par ailleurs, car l’éventail des issues s’élargit. Elle n’indique pas si l’or va monter ou baisser et ne garantit pas que la volatilité réalisée future égalera le niveau implicite."),
      ],
      examples: [{
        id: "f11-iv-range",
        title: text("Illustrative implied move", "Mouvement implicite illustratif"),
        setup: text("Assume Gold is 2,400, one-month ATM IV is 18%, and use 30/365 years solely for a rough one-standard-deviation scale.", "Supposons l’or à 2 400, une IV ATM à un mois de 18 %, et 30/365 année uniquement pour une échelle approximative d’un écart-type."),
        steps: [
          text("Time scaling: square root of 30/365 is approximately 0.287.", "Facteur temporel : racine carrée de 30/365, soit environ 0,287."),
          text("Approximate move: 2,400 × 18% × 0.287 ≈ 124.", "Mouvement approximatif : 2 400 × 18 % × 0,287 ≈ 124."),
          text("This gives an illustrative band near 2,276–2,524, not forecast endpoints or guaranteed containment.", "Cela donne une bande illustrative proche de 2 276–2 524, non des objectifs prévus ni un intervalle garanti."),
        ],
        conclusion: text("An implied range expresses scale under assumptions; it contains no directional call and real returns need not be normally distributed.", "Une bande implicite exprime une amplitude sous hypothèses ; elle ne contient aucun appel directionnel et les rendements réels ne suivent pas nécessairement une loi normale."),
      }],
    },
    {
      id: "realized-volatility",
      title: text("Realized volatility (RV)", "Volatilité réalisée (RV)"),
      summary: text("RV summarizes historical price variability over a defined sampling window.", "La RV résume la variabilité historique des prix sur une fenêtre d’échantillonnage définie."),
      paragraphs: [
        text("Realized volatility is commonly the annualized standard deviation of periodic log returns. Its value changes with the observation window, sampling frequency, annualization factor, price source, and treatment of holidays or overnight gaps. A 20-session close-to-close RV is not interchangeable with an intraday estimator.", "La volatilité réalisée est souvent l’écart-type annualisé des rendements logarithmiques périodiques. Sa valeur dépend de la fenêtre, de la fréquence, du facteur d’annualisation, de la source de prix et du traitement des jours fériés ou gaps nocturnes. Une RV close-to-close sur 20 séances n’est pas interchangeable avec un estimateur intraday."),
        text("Comparing IV and subsequent RV helps study the volatility risk premium, but it is not a simple trading rule. The comparison must align horizon and underlying, include transaction costs and hedging path, and avoid using future information in a live decision.", "Comparer IV et RV ultérieure aide à étudier la prime de risque de volatilité, mais ne constitue pas une règle de trading simple. Il faut aligner horizon et sous-jacent, inclure coûts de transaction et trajectoire de couverture, et éviter toute information future dans une décision en temps réel."),
      ],
    },
    {
      id: "greeks",
      title: text("The Greeks: local sensitivities", "Les Greeks : sensibilités locales"),
      summary: text("Greeks describe how a model value changes near current inputs; they are not fixed properties or forecasts.", "Les Greeks décrivent comment une valeur de modèle varie près des paramètres actuels ; ce ne sont ni des propriétés fixes ni des prévisions."),
      paragraphs: [
        text("Delta measures sensitivity to a small underlying-price change; gamma measures the change in delta; theta measures sensitivity to elapsed time under a stated convention; vega measures sensitivity to an IV change; rho measures sensitivity to rates. Their units and scaling vary by vendor and contract, so labels alone are insufficient.", "Delta mesure la sensibilité à une petite variation du sous-jacent ; gamma, la variation du delta ; theta, la sensibilité à l’écoulement du temps selon une convention donnée ; vega, la sensibilité à l’IV ; rho, la sensibilité aux taux. Leurs unités et échelles varient selon fournisseur et contrat : l’étiquette seule ne suffit pas."),
        text("Greeks move when Gold, time, IV, rates, or the forward changes. Delta is not a guaranteed exercise probability, gamma is not a directional signal, theta is not a constant daily debit, and vega does not mean the position profits whenever markets feel uncertain. Portfolio Greeks also depend on signed positions and multipliers.", "Les Greeks évoluent avec l’or, le temps, l’IV, les taux ou le forward. Delta n’est pas une probabilité garantie d’exercice, gamma n’est pas un signal directionnel, theta n’est pas un débit quotidien constant et vega ne signifie pas que la position profite dès que le marché paraît incertain. Les Greeks d’un portefeuille dépendent aussi du signe des positions et des multiplicateurs."),
      ],
      bullets: [
        text("Long option: typically positive gamma and vega; theta is generally negative, other things equal.", "Option achetée : gamma et vega généralement positifs ; theta généralement négatif, toutes choses égales par ailleurs."),
        text("Short option: typically negative gamma and vega; theta is generally positive, but loss and margin risks can be substantial.", "Option vendue : gamma et vega généralement négatifs ; theta généralement positif, mais risques de perte et de marge potentiellement importants."),
        text("These signs describe a simple isolated option; spreads and portfolios combine legs and can change the net exposures.", "Ces signes décrivent une option simple isolée ; spreads et portefeuilles combinent plusieurs jambes et peuvent modifier les expositions nettes."),
      ],
    },
    {
      id: "skew",
      title: text("Volatility skew and smile", "Skew et smile de volatilité"),
      summary: text("Skew compares IV across strikes for the same expiry.", "Le skew compare l’IV entre strikes pour une même échéance."),
      paragraphs: [
        text("If equal-expiry options have different IVs, the cross-strike pattern is called skew or smile. It can reflect asymmetric demand, perceived tail risk, distribution shape, liquidity, and market microstructure. Compare consistent delta or moneyness points and use synchronized quotes.", "Lorsque des options de même échéance ont des IV différentes, la configuration entre strikes est appelée skew ou smile. Elle peut refléter demande asymétrique, risque de queue perçu, forme de distribution, liquidité et microstructure. Il faut comparer des points cohérents de delta ou moneyness et des cotations synchronisées."),
        text("A rich put wing does not prove Gold will fall, just as a rich call wing does not prove it will rise. Demand may be insurance, a spread leg, or inventory management. Skew describes relative option pricing, not a standalone directional forecast.", "Une aile de puts chère ne prouve pas que l’or va baisser, pas plus qu’une aile de calls chère ne prouve qu’il va monter. La demande peut être une assurance, une jambe de spread ou une gestion d’inventaire. Le skew décrit un prix relatif d’options, non une prévision directionnelle autonome."),
      ],
    },
    {
      id: "term-structure",
      title: text("Volatility term structure", "Structure par terme de volatilité"),
      summary: text("Term structure compares IV across expiries at a consistent strike or delta convention.", "La structure par terme compare l’IV entre échéances selon une convention cohérente de strike ou delta."),
      paragraphs: [
        text("Near-dated IV can rise above longer-dated IV around a concentrated event because little calendar time remains to absorb its uncertainty. Longer maturities blend more events and longer-run uncertainty. Calendar shape also reflects supply, demand, liquidity, holidays, and rolling futures underlyings.", "L’IV courte peut dépasser l’IV longue autour d’un événement concentré, car il reste peu de temps calendaire pour absorber son incertitude. Les maturités longues agrègent davantage d’événements et d’incertitude de long terme. La forme reflète aussi offre, demande, liquidité, jours fériés et roulement des futures sous-jacents."),
        text("An inverted term structure is a state description, not proof of imminent movement. Compare like with like: same timestamp, comparable delta, known underlying, and explicit days to expiry.", "Une structure inversée décrit un état ; elle ne prouve pas l’imminence d’un mouvement. Il faut comparer des éléments homogènes : même horodatage, delta comparable, sous-jacent connu et nombre de jours avant échéance explicite."),
      ],
    },
    {
      id: "open-interest",
      title: text("Volume, open interest, and what they cannot tell you", "Volume, open interest et limites d’inférence"),
      summary: text("Volume counts activity; open interest counts outstanding contracts after clearing updates.", "Le volume compte l’activité ; l’open interest compte les contrats encore ouverts après mise à jour du clearing."),
      paragraphs: [
        text("Volume measures contracts traded over a period and can include opening, closing, and intraday round trips. Open interest changes when positions are opened or closed through clearing; publication timing may lag trading. Large OI can identify a contract worth monitoring for liquidity or expiry mechanics, but not the owners' net intent.", "Le volume mesure les contrats échangés sur une période et peut inclure ouvertures, clôtures et allers-retours intraday. L’open interest varie lorsque des positions sont ouvertes ou fermées via le clearing ; sa publication peut être décalée. Un OI élevé peut signaler un contrat à surveiller pour sa liquidité ou son échéance, mais pas l’intention nette de ses détenteurs."),
        text("A strike with high call OI may contain long calls, covered calls, short calls, or spread legs across many participants. Public OI does not identify which side dealers hold, whether exposures are dynamically hedged, or what exists OTC. Consequently, deriving exact dealer positioning, a gamma flip, or a directional target from OI alone is unsupported.", "Un strike à fort OI call peut contenir calls achetés, covered calls, calls vendus ou jambes de spreads chez de nombreux intervenants. L’OI public n’identifie ni le côté détenu par les dealers, ni les couvertures dynamiques, ni les expositions OTC. En déduire un positionnement dealer exact, un gamma flip ou une cible directionnelle n’est donc pas fondé."),
      ],
    },
    {
      id: "hedging",
      title: text("Delta hedging and gamma mechanics", "Couverture delta et mécanique gamma"),
      summary: text("Hedging can create flows, but the sign and magnitude require position data that a public chain does not contain.", "La couverture peut créer des flux, mais leur signe et leur amplitude exigent des données de position absentes d’une chaîne publique."),
      paragraphs: [
        text("A delta hedger trades the underlying or futures to offset part of an option position's price sensitivity. Because delta changes, the hedge may need rebalancing. A known long-gamma position tends to rebalance against price moves; a known short-gamma position tends to rebalance with them. This is conditional mechanics, not proof that a particular market participant holds that exposure.", "Un hedger delta traite le sous-jacent ou les futures pour compenser une partie de la sensibilité d’une position optionnelle. Comme delta varie, la couverture peut nécessiter un rééquilibrage. Une position connue long gamma tend à rééquilibrer à contre-mouvement ; une position connue short gamma, dans le sens du mouvement. Il s’agit d’une mécanique conditionnelle, non d’une preuve qu’un intervenant précis détient cette exposition."),
        text("A credible flow estimate needs signed positions, multipliers, Greeks, hedge ratios, underlying mapping, OTC coverage, and behavioural assumptions. Without those inputs, charts labelled dealer gamma exposure are models. They must publish methodology and uncertainty and must never be presented as an observed fact or automatic price forecast.", "Une estimation crédible des flux exige positions signées, multiplicateurs, Greeks, ratios de couverture, correspondance du sous-jacent, couverture OTC et hypothèses comportementales. Sans ces éléments, les graphiques dits d’exposition gamma des dealers sont des modèles. Ils doivent publier méthodologie et incertitude et ne jamais être présentés comme faits observés ou prévisions automatiques."),
      ],
      examples: [{
        id: "f11-delta-hedge-example",
        title: text("Conditional hedge arithmetic", "Arithmétique conditionnelle de couverture"),
        setup: text("A hypothetical, known long position contains 10 calls, multiplier 100, model delta 0.40. Ignore basis and execution costs.", "Une position hypothétique et connue contient 10 calls achetés, multiplicateur 100, delta modèle 0,40. Ignorons base et coûts d’exécution."),
        steps: [
          text("Model-equivalent delta exposure is 10 × 100 × 0.40 = 400 underlying units.", "L’exposition delta équivalente du modèle vaut 10 × 100 × 0,40 = 400 unités du sous-jacent."),
          text("A delta-neutral hedge would initially sell approximately 400 equivalent units.", "Une couverture delta-neutre vendrait initialement environ 400 unités équivalentes."),
          text("If delta later becomes 0.55, the model exposure becomes 550 units and the hedge changes—subject to the actual hedge policy.", "Si delta passe ensuite à 0,55, l’exposition modèle devient 550 unités et la couverture évolue — selon la politique réelle de hedging."),
        ],
        conclusion: text("The arithmetic is valid only because position sign and size were specified. Aggregate OI supplies neither.", "Le calcul n’est valide que parce que signe et taille de position étaient précisés. L’OI agrégé ne fournit ni l’un ni l’autre."),
      }],
    },
    {
      id: "gvz",
      title: text("GVZ: a GLD-options volatility gauge", "GVZ : une jauge de volatilité issue des options GLD"),
      summary: text("GVZ is an options-derived expected-volatility measure tied to SPDR Gold Shares (GLD), not Gold spot itself.", "GVZ est une mesure de volatilité anticipée dérivée des options sur SPDR Gold Shares (GLD), non du spot Gold lui-même."),
      paragraphs: [
        text("Cboe Gold ETF Volatility Index (GVZ) uses a strip of GLD option prices to represent a roughly 30-day expected-volatility measure under the index methodology. It is model-derived from option prices and conventionally annualized. Always retain source, timestamp, methodology version, and unit.", "Le Cboe Gold ETF Volatility Index (GVZ) utilise un ensemble de prix d’options GLD pour représenter une mesure de volatilité anticipée d’environ 30 jours selon sa méthodologie. Il est dérivé des prix d’options et annualisé par convention. Il faut conserver source, horodatage, version méthodologique et unité."),
        text("GLD tracks Gold through a fund structure and has its own trading hours, expenses, share mechanics, option liquidity, and basis versus spot or COMEX futures. GVZ is therefore informative context for Gold volatility, but it is not a direct spot-XAUUSD IV, not a futures-option surface, and not a directional signal.", "GLD suit l’or via une structure de fonds avec ses propres horaires, frais, mécanismes de part, liquidité optionnelle et base face au spot ou aux futures COMEX. GVZ fournit donc un contexte utile, mais n’est ni l’IV directe de XAUUSD spot, ni une surface d’options sur futures, ni un signal directionnel."),
      ],
    },
    {
      id: "cvol",
      title: text("CME Gold CVOL", "CME Gold CVOL"),
      summary: text("Gold CVOL is a CME options-derived volatility benchmark associated with Gold futures markets.", "Gold CVOL est un benchmark de volatilité dérivé d’options CME associées aux marchés de futures sur l’or."),
      paragraphs: [
        text("CME Group publishes Gold CVOL using its stated methodology and eligible option inputs to express a constant-horizon implied-volatility measure. Related CVOL analytics may include skew or tail measures, but every field must be read using its precise CME definition rather than inferred from the label.", "CME Group publie Gold CVOL selon sa méthodologie et des options éligibles afin d’exprimer une mesure de volatilité implicite à horizon constant. Des indicateurs associés peuvent couvrir skew ou queues, mais chaque champ doit être lu selon sa définition CME précise, non déduit de son seul nom."),
        text("CVOL and GVZ are not interchangeable. They differ in underlying ecosystem, eligible options, construction, market hours, and potentially timestamp. A divergence may reflect those bases rather than an exploitable contradiction. Compare synchronized observations and preserve provenance.", "CVOL et GVZ ne sont pas interchangeables. Ils diffèrent par l’écosystème sous-jacent, les options éligibles, la construction, les horaires et potentiellement l’horodatage. Une divergence peut refléter ces bases plutôt qu’une contradiction exploitable. Il faut comparer des observations synchronisées et préserver la provenance."),
      ],
    },
    {
      id: "event-risk",
      title: text("Event risk and volatility repricing", "Risque événementiel et repricing de volatilité"),
      summary: text("Options can price the magnitude of event uncertainty without identifying the outcome or direction.", "Les options peuvent pricer l’amplitude de l’incertitude événementielle sans identifier l’issue ni la direction."),
      paragraphs: [
        text("FOMC decisions, CPI, payrolls, central-bank actions, geopolitical developments, and major market closures can concentrate uncertainty. Front-end IV may rise before an event and fall after it when uncertainty is resolved—often called an IV crush—even if Gold moves materially.", "Décisions du FOMC, CPI, emploi, actions de banques centrales, développements géopolitiques et grandes fermetures de marché peuvent concentrer l’incertitude. L’IV courte peut monter avant l’événement puis baisser après sa résolution — souvent appelée IV crush — même si l’or bouge fortement."),
        text("The useful comparison is conditional: how much movement is priced, what catalyst window it covers, how skew distributes tail pricing, and what actually realizes afterward. High IV alone is neither bullish nor bearish. Low IV does not ensure calm, and high IV does not ensure a profitable long-volatility trade.", "La comparaison utile est conditionnelle : quelle amplitude est pricée, quelle fenêtre de catalyseur elle couvre, comment le skew répartit le prix des queues et ce qui se réalise ensuite. Une IV élevée n’est ni haussière ni baissière. Une IV basse ne garantit pas le calme et une IV haute ne garantit pas la rentabilité d’un achat de volatilité."),
      ],
    },
    {
      id: "worked-examples",
      title: text("Worked Gold examples", "Exemples pratiques sur l’or"),
      summary: text("Examples should separate payoff, volatility, and inference rather than collapse them into a trade signal.", "Les exemples doivent séparer payoff, volatilité et inférence plutôt que les réduire à un signal de trading."),
      paragraphs: [],
      examples: [
        {
          id: "f11-call-payoff",
          title: text("Call payoff versus profit", "Payoff d’un call contre profit"),
          setup: text("Hypothetical call strike 2,400, premium 45 per unit, underlying at expiry 2,480; ignore fees and multiplier.", "Call hypothétique strike 2 400, prime 45 par unité, sous-jacent à l’échéance 2 480 ; ignorons frais et multiplicateur."),
          steps: [
            text("Intrinsic payoff is max(2,480 − 2,400, 0) = 80.", "Le payoff intrinsèque vaut max(2 480 − 2 400, 0) = 80."),
            text("Buyer profit before fees is 80 − 45 = 35 per unit.", "Le profit de l’acheteur avant frais vaut 80 − 45 = 35 par unité."),
            text("The seller has the opposite option P&L before hedge effects and costs.", "Le vendeur possède le P&L optionnel opposé avant effets de couverture et coûts."),
          ],
          conclusion: text("Being ITM is not the same as being profitable; premium and contract economics matter.", "Être ITM ne signifie pas être profitable ; prime et économie du contrat comptent."),
        },
        {
          id: "f11-event-vol",
          title: text("CPI and an IV crush", "CPI et IV crush"),
          setup: text("Suppose one-week IV rises before CPI, Gold moves after the release, and IV then falls as event uncertainty disappears.", "Supposons que l’IV à une semaine monte avant le CPI, que l’or bouge après la publication puis que l’IV baisse avec la disparition de l’incertitude événementielle."),
          steps: [
            text("Observed facts: option prices, underlying move, timestamps, and post-event IV estimate.", "Faits observés : prix d’options, mouvement du sous-jacent, horodatages et estimation d’IV post-événement."),
            text("Interpretation: the market charged more for pre-event uncertainty, then repriced it lower.", "Interprétation : le marché facturait davantage l’incertitude pré-événement, puis l’a repricée à la baisse."),
            text("Unknown without the position: whether a trader profited, because strike, premium, Greeks, hedge path, execution, and costs matter.", "Inconnu sans la position : si un trader a gagné, car strike, prime, Greeks, trajectoire de couverture, exécution et coûts comptent."),
          ],
          conclusion: text("Correctly anticipating direction is not enough to determine option P&L.", "Anticiper correctement la direction ne suffit pas à déterminer le P&L d’une option."),
        },
      ],
    },
    {
      id: "caveats",
      title: text("Inference limits and common errors", "Limites d’inférence et erreurs fréquentes"),
      summary: text("Option data is rich but underdetermined: several different position stories can produce the same public chain.", "Les données d’options sont riches mais sous-déterminées : plusieurs histoires de positionnement peuvent produire la même chaîne publique."),
      paragraphs: [
        text("Keep three layers explicit. Observed data includes exchange quotes, trades, volume, OI, and published index values. Calculated data includes IV and Greeks under a named model and convention. Inference includes motives, hedging behaviour, dealer inventory, and possible market impact. Never promote the third layer into the first.", "Il faut expliciter trois couches. Les données observées incluent cotations, transactions, volume, OI et indices publiés. Les données calculées incluent IV et Greeks selon un modèle et une convention nommés. L’inférence inclut motivations, comportement de couverture, inventaire dealer et impact possible. Ne jamais transformer la troisième couche en première."),
      ],
      bullets: [
        text("No pseudo dealer positioning: public OI does not reveal who is long or short.", "Pas de pseudo-positionnement dealer : l’OI public ne révèle pas qui est long ou short."),
        text("No fake GEX or gamma-flip precision without signed positions, complete coverage, methodology, and uncertainty.", "Pas de faux GEX ni de précision artificielle sur un gamma flip sans positions signées, couverture complète, méthodologie et incertitude."),
        text("No max-pain trading signal: the construction is descriptive and does not establish causal attraction or direction.", "Pas de signal de trading fondé sur le max pain : la construction est descriptive et n’établit ni attraction causale ni direction."),
        text("No directional prediction from IV, skew, OI, or an expiry date alone.", "Aucune prévision directionnelle à partir de l’IV, du skew, de l’OI ou d’une échéance seule."),
        text("Do not mix GLD options, COMEX futures options, spot XAUUSD, and OTC options without stating the basis risk.", "Ne pas mélanger options GLD, options sur futures COMEX, spot XAUUSD et options OTC sans expliciter le risque de base."),
      ],
    },
    {
      id: "glossary",
      title: text("Glossary guide", "Guide du glossaire"),
      summary: text("Use contract- and methodology-specific definitions; similar labels can hide different units or underlyings.", "Utiliser des définitions propres au contrat et à la méthodologie ; des libellés proches peuvent masquer des unités ou sous-jacents différents."),
      paragraphs: [
        text("Before using any option metric, record its underlying, expiry, strike or delta convention, timestamp, units, multiplier, source, and whether it is observed or model-derived. This small data contract prevents most category errors in F11.", "Avant d’utiliser une métrique optionnelle, consigner sous-jacent, échéance, convention de strike ou delta, horodatage, unités, multiplicateur, source et nature observée ou dérivée du modèle. Ce petit contrat de données évite la plupart des erreurs de catégorie de F11."),
      ],
    },
    {
      id: "takeaways",
      title: text("How to use F11 in the terminal", "Comment utiliser F11 dans le terminal"),
      summary: text("F11 describes the price and shape of uncertainty; it does not replace the macro driver map.", "F11 décrit le prix et la forme de l’incertitude ; elle ne remplace pas la carte des moteurs macro."),
      paragraphs: [
        text("Start with provenance: is the metric GLD-based, futures-options-based, or another construction? Then read level, change, percentile or history, term structure, and skew. Align the option horizon with the catalyst horizon in F13 and use F2, F3, F6, and F7 to investigate possible directional drivers.", "Commencer par la provenance : métrique fondée sur GLD, options sur futures ou autre construction ? Lire ensuite niveau, variation, percentile ou historique, structure par terme et skew. Aligner l’horizon optionnel avec celui du catalyseur en F13 et utiliser F2, F3, F6 et F7 pour étudier les moteurs directionnels possibles."),
        text("A disciplined note can say: “one-month Gold option IV rose before the event, front-end term structure steepened, and put skew richened.” It cannot conclude from those facts alone that Gold must fall, that dealers are short gamma, or that a strike will pin price.", "Une note disciplinée peut dire : « l’IV des options Gold à un mois a monté avant l’événement, la structure courte s’est accentuée et le skew des puts s’est renchéri ». Elle ne peut pas conclure de ces seuls faits que l’or doit baisser, que les dealers sont short gamma ou qu’un strike va aimanter le prix."),
      ],
    },
  ],
  relatedTopics: ["F2", "F3", "F6", "F7", "F10", "F13"],
  glossary: [
    { id: "f11-call", term: "Call", definition: text("An option giving its buyer the right, but not the obligation, to buy under the contract terms.", "Option donnant à son acheteur le droit, non l’obligation, d’acheter selon les modalités du contrat.") },
    { id: "f11-put", term: "Put", definition: text("An option giving its buyer the right, but not the obligation, to sell under the contract terms.", "Option donnant à son acheteur le droit, non l’obligation, de vendre selon les modalités du contrat.") },
    { id: "f11-premium", term: "Premium / Prime", definition: text("The market price paid by the option buyer and received by the seller, before fees and hedge effects.", "Prix de marché payé par l’acheteur et reçu par le vendeur, avant frais et effets de couverture.") },
    { id: "f11-strike", term: "Strike", definition: text("The contractual exercise-price reference used to determine intrinsic payoff.", "Prix d’exercice contractuel utilisé pour déterminer le payoff intrinsèque.") },
    { id: "f11-iv", term: "Implied volatility (IV)", definition: text("The model volatility that reconciles an observed option price with specified pricing inputs.", "Volatilité de modèle qui réconcilie un prix d’option observé avec des paramètres de valorisation définis.") },
    { id: "f11-rv", term: "Realized volatility (RV)", definition: text("A backward-looking statistic of price-return variability over a defined sample.", "Statistique rétrospective de variabilité des rendements sur un échantillon défini.") },
    { id: "f11-delta", term: "Delta", definition: text("Local model sensitivity of option value to a small underlying-price change.", "Sensibilité locale du modèle de la valeur de l’option à une petite variation du sous-jacent.") },
    { id: "f11-gamma", term: "Gamma", definition: text("Local model sensitivity of delta to a small underlying-price change.", "Sensibilité locale du modèle de delta à une petite variation du sous-jacent.") },
    { id: "f11-theta", term: "Theta", definition: text("Model sensitivity of option value to the passage of time under a stated convention.", "Sensibilité du modèle de la valeur de l’option à l’écoulement du temps selon une convention donnée.") },
    { id: "f11-vega", term: "Vega", definition: text("Model sensitivity of option value to a change in implied volatility.", "Sensibilité du modèle de la valeur de l’option à une variation de volatilité implicite.") },
    { id: "f11-open-interest", term: "Open interest", definition: text("The number of outstanding contracts reported under clearing and publication conventions.", "Nombre de contrats encore ouverts selon les conventions de clearing et de publication.") },
    { id: "f11-skew", term: "Skew", definition: text("The pattern of implied volatility across strikes for a comparable expiry.", "Configuration de volatilité implicite entre strikes pour une échéance comparable.") },
    { id: "f11-gvz", term: "GVZ", definition: text("Cboe's roughly 30-day expected-volatility index derived from GLD options; not spot Gold IV.", "Indice Cboe de volatilité anticipée à environ 30 jours dérivé des options GLD ; non l’IV du spot Gold.") },
    { id: "f11-cvol", term: "Gold CVOL", definition: text("CME's methodology-defined implied-volatility benchmark for its Gold options ecosystem.", "Benchmark de volatilité implicite défini par la méthodologie CME pour son écosystème d’options Gold.") },
  ],
  takeaways: [
    text("Options price contingent payoffs and uncertainty; IV prices magnitude, not direction.", "Les options pricent des payoffs conditionnels et l’incertitude ; l’IV price une amplitude, non une direction."),
    text("Greeks are changing model sensitivities, not promises about future price behaviour.", "Les Greeks sont des sensibilités de modèle variables, non des promesses sur le comportement futur du prix."),
    text("Volume and OI are observable, but holder intent and dealer net positioning are not.", "Volume et OI sont observables, mais intention des détenteurs et positionnement net des dealers ne le sont pas."),
    text("GVZ is GLD-options based; Gold CVOL belongs to CME's Gold-options methodology. Preserve the distinction.", "GVZ repose sur les options GLD ; Gold CVOL relève de la méthodologie CME sur les options Gold. Préserver cette distinction."),
    text("Use option data to describe uncertainty and possible mechanics, never as an automatic BUY/SELL, max-pain, pinning, or fake-GEX signal.", "Utiliser les options pour décrire l’incertitude et des mécaniques possibles, jamais comme signal automatique BUY/SELL, max pain, pinning ou faux GEX."),
  ],
};

export const KNOWLEDGE_CHAPTERS_F11: readonly KnowledgeChapter[] = [F11_GOLD_OPTIONS];

export const KNOWLEDGE_CHAPTERS_F11_BY_ID: Readonly<Record<KnowledgeFamilyId, KnowledgeChapter>> = {
  F11: F11_GOLD_OPTIONS,
};

export function localizeKnowledgeText(value: LocalizedText, language: KnowledgeLanguage): string {
  return value[language];
}
