import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { Probability } from "./Probability";
import { TrapExample } from "./TrapExample";
import { TerminalUsage } from "./TerminalUsage";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  probability: Probability,
  "trap-example": TrapExample,
  "terminal-usage": TerminalUsage,
  recap: Recap,
};
