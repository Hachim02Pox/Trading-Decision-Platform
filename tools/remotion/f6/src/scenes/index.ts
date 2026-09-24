import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { Pairs } from "./Pairs";
import { WhoTrades } from "./WhoTrades";
import { Dxy } from "./Dxy";
import { DxyLimits } from "./DxyLimits";
import { Momentum } from "./Momentum";
import { Drivers } from "./Drivers";
import { GoldMechanics } from "./GoldMechanics";
import { Regimes } from "./Regimes";
import { Mistakes } from "./Mistakes";
import { TerminalUsage } from "./TerminalUsage";
import { GlossaryFlash } from "./GlossaryFlash";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  pairs: Pairs,
  "who-trades": WhoTrades,
  dxy: Dxy,
  "dxy-limits": DxyLimits,
  momentum: Momentum,
  drivers: Drivers,
  "gold-mechanics": GoldMechanics,
  regimes: Regimes,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
