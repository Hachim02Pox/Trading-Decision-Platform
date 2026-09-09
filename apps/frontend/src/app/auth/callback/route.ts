import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth/safeRedirect";

// Supabase's email-confirmation link redirects here with a `code` param.
// Exchanging it for a session is what actually confirms the holder's email
// and logs them in — see docs/AUTH_SUPABASE.md.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const failureReason = next === "/reset-password" ? "reset_failed" : "confirmation_failed";
  return NextResponse.redirect(`${origin}/login?error=${failureReason}`);
}
