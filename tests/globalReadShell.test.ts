import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../apps/frontend/src/app/layout.tsx", import.meta.url), "utf8");
const notifier = readFileSync(new URL("../apps/frontend/src/components/shell/GlobalReadNotifier.tsx", import.meta.url), "utf8");
const marketPage = readFileSync(new URL("../apps/frontend/src/app/market/page.tsx", import.meta.url), "utf8");

test("Global Read lifecycle lives above route pages and exposes a route-independent notifier", () => {
  assert.match(layout, /<GlobalReadProvider>/);
  assert.match(notifier, /Lecture Globale en cours/);
  assert.match(notifier, /\/market\?globalRead=1/);
  assert.match(marketPage, /useGlobalRead\(\)/);
  assert.doesNotMatch(marketPage, /useGlobalReadAnalysis\(/);
});
