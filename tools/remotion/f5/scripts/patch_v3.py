"""Second round of fixes after the v2 still review."""
import os

os.chdir(os.path.join(os.path.dirname(__file__), "..", "src", "scenes"))


def patch(p, pairs):
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert a in s, (p, a[:80])
        s = s.replace(a, b)
    open(p, "w", encoding="utf-8").write(s)


# Claims: a real opening visual before the two panels arrive
patch("Claims.tsx", [
    (
        """      {/* A: weekly, initial vs continuing */}""",
        """      {/* opening: what claims are, before the two panels */}
      <Beat from={0} to={tInit - 4} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 690, display: "flex", alignItems: "center", justifyContent: "center", gap: 70, paddingTop: 60 }}>
          <Pop at={6}>
            <div style={{ transform: `rotate(${Math.sin(frame / 12) * 4}deg)` }}>
              <Clipboard size={230} />
            </div>
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Pop at={tIns}>
              <Big size={60} color={C.accentBright}>Inscriptions au chômage</Big>
            </Pop>
            <Pop at={tWeek}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                <Pill text="un signal plus rapide" color={C.context} size={26} />
                <Pill text="chaque semaine" size={26} filled />
              </div>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* A: weekly, initial vs continuing */}""",
    ),
    ('import { CheckDraw, StormCloud, HolidayGlyph, StrikeSign, ShieldGlyph, RulebookGlyph, Pill } from "./props5";', 'import { CheckDraw, StormCloud, HolidayGlyph, StrikeSign, ShieldGlyph, RulebookGlyph, Pill, Clipboard } from "./props5";'),
    ('<div style={{ position: "absolute", left: 40, top: 130, width: 800 }}>\n            <Pop at={tInit}>', '<div style={{ position: "absolute", left: 40, top: 130, width: 800 }}>\n            <Pop at={tInit + 2}>'),
])

# Wages: fill the gap between "deux pièges" and the ten-person example
patch("Wages.tsx", [
    (
        """          <div style={{ position: "absolute", left: 90, top: 100, width: 1560, height: 470 }}>""",
        """          {frame < tTen + 4 && (
            <div style={{ position: "absolute", left: 0, top: 120, width: STAGE_W, display: "flex", justifyContent: "center", gap: 80 }}>
              {[1, 2].map((n) => (
                <Pop key={n} at={tTraps + 4 + n * 6}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `rotate(${Math.sin(frame / 8 + n) * 5}deg)` }}>
                    <svg width="200" height="186" viewBox="0 0 60 56">
                      <path d="M30 4 L57 52 H3 Z" fill={`${C.negative}22`} stroke={C.negative} strokeWidth="3" strokeLinejoin="round" />
                      <text x="30" y="44" textAnchor="middle" fontSize="24" fontWeight="900" fill={C.negative} fontFamily={theme.mono}>
                        {n}
                      </text>
                    </svg>
                    <Big size={30} color={n === 1 && frame >= tComp ? C.accentBright : C.textSecondary}>{n === 1 ? "la composition" : "salaire ≠ pouvoir d'achat"}</Big>
                  </div>
                </Pop>
              ))}
            </div>
          )}
          <div style={{ position: "absolute", left: 90, top: 100, width: 1560, height: 470 }}>""",
    ),
])

# Unemployment: leavers stay inside their slot and fade before reaching the text
patch("Unemployment.tsx", [
    ("[i * 70, 260 + i * 40], { ...clamp, easing: theme.ease.in });", "[i * 60, 150 + i * 30], { ...clamp, easing: theme.ease.in });"),
    ("const o = interpolate(frame, [tAband + 30 + i * 6, tAband + 55 + i * 6], [1, 0.15], clamp);", "const o = interpolate(frame, [tAband + 18 + i * 6, tAband + 42 + i * 6], [1, 0.08], clamp);"),
])

# GdpNow: room between the crossed "sur un an" and the terminal chip
patch("GdpNow.tsx", [
    ('<div style={{ display: "flex", gap: 40, alignItems: "center", marginTop: 10 }}>', '<div style={{ display: "flex", gap: 130, alignItems: "center", marginTop: 10 }}>'),
])
print("patched v3")
