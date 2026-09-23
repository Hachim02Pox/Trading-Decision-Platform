"""One-off layout/timing fixes after the first still-frame review (v1 -> v2)."""
import os

os.chdir(os.path.join(os.path.dirname(__file__), "..", "src", "scenes"))


def patch(p, pairs):
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert a in s, (p, a[:80])
        s = s.replace(a, b)
    open(p, "w", encoding="utf-8").write(s)


patch("Intro.tsx", [
    ('<CalendarPage top="VENDREDI" big="1er" />', '<CalendarPage top="VENDREDI" big="1er" size={300} />'),
    ("<ClockIcon size={170} />\n              <Big size={46}>8 h 30</Big>", "<ClockIcon size={230} />\n              <Big size={56}>8 h 30</Big>"),
    ("<ReportDoc title=\"Rapport sur l'emploi\" />", "<ReportDoc title=\"Rapport sur l'emploi\" width={380} />"),
])

patch("TwoSurveys.tsx", [
    ("<Office size={190} lit={leftLit} />", "<Office size={240} lit={leftLit} />"),
    ("<Office size={140} lit={leftLit} />", "<Office size={180} lit={leftLit} />"),
    ("<Clipboard size={90} />", "<Clipboard size={110} />"),
    ('<div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 190 }}>', '<div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 240 }}>'),
    ("<HouseGlyph size={i === 1 ? 150 : 120} lit={rightLit} phase={i * 2} />", "<HouseGlyph size={i === 1 ? 190 : 150} lit={rightLit} phase={i * 2} />"),
    ("<Person size={120} color={theme.colors.context} wave={frame > tGens + 10 && frame < tMen} />", "<Person size={150} color={theme.colors.context} wave={frame > tGens + 10 && frame < tMen} />"),
    ('<div style={{ position: "absolute", left: 0, top: 420, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>', '<div style={{ position: "absolute", left: 0, top: 500, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>'),
    ("<Bathtub level={level} flowing={frame >= tRob} width={600} />", "<Bathtub level={level} flowing={frame >= tRob} width={680} />"),
])

patch("Claims.tsx", [
    ("<Pop key={i} at={tWeek + i * 3}>", "<Pop key={i} at={4 + i * 3}>"),
    ("const weekIdx = Math.floor(Math.max(0, frame - tWeek) / 9) % 8;", "const weekIdx = frame < tWeek ? -1 : Math.floor((frame - tWeek) / 9) % 8;"),
])

patch("Wages.tsx", [
    ("<Office size={150} lit />\n              <div style={{ transform: `translateX(${-tug}px) rotate(-10deg)` }}>\n                <Person size={130}", "<Office size={210} lit />\n              <div style={{ transform: `translateX(${-tug}px) rotate(-10deg)` }}>\n                <Person size={170}"),
    ('<Person size={150} color={C.accent} label="le candidat" />', '<Person size={200} color={C.accent} label="le candidat" />'),
    ("<div style={{ transform: `translateX(${tug}px) rotate(10deg) scaleX(-1)` }}>\n                <Person size={130}", "<div style={{ transform: `translateX(${tug}px) rotate(10deg) scaleX(-1)` }}>\n                <Person size={170}"),
    ('<div style={{ transform: "scaleX(-1)" }}>\n                <Office size={150} lit />', '<div style={{ transform: "scaleX(-1)" }}>\n                <Office size={210} lit />'),
    ("left: i * 140, bottom: 50", "left: i * 130, bottom: 50"),
    ('<div style={{ position: "absolute", right: -10, top: -52,', '<div style={{ position: "absolute", right: 0, top: -52,'),
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, paddingTop: 10 }}>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>'),
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 60 }}>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>'),
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>\n          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>\n          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>'),
])

patch("Growth.tsx", [
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", gap: 30, paddingTop: 10 }}>', '<div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34, paddingLeft: 30 }}>'),
    ('<div style={{ color, fontSize: 27, fontWeight: 800, whiteSpace: "nowrap" }}>{text}</div>', '<div style={{ color, fontSize: 31, fontWeight: 800, whiteSpace: "nowrap" }}>{text}</div>'),
])

patch("GdpNow.tsx", [
    ("<Pop at={tModel}>\n              <ModelMachine size={420}", "<Pop at={tEst + 6}>\n              <ModelMachine size={420}"),
    ('<div style={{ position: "absolute", left: 130, top: -10 }}>\n                    <CrossDraw at={tNotYoY + 8} size={100} />', '<div style={{ position: "absolute", right: -90, top: -6 }}>\n                    <CrossDraw at={tNotYoY + 8} size={90} />'),
])

patch("GoldChain.tsx", [
    ('icon: <ReportDoc title="Emploi" width={110} />, tone: C.accent', "icon: <DocIcon size={90} color={C.accentBright} />, tone: C.accent"),
    ('import { Beat, Pop, Person, Domino, DollarIcon, ArrowGlyph, clamp } from "./characters";', 'import { Beat, Pop, Person, Domino, DollarIcon, ArrowGlyph, DocIcon, clamp } from "./characters";'),
])

patch("TerminalUsage.tsx", [
    ('{i > 0 && <div style={{ color: C.accent, fontSize: 40 }}>→</div>}', '{i > 0 && (\n                  <Pop at={s.at - 4}>\n                    <div style={{ color: C.accent, fontSize: 40 }}>→</div>\n                  </Pop>\n                )}'),
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 30 }}>\n          <Big size={48}>Le réflexe</Big>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>\n          <Big size={48}>Le réflexe</Big>'),
])

patch("GlossaryFlash.tsx", [
    ("transform: `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,", 'transform: p > 0.995 ? "none" : `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,'),
])

patch("Unemployment.tsx", [
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 10 }}>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>'),
])
patch("Payrolls.tsx", [
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>', '<div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>'),
])
patch("Recap.tsx", [
    ('<div style={{ width: STAGE_W, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", paddingTop: 20 }}>', '<div style={{ width: STAGE_W, height: 640, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", alignContent: "center" }}>'),
    ('<div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, paddingTop: 30 }}>', '<div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>'),
])
print("patched")
