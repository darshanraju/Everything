import { NextResponse, type NextRequest } from "next/server";

/**
 * Pass-through only.
 *
 * Do NOT redirect based on cookie presence here. Optimistic "has sb-* cookie"
 * checks caused ERR_TOO_MANY_REDIRECTS when cookies existed but the session
 * was invalid (e.g. after a half-finished Google OAuth):
 *
 *   /login  (cookie present) → proxy → /dashboard
 *   /dashboard (getUser null) → /login
 *   …repeat…
 *
 * Real auth is enforced in server pages via getUser() + redirect.
 * Session refresh runs in the browser (AuthSession).
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
