import assert from "node:assert/strict";
import test from "node:test";
import { BRAND_EASTER_EGG_COPY } from "../apps/frontend/src/components/brand/brandEasterEgg.ts";

test("brand easter egg credits Hachim and explains Zenith plus the gyroscope mark", () => {
  const copy = BRAND_EASTER_EGG_COPY.FR;

  assert.match(copy.title, /Hachim/i);
  assert.match(copy.body, /zénith/i);
  assert.match(copy.body, /créateur/i);
  assert.match(copy.body, /H·A·C·H·I·M/);
  assert.match(copy.body, /anneaux dorés/i);
});

test("brand easter egg has an English counterpart", () => {
  assert.match(BRAND_EASTER_EGG_COPY.EN.title, /Hachim/i);
  assert.match(BRAND_EASTER_EGG_COPY.EN.body, /zenith/i);
});
