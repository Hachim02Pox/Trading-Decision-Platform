import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";
export type EdgeCheckStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export interface EdgeCheck { check_id: string; request_id: string; base_run_id: string; status: EdgeCheckStatus; source_window_start: string | null; source_window_end: string | null; result: Record<string, unknown> | null; error: { code: string; message: string } | null; created_at: string; completed_at: string | null; }
async function authHeaders(): Promise<HeadersInit> { const { data } = await createClient().auth.getSession(); if (!data.session?.access_token) throw new Error("AUTH_REQUIRED"); return { Authorization: `Bearer ${data.session.access_token}` }; }
async function parse(response: Response): Promise<EdgeCheck> { const body = await response.json() as EdgeCheck | { error?: { code?: string; message?: string } }; if (!response.ok) throw new Error("error" in body ? body.error?.code ?? "EDGE_CHECK_FAILED" : "EDGE_CHECK_FAILED"); return body as EdgeCheck; }
export async function createEdgeCheck(idempotencyKey: string): Promise<EdgeCheck> { return parse(await fetch(`${BACKEND_URL}/api/gold/edge-checks`, { method: "POST", headers: { ...(await authHeaders()), "Content-Type": "application/json" }, body: JSON.stringify({ idempotency_key: idempotencyKey }), cache: "no-store" })); }
export async function fetchLatestEdgeCheck(baseRunId: string): Promise<EdgeCheck | null> { const response = await fetch(`${BACKEND_URL}/api/gold/edge-checks/latest?baseRunId=${encodeURIComponent(baseRunId)}`, { headers: await authHeaders(), cache: "no-store" }); if (response.status === 404) return null; return parse(response); }
export async function fetchEdgeCheck(checkId: string): Promise<EdgeCheck> { return parse(await fetch(`${BACKEND_URL}/api/gold/edge-checks/${encodeURIComponent(checkId)}`, { headers: await authHeaders(), cache: "no-store" })); }
