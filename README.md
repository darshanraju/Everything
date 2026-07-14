# Everything

Personal multi-app workspace. Each app lives in its own folder and uses a dedicated Supabase schema (see [`agents.md`](./agents.md)).

## Apps

| Folder | App | Schema | Auth |
|--------|-----|--------|------|
| [`ozempic-tracker/`](./ozempic-tracker/) | **Mum Fitness** — weekly dose + weight (kg) | `ozempic_tracker` | Google |
| [`todo-pwa/`](./todo-pwa/) | **Todo** — tasks + consistency chart (PWA) | `todo_pwa` | None (personal) |

## Deploy on Vercel (monorepo)

Each app is a **separate** Vercel project (or one project with Root Directory set per deploy).

1. **Root Directory** = the app folder (`ozempic-tracker` or `todo-pwa`), **not** the repo root  
2. **Framework:** Next.js · Output directory empty  
3. **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
   - Mum Fitness also needs `NEXT_PUBLIC_SITE_URL` for OAuth  

### Why you see `404: NOT_FOUND`

Root Directory blank → Vercel builds the monorepo root (no Next app).

## Supabase

One shared project. Expose both schemas under **API → Exposed schemas**:

- `ozempic_tracker`
- `todo_pwa`

Migrations live under each app’s `supabase/migrations/`.
