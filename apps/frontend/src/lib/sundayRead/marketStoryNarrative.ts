export const judgmentKeys = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"] as const;
export type JudgmentKey = typeof judgmentKeys[number];
export type Language = "FR" | "EN";

function copy(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function verdictDetail(presentation: any, key: JudgmentKey): { verdict: string | null; explanation: string | null } {
  // Current-state presentation is authoritative. Historical V4 verdict prose can
  // still describe the Sunday state after the intermediate verdict has changed.
  const current = key === "opportunity_quality" ? presentation?.opportunity_quality
    : key === "execution_readiness" ? presentation?.execution_readiness
    : presentation?.direction_state?.[key];
  const historical = presentation?.verdict_explanations?.[key];
  return {
    verdict: copy(current?.display) ?? copy(historical?.verdict),
    explanation: copy(current?.explanation) ?? copy(historical?.mechanism) ?? copy(historical?.practical_meaning),
  };
}

export function rawJudgment(read: any, key: JudgmentKey): string | null {
  const raw = key === "opportunity_quality" || key === "execution_readiness"
    ? read?.[key]?.value : read?.direction_state?.[key];
  return typeof raw === "string" ? raw : null;
}

export function matchingIntermediateSummary(read: any, parentRunId: string | null | undefined): any | null {
  const summary = read?.intermediate_summary;
  return parentRunId && summary?.parent_run_id === parentRunId ? summary : null;
}

export function judgmentEvolution(
  read: any,
  previous: any,
  presentation: any,
  previousPresentation: any,
  language: Language,
  labels: Record<JudgmentKey, string>,
): { changed: string[]; remains: string[] } {
  if (!previous) return { changed: [], remains: [] };
  const changed: string[] = [];
  const remains: string[] = [];
  for (const key of judgmentKeys) {
    const before = rawJudgment(previous, key);
    const after = rawJudgment(read, key);
    if (!before || !after) continue;
    const oldCopy = verdictDetail(previousPresentation, key).verdict;
    const now = verdictDetail(presentation, key);
    if (before !== after) {
      const causal = key === "macro_direction" ? copy(presentation?.market_story?.causal_assessment?.reported) : null;
      const scope = key === "macro_direction" ? (language === "FR" ? "Lecture des faits à la date du rapport, pas une prévision de nouvelle baisse." : "Reading of facts as of this report, not a forecast of another decline.") : null;
      changed.push(`${labels[key]} : ${oldCopy ?? before} → ${now.verdict ?? after}.${now.explanation ? ` ${now.explanation}` : ""}${causal ? ` ${causal}` : ""}${scope ? ` ${scope}` : ""}`);
    } else if (now.explanation) {
      remains.push(`${now.verdict ?? labels[key]} : ${now.explanation}`);
    }
  }
  return { changed, remains };
}

export type GapExplanation = { topic: string; label: string; explanation: string; checked?: string; nextAction?: string };

export function materialUnknownReasons(read: any, language: Language, summary: any | null): GapExplanation[] {
  const fr = language === "FR";
  // The future narrative is used only after the calling page has matched its parent.
  if (summary && Array.isArray(summary.unknown_reasons)) return summary.unknown_reasons.map((gap: any) => ({
    topic: String(gap.topic ?? "OTHER"),
    label: String(gap.label?.[fr ? "fr" : "en"] ?? ""),
    explanation: String(gap.explanation?.[fr ? "fr" : "en"] ?? ""),
    checked: gap.checked?.[fr ? "fr" : "en"],
    nextAction: gap.next_action?.[fr ? "fr" : "en"],
  })).filter((gap: GapExplanation) => gap.label && gap.explanation);

  const pi = read?.positioning_evidence;
  if (!pi || read?.meta?.run_type !== "INTERMEDIATE") return [];
  const reasons: GapExplanation[] = [];
  const cot = pi.cot;
  const formatDate = (value: string) => { const date = new Date(value.includes("T") ? value : value + "T12:00:00Z"); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(fr ? "fr-CA" : "en-US", { timeZone: "America/New_York", dateStyle: "long", ...(value.includes("T") ? { timeStyle: "short" as const } : {}) }).format(date); };
  const nextCot = (read?.catalysts ?? []).find((event: any) => /\bCOT\b/i.test(String(event.event ?? "")));
  if (cot?.publication_lag && /predates|before|avant|pré-Fed/i.test(cot.publication_lag)) {
    reasons.push({
      topic: "COT_POST_FED",
      label: fr ? "Positions après la décision de la Fed" : "Positions after the Fed decision",
      explanation: fr ? `Les dernières positions disponibles datent du ${cot.report_date ? formatDate(cot.report_date) : "rapport précédent"} et précèdent la décision de la Fed. Elles ne décrivent pas encore le positionnement après cette décision.` : `The latest available positions are dated ${cot.report_date ? formatDate(cot.report_date) : "the preceding report"} and predate the Fed decision. They do not show post-decision positioning.`,
      checked: nextCot?.date_time ? (fr ? `Prochaine publication annoncée : ${formatDate(nextCot.date_time)}.` : `Next scheduled publication: ${nextCot.date_time}.`) : undefined,
      nextAction: fr ? "Comparer le prochain rapport officiel pour la même population de contrats." : "Compare the next official report for the same contract population.",
    });
  }
  if (pi.price_open_interest?.oi_direction === "UNKNOWN") reasons.push({
    topic: "OPEN_INTEREST_CURRENT",
    label: fr ? "Intérêt ouvert actuel" : "Current open interest",
    explanation: fr ? "Une mesure officielle actuelle comparable à la variation du prix n’a pas été récupérée de façon fiable. Le JSON ne précise pas pourquoi la récupération a échoué : la cause exacte ne peut pas être confirmée." : "A reliable official current observation comparable with the price move was not recovered. The JSON does not document why retrieval failed; the exact cause cannot be confirmed.",
    checked: /18[–-]24 September/i.test(String(pi.price_open_interest.measurement_window ?? "")) ? (fr ? "Fenêtre examinée : du 18 au 24 septembre 2026 ; aucune mesure actuelle comparable n’a été validée." : "Window checked: September 18–24, 2026; no comparable current observation was validated.") : undefined,
    nextAction: fr ? "Récupérer l’intérêt ouvert du même contrat et aligner les dates de mesure." : "Retrieve open interest for the same contract and align measurement dates.",
  });
  if (pi.options_iv?.iv_direction === "UNKNOWN") reasons.push({
    topic: "OPTIONS_IV",
    label: fr ? "Volatilité des options" : "Options implied volatility",
    explanation: fr ? "Aucune série fiable mesurée de façon comparable n’est vérifiée dans ce rapport. Le JSON ne permet pas de confirmer si la difficulté vient de l’accès, de la source ou des dates de mesure." : "No reliable like-for-like series was verified in this report. The JSON does not establish whether access, sourcing or measurement dates caused the gap.",
    nextAction: fr ? "Vérifier une série datée sur le même sous-jacent et la même échéance." : "Verify a dated series for the same underlying and tenor.",
  });
  if (pi.gold_skew_baseline?.status === "UNKNOWN" || pi.options_iv?.call_put_skew_direction === "UNKNOWN") reasons.push({
    topic: "OPTIONS_SKEW",
    label: fr ? "Comparaison du skew des options" : "Options skew comparison",
    explanation: fr ? "L’historique de skew à échéance et caractéristiques constantes n’a pas été vérifié. Le rapport ne documente pas la cause précise de cette absence." : "A fixed-tenor, like-for-like skew history was not verified. The report does not document the precise cause.",
    nextAction: fr ? "Obtenir une série homogène par échéance et prix d’exercice avant de comparer." : "Obtain a consistent series by tenor and strike before comparing.",
  });
  if (pi.gamma?.status === "UNKNOWN") reasons.push({
    topic: "DEALER_GAMMA",
    label: fr ? "Gamma des intermédiaires" : "Dealer gamma",
    explanation: pi.gamma.model_method == null ? (fr ? "Le JSON ne contient ni méthode de calcul vérifiée ni signe établi. On ne peut pas déduire le positionnement des intermédiaires à partir du seul prix." : "The JSON contains neither a verified calculation method nor an established sign. Dealer positioning cannot be inferred from price alone.") : (fr ? "Le signe du gamma n’a pas été établi par une preuve vérifiée." : "The sign of dealer gamma was not established by verified evidence."),
    nextAction: fr ? "Vérifier les données d’options et une méthode explicite avant toute conclusion." : "Verify options data and an explicit method before drawing a conclusion.",
  });
  if ((read?.unknowns ?? []).some((u: string) => /real yield|taux r[eé]el/i.test(u)) && read?.meta?.run_type === "INTERMEDIATE") reasons.push({
    topic: "REAL_YIELD_CURRENT",
    label: fr ? "Taux réel actuel" : "Current real yield",
    explanation: fr ? "Un taux réel correspondant à la fenêtre de cette mise à jour n’a pas été récupéré. Le taux nominal plus ancien ne le remplace pas. Le JSON ne précise pas pourquoi la mesure réelle manque." : "A real yield matching this update window was not recovered. The older nominal yield is not a substitute. The JSON does not explain why the real observation is missing.",
    nextAction: fr ? "Chercher le taux réel officiel daté et comparer la même échéance." : "Retrieve the dated official real yield for the same maturity.",
  });
  return reasons;
}
