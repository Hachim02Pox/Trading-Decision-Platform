import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test("Vercel frontend build installs and builds from the monorepo root", () => {
  const config = JSON.parse(readFileSync(resolve("apps/frontend/vercel.json"), "utf8")) as Record<string, string>;

  assert.match(config.installCommand, /cd \.\.\/\.\. && npm ci/);
  assert.match(config.buildCommand, /npm run build:contracts && npm run build --workspace apps\/frontend/);
});
