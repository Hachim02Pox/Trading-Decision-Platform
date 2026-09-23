import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { KeyNumbers } from "./KeyNumbers";
import { RevisionsMatter } from "./RevisionsMatter";
import { TerminalUsage } from "./TerminalUsage";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "key-numbers": KeyNumbers,
  "revisions-matter": RevisionsMatter,
  "terminal-usage": TerminalUsage,
  recap: Recap,
};
