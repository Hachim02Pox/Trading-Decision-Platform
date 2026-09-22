import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ClockIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Factory, Store, Truck, PriceTag } from "./props";

const Gear: React.FC<{ size?: number }> = ({ size = 110 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${frame * 3}deg)` }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="44" y="4" width="12" height="20" rx="3" fill={theme.colors.context} transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="30" fill={theme.colors.context} />
      <circle cx="50" cy="50" r="12" fill={theme.colors.bg} />
    </svg>
  );
};

export const Ppi: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const truckX = interpolate(frame, [c(3), c(7)], [0, 520], { ...clamp, easing: theme.ease.inOut });
  const margin = interpolate(frame, [c(10), c(10) + 40], [1, 0.45], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F4 · PPI" title="En amont : les prix des producteurs" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(3)} volume={0.4} />
      <Sfx file="bass.wav" at={c(8)} volume={0.5} />
      <Sfx file="pop.wav" at={c(10)} volume={0.4} />
      <Sfx file="pop.wav" at={c(11)} volume={0.4} />
      <Sfx file="pop.wav" at={c(12)} volume={0.4} />
      <Sfx file="chime.wav" at={c(14)} volume={0.45} />
      <Sfx file="bass.wav" at={c(17)} volume={0.45} />

      <Beat from={c(0)} to={c(8)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 160 }}>
            <Factory size={260} />
            <div style={{ textAlign: "center" }}>
              <Big size={30}>Usine</Big>
            </div>
          </div>
          <div style={{ position: "absolute", left: 360 + truckX, top: 290 }}>
            <Truck size={190} />
          </div>
          <div style={{ position: "absolute", left: 1100, top: 160 }}>
            <Store size={260} />
            <div style={{ textAlign: "center" }}>
              <Big size={30}>Magasin</Big>
            </div>
          </div>
          <div style={{ position: "absolute", left: 1430, top: 220 }}>
            <Person size={200} color={theme.colors.accentDim} label="consommateur" />
          </div>
          <div style={{ position: "absolute", left: 60, top: 20 }}>
            <Pop at={c(1)}>
              <PriceTag text="PPI : prix de vente des producteurs" color={theme.colors.accentBright} rotate={0} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1080, top: 20 }}>
            <Pop at={c(6)}>
              <PriceTag text="CPI · PCE : prix au consommateur" color={theme.colors.context} rotate={0} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
            <Pop at={c(6)}>
              <Big size={34} color={theme.colors.accentBright}>L&apos;amont : l&apos;usine, avant le magasin</Big>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(8)} to={c(14)} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Factory size={250} hot />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowGlyph up color={theme.colors.negative} size={40} />
              <Big size={30} color={theme.colors.negative}>Coûts en hausse</Big>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Pop at={c(10)}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 26, width: 820 }}>
                <div style={{ width: 120, height: 60, borderRadius: 10, background: theme.colors.panel, border: `1px solid ${theme.colors.hairline}`, overflow: "hidden" }}>
                  <div style={{ width: `${margin * 100}%`, height: "100%", background: theme.colors.accent }} />
                </div>
                <div>
                  <Big size={28}>1 · Ils rognent leurs marges</Big>
                </div>
              </Panel>
            </Pop>
            <Pop at={c(11)}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 26, width: 820 }}>
                <Gear size={90} />
                <Big size={28}>2 · La productivité compense</Big>
              </Panel>
            </Pop>
            <Pop at={c(12)}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 26, width: 820 }}>
                <ClockIcon size={80} />
                <PriceTag text="+ prix" color={theme.colors.negative} />
                <Big size={28}>3 · Répercuté au consommateur, avec retard</Big>
              </Panel>
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={c(14)} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {["Soins médicaux", "Billets d'avion", "Services financiers"].map((l, i) => {
              const move = interpolate(frame, [c(15) + i * 8, c(15) + i * 8 + 30], [0, 1], { ...clamp, easing: theme.ease.inOut });
              return (
                <div key={l} style={{ transform: `translateX(${move * 260}px)`, opacity: 1 - move * 0.7 }}>
                  <PriceTag text={`PPI · ${l}`} color={theme.colors.accentBright} rotate={0} />
                </div>
              );
            })}
          </div>
          <Pop at={c(14)}>
            <Panel glow style={{ width: 300, textAlign: "center", padding: 40 }}>
              <Big size={52}>PCE</Big>
              <Label size={22}>certaines catégories du PPI servent à l&apos;estimer</Label>
            </Panel>
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <Pop at={c(16)}>
              <PriceTag text="✓ Le détail du PPI est utile" color={theme.colors.positive} rotate={0} />
            </Pop>
            <Pop at={c(17)}>
              <PriceTag text="✕ Le PPI global ne prédit ni CPI ni PCE" color={theme.colors.negative} rotate={0} />
            </Pop>
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};
