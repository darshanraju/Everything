# Everything

Personal multi-app workspace. Each app lives in its own folder and uses a dedicated Supabase schema (see [`agents.md`](./agents.md)).

## Apps

| Folder | App | Schema | Auth |
|--------|-----|--------|------|
| [`ozempic-tracker/`](./ozempic-tracker/) | **Mum Fitness** — weekly dose + weight (kg) | `ozempic_tracker` | Google |
| [`todo-pwa/`](./todo-pwa/) | **Todo** — tasks + consistency chart (PWA) | `todo_pwa` | None |
| [`life-pwa/`](./life-pwa/) | **Life** — training + peptides (modular PWA) | `life_hub` | None |

## Deploy on Vercel (monorepo)

1. **Root Directory** = the app folder (`ozempic-tracker`, `todo-pwa`, or `life-pwa`)  
2. **Framework:** Next.js · Output directory empty  
3. **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
   - Mum Fitness also needs `NEXT_PUBLIC_SITE_URL` for OAuth  

## Supabase

One shared project. Expose schemas under **API → Exposed schemas**:

- `ozempic_tracker`
- `todo_pwa`
- `life_hub`

Migrations live under each app’s `supabase/migrations/`.
