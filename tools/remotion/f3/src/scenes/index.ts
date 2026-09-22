import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { FedBasics } from "./FedBasics";
import { Distribution } from "./Distribution";
import { PathRepricing } from "./PathRepricing";
import { Surprise } from "./Surprise";
import { Transmission } from "./Transmission";
import { InformationSet } from "./InformationSet";
import { MistakesFailures } from "./MistakesFailures";
import { TerminalUsage } from "./TerminalUsage";
import { GlossaryFlash } from "./GlossaryFlash";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "fed-basics": FedBasics,
  distribution: Distribution,
  "path-repricing": PathRepricing,
  surprise: Surprise,
  transmission: Transmission,
  "information-set": InformationSet,
  "mistakes-failures": MistakesFailures,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
