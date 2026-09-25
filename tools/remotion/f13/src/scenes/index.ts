import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro, Calendar, Importance, Active, Surprise, CpiExample, Transmission } from "./ScenesA";
import { WhenItFails, ScenarioTree, BeforeAfter, Mistakes, TerminalUsage, GlossaryFlash, Recap } from "./ScenesB";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  calendar: Calendar,
  importance: Importance,
  active: Active,
  surprise: Surprise,
  "cpi-example": CpiExample,
  transmission: Transmission,
  "when-it-fails": WhenItFails,
  "scenario-tree": ScenarioTree,
  "before-after": BeforeAfter,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
