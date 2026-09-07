/**
 * Deterministic bilingual education for F13. No live observations or
 * signals. F12 (Physical/Structural Gold) was removed from the product
 * entirely (see docs/MVP_COCKPIT_CONTRACT.md's top-of-file note) — this
 * module previously also carried F12's chapter, hence the historical
 * "F12F13" filename/export naming still visible in sibling modules that
 * import from here.
 */
export type KnowledgeFamilyIdF12F13 = "F13";
export interface LocalizedText { EN: string; FR: string }
export interface KnowledgeExample { id: string; title: LocalizedText; setup: LocalizedText; steps: LocalizedText[]; conclusion: LocalizedText }
export interface KnowledgeSection { id: string; title: LocalizedText; summary: LocalizedText; paragraphs: LocalizedText[]; bullets?: LocalizedText[]; examples?: KnowledgeExample[] }
export interface KnowledgeGlossaryEntry { id: string; term: string; definition: LocalizedText }
export interface KnowledgeChapterF12F13 { id: string; familyId: KnowledgeFamilyIdF12F13; title: LocalizedText; description: LocalizedText; learningObjectives: LocalizedText[]; sections: KnowledgeSection[]; relatedTopics: string[]; glossary: KnowledgeGlossaryEntry[]; takeaways: LocalizedText[] }

const text = (EN: string, FR: string): LocalizedText => ({ EN, FR });

const F13_EVENTS: KnowledgeChapterF12F13 = {
  id: "knowledge-f13-events-catalysts",
  familyId: "F13",
  title: text("Events and catalysts: the market clock", "Événements et catalyseurs : l'horloge du marché"),
  description: text("Learn to use calendars, expectations and surprise transmission as scheduling context. F13 never supplies a directional Gold signal by itself.", "Apprendre à utiliser calendriers, attentes et transmission des surprises comme contexte de planification. F13 ne fournit jamais, à lui seul, un signal directionnel sur l'or."),
  learningObjectives: [
    text("Distinguish a scheduled event, an active catalyst, and a market surprise.", "Distinguer événement programmé, catalyseur actif et surprise de marché."),
    text("Build conditional scenarios without predicting a release or Gold direction.", "Construire des scénarios conditionnels sans prédire une publication ni la direction de l'or."),
    text("Trace a release through Fed pricing, yields and USD before interpreting Gold.", "Suivre une publication via le pricing Fed, les taux et l'USD avant d'interpréter l'or."),
  ],
  sections: [
    {
      id: "event-calendar",
      title: text("Event calendar: what is known in advance", "Calendrier : ce qui est connu à l'avance"),
      summary: text("A calendar provides timing and event identity, not outcome, surprise, volatility magnitude or direction.", "Un calendrier fournit horaire et identité de l'événement, pas résultat, surprise, amplitude de volatilité ni direction."),
      paragraphs: [
        text("Scheduled macro releases and policy decisions reduce uncertainty about when new information arrives. FOMC decisions, CPI and employment reports can matter because they update beliefs about inflation, growth and policy. Release times, time zones, holidays and revisions must be handled explicitly.", "Les publications macroéconomiques et décisions monétaires programmées réduisent l'incertitude sur le moment d'arrivée d'une information. FOMC, CPI et emploi peuvent compter car ils actualisent les anticipations d'inflation, de croissance et de politique. Heures, fuseaux, jours fériés et révisions doivent être gérés explicitement."),
        text("Importance is conditional. A CPI release can have limited impact if it matches a tightly priced consensus, while an unscheduled policy headline can dominate the session. Distance to an event can alter liquidity, hedging and willingness to hold risk, but proximity is not bullish or bearish.", "L'importance est conditionnelle. Un CPI conforme à un consensus serré peut avoir peu d'effet, tandis qu'un titre politique imprévu peut dominer la séance. La proximité d'un événement peut modifier liquidité, couverture et volonté de porter du risque, mais elle n'est ni haussière ni baissière."),
      ],
      bullets: [text("The cockpit shows at most three next events to preserve scan speed; detail can retain the broader calendar.", "Le cockpit affiche au plus trois événements à venir pour préserver la vitesse de lecture ; le détail peut conserver le calendrier élargi."), text("Verify timestamp, timezone and status before calling an event upcoming or active.", "Vérifier horodatage, fuseau et statut avant de qualifier un événement d'à venir ou d'actif.")],
    },
    {
      id: "active-catalyst",
      title: text("Active catalyst: a bounded status", "Catalyseur actif : un statut borné"),
      summary: text("Active means an identified information process is currently affecting interpretation; NONE is a valid state.", "Actif signifie qu'un processus d'information identifié influence actuellement l'interprétation ; AUCUN est un état valide."),
      paragraphs: [
        text("An active catalyst should have a named event, an activation rule and a bounded window. A multi-stage FOMC event may include decision, statement, projections and press conference. The interpretation can change between stages, so timestamps matter.", "Un catalyseur actif doit avoir un événement nommé, une règle d'activation et une fenêtre bornée. Un FOMC en plusieurs étapes peut inclure décision, communiqué, projections et conférence de presse. L'interprétation peut changer entre les étapes ; l'horodatage compte."),
        text("NONE means no qualifying catalyst is underway. It is not missing data, a low-volatility promise or a directional statement. The terminal deliberately avoids fabricating a catalyst to fill the slot.", "AUCUN signifie qu'aucun catalyseur qualifié n'est en cours. Ce n'est ni une donnée manquante, ni une promesse de faible volatilité, ni une indication directionnelle. Le terminal évite délibérément de fabriquer un catalyseur pour remplir la case."),
      ],
    },
    {
      id: "surprise",
      title: text("Surprise: outcome versus the relevant baseline", "Surprise : résultat contre référence pertinente"),
      summary: text("Markets react to the gap between new information and expectations—not simply to whether a number rose or fell.", "Les marchés réagissent à l'écart entre nouvelle information et attentes — pas simplement à la hausse ou baisse d'un chiffre."),
      paragraphs: [
        text("For a release, surprise is commonly actual minus consensus, using the same definition, seasonal adjustment, unit and period. Previous-data revisions can matter alongside the headline. Consensus is itself a summary with dispersion and potential staleness, not a fact about the future.", "Pour une publication, la surprise est souvent réel moins consensus, avec même définition, correction saisonnière, unité et période. Les révisions de données antérieures peuvent compter avec le titre. Le consensus est lui-même un résumé avec dispersion et possible obsolescence, pas un fait sur l'avenir."),
        text("For policy, the baseline includes the priced decision, future path and communication. An unchanged rate can be hawkish or dovish relative to expectations. The same numeric surprise can have different effects when positioning, liquidity or the Fed reaction function differs.", "Pour la politique, la référence inclut décision pricée, trajectoire future et communication. Un taux inchangé peut être hawkish ou dovish face aux attentes. Une même surprise numérique peut produire des effets différents selon positionnement, liquidité ou fonction de réaction de la Fed."),
      ],
      examples: [{
        id: "f13-cpi-surprise-example",
        title: text("Example: calculate first, interpret second", "Exemple : calculer d'abord, interpréter ensuite"),
        setup: text("Hypothetical core CPI MoM is 0.3% versus a 0.2% consensus and 0.2% prior.", "Le core CPI mensuel hypothétique ressort à 0,3 % contre 0,2 % attendu et 0,2 % précédent."),
        steps: [text("Headline surprise: +0.1 percentage point, equal to 10 basis points.", "Surprise : +0,1 point de pourcentage, soit 10 points de base."), text("Test whether F3 removes easing and F2 real yields rise.", "Vérifier si F3 retire de l'assouplissement et si les taux réels F2 montent."), text("Check F6 USD and Gold's own reaction rather than assuming the textbook chain occurred.", "Contrôler F6 USD et la réaction de l'or lui-même au lieu de supposer que la chaîne théorique s'est réalisée.")],
        conclusion: text("The positive inflation surprise defines information; observed cross-family transmission defines the current Gold interpretation.", "La surprise inflationniste positive définit l'information ; la transmission observée entre familles définit l'interprétation actuelle pour l'or."),
      }],
    },
    {
      id: "transmission",
      title: text("Transmission to Gold and regime dependence", "Transmission vers l'or et dépendance au régime"),
      summary: text("F13 tells you when to inspect the other families; those families tell you what changed and through which channel.", "F13 indique quand examiner les autres familles ; celles-ci indiquent ce qui a changé et par quel canal."),
      paragraphs: [
        text("A conventional hotter-inflation chain may be: surprise → less Fed easing → higher 2Y and real yields → stronger USD → adverse opportunity-cost pressure on Gold. A weaker-employment chain may reverse those arrows. Every arrow must be checked; neither event label fixes the result.", "Une chaîne classique d'inflation plus forte peut être : surprise → moins d'assouplissement Fed → hausse du 2 ans et des taux réels → USD plus fort → pression défavorable du coût d'opportunité sur l'or. Une chaîne d'emploi plus faible peut inverser ces flèches. Chaque flèche doit être vérifiée ; l'étiquette de l'événement ne fixe pas le résultat."),
        text("Relationships can fail when growth fear dominates inflation, when a surprise was pre-positioned, when revisions offset the headline, when liquidity is poor, or when a confidence shock lifts both USD and Gold. Event-driven volatility measures movement risk, not direction.", "Les relations peuvent échouer lorsque la peur de croissance domine l'inflation, qu'une surprise était pré-positionnée, que les révisions compensent le titre, que la liquidité est faible ou qu'un choc de confiance fait monter USD et or. La volatilité événementielle mesure un risque de mouvement, pas sa direction."),
      ],
      examples: [{
        id: "f13-scenario-tree",
        title: text("Scenario tree: one event, conditional paths", "Arbre de scénarios : un événement, trajectoires conditionnelles"),
        setup: text("Before a payroll report, define scenarios without forecasting the release.", "Avant un rapport sur l'emploi, définir des scénarios sans prévoir la publication."),
        steps: [text("Upside surprise: test for higher policy pricing, real yields and USD; Gold pressure is conditional on confirmation.", "Surprise positive : tester hausse du pricing monétaire, des taux réels et de l'USD ; la pression sur l'or dépend de la confirmation."), text("Downside surprise: test for easing repricing; also check whether acute growth fear creates USD demand.", "Surprise négative : tester un repricing d'assouplissement ; vérifier aussi si une peur aiguë de croissance crée une demande d'USD."), text("Near consensus: watch revisions, wages and positioning; a muted response is valid.", "Proche du consensus : surveiller révisions, salaires et positionnement ; une réaction limitée est valide.")],
        conclusion: text("Scenarios organize observation; they are not trade instructions or probabilities unless a validated model supplies them.", "Les scénarios organisent l'observation ; ce ne sont ni des instructions de trading ni des probabilités sans modèle validé."),
      }],
    },
    {
      id: "f13-terminal-usage",
      title: text("How to use F13 in the terminal", "Comment utiliser F13 dans le terminal"),
      summary: text("Use F13 to prepare, timestamp and coordinate—not to vote on Gold direction.", "Utiliser F13 pour préparer, horodater et coordonner — pas pour voter sur la direction de l'or."),
      paragraphs: [
        text("Before an event, verify the clock and write conditional channels. During it, distinguish preliminary, revised and complete information. After it, compare actual versus baseline, then inspect F3 Fed pricing, F2 yields, F6 USD, and F7 volatility before drawing any conclusion about Gold's own reaction. Preserve contradictions and alternative explanations.", "Avant l'événement, vérifier l'horloge et écrire des canaux conditionnels. Pendant, distinguer information préliminaire, révisée et complète. Après, comparer réel et référence, puis examiner F3 pricing Fed, F2 taux, F6 USD et F7 volatilité avant de tirer une conclusion sur la réaction de l'or lui-même. Conserver contradictions et explications alternatives."),
        text("F13 has no scalar KPI and no Gold relationship state by design. An upcoming CPI, NFP or FOMC is scheduling context only. Do not convert event proximity, ACTIVE or NONE into SUPPORTIVE, ADVERSE, BUY or SELL.", "F13 ne possède ni KPI scalaire ni état de relation à l'or, par conception. Un CPI, NFP ou FOMC à venir n'est qu'un contexte de planification. Ne pas transformer proximité, ACTIF ou AUCUN en FAVORABLE, DÉFAVORABLE, ACHAT ou VENTE."),
      ],
      bullets: [
        text("Mistake: assuming high importance guarantees a large move.", "Erreur : supposer qu'une importance élevée garantit un grand mouvement."),
        text("Mistake: reading the event title as a directional forecast.", "Erreur : lire le titre de l'événement comme une prévision directionnelle."),
        text("Mistake: interpreting the first headline before details, revisions and market transmission arrive.", "Erreur : interpréter le premier titre avant détails, révisions et transmission de marché."),
      ],
    },
  ],
  relatedTopics: ["F2", "F3", "F4", "F5", "F6", "F7", "F11"],
  glossary: [
    { id: "f13-catalyst", term: "Catalyst / Catalyseur", definition: text("An identifiable information event capable of changing expectations or positioning; not inherently directional.", "Un événement informationnel identifiable capable de modifier attentes ou positionnement ; sans direction intrinsèque.") },
    { id: "f13-consensus", term: "Consensus", definition: text("A summary of surveyed expectations before a release, with methodology and dispersion limits.", "Un résumé des anticipations sondées avant publication, avec limites de méthode et de dispersion.") },
    { id: "f13-surprise", term: "Surprise", definition: text("The difference between an outcome and the relevant expectation baseline under consistent definitions.", "L'écart entre un résultat et la référence anticipée pertinente avec définitions cohérentes.") },
    { id: "f13-active-window", term: "Active window / Fenêtre active", definition: text("The bounded interval during which an event's information is being released or actively processed.", "L'intervalle borné pendant lequel l'information d'un événement est publiée ou activement assimilée.") },
    { id: "f13-transmission", term: "Transmission", definition: text("The observed chain through which information changes pricing, yields, currencies, flows and eventually Gold.", "La chaîne observée par laquelle l'information modifie pricing, taux, devises, flux puis éventuellement l'or.") },
  ],
  takeaways: [
    text("A calendar tells you when information may arrive, not what it will say or which way Gold will move.", "Un calendrier indique quand l'information peut arriver, pas ce qu'elle dira ni la direction de l'or."),
    text("Interpret surprise relative to a defined baseline, then verify the transmission chain.", "Interpréter la surprise face à une référence définie, puis vérifier la chaîne de transmission."),
    text("ACTIVE and NONE are operational states, never directional Gold signals.", "ACTIF et AUCUN sont des états opérationnels, jamais des signaux directionnels sur l'or."),
  ],
};

export const KNOWLEDGE_CHAPTERS_F12_F13: readonly KnowledgeChapterF12F13[] = [F13_EVENTS];
export const KNOWLEDGE_CHAPTERS_F12_F13_BY_ID: Readonly<Record<KnowledgeFamilyIdF12F13, KnowledgeChapterF12F13>> = { F13: F13_EVENTS };
