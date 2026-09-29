import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflow = fs.readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

test("CI materializes and validates the pinned Brain v6 bundle on Node 22", () => {
  assert.match(workflow, /node-version:\s*["']22["']/);
  assert.match(workflow, /python3 gold-sunday-read\/brain-v6\/materialize\.py/);
  assert.match(workflow, /npm ci --prefix gold-sunday-read\/brain-v6\/reference\/brain/);
  assert.match(workflow, /npm test --prefix gold-sunday-read\/brain-v6\/reference\/brain/);
});
