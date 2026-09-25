// Re-creation of the GLD options dashboard Hachim uses (24 Sept 2026 snapshot), plus the
// teaching props of the F11 v5 video. Numbers on the summary cards are the real ones from the
// screenshot; the per-strike bars are a teaching re-creation tuned so their totals match them
// exactly (calls 242K, puts 571K, net -329K, strike 390 net -171K).
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const c = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const STRIKES = [435, 430, 427, 425, 420, 419, 415, 411, 410, 407, 405, 403, 401, 400, 399, 398, 397, 396, 395, 394, 393, 392, 391, 390, 389, 388, 387, 386, 385, 384, 383, 382, 381, 380, 379, 377, 375, 372, 370, 365, 360, 355, 350];
const CALLS = [3, 2, 2, 2, 5, 3, 4, 3, 7, 4, 14, 30, 5, 38, 6, 5, 6, 5, 10, 6, 5, 6, 6, 45, 3, 2, 2, 1, 3, 1, 1, 1, 1, 2, 0.5, 0.5, 1, 0.5, 0.5, 0, 0, 0, 0];
const PUTS = [0, 0, 0, 0.5, 1, 0.5, 1, 14, 3, 2, 4, 3, 3, 52, 5, 3, 4, 3, 10, 4, 5, 6, 8, 216, 12, 14, 16, 12, 35, 10, 12, 10, 9, 28, 20, 8, 12, 4, 8, 4, 4, 3, 2];
export const GEX_ROWS = STRIKES.map((k, i) => ({ k, call: CALLS[i], put: -PUTS[i], net: CALLS[i] - PUTS[i] }));
export const SPOT = 389.51;
export const FLIP = 394.84;
export const WALL = 390;
const Y_LABELS = [435, 427, 419, 411, 403, 395, 387, 379, 370, 355];

// ---------------------------------------------------------------------------
// GEX by strike — the main chart
// ---------------------------------------------------------------------------
export const GexChart: React.FC<{
  width?: number;
  height?: number;
  from: number;
  netOnly?: boolean;
  cumAt?: number;
  aggAt?: number;
  priceAt?: number;
  wallsAt?: number;
  flipAt?: number;
  hi?: number[];
  hiAt?: number;
  zoneHi?: { from: number; to: number; color: string; at: number };
  showAxes?: boolean;
}> = ({ width = 1000, height = 620, from, netOnly, cumAt, aggAt, priceAt, wallsAt, flipAt, hi = [], hiAt = 0, zoneHi, showAxes = true }) => {
  const frame = useCurrentFrame();
  const L = 70;
  const B = 44;
  const pw = width - L - 20;
  const ph = height - B;
  const xMin = -230;
  const xMax = 80;
  const X = (v: number) => L + ((v - xMin) / (xMax - xMin)) * pw;
  const n = GEX_ROWS.length;
  const rowH = ph / n;
  const rowY = (i: number) => (i + 0.5) * rowH;
  const yOf = (k: number) => {
    for (let i = 0; i < n - 1; i++) {
      const a = GEX_ROWS[i].k;
      const b = GEX_ROWS[i + 1].k;
      if (k <= a && k >= b) return rowY(i) + ((a - k) / (a - b || 1)) * rowH;
    }
    return k > GEX_ROWS[0].k ? rowY(0) : rowY(n - 1);
  };
  const bh = rowH * 0.62;
  const grow = (i: number) => interpolate(frame, [from + i * 0.7, from + i * 0.7 + 22], [0, 1], { ...clamp, easing: theme.ease.out });
  const hiP = interpolate(frame, [hiAt, hiAt + 12], [0, 1], clamp);
  // cumulative net (running sum from the lowest strike up), drawn on its own scale
  const cumVals: number[] = [];
  let run = 0;
  for (let i = n - 1; i >= 0; i--) {
    run += GEX_ROWS[i].net;
    cumVals[i] = run;
  }
  const cumMin = Math.min(...cumVals);
  const cumX = (v: number) => X(0) + (v / Math.abs(cumMin)) * (X(0) - X(-120));
  const cumPath = GEX_ROWS.map((r, i) => `${i ? "L" : "M"}${cumX(cumVals[i]).toFixed(1)},${rowY(i).toFixed(1)}`).join(" ");
  // aggregate profile: smooth, positive above the flip, negative below, fading far from spot
  const agg = (k: number) => Math.tanh((k - FLIP) / 5) * Math.exp(-(((k - 392) / 26) ** 2)) * (k < FLIP ? 95 : 40);
  const aggPath = GEX_ROWS.map((r, i) => `${i ? "L" : "M"}${X(agg(r.k)).toFixed(1)},${rowY(i).toFixed(1)}`).join(" ");
  const draw = (at?: number) => (at === undefined ? 0 : interpolate(frame, [at, at + 40], [0, 1], { ...clamp, easing: theme.ease.inOut }));
  const cumP = draw(cumAt);
  const aggP = draw(aggAt);
  const lineO = (at?: number) => (at === undefined ? 0 : interpolate(frame, [at, at + 14], [0, 1], clamp));
  const ticks = [-218, -152, -86, -19, 47];
  const mono = theme.mono;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <rect x={L} y={0} width={pw} height={ph} fill={c.bgAlt} opacity={0.55} rx={8} />
      {showAxes &&
        ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={0} y2={ph} stroke={c.hairlineSoft} />
            <text x={X(t)} y={ph + 30} fill={c.textMuted} fontSize={17} textAnchor="middle" fontFamily={mono}>
              {t}K
            </text>
          </g>
        ))}
      <line x1={X(0)} x2={X(0)} y1={0} y2={ph} stroke={c.hairline} strokeWidth={1.5} />
      {zoneHi && (
        <rect
          x={L}
          width={pw}
          y={yOf(zoneHi.to)}
          height={Math.max(4, yOf(zoneHi.from) - yOf(zoneHi.to))}
          fill={zoneHi.color}
          opacity={0.14 * interpolate(frame, [zoneHi.at, zoneHi.at + 14], [0, 1], clamp)}
        />
      )}
      {GEX_ROWS.map((r, i) => {
        const g = grow(i);
        const y = rowY(i) - bh / 2;
        const isHi = hi.includes(r.k);
        const dim = hi.length > 0 && hiP > 0 && !isHi ? 1 - hiP * 0.6 : 1;
        if (netOnly) {
          const v = r.net * g;
          return <rect key={r.k} x={Math.min(X(0), X(v))} y={y} width={Math.abs(X(v) - X(0))} height={bh} rx={2} fill={r.net >= 0 ? c.positive : c.negative} opacity={dim} />;
        }
        return (
          <g key={r.k} opacity={dim}>
            <rect x={X(r.put * g)} y={y} width={X(0) - X(r.put * g)} height={bh} rx={2} fill={c.negative} />
            <rect x={X(0)} y={y} width={X(r.call * g) - X(0)} height={bh} rx={2} fill={c.positive} />
            {isHi && hiP > 0 && <rect x={X(r.put) - 6} y={y - 4} width={X(r.call) - X(r.put) + 12} height={bh + 8} rx={5} fill="none" stroke={c.accentBright} strokeWidth={2.5} opacity={hiP} />}
          </g>
        );
      })}
      {showAxes &&
        Y_LABELS.map((k) => (
          <text key={k} x={L - 12} y={yOf(k) + 6} fill={c.textSecondary} fontSize={17} textAnchor="end" fontFamily={mono}>
            {k}
          </text>
        ))}
      {cumAt !== undefined && <path d={cumPath} stroke={c.amber} strokeWidth={3.5} fill="none" pathLength={1} strokeDasharray={`${cumP} 1`} strokeLinejoin="round" />}
      {aggAt !== undefined && <path d={aggPath} stroke={c.violet} strokeWidth={3.5} fill="none" pathLength={1} strokeDasharray={`${aggP} 1`} strokeLinejoin="round" />}
      {wallsAt !== undefined && (
        <g opacity={lineO(wallsAt)}>
          <line x1={L} x2={L + pw} y1={yOf(WALL) - 2} y2={yOf(WALL) - 2} stroke={c.negative} strokeWidth={2.2} strokeDasharray="9 6" />
          <line x1={L} x2={L + pw} y1={yOf(WALL) + 1} y2={yOf(WALL) + 1} stroke={c.positive} strokeWidth={2.2} strokeDasharray="4 8" />
          <text x={L + 8} y={yOf(WALL) - 12} fill={c.textPrimary} fontSize={17} fontFamily={mono} fontWeight={700}>
            Put $390.0
          </text>
          <text x={L + pw - 8} y={yOf(WALL) + 22} fill={c.textPrimary} fontSize={17} fontFamily={mono} fontWeight={700} textAnchor="end">
            Call $390.0
          </text>
        </g>
      )}
      {priceAt !== undefined && (
        <g opacity={lineO(priceAt)}>
          <line x1={L} x2={L + pw} y1={yOf(SPOT) + 3} y2={yOf(SPOT) + 3} stroke={c.flipBlue} strokeWidth={2.2} strokeDasharray="12 6" />
          <text x={L + 8} y={yOf(SPOT) + 24} fill={c.textPrimary} fontSize={17} fontFamily={mono} fontWeight={700}>
            Price $389.51
          </text>
        </g>
      )}
      {flipAt !== undefined && (
        <g opacity={lineO(flipAt)}>
          <line x1={L} x2={L + pw} y1={yOf(FLIP)} y2={yOf(FLIP)} stroke={c.violet} strokeWidth={2.6} strokeDasharray="12 6" />
          <text x={L + pw - 8} y={yOf(FLIP) - 10} fill={c.violet} fontSize={18} fontFamily={mono} fontWeight={800} textAnchor="end">
            Flip $394.84
          </text>
        </g>
      )}
    </svg>
  );
};

/** Little summary box (bottom-right of the site chart). */
export const RegimeBox: React.FC<{ hi?: number; width?: number }> = ({ hi, width = 300 }) => {
  const rows: Array<[string, string, string]> = [
    ["Regime", "-γ", c.negative],
    ["Price", "$389.51", c.flipBlue],
    ["Flip", "$394.84", c.violet],
    ["Call wall", "$390.0", c.positive],
    ["Put wall", "$390.0", c.negative],
  ];
  return (
    <div style={{ width }}>
      <div style={{ color: c.textMuted, fontSize: 17, fontFamily: theme.mono, lineHeight: 1.45, marginBottom: 10 }}>
        <div>Expirations</div>
        <div style={{ color: c.textPrimary }}>Sep 24 &apos;26</div>
        <div style={{ color: c.textPrimary }}>Sep 25 &apos;26</div>
        <div style={{ color: c.textPrimary }}>Oct 16 &apos;26</div>
      </div>
      <div style={{ background: c.panel, border: `1px solid ${c.hairline}`, borderRadius: 14, padding: "12px 16px" }}>
        {rows.map(([k, v, col], i) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, fontSize: 19, background: hi === i ? `${c.accent}30` : "transparent" }}>
            <span style={{ color: c.textSecondary }}>{k}</span>
            <strong style={{ color: col, fontFamily: theme.mono }}>{v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Summary cards row
// ---------------------------------------------------------------------------
const Card: React.FC<{ lit: boolean; width: number; children: React.ReactNode }> = ({ lit, width, children }) => (
  <div
    style={{
      width,
      padding: "18px 22px",
      borderRadius: 16,
      background: lit ? `linear-gradient(160deg, ${c.accent}22, ${c.panel})` : c.panel,
      border: `2px solid ${lit ? c.accent : c.hairline}`,
      boxShadow: lit ? `0 0 40px -10px ${c.glow}` : "none",
      fontFamily: theme.font,
    }}
  >
    {children}
  </div>
);

export const DashCards: React.FC<{ hi?: number; subHi?: "gamma" | "net" | null; width?: number }> = ({ hi, subHi, width = 1700 }) => {
  const w = (width - 3 * 18) / 4;
  const small = { color: c.textMuted, fontSize: 18 } as const;
  const big = { color: c.textPrimary, fontSize: 44, fontWeight: 800, fontFamily: theme.mono } as const;
  const row = (k: string, v: string, col: string, lit: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, marginTop: 8, padding: "3px 8px", borderRadius: 6, background: lit ? `${c.accent}33` : "transparent" }}>
      <span style={{ color: c.textSecondary }}>{k}</span>
      <strong style={{ color: col, fontFamily: theme.mono }}>{v}</strong>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 18 }}>
      <Card lit={hi === 0} width={w}>
        <div style={small}>Spot</div>
        <div style={big}>$389.51</div>
        {row("Gamma", "-γ", c.negative, subHi === "gamma")}
        {row("Net GEX", "-329K", c.textPrimary, subHi === "net")}
      </Card>
      <Card lit={hi === 1} width={w}>
        <div style={small}>Total Call GEX</div>
        <div style={{ ...big, color: c.positive }}>242K</div>
        <div style={{ ...small, marginTop: 10 }}>exposition gamma · options d&apos;achat</div>
      </Card>
      <Card lit={hi === 2} width={w}>
        <div style={small}>Total Put GEX</div>
        <div style={{ ...big, color: c.negative }}>571K</div>
        <div style={{ ...small, marginTop: 10 }}>exposition gamma · options de vente</div>
      </Card>
      <Card lit={hi === 3} width={w}>
        <div style={small}>Walls</div>
        {row("Call wall", "$390.0", c.positive, false)}
        {row("Put wall", "$390.0", c.negative, false)}
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Profile chart (vanna / charm by strike)
// ---------------------------------------------------------------------------
export const VANNA_PTS: Array<[number, number]> = [
  [315, 0], [330, 0], [345, -1], [352, -3], [358, -8], [364, -14], [368, -22], [372, -34], [375, -44], [378, -55], [381, -72], [383, -78], [385, -61], [388, -32], [391, 2], [394, 22], [397, 38], [400, 44], [404, 46], [408, 40], [412, 33], [417, 26], [422, 18], [428, 9], [434, 3], [440, 0], [450, 0], [460, 0],
];
export const CHARM_PTS: Array<[number, number]> = [
  [315, 0], [340, 0], [360, -0.05], [370, -0.2], [376, -0.9], [380, -2.6], [383, -4.3], [385, -4.9], [387, -3.2], [389, -1.2], [391, 0.35], [393, 0.45], [396, 0.2], [400, 0.08], [410, 0.02], [430, 0], [460, 0],
];

export const ProfileChart: React.FC<{
  pts: Array<[number, number]>;
  yMin: number;
  yMax: number;
  yTicks: Array<[number, string]>;
  color: string;
  from: number;
  width?: number;
  height?: number;
  flip?: { x: number; label: string; at: number };
  marks?: Array<{ x: number; label: string; color: string; at: number; up?: boolean }>;
  fillArea?: boolean;
}> = ({ pts, yMin, yMax, yTicks, color, from, width = 700, height = 380, flip, marks = [], fillArea = true }) => {
  const frame = useCurrentFrame();
  const L = 86;
  const B = 40;
  const pw = width - L - 10;
  const ph = height - B;
  const X = (k: number) => L + ((k - 315) / (460 - 315)) * pw;
  const Y = (v: number) => ((yMax - v) / (yMax - yMin)) * ph;
  const p = interpolate(frame, [from, from + 50], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const d = pts.map(([k, v], i) => `${i ? "L" : "M"}${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${X(460)},${Y(0)} L${X(315)},${Y(0)} Z`;
  const gid = `pf${Math.round(from)}${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={gid}>
          <rect x={0} y={-20} width={L + pw * p} height={height + 40} />
        </clipPath>
      </defs>
      {yTicks.map(([v, t]) => (
        <g key={t}>
          <line x1={L} x2={L + pw} y1={Y(v)} y2={Y(v)} stroke={c.hairlineSoft} />
          <text x={L - 10} y={Y(v) + 6} fill={c.textMuted} fontSize={16} textAnchor="end" fontFamily={theme.mono}>
            {t}
          </text>
        </g>
      ))}
      <line x1={L} x2={L + pw} y1={Y(0)} y2={Y(0)} stroke={c.hairline} strokeWidth={1.5} />
      {[315, 336, 356, 377, 398, 419, 439, 460].map((k) => (
        <text key={k} x={X(k)} y={ph + 28} fill={c.textMuted} fontSize={16} textAnchor="middle" fontFamily={theme.mono}>
          {k}
        </text>
      ))}
      <g clipPath={`url(#${gid})`}>
        {fillArea && <path d={area} fill={color} opacity={0.14} />}
        <path d={d} stroke={color} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
        {pts.map(([k, v]) => (Math.abs(v) > 0.01 ? <circle key={k} cx={X(k)} cy={Y(v)} r={3.5} fill={color} opacity={0.7} /> : null))}
      </g>
      {flip && (
        <g opacity={interpolate(frame, [flip.at, flip.at + 14], [0, 1], clamp)}>
          <line x1={X(flip.x)} x2={X(flip.x)} y1={0} y2={ph} stroke={color} strokeWidth={2.6} strokeDasharray="9 7" />
          <text x={X(flip.x) + 8} y={20} fill={color} fontSize={19} fontFamily={theme.mono} fontWeight={800}>
            {flip.label}
          </text>
        </g>
      )}
      {marks.map((m) => {
        const o = interpolate(frame, [m.at, m.at + 14], [0, 1], clamp);
        const v = pts.reduce((best, q) => (Math.abs(q[0] - m.x) < Math.abs(best[0] - m.x) ? q : best), pts[0])[1];
        return (
          <g key={m.label} opacity={o}>
            <line x1={X(m.x)} x2={X(m.x)} y1={Y(0)} y2={Y(v)} stroke={m.color} strokeWidth={2} strokeDasharray="4 4" />
            <circle cx={X(m.x)} cy={Y(v)} r={9 + Math.sin(frame / 6) * 1.5} fill={m.color} />
            <text x={X(m.x)} y={m.up ? Y(v) - 18 : Y(v) + 32} fill={m.color} fontSize={19} textAnchor="middle" fontFamily={theme.mono} fontWeight={800}>
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// DEX by strike
// ---------------------------------------------------------------------------
const DEX_ROWS: Array<[number, number]> = [
  [478, 0.5], [465, 1], [449, 2], [435, 3], [420, 6], [410, 10], [404, -30], [400, -160], [397, -90], [395, -420], [393, -260], [392, -700], [391, -380], [390, -560], [389, 40], [387, -120], [385, -60], [380, -25], [370, -8], [362, 30], [350, -3], [333, -1], [304, 0], [275, 0],
];
export const DexChart: React.FC<{ from: number; width?: number; height?: number; flipAt?: number }> = ({ from, width = 640, height = 420, flipAt }) => {
  const frame = useCurrentFrame();
  const L = 70;
  const B = 40;
  const pw = width - L - 10;
  const ph = height - B;
  const X = (v: number) => L + ((v + 900) / (98 + 900)) * pw;
  const Y = (k: number) => ((478 - k) / (478 - 275)) * ph;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {[275, 304, 333, 362, 391, 420, 449, 478].map((k) => (
        <text key={k} x={L - 10} y={Y(k) + 6} fill={c.textMuted} fontSize={16} textAnchor="end" fontFamily={theme.mono}>
          {k}
        </text>
      ))}
      {[[-900, "-$900M"], [-650, "-$650M"], [-401, "-$401M"], [-152, "-$152M"], [98, "$98M"]].map(([v, t]) => (
        <text key={String(t)} x={X(Number(v))} y={ph + 28} fill={c.textMuted} fontSize={15} textAnchor="middle" fontFamily={theme.mono}>
          {t}
        </text>
      ))}
      <line x1={X(0)} x2={X(0)} y1={0} y2={ph} stroke={c.hairline} strokeWidth={1.5} />
      {DEX_ROWS.map(([k, v], i) => {
        const g = interpolate(frame, [from + i, from + i + 22], [0, 1], { ...clamp, easing: theme.ease.out });
        const vv = v * g;
        return <rect key={k} x={Math.min(X(0), X(vv))} y={Y(k) - 3} width={Math.abs(X(vv) - X(0))} height={6} rx={2} fill={v < 0 ? c.negative : c.positive} />;
      })}
      {flipAt !== undefined && (
        <g opacity={interpolate(frame, [flipAt, flipAt + 14], [0, 1], clamp)}>
          <line x1={L} x2={L + pw} y1={Y(394.4)} y2={Y(394.4)} stroke={c.flipBlue} strokeWidth={2.6} strokeDasharray="10 6" />
          <text x={L + 10} y={Y(394.4) - 10} fill={c.textPrimary} fontSize={18} fontFamily={theme.mono} fontWeight={800}>
            D-Flip $394.4
          </text>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// GLD candles since Dec 31 with levels + GEX overlay
// ---------------------------------------------------------------------------
const KEY: Array<[number, number]> = [
  [0, 373], [3, 369], [5, 376], [7, 377], [9, 387], [11, 394], [13, 401], [15, 402], [17, 400], [19, 404], [21, 412], [23, 419], [25, 427], [26, 428], [27, 423], [28, 421], [29, 419], [30, 404], [31, 398], [33, 402], [35, 409], [36, 405], [37, 400], [38, 403], [40, 399], [41, 393], [42, 395], [43, 401], [44, 402], [45, 399], [46, 394], [47, 389.5],
];
const closeAt = (i: number) => {
  for (let j = 0; j < KEY.length - 1; j++) {
    const [a, va] = KEY[j];
    const [b, vb] = KEY[j + 1];
    if (i >= a && i <= b) return va + ((vb - va) * (i - a)) / (b - a || 1);
  }
  return KEY[KEY.length - 1][1];
};
export const CANDLES = Array.from({ length: 48 }, (_, i) => {
  const close = closeAt(i) + (i % 3 === 1 ? 1.2 : i % 3 === 2 ? -1 : 0) * (i === 47 ? 0 : 1);
  const open = i === 0 ? 372 : closeAt(i - 1) + (i % 4 === 0 ? 1.4 : -0.6);
  const hi = Math.max(open, close) + 1.2 + ((i * 37) % 5) * 0.5;
  const lo = Math.min(open, close) - 1.2 - ((i * 53) % 5) * 0.5;
  return { open, close, hi, lo };
});

export const CandleChart: React.FC<{
  from: number;
  width?: number;
  height?: number;
  levelsAt?: number;
  overlayAt?: number;
  focusAt?: number;
  upTo?: number;
}> = ({ from, width = 1500, height = 560, levelsAt, overlayAt, focusAt, upTo = 48 }) => {
  const frame = useCurrentFrame();
  const R = 110;
  const pw = width - R - 280;
  const lo = 358;
  const hi = 442;
  const Y = (v: number) => ((hi - v) / (hi - lo)) * height;
  const cw = pw / 48;
  const shown = Math.min(upTo, Math.floor(interpolate(frame, [from, from + 70], [0, 48], clamp)));
  const o = (at?: number) => (at === undefined ? 0 : interpolate(frame, [at, at + 16], [0, 1], clamp));
  const fp = o(focusAt);
  return (
    <svg width={width} height={height + 30} style={{ overflow: "visible" }}>
      {[360, 380, 400, 420, 440].map((v) => (
        <g key={v}>
          <line x1={0} x2={width - R} y1={Y(v)} y2={Y(v)} stroke={c.hairlineSoft} strokeDasharray="4 8" />
          <text x={width - R + 14} y={Y(v) + 7} fill={c.textPrimary} fontSize={22} fontFamily={theme.mono} fontWeight={700}>
            ${v}
          </text>
        </g>
      ))}
      <text x={4} y={height + 26} fill={c.textSecondary} fontSize={20} fontFamily={theme.mono}>
        Dec 31
      </text>
      {CANDLES.slice(0, shown).map((k, i) => {
        const up = k.close >= k.open;
        const col = up ? c.positive : c.negative;
        const x = i * cw + cw / 2;
        const dim = focusAt !== undefined && i < 40 ? 1 - fp * 0.55 : 1;
        return (
          <g key={i} opacity={dim}>
            <line x1={x} x2={x} y1={Y(k.hi)} y2={Y(k.lo)} stroke={col} strokeWidth={2} />
            <rect x={x - cw * 0.34} y={Y(Math.max(k.open, k.close))} width={cw * 0.68} height={Math.max(2, Math.abs(Y(k.open) - Y(k.close)))} fill={col} rx={1.5} />
          </g>
        );
      })}
      {levelsAt !== undefined && (
        <g opacity={o(levelsAt)}>
          <line x1={0} x2={width - R} y1={Y(395)} y2={Y(395)} stroke={c.violet} strokeWidth={2.4} strokeDasharray="3 5" />
          <line x1={0} x2={width - R} y1={Y(390)} y2={Y(390)} stroke={c.negative} strokeWidth={2.4} strokeDasharray="8 6" />
          <g transform={`translate(0 ${Y(395) - 16})`}>
            <rect width={170} height={30} rx={15} fill={c.violet} />
            <text x={85} y={21} fill="#111" fontSize={17} textAnchor="middle" fontWeight={800} fontFamily={theme.mono}>
              Gamma Flip $395
            </text>
          </g>
          <g transform={`translate(0 ${Y(390) + 4})`}>
            <rect width={150} height={30} rx={15} fill={c.negative} />
            <text x={75} y={21} fill="#111" fontSize={17} textAnchor="middle" fontWeight={800} fontFamily={theme.mono}>
              Put Wall $390
            </text>
          </g>
        </g>
      )}
      {overlayAt !== undefined && (
        <g opacity={o(overlayAt)}>
          <rect x={pw + 30} y={0} width={width - R - pw - 40} height={height} fill={c.panel} opacity={0.7} rx={8} />
          {GEX_ROWS.filter((r) => r.k >= lo && r.k <= hi).map((r) => {
            const cx = pw + 30 + (width - R - pw - 40) * 0.62;
            const s = 0.85;
            return (
              <g key={r.k}>
                <rect x={cx + r.put * s} y={Y(r.k) - 3} width={-r.put * s} height={6} fill={c.negative} rx={1.5} />
                <rect x={cx} y={Y(r.k) - 3} width={r.call * s} height={6} fill={c.positive} rx={1.5} />
              </g>
            );
          })}
          <text x={pw + 30 + (width - R - pw - 40) * 0.62} y={20} fill={c.textMuted} fontSize={16} textAnchor="middle" fontFamily={theme.mono}>
            GEX
          </text>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Teaching props
// ---------------------------------------------------------------------------

/** A road with a car: "dry" keeps the car centered (damped wobble), "ice" makes it slide wider and wider. */
export const Road: React.FC<{ kind: "dry" | "ice"; from: number; width?: number }> = ({ kind, from, width = 760 }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - from);
  const amp = kind === "dry" ? 40 * Math.exp(-t / 45) + 6 : Math.min(140, 12 + t * 0.9);
  const off = Math.sin(t / 9) * amp;
  const rot = Math.cos(t / 9) * (kind === "dry" ? 4 : 14) * Math.min(1, amp / 60);
  return (
    <div style={{ position: "relative", width, height: 300 }}>
      <svg width={width} height={300} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={60} width={width} height={180} rx={24} fill={kind === "dry" ? "#23272e" : "#1d3340"} />
        {kind === "ice" && <rect x={0} y={60} width={width} height={180} rx={24} fill={c.ice} opacity={0.16} />}
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={((i * 110 - t * 6) % (width + 110) + width + 110) % (width + 110) - 60} y={146} width={60} height={8} rx={4} fill={kind === "dry" ? "#e9e2cf" : c.ice} opacity={0.7} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: width / 2 - 70, top: 100 + off * 0.35, transform: `translateX(${off}px) rotate(${rot}deg)` }}>
        <svg width={140} height={100} viewBox="0 0 140 100">
          <rect x={10} y={30} width={120} height={46} rx={14} fill={kind === "dry" ? c.accent : c.context} />
          <path d="M34 30 L48 10 L96 10 L110 30 Z" fill={kind === "dry" ? c.accentDim : "#56748f"} />
          <circle cx={38} cy={80} r={12} fill="#111" />
          <circle cx={104} cy={80} r={12} fill="#111" />
        </svg>
      </div>
    </div>
  );
};

/** Vertical price ladder (strike ruler) with coloured levels and a moving price dot. */
export const Ladder: React.FC<{
  lo: number;
  hi: number;
  height?: number;
  width?: number;
  levels: Array<{ v: number; t: string; color: string; at: number; right?: boolean; dash?: boolean }>;
  price?: { path: Array<[number, number]> };
  zones?: Array<{ from: number; to: number; color: string; at: number; label?: string }>;
}> = ({ lo, hi, height = 600, width = 900, levels, price, zones = [] }) => {
  const frame = useCurrentFrame();
  const Y = (v: number) => ((hi - v) / (hi - lo)) * height;
  let pv: number | null = null;
  if (price && frame >= price.path[0][0]) {
    pv = price.path[price.path.length - 1][1];
    for (let i = 1; i < price.path.length; i++) {
      const [fa, va] = price.path[i - 1];
      const [fb, vb] = price.path[i];
      if (frame <= fb) {
        pv = va + (vb - va) * interpolate(frame, [fa, fb], [0, 1], { ...clamp, easing: theme.ease.inOut });
        break;
      }
    }
  }
  const trail: string[] = [];
  if (price && pv !== null) {
    const f0 = price.path[0][0];
    const f1 = Math.min(frame, price.path[price.path.length - 1][0]);
    for (let f = f0; f <= f1; f += 3) {
      let v = price.path[0][1];
      for (let i = 1; i < price.path.length; i++) {
        const [fa, va] = price.path[i - 1];
        const [fb, vb] = price.path[i];
        if (f <= fb) {
          v = va + (vb - va) * interpolate(f, [fa, fb], [0, 1], { ...clamp, easing: theme.ease.inOut });
          break;
        }
        v = vb;
      }
      trail.push(`${trail.length ? "L" : "M"}${(140 + ((f - f0) / Math.max(1, price.path[price.path.length - 1][0] - f0)) * (width - 420)).toFixed(1)},${Y(v).toFixed(1)}`);
    }
  }
  const headX = price && pv !== null ? 140 + ((Math.min(frame, price.path[price.path.length - 1][0]) - price.path[0][0]) / Math.max(1, price.path[price.path.length - 1][0] - price.path[0][0])) * (width - 420) : 0;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <line x1={120} x2={120} y1={0} y2={height} stroke={c.hairline} strokeWidth={2} />
      {zones.map((z) => (
        <g key={z.label ?? `${z.from}`} opacity={interpolate(frame, [z.at, z.at + 14], [0, 1], clamp)}>
          <rect x={120} y={Y(z.to)} width={width - 120} height={Y(z.from) - Y(z.to)} fill={z.color} opacity={0.16} />
          {z.label && (
            <text x={width - 12} y={Y(z.to) + 24} fill={z.color} fontSize={20} textAnchor="end" fontWeight={700}>
              {z.label}
            </text>
          )}
        </g>
      ))}
      {levels.map((l) => {
        const o = interpolate(frame, [l.at, l.at + 14], [0, 1], clamp);
        return (
          <g key={l.t + l.v} opacity={o}>
            <line x1={120} x2={width} y1={Y(l.v)} y2={Y(l.v)} stroke={l.color} strokeWidth={2.4} strokeDasharray={l.dash === false ? undefined : "10 7"} />
            <text x={108} y={Y(l.v) + 7} fill={l.color} fontSize={21} textAnchor="end" fontFamily={theme.mono} fontWeight={800}>
              {l.v.toLocaleString("fr-FR")}
            </text>
            <text x={l.right ? width - 12 : 140} y={Y(l.v) - 9} fill={l.color} fontSize={20} textAnchor={l.right ? "end" : "start"} fontWeight={700}>
              {l.t}
            </text>
          </g>
        );
      })}
      {price && pv !== null && (
        <g>
          <path d={trail.join(" ")} stroke={c.textPrimary} strokeWidth={3} fill="none" opacity={0.8} strokeLinejoin="round" />
          <circle cx={headX} cy={Y(pv)} r={16 + Math.sin(frame / 5) * 3} fill={c.accentBright} opacity={0.25} />
          <circle cx={headX} cy={Y(pv)} r={8} fill={c.accentBright} />
          <text x={headX + 18} y={Y(pv) + 7} fill={c.accentBright} fontSize={22} fontFamily={theme.mono} fontWeight={800}>
            {pv.toFixed(2)}
          </text>
        </g>
      )}
    </svg>
  );
};

/** Big order arrow for hedging flows: "ACHÈTE 18 000" (green, up) / "VEND 18 000" (red, down). */
export const Flow: React.FC<{ at: number; buy: boolean; text: string; size?: number }> = ({ at, buy, text, size = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
  const col = buy ? c.positive : c.negative;
  if (frame < at) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 * size, opacity: Math.min(1, p * 1.3), transform: `scale(${interpolate(p, [0, 1], [0.4, 1])})` }}>
      <svg width={70 * size} height={90 * size} viewBox="0 0 70 90">
        <path d={buy ? "M35 4 L66 42 L46 42 L46 86 L24 86 L24 42 L4 42 Z" : "M35 86 L66 48 L46 48 L46 4 L24 4 L24 48 L4 48 Z"} fill={col} />
      </svg>
      <div style={{ color: col, fontSize: 38 * size, fontWeight: 900, fontFamily: theme.mono, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

/** Melting ice cube (theta). `melt` 0..1. */
export const IceCube: React.FC<{ melt: number; size?: number }> = ({ melt, size = 220 }) => {
  const h = 120 * (1 - melt * 0.85);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <ellipse cx={100} cy={178} rx={30 + melt * 70} ry={8 + melt * 10} fill={c.ice} opacity={0.35} />
      <rect x={100 - 60 * (1 - melt * 0.3)} y={175 - h} width={120 * (1 - melt * 0.3)} height={h} rx={16 + melt * 14} fill={c.ice} opacity={0.75} />
      <rect x={100 - 44 * (1 - melt * 0.3)} y={185 - h} width={30} height={Math.max(4, h * 0.35)} rx={8} fill="#ffffff" opacity={0.55} />
    </svg>
  );
};

/** One labelled check item that reveals at `at`, with a tick once `doneAt` passes. */
export const CheckItem: React.FC<{ at: number; n?: string; text: string; sub?: string; color?: string; width?: number }> = ({ at, n, text, sub, color = c.accent, width = 760 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.snappy });
  if (frame < at) return null;
  return (
    <div style={{ width, display: "flex", gap: 18, alignItems: "center", opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`, padding: "12px 18px", borderRadius: 14, background: c.panel, border: `1.5px solid ${c.hairline}` }}>
      {n && (
        <div style={{ minWidth: 52, height: 52, borderRadius: 26, background: `${color}30`, border: `2px solid ${color}`, color, fontSize: 26, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.mono }}>{n}</div>
      )}
      <div>
        <div style={{ color: c.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{text}</div>
        {sub && <div style={{ color: c.textSecondary, fontSize: 21, marginTop: 4, lineHeight: 1.3 }}>{sub}</div>}
      </div>
    </div>
  );
};

/** Verdict stamp for the AI-text proof-reading scene. */
export const Verdict: React.FC<{ at: number; kind: "ok" | "doubt" | "bad"; text: string }> = ({ at, kind, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
  if (frame < at) return null;
  const col = kind === "ok" ? c.positive : kind === "doubt" ? c.amber : c.negative;
  const sym = kind === "ok" ? "✓" : kind === "doubt" ? "?" : "✗";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 18px", borderRadius: 12, border: `3px solid ${col}`, color: col, fontWeight: 900, fontSize: 26, transform: `scale(${interpolate(p, [0, 1], [1.8, 1])}) rotate(-3deg)`, opacity: Math.min(1, p * 1.5), background: `${col}14` }}>
      <span style={{ fontSize: 34 }}>{sym}</span>
      {text}
    </div>
  );
};

/** Dealer at a desk with a risk screen. */
export const DealerDesk: React.FC<{ size?: number; screen?: string; screenColor?: string }> = ({ size = 1, screen = "Δ = 0", screenColor = c.accentBright }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <svg width={320 * size} height={260 * size} viewBox="0 0 320 260" style={{ overflow: "visible" }}>
      <rect x={150} y={40} width={150} height={100} rx={10} fill={c.panelAlt} stroke={c.hairline} strokeWidth={2} />
      <text x={225} y={100} fill={screenColor} fontSize={28} textAnchor="middle" fontFamily={theme.mono} fontWeight={800}>
        {screen}
      </text>
      <circle cx={288} cy={52} r={5} fill={blink ? c.negative : c.textMuted} />
      <rect x={220} y={140} width={10} height={30} fill={c.hairline} />
      <rect x={20} y={170} width={290} height={14} rx={6} fill={c.accentDim} />
      <line x1={40} y1={184} x2={40} y2={255} stroke={c.accentDim} strokeWidth={8} />
      <line x1={290} y1={184} x2={290} y2={255} stroke={c.accentDim} strokeWidth={8} />
      <circle cx={80} cy={70} r={30} fill="#d9b99b" />
      <rect x={50} y={32} width={60} height={16} rx={8} fill="#2a2a2a" />
      <circle cx={70} cy={70} r={3} fill="#1b1b1b" />
      <circle cx={92} cy={70} r={3} fill="#1b1b1b" />
      <path d="M40 170 Q40 110 80 106 Q120 110 120 170 Z" fill={c.context} />
      <path d="M72 106 L80 130 L88 106 Z" fill="#e9e2cf" />
      <line x1={112} y1={140} x2={160} y2={160} stroke="#4e6a86" strokeWidth={9} strokeLinecap="round" />
    </svg>
  );
};

/** House card for the analogy scene. */
export const HouseCard: React.FC<{ price: string; tone?: string; size?: number }> = ({ price, tone = c.accent, size = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <svg width={200 * size} height={170 * size} viewBox="0 0 200 170">
      <polygon points="100,12 186,80 14,80" fill={tone} opacity={0.9} />
      <rect x={34} y={78} width={132} height={82} fill={c.panelAlt} stroke={tone} strokeWidth={3} />
      <rect x={86} y={110} width={30} height={50} fill={tone} opacity={0.7} />
      <rect x={48} y={96} width={26} height={24} fill={c.ice} opacity={0.6} />
      <rect x={128} y={96} width={26} height={24} fill={c.ice} opacity={0.6} />
      <rect x={140} y={30} width={16} height={36} fill={c.accentDim} />
    </svg>
    <div style={{ fontFamily: theme.mono, fontSize: 34 * size, fontWeight: 900, color: tone }}>{price}</div>
  </div>
);

/** Simple car glyph + shield for the insurance analogy. */
export const CarShield: React.FC<{ size?: number; crash?: boolean }> = ({ size = 1, crash }) => (
  <svg width={260 * size} height={170 * size} viewBox="0 0 260 170">
    <rect x={20} y={70} width={170} height={56} rx={16} fill={c.context} />
    <path d="M50 70 L70 40 L140 40 L160 70 Z" fill="#56748f" />
    <circle cx={60} cy={130} r={16} fill="#111" />
    <circle cx={150} cy={130} r={16} fill="#111" />
    {crash && <path d="M186 64 L204 80 L190 86 L210 104" stroke={c.negative} strokeWidth={6} fill="none" strokeLinecap="round" />}
    <path d="M214 20 L250 32 L250 70 Q250 100 214 116 Q178 100 178 70 L178 32 Z" fill={c.positive} opacity={0.85} />
    <path d="M198 66 L210 80 L234 52" stroke="#111" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** P&L at expiry in $ per contract (x100), drawn progressively; optional seller mirror + markers. */
export const PnLChart: React.FC<{
  kind: "call" | "put";
  strike: number;
  premium: number;
  from: number;
  min: number;
  max: number;
  yMin: number;
  yMax: number;
  width?: number;
  height?: number;
  seller?: boolean;
  sellerAt?: number;
  markers?: Array<{ s: number; at: number }>;
}> = ({ kind, strike, premium, from, min, max, yMin, yMax, width = 820, height = 440, seller, sellerAt = 0, markers = [] }) => {
  const frame = useCurrentFrame();
  const L = 90;
  const pw = width - L;
  const X = (s: number) => L + ((s - min) / (max - min)) * pw;
  const Y = (v: number) => ((yMax - v) / (yMax - yMin)) * height;
  const pnl = (s: number) => ((kind === "call" ? Math.max(s - strike, 0) : Math.max(strike - s, 0)) - premium) * 100;
  const N = 80;
  const pts = Array.from({ length: N + 1 }, (_, i) => min + ((max - min) * i) / N);
  const p = interpolate(frame, [from, from + 45], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const shown = pts.slice(0, Math.max(2, Math.round(p * N) + 1));
  const d = shown.map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(pnl(s)).toFixed(1)}`).join(" ");
  const sp = seller ? interpolate(frame, [sellerAt, sellerAt + 40], [0, 1], { ...clamp, easing: theme.ease.inOut }) : 0;
  const ds = pts.slice(0, Math.max(2, Math.round(sp * N) + 1)).map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(-pnl(s)).toFixed(1)}`).join(" ");
  const col = kind === "call" ? c.positive : c.negative;
  const yTicks = [yMin, yMin / 2, 0, yMax / 2, yMax].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg width={width} height={height + 40} style={{ overflow: "visible" }}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={L} x2={L + pw} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? c.hairline : c.hairlineSoft} strokeWidth={v === 0 ? 2 : 1} />
          <text x={L - 12} y={Y(v) + 6} fill={c.textMuted} fontSize={17} textAnchor="end" fontFamily={theme.mono}>
            {v > 0 ? "+" : ""}
            {Math.round(v).toLocaleString("fr-FR")} $
          </text>
        </g>
      ))}
      <line x1={X(strike)} x2={X(strike)} y1={0} y2={height} stroke={c.textMuted} strokeDasharray="6 6" />
      <text x={X(strike)} y={height + 30} fill={c.textSecondary} fontSize={20} textAnchor="middle" fontFamily={theme.mono}>
        {strike}
      </text>
      <text x={L} y={height + 30} fill={c.textMuted} fontSize={17} fontFamily={theme.mono}>
        {min}
      </text>
      <text x={L + pw} y={height + 30} fill={c.textMuted} fontSize={17} textAnchor="end" fontFamily={theme.mono}>
        {max}
      </text>
      <path d={d} stroke={col} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {seller && sp > 0 && <path d={ds} stroke={c.context} strokeWidth={4} strokeDasharray="12 8" fill="none" strokeLinejoin="round" />}
      {markers.map((m) => {
        const o = interpolate(frame, [m.at, m.at + 12], [0, 1], clamp);
        if (o <= 0) return null;
        const v = pnl(m.s);
        return (
          <g key={m.s} opacity={o}>
            <line x1={X(m.s)} x2={X(m.s)} y1={0} y2={height} stroke={c.accentBright} strokeWidth={2} opacity={0.5} />
            <circle cx={X(m.s)} cy={Y(v)} r={12} fill={c.accentBright} />
            <text x={X(m.s)} y={Y(v) + (v >= 0 ? -22 : 40)} fill={c.accentBright} fontSize={24} textAnchor="middle" fontFamily={theme.mono} fontWeight={900}>
              {v > 0 ? "+" : ""}
              {Math.round(v).toLocaleString("fr-FR")} $
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/** Grid of 100 dots (one GLD contract = 100 shares), `lit` of them coloured. */
export const ShareGrid: React.FC<{ lit: number; color?: string; at: number; size?: number }> = ({ lit, color = c.accent, at, size = 22 }) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [at, at + 40], [0, lit], clamp));
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(10, ${size}px)`, gap: size * 0.35 }}>
      {Array.from({ length: 100 }, (_, i) => (
        <div key={i} style={{ width: size, height: size, borderRadius: size / 2, background: i < n ? color : c.hairline }} />
      ))}
    </div>
  );
};

/** Split bar: intrinsic (gold) + time value (blue) with labels. */
export const ValueBar: React.FC<{ intrinsic: number; time: number; at: number; scale?: number; label: string }> = ({ intrinsic, time, at, scale = 28, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 30], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column-reverse", height: 460, justifyContent: "flex-start" }}>
        {intrinsic > 0 && (
          <div style={{ width: 150, height: intrinsic * scale * p, background: c.accent, borderRadius: "0 0 10px 10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 900, fontSize: 24, fontFamily: theme.mono }}>
            {p > 0.8 ? intrinsic.toFixed(2).replace(".", ",") : ""}
          </div>
        )}
        <div style={{ width: 150, height: time * scale * p, background: c.context, borderRadius: intrinsic > 0 ? "10px 10px 0 0" : 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 900, fontSize: 24, fontFamily: theme.mono }}>
          {p > 0.8 ? time.toFixed(2).replace(".", ",") : ""}
        </div>
      </div>
      <div style={{ color: c.textPrimary, fontSize: 26, fontWeight: 800 }}>{label}</div>
    </div>
  );
};
