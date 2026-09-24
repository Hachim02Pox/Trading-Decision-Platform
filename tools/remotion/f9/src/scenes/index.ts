import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro, Issuance, Duration, Auctions, TailExample, TermPremium, GoldTransmission } from "./ScenesA";
import { Mistakes, TerminalUsage, GlossaryFlash, Recap } from "./ScenesB";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  issuance: Issuance,
  duration: Duration,
  auctions: Auctions,
  "tail-example": TailExample,
  "term-premium": TermPremium,
  "gold-transmission": GoldTransmission,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
