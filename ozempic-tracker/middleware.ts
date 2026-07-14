import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep auth session refresh + route guards in this file.
 * Vercel Edge bundling can fail when middleware imports via `@/` aliases
 * in a monorepo (error: unsupported module @ozempic-tracker/lib/...).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If env is missing at build/runtime, don't crash Edge — pass through.
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Auth pages must not be treated as protected (note: "/log" would match "/login")
  const isAuthRoute =
    path === "/login" ||
    path.startsWith("/login/") ||
    path.startsWith("/auth");

  const isProtected =
    path.startsWith("/dashboard") ||
    path === "/log" ||
    path.startsWith("/log/") ||
    path.startsWith("/history");

  // Signed-in users who hit login go straight to the app
  if (user && (path === "/login" || path.startsWith("/login/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Guests on protected routes → login (never redirect /login to itself)
  if (!user && isProtected && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
