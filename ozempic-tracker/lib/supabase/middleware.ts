/**
 * Deprecated: Edge middleware/proxy must not import @supabase/ssr
 * (Vercel: ReferenceError: __dirname is not defined).
 *
 * Use:
 * - `proxy.ts` for lightweight cookie-based redirects
 * - `createClient` from `./server` for real getUser() checks in RSC
 * - `AuthSession` client component for session refresh in the browser
 */
export {};
