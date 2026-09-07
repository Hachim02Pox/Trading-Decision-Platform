"use client";

import { classifyParticipationBreadth, type CanonicalKpi } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import {
  buildF10BreadthExplanation,
  buildF10EtfParticipationExplanation,
  buildF10FlowExtensionExplanation,
  buildF10FuturesExplanation,
  buildF10PriceFlowExplanation,
  type F10Explanation,
} from "@/content/f10Interpretation";
import { KpiMiniCell } from "./KpiMiniCell";
import styles from "./FamilyModule.module.css";

interface Props {
  kpis: CanonicalKpi[];
  directionalColoring: boolean;
  onOpenKpi: (kpiId: string) => void;
}

function byId(kpis: CanonicalKpi[], id: string): CanonicalKpi | undefined {
  return kpis.find((kpi) => kpi.id === id);
}

function breadthKey(futures: number | null | undefined, etf: number | null | undefined) {
  const state = classifyParticipationBreadth(futures, etf);
  const keys = {
    BROAD_PARTICIPATION: "f10.breadth.broad",
    FUTURES_LED_PARTICIPATION: "f10.breadth.futuresLed",
    ETF_LED_PARTICIPATION: "f10.breadth.etfLed",
    BROAD_DE_RISKING: "f10.breadth.derisking",
    MIXED_PARTIAL_PARTICIPATION: "f10.breadth.mixed",
  } as const;
  return state ? keys[state] : null;
}

const STATE_KEYS = {
  ADDING_NET_LONG_EXPOSURE: "f10.state.adding",
  REDUCING_NET_LONG_EXPOSURE: "f10.state.reducing",
  UNCHANGED: "f10.state.unchanged",
  HISTORICALLY_EXTENDED_LONG: "f10.crowding.extended",
  HISTORICALLY_LIGHT_OR_SHORT: "f10.crowding.light",
  MID_RANGE: "f10.crowding.midRange",
  PERSISTENT_EXPANSION: "f10.persistence.expansion",
  PERSISTENT_CONTRACTION: "f10.persistence.contraction",
  SHORT_TERM_REVERSAL_UP: "f10.persistence.reversalUp",
  SHORT_TERM_REVERSAL_DOWN: "f10.persistence.reversalDown",
  MIXED_FLAT: "f10.persistence.mixed",
  CONFIRMS_PRICE_STRENGTH: "f10.priceFlow.confirmsStrength",
  NEGATIVE_ETF_FLOW_DIVERGENCE: "f10.priceFlow.negativeDivergence",
  POSITIVE_ETF_FLOW_DIVERGENCE: "f10.priceFlow.positiveDivergence",
  CONFIRMS_PRICE_WEAKNESS: "f10.priceFlow.confirmsWeakness",
  NEUTRAL_NON_CONFIRMATION: "f10.priceFlow.neutral",
  NORMAL_EXPANSION: "f10.intensity.normalExpansion",
  NORMAL_CONTRACTION: "f10.intensity.normalContraction",
  NORMAL_UNCHANGED: "f10.intensity.normalUnchanged",
  ELEVATED_EXPANSION: "f10.intensity.elevatedExpansion",
  ELEVATED_CONTRACTION: "f10.intensity.elevatedContraction",
  EXTREME_EXPANSION: "f10.extension.extremeExpansion",
  EXTREME_CONTRACTION: "f10.extension.extremeContraction",
  STRONG_EXPANSION: "f10.extension.strongExpansion",
  STRONG_CONTRACTION: "f10.extension.strongContraction",
  NORMAL_MID_RANGE: "f10.extension.normal",
} as const;

export function F10ParticipationFace({ kpis, directionalColoring, onOpenKpi }: Props) {
  const { t, language } = useTranslation();
  const futuresIds = ["f10-mm-net-pct", "f10-mm-wow-pp", "f10-mm-percentile"];
  const etfIds = ["f10-etf-holdings", "f10-etf-delta", "f10-etf-delta-5d", "f10-etf-delta-20d", "f10-etf-flow-z60", "f10-etf-flow-percentile", "f10-gld-return-20d"];
  const wow = byId(kpis, "f10-mm-wow-pp");
  const percentile = byId(kpis, "f10-mm-percentile");
  const flow5 = byId(kpis, "f10-etf-delta-5d");
  const flow20 = byId(kpis, "f10-etf-delta-20d");
  const price20 = byId(kpis, "f10-gld-return-20d");
  const flowZ = byId(kpis, "f10-etf-flow-z60");
  const flowPercentile = byId(kpis, "f10-etf-flow-percentile");
  const locale = language === "FR" ? "FR" : "EN";
  const futuresUsable = wow?.dataState === "REAL" && wow.quality === "current";
  const etfUsable = flow5?.dataState === "REAL" && flow5.quality === "current";
  const breadthState = classifyParticipationBreadth(wow?.value, flow5?.value, { futuresUsable, etfUsable });
  const breadthLabelKey = breadthState ? breadthKey(wow?.value, flow5?.value) : null;
  const futuresExplanation = buildF10FuturesExplanation(locale, wow?.driverSummary as Parameters<typeof buildF10FuturesExplanation>[1], wow?.value ?? null, percentile?.value ?? null);
  const participationExplanation = buildF10EtfParticipationExplanation(locale, flow20?.driverSummary as Parameters<typeof buildF10EtfParticipationExplanation>[1], flow5?.value ?? null, flow20?.value ?? null);
  const extensionExplanation = buildF10FlowExtensionExplanation(locale, flow20?.value ?? null, flowPercentile?.value ?? null);
  const priceFlowExplanation = buildF10PriceFlowExplanation(locale, price20?.driverSummary as Parameters<typeof buildF10PriceFlowExplanation>[1], price20?.value ?? null, flow20?.value ?? null);
  const breadthExplanation = buildF10BreadthExplanation(locale, breadthState);

  const formatAsOf = (iso: string | undefined) => iso
    ? new Intl.DateTimeFormat(language === "FR" ? "fr-CA" : "en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso))
    : "—";

  const futuresDirection = wow?.value == null ? t("f10.state.unavailable") : wow.value > 0 ? t("f10.channel.adding") : wow.value < 0 ? t("f10.channel.reducing") : t("f10.state.unchanged");
  const etfDirection = flow5?.value == null ? t("f10.state.unavailable") : flow5.value > 0 ? t("f10.channel.expanding") : flow5.value < 0 ? t("f10.channel.contracting") : t("f10.state.unchanged");

  const localizedState = (state: string | null | undefined) => {
    const key = state ? STATE_KEYS[state as keyof typeof STATE_KEYS] : undefined;
    return key ? t(key) : t("f10.state.unavailable");
  };

  // Layout-only change: the mini-cells for a channel used to be dropped
  // straight into the section's single-column grid (`.f10Channel`), so N
  // related KPIs stacked N rows tall. Wrapping them in `.f10KpiRow` (a
  // wrapping horizontal grid) lets same-channel KPIs sit side by side
  // instead, which is the fix for F10 reading as an excessively tall
  // vertical block. No data/visibility change — same cockpit-visible KPIs,
  // same KpiMiniCell.
  const renderKpis = (ids: string[]) => (
    <div className={styles.f10KpiRow}>
      {ids
        .map((id) => byId(kpis, id))
        .filter((kpi): kpi is CanonicalKpi => Boolean(kpi))
        .map((kpi) => (
          <KpiMiniCell key={kpi.id} kpi={kpi} directionalColoring={directionalColoring} onOpenKpi={onOpenKpi} />
        ))}
    </div>
  );

  const renderExplanation = (interpretation: F10Explanation) => (
    <div className={styles.f10PlainCopy}>
      <p>{interpretation.explanation}</p>
      <p><strong>{t("f10.copy.why")}</strong> {interpretation.whyItMatters}</p>
      {interpretation.caveat && <p><strong>{t("f10.copy.caveat")}</strong> {interpretation.caveat}</p>}
    </div>
  );

  return (
    <div className={styles.f10Face}>
      <div className={styles.f10PlainCopy}>
        <p>{t("f10.copy.scope")}</p>
        <p>{t("f10.copy.contextOnly")}</p>
      </div>
      <section className={styles.f10Channel}>
        <span className={styles.sectionLabel}>{t("f10.section.futures")}</span>
        {renderKpis(futuresIds)}
        <div className={styles.f10StateGrid}>
          <span>{t("f10.label.state")}</span><strong>{localizedState(wow?.driverSummary)}</strong>
          <span>{t("f10.label.crowding")}</span><strong>{localizedState(percentile?.driverSummary)}</strong>
        </div>
        {renderExplanation(futuresExplanation)}
      </section>

      <section className={styles.f10Channel}>
        <span className={styles.sectionLabel}>{t("f10.section.etf")}</span>
        {renderKpis(etfIds)}
        <div className={styles.f10StateGrid}>
          <span>{t("f10.label.participation")}</span><strong>{localizedState(flow20?.driverSummary)}</strong>
          <span>{t("f10.label.intensity")}</span><strong>{localizedState(flowZ?.driverSummary)}</strong>
          <span>{t("f10.label.extension")}</span><strong>{localizedState(flowPercentile?.driverSummary)}</strong>
          <span>{t("f10.label.priceFlow")}</span><strong>{localizedState(price20?.driverSummary)}</strong>
        </div>
        {renderExplanation(participationExplanation)}
        <div className={styles.f10PlainCopy}>
          <p>{t("f10.copy.intensityEducation")}</p>
          <p><strong>{t("f10.copy.caveat")}</strong> {t("f10.copy.intensityCaveat")}</p>
        </div>
        {renderExplanation(extensionExplanation)}
        {renderExplanation(priceFlowExplanation)}
        <div className={styles.f10PlainCopy}><p>{t("f10.copy.participationVsExtension")}</p></div>
      </section>

      <section className={styles.f10BreadthBlock}>
        <div className={styles.f10Breadth}>
          <span>{t("f10.label.breadth")}</span>
          <strong>{breadthLabelKey ? t(breadthLabelKey) : t("f10.state.unavailable")}</strong>
        </div>
        <div className={styles.f10HorizonGrid}>
          <span>{t("f10.channel.futures")}</span><strong>{futuresDirection}</strong><span>{t("f10.asOf", { date: formatAsOf(wow?.observationAt) })}</span>
          <span>{t("f10.channel.etf")}</span><strong>{etfDirection} · 5 obs.</strong><span>{t("f10.asOf", { date: formatAsOf(flow5?.observationAt) })}</span>
        </div>
        {renderExplanation(breadthExplanation)}
      </section>
    </div>
  );
}
