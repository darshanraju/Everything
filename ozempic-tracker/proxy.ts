import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight route guards only — no @supabase/ssr here.
 * Importing Supabase in Edge proxy/middleware crashes on Vercel with:
 *   ReferenceError: __dirname is not defined
 *
 * Real session validation happens in server pages via getUser().
 * Token refresh runs in the browser via AuthSession (createBrowserClient).
 */

function hasAuthCookie(request: NextRequest): boolean {
  // Supabase SSR cookies: sb-<ref>-auth-token or chunked .0/.1
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("-auth-token") ||
        (c.name.startsWith("sb-") && c.name.includes("auth"))
    );
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthRoute =
    path === "/login" ||
    path.startsWith("/login/") ||
    path.startsWith("/auth");

  const isProtected =
    path.startsWith("/dashboard") ||
    path === "/log" ||
    path.startsWith("/log/") ||
    path.startsWith("/history");

  const signedIn = hasAuthCookie(request);

  // Soft redirect only — cookie presence is optimistic, not cryptographic.
  if (signedIn && (path === "/login" || path.startsWith("/login/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!signedIn && isProtected && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
