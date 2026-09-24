import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Factory, PriceTag } from "./props";
import { Pill, CrossDraw, Stamp, CheckDraw } from "./props5";
import { Bond, SpreadBars, Thermo } from "./props7";

const C = theme.colors;

export const Credit: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t3 = cue("troisieme thermometre");
  const tEnt = cue("quand une entreprise emprunte");
  const tSupp = cue("ce supplement");
  const RISKS = [
    { t: "défaut", at: cue("le risque de defaut") },
    { t: "dégradation de la note", at: cue("le risque de degradation") },
    { t: "liquidité", at: cue("le risque de liquidite") },
    { t: "prime de risque", at: cue("et une prime de risque") },
  ];
  const tOas = cue("l oas est");
  const tBp = cue("il se compte");
  const t100 = cue("cent points de base");
  const tHy = cue("les obligations a haut rendement");
  const tComp = cue("mais la composition");

  return (
    <SceneShell eyebrow="F7 · Écarts de crédit" title="Ce que coûte le risque de ne pas être remboursé" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t3} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSupp} volume={0.4} />
      {RISKS.map((r) => (
        <Sfx key={r.t} file="tick.wav" at={r.at} volume={0.35} />
      ))}
      <Sfx file="pop.wav" at={tOas} volume={0.4} />
      <Sfx file="chime.wav" at={t100} volume={0.45} />

      <Beat from={0} to={tOas} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 20, display: "flex", alignItems: "flex-end", gap: 50 }}>
            <Pop at={t3}>
              <Thermo level={0.65} color={C.accent} label="crédit" size={280} />
            </Pop>
            {frame >= tEnt && (
              <Pop at={tEnt}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Factory size={100} />
                    <Bond title="Entreprise" rate="7,2 %" color={C.accent} width={230} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <BankIcon size={90} color={C.context} />
                    <Bond title="État" rate="4,1 %" width={230} />
                  </div>
                </div>
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 960, top: 20, width: 760 }}>
            {frame >= tSupp && (
              <Pop at={tSupp}>
                <Panel glow style={{ padding: "18px 24px" }}>
                  <Big size={32} color={C.accentBright}>le supplément = l&apos;écart de crédit</Big>
                </Panel>
              </Pop>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              {RISKS.map((r) => (
                <Pop key={r.t} at={r.at}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <CheckDraw at={r.at + 4} size={38} color={C.accentBright} />
                    <Label size={28} color={C.textPrimary}>risque de {r.t}</Label>
                  </div>
                </Pop>
              ))}
            </div>
          </div>
        </div>
      </Beat>

      <Beat from={tOas} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <Pop at={tOas}>
            <Panel glow style={{ padding: "18px 34px", textAlign: "center" }}>
              <Big size={40}>OAS</Big>
              <Label size={24} color={C.textPrimary}>écart ajusté des options intégrées, comparé à la courbe de l&apos;État</Label>
            </Panel>
          </Pop>
          {frame >= tBp && (
            <Pop at={tBp}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: theme.mono, fontSize: 44, fontWeight: 900 }}>
                <span style={{ color: C.accentBright }}>100 points de base</span>
                <span style={{ color: C.textMuted }}>=</span>
                <span style={{ color: C.textPrimary }}>1 point de %</span>
              </div>
            </Pop>
          )}
          {frame >= tHy && (
            <Pop at={tHy}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 60 }}>
                {[
                  { t: "bonne qualité", h: 110, col: C.context },
                  { t: "haut rendement", h: 260, col: C.negative },
                ].map((b) => (
                  <div key={b.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 150, height: interpolate(frame, [tHy, tHy + 30], [0, b.h], { ...clamp, easing: theme.ease.out }), borderRadius: 12, background: `linear-gradient(180deg, ${b.col}, ${b.col}55)` }} />
                    <Label size={24} color={C.textPrimary}>{b.t}</Label>
                  </div>
                ))}
                {frame >= tComp && <Label size={24}>… mais composition et durée de l&apos;indice comptent aussi</Label>}
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const OasExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("exemple");
  const tRef = cue("la reference d etat");
  const tDiff = cue("la difference simple");
  const t310 = cue("soit 310");
  const tLarg = cue("maintenant l ecart");
  const t100 = cue("les investisseurs exigent");
  const tTend = cue("le credit se tend");
  const tAtt = cue("mais attention");
  const tRegard = cue("il faut regarder");
  const wide = frame >= tLarg;
  const corp = interpolate(frame, [tLarg, tLarg + 40], [7.2, 8.2], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F7 · Exemple" title="Rendement contre écart" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEx} volume={0.4} />
      <Sfx file="tick.wav" at={tDiff} volume={0.4} />
      <Sfx file="chime.wav" at={t310} volume={0.45} />
      <Sfx file="bass.wav" at={tLarg} volume={0.45} />
      <Sfx file="bass.wav" at={tAtt} volume={0.4} />

      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20 }}>
            <Pop at={tEx}>
              <SpreadBars corp={corp} gov={4.1} scale={52} spreadLabel={wide ? `${Math.round((corp - 4.1) * 100)} pb` : frame >= t310 ? "310 pb" : frame >= tDiff ? "3,10 pts" : ""} hi={wide} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 900, top: 40, width: 820, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tDiff && (
              <Pop at={tDiff}>
                <div style={{ fontFamily: theme.mono, fontSize: 40, fontWeight: 900, color: C.textPrimary }}>7,20 − 4,10 = 3,10 pts</div>
              </Pop>
            )}
            {frame >= t310 && (
              <Pop at={t310}>
                <Pill text="= 310 points de base" size={30} filled />
              </Pop>
            )}
            {frame >= tLarg && (
              <Pop at={tLarg}>
                <Panel glow style={{ padding: "16px 24px", borderColor: C.negative }}>
                  <Label size={26} color={C.textPrimary}>l&apos;écart passe à 410 pb, le taux de l&apos;État ne bouge pas</Label>
                </Panel>
              </Pop>
            )}
            {frame >= t100 && (
              <Pop at={t100}>
                <Big size={36} color={C.negative}>+100 pb exigés pour le même risque</Big>
              </Pop>
            )}
            {frame >= tTend && <div style={{ marginTop: 26 }}><Stamp at={tTend} text="LE CRÉDIT SE TEND" size={34} /></div>}
          </div>
          {frame >= tAtt && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
              <Pop at={tAtt}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <GoldBarIcon size={60} />
                  <Big size={30}>?</Big>
                  <Label size={26} color={C.textPrimary}>à lui seul, l&apos;écart ne dit pas ce que fera l&apos;or</Label>
                </div>
              </Pop>
              {frame >= tRegard && (
                <Pop at={tRegard}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Pill text="taux" size={24} />
                    <Pill text="dollar" size={24} />
                    <Pill text="liquidité" size={24} />
                  </div>
                </Pop>
              )}
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Regimes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("alors comment le stress");
  const t1 = cue("premier scenario");
  const tAch = cue("les investisseurs achetent");
  const tProf = cue("et l or peut en profiter");
  const t2 = cue("deuxieme scenario");
  const tDom = cue("et c est la demande");
  const t3 = cue("troisieme scenario");
  const tMarge = cue("appels de marge");
  const tVend = cue("ils vendent");
  const tRep = cue("avant parfois");
  const tFix = cue("ce ne sont pas");

  return (
    <SceneShell eyebrow="F7 · Du stress à l'or" title="Trois scénarios qui se font concurrence" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.4} />
      <Sfx file="pop.wav" at={t2} volume={0.4} />
      <Sfx file="pop.wav" at={t3} volume={0.4} />
      <Sfx file="bass.wav" at={tVend} volume={0.45} />
      <Sfx file="chime.wav" at={tFix} volume={0.5} />

      <Beat from={0} to={t1} style={{ left: 0, top: 0 }}>
        <Center gap={50}>
          <Pop at={tQ}>
            <Thermo level={0.85} color={C.negative} label="stress" size={300} />
          </Pop>
          <Pop at={tQ + 10}>
            <Big size={90} color={C.accent}>→</Big>
          </Pop>
          <Pop at={tQ + 18}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <GoldBarIcon size={170} />
              <Big size={90} color={C.accentBright}>?</Big>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={t1 - 4} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ display: "flex", gap: 30 }}>
            <Pop at={t1}>
              <Panel glow={frame >= t1 && frame < t2} style={{ width: 540, height: 480, padding: 24, borderColor: C.positive }}>
                <Big size={28} color={C.positive}>1 · Fuite ordonnée devant le risque</Big>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 30 }}>
                  {frame >= tAch && <Bond title="État" rate="achat" width={170} />}
                  {frame >= tAch && <ArrowGlyph up={false} color={C.positive} size={50} />}
                  {frame >= tProf && <GoldBarIcon size={110} color={C.positive} />}
                </div>
                {frame >= tAch && <Label size={22} color={C.textPrimary}>taux réels en baisse</Label>}
                {frame >= tProf && <Label size={22} color={C.positive}>l&apos;or peut en profiter, comme actif de réserve</Label>}
              </Panel>
            </Pop>
            <Pop at={t2}>
              <Panel glow={frame >= t2 && frame < t3} style={{ width: 540, height: 480, padding: 24 }}>
                <Big size={28} color={C.accentBright}>2 · Pénurie de dollars</Big>
                <div style={{ position: "relative", height: 200, marginTop: 20 }}>
                  {[0, 1, 2].map((i) => {
                    const x = interpolate(frame, [t2 + 10 + i * 5, t2 + 60 + i * 5], [0, 250 - i * 70], { ...clamp, easing: theme.ease.out });
                    return (
                      <div key={i} style={{ position: "absolute", left: x, top: 20 }}>
                        <Person size={100} phase={i} color={C.textSecondary} run={frame < t2 + 65} />
                      </div>
                    );
                  })}
                  <div style={{ position: "absolute", left: 360, top: 20 }}>
                    <DollarIcon size={110} />
                  </div>
                </div>
                {frame >= tDom && <Label size={22} color={C.textPrimary}>la demande de dollar domine</Label>}
              </Panel>
            </Pop>
            <Pop at={t3}>
              <Panel glow={frame >= t3} style={{ width: 540, height: 480, padding: 24, borderColor: C.negative }}>
                <Big size={28} color={C.negative}>3 · Désendettement forcé</Big>
                {frame >= tMarge && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
                    <PriceTag text="APPEL DE MARGE" color={C.negative} rotate={-4} />
                  </div>
                )}
                {frame >= tVend && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 30 }}>
                    <GoldBarIcon size={100} color={C.negative} />
                    <PriceTag text="VENDU" color={C.negative} rotate={6} />
                  </div>
                )}
                {frame >= tRep && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20 }}>
                    <ArrowGlyph up color={C.positive} size={40} />
                    <Label size={22} color={C.textPrimary}>parfois, reprise plus tard</Label>
                  </div>
                )}
              </Panel>
            </Pop>
          </div>
          {frame >= tFix && (
            <Pop at={tFix}>
              <Pill text="pas des étapes fixes · des scénarios à vérifier à chaque fois" size={28} filled />
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t1b = cue("ils mesurent");
  const t2 = cue("piege deux");
  const t3 = cue("piege trois");
  const t4 = cue("et piege quatre");
  const t4b = cue("f7 sert a");
  const Trap: React.FC<{ n: number }> = ({ n }) => <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800 }}>PIÈGE {n}</div>;

  return (
    <SceneShell eyebrow="F7 · Pièges" title="Quatre pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3, t4].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Beat from={0} to={t1 - 4} style={{ left: 0, top: 0 }}>
        <Center gap={40}>
          {[1, 2, 3, 4].map((n) => (
            <Pop key={n} at={4 + n * 5}>
              <div style={{ transform: `rotate(${Math.sin(frame / 7 + n) * 6}deg)` }}>
                <svg width="170" height="160" viewBox="0 0 60 56">
                  <path d="M30 4 L57 52 H3 Z" fill={`${C.negative}22`} stroke={C.negative} strokeWidth="3" strokeLinejoin="round" />
                  <text x="30" y="44" textAnchor="middle" fontSize="24" fontWeight="900" fill={C.negative} fontFamily={theme.mono}>{n}</text>
                </svg>
              </div>
            </Pop>
          ))}
        </Center>
      </Beat>
      <Beat from={t1 - 4} to={t2} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={1} />
          <div style={{ display: "flex", gap: 50, alignItems: "flex-end" }}>
            <Thermo level={0.8} color={C.negative} label="VIX" size={240} />
            <Thermo level={0.5} color={C.context} label="MOVE" size={240} />
            <Thermo level={0.65} color={C.accent} label="crédit" size={240} />
            <div style={{ position: "relative" }}>
              <Thermo level={0.7} color={C.textMuted} label="« la peur »" size={240} />
              <div style={{ position: "absolute", left: 0, top: 60 }}>
                <CrossDraw at={t1 + 30} size={110} />
              </div>
            </div>
          </div>
          {frame >= t1b && <Label size={28} color={C.textPrimary}>trois risques différents, pas une seule jauge</Label>}
        </Center>
      </Beat>
      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Trap n={2} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Panel style={{ padding: "22px 34px" }}>
              <Big size={40}>volatilité = ampleur</Big>
            </Panel>
            <Big size={80} color={C.negative}>≠</Big>
            <Panel style={{ padding: "22px 34px" }}>
              <Big size={40}>direction de l&apos;or</Big>
            </Panel>
          </div>
        </Center>
      </Beat>
      <Beat from={t3} to={t4} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Trap n={3} />
          <div style={{ display: "flex", gap: 20 }}>
            {["VIX ↑", "HY OAS ↑", "IG OAS ↑", "MOVE ↑"].map((t, i) => (
              <Pop key={t} at={t3 + 10 + i * 6}>
                <Panel style={{ padding: "18px 26px" }}>
                  <Big size={30}>{t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          <Label size={28} color={C.accentBright}>souvent le même stress… pas quatre preuves indépendantes</Label>
        </Center>
      </Beat>
      <Beat from={t4} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Trap n={4} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Big size={44}>F7</Big>
            <Big size={50} color={C.textMuted}>→</Big>
            <div style={{ position: "relative" }}>
              <Big size={44} color={C.textMuted}>ACHAT / VENTE</Big>
              <div style={{ position: "absolute", left: 60, top: -30 }}>
                <CrossDraw at={t4 + 20} size={110} />
              </div>
            </div>
          </div>
          {frame >= t4b && (
            <Pop at={t4b}>
              <Pill text="F7 qualifie le stress · il ne prédit pas l'or" size={30} filled />
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
