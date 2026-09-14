import { createHash } from "node:crypto";

/** Deterministic SHA-256 of the raw Drive file text — the ingestion pipeline's duplicate/revision-detection key (see ingest.ts). */
export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
