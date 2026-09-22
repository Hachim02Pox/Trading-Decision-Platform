import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bird, Bubble, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";

const CASCADE = ["Marchés monétaires", "Crédit", "Consommation", "Emploi", "Inflation"];

export const FedBasics: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const cascadeCues = [c(11), c(12), c(13), c(13) + 18, c(14)];

  return (
    <SceneShell eyebrow="F3 · Les bases" title="La Fed fixe aujourd'hui, le marché devine demain" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(2)} volume={0.45} />
      <Sfx file="tick.wav" at={c(3)} volume={0.4} />
      <Sfx file="chime.wav" at={c(9)} volume={0.5} />
      <Sfx file="whoosh.wav" at={c(10)} volume={0.45} />
      <Sfx file="whoosh.wav" at={c(24) - 2} volume={0.5} />
      <Sfx file="whoosh.wav" at={c(27) - 2} volume={0.5} />
      <Sfx file="bass.wav" at={c(31)} volume={0.5} />

      <Beat from={c(1)} to={c(10)} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Pop at={c(2)}>
              <BankIcon size={220} color={theme.colors.textPrimary} />
            </Pop>
            <Big size={40}>La Fed</Big>
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Pop key={i} at={c(3) + i * 4}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      border: `2px solid ${theme.colors.accent}`,
                      background: `${theme.colors.accent}30`,
                      color: theme.colors.accentBright,
                      fontFamily: theme.mono,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                </Pop>
              ))}
            </div>
            <Label>8 réunions par an</Label>
          </div>
          <Beat from={c(5)} style={{ position: "relative" }}>
            <Panel style={{ width: 640 }} glow={frame >= c(9)}>
              <Label color={theme.colors.textMuted}>Fourchette cible · taux entre banques, au jour le jour</Label>
              <svg width="590" height="150" viewBox="0 0 590 150" style={{ marginTop: 20 }}>
                <line x1="20" y1="80" x2="570" y2="80" stroke={theme.colors.hairline} strokeWidth="3" />
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <g key={k}>
                    <line x1={20 + k * 110} y1="70" x2={20 + k * 110} y2="90" stroke={theme.colors.textMuted} strokeWidth="2" />
                    <text x={20 + k * 110} y="122" fill={theme.colors.textMuted} fontSize="18" textAnchor="middle" fontFamily={theme.mono}>
                      {(3 + k * 0.5).toFixed(1).replace(".", ",")}
                    </text>
                  </g>
                ))}
                <rect
                  x={240}
                  y={58}
                  width={interpolate(frame, [c(9), c(9) + 20], [0, 55], { ...clamp, easing: theme.ease.out })}
                  height={44}
                  rx={8}
                  fill={theme.colors.accent}
                  opacity={0.85}
                />
              </svg>
              <Pop at={c(9) + 10}>
                <Big color={theme.colors.accentBright} size={42}>
                  4,00 % – 4,25 %
                </Big>
              </Pop>
            </Panel>
          </Beat>
        </Center>
      </Beat>

      <Beat from={c(10)} to={c(15)} style={{ left: 0, top: 0 }}>
        <Center gap={24}>
          <Pop at={c(10)}>
            <BankIcon size={120} color={theme.colors.accent} />
          </Pop>
          {CASCADE.map((label, i) => {
            const on = frame >= cascadeCues[i];
            const flow = ((frame - cascadeCues[i]) % 40) / 40;
            return (
              <React.Fragment key={label}>
                <svg width="70" height="30" viewBox="0 0 70 30">
                  <line x1="0" y1="15" x2="60" y2="15" stroke={on ? theme.colors.accent : theme.colors.hairline} strokeWidth="3" strokeDasharray="6 6" strokeDashoffset={on ? -flow * 24 : 0} />
                  <path d="M58 7 L68 15 L58 23" stroke={on ? theme.colors.accent : theme.colors.hairline} strokeWidth="3" fill="none" />
                </svg>
                <Pop at={cascadeCues[i]}>
                  <Panel style={{ padding: "22px 20px", width: 200, textAlign: "center" }} glow={i === CASCADE.length - 1 && on}>
                    <div style={{ color: theme.colors.textPrimary, fontSize: 21, fontWeight: 700 }}>{label}</div>
                  </Panel>
                </Pop>
              </React.Fragment>
            );
          })}
        </Center>
      </Beat>

      <Beat from={c(15)} to={c(23)} style={{ left: 0, top: 0 }}>
        <Center gap={140}>
          <Pop at={c(15)}>
            <Panel style={{ width: 460, textAlign: "center", padding: 44 }}>
              <Label>Aujourd&apos;hui</Label>
              <Big size={46}>4,00 – 4,25 %</Big>
              <div style={{ color: theme.colors.positive, fontFamily: theme.mono, fontSize: 20, marginTop: 14 }}>OBSERVÉ</div>
            </Panel>
          </Pop>
          <Pop at={c(18)}>
            <div
              style={{
                width: 460,
                padding: 44,
                borderRadius: 22,
                border: `2px dashed ${theme.colors.textMuted}`,
                textAlign: "center",
                position: "relative",
              }}
            >
              <Label>Demain</Label>
              <Big size={70} color={theme.colors.textMuted}>
                ? ? ?
              </Big>
              <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 20, marginTop: 8 }}>INCONNU</div>
            </div>
          </Pop>
          <div style={{ position: "absolute", bottom: -20, display: "flex", gap: 34 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Pop key={i} at={c(20) + i * 5}>
                <Person size={110} phase={i} color={[theme.colors.context, theme.colors.accentDim, theme.colors.textMuted][i % 3]} wave={i % 2 === 0} />
              </Pop>
            ))}
          </div>
        </Center>
      </Beat>

      <Beat from={c(23)} to={c(30)} style={{ left: 0, top: 0 }}>
        <Center gap={200}>
          <Beat from={c(24)} style={{ position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Bird kind="hawk" size={260} />
              <Big color={theme.colors.negative} size={48}>
                Faucon
              </Big>
              <Label size={24}>Plus strict que prévu · taux hauts contre l&apos;inflation</Label>
            </div>
          </Beat>
          <Beat from={c(27)} style={{ position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Bird kind="dove" size={260} flip />
              <Big color={theme.colors.positive} size={48}>
                Colombe
              </Big>
              <Label size={24}>Plus accommodante que prévu · baisse pour soutenir</Label>
            </div>
          </Beat>
        </Center>
      </Beat>

      <Beat from={c(30)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", justifyContent: "center" }}>
            <Big size={96} color={theme.colors.accentBright} glow>
              « prévu »
            </Big>
          </div>
          <div style={{ position: "absolute", left: 80, top: 210 }}>
            <Pop at={c(31)}>
              <Panel style={{ width: 720, display: "flex", alignItems: "center", gap: 26 }}>
                <Bird kind="hawk" size={130} />
                <div>
                  <Label color={theme.colors.textPrimary} size={26}>Inchangé, alors que le marché attendait une baisse</Label>
                  <div style={{ color: theme.colors.negative, fontSize: 30, fontWeight: 800, marginTop: 8 }}>→ Faucon</div>
                </div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", right: 80, top: 210 }}>
            <Pop at={c(33)}>
              <Panel style={{ width: 720, display: "flex", alignItems: "center", gap: 26 }}>
                <Bird kind="dove" size={130} />
                <div>
                  <Label color={theme.colors.textPrimary} size={26}>Inchangé, alors que le marché craignait une hausse</Label>
                  <div style={{ color: theme.colors.positive, fontSize: 30, fontWeight: 800, marginTop: 8 }}>→ Colombe</div>
                </div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
            <Pop at={c(35)}>
              <Bubble text="Tout dépend du point de comparaison" tone={theme.colors.accentBright} width={620} />
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
