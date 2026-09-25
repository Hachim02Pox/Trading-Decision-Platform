// Renders verification stills with one shared browser: node scripts/stills.mjs <prefix> <sceneId:fraction,...|all>
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const serveUrl = path.join(root, "build");
const outDir = path.join(root, "out", "check");
mkdirSync(outDir, { recursive: true });
const tl = JSON.parse(readFileSync(path.join(root, "src", "data", "timeline.json"), "utf8"));
let cur = 0;
const scenes = tl.scenes.map((s, i) => {
  const d = Math.round(s.durationSeconds * 30) + (i === tl.scenes.length - 1 ? 90 : 0);
  const r = { id: s.id, start: cur, dur: d };
  cur += d;
  return r;
});
const prefix = process.argv[2] ?? "v1";
const spec = process.argv[3] ?? "all";
let jobs = [];
if (spec === "all") {
  for (const s of scenes) for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) jobs.push({ id: s.id, frame: s.start + Math.round(s.dur * f), tag: Math.round(f * 100) });
} else {
  for (const part of spec.split(",")) {
    const [id, frac] = part.split(":");
    const s = scenes.find((x) => x.id === id);
    const f = Number(frac);
    jobs.push({ id, frame: f > 1 ? s.start + Math.round(f * 30) : s.start + Math.round(s.dur * f), tag: String(frac).replace(".", "") });
  }
}
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl, id: "F13Video", inputProps: {}, puppeteerInstance: browser });
for (const j of jobs) {
  const output = path.join(outDir, `${prefix}_${j.id}_${j.tag}.jpg`);
  try {
    await renderStill({ composition, serveUrl, output, frame: j.frame, imageFormat: "jpeg", jpegQuality: 70, puppeteerInstance: browser, overwrite: true, scale: 0.5 });
    console.log("ok", path.basename(output));
  } catch (e) {
    console.log("FAIL", j.id, j.frame, String(e.message).slice(0, 300));
  }
}
await browser.close({ silent: true });
