import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Gate: every route requires a signed-in holder except /login and the
// Supabase email-confirmation callback. Also refreshes the Supabase session
// cookie on every request (required by @supabase/ssr — see their docs).
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    }
  );

  // When a Supabase auth link (email confirmation, password reset) is
  // invalid/expired, GoTrue redirects straight to the Site URL's root ("/")
  // with `error`/`error_code` query params — NOT through our own
  // /auth/callback. Left unhandled, the auth-gate redirect below would
  // silently drop those params (a brand-new redirect Response never forwards
  // the original query string), so the holder lands on /login with no
  // explanation at all. Catch it here, before the gate, and forward the
  // error code onto /login so it can render a real message.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("error")) {
    const errorCode = request.nextUrl.searchParams.get("error_code") ?? request.nextUrl.searchParams.get("error") ?? "link_invalid";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorCode);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/market", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
