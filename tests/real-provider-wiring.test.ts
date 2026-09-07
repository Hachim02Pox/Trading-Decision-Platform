import assert from "node:assert/strict";
import test from "node:test";
import { REAL_FAMILY_IDS } from "../apps/backend/src/real/buildRealOverrides.ts";
import { computeGvzValues } from "../apps/backend/src/real/f11GoldVol.ts";
import type { FredObservation } from "../apps/backend/src/providers/fred.ts";

const observation = (date: string, value: number): FredObservation => ({ date, value });

test("F11 is included in real-family override routing", () => {
  assert.ok(REAL_FAMILY_IDS.includes("F11"));
});

test("GVZ derives level, 1D change, and five-observation change without mutating history", () => {
  const history = [
    observation("2026-08-27", 26.8),
    observation("2026-08-26", 25.5),
    observation("2026-08-25", 25.1),
    observation("2026-08-24", 24.9),
    observation("2026-08-21", 24.6),
    observation("2026-08-20", 24.0),
  ];
  const before = structuredClone(history);
  assert.deepEqual(computeGvzValues(history), { level: 26.8, change1d: 1.3, change5d: 2.8 });
  assert.deepEqual(history, before);
});

test("GVZ change fields stay unavailable when their required history is missing", () => {
  assert.deepEqual(computeGvzValues([observation("2026-08-27", 26.8)]), {
    level: 26.8,
    change1d: null,
    change5d: null,
  });
});
