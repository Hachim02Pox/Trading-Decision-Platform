import assert from "node:assert/strict";
import test from "node:test";
import { getSafeNextPath } from "../apps/frontend/src/lib/auth/safeRedirect";

test("getSafeNextPath: allows a plain relative path", () => {
  assert.equal(getSafeNextPath("/reset-password"), "/reset-password");
});

test("getSafeNextPath: falls back to /market when next is missing", () => {
  assert.equal(getSafeNextPath(null), "/market");
});

test("getSafeNextPath: rejects absolute URLs (open redirect)", () => {
  assert.equal(getSafeNextPath("https://evil.example.com"), "/market");
  assert.equal(getSafeNextPath("http://evil.example.com/phish"), "/market");
});

test("getSafeNextPath: rejects protocol-relative and backslash variants (open redirect)", () => {
  assert.equal(getSafeNextPath("//evil.example.com"), "/market");
  assert.equal(getSafeNextPath("/\\evil.example.com"), "/market");
});

test("getSafeNextPath: rejects a path not starting with /", () => {
  assert.equal(getSafeNextPath("evil.example.com"), "/market");
});

test("getSafeNextPath: rejects controls stripped by browser URL parsing", () => {
  for (const control of ["\n", "\r", "\t", "\u0000", "\u001f", "\u007f"]) {
    assert.equal(getSafeNextPath(`/${control}/evil.example`), "/market");
  }
});

test("getSafeNextPath: rejects embedded backslashes and preserves safe query strings", () => {
  assert.equal(getSafeNextPath("/folder\\evil.example"), "/market");
  assert.equal(getSafeNextPath("/journal?view=recent#notes"), "/journal?view=recent#notes");
});
