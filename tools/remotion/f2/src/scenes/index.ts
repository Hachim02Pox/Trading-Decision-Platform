import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { RealRate } from "./RealRate";
import { TrapExample } from "./TrapExample";
import { TerminalUsage } from "./TerminalUsage";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "real-rate": RealRate,
  "trap-example": TrapExample,
  "terminal-usage": TerminalUsage,
  recap: Recap,
};
