import type { ParticipationBreadth } from "@gold-terminal/contracts";

export type F10Language = "EN" | "FR";

export interface F10Explanation {
  available: boolean;
  explanation: string;
  whyItMatters: string;
  caveat: string;
}

type FuturesState = "ADDING_NET_LONG_EXPOSURE" | "REDUCING_NET_LONG_EXPOSURE" | "UNCHANGED";
type EtfState = "PERSISTENT_EXPANSION" | "PERSISTENT_CONTRACTION" | "SHORT_TERM_REVERSAL_UP" | "SHORT_TERM_REVERSAL_DOWN" | "MIXED_FLAT";
type PriceFlowState = "CONFIRMS_PRICE_STRENGTH" | "NEGATIVE_ETF_FLOW_DIVERGENCE" | "POSITIVE_ETF_FLOW_DIVERGENCE" | "CONFIRMS_PRICE_WEAKNESS" | "NEUTRAL_NON_CONFIRMATION";

const copy = {
  EN: {
    unavailable: "Interpretation unavailable because a required current observation is missing.",
    noGuess: "No state is inferred from missing information.",
    futuresCaveat: "This describes the observable futures channel only and does not predict Gold's next move.",
    etfCaveat: "This concerns GLD only; it neither identifies participants nor guarantees a future Gold move.",
    extensionCaveat: "This percentile measures recent flow extension, not a future participant count or the probability that the move continues or ends.",
    priceCaveat: "This is a same-horizon relationship, not evidence that ETF participation caused the price move.",
    breadthCaveat: "CFTC is weekly and GLD is daily. The channels did not necessarily change exposure on the same day, and breadth is context rather than an execution trigger.",
  },
  FR: {
    unavailable: "Interprétation indisponible car une observation actuelle requise est absente.",
    noGuess: "Aucun état n’est déduit d’une information manquante.",
    futuresCaveat: "Cela décrit uniquement le canal futures observable et ne prédit pas le prochain mouvement de l’or.",
    etfCaveat: "Cela concerne GLD uniquement ; la mesure n’identifie pas les intervenants et ne garantit pas un futur mouvement de l’or.",
    extensionCaveat: "Ce percentile mesure l’extension du flux récent, pas un nombre futur de participants ni la probabilité que le mouvement continue ou se termine.",
    priceCaveat: "Il s’agit d’une relation sur le même horizon, pas d’une preuve que la participation ETF a causé le mouvement du prix.",
    breadthCaveat: "Le CFTC est hebdomadaire et GLD quotidien. Les canaux n’ont pas nécessairement modifié leur exposition le même jour, et la largeur fournit du contexte plutôt qu’un déclencheur d’exécution.",
  },
} as const;

function unavailable(language: F10Language): F10Explanation {
  return { available: false, explanation: copy[language].unavailable, whyItMatters: copy[language].noGuess, caveat: "" };
}

function number(value: number, language: F10Language, digits = 2): string {
  return new Intl.NumberFormat(language === "FR" ? "fr-FR" : "en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(Math.abs(value));
}

export function buildF10FuturesExplanation(language: F10Language, state: FuturesState | null | undefined, weeklyChange: number | null, percentile: number | null): F10Explanation {
  if (!state || weeklyChange === null || percentile === null) return unavailable(language);
  const change = number(weeklyChange, language, 1);
  const rank = number(percentile, language, 0);
  const direction = language === "FR"
    ? state === "ADDING_NET_LONG_EXPOSURE" ? `Les Managed Money ont augmenté leur exposition nette longue de ${change} point depuis le rapport précédent.` : state === "REDUCING_NET_LONG_EXPOSURE" ? `Les Managed Money ont réduit leur exposition nette longue de ${change} point depuis le rapport précédent.` : "L’exposition nette longue des Managed Money est restée inchangée depuis le rapport précédent."
    : state === "ADDING_NET_LONG_EXPOSURE" ? `Managed Money increased net-long exposure by ${change} percentage point versus the previous report.` : state === "REDUCING_NET_LONG_EXPOSURE" ? `Managed Money reduced net-long exposure by ${change} percentage point versus the previous report.` : "Managed Money net-long exposure was unchanged versus the previous report.";
  const extension = language === "FR"
    ? `Le positionnement actuel est plus orienté net long qu’environ ${rank} % des observations de la fenêtre de comparaison de 156 semaines.`
    : `Current positioning is more net-long-biased than roughly ${rank}% of observations in the 156-week comparison window.`;
  return {
    available: true,
    explanation: `${direction} ${extension}`,
    whyItMatters: language === "FR" ? "Le stock de positionnement et sa variation récente sont deux informations distinctes." : "The positioning stock and its recent change are separate pieces of information.",
    caveat: copy[language].futuresCaveat,
  };
}

export function buildF10EtfParticipationExplanation(language: F10Language, state: EtfState | null | undefined, flow5: number | null, flow20: number | null): F10Explanation {
  if (!state || flow5 === null || flow20 === null) return unavailable(language);
  const f5 = number(flow5, language);
  const f20 = number(flow20, language);
  const explanations: Record<EtfState, string> = language === "FR" ? {
    PERSISTENT_EXPANSION: `Les holdings physiques de GLD ont augmenté de ${f5} tonnes sur 5 observations valides et de ${f20} tonnes sur 20 ; l’expansion est persistante sur les deux horizons.`,
    PERSISTENT_CONTRACTION: `Les holdings physiques de GLD ont diminué de ${f5} tonnes sur 5 observations valides et de ${f20} tonnes sur 20 ; la contraction est persistante sur les deux horizons.`,
    SHORT_TERM_REVERSAL_DOWN: `Les holdings GLD restent supérieurs de ${f20} tonnes à leur niveau d’il y a 20 observations valides, mais ils ont reculé de ${f5} tonnes sur les 5 dernières.`,
    SHORT_TERM_REVERSAL_UP: `Les holdings GLD restent inférieurs de ${f20} tonnes à leur niveau d’il y a 20 observations valides, mais ils ont progressé de ${f5} tonnes sur les 5 dernières.`,
    MIXED_FLAT: "Les fenêtres ETF courte et moyenne ne montrent pas une direction de participation suffisamment cohérente.",
  } : {
    PERSISTENT_EXPANSION: `GLD physical holdings increased by ${f5} tonnes over 5 valid observations and ${f20} tonnes over 20; expansion is persistent across both horizons.`,
    PERSISTENT_CONTRACTION: `GLD physical holdings decreased by ${f5} tonnes over 5 valid observations and ${f20} tonnes over 20; contraction is persistent across both horizons.`,
    SHORT_TERM_REVERSAL_DOWN: `GLD holdings remain ${f20} tonnes above their level 20 valid observations ago, but have fallen ${f5} tonnes over the latest 5 observations.`,
    SHORT_TERM_REVERSAL_UP: `GLD holdings remain ${f20} tonnes below their level 20 valid observations ago, but have risen ${f5} tonnes over the latest 5 observations.`,
    MIXED_FLAT: "The short and medium ETF windows do not show a sufficiently consistent participation direction.",
  };
  return {
    available: true,
    explanation: explanations[state],
    whyItMatters: language === "FR" ? "La fenêtre 5 observations décrit l’impulsion récente ; la fenêtre 20 observations décrit la participation de moyen horizon." : "The 5-observation window describes the recent impulse; the 20-observation window describes medium-horizon participation.",
    caveat: copy[language].etfCaveat,
  };
}

export function buildF10FlowExtensionExplanation(language: F10Language, flow20: number | null, percentile: number | null): F10Explanation {
  if (flow20 === null || percentile === null) return unavailable(language);
  const change = number(flow20, language);
  const rank = number(percentile, language, 0);
  const direction = flow20 > 0 ? (language === "FR" ? "augmenté" : "increased") : flow20 < 0 ? (language === "FR" ? "diminué" : "decreased") : (language === "FR" ? "été inchangés" : "been unchanged");
  return {
    available: true,
    explanation: language === "FR"
      ? `Les holdings GLD ont ${direction} de ${change} tonnes sur 20 observations valides. Cette variation se situe au ${rank}e percentile des variations comparables sur les 756 dernières séances valides.`
      : `GLD holdings have ${direction} by ${change} tonnes over 20 valid observations. This change ranks at the ${rank}th percentile of comparable changes over the trailing 756 valid sessions.`,
    whyItMatters: language === "FR" ? "La participation décrit la direction actuelle ; l’extension décrit à quel point le mouvement de 20 observations est inhabituel dans l’histoire récente." : "Participation describes the current direction; extension describes how unusual the 20-observation move is in recent history.",
    caveat: copy[language].extensionCaveat,
  };
}

export function buildF10PriceFlowExplanation(language: F10Language, state: PriceFlowState | null | undefined, price20: number | null, flow20: number | null): F10Explanation {
  if (!state || price20 === null || flow20 === null) return unavailable(language);
  const explanations: Record<PriceFlowState, string> = language === "FR" ? {
    CONFIRMS_PRICE_STRENGTH: "Le prix de GLD et ses holdings physiques ont tous deux progressé sur 20 observations valides ; le canal ETF a évolué dans le même sens que le prix.",
    NEGATIVE_ETF_FLOW_DIVERGENCE: "Le prix de GLD progresse sur 20 observations valides alors que ses holdings physiques reculent ; le canal ETF ne confirme pas la hausse du prix sur cet horizon.",
    POSITIVE_ETF_FLOW_DIVERGENCE: "Le prix de GLD recule sur 20 observations valides alors que ses holdings physiques augmentent ; le canal ETF évolue dans le sens opposé au prix.",
    CONFIRMS_PRICE_WEAKNESS: "Le prix de GLD et ses holdings physiques reculent tous deux sur 20 observations valides ; le canal ETF évolue dans le même sens que la faiblesse du prix.",
    NEUTRAL_NON_CONFIRMATION: "Le prix ou les holdings GLD sont inchangés sur cet horizon ; aucune confirmation directionnelle n’est établie.",
  } : {
    CONFIRMS_PRICE_STRENGTH: "GLD price and physical holdings both increased over 20 valid observations; the ETF channel moved in the same direction as price.",
    NEGATIVE_ETF_FLOW_DIVERGENCE: "GLD price increased over 20 valid observations while physical holdings declined; the ETF channel did not confirm price strength on this horizon.",
    POSITIVE_ETF_FLOW_DIVERGENCE: "GLD price declined over 20 valid observations while physical holdings increased; the ETF channel moved opposite to price.",
    CONFIRMS_PRICE_WEAKNESS: "GLD price and physical holdings both declined over 20 valid observations; the ETF channel moved in the same direction as price weakness.",
    NEUTRAL_NON_CONFIRMATION: "Price or GLD holdings were unchanged on this horizon, so no directional confirmation is established.",
  };
  return { available: true, explanation: explanations[state], whyItMatters: language === "FR" ? "La matrice compare deux variations sur le même horizon de 20 observations." : "The matrix compares two changes over the same 20-observation horizon.", caveat: copy[language].priceCaveat };
}

export function buildF10BreadthExplanation(language: F10Language, state: ParticipationBreadth | null): F10Explanation {
  if (!state) return unavailable(language);
  const explanations: Record<ParticipationBreadth, string> = language === "FR" ? {
    BROAD_PARTICIPATION: "Les canaux futures Managed Money et ETF GLD augmentent tous deux leur exposition sur leurs horizons respectifs.",
    FUTURES_LED_PARTICIPATION: "Le positionnement futures augmente tandis que les holdings GLD se contractent sur leurs horizons respectifs.",
    ETF_LED_PARTICIPATION: "Les holdings GLD augmentent tandis que le positionnement Managed Money réduit son exposition nette longue.",
    BROAD_DE_RISKING: "Les deux canaux observables montrent récemment une réduction d’exposition sur leurs horizons respectifs.",
    MIXED_PARTIAL_PARTICIPATION: "Au moins un canal observable est stable ou les directions ne permettent pas une lecture plus large cohérente.",
  } : {
    BROAD_PARTICIPATION: "Managed Money futures positioning and GLD ETF holdings both increased exposure on their respective horizons.",
    FUTURES_LED_PARTICIPATION: "Futures positioning increased while GLD holdings contracted on their respective horizons.",
    ETF_LED_PARTICIPATION: "GLD holdings increased while Managed Money reduced net-long exposure.",
    BROAD_DE_RISKING: "Both observable channels recently reduced exposure on their respective horizons.",
    MIXED_PARTIAL_PARTICIPATION: "At least one observable channel is flat, or the directions do not support a coherent broader reading.",
  };
  return { available: true, explanation: explanations[state], whyItMatters: language === "FR" ? "La largeur indique si la participation est partagée ou concentrée entre les deux canaux observables." : "Breadth shows whether participation is shared or concentrated across the two observable channels.", caveat: copy[language].breadthCaveat };
}
