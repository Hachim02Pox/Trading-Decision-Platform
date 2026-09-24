import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro, Reserves, TgaExample, Tga, FundingRates, SpreadExample } from "./ScenesA";
import { Regimes, Mistakes, TerminalUsage, GlossaryFlash, Recap } from "./ScenesB";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  reserves: Reserves,
  "tga-example": TgaExample,
  tga: Tga,
  "funding-rates": FundingRates,
  "spread-example": SpreadExample,
  regimes: Regimes,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
