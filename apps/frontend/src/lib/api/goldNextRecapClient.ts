const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";
export type NextRecapStatus = "SCHEDULED" | "DUE" | "CONSUMED" | "EXPIRED" | "CANCELLED" | "INVALID" | "UNAVAILABLE";
export interface NextRecap { status: NextRecapStatus; requested_at: string | null; timezone: "America/New_York"; reason: string | null; parent_state_run_id: string | null; retrieved_at: string; }
export async function fetchNextRecap(): Promise<NextRecap> {
  const response = await fetch(`${BACKEND_URL}/api/gold/next-recap`, { cache: "no-store" });
  if (!response.ok) throw new Error("NEXT_RECAP_UNAVAILABLE");
  return response.json() as Promise<NextRecap>;
}
