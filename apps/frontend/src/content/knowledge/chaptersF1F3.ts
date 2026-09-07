/**
 * Deterministic bilingual Knowledge content for F2-F3.
 *
 * F1 (Gold) was removed from the product entirely (see
 * docs/MVP_COCKPIT_CONTRACT.md's top-of-file note) — this module previously
 * also carried F1's chapter, hence the historical "F1F3" filename/export
 * naming still visible in sibling modules that import from here.
 *
 * This module deliberately contains no live observations, recommendations,
 * provider claims, or AI-generated text. Examples are hypothetical and teach
 * mechanics; they do not describe the current market. The local interfaces
 * are intentionally plain so they can later be replaced by central Knowledge
 * contracts without rewriting the content.
 */

export type KnowledgeLanguage = "EN" | "FR";
export type KnowledgeFamilyId = "F2" | "F3";

export interface LocalizedText {
  EN: string;
  FR: string;
}

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
  paragraphs?: LocalizedText[];
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
  relatedTopics: KnowledgeFamilyId[];
  glossary: KnowledgeGlossaryEntry[];
  takeaways: LocalizedText[];
}

const text = (EN: string, FR: string): LocalizedText => ({ EN, FR });

const F2_RATES: KnowledgeChapter = {
  id: "knowledge-f2-rates",
  familyId: "F2",
  title: text("Rates: the opportunity-cost engine", "Taux : le moteur du coût d'opportunité"),
  description: text(
    "Build a complete working model of Treasury prices and yields, the curve, nominal-real-breakeven decomposition, term premium, and their conditional transmission to Gold.",
    "Construire un modèle opérationnel complet des prix et rendements des Treasuries, de la courbe, de la décomposition nominal-réel-breakeven, de la prime de terme et de leur transmission conditionnelle vers l'or.",
  ),
  learningObjectives: [
    text("Explain why bond prices and yields move in opposite directions.", "Expliquer pourquoi prix obligataires et rendements évoluent en sens inverse."),
    text("Distinguish what the 2Y, 10Y, and 30Y usually encode.", "Distinguer ce que reflètent généralement les taux à 2 ans, 10 ans et 30 ans."),
    text("Calculate 2s10s in basis points and interpret flattening, inversion, and steepening as regimes—not direct Gold signals.", "Calculer le 2s10s en points de base et interpréter aplatissement, inversion et pentification comme des régimes, non comme des signaux directs sur l'or."),
    text("Decompose nominal yields into real yields and breakeven inflation.", "Décomposer les rendements nominaux entre taux réels et inflation anticipée implicite."),
    text("Identify whether policy expectations, inflation compensation, or term premium is driving a move before relating it to Gold.", "Identifier si les anticipations monétaires, la compensation d'inflation ou la prime de terme dominent avant de relier le mouvement à l'or."),
  ],
  sections: [
    {
      id: "f2-bond-yield-basics",
      title: text("Bond and yield basics", "Principes de base des obligations et rendements"),
      summary: text("A Treasury promises cash flows; its market price determines the return available to a new buyer.", "Un Treasury promet des flux de trésorerie ; son prix de marché détermine le rendement offert à un nouvel acheteur."),
      paragraphs: [
        text("A US Treasury is government debt. A conventional note or bond pays fixed coupons and returns principal at maturity. Once issued, those cash flows are fixed, but the security's market price changes. When the price falls, a new buyer pays less for the same cash flows, so the yield rises; when the price rises, the yield falls.", "Un Treasury américain est une dette publique. Un titre classique verse des coupons fixes et rembourse le principal à l'échéance. Une fois émis, ces flux sont fixes, mais le prix de marché du titre varie. Quand le prix baisse, un nouvel acheteur paie moins pour les mêmes flux : le rendement monte ; quand le prix monte, le rendement baisse."),
        text("Yield is not the coupon. The coupon is specified at issuance; yield summarizes the return implied by today's price and remaining cash flows. Longer-duration bonds react more strongly to a given yield change because more of their cash flows arrive far in the future.", "Le rendement n'est pas le coupon. Le coupon est fixé à l'émission ; le rendement résume le retour implicite compte tenu du prix actuel et des flux restants. Les obligations de duration plus longue réagissent davantage à une même variation de taux, car une plus grande part de leurs flux arrive loin dans le futur."),
      ],
      examples: [
        {
          id: "f2-price-yield-example",
          title: text("Example: fixed cash flow, changing price", "Exemple : flux fixe, prix variable"),
          setup: text("Consider a simplified one-year security paying 100 at maturity and no interim coupon.", "Considérons un titre simplifié à un an qui rembourse 100 à l'échéance, sans coupon intermédiaire."),
          steps: [
            text("At a price of 96, the simplified yield is 100 ÷ 96 − 1 = 4.17%.", "Au prix de 96, le rendement simplifié vaut 100 ÷ 96 − 1 = 4,17 %."),
            text("If demand lifts the price to 98, the yield falls to 100 ÷ 98 − 1 = 2.04%.", "Si la demande porte le prix à 98, le rendement baisse à 100 ÷ 98 − 1 = 2,04 %."),
          ],
          conclusion: text("The promised 100 did not change; the price paid for it did. Real Treasury yield calculations are more complex, but the inverse price-yield mechanism is the same.", "Le remboursement promis de 100 n'a pas changé ; son prix d'achat, oui. Le calcul réel d'un Treasury est plus complexe, mais le mécanisme inverse prix-rendement reste identique."),
        },
      ],
    },
    {
      id: "f2-maturities-curve",
      title: text("2Y, 10Y, 30Y, and the yield curve", "2 ans, 10 ans, 30 ans et courbe des taux"),
      summary: text("Each maturity loads differently on policy expectations, long-run fundamentals, and compensation for duration risk.", "Chaque maturité réagit différemment aux anticipations de politique monétaire, aux fondamentaux de long terme et à la rémunération du risque de duration."),
      paragraphs: [
        text("The 2Y is strongly influenced by the expected federal-funds path over the next several meetings. It often reacts sharply to inflation, employment, and Fed communication. It is not a perfect forecast: risk premia and market positioning also matter.", "Le 2 ans est fortement influencé par la trajectoire anticipée des Fed funds sur les prochaines réunions. Il réagit souvent vivement à l'inflation, à l'emploi et à la communication de la Fed. Ce n'est pas une prévision parfaite : primes de risque et positionnement comptent aussi."),
        text("The 10Y blends the expected path of short rates over a decade with long-run inflation and growth expectations plus term premium. The 30Y carries still more duration and can be particularly sensitive to long-run inflation uncertainty, fiscal supply, and investor demand for long-dated debt.", "Le 10 ans combine la trajectoire anticipée des taux courts sur une décennie, les anticipations de croissance et d'inflation à long terme, ainsi que la prime de terme. Le 30 ans porte davantage de duration et peut être particulièrement sensible à l'incertitude inflationniste de long terme, à l'offre liée au budget et à la demande pour la dette longue."),
        text("A yield curve compares maturities at one moment. An upward-sloping curve has long yields above short yields; an inverted curve has short yields above long yields. The shape is a regime descriptor. It does not mechanically dictate Gold's direction.", "Une courbe des taux compare les maturités à un instant donné. Une courbe ascendante présente des taux longs supérieurs aux taux courts ; une courbe inversée, l'inverse. Sa forme décrit un régime. Elle ne dicte pas mécaniquement la direction de l'or."),
      ],
    },
    {
      id: "f2-bps-2s10s",
      title: text("Basis points and 2s10s", "Points de base et 2s10s"),
      summary: text("One basis point is 0.01 percentage point; 2s10s is 10Y minus 2Y.", "Un point de base vaut 0,01 point de pourcentage ; le 2s10s vaut 10 ans moins 2 ans."),
      paragraphs: [
        text("Basis points avoid ambiguity when discussing rates. A move from 4.00% to 4.25% is +25 bps, not +25%: relative to 4.00%, it is a 6.25% proportional increase, but market convention describes the level change as 25 basis points.", "Les points de base évitent l'ambiguïté sur les taux. Un passage de 4,00 % à 4,25 % représente +25 pb, non +25 % : relativement à 4,00 %, la hausse proportionnelle est de 6,25 %, mais la convention de marché décrit la variation de niveau comme 25 points de base."),
        text("2s10s = 10Y yield − 2Y yield. A positive result is upward sloping between those maturities; a negative result is inverted. “Steepening” means the spread rises; “flattening” means it falls. Either can occur with both yields rising, both falling, or moving in opposite directions, so decomposition matters.", "2s10s = taux 10 ans − taux 2 ans. Un résultat positif indique une pente ascendante entre ces maturités ; un résultat négatif, une inversion. La « pentification » signifie que l'écart augmente ; l'« aplatissement » qu'il diminue. L'un comme l'autre peut se produire avec deux taux en hausse, deux taux en baisse ou des mouvements opposés : la décomposition est donc essentielle."),
      ],
      examples: [
        {
          id: "f2-2s10s-example",
          title: text("Example: calculate and classify 2s10s", "Exemple : calculer et classer le 2s10s"),
          setup: text("Assume the 2Y is 4.40% and the 10Y is 4.10%.", "Supposons un taux 2 ans à 4,40 % et un taux 10 ans à 4,10 %."),
          steps: [
            text("4.10% − 4.40% = −0.30 percentage point.", "4,10 % − 4,40 % = −0,30 point de pourcentage."),
            text("−0.30 percentage point × 100 = −30 bps.", "−0,30 point de pourcentage × 100 = −30 pb."),
            text("If the next reading is −10 bps, the curve has steepened by 20 bps but remains inverted.", "Si la lecture suivante est −10 pb, la courbe s'est pentifiée de 20 pb mais reste inversée."),
          ],
          conclusion: text("The slope identifies a curve regime. To assess Gold, inspect which leg moved and why, then check real yields and Fed pricing.", "La pente identifie un régime de courbe. Pour évaluer l'or, examiner quelle jambe a bougé et pourquoi, puis vérifier les taux réels et le pricing de la Fed."),
        },
      ],
    },
    {
      id: "f2-nominal-real-breakeven",
      title: text("Nominal, real, and breakeven yields", "Taux nominaux, réels et breakevens"),
      summary: text("Approximate identity: nominal yield ≈ real yield + breakeven inflation.", "Identité approximative : taux nominal ≈ taux réel + inflation breakeven."),
      paragraphs: [
        text("A nominal Treasury yield is stated in current dollars. A TIPS real yield is the inflation-adjusted yield embedded in an inflation-protected Treasury. Breakeven inflation is approximately the nominal Treasury yield minus the comparable-maturity TIPS real yield. It includes expected inflation and market premia, so it is not a pure survey forecast.", "Un rendement nominal de Treasury est exprimé en dollars courants. Le taux réel TIPS est le rendement corrigé de l'inflation intégré dans une obligation indexée. Le breakeven d'inflation correspond approximativement au taux nominal moins le taux réel TIPS de même maturité. Il inclut anticipations d'inflation et primes de marché : ce n'est donc pas une prévision d'enquête pure."),
        text("For Gold, the 10Y real yield is the most direct mechanical opportunity-cost measure in F2. Higher real yields increase the inflation-adjusted return available on a safe yield-bearing alternative while Gold pays no coupon; lower real yields reduce that opportunity cost. This ceteris-paribus channel can be offset by other regimes and does not itself constitute trade advice.", "Pour l'or, le taux réel à 10 ans est la mesure mécanique la plus directe du coût d'opportunité dans F2. Des taux réels plus élevés augmentent le rendement corrigé de l'inflation offert par une alternative sûre rémunérée, alors que l'or ne verse aucun coupon ; des taux réels plus bas réduisent ce coût d'opportunité. Ce canal toutes choses égales par ailleurs peut être compensé par d'autres régimes et ne constitue pas un conseil de trading."),
      ],
      examples: [
        {
          id: "f2-decomposition-example",
          title: text("Example: the same nominal move, different Gold implications", "Exemple : même mouvement nominal, implications différentes pour l'or"),
          setup: text("Start with a 10Y nominal yield of 4.20%, a 10Y real yield of 1.80%, and BE10 of 2.40%.", "Partons d'un taux nominal 10 ans à 4,20 %, d'un taux réel 10 ans à 1,80 % et d'un BE10 à 2,40 %."),
          steps: [
            text("Scenario A: nominal falls to 4.00% while BE10 stays 2.40%; real falls to about 1.60% (−20 bps). The opportunity-cost channel becomes more supportive for Gold.", "Scénario A : le nominal baisse à 4,00 % tandis que BE10 reste à 2,40 % ; le réel baisse vers 1,60 % (−20 pb). Le canal du coût d'opportunité devient plus favorable à l'or."),
            text("Scenario B: nominal falls to 4.00% while BE10 falls to 2.10%; real rises to about 1.90% (+10 bps). Despite the lower nominal yield, the opportunity-cost channel becomes more adverse.", "Scénario B : le nominal baisse à 4,00 % tandis que BE10 baisse à 2,10 % ; le réel monte vers 1,90 % (+10 pb). Malgré la baisse du nominal, le canal du coût d'opportunité devient plus défavorable."),
            text("Scenario C: nominal rises to 4.50% while BE10 rises to 2.70%; real stays near 1.80%. The nominal headline alone provides no new real-yield impulse.", "Scénario C : le nominal monte à 4,50 % tandis que BE10 monte à 2,70 % ; le réel reste proche de 1,80 %. Le titre nominal seul n'apporte aucune nouvelle impulsion de taux réel."),
          ],
          conclusion: text("Never map “10Y up/down” directly to Gold without separating real yield from inflation compensation.", "Ne jamais relier directement « 10 ans en hausse/baisse » à l'or sans séparer taux réel et compensation d'inflation."),
        },
      ],
    },
    {
      id: "f2-term-premium-decomposition",
      title: text("Term premium and causal decomposition", "Prime de terme et décomposition causale"),
      summary: text("A long yield is not only an average forecast of future short rates.", "Un taux long n'est pas seulement une moyenne des taux courts futurs anticipés."),
      paragraphs: [
        text("Conceptually, a long nominal yield combines expected future short nominal rates and a term premium. The term premium compensates investors for duration and uncertainty, including inflation risk, rate volatility, and supply-demand risk. It is model-estimated rather than directly observed, so different models can disagree.", "Conceptuellement, un taux nominal long combine les futurs taux courts nominaux anticipés et une prime de terme. Cette prime rémunère duration et incertitude, notamment les risques d'inflation, de volatilité des taux et d'offre-demande. Elle est estimée par modèle, non observée directement ; différents modèles peuvent donc diverger."),
        text("A 10Y selloff led by a higher expected Fed path differs from one led by fiscal or duration concerns. The first often lifts real yields and the dollar through a tighter-policy channel. The second may signal compensation demanded for holding long US debt and can coexist with Gold strength if confidence in that debt or currency is questioned. The observed yields alone cannot prove which story is dominant.", "Une vente du 10 ans menée par une trajectoire Fed anticipée plus haute diffère d'une vente liée aux inquiétudes budgétaires ou de duration. La première relève souvent les taux réels et le dollar via un canal monétaire restrictif. La seconde peut refléter la rémunération exigée pour détenir la dette américaine longue et coexister avec un or fort si la confiance envers cette dette ou la devise est mise en doute. Les taux observés seuls ne prouvent pas quelle histoire domine."),
      ],
      bullets: [
        text("Bull flattening: long yields fall faster than short yields; commonly associated with weaker growth expectations, but verify the cause.", "Bull flattening : les taux longs baissent plus vite que les courts ; souvent associé à des anticipations de croissance plus faible, mais la cause doit être vérifiée."),
        text("Bear flattening: short yields rise faster than long yields; commonly associated with hawkish policy repricing.", "Bear flattening : les taux courts montent plus vite que les longs ; souvent associé à un repricing monétaire restrictif."),
        text("Bull steepening: short yields fall faster than long yields; often consistent with expected easing.", "Bull steepening : les taux courts baissent plus vite que les longs ; souvent cohérent avec des anticipations d'assouplissement."),
        text("Bear steepening: long yields rise faster than short yields; distinguish stronger growth from inflation, fiscal supply, or term-premium stress.", "Bear steepening : les taux longs montent plus vite que les courts ; distinguer croissance plus forte, inflation, offre budgétaire ou tension de prime de terme."),
      ],
    },
    {
      id: "f2-failure-regimes",
      title: text("Mistakes and failure regimes", "Erreurs et régimes d'échec"),
      summary: text("Rates matter through causes and transmission, not through a one-line inverse rule.", "Les taux comptent par leurs causes et leur transmission, non par une règle inverse simpliste."),
      bullets: [
        text("Mistake: “nominal 10Y up means Gold down.” Check real yield, breakeven, dollar, speed, and cause.", "Erreur : « 10 ans nominal en hausse signifie or en baisse ». Vérifier taux réel, breakeven, dollar, vitesse et cause."),
        text("Mistake: treating an inverted or steepening 2s10s curve as a direct Gold signal. It is context, not a mechanical driver.", "Erreur : traiter une courbe 2s10s inversée ou en pentification comme un signal direct sur l'or. C'est du contexte, pas un moteur mécanique."),
        text("Mistake: treating a term-premium estimate as an observed fact. It is model-dependent.", "Erreur : traiter une estimation de prime de terme comme un fait observé. Elle dépend du modèle."),
        text("Failure regime: since 2022, strong official-sector demand has at times weakened the historical inverse Gold/real-yield relationship.", "Régime d'échec : depuis 2022, la forte demande du secteur officiel a parfois affaibli la relation inverse historique entre or et taux réels."),
        text("Failure regime: a confidence shock can lift long yields and Gold together if investors demand more compensation for US duration while seeking an alternative reserve asset.", "Régime d'échec : un choc de confiance peut faire monter simultanément taux longs et or si les investisseurs exigent plus de rémunération pour la duration américaine tout en recherchant une réserve alternative."),
      ],
    },
    {
      id: "f2-terminal-usage",
      title: text("How to use F2 in the terminal", "Comment utiliser F2 dans le terminal"),
      summary: text("Read the curve face, then open the decomposition before forming a Gold interpretation.", "Lire la courbe en façade, puis ouvrir la décomposition avant de former une interprétation sur l'or."),
      paragraphs: [
        text("The resting F2 face shows 2Y, 10Y, and 2s10s. Use them to detect where the move sits and how the curve changed. Then inspect the drawer's 10Y real yield and BE10. The 10Y real yield carries F2's fixed mechanical relationship; the other values remain contextual inputs.", "La façade F2 affiche 2 ans, 10 ans et 2s10s. Les utiliser pour localiser le mouvement et voir comment la courbe a changé. Examiner ensuite dans le drawer le taux réel 10 ans et BE10. Le taux réel 10 ans porte la relation mécanique fixe de F2 ; les autres valeurs restent des éléments contextuels."),
        text("Cross-check F3 when the 2Y moves: rate-pricing changes can explain the front end. Cross-check inflation data when breakevens move, Treasury/fiscal context when the long end and term premium appear dominant, and F6 to see whether the dollar confirms or contradicts the proposed chain.", "Croiser F3 lorsque le 2 ans bouge : les changements de pricing peuvent expliquer le court terme. Croiser l'inflation lorsque les breakevens bougent, le contexte Treasury/budgétaire lorsque le long terme et la prime de terme semblent dominer, et F6 pour voir si le dollar confirme ou contredit la chaîne proposée."),
      ],
    },
  ],
  relatedTopics: ["F3"],
  glossary: [
    { id: "f2-yield", term: "Yield / Rendement obligataire", definition: text("The return implied by a bond's current price and promised cash flows.", "Le rendement implicite compte tenu du prix actuel d'une obligation et de ses flux promis.") },
    { id: "f2-bps", term: "Basis point (bp) / Point de base (pb)", definition: text("0.01 percentage point; 100 bps equal 1 percentage point.", "0,01 point de pourcentage ; 100 pb valent 1 point de pourcentage.") },
    { id: "f2-real-yield", term: "Real yield / Taux réel", definition: text("An inflation-adjusted yield; in this context, the market real yield observed through TIPS.", "Un rendement corrigé de l'inflation ; ici, le taux réel de marché observé via les TIPS.") },
    { id: "f2-breakeven", term: "Breakeven inflation", definition: text("Approximately nominal Treasury yield minus comparable TIPS real yield; a market-implied inflation compensation measure.", "Approximativement le taux nominal Treasury moins le taux réel TIPS comparable ; une mesure de compensation d'inflation implicite au marché.") },
    { id: "f2-2s10s", term: "2s10s", definition: text("The 10Y Treasury yield minus the 2Y Treasury yield, expressed in basis points.", "Le taux Treasury 10 ans moins le taux Treasury 2 ans, exprimé en points de base.") },
    { id: "f2-term-premium", term: "Term premium / Prime de terme", definition: text("Model-estimated extra compensation for holding long-duration debt rather than rolling short-term debt.", "Rémunération supplémentaire estimée par modèle pour détenir une dette longue plutôt que renouveler une dette courte.") },
    { id: "f2-duration", term: "Duration", definition: text("A measure of a bond price's sensitivity to yield changes, not simply its time to maturity.", "Une mesure de sensibilité du prix d'une obligation aux variations de taux, distincte de sa seule échéance." ) },
  ],
  takeaways: [
    text("Bond prices and yields move inversely because promised cash flows are repriced.", "Prix obligataires et rendements évoluent en sens inverse parce que les flux promis sont repricés."),
    text("The 2Y emphasizes near-term Fed expectations; the 10Y and 30Y add progressively more long-horizon and term-premium exposure.", "Le 2 ans privilégie les anticipations Fed proches ; les 10 ans et 30 ans ajoutent progressivement davantage d'exposition au long terme et à la prime de terme."),
    text("2s10s is a regime indicator, not a direct Gold driver.", "Le 2s10s est un indicateur de régime, non un moteur direct de l'or."),
    text("Decompose nominal into real and breakeven before interpreting Gold; the 10Y real yield is F2's direct opportunity-cost channel.", "Décomposer le nominal entre réel et breakeven avant d'interpréter l'or ; le taux réel 10 ans est le canal direct de coût d'opportunité de F2."),
    text("Always ask which maturity moved, by how much, and why.", "Toujours demander quelle maturité a bougé, de combien et pourquoi."),
  ],
};

const F3_FED: KnowledgeChapter = {
  id: "knowledge-f3-fed-rate-pricing",
  familyId: "F3",
  title: text("Fed and rate pricing: expectations move markets", "Fed et rate pricing : les anticipations font bouger les marchés"),
  description: text(
    "Understand the policy target, how markets encode distributions for future decisions, and why surprise versus what was priced matters more than a decision in isolation.",
    "Comprendre la cible monétaire, la manière dont les marchés encodent des distributions de décisions futures et pourquoi la surprise par rapport au scénario intégré compte davantage qu'une décision isolée.",
  ),
  learningObjectives: [
    text("Distinguish the current target range from the expected future policy path.", "Distinguer la fourchette cible actuelle de la trajectoire monétaire future anticipée."),
    text("Read meeting probabilities as a distribution, not a promise.", "Lire les probabilités de réunion comme une distribution, non une promesse."),
    text("Translate changes in rate pricing into a causal chain through the 2Y, real yields, and USD.", "Traduire les changements de pricing en chaîne causale via le 2 ans, les taux réels et l'USD."),
    text("Separate level, change, and surprise when interpreting hawkish or dovish outcomes.", "Séparer niveau, variation et surprise pour interpréter un résultat hawkish ou dovish."),
  ],
  sections: [
    {
      id: "f3-fundamentals",
      title: text("Fundamentals: policy rate and reaction function", "Fondamentaux : taux directeur et fonction de réaction"),
      summary: text("The Fed sets a target range today while markets continuously price possible paths tomorrow.", "La Fed fixe aujourd'hui une fourchette cible tandis que les marchés pricent en continu les trajectoires possibles de demain."),
      paragraphs: [
        text("The Federal Open Market Committee sets a target range for the federal funds rate. Policy is transmitted through overnight money markets, expectations for future short rates, broader financial conditions, credit, demand, employment, and inflation. The current target is an observed policy setting; the future path is uncertain.", "Le Federal Open Market Committee fixe une fourchette cible pour le taux des Fed funds. La politique se transmet via les marchés monétaires au jour le jour, les anticipations de taux courts futurs, les conditions financières, le crédit, la demande, l'emploi et l'inflation. La cible actuelle est un réglage observé ; la trajectoire future reste incertaine."),
        text("The Fed's reaction function is the market's working model of how officials respond to inflation, employment, financial stability, and risks around the outlook. Hawkish means relatively more restrictive than the relevant baseline; dovish means relatively more accommodative. The comparison point matters: an unchanged decision can be hawkish if easing was priced, or dovish if a hike was feared.", "La fonction de réaction de la Fed est le modèle de travail du marché sur la réponse des responsables à l'inflation, à l'emploi, à la stabilité financière et aux risques entourant les perspectives. Hawkish signifie plus restrictif que la référence pertinente ; dovish, plus accommodant. Le point de comparaison est essentiel : une décision inchangée peut être hawkish si une baisse était intégrée, ou dovish si une hausse était redoutée."),
      ],
    },
    {
      id: "f3-pricing-mechanics",
      title: text("Mechanics: distributions, paths, and repricing", "Mécanique : distributions, trajectoires et repricing"),
      summary: text("Market pricing is a weighted distribution of possible outcomes that changes with information and positioning.", "Le pricing de marché est une distribution pondérée d'issues possibles qui évolue avec l'information et le positionnement."),
      paragraphs: [
        text("Meeting probabilities summarize market-implied weights across discrete outcomes such as hold, −25 bp, or −50 bp. They are estimates inferred from market prices under conventions and assumptions; they are not official Fed probabilities and not certainties. The probabilities should form a coherent distribution, while the maximum-probability outcome is only the mode.", "Les probabilités de réunion résument les poids implicites du marché entre des issues discrètes telles que statu quo, −25 pb ou −50 pb. Ce sont des estimations déduites des prix selon des conventions et hypothèses ; ni probabilités officielles de la Fed ni certitudes. Elles doivent former une distribution cohérente, tandis que l'issue la plus probable n'en est que le mode."),
        text("An implied path extends beyond the next meeting and asks what sequence or endpoint is embedded over several months. Repricing is the change in that path, usually expressed in basis points over a stated interval. Level and change answer different questions: a path can still imply cuts while becoming materially less dovish than it was two weeks earlier.", "Une trajectoire implicite va au-delà de la prochaine réunion et demande quelle séquence ou quel point terminal est intégré sur plusieurs mois. Le repricing est la variation de cette trajectoire, généralement exprimée en points de base sur un intervalle défini. Niveau et variation répondent à des questions différentes : une trajectoire peut toujours intégrer des baisses tout en devenant nettement moins dovish qu'il y a deux semaines."),
      ],
      examples: [
        {
          id: "f3-probability-example",
          title: text("Example: mode versus full distribution", "Exemple : mode contre distribution complète"),
          setup: text("Suppose the next-meeting distribution is Hold 25%, −25 bp 60%, and −50 bp 15%.", "Supposons une distribution pour la prochaine réunion : statu quo 25 %, −25 pb 60 % et −50 pb 15 %."),
          steps: [
            text("The most likely single outcome is −25 bp because 60% is the largest probability.", "L'issue individuelle la plus probable est −25 pb, car 60 % est la probabilité la plus élevée."),
            text("Combined cut probability is 60% + 15% = 75%.", "La probabilité combinée d'une baisse vaut 60 % + 15 % = 75 %."),
            text("There is still a 40% chance that the mode does not occur: 25% hold plus 15% for a larger cut.", "Il reste néanmoins 40 % de probabilité que le mode ne se réalise pas : 25 % de statu quo plus 15 % pour une baisse plus forte."),
          ],
          conclusion: text("Display “Next: −25 bp; Probability: 60%” as a compact summary, but retain the distribution in detail and never state that a cut is certain.", "Afficher « Prochaine : −25 pb ; Probabilité : 60 % » comme résumé compact, mais conserver la distribution en détail et ne jamais affirmer qu'une baisse est certaine."),
        },
        {
          id: "f3-repricing-example",
          title: text("Example: still easing, but less dovish", "Exemple : toujours en assouplissement, mais moins dovish"),
          setup: text("Assume the six-month path implied 100 bps of cuts two weeks ago and implies 65 bps now.", "Supposons que la trajectoire à six mois intégrait 100 pb de baisses il y a deux semaines et 65 pb aujourd'hui."),
          steps: [
            text("Current level: the market still prices 65 bps of easing.", "Niveau actuel : le marché intègre encore 65 pb d'assouplissement."),
            text("Change: 35 bps of expected easing has been removed.", "Variation : 35 pb d'assouplissement anticipé ont été retirés."),
            text("Interpretation: the path is less dovish than before even though it is not an outright hiking path.", "Interprétation : la trajectoire est moins dovish qu'avant, même si elle n'est pas une trajectoire de hausses."),
          ],
          conclusion: text("For near-term Gold transmission, the repricing impulse may matter more than the remaining absolute number of cuts.", "Pour la transmission à court terme vers l'or, l'impulsion du repricing peut compter davantage que le nombre absolu de baisses encore intégré."),
        },
      ],
    },
    {
      id: "f3-transmission-to-gold",
      title: text("Transmission to Gold", "Transmission vers l'or"),
      summary: text("Fed repricing reaches Gold mainly through short yields, real yields, the dollar, and financial conditions.", "Le repricing de la Fed atteint surtout l'or via les taux courts, les taux réels, le dollar et les conditions financières."),
      paragraphs: [
        text("A more dovish-than-priced development can lower the expected policy path, pull down the 2Y and real yields, weaken the dollar, and reduce Gold's opportunity cost. A more hawkish-than-priced development can reverse that chain. Each arrow is an empirical link to verify, not an automatic truth.", "Un développement plus dovish qu'intégré peut abaisser la trajectoire monétaire anticipée, faire reculer le 2 ans et les taux réels, affaiblir le dollar et réduire le coût d'opportunité de l'or. Un développement plus hawkish qu'intégré peut inverser cette chaîne. Chaque flèche est un lien empirique à vérifier, non une vérité automatique."),
        text("The locked relationship rules reflect this distinction. Probabilities of −25 bp and −50 bp have a mechanically supportive channel because a cut path lowers the policy-rate opportunity-cost channel, ceteris paribus. Hold probability, target-range levels, and the implied-path level remain contextual: their meaning depends on what was expected and how they changed.", "Les règles de relation verrouillées reflètent cette distinction. Les probabilités de −25 pb et −50 pb ont un canal mécaniquement favorable, car une trajectoire de baisse réduit le canal du coût d'opportunité monétaire, toutes choses égales par ailleurs. La probabilité de statu quo, les niveaux de fourchette cible et le niveau de trajectoire implicite restent contextuels : leur sens dépend de ce qui était attendu et de leur variation."),
      ],
      examples: [
        {
          id: "f3-surprise-example",
          title: text("Example: unchanged can still be a surprise", "Exemple : inchangé peut malgré tout surprendre"),
          setup: text("The Fed holds its target range unchanged. Before the meeting, markets assigned 70% to a hold and 30% to a 25 bp cut.", "La Fed maintient sa fourchette cible. Avant la réunion, le marché attribuait 70 % au statu quo et 30 % à une baisse de 25 pb."),
          steps: [
            text("The decision itself matches the modal expectation, so the first-order surprise is limited.", "La décision correspond à l'issue modale ; la surprise de premier ordre est donc limitée."),
            text("If guidance removes future cuts, the six-month path can reprice higher, lifting the 2Y and real yields: hawkish relative to the prior path.", "Si la communication retire des baisses futures, la trajectoire à six mois peut se repricer à la hausse, relevant 2 ans et taux réels : résultat hawkish par rapport à la trajectoire précédente."),
            text("If guidance validates near-term easing, the same hold can lower future-path pricing: dovish relative to expectations.", "Si la communication valide un assouplissement proche, le même statu quo peut abaisser le pricing futur : résultat dovish par rapport aux attentes."),
          ],
          conclusion: text("The label “hold” does not determine the Gold read; the change versus the priced path and the observed transmission do.", "L'étiquette « statu quo » ne détermine pas la lecture sur l'or ; la variation face à la trajectoire intégrée et la transmission observée la déterminent."),
        },
      ],
    },
    {
      id: "f3-fed-information-set",
      title: text("The Fed information set", "L'ensemble d'information de la Fed"),
      summary: text("Decision, statement, projections, press conference, and minutes arrive on different clocks and carry different information.", "Décision, communiqué, projections, conférence de presse et minutes arrivent selon des horloges différentes et portent des informations distinctes."),
      paragraphs: [
        text("The rate decision and statement define the current action and language. On projection meetings, the Summary of Economic Projections and dot plot reveal participants' conditional views, not binding promises. The press conference can reinforce or qualify the written material. Minutes arrive weeks later and describe the prior meeting; they can be informative but are not a live transcript of the current reaction function.", "La décision et le communiqué définissent l'action actuelle et son langage. Lors des réunions avec projections, le Summary of Economic Projections et le dot plot présentent les vues conditionnelles des participants, non des promesses contraignantes. La conférence de presse peut renforcer ou nuancer les documents écrits. Les minutes arrivent plusieurs semaines plus tard et décrivent la réunion précédente ; elles peuvent informer, mais ne constituent pas une transcription en direct de la fonction de réaction actuelle."),
        text("Market prices can move in several waves as each component arrives. A disciplined read timestamps observations and avoids declaring the final interpretation from the first headline alone.", "Les prix de marché peuvent évoluer en plusieurs vagues à mesure que chaque composante paraît. Une lecture disciplinée horodate les observations et évite de déclarer une interprétation finale à partir du seul premier titre."),
      ],
    },
    {
      id: "f3-failure-regimes",
      title: text("Mistakes and failure regimes", "Erreurs et régimes d'échec"),
      summary: text("Pricing is conditional, reflexive, and vulnerable to false precision.", "Le pricing est conditionnel, réflexif et vulnérable à la fausse précision."),
      bullets: [
        text("Mistake: reading 70% as certainty. It means meaningful residual probability remains elsewhere in the distribution.", "Erreur : lire 70 % comme une certitude. Une probabilité résiduelle significative demeure ailleurs dans la distribution."),
        text("Mistake: calling a decision hawkish or dovish without naming the expectation baseline.", "Erreur : qualifier une décision de hawkish ou dovish sans nommer la référence anticipée."),
        text("Mistake: confusing current target range, next-meeting distribution, and six-month path.", "Erreur : confondre fourchette cible actuelle, distribution de la prochaine réunion et trajectoire à six mois."),
        text("Mistake: double-counting 2Y down, real yields down, USD down, and Gold up as four independent confirmations when all may reflect one Fed repricing story.", "Erreur : compter baisse du 2 ans, baisse des taux réels, baisse du dollar et hausse de l'or comme quatre confirmations indépendantes alors qu'elles peuvent refléter une seule histoire de repricing Fed."),
        text("Failure regime: an easing signal driven by acute stress may initially coincide with dollar demand or forced liquidation, disrupting the conventional supportive Gold chain.", "Régime d'échec : un signal d'assouplissement provoqué par un stress aigu peut d'abord coïncider avec une demande de dollars ou des liquidations forcées, perturbant la chaîne conventionnellement favorable à l'or."),
      ],
    },
    {
      id: "f3-terminal-usage",
      title: text("How to use F3 in the terminal", "Comment utiliser F3 dans le terminal"),
      summary: text("Read Target, Next, and Probability as a compact map, then inspect the full distribution and repricing.", "Lire Cible, Prochaine et Probabilité comme une carte compacte, puis examiner la distribution complète et le repricing."),
      paragraphs: [
        text("Target is the current lower-upper policy range. Next is the outcome with the highest probability in the next-meeting distribution. Probability is the weight of that outcome—not combined cut odds and not certainty. Open the detail view to see hold/−25/−50 probabilities, the six-month implied path, and the two-week change.", "Cible est la fourchette monétaire actuelle, borne basse-borne haute. Prochaine est l'issue ayant la probabilité la plus élevée dans la distribution de la prochaine réunion. Probabilité est le poids de cette issue — ni la probabilité combinée de baisse ni une certitude. Ouvrir le détail pour voir les probabilités statu quo/−25/−50, la trajectoire implicite à six mois et sa variation sur deux semaines."),
        text("Compare the current distribution with its prior state, identify the catalyst, then validate transmission in F2 and F6. If pricing changes but 2Y, real yields, and USD do not confirm—or if another dominant driver overrides them—keep the interpretation contextual.", "Comparer la distribution actuelle à son état précédent, identifier le catalyseur, puis valider la transmission dans F2 et F6. Si le pricing change sans confirmation du 2 ans, des taux réels et de l'USD — ou si un autre moteur dominant les surpasse — conserver une interprétation contextuelle."),
      ],
    },
  ],
  relatedTopics: ["F2"],
  glossary: [
    { id: "f3-target-range", term: "Target range / Fourchette cible", definition: text("The lower and upper bounds set by the FOMC for the federal funds rate.", "Les bornes basse et haute fixées par le FOMC pour le taux des Fed funds.") },
    { id: "f3-fomc", term: "FOMC", definition: text("The Federal Open Market Committee, the Federal Reserve body that sets US monetary policy.", "Le Federal Open Market Committee, organe de la Réserve fédérale qui fixe la politique monétaire américaine.") },
    { id: "f3-rate-pricing", term: "Rate pricing", definition: text("Market-implied expectations for future policy outcomes and paths inferred from interest-rate instruments.", "Les anticipations implicites de marché sur les décisions et trajectoires monétaires futures, déduites d'instruments de taux.") },
    { id: "f3-repricing", term: "Repricing", definition: text("A change in the market-implied distribution or path relative to an earlier observation.", "Une variation de la distribution ou trajectoire implicite du marché par rapport à une observation antérieure.") },
    { id: "f3-hawkish", term: "Hawkish", definition: text("Relatively more restrictive on inflation and rates than the relevant expectation baseline.", "Relativement plus restrictif sur l'inflation et les taux que la référence anticipée pertinente.") },
    { id: "f3-dovish", term: "Dovish", definition: text("Relatively more accommodative on growth, employment, and rates than the relevant expectation baseline.", "Relativement plus accommodant sur croissance, emploi et taux que la référence anticipée pertinente.") },
    { id: "f3-dot-plot", term: "Dot plot", definition: text("FOMC participants' individual conditional assessments of appropriate future policy rates; not a commitment or unified forecast.", "Les évaluations individuelles et conditionnelles des participants du FOMC sur les taux futurs appropriés ; ni engagement ni prévision unifiée.") },
  ],
  takeaways: [
    text("Markets trade the difference between new information and what was priced, not labels in isolation.", "Les marchés tradent l'écart entre la nouvelle information et ce qui était intégré, non des étiquettes isolées."),
    text("A meeting probability is one weight in a distribution, never a promise.", "Une probabilité de réunion est un poids dans une distribution, jamais une promesse."),
    text("Separate current target, next-meeting outcome, future path, and change in that path.", "Séparer cible actuelle, issue de la prochaine réunion, trajectoire future et variation de cette trajectoire."),
    text("Validate the chain through 2Y, real yields, and USD; do not count one repricing story multiple times.", "Valider la chaîne via le 2 ans, les taux réels et l'USD ; ne pas compter plusieurs fois une seule histoire de repricing."),
  ],
};

export const KNOWLEDGE_CHAPTERS_F1_F3: readonly KnowledgeChapter[] = [
  F2_RATES,
  F3_FED,
];

export const KNOWLEDGE_CHAPTERS_F1_F3_BY_ID: Readonly<
  Record<KnowledgeFamilyId, KnowledgeChapter>
> = {
  F2: F2_RATES,
  F3: F3_FED,
};

export function localizeKnowledgeText(
  value: LocalizedText,
  language: KnowledgeLanguage,
): string {
  return value[language];
}
