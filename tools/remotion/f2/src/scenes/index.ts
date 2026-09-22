import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { BondBasics } from "./BondBasics";
import { MaturitiesCurve } from "./MaturitiesCurve";
import { BpsAnd2s10s } from "./BpsAnd2s10s";
import { RealVsNominal } from "./RealVsNominal";
import { ScenarioAbc } from "./ScenarioAbc";
import { TermPremiumRegimes } from "./TermPremiumRegimes";
import { MistakesFailures } from "./MistakesFailures";
import { TerminalUsage } from "./TerminalUsage";
import { GlossaryFlash } from "./GlossaryFlash";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "bond-basics": BondBasics,
  "maturities-curve": MaturitiesCurve,
  "bps-2s10s": BpsAnd2s10s,
  "real-vs-nominal": RealVsNominal,
  "scenario-abc": ScenarioAbc,
  "term-premium-regimes": TermPremiumRegimes,
  "mistakes-failures": MistakesFailures,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
