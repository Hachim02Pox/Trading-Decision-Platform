import { createHash } from "node:crypto";

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, child]) => [key, sortJson(child)]));
  return value;
}

/** Stable JSON representation for v6 receipt seals; transport hashes remain raw-byte hashes. */
export function canonicalJsonSha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}
