import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro, Vix, VixMath, Move } from "./ScenesA";
import { Credit, OasExample, Regimes, Mistakes } from "./ScenesB";
import { TerminalUsage, GlossaryFlash, Recap } from "./ScenesC";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  vix: Vix,
  "vix-math": VixMath,
  move: Move,
  credit: Credit,
  "oas-example": OasExample,
  regimes: Regimes,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
