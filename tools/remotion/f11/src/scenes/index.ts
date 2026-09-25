import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Basics, CallsPuts, PremiumStrike, RealizedVol } from "./ScenesA";
import { Greeks, SkewTerm, OpenInterest, Hedging, GvzCvol, EventRisk, TerminalUsage } from "./ScenesB";
import { IntroV5, Analogy, CallExample, PutExample, MoneynessGld, ImpliedVolGld, DeltaDeep, GammaDeep, ThetaVega, VannaCharm } from "./ScenesC";
import { Dealers, LongGamma, ShortGamma, Convention, GexCalc } from "./ScenesD";
import { DashCardsScene, GexBars, GexLines, FlipRegime, Walls, VannaPanel, CharmPanel, DexPanel, PriceChartScene, AiText } from "./ScenesE";
import { GldToGold, Playbook, ScenarioBear, ScenarioBull, ScenarioPin, Routine, MistakesGex, GlossaryV5, RecapV5 } from "./ScenesF";

// F11 v5 (2026-09-24): 45 scenes. v4 scenes kept verbatim (same narration → same cues):
// basics, calls-puts, premium-strike, realized-vol, greeks, skew-term, event-risk, open-interest,
// hedging, gvz-cvol, terminal-usage.
export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: IntroV5,
  analogy: Analogy,
  basics: Basics,
  "calls-puts": CallsPuts,
  "call-example": CallExample,
  "put-example": PutExample,
  "premium-strike": PremiumStrike,
  "moneyness-gld": MoneynessGld,
  "implied-vol-gld": ImpliedVolGld,
  "realized-vol": RealizedVol,
  greeks: Greeks,
  "delta-deep": DeltaDeep,
  "gamma-deep": GammaDeep,
  "theta-vega": ThetaVega,
  "vanna-charm": VannaCharm,
  "skew-term": SkewTerm,
  "event-risk": EventRisk,
  "open-interest": OpenInterest,
  dealers: Dealers,
  hedging: Hedging,
  "long-gamma": LongGamma,
  "short-gamma": ShortGamma,
  convention: Convention,
  "gex-calc": GexCalc,
  "dash-cards": DashCardsScene,
  "gex-bars": GexBars,
  "gex-lines": GexLines,
  "flip-regime": FlipRegime,
  walls: Walls,
  "vanna-panel": VannaPanel,
  "charm-panel": CharmPanel,
  "dex-panel": DexPanel,
  "price-chart": PriceChartScene,
  "ai-text": AiText,
  "gld-to-gold": GldToGold,
  playbook: Playbook,
  "scenario-bear": ScenarioBear,
  "scenario-bull": ScenarioBull,
  "scenario-pin": ScenarioPin,
  routine: Routine,
  "mistakes-gex": MistakesGex,
  "gvz-cvol": GvzCvol,
  "terminal-usage": TerminalUsage,
  glossary: GlossaryV5,
  recap: RecapV5,
};
