import type { Language } from "@gold-terminal/contracts";
import { NORMALIZED_EVENT_TYPES, type NormalizedEventType } from "./f13EventTypes";

// Bilingual, plain-language "what is this and why do investors watch it"
// blurbs for the calendar UI — purely educational, generic economic
// explanations (never a directional call, never gold-specific reasoning).
// Keyed on the same stable `normalizedEventType` bucket as cadence/unit
// resolution (f13EventTypes.ts) so it never drifts with JBlanked's exact
// event-name wording. An unmapped `OTHER_*` type falls back to a single
// generic explanation rather than showing nothing.

const EXPLANATIONS: Record<NormalizedEventType, Record<Language, string>> = {
  FOMC_RATE_DECISION: {
    EN: "The Federal Reserve's decision on its key interest rate. Investors watch it because it directly sets the cost of borrowing across the economy and is a major driver of the dollar and gold's opportunity cost.",
    FR: "La décision de la Réserve fédérale américaine sur son taux directeur. Les investisseurs la surveillent car elle fixe directement le coût de l'emprunt dans toute l'économie et reste un moteur majeur du dollar et du coût d'opportunité de l'or.",
  },
  CPI: {
    EN: "Consumer Price Index — measures how fast prices for everyday goods and services are rising. It's a main inflation gauge markets use to guess the Fed's next move.",
    FR: "Indice des prix à la consommation — mesure la vitesse à laquelle les prix des biens et services augmentent. C'est un baromètre d'inflation clé utilisé par les marchés pour anticiper la prochaine décision de la Fed.",
  },
  CORE_CPI: {
    EN: "CPI excluding volatile food and energy prices — considered a cleaner read on underlying inflation trends, which is what the Fed pays closest attention to.",
    FR: "CPI hors alimentation et énergie, deux composantes volatiles — jugé plus représentatif de la tendance d'inflation sous-jacente, celle que la Fed surveille le plus attentivement.",
  },
  PPI: {
    EN: "Producer Price Index — measures price changes at the wholesale/factory-gate level, often an early signal for where consumer inflation (CPI) is headed next.",
    FR: "Indice des prix à la production — mesure l'évolution des prix au stade de la production/gros, souvent un signal précoce de la direction future de l'inflation à la consommation (CPI).",
  },
  CORE_PPI: {
    EN: "PPI excluding food and energy — the underlying wholesale-inflation trend, stripped of its most volatile components.",
    FR: "PPI hors alimentation et énergie — la tendance sous-jacente de l'inflation de gros, débarrassée de ses composantes les plus volatiles.",
  },
  PCE: {
    EN: "Personal Consumption Expenditures price index — the Fed's own preferred inflation gauge, broader than CPI because it captures how consumers actually shift spending as prices change.",
    FR: "Indice des prix des dépenses de consommation des ménages — la mesure d'inflation privilégiée par la Fed, plus large que le CPI car elle capture la façon dont les consommateurs réajustent réellement leurs achats face aux prix.",
  },
  CORE_PCE: {
    EN: "PCE excluding food and energy — the single inflation number the Fed itself watches most closely when deciding on rates.",
    FR: "PCE hors alimentation et énergie — le chiffre d'inflation que la Fed elle-même surveille le plus attentivement pour ses décisions de taux.",
  },
  NONFARM_PAYROLLS: {
    EN: "The number of jobs added or lost in the US economy over the past month, excluding farm work. One of the most-watched releases because it shows the real-time health of the labor market.",
    FR: "Le nombre d'emplois créés ou détruits dans l'économie américaine au cours du mois écoulé, hors secteur agricole. L'une des publications les plus suivies car elle reflète en temps réel la santé du marché du travail.",
  },
  ADP_EMPLOYMENT: {
    EN: "A private payroll processor's own estimate of job creation, released a couple of days before the official government Nonfarm Payrolls. Investors use it as an early, rougher hint of what the official number might show.",
    FR: "L'estimation d'un acteur privé du traitement de la paie sur les créations d'emplois, publiée quelques jours avant le chiffre officiel du gouvernement (Nonfarm Payrolls). Les investisseurs s'en servent comme indice précoce, mais moins fiable, du chiffre officiel à venir.",
  },
  UNEMPLOYMENT_RATE: {
    EN: "The share of the workforce actively looking for a job but not currently employed. A rising rate signals a cooling labor market, which can shift expectations for Fed policy.",
    FR: "La part de la population active qui cherche activement un emploi sans en avoir. Une hausse signale un ralentissement du marché du travail, ce qui peut modifier les anticipations de politique monétaire de la Fed.",
  },
  AVERAGE_HOURLY_EARNINGS: {
    EN: "How much average hourly wages changed over the month — a key input for judging whether wage growth is fueling inflation.",
    FR: "L'évolution du salaire horaire moyen sur le mois — un indicateur clé pour juger si la croissance des salaires alimente l'inflation.",
  },
  INITIAL_JOBLESS_CLAIMS: {
    EN: "The number of people filing for unemployment benefits for the first time in a given week — a fast, weekly pulse-check on labor-market stress, watched between the monthly jobs reports.",
    FR: "Le nombre de nouvelles demandes d'allocations chômage déposées sur la semaine — un indicateur hebdomadaire rapide de la tension sur le marché du travail, suivi entre deux rapports mensuels sur l'emploi.",
  },
  JOLTS: {
    EN: "Job Openings and Labor Turnover Survey — counts how many job vacancies employers currently have. A gauge of labor demand, independent of how many people are actually being hired.",
    FR: "Enquête sur les offres d'emploi et la rotation de la main-d'œuvre — comptabilise le nombre de postes vacants chez les employeurs. Un indicateur de la demande de travail, indépendant du nombre de personnes réellement embauchées.",
  },
  ISM_MANUFACTURING: {
    EN: "A survey-based index of activity in the US manufacturing sector. Above 50 signals expansion, below 50 signals contraction — a widely watched early read on the industrial economy.",
    FR: "Un indice basé sur une enquête auprès du secteur manufacturier américain. Au-dessus de 50, l'activité est en expansion ; en dessous, en contraction — un signal précoce très suivi sur l'économie industrielle.",
  },
  ISM_SERVICES: {
    EN: "The same survey-based approach as its manufacturing counterpart, but for the much larger US services sector — a broader read on overall economic momentum.",
    FR: "La même approche par enquête que son équivalent manufacturier, mais pour le secteur des services, bien plus large aux États-Unis — une lecture plus globale de la dynamique économique.",
  },
  RETAIL_SALES: {
    EN: "How much US consumers spent at retailers over the month. Consumer spending drives most of US economic activity, so this is a direct read on the health of the economy.",
    FR: "Le montant dépensé par les consommateurs américains dans le commerce de détail sur le mois. La consommation représentant l'essentiel de l'activité économique américaine, c'est une lecture directe de la santé de l'économie.",
  },
  GDP: {
    EN: "Gross Domestic Product — the broadest measure of everything the US economy produced over the period. The headline scorecard for whether the economy is growing or shrinking.",
    FR: "Produit intérieur brut — la mesure la plus large de tout ce que l'économie américaine a produit sur la période. Le tableau de bord global qui indique si l'économie croît ou se contracte.",
  },
};

const GENERIC_EXPLANATION: Record<Language, string> = {
  EN: "A scheduled economic release that can move markets depending on how far the actual result differs from what investors expected.",
  FR: "Une publication économique programmée, susceptible de faire bouger les marchés selon l'écart entre le résultat réel et ce que les investisseurs anticipaient.",
};

/** Returns the plain-language explanation for a calendar event's normalized type; falls back to a generic blurb for an unmapped/OTHER_* type — never an empty string. */
export function getEventExplanation(normalizedType: string, language: Language): string {
  const known = (NORMALIZED_EVENT_TYPES as readonly string[]).includes(normalizedType)
    ? EXPLANATIONS[normalizedType as NormalizedEventType]
    : undefined;
  return (known ?? GENERIC_EXPLANATION)[language];
}
