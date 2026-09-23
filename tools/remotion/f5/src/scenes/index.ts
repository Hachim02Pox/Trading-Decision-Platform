import type { ComponentType } from "react";
import type { SceneProps } from "./shared";
import { Intro } from "./Intro";
import { TwoSurveys } from "./TwoSurveys";
import { Unemployment } from "./Unemployment";
import { Payrolls } from "./Payrolls";
import { Claims } from "./Claims";
import { Wages } from "./Wages";
import { Growth } from "./Growth";
import { Ism } from "./Ism";
import { GdpNow } from "./GdpNow";
import { GoldChain } from "./GoldChain";
import { Mistakes } from "./Mistakes";
import { TerminalUsage } from "./TerminalUsage";
import { GlossaryFlash } from "./GlossaryFlash";
import { Recap } from "./Recap";

export const SCENE_COMPONENTS: Record<string, ComponentType<SceneProps>> = {
  intro: Intro,
  "two-surveys": TwoSurveys,
  unemployment: Unemployment,
  payrolls: Payrolls,
  claims: Claims,
  wages: Wages,
  growth: Growth,
  ism: Ism,
  gdpnow: GdpNow,
  "gold-chain": GoldChain,
  mistakes: Mistakes,
  "terminal-usage": TerminalUsage,
  "glossary-flash": GlossaryFlash,
  recap: Recap,
};
