import type { FamilyId, Language } from "@gold-terminal/contracts";

export interface FamilyEducationCopy {
  /** "What is this?" */
  overview: string;
  /**
   * "Why does it matter for Gold?" — merges the old separate "Why It
   * Matters" + "Gold Relationship" sections into one: the mechanism AND
   * the relationship framing together. States the family's actual
   * `relationship` values honestly — regime-dependent families (F5, F7,
   * F8, F9, F11) read as context-dependent, with no fixed direction
   * asserted beyond what the fixtures carry.
   */
  goldRelationship: string;
  /** "What would strengthen this signal?" */
  strengthens: string;
  /** "What would weaken or invalidate it?" */
  weakens: string;
  /** "Common mistake / nuance" */
  nuances: string;
}

// Cockpit-adjacent educational summaries. Paraphrased from the deeper
// reference material (Document Gloabl/gold-terminal-xauusd-REFERENCE.html)
// plus the fixture driverSummary text and the locked composition context in
// docs/MVP_COCKPIT_CONTRACT.md. Kept to 1-3 sentences per field — the
// reference document is where the full-depth education lives.
const FAMILY_EDUCATION_EN: Record<FamilyId, FamilyEducationCopy> = {
  F2: {
    overview:
      "Nominal Treasury yields (2Y, 10Y), the 10Y real (TIPS) yield, 10Y breakeven inflation, and the 2s10s curve slope.",
    goldRelationship:
      "The 10Y real yield is the single most direct mechanical driver of Gold's opportunity cost: Gold pays no yield, so the return given up by holding it rises and falls with real rates. Real yields ↓ (nominal yields fall faster than breakevens, or breakevens rise) → opportunity cost of holding Gold falls → supportive for Gold, ceteris paribus (and the mirror image when real yields rise, which is adverse — this is why 10Y Real is the one KPI in this family with a fixed relationship). 2Y, 10Y nominal, BE10, and 2s10s are neutral — context and decomposition inputs, not direct drivers on their own.",
    strengthens:
      "The case sharpens when a real-yield move is driven cleanly by the real (TIPS) component rather than by breakevens moving — always decompose the nominal move first.",
    weakens:
      "A nominal yield rise driven mostly by rising breakeven inflation, not real yields, can even flip the naive 'yields up = bad for Gold' read, since debasement-hedge demand can dominate that scenario instead.",
    nuances:
      "Always decompose a nominal yield move into its real-yield and breakeven components before calling a direction — a 10Y rise driven mostly by rising inflation expectations (breakevens) is a very different signal from one driven by rising real yields, and can even be read as supportive rather than adverse.",
  },
  F3: {
    overview:
      "The current Fed target range plus the market-implied probability distribution and repricing path for upcoming FOMC meetings.",
    goldRelationship:
      "The Fed does not move Gold directly — it moves expectations, which move front-end yields, real yields, and the dollar. Dovish repricing (more or faster cuts priced in) → front-end and real yields tend to fall → supportive for Gold, ceteris paribus. Prob. -25bp / -50bp are fixed support (a cut path is mechanically supportive); Prob. Hold, the Target Range, and the implied path are neutral — levels, not directional signals by themselves.",
    strengthens:
      "The case sharpens when the initial reaction (statement and dot plot) and the press-conference reaction point the same direction — a same-direction pair is a much stronger read than either move alone.",
    weakens:
      "A hawkish or dovish repricing that reverses within the same session — the classic FOMC-day pattern of an initial move followed by an opposite press-conference move — invalidates a bias formed on the first move alone; treat it as provisional until the press conference ends.",
    nuances:
      "An FOMC day typically produces two separate moves — an initial reaction to the statement and dot plot, then a second (sometimes opposite) move during the press conference — so a bias formed before the press conference ends is provisional, not final.",
  },
  F4: {
    overview:
      "CPI, PCE, and PPI inflation readings across headline/core and month-over-month/year-over-year cuts, plus a smoothed 3-month annualized trend read.",
    goldRelationship:
      "Inflation is the top input to Fed policy, which is why it ultimately feeds real yields — but its direct effect on Gold runs through two opposing channels at once: a debasement/purchasing-power hedge (bullish) or a trigger for a more hawkish Fed and higher real yields (bearish). Every KPI here is neutral because which channel dominates depends on the Fed's credibility and reaction function at the time, not on the print alone.",
    strengthens:
      "The hedge-channel (bullish) case strengthens when a hot print coincides with signs the Fed is already seen as behind the curve — e.g. real yields (F2) failing to rise and cut odds (F3) not falling despite the hot print.",
    weakens:
      "The hawkish-reaction (bearish) channel dominates instead when the Fed is seen as credible and in control — a hot print that immediately pushes F2's real yields up and F3's cut odds down is the tell that the naive hedge story will not hold this time.",
    nuances:
      "When the Fed is seen as credible and in control, the hawkish-reaction channel tends to dominate short-term even on a soft print; when the Fed is seen as behind the curve, the hedge channel can dominate instead — this is exactly why the fixtures here carry no fixed directional lean.",
  },
  F5: {
    overview:
      "Labor market data (unemployment rate, payrolls, jobless claims, average hourly earnings) alongside growth signals (ISM Services/Manufacturing, GDPNow).",
    goldRelationship:
      "These feed the Fed's employment mandate directly: a weakening labor market raises the odds of cuts priced into F3, which is the actual transmission channel to Gold — this family has no direct mechanical link of its own, so every KPI here stays neutral and genuinely context-dependent.",
    strengthens:
      "The signal sharpens when a weak print visibly moves F3's priced-in cut odds and F2's real yields in the same session — that co-movement is the actual transmission mechanism, not the headline print by itself.",
    weakens:
      "A headline miss that leaves F3 pricing unchanged (already priced in) — or that reverses once large negative revisions are digested — should not be treated as a standalone Gold signal.",
    nuances:
      "A headline payrolls 'beat' can be a genuinely weak report if it comes with large negative revisions to prior months and a rising unemployment rate — markets often spike on the headline first and reverse once the details are digested.",
  },
  F6: {
    overview:
      "A direct dollar index (DXY) level and its short-horizon momentum (today, 5-day), plus a plain-language read of whether that momentum is aligned or divergent.",
    goldRelationship:
      "Gold is priced in dollars, so dollar strength is a direct, mechanical headwind for non-USD buyers, independent of anything happening in rates: USD strengthens → Gold's price in other currencies rises → mechanically harder for non-USD buyers → adverse for Gold, ceteris paribus (and the mirror image on USD weakness, which is supportive). Today % and 5D % carry the mock's demonstrative support/adverse split to show a currently divergent state; the level and USD State stay neutral.",
    strengthens:
      "The case sharpens when intraday and multi-day USD momentum point the same direction — a single consistent trend removes the ambiguity a divergent read (like the current mock state) carries.",
    weakens:
      "In a genuine panic or a confidence crisis in US assets, Gold and the dollar can rise together as both are bought as safety at once — shorting Gold purely 'because the dollar is up' during a crisis is a common and costly mistake.",
    nuances:
      "The inverse USD/Gold correlation is a property of calm, 'financial' regimes — in a genuine panic or a confidence crisis in US assets, Gold and the dollar can rise together as both are bought as safety at once, so shorting Gold purely 'because the dollar is up' during a crisis is a common and costly mistake.",
  },
  F7: {
    overview:
      "Equity volatility (VIX), rates volatility (MOVE), and credit spreads (HY/IG OAS) — a general risk-appetite and financial-conditions gauge.",
    goldRelationship:
      "This family tells you how much stress is priced across markets broadly — it is context for interpreting other moves, not a Gold-specific signal. Gold can act as a risk-off safe haven in one episode and get sold for liquidity or margin calls during a sharp risk-off spike in another, so a rising VIX cannot be mechanically mapped to a Gold direction; every KPI here is deliberately neutral.",
    strengthens:
      "A VIX spike alongside a simultaneous flight into Treasuries (falling real yields in F2) and a falling dollar (F6) sharpens the signal into a genuine risk-off/safe-haven read, rather than an isolated VIX move that could mean almost anything.",
    weakens:
      "A sharp, indiscriminate vol spike that also sells Gold alongside equities (forced deleveraging / margin calls) means the safe-haven read has broken down for that episode — treat the initial move as noise until conditions stabilize.",
    nuances:
      "Sharp vol spikes have at times triggered a brief, indiscriminate sell-off in Gold alongside equities (forced deleveraging) before it recovers and resumes acting as a hedge — there is no fixed 'VIX up = Gold up' rule, which is why every KPI in this family is deliberately neutral.",
  },
  F8: {
    overview:
      "Bank reserves and Treasury General Account (TGA) levels/flows, a plain-language funding microstate read, and (in the drawer) SOFR-IORB / EFFR-IORB spreads.",
    goldRelationship:
      "Reserves available to the banking system are approximately the Fed's balance sheet minus the TGA minus reverse repo usage — this is a closer read of actual system liquidity than the balance sheet alone. Liquidity conditions affect broad risk appetite and financial conditions rather than Gold specifically, so 'balance sheet up = everything rallies' is a well-known trap; every KPI here stays neutral.",
    strengthens:
      "A reserves/TGA move reads as more meaningful for Gold when it coincides with a broader financial-conditions shift showing up in F7 (falling or rising vol and credit spreads) at the same time, not in isolation.",
    weakens:
      "A TGA rebuild (for example after a debt-ceiling resolution) or a reverse-repo drawdown driven by routine issuance mechanics carries no Gold-specific information on its own and should not be read as a liquidity-driven Gold signal.",
    nuances:
      "TGA rebuilds (for example after a debt-ceiling resolution or a heavy issuance period) or reverse-repo drawdowns can drain or add reserves for reasons that have nothing to do with any Gold-specific driver — this family is financial-conditions context, not a direct signal.",
  },
  F9: {
    overview:
      "Calendar-focused: net marketable borrowing estimates and Treasury auction results (high yield, bid-to-cover, indirect bidder share) shown around each auction, plus the upcoming auction schedule.",
    goldRelationship:
      "Auction demand and issuance size say something about investor appetite for US government duration — a metric that occasionally matters to Gold when it signals waning confidence in US assets generally. A weak auction is a fiscal/term-premium signal, not a mechanical Gold signal on its own; whether it helps or hurts Gold depends on whether the reaction shows up as a broad flight from US assets (potentially supportive) or simply higher real yields (adverse) — this family's fixtures stay neutral by default.",
    strengthens:
      "The case for a Gold-supportive 'flight from Treasuries' read strengthens when a weak auction or large tail coincides with a falling dollar and falling equities — a broad flight from US assets, not just a rates story.",
    weakens:
      "A weak auction that only pushes yields higher, with the dollar and equities steady or firm, is just a term-premium/rates story and should not be read as Gold-supportive.",
    nuances:
      "A large auction 'tail' (weak demand) alongside a falling dollar and falling equities looks like a confidence problem with US duration itself — one of the few scenarios where rising yields can be bullish for Gold rather than bearish, because it reflects flight from Treasuries rather than a hawkish Fed.",
  },
  F10: {
    overview:
      "CFTC Managed Money net positioning (share of open interest, weekly change, and 156-week percentile) and SPDR GLD physical holdings (1, 5, and 20 valid-observation changes, flow intensity, extension, and price relationship). These are two observable channels, not the entire Gold market.",
    goldRelationship:
      "F10 separates position stock from recent position change, and participation direction from historical extension. GLD holdings changes can confirm or diverge from price on the same horizon, but neither channel establishes causality or predicts Gold's next move. This is setup context, not an execution trigger.",
    strengthens:
      "Historical extension becomes more informative only when combined later with a catalyst and the market response. An extreme position can make a subsequent failure or unwind more consequential, but the extreme itself is not a reversal signal.",
    weakens:
      "Breadth is unavailable whenever either channel is stale or unavailable. CFTC is weekly and GLD is daily, so their displayed states retain separate observation dates and must not be presented as same-day activity.",
    nuances:
      "A percentile is a historical rank, not a count of future participants or a continuation probability. Extreme positioning can remain extreme for a long time. GLD tonnage also drifts slightly as the trust pays expenses, so a tiny holdings decline does not identify who traded or why.",
  },
  F11: {
    overview:
      "A Gold options volatility gauge (GLD-options proxy, in the style of a 'VIX for Gold') showing how much event risk the options market is pricing.",
    goldRelationship:
      "A rising vol gauge means the market expects a bigger move around upcoming catalysts; a compressed one flags complacency, which has historically preceded sharp breakouts. This gauge measures how much movement is priced, not which direction, so it is not a directional signal on its own — every KPI here stays neutral.",
    strengthens:
      "A rising vol gauge that coincides with a known catalyst window (an upcoming FOMC or CPI release, per F13) sharpens the 'event risk being priced in' read; in isolation, a single day's move on this thin proxy is closer to noise.",
    weakens:
      "Because this is a GLD-options proxy rather than true Gold CVOL/skew, a single-day spike or dip should not be read as a precise positioning signal — treat it as a rough sentiment gauge only, not a timing tool.",
    nuances:
      "This is intentionally a minimal proxy: true Gold CVOL, skew, and put/call data require a paid data source not wired up in this MVP, so treat this reading as a rough sentiment gauge only, not a precise skew or positioning tool.",
  },
  F12: {
    overview:
      "Structural physical-demand context for Gold: central-bank net buying and total quarterly demand across jewelry, investment, technology, and central banks — the World Gold Council's own reporting categories.",
    goldRelationship:
      "Both readings are permanently UNAVAILABLE: the World Gold Council, the only entity that compiles these figures, has no public API — only a login-gated interactive dashboard and manual spreadsheet/PDF exports, which this codebase's no-simulation rule will not substitute a fabricated or scraped-guess number for. Sustained central-bank net buying is a structural, price-insensitive demand source generally read as supportive when known; aggregate quarterly demand is broader context rather than a single directional driver.",
    strengthens:
      "Not applicable while this family has no data source — there is nothing here to strengthen or weaken until a genuine free source is found.",
    weakens:
      "Not applicable, for the same reason: an UNAVAILABLE reading carries no directional information at all, and should never be read as implicitly neutral or zero.",
    nuances:
      "An UNAVAILABLE KPI here means 'never fetched, no source exists' (NO_SOURCE), not 'a fetch failed this one time' — a meaningfully different, and more permanent, kind of gap than most other UNAVAILABLE readings in this cockpit.",
  },
  F13: {
    overview:
      "The calendar of scheduled macro catalysts (FOMC decisions, CPI releases, NFP releases) and, when one is underway, the currently active catalyst.",
    goldRelationship:
      "The size of Gold's reaction to any given data point is conditioned by proximity to the next scheduled event and by how much the market has already pre-positioned or priced in ahead of it. This family carries no numeric driver of its own — it is scheduling context for the other ten families, not a mechanical input into Gold's price, so no relationship value applies here.",
    strengthens:
      "Proximity to a high-importance scheduled catalyst (FOMC, CPI, NFP) sharpens how much weight to give any single data surprise elsewhere in the cockpit; the same surprise matters less mid-cycle, far from any scheduled event.",
    weakens:
      "An empty 'active catalyst' slot does not weaken anything on its own — it is deliberately shown as NONE rather than fabricated, and is itself meaningful information (a quieter, lower-realized-volatility stretch).",
    nuances:
      "An empty 'active catalyst' slot is meaningful information (a quieter, lower-realized-volatility stretch), so it is deliberately shown as NONE rather than fabricated — do not read an empty slot as a data gap.",
  },
};

const FAMILY_EDUCATION_FR: Record<FamilyId, FamilyEducationCopy> = {
  F2: {
    overview:
      "Les rendements nominaux des Treasuries à 2 ans et 10 ans, le rendement réel à 10 ans (TIPS), le point mort d’inflation à 10 ans et la pente 2s10s.",
    goldRelationship:
      "Le rendement réel à 10 ans est le moteur mécanique le plus direct du coût d’opportunité de l’or : l’or ne verse aucun rendement, donc le rendement auquel son détenteur renonce augmente ou diminue avec les taux réels. Taux réels en baisse (rendements nominaux qui reculent plus vite que les points morts, ou points morts qui montent) → coût d’opportunité plus faible → soutien pour l’or, toutes choses égales par ailleurs; l’image inverse vaut lorsque les taux réels montent, ce qui est défavorable. C’est pourquoi le taux réel à 10 ans est le seul KPI de cette famille assorti d’une relation fixe. Les taux nominaux à 2 ans et 10 ans, le BE10 et le 2s10s sont neutres : ce sont des éléments de contexte et de décomposition, pas des moteurs directs pris isolément.",
    strengthens:
      "Le signal devient plus net lorsque le mouvement du taux réel vient clairement de la composante réelle (TIPS), plutôt que d’un déplacement des points morts d’inflation : il faut toujours décomposer d’abord le mouvement nominal.",
    weakens:
      "Une hausse du rendement nominal principalement due à la montée des points morts d’inflation, et non des taux réels, peut même inverser la lecture naïve « hausse des taux = défavorable à l’or », car la demande de couverture contre la dépréciation monétaire peut alors dominer.",
    nuances:
      "Il faut toujours décomposer un mouvement du rendement nominal entre taux réel et point mort d’inflation avant de lui attribuer une direction : une hausse du 10 ans surtout portée par les anticipations d’inflation est très différente d’une hausse portée par les taux réels, et peut même soutenir l’or au lieu de lui nuire.",
  },
  F3: {
    overview:
      "La fourchette cible actuelle de la Fed, ainsi que la distribution de probabilités et la trajectoire de réévaluation implicites au marché pour les prochaines réunions du FOMC.",
    goldRelationship:
      "La Fed ne fait pas varier l’or directement : elle modifie les anticipations, qui déplacent les taux courts, les taux réels et le dollar. Une réévaluation accommodante — davantage de baisses, ou des baisses plus rapides, intégrées aux cours — tend à faire reculer les taux courts et réels, ce qui soutient l’or toutes choses égales par ailleurs. Les probabilités de -25 pb et -50 pb ont une relation fixe de soutien, car une trajectoire de baisse est mécaniquement favorable; la probabilité de statu quo, la fourchette cible et la trajectoire implicite sont neutres : ce sont des niveaux, pas des signaux directionnels en eux-mêmes.",
    strengthens:
      "Le signal devient plus net lorsque la réaction initiale au communiqué et au dot plot, puis celle observée pendant la conférence de presse, vont dans le même sens : deux mouvements concordants sont bien plus probants que l’un ou l’autre pris isolément.",
    weakens:
      "Une réévaluation restrictive ou accommodante qui s’inverse pendant la même séance — schéma classique d’un jour de FOMC, avec un premier mouvement suivi d’un mouvement opposé pendant la conférence de presse — invalide un biais fondé uniquement sur la réaction initiale; il reste provisoire jusqu’à la fin de la conférence.",
    nuances:
      "Une journée de FOMC produit généralement deux mouvements distincts : une première réaction au communiqué et au dot plot, puis une seconde, parfois opposée, pendant la conférence de presse. Tout biais formé avant la fin de celle-ci est donc provisoire, pas définitif.",
  },
  F4: {
    overview:
      "Les mesures d’inflation CPI, PCE et PPI, globale et sous-jacente, en variation mensuelle et annuelle, ainsi qu’une tendance lissée annualisée sur 3 mois.",
    goldRelationship:
      "L’inflation est la principale donnée d’entrée de la politique de la Fed et finit donc par agir sur les taux réels. Mais son effet direct sur l’or emprunte simultanément deux canaux opposés : une couverture contre la perte de pouvoir d’achat, favorable, ou le déclenchement d’une Fed plus restrictive et de taux réels plus élevés, défavorable. Tous les KPI sont neutres, car le canal dominant dépend alors de la crédibilité et de la fonction de réaction de la Fed, et non de la seule publication.",
    strengthens:
      "Le scénario de couverture, favorable à l’or, se renforce lorsqu’un chiffre élevé coïncide avec des signes que la Fed est déjà perçue comme en retard : par exemple, les taux réels (F2) ne montent pas et les probabilités de baisse (F3) ne reculent pas malgré la publication.",
    weakens:
      "Le canal de réaction restrictive, défavorable, domine lorsque la Fed est perçue comme crédible et maîtresse de la situation : si un chiffre élevé fait immédiatement monter les taux réels de F2 et baisser les probabilités de baisse de F3, la lecture naïve de couverture ne tiendra pas cette fois.",
    nuances:
      "Quand la Fed est jugée crédible et en contrôle, le canal restrictif tend à dominer à court terme, même après un chiffre faible; lorsqu’elle est perçue comme en retard, le canal de couverture peut au contraire dominer. C’est précisément pourquoi les données de référence n’attribuent ici aucune orientation fixe.",
  },
  F5: {
    overview:
      "Les données du marché du travail — chômage, créations d’emplois, inscriptions au chômage et salaire horaire moyen — accompagnées d’indicateurs de croissance comme les ISM Services et Manufacturier et GDPNow.",
    goldRelationship:
      "Ces données alimentent directement le mandat d’emploi de la Fed : un marché du travail qui faiblit accroît la probabilité de baisses intégrée dans F3, qui constitue le véritable canal de transmission vers l’or. Cette famille n’a pas de lien mécanique direct propre; tous ses KPI restent donc neutres et réellement dépendants du contexte.",
    strengthens:
      "Le signal devient plus net lorsqu’une publication faible déplace visiblement, pendant la même séance, les probabilités de baisse de F3 et les taux réels de F2 dans un sens cohérent. Ce co-mouvement est le véritable mécanisme de transmission, pas le chiffre principal pris isolément.",
    weakens:
      "Une déception sur le chiffre principal qui ne modifie pas les anticipations de F3 — parce qu’elle était déjà intégrée — ou dont l’effet s’inverse après la prise en compte de fortes révisions négatives ne doit pas être considérée comme un signal autonome sur l’or.",
    nuances:
      "Un chiffre de créations d’emplois supérieur aux attentes peut masquer un rapport véritablement faible s’il s’accompagne de fortes révisions négatives des mois précédents et d’une hausse du chômage. Le marché réagit souvent d’abord au chiffre principal, puis s’inverse une fois les détails assimilés.",
  },
  F6: {
    overview:
      "Un niveau direct de l’indice du dollar (DXY) et sa dynamique à court terme — aujourd’hui et sur 5 jours — avec une lecture en langage clair de leur convergence ou divergence.",
    goldRelationship:
      "L’or est coté en dollars : la hausse du dollar constitue donc un frein mécanique direct pour les acheteurs hors zone dollar, indépendamment des taux. Dollar en hausse → prix de l’or plus élevé dans les autres devises → achat mécaniquement plus difficile pour les non-résidents américains → effet défavorable à l’or, toutes choses égales par ailleurs; l’inverse vaut lorsque le dollar baisse, ce qui soutient l’or. Les variations du jour et sur 5 jours reprennent, dans les données fictives, l’opposition soutien/défavorable afin d’illustrer une divergence actuelle; le niveau et l’état du dollar restent neutres.",
    strengthens:
      "Le signal devient plus net lorsque les dynamiques intrajournalière et sur plusieurs jours du dollar vont dans le même sens : une tendance cohérente lève l’ambiguïté propre à une lecture divergente comme celle des données fictives actuelles.",
    weakens:
      "Lors d’une véritable panique ou d’une crise de confiance envers les actifs américains, l’or et le dollar peuvent monter ensemble, tous deux recherchés comme refuges. Vendre l’or uniquement parce que le dollar monte pendant une crise est une erreur fréquente et coûteuse.",
    nuances:
      "La corrélation inverse dollar/or caractérise surtout les régimes financiers calmes. Lors d’une véritable panique ou d’une crise de confiance envers les actifs américains, l’or et le dollar peuvent monter ensemble comme valeurs refuges; vendre l’or uniquement parce que le dollar monte pendant une crise est donc une erreur fréquente et coûteuse.",
  },
  F7: {
    overview:
      "La volatilité des actions (VIX), la volatilité des taux (MOVE) et les spreads de crédit (OAS HY/IG), soit une mesure générale de l’appétit pour le risque et des conditions financières.",
    goldRelationship:
      "Cette famille indique le niveau de stress intégré dans l’ensemble des marchés. Elle contextualise les autres mouvements, sans constituer un signal propre à l’or. Selon l’épisode, l’or peut servir de refuge en phase d’aversion au risque ou être vendu pour obtenir de la liquidité et répondre aux appels de marge lors d’un choc violent. Une hausse du VIX ne peut donc pas être mécaniquement associée à une direction de l’or; tous les KPI sont délibérément neutres.",
    strengthens:
      "Un pic du VIX accompagné d’une ruée simultanée vers les Treasuries — taux réels de F2 en baisse — et d’un dollar en baisse dans F6 transforme le mouvement en véritable lecture d’aversion au risque et de recherche de refuge, plutôt qu’en variation isolée du VIX à la signification ambiguë.",
    weakens:
      "Un fort pic de volatilité généralisé qui entraîne aussi la vente de l’or avec les actions, sous l’effet d’un désendettement forcé ou d’appels de marge, signifie que la lecture refuge ne fonctionne pas durant cet épisode. Le mouvement initial doit être traité comme du bruit jusqu’à la stabilisation.",
    nuances:
      "Des pics de volatilité ont parfois provoqué une vente brève et indiscriminée de l’or avec les actions, sous l’effet du désendettement forcé, avant que l’or ne se reprenne et retrouve son rôle de couverture. Il n’existe donc pas de règle fixe « VIX en hausse = or en hausse », d’où la neutralité délibérée de tous les KPI.",
  },
  F8: {
    overview:
      "Les réserves bancaires et les niveaux et flux du compte général du Trésor (TGA), une lecture claire du micro-état du financement et, dans le volet détaillé, les écarts SOFR-IORB et EFFR-IORB.",
    goldRelationship:
      "Les réserves disponibles pour le système bancaire correspondent approximativement au bilan de la Fed, diminué du TGA et de l’utilisation des prises en pension inversées. Cette mesure décrit mieux la liquidité réelle du système que le seul bilan. Les conditions de liquidité agissent sur l’appétit général pour le risque et les conditions financières, pas spécifiquement sur l’or; « bilan en hausse = tous les actifs montent » est un piège connu. Tous les KPI restent donc neutres.",
    strengthens:
      "Un mouvement des réserves ou du TGA devient plus pertinent pour l’or lorsqu’il coïncide avec un changement plus large des conditions financières visible simultanément dans F7 — hausse ou baisse de la volatilité et des spreads de crédit — et non lorsqu’il survient isolément.",
    weakens:
      "Une reconstitution du TGA, par exemple après le règlement d’un plafond de dette, ou une baisse des prises en pension inversées due aux mécanismes habituels d’émission ne contient, à elle seule, aucune information propre à l’or et ne doit pas être interprétée comme un signal de liquidité sur celui-ci.",
    nuances:
      "Les reconstitutions du TGA — après le règlement d’un plafond de dette ou pendant une période d’émissions importantes — et les baisses des prises en pension inversées peuvent retirer ou ajouter des réserves pour des raisons sans rapport avec un moteur propre à l’or. Cette famille décrit le contexte des conditions financières, pas un signal direct.",
  },
  F9: {
    overview:
      "Une famille centrée sur le calendrier : estimations des emprunts nets négociables, résultats des adjudications du Trésor — rendement haut, ratio de couverture et part des soumissionnaires indirects — autour de chaque adjudication, ainsi que le calendrier à venir.",
    goldRelationship:
      "La demande aux adjudications et le volume d’émission renseignent sur l’appétit des investisseurs pour la duration souveraine américaine, ce qui peut parfois compter pour l’or lorsqu’ils révèlent une défiance plus générale envers les actifs américains. Une adjudication faible est un signal budgétaire ou de prime de terme, pas un signal mécanique sur l’or. Son effet dépend de la réaction : fuite générale hors des actifs américains, potentiellement favorable, ou simple hausse des taux réels, défavorable. Les données de référence de cette famille restent neutres par défaut.",
    strengthens:
      "La lecture favorable à l’or d’une fuite hors des Treasuries se renforce lorsqu’une adjudication faible ou un écart important coïncide avec un dollar et des actions en baisse : il s’agit alors d’une fuite générale hors des actifs américains, pas d’une simple histoire de taux.",
    weakens:
      "Une adjudication faible qui ne fait que monter les taux, tandis que le dollar et les actions restent stables ou fermes, relève seulement de la prime de terme et des taux; elle ne doit pas être considérée comme favorable à l’or.",
    nuances:
      "Un important « tail » d’adjudication, signe d’une demande faible, accompagné d’un dollar et d’actions en baisse évoque un problème de confiance envers la duration américaine. C’est l’un des rares scénarios où une hausse des taux peut favoriser l’or, car elle traduit une fuite hors des Treasuries plutôt qu’une Fed restrictive.",
  },
  F10: {
    overview:
      "La position nette des gestionnaires de fonds selon la CFTC — en part de l’intérêt ouvert, variation hebdomadaire et percentile sur 156 semaines — ainsi que les avoirs physiques du fonds SPDR Gold Shares (GLD) et leur dernière variation observée en tonnes.",
    goldRelationship:
      "Le positionnement indique à quel point un mouvement est déjà encombré, tandis que les avoirs physiques de GLD montrent la tendance d’une demande adossée à de l’or physique et sensible aux taux réels. Tous deux conditionnent l’amplitude possible d’un mouvement ou de son retournement, sans en déterminer seuls la direction. Les mesures de positionnement restent neutres; la variation des avoirs GLD est signée selon sa propre valeur — soutien si elle est positive, défavorable si elle devient négative — et ne porte pas d’orientation fixe. Il s’agit spécifiquement de GLD, un seul émetteur, et non d’un agrégat mondial des ETF or.",
    strengthens:
      "Une position nette longue extrêmement tendue renforce l’idée que la prochaine surprise défavorable peut faire davantage de dégâts. À l’inverse, une position très dégradée associée à un catalyseur favorable augmente la possibilité d’une forte hausse, puisqu’il reste peu de positions longues à liquider.",
    weakens:
      "Interpréter comme actuelle une seule observation hebdomadaire du positionnement est une erreur : les données CFTC sont publiées avec retard et peuvent déjà être obsolètes si le marché a fortement bougé depuis la date de l’enquête.",
    nuances:
      "Une position nette longue extrêmement tendue ne signifie pas « vendre » : elle indique que la prochaine surprise défavorable dispose de plus d’espace pour nuire. Une position très dégradée accompagnée d’un catalyseur favorable peut produire une hausse démesurée, car il reste peu de positions longues à liquider. Les données hebdomadaires CFTC étant publiées avec retard, elles peuvent aussi être déjà dépassées si le marché a fortement évolué depuis l’enquête. Le tonnage de GLD diminue aussi légèrement et régulièrement dans le temps, indépendamment des flux des investisseurs : le fonds vend périodiquement une infime quantité d’or physique pour payer les frais de gestion du sponsor — une très légère baisse de la variation des avoirs lors d’une journée par ailleurs calme reflète donc ce prélèvement habituel, pas nécessairement des ventes d’investisseurs.",
  },
  F11: {
    overview:
      "Un indicateur de volatilité des options sur l’or — un proxy fondé sur les options GLD, dans l’esprit d’un « VIX de l’or » — qui montre le risque événementiel intégré par le marché des options.",
    goldRelationship:
      "La hausse de cet indicateur signifie que le marché anticipe un mouvement plus ample autour des prochains catalyseurs; sa compression révèle une complaisance qui a historiquement précédé de fortes cassures. Il mesure l’amplitude attendue, pas la direction : il ne constitue donc pas un signal directionnel à lui seul et tous ses KPI restent neutres.",
    strengthens:
      "La hausse de l’indicateur qui coïncide avec une fenêtre de catalyseur connue — prochaine réunion du FOMC ou publication du CPI, selon F13 — renforce la lecture d’un risque événementiel en cours d’intégration. Pris isolément, un mouvement quotidien de ce proxy peu profond tient davantage du bruit.",
    weakens:
      "Comme il s’agit d’un proxy fondé sur les options GLD, et non d’une véritable mesure CVOL ou du skew de l’or, un pic ou un creux sur une seule séance ne doit pas être lu comme un signal précis de positionnement. Ce n’est qu’un indicateur approximatif de sentiment, pas un outil de timing.",
    nuances:
      "Ce proxy est volontairement minimal : les véritables données CVOL, de skew et de put/call sur l’or nécessitent une source payante qui n’est pas connectée au MVP. Il faut donc le traiter comme une mesure approximative du sentiment, et non comme un outil précis de skew ou de positionnement.",
  },
  F12: {
    overview:
      "Contexte structurel de la demande physique d’or : achats nets des banques centrales et demande trimestrielle totale — bijouterie, investissement, technologie, banques centrales — selon les catégories propres au World Gold Council.",
    goldRelationship:
      "Ces deux lectures sont en permanence indisponibles : le World Gold Council, seule entité à compiler ces chiffres, ne propose aucune API publique — seulement un tableau de bord interactif protégé par identifiants et des exports manuels en feuille de calcul ou PDF, que la règle de non-simulation de ce système ne remplacera jamais par un chiffre fabriqué ou estimé. Des achats nets soutenus des banques centrales constituent une source de demande structurelle, insensible au prix, généralement considérée comme favorable lorsqu’elle est connue; la demande trimestrielle totale relève d’un contexte plus large plutôt que d’un moteur directionnel unique.",
    strengthens:
      "Non applicable tant que cette famille ne dispose d’aucune source de données : il n’y a rien ici à renforcer ou à invalider tant qu’une source réellement gratuite n’aura pas été trouvée.",
    weakens:
      "Non applicable, pour la même raison : une lecture indisponible ne porte aucune information directionnelle et ne doit jamais être interprétée comme implicitement neutre ou nulle.",
    nuances:
      "Un KPI indisponible ici signifie « jamais récupéré, aucune source n’existe » (NO_SOURCE), et non « une tentative de récupération a échoué cette fois-ci » — une lacune d’une nature différente, et plus permanente, que la plupart des autres lectures indisponibles de ce cockpit.",
  },
  F13: {
    overview:
      "Le calendrier des catalyseurs macroéconomiques programmés — décisions du FOMC, publications du CPI et du NFP — et, lorsqu’un événement est en cours, le catalyseur actuellement actif.",
    goldRelationship:
      "L’ampleur de la réaction de l’or à une donnée dépend de la proximité du prochain événement programmé et du degré de pré-positionnement ou d’intégration du marché avant celui-ci. Cette famille ne comporte aucun moteur numérique propre : elle fournit le contexte calendaire des dix autres familles, sans constituer une entrée mécanique du cours de l’or. Aucune valeur de relation ne s’y applique donc.",
    strengthens:
      "La proximité d’un catalyseur programmé important — FOMC, CPI ou NFP — augmente le poids à accorder à une surprise isolée ailleurs dans le cockpit. La même surprise compte moins au milieu d’un cycle, loin de tout événement prévu.",
    weakens:
      "L’absence de catalyseur actif ne réduit rien en elle-même : elle est volontairement affichée comme AUCUN plutôt que fabriquée et constitue une information utile, celle d’une période plus calme où la volatilité réalisée est plus faible.",
    nuances:
      "L’absence de catalyseur actif est une information utile — elle signale une période plus calme où la volatilité réalisée est plus faible — et elle est donc volontairement affichée comme AUCUN plutôt que fabriquée. Une case vide ne doit pas être interprétée comme une lacune de données.",
  },
};

/** Complete educational copy by application language. */
export const FAMILY_EDUCATION_BY_LANGUAGE: Record<
  Language,
  Record<FamilyId, FamilyEducationCopy>
> = {
  EN: FAMILY_EDUCATION_EN,
  FR: FAMILY_EDUCATION_FR,
};

/** Returns the educational copy for one family in the selected language. */
export function getFamilyEducation(
  familyId: FamilyId,
  language: Language,
): FamilyEducationCopy {
  return FAMILY_EDUCATION_BY_LANGUAGE[language][familyId];
}

/**
 * Backward-compatible English map. New language-aware consumers should use
 * `getFamilyEducation` or `FAMILY_EDUCATION_BY_LANGUAGE`.
 */
export const FAMILY_EDUCATION = FAMILY_EDUCATION_EN;
