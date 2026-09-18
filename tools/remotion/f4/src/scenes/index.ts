import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { HeadlineVsCore } from "./HeadlineVsCore";
import { TrapExample } from "./TrapExample";
import { TerminalUsage } from "./TerminalUsage";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "headline-vs-core": HeadlineVsCore,
  "trap-example": TrapExample,
  "terminal-usage": TerminalUsage,
  recap: Recap,
};
