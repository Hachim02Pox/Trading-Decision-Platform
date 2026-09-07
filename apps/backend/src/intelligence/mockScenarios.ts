import type {
  AnalystConclusion,
  CanonicalKpi,
  ChallengeFinding,
  DisplayRelationship,
  EpistemicClaim,
  EvidenceState,
  Language,
} from "@gold-terminal/contracts";

// ---------------------------------------------------------------------------
// Milestone 1D — bilingual mock scenario content. Every hand-authored
// scenario below carries a genuinely, independently-authored English AND
// French version of its narrative fields — never a mechanically translated
// string. These are DEV_MOCK fixtures simulating what a future French- or
// English-language AI analysis would say, not a translation layer bolted
// onto one canonical-English text. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md
// section (a). Financial acronyms/instrument shorthand (CPI, PCE, DXY, VIX,
// FOMC, BE10, 2s10s, etc.) are never translated, in either language.
// ---------------------------------------------------------------------------

export interface ScenarioContent {
  currentReadShort: string;
  currentReadDetailed: string;
  whyNow: string;
  causalChain: EpistemicClaim[];
  uncertaintyOrUnknowns: string[];
  whatWouldStrengthen: string[];
  whatWouldWeakenOrInvalidate: string[];
}

/**
 * Milestone "French translation completeness" — the previous milestone's
 * per-analyst/challenge content was hand-authored in English only and
 * reused verbatim regardless of `?lang=`. That is now fixed: hand-authored
 * `analystConclusions`/`challengeFindings` are authored per-language, to
 * the same "genuinely independently-written, not machine-translated"
 * standard as `ScenarioContent`. `role`/`finalGoldRead`/`targetRole`/
 * `epistemicStatus` are structural (not prose) and intentionally identical
 * across languages; only the narrative text differs.
 */
export interface BilingualAnalystConclusions {
  en: Array<Omit<AnalystConclusion, "modelIdentity">>;
  fr: Array<Omit<AnalystConclusion, "modelIdentity">>;
}

export interface BilingualChallengeFindings {
  en: ChallengeFinding[];
  fr: ChallengeFinding[];
}

/**
 * The continuity narrative for one language — see `MockScenario.continuity`
 * and docs/KPI_INTELLIGENCE_ARCHITECTURE.md's "previous interpretation is
 * context, not anchor" section.
 */
export interface ContinuityContent {
  previousReadSummary: string;
  whatChangedSincePreviousRead: string;
  currentRead: string;
}

export interface MockScenario {
  en: ScenarioContent;
  fr: ScenarioContent;
  evidenceState: EvidenceState;
  /** Only meaningful for canonical-neutral (CONTEXTUAL_AI) KPIs — the base single-analyst lean before ensemble adjudication. */
  contextualFinalGoldRead?: DisplayRelationship;
  /**
   * Only meaningful for MECHANICAL_RULE KPIs (canonical relationship !==
   * "neutral"). When true, this is the rare, explicitly documented
   * demonstration that a mechanical channel can still be adjudicated
   * CONTEXTUAL when other forces are strong enough to make a directional
   * read unreliable right now — intentional and rare, never a bug. See
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md ("never silently overwritten").
   */
  forceContextualDespiteMechanical?: boolean;
  /** Hand-authored, per-language analyst conclusions (role order A/B/C) for illustrative KPIs only — otherwise synthesized generically from this scenario's own-language content. */
  analystConclusions?: BilingualAnalystConclusions;
  /** Hand-authored, per-language, substantive challenge findings — HIGH_SCRUTINY illustrative KPIs only; empty/absent elsewhere. */
  challengeFindings?: BilingualChallengeFindings;
  /**
   * Illustrative-KPI-only: a hand-authored previous-vs-current continuity
   * demonstration (both languages). Absent for every other KPI, which uses
   * the simpler "first analysis this session, no prior read to compare"
   * state (previousReadSummary/whatChangedSincePreviousRead null, currentRead
   * defaults to that language's currentReadShort). See
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
   */
  continuity?: { en: ContinuityContent; fr: ContinuityContent };
}

export function resolveScenarioContent(scenario: MockScenario, language: Language): ScenarioContent {
  return language === "FR" ? scenario.fr : scenario.en;
}

export function resolveAnalystConclusions(
  scenario: MockScenario,
  language: Language
): Array<Omit<AnalystConclusion, "modelIdentity">> | undefined {
  if (!scenario.analystConclusions) return undefined;
  return language === "FR" ? scenario.analystConclusions.fr : scenario.analystConclusions.en;
}

export function resolveChallengeFindings(scenario: MockScenario, language: Language): ChallengeFinding[] | undefined {
  if (!scenario.challengeFindings) return undefined;
  return language === "FR" ? scenario.challengeFindings.fr : scenario.challengeFindings.en;
}

export function resolveContinuity(scenario: MockScenario, language: Language): ContinuityContent | null {
  if (!scenario.continuity) return null;
  return language === "FR" ? scenario.continuity.fr : scenario.continuity.en;
}

export const MOCK_SCENARIOS: Record<string, MockScenario> = {
  // ------------------------------------------------------------- F2: Rates
  "f2-2y": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "2Y sits at 3.62% — a policy-expectations gauge, not a direct Gold driver on its own.",
      currentReadDetailed:
        "The 2Y yield mainly reflects near-term Fed expectations. On its own it is a decomposition input, not a mechanical Gold driver — the real-yield and Fed-repricing reads elsewhere carry the actual transmission.",
      whyNow: "No standalone 2Y move this session large enough to read independently of the Fed-pricing story.",
      causalChain: [
        { statement: "2Y yield is 3.62%, little changed.", status: "FACT" },
        { statement: "2Y is a policy-expectations proxy, not a direct Gold input.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether the next move is driven by growth data or Fed communication."],
      whatWouldStrengthen: ["A sharp 2Y repricing that also moves 10Y Real and Fed cut odds the same direction."],
      whatWouldWeakenOrInvalidate: ["An isolated 2Y move with no follow-through in real yields or Fed pricing."],
    },
    fr: {
      currentReadShort: "Le 2Y se situe à 3,62 % — un indicateur d'anticipations de politique monétaire, pas un moteur direct de l'Or.",
      currentReadDetailed:
        "Le rendement 2Y reflète surtout les anticipations à court terme de la Fed. Pris isolément, c'est une donnée de décomposition, pas un moteur mécanique de l'Or — ce sont les lectures de taux réels et de repricing Fed ailleurs qui portent la vraie transmission.",
      whyNow: "Aucun mouvement autonome du 2Y cette séance assez marqué pour se lire indépendamment du récit de repricing Fed.",
      causalChain: [
        { statement: "Le rendement 2Y est à 3,62 %, peu changé.", status: "FACT" },
        { statement: "Le 2Y est un indicateur des anticipations de politique monétaire, pas une donnée d'entrée directe pour l'Or.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si le prochain mouvement sera porté par les données de croissance ou la communication de la Fed."],
      whatWouldStrengthen: ["Un repricing marqué du 2Y qui déplace aussi les taux réels 10 ans et les probabilités de baisse Fed dans le même sens."],
      whatWouldWeakenOrInvalidate: ["Un mouvement isolé du 2Y sans suite dans les taux réels ou le pricing Fed."],
    },
  },
  "f2-10y": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "SUPPORTIVE",
    analystConclusions: {
      en: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "The nominal 10Y rise is breakeven-led, not real-yield-led — that decomposition softens the naive 'yields up, bad for Gold' read.",
          keyPoints: [
            "10Y Real has moved less than the nominal 10Y this session.",
            "Breakeven-led nominal rises can favor the debasement-hedge channel over the real-yield channel.",
          ],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "The decomposition is directionally right, but one session of divergence between nominal and real yields is thin evidence for a supportive call.",
          keyPoints: [
            "BE10 and 10Y Real are both derived series — measurement noise in either compresses the visible gap.",
            "A confirmed multi-day trend, not one session, would be needed to lean supportive with confidence.",
          ],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
      ],
      fr: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "La hausse du 10 ans nominal est tirée par les breakevens, pas par le taux réel — cette décomposition atténue la lecture naïve « taux en hausse, mauvais pour l'Or ».",
          keyPoints: [
            "Le taux réel 10 ans a moins bougé que le 10 ans nominal cette séance.",
            "Une hausse nominale tirée par les breakevens peut favoriser le canal de couverture contre la dévaluation plutôt que le canal de taux réel.",
          ],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "La décomposition va dans le bon sens, mais une seule séance de divergence entre nominal et réel est une preuve mince pour trancher en faveur d'une lecture favorable.",
          keyPoints: [
            "Le BE10 et le taux réel 10 ans sont deux séries dérivées — le bruit de mesure sur l'une ou l'autre comprime l'écart observé.",
            "Une tendance confirmée sur plusieurs séances, pas une seule, serait nécessaire pour pencher vers le favorable avec confiance.",
          ],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
      ],
    },
    continuity: {
      en: {
        previousReadSummary:
          "Previous read: the nominal 10Y rise was judged breakeven-led rather than real-yield-led, which softened the standard 'yields up, bad for Gold' read toward supportive.",
        whatChangedSincePreviousRead:
          "New Fed communication pushing back on near-term cut expectations, alongside a firmer PCE print and a stronger crude-oil impulse feeding into breakevens, has shifted how the market is reading this move — even though the 10Y print itself (4.287%) has not moved since the prior session.",
        currentRead:
          "This session partially revises the prior breakeven-led framing: with Fed communication now leaning against the earlier dovish read and early signs that real yields are starting to reassert themselves, the supportive lean from last session should be treated as weakening, not confirmed — the mechanical opportunity-cost channel is being watched much more closely going into the next session.",
      },
      fr: {
        previousReadSummary:
          "Lecture précédente : la hausse du 10 ans nominal était jugée tirée par les breakevens plutôt que par le taux réel, ce qui atténuait la lecture standard « taux en hausse, mauvais pour l'Or » vers un lecture favorable.",
        whatChangedSincePreviousRead:
          "De nouvelles communications de la Fed repoussant les anticipations de baisse à court terme, associées à un chiffre PCE plus ferme et à une impulsion plus forte du pétrole brut sur les breakevens, ont changé la façon dont le marché lit ce mouvement — alors même que le chiffre du 10 ans lui-même (4,287 %) n'a pas bougé depuis la séance précédente.",
        currentRead:
          "Cette séance révise partiellement le cadrage précédent tiré par les breakevens : avec une communication de la Fed qui penche désormais contre la lecture dovish antérieure et des signes précoces que les taux réels commencent à se réaffirmer, l'inclination favorable de la séance précédente doit être considérée comme s'affaiblissant, et non confirmée — le canal mécanique de coût d'opportunité est surveillé de beaucoup plus près à l'approche de la prochaine séance.",
      },
    },
    en: {
      currentReadShort: "10Y at 4.287% — the rise looks breakeven-led, which softens the naive 'yields up, bad for Gold' read.",
      currentReadDetailed:
        "Decomposing the nominal 10Y move: it is currently better explained by rising breakeven inflation (BE10) than by rising real yields. Per the locked F2 mechanism, a breakeven-led nominal rise can even read as supportive rather than adverse, since debasement-hedge demand can dominate that scenario.",
      whyNow: "This session's nominal 10Y move decomposes mostly into breakevens, not the real-yield component that actually drives Gold's opportunity cost.",
      causalChain: [
        { statement: "Nominal 10Y is 4.287%.", status: "FACT" },
        { statement: "10Y Real (the mechanical driver) has moved less than the nominal figure this session.", status: "INFERENCE" },
        { statement: "Because breakevens, not real yields, are doing most of the work, this reads closer to supportive than adverse.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Whether tomorrow's real-yield move confirms or reverses this decomposition."],
      whatWouldStrengthen: ["10Y Real staying flat or falling while breakevens keep rising."],
      whatWouldWeakenOrInvalidate: ["10Y Real itself breaking higher — that would flip this back toward the standard adverse read."],
    },
    fr: {
      currentReadShort: "Le 10 ans est à 4,287 % — la hausse semble tirée par les breakevens, ce qui atténue la lecture naïve « taux en hausse, mauvais pour l'Or ».",
      currentReadDetailed:
        "En décomposant le mouvement nominal du 10 ans : il s'explique aujourd'hui mieux par la hausse des breakevens d'inflation (BE10) que par une hausse des taux réels. Selon le mécanisme verrouillé de F2, une hausse nominale tirée par les breakevens peut même se lire comme favorable plutôt que défavorable, la demande de couverture contre la dévaluation pouvant dominer dans ce scénario.",
      whyNow: "Le mouvement nominal du 10 ans cette séance se décompose surtout en breakevens, et non dans la composante de taux réel qui pilote réellement le coût d'opportunité de l'Or.",
      causalChain: [
        { statement: "Le 10 ans nominal est à 4,287 %.", status: "FACT" },
        { statement: "Le taux réel 10 ans (le moteur mécanique) a moins bougé que le chiffre nominal cette séance.", status: "INFERENCE" },
        { statement: "Comme ce sont les breakevens, et non les taux réels, qui font l'essentiel du travail, cette lecture se rapproche davantage du favorable que du défavorable.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si le mouvement de taux réel de demain confirme ou inverse cette décomposition."],
      whatWouldStrengthen: ["Un taux réel 10 ans stable ou en baisse pendant que les breakevens continuent de monter."],
      whatWouldWeakenOrInvalidate: ["Une cassure haussière du taux réel 10 ans lui-même — cela ramènerait la lecture vers le défavorable standard."],
    },
  },
  "f2-2s10s": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "2s10s at 54bps — a curve-regime signal, not a direct Gold driver by itself.",
      currentReadDetailed:
        "The 2s10s slope is a regime indicator (steepening/flattening cycle context) rather than a mechanical Gold input. It matters for interpreting other moves, not as a standalone signal.",
      whyNow: "No regime shift large enough this session to change how other families should be read.",
      causalChain: [
        { statement: "2s10s is 54bps, in positive (un-inverted) territory.", status: "FACT" },
        { statement: "Curve slope conditions how to read Fed repricing, but doesn't drive Gold directly.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether a renewed inversion would change the regime read."],
      whatWouldStrengthen: ["A sustained steepening trend alongside confirmed Fed cuts."],
      whatWouldWeakenOrInvalidate: ["A choppy, directionless curve with no clear regime signal."],
    },
    fr: {
      currentReadShort: "Le 2s10s est à 54 pb — un signal de régime de courbe, pas un moteur direct de l'Or à lui seul.",
      currentReadDetailed:
        "La pente 2s10s est un indicateur de régime (contexte de cycle de pentification/aplatissement) plutôt qu'une donnée d'entrée mécanique pour l'Or. Elle sert à interpréter d'autres mouvements, pas comme signal autonome.",
      whyNow: "Aucun changement de régime assez marqué cette séance pour modifier la lecture des autres familles.",
      causalChain: [
        { statement: "Le 2s10s est à 54 pb, en territoire positif (non inversé).", status: "FACT" },
        { statement: "La pente de la courbe conditionne la lecture du repricing Fed, mais ne pilote pas directement l'Or.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si une nouvelle inversion changerait la lecture de régime."],
      whatWouldStrengthen: ["Une tendance de pentification durable accompagnée de baisses de taux Fed confirmées."],
      whatWouldWeakenOrInvalidate: ["Une courbe erratique et sans direction, sans signal de régime clair."],
    },
  },

  // ------------------------------------------------- F3: Fed / Rate Pricing
  "f3-target-lower": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Target range 4.25–4.50% — a level, not a directional signal on its own.",
      currentReadDetailed:
        "The current target range is the starting point for all repricing math elsewhere in F3, but the level itself carries no fixed Gold lean — only the priced path of change does.",
      whyNow: "Unchanged since the last meeting; nothing new to read from the level alone.",
      causalChain: [
        { statement: "Target range is 4.25%–4.50%.", status: "FACT" },
        { statement: "A static range carries no directional Gold implication by itself.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Timing of the next move, which lives in the meeting-distribution KPIs, not here."],
      whatWouldStrengthen: ["A shift in the priced distribution toward more/faster cuts."],
      whatWouldWeakenOrInvalidate: ["A hawkish surprise pushing the distribution toward holds."],
    },
    fr: {
      currentReadShort: "Fourchette cible 4,25–4,50 % — un niveau, pas un signal directionnel en soi.",
      currentReadDetailed:
        "La fourchette cible actuelle est le point de départ de tous les calculs de repricing ailleurs dans F3, mais le niveau lui-même ne porte aucun biais fixe pour l'Or — seule la trajectoire de changement anticipée en porte un.",
      whyNow: "Inchangée depuis la dernière réunion ; rien de nouveau à lire du niveau seul.",
      causalChain: [
        { statement: "La fourchette cible est de 4,25 % à 4,50 %.", status: "FACT" },
        { statement: "Une fourchette statique ne porte aucune implication directionnelle pour l'Or en elle-même.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Le calendrier du prochain mouvement, qui se lit dans les KPI de distribution de réunion, pas ici."],
      whatWouldStrengthen: ["Un basculement de la distribution anticipée vers des baisses plus nombreuses ou plus rapides."],
      whatWouldWeakenOrInvalidate: ["Une surprise hawkish poussant la distribution vers un maintien des taux."],
    },
  },
  "f3-target-upper": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Upper bound 4.50% — paired with the lower bound, defines the range; not directional alone.",
      currentReadDetailed: "Same reasoning as the lower bound: the range's edges are reference points for repricing, not a driver on their own.",
      whyNow: "No independent signal from the upper bound alone this session.",
      causalChain: [
        { statement: "Upper bound of the target range is 4.50%.", status: "FACT" },
        { statement: "Carries no independent directional implication for Gold.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Same as the lower bound — timing of the next range change."],
      whatWouldStrengthen: ["A confirmed cut that narrows or shifts the range."],
      whatWouldWeakenOrInvalidate: ["A prolonged hold with no shift in priced expectations."],
    },
    fr: {
      currentReadShort: "Borne supérieure 4,50 % — associée à la borne inférieure, définit la fourchette ; pas directionnelle seule.",
      currentReadDetailed: "Même raisonnement que pour la borne inférieure : les bornes de la fourchette sont des repères pour le repricing, pas un moteur en elles-mêmes.",
      whyNow: "Aucun signal indépendant de la borne supérieure seule cette séance.",
      causalChain: [
        { statement: "La borne supérieure de la fourchette cible est de 4,50 %.", status: "FACT" },
        { statement: "Ne porte aucune implication directionnelle indépendante pour l'Or.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Identique à la borne inférieure — le calendrier du prochain changement de fourchette."],
      whatWouldStrengthen: ["Une baisse confirmée qui resserre ou déplace la fourchette."],
      whatWouldWeakenOrInvalidate: ["Un maintien prolongé sans changement des anticipations."],
    },
  },

  // ---------------------------------------------------------- F4: Inflation
  "f4-core-cpi-mom": {
    evidenceState: "STRONG",
    contextualFinalGoldRead: "CONTEXTUAL",
    analystConclusions: {
      en: [
        {
          role: "A",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "An inline core CPI print gives neither the debasement-hedge nor the hawkish-reaction channel a clear edge — genuinely ambivalent.",
          keyPoints: ["0.3% matches both consensus and the prior month.", "No surprise for either channel to react to."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Agrees the print is ambivalent, but flags that Fed communication in the following days — not the print itself — will likely resolve which channel dominates.",
          keyPoints: ["Fed officials' characterization of the print matters more than the print.", "Watch F3's repricing and F2's real yields for the actual signal, not F4 alone."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "C",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Concurs — an inline print on its own carries essentially no information content for Gold's direction this session.",
          keyPoints: ["Base-rate reminder: most CPI prints land within a tenth of consensus and don't move the two-channel debate.", "No causal claim can be responsibly made from this print alone."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
      ],
      fr: [
        {
          role: "A",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Un chiffre de CPI core conforme ne donne un avantage net ni au canal de couverture contre la dévaluation, ni au canal de réaction hawkish — une réelle ambivalence.",
          keyPoints: ["0,3 % correspond à la fois au consensus et au mois précédent.", "Aucune surprise à laquelle l'un ou l'autre canal pourrait réagir."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Convient que le chiffre est ambivalent, mais signale que la communication de la Fed dans les jours suivants — et non le chiffre lui-même — déterminera probablement quel canal domine.",
          keyPoints: ["La façon dont les responsables de la Fed qualifient le chiffre compte plus que le chiffre lui-même.", "Surveiller le repricing de F3 et les taux réels de F2 pour le vrai signal, pas F4 seul."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "C",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "D'accord — un chiffre conforme, pris isolément, ne porte pratiquement aucun contenu informatif sur la direction de l'Or cette séance.",
          keyPoints: ["Rappel de taux de base : la plupart des chiffres de CPI atterrissent à un dixième du consensus près et ne font pas bouger le débat à deux canaux.", "Aucune affirmation causale ne peut être formulée de façon responsable à partir de ce seul chiffre."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
      ],
    },
    challengeFindings: {
      en: [
        {
          targetRole: "A",
          concern:
            "Role A's framing implicitly assumes the two channels are equally likely to dominate at any given time; no evidence in this context package actually establishes the market's current channel-weighting, so 'neither channel gets a clear edge' should not be overstated into 'both channels are equally live.'",
          epistemicStatus: "INFERENCE",
        },
      ],
      fr: [
        {
          targetRole: "A",
          concern:
            "Le cadrage du rôle A suppose implicitement que les deux canaux ont une probabilité égale de dominer à un instant donné ; aucun élément de ce contexte n'établit réellement la pondération actuelle des canaux par le marché, donc « aucun canal n'obtient d'avantage net » ne doit pas être surinterprété en « les deux canaux sont également actifs ».",
          epistemicStatus: "INFERENCE",
        },
      ],
    },
    en: {
      currentReadShort: "Core CPI MoM printed 0.28% vs 0.3% consensus — an inline print, reaction hinges on the Fed's reaction function.",
      currentReadDetailed:
        "This print landed essentially in line with consensus and the prior month. Per F4's two-channel mechanism, an inline print doesn't strongly favor either the debasement-hedge or hawkish-reaction channel — the market's read of Fed credibility at the time matters more than the print itself.",
      whyNow: "Corroborated wire coverage (Reuters/Bloomberg/BLS) confirms a 0.3% core CPI print, described consistently as 'in line' — no surprise to react to in either direction.",
      causalChain: [
        { statement: "Core CPI rose 0.3% MoM per BLS, matching the 0.3% consensus.", status: "FACT" },
        { statement: "An inline print gives neither the hedge nor the hawkish-reaction channel a clear edge.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether the Fed characterizes this print as consistent with its own forecast path."],
      whatWouldStrengthen: ["A subsequent print that surprises meaningfully in either direction, forcing the channel question."],
      whatWouldWeakenOrInvalidate: ["A hawkish Fed reaction despite the inline print — some officials front-running further tightening bias."],
    },
    fr: {
      currentReadShort: "Le CPI core en glissement mensuel ressort à 0,28 % contre 0,3 % de consensus — un chiffre conforme, la réaction dépendra de la fonction de réaction de la Fed.",
      currentReadDetailed:
        "Ce chiffre est ressorti essentiellement en ligne avec le consensus et le mois précédent. Selon le mécanisme à deux canaux de F4, un chiffre conforme ne favorise nettement ni le canal de couverture contre la dévaluation, ni le canal de réaction hawkish — la perception du marché sur la crédibilité de la Fed à cet instant compte davantage que le chiffre lui-même.",
      whyNow: "Une couverture d'agences corroborée (Reuters/Bloomberg/BLS) confirme un CPI core à 0,3 %, décrit de façon cohérente comme « conforme » — aucune surprise à laquelle réagir dans un sens ou dans l'autre.",
      causalChain: [
        { statement: "Le CPI core a progressé de 0,3 % en glissement mensuel selon le BLS, conforme au consensus de 0,3 %.", status: "FACT" },
        { statement: "Un chiffre conforme ne donne un avantage net ni au canal de couverture, ni au canal de réaction hawkish.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si la Fed qualifiera ce chiffre de cohérent avec sa propre trajectoire de prévision."],
      whatWouldStrengthen: ["Un chiffre suivant qui surprend nettement dans un sens ou l'autre, forçant la question du canal dominant."],
      whatWouldWeakenOrInvalidate: ["Une réaction hawkish de la Fed malgré le chiffre conforme — certains responsables anticipant un biais de resserrement supplémentaire."],
    },
  },
  "f4-core-cpi-yoy": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Core CPI YoY at 3.1% — still above target; trend context more than a fresh signal.",
      currentReadDetailed: "The year-over-year print is a trend confirmation of the MoM read, not new information this session. It stays neutral for the same two-channel reason as the MoM figure.",
      whyNow: "Consistent with the MoM print — no independent surprise.",
      causalChain: [
        { statement: "Core CPI YoY is 3.1%.", status: "FACT" },
        { statement: "This is a trend read, not a fresh surprise, given the MoM print already landed in line.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Base-effect distortions in the next few prints as year-ago comparisons roll off."],
      whatWouldStrengthen: ["A multi-month deceleration trend that changes the Fed's forecast path."],
      whatWouldWeakenOrInvalidate: ["A re-acceleration that reopens the 'sticky inflation' debate."],
    },
    fr: {
      currentReadShort: "Le CPI core en glissement annuel est à 3,1 % — toujours au-dessus de la cible ; un contexte de tendance plus qu'un signal nouveau.",
      currentReadDetailed: "Le chiffre en glissement annuel confirme la tendance du chiffre mensuel, sans apporter d'information nouvelle cette séance. Il reste neutre pour la même raison à deux canaux que le chiffre mensuel.",
      whyNow: "Cohérent avec le chiffre mensuel — aucune surprise indépendante.",
      causalChain: [
        { statement: "Le CPI core en glissement annuel est à 3,1 %.", status: "FACT" },
        { statement: "C'est une lecture de tendance, pas une surprise nouvelle, puisque le chiffre mensuel était déjà conforme.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Les distorsions d'effet de base sur les prochains chiffres à mesure que les comparaisons de l'an dernier sortent du calcul."],
      whatWouldStrengthen: ["Une tendance de désinflation sur plusieurs mois qui modifierait la trajectoire de prévision de la Fed."],
      whatWouldWeakenOrInvalidate: ["Une réaccélération qui relancerait le débat sur une inflation persistante."],
    },
  },
  "f4-core-pce-mom": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Core PCE MoM at 0.24% vs 0.2% consensus — a touch hot, but still inline by the Fed's own target measure.",
      currentReadDetailed:
        "Core PCE is the Fed's actual 2% target measure. This print is marginally above consensus but well within the range of typical noise — not enough to clearly favor either the hedge or hawkish-reaction channel.",
      whyNow: "Small beat versus the 0.2% consensus/previous, but not large enough on its own to force a channel verdict.",
      causalChain: [
        { statement: "Core PCE MoM is 0.24% vs a 0.2% consensus and prior.", status: "FACT" },
        { statement: "A marginal beat on the Fed's target measure is watched closely but not decisive alone.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether this marginal beat repeats next month, turning noise into a trend."],
      whatWouldStrengthen: ["A repeat beat next month alongside real yields failing to rise."],
      whatWouldWeakenOrInvalidate: ["A reversion to 0.2% or below next month."],
    },
    fr: {
      currentReadShort: "Le PCE core mensuel ressort à 0,24 % contre 0,2 % de consensus — un peu chaud, mais toujours conforme selon la mesure cible de la Fed elle-même.",
      currentReadDetailed:
        "Le PCE core est la mesure de la cible de 2 % réellement suivie par la Fed. Ce chiffre est légèrement au-dessus du consensus, mais bien dans la marge de bruit habituelle — pas suffisant pour favoriser nettement le canal de couverture ou le canal de réaction hawkish.",
      whyNow: "Léger dépassement par rapport au consensus/précédent de 0,2 %, mais pas assez marqué en soi pour trancher entre les deux canaux.",
      causalChain: [
        { statement: "Le PCE core mensuel est à 0,24 % contre un consensus et un précédent de 0,2 %.", status: "FACT" },
        { statement: "Un léger dépassement sur la mesure cible de la Fed est surveillé de près mais non décisif à lui seul.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si ce léger dépassement se répète le mois prochain, transformant le bruit en tendance."],
      whatWouldStrengthen: ["Un nouveau dépassement le mois prochain accompagné de taux réels qui ne montent pas."],
      whatWouldWeakenOrInvalidate: ["Un retour à 0,2 % ou moins le mois prochain."],
    },
  },
  "f4-core-pce-yoy": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Core PCE YoY at 2.8% — above the Fed's 2% target, but a trend figure, not a fresh signal today.",
      currentReadDetailed: "Confirms the MoM trend on the Fed's preferred gauge. Stays neutral for the same two-channel reasoning as every other F4 KPI.",
      whyNow: "No new information beyond the MoM print already covered.",
      causalChain: [
        { statement: "Core PCE YoY is 2.8%, above the Fed's 2% target.", status: "FACT" },
        { statement: "This is confirmatory of the MoM trend rather than a new signal.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["How much further disinflation the Fed expects over the next few quarters."],
      whatWouldStrengthen: ["A visible multi-quarter glide path back toward 2%."],
      whatWouldWeakenOrInvalidate: ["A stall or re-acceleration in the YoY trend."],
    },
    fr: {
      currentReadShort: "Le PCE core en glissement annuel est à 2,8 % — au-dessus de la cible de 2 % de la Fed, mais un chiffre de tendance, pas un signal nouveau aujourd'hui.",
      currentReadDetailed: "Confirme la tendance mensuelle sur la mesure préférée de la Fed. Reste neutre pour le même raisonnement à deux canaux que tous les autres KPI de F4.",
      whyNow: "Aucune information nouvelle au-delà du chiffre mensuel déjà couvert.",
      causalChain: [
        { statement: "Le PCE core en glissement annuel est à 2,8 %, au-dessus de la cible de 2 % de la Fed.", status: "FACT" },
        { statement: "Ceci confirme la tendance mensuelle plutôt qu'un signal nouveau.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["L'ampleur de la désinflation supplémentaire attendue par la Fed sur les prochains trimestres."],
      whatWouldStrengthen: ["Une trajectoire de retour visible vers 2 % sur plusieurs trimestres."],
      whatWouldWeakenOrInvalidate: ["Un blocage ou une réaccélération de la tendance annuelle."],
    },
  },

  // ---------------------------------------------- F5: Employment / Growth
  "f5-unemployment": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Unemployment at 4.1% — a labor-market level; the transmission to Gold runs entirely through Fed repricing.",
      currentReadDetailed:
        "This family has no direct mechanical link to Gold — it feeds the Fed's employment mandate, and it is the resulting shift in F3's priced cut odds (and F2's real yields) that actually matters. The level alone stays neutral.",
      whyNow: "No move large enough this session to have visibly shifted F3's priced cut odds on its own.",
      causalChain: [
        { statement: "Unemployment rate is 4.1%.", status: "FACT" },
        { statement: "The transmission channel to Gold runs through Fed repricing, not directly.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether a small further uptick would be enough to move F3's priced distribution."],
      whatWouldStrengthen: ["A rise here that visibly moves F3's cut odds and F2's real yields the same session."],
      whatWouldWeakenOrInvalidate: ["A move that leaves F3 pricing unchanged — i.e. already priced in."],
    },
    fr: {
      currentReadShort: "Le chômage est à 4,1 % — un niveau de marché du travail ; la transmission vers l'Or passe entièrement par le repricing de la Fed.",
      currentReadDetailed:
        "Cette famille n'a aucun lien mécanique direct avec l'Or — elle alimente le mandat d'emploi de la Fed, et c'est le déplacement qui en résulte dans les probabilités de baisse anticipées de F3 (et les taux réels de F2) qui compte réellement. Le niveau seul reste neutre.",
      whyNow: "Aucun mouvement assez marqué cette séance pour avoir visiblement déplacé les probabilités de baisse anticipées de F3.",
      causalChain: [
        { statement: "Le taux de chômage est à 4,1 %.", status: "FACT" },
        { statement: "Le canal de transmission vers l'Or passe par le repricing de la Fed, pas directement.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si une légère hausse supplémentaire suffirait à déplacer la distribution anticipée de F3."],
      whatWouldStrengthen: ["Une hausse ici qui déplace visiblement les probabilités de baisse de F3 et les taux réels de F2 la même séance."],
      whatWouldWeakenOrInvalidate: ["Un mouvement qui laisse le pricing de F3 inchangé — c'est-à-dire déjà anticipé."],
    },
  },
  "f5-payrolls-latest": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "SUPPORTIVE",
    analystConclusions: {
      en: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "A headline miss compounded by negative revisions is a genuinely weak report — the dovish repricing this implies is mildly supportive for Gold.",
          keyPoints: ["142k vs 150k consensus.", "-25k two-month net revision compounds the miss into a real trend, not noise."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "The report is weak, but whether it's Gold-supportive depends entirely on whether F3's cut odds and F2's real yields actually moved on it — that co-movement isn't independently confirmed here.",
          keyPoints: ["No direct evidence in this context package that F3/F2 moved this session.", "A weak print the market had already priced in produces no fresh transmission."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
      ],
      fr: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "Un manque au niveau du chiffre principal, aggravé par des révisions négatives, constitue un rapport réellement faible — le repricing dovish que cela implique est légèrement favorable pour l'Or.",
          keyPoints: ["142k contre 150k de consensus.", "Une révision nette de -25k sur deux mois transforme le manque en une vraie tendance, pas du bruit."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Le rapport est faible, mais son caractère favorable pour l'Or dépend entièrement du fait que les probabilités de baisse de F3 et les taux réels de F2 aient réellement bougé en réaction — ce co-mouvement n'est pas confirmé de façon indépendante ici.",
          keyPoints: ["Aucune preuve directe dans ce contexte que F3/F2 ont bougé cette séance.", "Un chiffre faible déjà anticipé par le marché ne produit aucune transmission nouvelle."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
      ],
    },
    en: {
      currentReadShort: "Payrolls missed at 142k vs 150k consensus — a soft print that leans dovish for Fed pricing.",
      currentReadDetailed:
        "A headline miss, and per the locked F5 mechanism this reads as more genuinely weak when paired with negative revisions (see the 2M Net Revision KPI, currently -25k). A weak print that visibly nudges F3's cut odds and F2's real yields lower is the actual Gold-relevant transmission — that co-movement is present enough here to lean supportive under this mock scenario.",
      whyNow: "142k vs 150k consensus, compounded by a -25k two-month net revision — the combination reads as a genuinely soft report, not just a headline miss.",
      causalChain: [
        { statement: "Payrolls printed 142k vs a 150k consensus.", status: "FACT" },
        { statement: "The prior two months were revised down a net 25k.", status: "FACT" },
        { statement: "A miss compounded by negative revisions tends to nudge Fed cut-odds pricing lower (more dovish).", status: "INFERENCE" },
        { statement: "Under this session's reaction, that dovish nudge is read as mildly supportive for Gold.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Whether F3's priced cut odds actually moved on this print, or were already anticipating softness."],
      whatWouldStrengthen: ["F3's cut-odds distribution and F2's real yields moving the same direction this session."],
      whatWouldWeakenOrInvalidate: ["The market treating the miss as already priced in, with no follow-through in rates."],
    },
    fr: {
      currentReadShort: "Les créations d'emplois manquent à 142k contre 150k de consensus — un chiffre mou qui penche dovish pour le pricing Fed.",
      currentReadDetailed:
        "Un manque au niveau du chiffre principal, et selon le mécanisme verrouillé de F5, cela se lit comme un signal réellement faible lorsqu'il s'accompagne de révisions négatives (voir le KPI de révision nette sur 2 mois, actuellement -25k). Un chiffre faible qui déplace visiblement à la baisse les probabilités de baisse de F3 et les taux réels de F2 constitue la vraie transmission pertinente pour l'Or — ce co-mouvement est présent ici de façon suffisante pour pencher vers un lecture favorable sous ce scénario mock.",
      whyNow: "142k contre 150k de consensus, aggravé par une révision nette de -25k sur deux mois — la combinaison se lit comme un rapport réellement faible, pas seulement un manque sur le chiffre principal.",
      causalChain: [
        { statement: "Les créations d'emplois sont ressorties à 142k contre un consensus de 150k.", status: "FACT" },
        { statement: "Les deux mois précédents ont été révisés à la baisse de 25k nets.", status: "FACT" },
        { statement: "Un manque aggravé par des révisions négatives tend à faire baisser les probabilités de baisse Fed anticipées (plus dovish).", status: "INFERENCE" },
        { statement: "Sous la réaction de cette séance, cette inflexion dovish se lit comme légèrement favorable pour l'Or.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si les probabilités de baisse anticipées de F3 ont réellement bougé sur ce chiffre, ou si elles anticipaient déjà la faiblesse."],
      whatWouldStrengthen: ["La distribution des probabilités de baisse de F3 et les taux réels de F2 bougeant dans le même sens cette séance."],
      whatWouldWeakenOrInvalidate: ["Le marché traitant le manque comme déjà anticipé, sans suite sur les taux."],
    },
  },
  "f5-gdpnow": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "GDPNow at 2.3% — a growth nowcast; feeds Fed expectations, no direct Gold link of its own.",
      currentReadDetailed: "Like the rest of F5, this is context for the Fed's reaction function rather than a direct Gold driver. A solid nowcast argues against urgency to cut; a weak one argues for it.",
      whyNow: "2.3% is a moderate, unremarkable growth pace — no strong signal either way this session.",
      causalChain: [
        { statement: "GDPNow nowcast stands at 2.3%.", status: "FACT" },
        { statement: "A moderate growth nowcast doesn't strongly argue for either faster or slower Fed action.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["How much the nowcast will revise as more source data arrives this quarter."],
      whatWouldStrengthen: ["A sharp downside revision alongside softening labor data."],
      whatWouldWeakenOrInvalidate: ["A sharp upside revision that removes urgency for Fed easing."],
    },
    fr: {
      currentReadShort: "GDPNow à 2,3 % — une prévision instantanée de croissance ; alimente les anticipations Fed, aucun lien direct avec l'Or.",
      currentReadDetailed: "Comme le reste de F5, c'est un contexte pour la fonction de réaction de la Fed plutôt qu'un moteur direct de l'Or. Une prévision solide plaide contre l'urgence de baisser les taux ; une prévision faible plaide pour.",
      whyNow: "2,3 % est un rythme de croissance modéré, sans particularité — aucun signal fort dans un sens ou l'autre cette séance.",
      causalChain: [
        { statement: "La prévision instantanée GDPNow s'établit à 2,3 %.", status: "FACT" },
        { statement: "Une prévision de croissance modérée ne plaide fortement ni pour une action Fed plus rapide, ni plus lente.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["L'ampleur des révisions de la prévision à mesure que d'autres données sources arrivent ce trimestre."],
      whatWouldStrengthen: ["Une forte révision à la baisse accompagnée d'un ramollissement des données d'emploi."],
      whatWouldWeakenOrInvalidate: ["Une forte révision à la hausse qui retirerait l'urgence d'un assouplissement Fed."],
    },
  },

  // -------------------------------------------------------- F6: USD / FX
  "f6-dxy-recon-level": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Reconstructed DXY at 104.62 — a level; today's and 5-day momentum are diverging, so no single-direction read.",
      currentReadDetailed: "The level itself is a snapshot; USD State already flags the divergence between today's and 5-day momentum. Reading the level alone risks missing that divergence.",
      whyNow: "Divergent short-horizon momentum (see Today % / 5D %) means the level alone doesn't resolve to a clean signal.",
      causalChain: [
        { statement: "Reconstructed DXY is at 104.62.", status: "FACT" },
        { statement: "Today's and 5-day momentum currently point in different directions.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Which horizon (intraday or multi-day) will dominate the next session."],
      whatWouldStrengthen: ["Today % and 5D % converging on the same direction."],
      whatWouldWeakenOrInvalidate: ["Continued divergence, which keeps this a genuinely mixed read."],
    },
    fr: {
      currentReadShort: "Le DXY reconstruit est à 104,62 — un niveau ; les dynamiques du jour et sur 5 jours divergent, donc pas de lecture univoque.",
      currentReadDetailed: "Le niveau lui-même est une photo instantanée ; l'état du dollar signale déjà la divergence entre la dynamique du jour et celle sur 5 jours. Lire le niveau seul risque de manquer cette divergence.",
      whyNow: "Une dynamique court terme divergente (voir Aujourd'hui % / 5J %) fait que le niveau seul ne se résout pas en un signal net.",
      causalChain: [
        { statement: "Le DXY reconstruit est à 104,62.", status: "FACT" },
        { statement: "Les dynamiques du jour et sur 5 jours pointent actuellement dans des directions différentes.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Quel horizon (intrajournalier ou pluri-journalier) dominera la prochaine séance."],
      whatWouldStrengthen: ["Aujourd'hui % et 5J % convergeant dans la même direction."],
      whatWouldWeakenOrInvalidate: ["Une divergence persistante, qui maintiendrait une lecture réellement mixte."],
    },
  },
  "f6-usd-state": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "USD State: divergent — weaker intraday, firmer over 5 days; no clean single-direction read.",
      currentReadDetailed:
        "This is a plain-language flag of the same divergence captured numerically in Today %/5D %. Per the locked F6 mechanism, a single consistent trend (not present right now) is what would sharpen this into a clear read.",
      whyNow: "Reported by the backend as the current state given the sign mismatch between Today % and 5D %.",
      causalChain: [
        { statement: "Today % is negative while 5D % is positive.", status: "FACT" },
        { statement: "A sign mismatch across horizons is read as a divergent, not a directional, USD state.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether the divergence resolves toward the intraday or the multi-day direction."],
      whatWouldStrengthen: ["Both horizons aligning on the same sign."],
      whatWouldWeakenOrInvalidate: ["Nothing to invalidate — divergence is itself the accurate, honest read right now."],
    },
    fr: {
      currentReadShort: "État du dollar : divergent — plus faible en intrajournalier, plus ferme sur 5 jours ; pas de lecture univoque.",
      currentReadDetailed:
        "Ceci est un signal en langage clair de la même divergence déjà captée numériquement dans Aujourd'hui %/5J %. Selon le mécanisme verrouillé de F6, seule une tendance unique et cohérente (absente actuellement) permettrait d'affiner cela en une lecture nette.",
      whyNow: "Signalé par le backend comme l'état actuel compte tenu de la discordance de signe entre Aujourd'hui % et 5J %.",
      causalChain: [
        { statement: "Aujourd'hui % est négatif alors que 5J % est positif.", status: "FACT" },
        { statement: "Une discordance de signe entre horizons se lit comme un état du dollar divergent, pas directionnel.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si la divergence se résout vers la direction intrajournalière ou pluri-journalière."],
      whatWouldStrengthen: ["Les deux horizons s'alignant sur le même signe."],
      whatWouldWeakenOrInvalidate: ["Rien à invalider — la divergence est elle-même la lecture honnête et exacte à l'heure actuelle."],
    },
  },

  // ------------------------------------------------ F7: Risk / Credit / Vol
  "f7-vix": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "VIX at 14.85 — calm equity-vol regime; context for other families, not a Gold-specific signal.",
      currentReadDetailed: "A low VIX print signals a calm risk backdrop generally. Per the locked F7 mechanism, VIX cannot be mechanically mapped to a Gold direction — it conditions how to read other moves, not a standalone signal.",
      whyNow: "14.85 is comfortably below levels associated with acute stress — a quiet-conditions read.",
      causalChain: [
        { statement: "VIX is 14.85, a low reading.", status: "FACT" },
        { statement: "Low VIX signals calm broad risk conditions, not a Gold-specific direction.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["How quickly conditions could shift given the low starting vol level."],
      whatWouldStrengthen: ["A VIX spike alongside falling real yields (F2) and a falling dollar (F6) — a genuine risk-off read."],
      whatWouldWeakenOrInvalidate: ["A VIX spike that also sells Gold alongside equities (forced deleveraging)."],
    },
    fr: {
      currentReadShort: "Le VIX est à 14,85 — régime de volatilité actions calme ; contexte pour les autres familles, pas un signal spécifique à l'Or.",
      currentReadDetailed: "Un VIX bas signale globalement un contexte de risque calme. Selon le mécanisme verrouillé de F7, le VIX ne peut pas être associé mécaniquement à une direction pour l'Or — il sert à conditionner la lecture d'autres mouvements, pas comme signal autonome.",
      whyNow: "14,85 est confortablement sous les niveaux associés à un stress aigu — une lecture de conditions calmes.",
      causalChain: [
        { statement: "Le VIX est à 14,85, un niveau bas.", status: "FACT" },
        { statement: "Un VIX bas signale des conditions de risque globalement calmes, pas une direction spécifique à l'Or.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["La rapidité avec laquelle les conditions pourraient basculer étant donné le niveau de vol de départ bas."],
      whatWouldStrengthen: ["Un pic du VIX accompagné de taux réels en baisse (F2) et d'un dollar en baisse (F6) — une lecture de véritable risk-off."],
      whatWouldWeakenOrInvalidate: ["Un pic du VIX qui vend aussi l'Or en même temps que les actions (désendettement forcé)."],
    },
  },
  "f7-move": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "MOVE at 92.4 — moderate rates volatility; a financial-conditions gauge, not a direct Gold signal.",
      currentReadDetailed: "Rates volatility sits at a moderate level. Like VIX, this is context for interpreting other families rather than a standalone Gold driver.",
      whyNow: "No extreme reading in either direction this session.",
      causalChain: [
        { statement: "MOVE index is at 92.4.", status: "FACT" },
        { statement: "A moderate reading implies no unusual rates-market stress right now.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Sensitivity to the next major rates catalyst (FOMC, CPI)."],
      whatWouldStrengthen: ["A MOVE spike coinciding with a scheduled catalyst per F13."],
      whatWouldWeakenOrInvalidate: ["A spike with no clear catalyst — closer to noise than signal."],
    },
    fr: {
      currentReadShort: "Le MOVE est à 92,4 — volatilité des taux modérée ; un indicateur de conditions financières, pas un signal direct pour l'Or.",
      currentReadDetailed: "La volatilité des taux se situe à un niveau modéré. Comme le VIX, il s'agit d'un contexte pour interpréter d'autres familles plutôt qu'un moteur autonome de l'Or.",
      whyNow: "Aucune lecture extrême dans un sens ou l'autre cette séance.",
      causalChain: [
        { statement: "L'indice MOVE est à 92,4.", status: "FACT" },
        { statement: "Un niveau modéré implique l'absence de stress inhabituel sur le marché des taux actuellement.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["La sensibilité au prochain catalyseur majeur sur les taux (FOMC, CPI)."],
      whatWouldStrengthen: ["Un pic du MOVE coïncidant avec un catalyseur programmé selon F13."],
      whatWouldWeakenOrInvalidate: ["Un pic sans catalyseur clair — plus proche du bruit que d'un signal."],
    },
  },
  "f7-hy-oas": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "ADVERSE",
    analystConclusions: {
      en: [
        {
          role: "A",
          finalGoldRead: "ADVERSE",
          shortConclusion: "Tight HY spreads signal broad risk complacency; reduced hedging demand should be mildly adverse for Gold near-term.",
          keyPoints: ["HY OAS at 312bps is near the tighter end of its historical range.", "Complacent credit conditions have historically coincided with reduced safe-haven flows."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Spread tightness alone doesn't resolve Gold's direction — central-bank and ETF demand channels are structurally independent of the credit cycle.",
          keyPoints: ["No observed correlation this session between HY OAS and Gold flows.", "Structural central-bank buying is documented as largely real-yield- and credit-cycle-insensitive."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "C",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Treating tight spreads as a Gold catalyst risks reverse-causality: a calm macro backdrop suppresses volatility broadly, including credit, without implying anything Gold-specific.",
          keyPoints: ["Conflating a shared root cause (a calm macro regime) with a direct causal link between credit spreads and Gold.", "One session's reading is too small a sample to assert a mechanism."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
      ],
      fr: [
        {
          role: "A",
          finalGoldRead: "ADVERSE",
          shortConclusion: "Des spreads HY resserrés signalent une complaisance générale face au risque ; une demande de couverture réduite devrait être légèrement défavorable pour l'Or à court terme.",
          keyPoints: ["Le HY OAS à 312 pb est proche de l'extrémité resserrée de sa fourchette historique.", "Des conditions de crédit complaisantes ont historiquement coïncidé avec des flux de couverture réduits."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Le resserrement des spreads seul ne tranche pas la direction de l'Or — les canaux de demande des banques centrales et des ETF sont structurellement indépendants du cycle du crédit.",
          keyPoints: ["Aucune corrélation observée cette séance entre le HY OAS et les flux sur l'Or.", "Les achats structurels des banques centrales sont documentés comme largement insensibles aux taux réels et au cycle du crédit."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "C",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "Traiter des spreads resserrés comme un catalyseur pour l'Or risque une causalité inversée : un contexte macro calme comprime la volatilité de façon généralisée, y compris le crédit, sans rien impliquer de spécifique à l'Or.",
          keyPoints: ["Confondre une cause commune (un régime macro calme) avec un lien causal direct entre spreads de crédit et Or.", "La lecture d'une seule séance est un échantillon trop restreint pour affirmer un mécanisme."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
      ],
    },
    challengeFindings: {
      en: [
        {
          targetRole: "A",
          concern:
            "Role A's causal claim ('complacent credit → reduced safe-haven demand → adverse for Gold') is an unsupported leap: this context package contains no direct evidence that HY OAS tightness and Gold flows are actually correlated, let alone causally linked, in the current session. This reads as a plausible narrative retrofitted onto two independently observed levels, not a demonstrated mechanism — the classic mechanical-vs-current-causality confusion this challenge stage exists to catch.",
          epistemicStatus: "HYPOTHESIS",
        },
        {
          targetRole: "A",
          concern:
            "The 'historically coincided' claim in Role A's key points cites no specific, checkable historical episode or source — it reads as an assumed prior rather than a corroborated claim, and should be downgraded from an implied FACT/INFERENCE to an explicit HYPOTHESIS pending real evidence.",
          epistemicStatus: "UNKNOWN",
        },
      ],
      fr: [
        {
          targetRole: "A",
          concern:
            "L'affirmation causale du rôle A (« crédit complaisant → demande de couverture réduite → défavorable pour l'Or ») est un raccourci non étayé : ce contexte ne contient aucune preuve directe que le resserrement du HY OAS et les flux sur l'Or sont réellement corrélés, encore moins causalement liés, lors de cette séance. Cela se lit comme un récit plausible plaqué sur deux niveaux observés indépendamment, pas comme un mécanisme démontré — exactement la confusion entre mécanisme et causalité actuelle que cette étape de contre-analyse est censée détecter.",
          epistemicStatus: "HYPOTHESIS",
        },
        {
          targetRole: "A",
          concern:
            "L'affirmation « ont historiquement coïncidé » dans les points clés du rôle A ne cite aucun épisode historique précis et vérifiable, ni aucune source — elle se lit comme un a priori supposé plutôt qu'une affirmation corroborée, et devrait être rétrogradée d'un FAIT/INFÉRENCE implicite à une HYPOTHÈSE explicite en attendant de véritables preuves.",
          epistemicStatus: "UNKNOWN",
        },
      ],
    },
    en: {
      currentReadShort: "HY OAS at 312bps — spreads are historically tight, a complacent-credit backdrop.",
      currentReadDetailed:
        "Tight high-yield spreads signal a complacent, risk-friendly credit backdrop under this mock scenario. Per F7's own framing this is context, not a direct Gold signal, but a genuinely calm credit market can, under this scenario, be read as mildly reducing safe-haven urgency.",
      whyNow: "312bps sits on the tighter end of the historical range, suggesting little credit-market stress priced right now.",
      causalChain: [
        { statement: "HY OAS is 312bps, historically tight.", status: "FACT" },
        { statement: "Tight spreads suggest a complacent, low-stress credit backdrop.", status: "INFERENCE" },
        { statement: "Under this scenario, reduced credit stress is read as mildly reducing near-term safe-haven demand.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Whether tight spreads simply reflect calm conditions or complacency ahead of a shock."],
      whatWouldStrengthen: ["A sudden widening alongside falling equities and a falling dollar."],
      whatWouldWeakenOrInvalidate: ["Spreads staying tight for an extended period with no shock — this scenario would just fade."],
    },
    fr: {
      currentReadShort: "Le HY OAS est à 312 pb — des spreads historiquement resserrés, un contexte de crédit complaisant.",
      currentReadDetailed:
        "Des spreads high-yield resserrés signalent un contexte de crédit complaisant et favorable au risque sous ce scénario mock. Selon le cadrage propre de F7, il s'agit de contexte, pas d'un signal direct pour l'Or, mais un marché du crédit véritablement calme peut, sous ce scénario, se lire comme réduisant légèrement l'urgence de couverture.",
      whyNow: "312 pb se situe dans la partie resserrée de la fourchette historique, suggérant peu de stress de marché du crédit anticipé actuellement.",
      causalChain: [
        { statement: "Le HY OAS est à 312 pb, historiquement resserré.", status: "FACT" },
        { statement: "Des spreads resserrés suggèrent un contexte de crédit complaisant et à faible stress.", status: "INFERENCE" },
        { statement: "Sous ce scénario, la baisse du stress de crédit se lit comme réduisant légèrement la demande de couverture à court terme.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si les spreads resserrés reflètent simplement des conditions calmes ou une complaisance avant un choc."],
      whatWouldStrengthen: ["Un élargissement soudain accompagné d'actions en baisse et d'un dollar en baisse."],
      whatWouldWeakenOrInvalidate: ["Des spreads restant resserrés durablement sans choc — ce scénario s'estomperait simplement."],
    },
  },

  // ------------------------------------------------ F8: Liquidity / Funding
  "f8-reserves-wow": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Reserves +$18B WoW — a system-liquidity data point; matters alongside F7's financial-conditions read, not alone.",
      currentReadDetailed: "A reserves build is one input to the system-liquidity picture. Per F8's locked framing, 'balance sheet up = everything rallies' is a well-known trap, so this stays neutral/contextual on its own.",
      whyNow: "A moderate weekly build, not large enough to be a standalone signal.",
      causalChain: [
        { statement: "Bank reserves rose $18B week-over-week.", status: "FACT" },
        { statement: "A moderate reserves build is one liquidity input among several, not a standalone signal.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether this build is driven by TGA drawdown mechanics or genuine reserve growth."],
      whatWouldStrengthen: ["A reserves move coinciding with a broader financial-conditions shift in F7."],
      whatWouldWeakenOrInvalidate: ["A build purely from routine issuance mechanics with no F7 corroboration."],
    },
    fr: {
      currentReadShort: "Les réserves progressent de +18 Md$ sur la semaine — une donnée de liquidité systémique ; compte surtout avec la lecture de F7, pas isolément.",
      currentReadDetailed: "Une hausse des réserves est une donnée d'entrée parmi d'autres dans le tableau de liquidité systémique. Selon le cadrage verrouillé de F8, « bilan en hausse = tout monte » est un piège bien connu, donc ceci reste neutre/contextuel en soi.",
      whyNow: "Une hausse hebdomadaire modérée, pas assez marquée pour constituer un signal autonome.",
      causalChain: [
        { statement: "Les réserves bancaires ont augmenté de 18 Md$ sur la semaine.", status: "FACT" },
        { statement: "Une hausse modérée des réserves est une donnée de liquidité parmi d'autres, pas un signal autonome.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si cette hausse est portée par la mécanique de baisse du TGA ou une véritable croissance des réserves."],
      whatWouldStrengthen: ["Un mouvement de réserves coïncidant avec un changement plus large des conditions financières dans F7."],
      whatWouldWeakenOrInvalidate: ["Une hausse purement liée à la mécanique d'émission courante sans corroboration de F7."],
    },
  },
  "f8-tga-daily": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "SUPPORTIVE",
    analystConclusions: {
      en: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "A TGA drawdown mechanically adds reserves to the banking system; under this scenario, that added liquidity is mildly supportive.",
          keyPoints: ["Same-day $12B TGA decline.", "TGA drawdowns are a direct, mechanical add to bank reserves."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "The mechanical liquidity add is real, but whether it's Gold-relevant depends on whether F7's broader financial-conditions read moved alongside it — that corroboration isn't established here.",
          keyPoints: ["A $12B move is routine cash-management size, not unusual.", "No F7 corroboration cited in this context package for this session."],
          dataVerification: "Mock illustrative content — no live web verification was performed (development fixture, not a real search result).",
        },
      ],
      fr: [
        {
          role: "A",
          finalGoldRead: "SUPPORTIVE",
          shortConclusion: "Une baisse du TGA ajoute mécaniquement des réserves au système bancaire ; sous ce scénario, cette liquidité ajoutée est légèrement favorable.",
          keyPoints: ["Baisse du TGA de 12 Md$ sur la journée.", "Les baisses du TGA sont un ajout direct et mécanique aux réserves bancaires."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
        {
          role: "B",
          finalGoldRead: "CONTEXTUAL",
          shortConclusion: "L'ajout mécanique de liquidité est réel, mais sa pertinence pour l'Or dépend de si la lecture plus large des conditions financières de F7 a bougé en parallèle — cette corroboration n'est pas établie ici.",
          keyPoints: ["Un mouvement de 12 Md$ est une taille de gestion de trésorerie courante, rien d'inhabituel.", "Aucune corroboration de F7 citée dans ce contexte pour cette séance."],
          dataVerification: "Contenu illustratif mock — aucune vérification web réelle n'a été effectuée (fixture de développement, pas un vrai résultat de recherche).",
        },
      ],
    },
    en: {
      currentReadShort: "TGA fell $12B on the day — a drawdown that adds reserves to the system, mildly liquidity-supportive.",
      currentReadDetailed:
        "A TGA drawdown mechanically adds reserves to the banking system. Per F8's own caveat this is financial-conditions context rather than a Gold-specific signal, but under this mock scenario the added liquidity is read as mildly supportive.",
      whyNow: "A same-day $12B TGA decline is a moderate, not extreme, drawdown.",
      causalChain: [
        { statement: "TGA fell $12B on the day.", status: "FACT" },
        { statement: "A TGA drawdown mechanically adds reserves to the banking system.", status: "FACT" },
        { statement: "Under this scenario, added system liquidity is read as mildly supportive for risk assets including Gold.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Whether this is routine cash-management noise or the start of a larger drawdown trend."],
      whatWouldStrengthen: ["A sustained multi-week drawdown trend coinciding with looser financial conditions in F7."],
      whatWouldWeakenOrInvalidate: ["A one-off drawdown followed immediately by a TGA rebuild."],
    },
    fr: {
      currentReadShort: "Le TGA a baissé de 12 Md$ sur la journée — une baisse qui ajoute des réserves au système, légèrement favorable à la liquidité.",
      currentReadDetailed:
        "Une baisse du TGA ajoute mécaniquement des réserves au système bancaire. Selon la réserve propre de F8, il s'agit d'un contexte de conditions financières plutôt que d'un signal spécifique à l'Or, mais sous ce scénario mock, la liquidité ajoutée se lit comme légèrement favorable.",
      whyNow: "Une baisse du TGA de 12 Md$ sur la journée est une baisse modérée, pas extrême.",
      causalChain: [
        { statement: "Le TGA a baissé de 12 Md$ sur la journée.", status: "FACT" },
        { statement: "Une baisse du TGA ajoute mécaniquement des réserves au système bancaire.", status: "FACT" },
        { statement: "Sous ce scénario, la liquidité systémique ajoutée se lit comme légèrement favorable pour les actifs à risque, dont l'Or.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir s'il s'agit de bruit de gestion de trésorerie courant ou du début d'une tendance de baisse plus large."],
      whatWouldStrengthen: ["Une tendance de baisse durable sur plusieurs semaines coïncidant avec un assouplissement des conditions financières dans F7."],
      whatWouldWeakenOrInvalidate: ["Une baisse ponctuelle immédiatement suivie d'une reconstitution du TGA."],
    },
  },
  "f8-funding-microstate": {
    evidenceState: "MODERATE",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Funding microstate: NORMAL — no funding stress detected.",
      currentReadDetailed: "A NORMAL read across SOFR-IORB/EFFR-IORB spreads means no funding-market stress worth flagging. This is a quiet, non-signal state by design.",
      whyNow: "Both underlying spreads (SOFR-IORB, EFFR-IORB) are within normal ranges.",
      causalChain: [
        { statement: "SOFR-IORB and EFFR-IORB spreads are both within normal ranges.", status: "FACT" },
        { statement: "A NORMAL funding microstate implies no near-term liquidity-stress signal.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["How quickly this could shift around a large Treasury settlement or quarter-end."],
      whatWouldStrengthen: ["N/A — this is a quiet-state read; a shift to STRESSED would be the notable event."],
      whatWouldWeakenOrInvalidate: ["A spread breakout above normal ranges."],
    },
    fr: {
      currentReadShort: "Micro-état de financement : NORMAL — aucun stress de financement détecté.",
      currentReadDetailed: "Une lecture NORMAL sur les spreads SOFR-IORB/EFFR-IORB signifie l'absence de stress de marché de financement à signaler. C'est un état calme, sans signal, par construction.",
      whyNow: "Les deux spreads sous-jacents (SOFR-IORB, EFFR-IORB) sont dans des fourchettes normales.",
      causalChain: [
        { statement: "Les spreads SOFR-IORB et EFFR-IORB sont tous deux dans des fourchettes normales.", status: "FACT" },
        { statement: "Un micro-état de financement NORMAL implique l'absence de signal de stress de liquidité à court terme.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["La rapidité avec laquelle cela pourrait basculer autour d'un règlement important du Trésor ou d'une fin de trimestre."],
      whatWouldStrengthen: ["N/A — c'est une lecture d'état calme ; un basculement vers STRESSED serait l'événement notable."],
      whatWouldWeakenOrInvalidate: ["Une sortie de fourchette d'un spread au-dessus des niveaux normaux."],
    },
  },

  // ---------------------------------------------- F10: Flows / Positioning
  "f10-mm-net-pct": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Managed Money net long 38.4% of OI — moderate positioning, not stretched in either direction.",
      currentReadDetailed: "A mid-range positioning reading conditions how far a move can extend or how sharply it can reverse — per F10's locked framing, it doesn't drive direction on its own, and 38.4% is not near a historical extreme.",
      whyNow: "38.4% sits inside a normal range for this measure — no crowding extreme to flag.",
      causalChain: [
        { statement: "Managed Money net long position is 38.4% of open interest.", status: "FACT" },
        { statement: "A mid-range reading implies neither an unusually crowded nor unusually washed-out setup.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["How stale this weekly reading is relative to the current session's price action."],
      whatWouldStrengthen: ["A move toward a positioning extreme (per the 156W percentile) in either direction."],
      whatWouldWeakenOrInvalidate: ["Continued mid-range readings with no clear extreme forming."],
    },
    fr: {
      currentReadShort: "Le Managed Money est net acheteur à 38,4 % de l'OI — un positionnement modéré, pas tendu dans un sens ou l'autre.",
      currentReadDetailed: "Une lecture de positionnement médiane conditionne l'ampleur possible d'un mouvement ou la brutalité d'un renversement — selon le cadrage verrouillé de F10, elle ne pilote pas la direction en elle-même, et 38,4 % n'est pas proche d'un extrême historique.",
      whyNow: "38,4 % se situe dans une fourchette normale pour cette mesure — aucun extrême d'encombrement à signaler.",
      causalChain: [
        { statement: "La position nette acheteuse du Managed Money est de 38,4 % de l'open interest.", status: "FACT" },
        { statement: "Une lecture médiane n'implique ni un positionnement inhabituellement encombré, ni inhabituellement purgé.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Le degré d'obsolescence de cette lecture hebdomadaire par rapport à l'action des prix de la séance actuelle."],
      whatWouldStrengthen: ["Un mouvement vers un extrême de positionnement (selon le percentile sur 156 semaines) dans un sens ou l'autre."],
      whatWouldWeakenOrInvalidate: ["Des lectures médianes persistantes sans extrême clair qui se forme."],
    },
  },

  // ------------------------------------------------- F11: Gold Options / Vol
  "f11-gvz": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "Gold vol (GVZ proxy) at 15.8 — moderate event risk priced; not a directional signal.",
      currentReadDetailed: "This measures how much movement the options market expects, not which direction. Per F11's locked framing this proxy stays neutral by design.",
      whyNow: "15.8 is a moderate reading, consistent with routine event-risk pricing ahead of upcoming catalysts.",
      causalChain: [
        { statement: "GLD-options-proxy implied vol (GVZ) is 15.8.", status: "FACT" },
        { statement: "A moderate vol level implies routine, not extreme, priced event risk.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["This is a GLD-options proxy, not true Gold CVOL/skew — treat precision claims cautiously."],
      whatWouldStrengthen: ["A rise coinciding with a known catalyst window (FOMC/CPI, per F13)."],
      whatWouldWeakenOrInvalidate: ["A single-day move with no catalyst nearby — closer to noise on this thin proxy."],
    },
    fr: {
      currentReadShort: "La vol de l'Or (proxy GVZ) est à 15,8 — un risque d'événement modéré anticipé ; pas un signal directionnel.",
      currentReadDetailed: "Ceci mesure l'ampleur du mouvement attendu par le marché des options, pas sa direction. Selon le cadrage verrouillé de F11, ce proxy reste neutre par construction.",
      whyNow: "15,8 est une lecture modérée, cohérente avec un pricing de risque d'événement courant avant les prochains catalyseurs.",
      causalChain: [
        { statement: "La volatilité implicite du proxy d'options GLD (GVZ) est à 15,8.", status: "FACT" },
        { statement: "Un niveau de volatilité modéré implique un risque d'événement anticipé courant, pas extrême.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Il s'agit d'un proxy d'options GLD, pas du véritable CVOL/skew de l'Or — traiter toute revendication de précision avec prudence."],
      whatWouldStrengthen: ["Une hausse coïncidant avec une fenêtre de catalyseur connue (FOMC/CPI, selon F13)."],
      whatWouldWeakenOrInvalidate: ["Un mouvement d'une seule journée sans catalyseur proche — plus proche du bruit sur ce proxy peu profond."],
    },
  },
  "f11-gvz-1d": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "GVZ proxy +0.3 on the day — a small uptick, within normal daily noise for this measure.",
      currentReadDetailed: "A small single-day change on a thin proxy measure; not large enough to read as a shift in priced event risk.",
      whyNow: "+0.3 is within the typical day-to-day noise band for this gauge.",
      causalChain: [
        { statement: "GVZ proxy rose 0.3 on the day.", status: "FACT" },
        { statement: "A move this small is within normal daily noise, not a signal.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether this accumulates into a multi-day trend."],
      whatWouldStrengthen: ["Several consecutive days building in the same direction."],
      whatWouldWeakenOrInvalidate: ["A reversal the next session, confirming this was noise."],
    },
    fr: {
      currentReadShort: "Le proxy GVZ progresse de +0,3 sur la journée — une légère hausse, dans le bruit quotidien normal pour cette mesure.",
      currentReadDetailed: "Un petit changement d'une seule journée sur une mesure de proxy peu profonde ; pas assez marqué pour se lire comme un changement du risque d'événement anticipé.",
      whyNow: "+0,3 est dans la bande de bruit quotidien habituelle pour cet indicateur.",
      causalChain: [
        { statement: "Le proxy GVZ a progressé de 0,3 sur la journée.", status: "FACT" },
        { statement: "Un mouvement aussi faible reste dans le bruit quotidien normal, pas un signal.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si cela s'accumule en une tendance pluri-journalière."],
      whatWouldStrengthen: ["Plusieurs jours consécutifs se construisant dans la même direction."],
      whatWouldWeakenOrInvalidate: ["Un renversement la séance suivante, confirmant qu'il s'agissait de bruit."],
    },
  },
  "f11-gvz-5d": {
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
    en: {
      currentReadShort: "GVZ proxy -0.6 over 5 days — a mild cooling in priced event risk, not a directional Gold signal.",
      currentReadDetailed: "A modest 5-day decline in implied vol, consistent with a quiet stretch between catalysts rather than any Gold-specific read.",
      whyNow: "-0.6 over 5 days is a mild move, not a compression extreme worth flagging as complacency.",
      causalChain: [
        { statement: "GVZ proxy fell 0.6 over the past 5 days.", status: "FACT" },
        { statement: "A mild multi-day decline suggests a quiet stretch, not complacency or a coiled setup.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Whether this continues compressing into the next scheduled catalyst."],
      whatWouldStrengthen: ["Compression continuing right up to a known catalyst (a genuine complacency setup)."],
      whatWouldWeakenOrInvalidate: ["A sharp reversal higher, ending the compression trend."],
    },
    fr: {
      currentReadShort: "Le proxy GVZ recule de -0,6 sur 5 jours — un léger refroidissement du risque d'événement anticipé, pas un signal directionnel pour l'Or.",
      currentReadDetailed: "Une baisse modeste de la volatilité implicite sur 5 jours, cohérente avec une période calme entre catalyseurs plutôt qu'une lecture spécifique à l'Or.",
      whyNow: "-0,6 sur 5 jours est un mouvement léger, pas un extrême de compression méritant d'être signalé comme complaisance.",
      causalChain: [
        { statement: "Le proxy GVZ a reculé de 0,6 sur les 5 derniers jours.", status: "FACT" },
        { statement: "Un léger recul pluri-journalier suggère une période calme, pas une complaisance ou une configuration comprimée.", status: "INFERENCE" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si cela continue de se comprimer jusqu'au prochain catalyseur programmé."],
      whatWouldStrengthen: ["Une compression qui se poursuit jusqu'à un catalyseur connu (une véritable configuration de complaisance)."],
      whatWouldWeakenOrInvalidate: ["Un renversement haussier marqué, mettant fin à la tendance de compression."],
    },
  },

  // -------------------- Mechanical-basis KPIs (relationship already fixed
  // on the canonical fixture) — the AI layer here only ever writes the
  // *explanatory* fields; finalGoldRead itself is derived programmatically
  // from the canonical tag in the ensemble adjudicator, never invented here
  // (except the one explicit forceContextualDespiteMechanical demonstration
  // below on f2-10y-real).
  "f2-10y-real": {
    evidenceState: "MODERATE",
    forceContextualDespiteMechanical: true,
    en: {
      currentReadShort: "10Y Real is oscillating intraday with no confirmed trend — the fixed mechanical channel is live, but too noisy to trust right now.",
      currentReadDetailed:
        "10Y Real is Gold's single most direct mechanical driver (real yields down → supportive; up → adverse). This is a deliberate, rare demonstration that even a mechanical-basis KPI can be adjudicated CONTEXTUAL: today's real-yield move is whipsawing between positive and negative within the session, alongside an unusually large simultaneous breakeven repricing, making the net opportunity-cost signal genuinely unreliable to call directionally right now — not a failure of the mechanism, a judgment that this specific session's data doesn't support a confident directional read despite the mechanical channel existing.",
      whyNow: "Intraday real-yield direction has flipped more than once this session, and breakevens are moving by a comparably large amount at the same time — the two effects are not cleanly separable right now.",
      causalChain: [
        { statement: "10Y Real yield has moved in both directions within today's session.", status: "FACT" },
        { statement: "BE10 is moving by a comparably large magnitude at the same time.", status: "FACT" },
        { statement: "With both components moving sharply and in flux, the net real-yield signal cannot be read with confidence this session.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Which direction 10Y Real settles into by the close.", "Whether tomorrow's session restores a clean, single-direction real-yield read."],
      whatWouldStrengthen: ["10Y Real settling into one clear direction for a full session with breakevens comparatively stable."],
      whatWouldWeakenOrInvalidate: ["This is itself the rare exception case — the mechanical rule reasserts once intraday noise clears, at which point this KPI reverts to its normal mechanical read."],
    },
    fr: {
      currentReadShort: "Le taux réel 10 ans oscille en intrajournalier sans tendance confirmée — le canal mécanique fixe existe, mais trop de bruit pour s'y fier maintenant.",
      currentReadDetailed:
        "Le taux réel 10 ans est le moteur mécanique le plus direct de l'Or (taux réels en baisse → favorable ; en hausse → défavorable). Ceci est une démonstration délibérée et rare qu'un KPI à base mécanique peut néanmoins être arbitré comme contextuel : le mouvement du taux réel aujourd'hui oscille entre positif et négatif au cours de la séance, avec en parallèle un repricing des breakevens inhabituellement important, rendant le signal net de coût d'opportunité réellement impossible à trancher avec confiance en ce moment — non pas un échec du mécanisme, mais un jugement que les données de cette séance précise ne permettent pas une lecture directionnelle fiable malgré l'existence du canal mécanique.",
      whyNow: "La direction intrajournalière du taux réel s'est inversée plus d'une fois cette séance, et les breakevens bougent d'une ampleur comparable au même moment — les deux effets ne sont pas clairement séparables actuellement.",
      causalChain: [
        { statement: "Le taux réel 10 ans a bougé dans les deux sens au cours de la séance d'aujourd'hui.", status: "FACT" },
        { statement: "Le BE10 bouge d'une ampleur comparable au même moment.", status: "FACT" },
        { statement: "Avec les deux composantes en mouvement marqué et instable, le signal net de taux réel ne peut pas être lu avec confiance cette séance.", status: "HYPOTHESIS" },
      ],
      uncertaintyOrUnknowns: ["Dans quelle direction le taux réel 10 ans se stabilisera d'ici la clôture.", "Si la séance de demain rétablit une lecture nette et univoque du taux réel."],
      whatWouldStrengthen: ["Le taux réel 10 ans se stabilisant dans une direction claire sur une séance complète, avec des breakevens comparativement stables."],
      whatWouldWeakenOrInvalidate: ["Ceci est en soi le cas d'exception rare — la règle mécanique se réaffirme une fois le bruit intrajournalier dissipé, moment où ce KPI retrouve sa lecture mécanique normale."],
    },
  },
  "f6-dxy-recon-today": {
    evidenceState: "MODERATE",
    en: {
      currentReadShort: "USD -0.18% today — intraday dollar softness, mechanically supportive for Gold.",
      currentReadDetailed: "Gold is priced in dollars, so intraday USD softness is a direct, mechanical tailwind independent of anything happening in rates — the fixed F6 mechanism for this KPI.",
      whyNow: "Reconstructed DXY is down 0.18% intraday.",
      causalChain: [
        { statement: "Reconstructed DXY is down 0.18% today.", status: "FACT" },
        { statement: "USD weakness mechanically lowers Gold's price for non-USD buyers.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Whether this intraday move persists or reverses into the close."],
      whatWouldStrengthen: ["5D momentum also turning negative, removing the current divergence."],
      whatWouldWeakenOrInvalidate: ["A reversal back to USD strength intraday."],
    },
    fr: {
      currentReadShort: "USD -0,18 % aujourd'hui — une faiblesse intrajournalière du dollar, mécaniquement favorable pour l'Or.",
      currentReadDetailed: "L'Or est coté en dollars, donc une faiblesse intrajournalière du dollar est un vent favorable direct et mécanique, indépendant de tout ce qui se passe sur les taux — le mécanisme fixe de F6 pour ce KPI.",
      whyNow: "Le DXY reconstruit recule de 0,18 % en intrajournalier.",
      causalChain: [
        { statement: "Le DXY reconstruit recule de 0,18 % aujourd'hui.", status: "FACT" },
        { statement: "La faiblesse de l'USD fait mécaniquement baisser le prix de l'Or pour les acheteurs hors USD.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si ce mouvement intrajournalier persiste ou s'inverse d'ici la clôture."],
      whatWouldStrengthen: ["La dynamique sur 5 jours devenant aussi négative, supprimant la divergence actuelle."],
      whatWouldWeakenOrInvalidate: ["Un retour à la force du dollar en intrajournalier."],
    },
  },
  "f6-dxy-recon-5d": {
    evidenceState: "MODERATE",
    en: {
      currentReadShort: "USD +0.42% over 5 days — multi-day dollar strength, mechanically adverse for Gold.",
      currentReadDetailed:
        "Per F6's fixed mechanism, dollar strength is a direct headwind for non-USD buyers. The 5-day window shows firming even as today's intraday reading softened — the divergence USD State flags.",
      whyNow: "Reconstructed DXY is up 0.42% over the trailing 5 sessions.",
      causalChain: [
        { statement: "Reconstructed DXY is up 0.42% over 5 days.", status: "FACT" },
        { statement: "USD strength mechanically raises Gold's price for non-USD buyers.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Whether the 5-day trend or today's intraday softness ultimately dominates."],
      whatWouldStrengthen: ["Today's reading also turning positive, removing the divergence."],
      whatWouldWeakenOrInvalidate: ["A genuine panic/confidence-crisis regime where Gold and USD rise together."],
    },
    fr: {
      currentReadShort: "USD +0,42 % sur 5 jours — une force pluri-journalière du dollar, mécaniquement défavorable pour l'Or.",
      currentReadDetailed:
        "Selon le mécanisme fixe de F6, la force du dollar est un vent contraire direct pour les acheteurs hors USD. La fenêtre de 5 jours montre un raffermissement alors même que la lecture intrajournalière d'aujourd'hui s'est affaiblie — la divergence signalée par l'état du dollar.",
      whyNow: "Le DXY reconstruit progresse de 0,42 % sur les 5 dernières séances.",
      causalChain: [
        { statement: "Le DXY reconstruit progresse de 0,42 % sur 5 jours.", status: "FACT" },
        { statement: "La force de l'USD fait mécaniquement monter le prix de l'Or pour les acheteurs hors USD.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si la tendance sur 5 jours ou la faiblesse intrajournalière d'aujourd'hui finira par dominer."],
      whatWouldStrengthen: ["La lecture d'aujourd'hui devenant elle aussi positive, supprimant la divergence."],
      whatWouldWeakenOrInvalidate: ["Un véritable régime de panique/crise de confiance où l'Or et l'USD montent ensemble."],
    },
  },
  "f10-etf-delta": {
    evidenceState: "MODERATE",
    en: {
      currentReadShort: "ETF holdings +14t (latest obs.) — a positive flow, mechanically supportive by the sign-of-flow rule.",
      currentReadDetailed: "Per F10's locked framing, this KPI is signed by its own observed value: positive flow is supportive, and would flip to adverse if the observed flow were negative — not a fixed lean either way.",
      whyNow: "The latest observed global ETF holdings change is +14 tonnes.",
      causalChain: [
        { statement: "Latest observed global gold ETF holdings change is +14t.", status: "FACT" },
        { statement: "A positive observed flow is mechanically read as supportive under this KPI's sign-of-flow rule.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Whether this single observation is the start of a trend or a one-off."],
      whatWouldStrengthen: ["Several consecutive positive observations."],
      whatWouldWeakenOrInvalidate: ["A reversal to net outflows in the next observation."],
    },
    fr: {
      currentReadShort: "Encours ETF +14t (dernière observation) — un flux positif, mécaniquement favorable selon la règle du signe du flux.",
      currentReadDetailed: "Selon le cadrage verrouillé de F10, ce KPI est signé par sa propre valeur observée : un flux positif est favorable, et basculerait vers défavorable si le flux observé était négatif — pas de biais fixe dans un sens ou l'autre.",
      whyNow: "Le dernier changement observé des encours ETF mondiaux est de +14 tonnes.",
      causalChain: [
        { statement: "Le dernier changement observé des encours ETF or mondiaux est de +14t.", status: "FACT" },
        { statement: "Un flux observé positif se lit mécaniquement comme favorable selon la règle du signe du flux de ce KPI.", status: "FACT" },
      ],
      uncertaintyOrUnknowns: ["Reste à savoir si cette seule observation marque le début d'une tendance ou un épisode isolé."],
      whatWouldStrengthen: ["Plusieurs observations positives consécutives."],
      whatWouldWeakenOrInvalidate: ["Un retournement vers des sorties nettes lors de la prochaine observation."],
    },
  },
};

export function genericFallbackScenario(kpi: CanonicalKpi): MockScenario {
  // Used for deep/event-tier KPIs that don't have a hand-authored scenario
  // above (lazily generated on first request — Patch 10). Deterministic,
  // template-based (in BOTH languages), and honest about being a generic
  // fallback rather than a fabricated bespoke read. `kpi.driverSummary` is
  // canonical backend data and is never translated — only the French
  // scaffolding language around it changes.
  const valueTextEn = kpi.value === null ? "no current value" : `${kpi.value}${kpi.unit ? kpi.unit : ""}`;
  const valueTextFr = kpi.value === null ? "aucune valeur actuelle" : `${kpi.value}${kpi.unit ? kpi.unit : ""}`;
  const driver = kpi.driverSummary ?? "No additional mechanism note is recorded for this KPI.";

  const en: ScenarioContent = {
    currentReadShort: `${kpi.label}: ${valueTextEn}. ${driver}`.slice(0, 138),
    currentReadDetailed: `${kpi.label} currently reads ${valueTextEn}. ${driver}`,
    whyNow: `${kpi.label} was read as-of ${kpi.observationAt} with no additional session-specific context authored yet.`,
    causalChain: [{ statement: `${kpi.label} is ${valueTextEn}.`, status: "FACT" }],
    uncertaintyOrUnknowns: ["This KPI uses a generic lazily-generated mock read rather than a hand-authored scenario."],
    whatWouldStrengthen: ["A hand-authored scenario for this KPI in a future session."],
    whatWouldWeakenOrInvalidate: ["N/A — generic fallback read."],
  };
  const fr: ScenarioContent = {
    currentReadShort: `${kpi.label} : ${valueTextFr}. ${driver}`.slice(0, 138),
    currentReadDetailed: `${kpi.label} affiche actuellement ${valueTextFr}. ${driver}`,
    whyNow: `${kpi.label} a été relevé à la date du ${kpi.observationAt}, sans contexte spécifique à la session encore rédigé.`,
    causalChain: [{ statement: `${kpi.label} est à ${valueTextFr}.`, status: "FACT" }],
    uncertaintyOrUnknowns: ["Ce KPI utilise une lecture générique générée à la demande plutôt qu'un scénario rédigé spécifiquement."],
    whatWouldStrengthen: ["Un scénario rédigé spécifiquement pour ce KPI lors d'une prochaine session."],
    whatWouldWeakenOrInvalidate: ["N/A — lecture générique par défaut."],
  };

  return {
    en,
    fr,
    evidenceState: "LIMITED",
    contextualFinalGoldRead: "CONTEXTUAL",
  };
}
