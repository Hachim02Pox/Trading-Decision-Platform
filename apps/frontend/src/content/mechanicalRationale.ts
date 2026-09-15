import type { Language, MechanicalEvaluationMode, MechanicalEvaluationStatus } from "@gold-terminal/contracts";

type Localized = { en: string; fr: string };
export interface MechanicalRationale { whatItMeasures: Localized; goldLink: Localized; rule: Localized; limitation: Localized; }
const copy = (en: string, fr: string): Localized => ({ en, fr });

const KPI_RATIONALE: Partial<Record<string, MechanicalRationale>> = {
  "f2-10y-real": {
    whatItMeasures: copy("The 10Y real yield measures the return available after inflation expectations.", "Le taux réel à 10 ans mesure le rendement disponible après prise en compte des anticipations d’inflation."),
    goldLink: copy("It is the rate most directly linked to Gold’s opportunity cost: higher real yields increase the return forgone by holding a non-yielding asset.", "C’est le taux le plus directement lié au coût d’opportunité de détenir de l’or : des taux réels plus élevés augmentent le rendement auquel on renonce."),
    rule: copy("A rise is mechanically adverse for Gold; a fall is supportive; no meaningful change is contextual.", "Une hausse est mécaniquement défavorable à l’or ; une baisse est favorable ; l’absence de variation significative est contextuelle."),
    limitation: copy("Real yields are a powerful transmission channel, not a complete explanation of Gold’s price.", "Les taux réels sont un canal de transmission important, pas une explication complète du prix de l’or."),
  },
  "f2-2y": {
    whatItMeasures: copy("The 2Y yield primarily reflects short-term policy-rate and Fed-path expectations.", "Le taux à 2 ans reflète surtout les anticipations de taux directeurs à court terme et de trajectoire de la Fed."),
    goldLink: copy("For Gold, it helps confirm Fed repricing. Real yields remain more directly connected to the opportunity cost of holding Gold.", "Pour l’or, il aide surtout à confirmer le repricing de la Fed. Les taux réels restent plus directement liés au coût d’opportunité de détenir de l’or."),
    rule: copy("A rise can point to tighter policy expectations and potential pressure on Gold; a fall can point the other way; no change is contextual.", "Une hausse peut signaler des anticipations de politique plus restrictive et une pression potentielle sur l’or ; une baisse peut signaler l’inverse ; sans variation, la lecture est contextuelle."),
    limitation: copy("It is highly useful for reading the front end of the curve, but it does not by itself establish Gold’s opportunity-cost signal.", "Il est très utile pour lire l’avant de la courbe, mais ne suffit pas à lui seul à établir le signal de coût d’opportunité de l’or."),
  },
  "f2-10y": {
    whatItMeasures: copy("The 10Y nominal yield captures long-term nominal rate pricing.", "Le taux nominal à 10 ans reflète le niveau des taux nominaux de long terme."),
    goldLink: copy("For Gold, its meaning depends on the mix of real yields and inflation expectations behind the move.", "Pour l’or, son sens dépend de la part des taux réels et des anticipations d’inflation derrière le mouvement."),
    rule: copy("The rule uses its movement as a rates confirmation when more direct rate inputs are unavailable.", "La règle utilise son mouvement comme confirmation des taux lorsque des indicateurs plus directs ne sont pas disponibles."),
    limitation: copy("A nominal-yield move should be decomposed before assigning a broad Gold conclusion.", "Un mouvement de taux nominal doit être décomposé avant d’en tirer une conclusion générale pour l’or."),
  },
  "f6-dxy-recon-level": {
    whatItMeasures: copy("DXY measures the dollar against a basket of major currencies.", "Le DXY mesure le dollar face à un panier de grandes devises."),
    goldLink: copy("Because Gold is priced in dollars, dollar strength can make it more expensive for non-dollar buyers.", "Comme l’or est coté en dollars, un dollar fort peut le rendre plus cher pour les acheteurs hors dollar."),
    rule: copy("A stronger dollar is mechanically adverse for Gold; a weaker dollar is supportive.", "Un dollar plus fort est mécaniquement défavorable à l’or ; un dollar plus faible est favorable."),
    limitation: copy("This is a ceteris-paribus channel, not a complete price equation.", "C’est un canal toutes choses égales par ailleurs, pas une équation complète du prix."),
  },
  "f10-etf-holdings": {
    whatItMeasures: copy("GLD holdings show physical Gold held for this ETF.", "Les avoirs de GLD reflètent l’or physique détenu par cet ETF."),
    goldLink: copy("Changes indicate observable ETF investment demand for Gold.", "Les variations indiquent une demande d’investissement observable via les ETF or."),
    rule: copy("Rising holdings are supportive; falling holdings are adverse; unchanged holdings are contextual.", "Des avoirs en hausse sont favorables ; en baisse, défavorables ; stables, contextuels."),
    limitation: copy("ETF flows describe one investor channel, not the entire Gold market.", "Les flux ETF décrivent un seul canal d’investisseurs, pas l’ensemble du marché de l’or."),
  },
};

const FALLBACK: Record<MechanicalEvaluationMode, MechanicalRationale> = {
  OBSERVATION_DELTA: {
    whatItMeasures: copy("This indicator is read by comparing its two latest observations.", "Cet indicateur est lu en comparant ses deux dernières observations."),
    goldLink: copy("Its movement provides a documented mechanical input for Gold.", "Son mouvement fournit une information mécanique documentée pour l’or."),
    rule: copy("The direction is determined by the recorded change under the documented rule.", "La direction est déterminée par la variation observée selon la règle documentée."),
    limitation: copy("One indicator alone does not explain the Gold market.", "Un seul indicateur n’explique pas à lui seul le marché de l’or."),
  },
  CURRENT_SIGN: {
    whatItMeasures: copy("This value is already a change or flow, so its sign is read directly.", "Cette valeur est déjà une variation ou un flux ; son signe est donc lu directement."),
    goldLink: copy("The sign provides a documented mechanical input for Gold.", "Son signe fournit une information mécanique documentée pour l’or."),
    rule: copy("A positive or negative flow is interpreted once; it is not compared again with a prior fetch.", "Un flux positif ou négatif est interprété une seule fois ; il n’est pas comparé de nouveau à un relevé antérieur."),
    limitation: copy("This reading is one input, not a stand-alone trading signal.", "Cette lecture est un élément parmi d’autres, pas un signal de trading autonome."),
  },
  COMPOSITE: {
    whatItMeasures: copy("This reading combines several underlying series.", "Cette lecture combine plusieurs séries sous-jacentes."),
    goldLink: copy("The combined movement provides the relevant mechanical input for Gold.", "Le mouvement combiné fournit l’information mécanique pertinente pour l’or."),
    rule: copy("The documented composite rule determines the result.", "La règle composite documentée détermine le résultat."),
    limitation: copy("A composite can still be incomplete or mixed.", "Un composite peut rester incomplet ou mitigé."),
  },
  CONTEXTUAL: {
    whatItMeasures: copy("This indicator describes macro context rather than a fixed directional Gold mechanism.", "Cet indicateur décrit le contexte macro plutôt qu’un mécanisme directionnel fixe pour l’or."),
    goldLink: copy("Its relevance for Gold depends on the wider market context.", "Son importance pour l’or dépend du contexte de marché plus large."),
    rule: copy("The documented rule keeps this reading contextual rather than forcing a direction.", "La règle documentée maintient cette lecture comme contextuelle plutôt que de forcer une direction."),
    limitation: copy("Contextual does not mean unimportant; it means this indicator cannot be read alone.", "Contextuel ne signifie pas sans importance ; cela signifie que l’indicateur ne peut pas être lu isolément."),
  },
};

export function getMechanicalRationale(kpiId: string, mode: MechanicalEvaluationMode, language: Language): Record<keyof MechanicalRationale, string> {
  const rationale = KPI_RATIONALE[kpiId] ?? FALLBACK[mode];
  const key = language === "FR" ? "fr" : "en";
  return Object.fromEntries(Object.entries(rationale).map(([name, value]) => [name, value[key]])) as Record<keyof MechanicalRationale, string>;
}

export function getContextualExplanation(status: MechanicalEvaluationStatus, language: Language): string {
  const en: Record<MechanicalEvaluationStatus, string> = { EVALUATED: "The current movement does not produce a directional mechanical read on its own.", NO_CHANGE: "There has been no meaningful change since the previous observation, so there is no new mechanical signal for Gold.", INSUFFICIENT_HISTORY: "A prior observation is needed before this rule can assess a change.", INCOMPLETE_COMPOSITE: "The underlying distribution is incomplete, so no reliable composite read is available.", NON_COMPARABLE: "The observations cannot be compared because their units changed.", CONTEXTUAL_BY_DESIGN: "This indicator is contextual by design: it has no fixed directional Gold rule when read alone.", UNAVAILABLE: "There is no available data for the rule to assess." };
  const fr: Record<MechanicalEvaluationStatus, string> = { EVALUATED: "Le mouvement actuel ne produit pas, à lui seul, de lecture mécanique directionnelle.", NO_CHANGE: "Il n’y a pas de variation significative depuis le relevé précédent : aucun nouveau signal mécanique pour l’or.", INSUFFICIENT_HISTORY: "Un relevé antérieur est nécessaire pour que la règle puisse évaluer une variation.", INCOMPLETE_COMPOSITE: "La distribution sous-jacente est incomplète : aucune lecture composite fiable n’est disponible.", NON_COMPARABLE: "Les observations ne sont pas comparables car leur unité a changé.", CONTEXTUAL_BY_DESIGN: "Cet indicateur est contextuel par construction : lu seul, il n’a pas de règle directionnelle fixe pour l’or.", UNAVAILABLE: "Aucune donnée n’est disponible pour que la règle puisse l’évaluer." };
  return (language === "FR" ? fr : en)[status];
}
