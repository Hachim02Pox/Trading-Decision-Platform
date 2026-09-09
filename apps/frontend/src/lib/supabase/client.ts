import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — used from client components ("use client").
// NEXT_PUBLIC_* values are safe to expose: the anon/publishable key only
// grants what Row Level Security on public.holders allows (each holder sees
// their own row only). See docs/AUTH_SUPABASE.md.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
