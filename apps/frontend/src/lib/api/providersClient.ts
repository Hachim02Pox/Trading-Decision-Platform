import type { ProviderStatus } from "@gold-terminal/contracts";

// Milestone 2A, section 13 — Settings → Data Sources. Fetches the
// registry's last-known provider status (never triggers a live smoke test —
// see apps/backend/src/server.ts's GET /api/providers/status).
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

export async function fetchProviderStatuses(): Promise<ProviderStatus[]> {
  const res = await fetch(`${BACKEND_URL}/api/providers/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch provider status: ${res.status}`);
  return res.json();
}
