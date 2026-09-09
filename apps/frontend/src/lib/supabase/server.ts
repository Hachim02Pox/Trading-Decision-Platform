import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client — used from Server Components, Route Handlers,
// and middleware. Reads/writes the session via cookies so a holder's login
// survives a full page reload. See docs/AUTH_SUPABASE.md.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from a Server Component without a surrounding
            // middleware refresh — safe to ignore as long as middleware.ts
            // is also refreshing the session (see apps/frontend/middleware.ts).
          }
        },
      },
    }
  );
}
