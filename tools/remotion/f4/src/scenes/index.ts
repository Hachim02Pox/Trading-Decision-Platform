import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { WhatInflation } from "./WhatInflation";
import { CoreCpi } from "./CoreCpi";
import { MomYoy } from "./MomYoy";
import { PceVsCpi } from "./PceVsCpi";
import { Ppi } from "./Ppi";
import { Annualized } from "./Annualized";
import { TwoChannels } from "./TwoChannels";
import { Mistakes } from "./Mistakes";
import { TerminalUsage } from "./TerminalUsage";
import { GlossaryFlash } from "./GlossaryFlash";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "what-inflation": WhatInflation,
  "core-cpi": CoreCpi,
  "mom-yoy": MomYoy,
  "pce-vs-cpi": PceVsCpi,
  ppi: Ppi,
  annualized: Annualized,
  "two-channels": TwoChannels,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
