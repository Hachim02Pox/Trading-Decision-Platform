import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro, StockFlow, Crowding, Cftc, Lag, Normalize, Etf } from "./ScenesA";
import { EtfMeaning, Scenarios, Mistakes, TerminalUsage, GlossaryFlash, Recap } from "./ScenesB";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "stock-flow": StockFlow,
  crowding: Crowding,
  cftc: Cftc,
  lag: Lag,
  normalize: Normalize,
  etf: Etf,
  "etf-meaning": EtfMeaning,
  scenarios: Scenarios,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
