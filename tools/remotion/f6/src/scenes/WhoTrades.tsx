import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Factory, Truck } from "./props";
import { Office, ShieldGlyph, Pill } from "./props5";
import { Coin, QuoteBoard } from "./props6";

const C = theme.colors;

export const WhoTrades: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQui = cue("qui echange");
  const tBanks = cue("les banques");
  const tGer = cue("les gerants");
  const tEnt = cue("les entreprises");
  const tGov = cue("les gouvernements");
  const tBc = cue("les banques centrales");
  const tImp = cue("les importateurs");
  const tCouv = cue("se couvrent");
  const tFlux = cue("leurs flux");
  const FLOWS = [
    { t: "écarts de taux", at: cue("les ecarts de taux") },
    { t: "politique attendue", at: cue("la politique monetaire") },
    { t: "commerce", at: cue("le commerce") },
    { t: "capitaux", at: cue("mouvements de capitaux") },
    { t: "financement", at: cue("besoins de financement") },
    { t: "appétit pour le risque", at: cue("l appetit") },
    { t: "réserves", at: cue("gestion des reserves") },
    { t: "positionnement", at: cue("et le positionnement") },
  ];
  const tNote = cue("une note unique");

  const ACTORS = [
    { t: "banques", at: tBanks, icon: <Office size={110} lit /> },
    { t: "gérants", at: tGer, icon: <Person size={110} color={C.context} /> },
    { t: "entreprises", at: tEnt, icon: <Factory size={110} /> },
    { t: "gouvernements", at: tGov, icon: <BankIcon size={100} color={C.textSecondary} /> },
    { t: "banques centrales", at: tBc, icon: <BankIcon size={100} color={C.accent} /> },
    { t: "import · export", at: tImp, icon: <Truck size={120} /> },
    { t: "couverture", at: tCouv, icon: <ShieldGlyph size={100} /> },
  ];

  return (
    <SceneShell eyebrow="F6 · Qui fait le change" title="Des milliers de flux derrière un seul prix" durationInFrames={durationInFrames}>
      {ACTORS.map((a) => (
        <Sfx key={a.t} file="pop.wav" at={a.at} volume={0.3} />
      ))}
      <Sfx file="whoosh.wav" at={tFlux} volume={0.4} />
      {FLOWS.map((f) => (
        <Sfx key={f.t} file="tick.wav" at={f.at} volume={0.3} />
      ))}
      <Sfx file="chime.wav" at={tNote} volume={0.5} />

      <Beat from={tQui - 4} to={tFlux} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Pop at={tQui}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Coin sym="€" size={90} color={C.context} spin />
              <Coin sym="$" size={90} color={C.positive} spin />
              <Coin sym="¥" size={90} color={C.negative} spin />
              <Big size={46}>Qui échange des devises ?</Big>
            </div>
          </Pop>
          <div style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
            {ACTORS.map((a) => (
              <Pop key={a.t} at={a.at}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 190 }}>
                  <div style={{ height: 130, display: "flex", alignItems: "flex-end" }}>{a.icon}</div>
                  <Label size={22} color={C.textPrimary}>{a.t}</Label>
                </div>
              </Pop>
            ))}
          </div>
        </div>
      </Beat>

      <Beat from={tFlux} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: STAGE_W / 2 - 300, top: 250 }}>
            <Pop at={tFlux}>
              <QuoteBoard base="EUR" quote="USD" value={(1.1 + Math.sin(frame / 9) * 0.004).toFixed(4).replace(".", ",")} />
            </Pop>
          </div>
          {FLOWS.map((f, i) => {
            const a = (i / FLOWS.length) * Math.PI * 2 - Math.PI / 2;
            const r = 300;
            const x = STAGE_W / 2 + Math.cos(a) * (r + 260) - 140;
            const y = 290 + Math.sin(a) * r * 0.85 - 20;
            return (
              <div key={f.t} style={{ position: "absolute", left: x, top: y }}>
                <Pop at={f.at}>
                  <div style={{ transform: `translateY(${Math.sin(frame / 15 + i) * 6}px)` }}>
                    <Pill text={f.t} color={i % 2 ? C.context : C.accentBright} size={26} />
                  </div>
                </Pop>
              </div>
            );
          })}
          {frame >= tNote && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 610, display: "flex", justifyContent: "center" }}>
              <Pop at={tNote}>
                <Panel glow style={{ padding: "14px 30px" }}>
                  <Label size={28} color={C.textPrimary}>pas une note donnée à un pays : le résultat de tous ces flux</Label>
                </Panel>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
