/**
 * Restricts a post-auth `next` redirect target to a same-origin relative
 * path. `next` comes from a query param an attacker can set (e.g. a crafted
 * confirmation-link share), so an absolute or protocol-relative value here
 * would be an open redirect. See docs/AUTH_SUPABASE.md.
 */
export function getSafeNextPath(next: string | null, fallback = "/market"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
