// Times N stills from a given bundle dir: node scripts/bench.mjs <bundleDir> <startFrame> <count>
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [dir, start, count] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const serveUrl = path.resolve(dir);
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl, id: "F5Video", inputProps: {}, puppeteerInstance: browser });
const t0 = Date.now();
for (let i = 0; i < count; i++) {
  await renderStill({ composition, serveUrl, output: path.resolve("out/check/bench.jpg"), frame: start + i * 7, imageFormat: "jpeg", puppeteerInstance: browser, overwrite: true });
}
console.log(dir, "ms/frame", Math.round((Date.now() - t0) / count));
await browser.close({ silent: true });
