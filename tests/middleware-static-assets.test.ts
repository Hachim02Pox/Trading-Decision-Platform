import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("middleware bypasses public media files so authenticated pages can play their videos", () => {
  const middleware = readFileSync(new URL("../apps/frontend/src/middleware.ts", import.meta.url), "utf8");
  for (const extension of ["mp4", "mp3", "wav", "jpg"]) assert.match(middleware, new RegExp(extension));
  assert.match(middleware, /matcher/);
});
