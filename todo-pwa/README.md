# Todo (PWA)

Personal dark-mode todo list with a consistency chart. Installable on your phone.

**No login** — single-user list on the shared Supabase project (schema `todo_pwa`).

## Database

- **Supabase project:** same as Mum Fitness / ozempic-tracker (see root `agents.md`)
- **Schema:** `todo_pwa` — **not** `public`
- **Security:** RLS allows **anon** full access (personal app). Anyone with the URL can use the list. Don’t share the link publicly.

### One-time setup

1. Copy env:

   ```bash
   cp .env.local.example .env.local
   ```

   Use the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as Mum Fitness.

2. Run SQL in Supabase SQL Editor:

   - [`supabase/migrations/001_todo_pwa.sql`](./supabase/migrations/001_todo_pwa.sql)

3. **Expose schema** `todo_pwa`:

   - Project Settings → API → **Exposed schemas** → add `todo_pwa`

## Features

- Create tasks, check off, delete  
- Open / Done sections  
- **Stats:** completions per day (Recharts), streak, weekly totals  
- **PWA:** Add to Home Screen (manifest + service worker in production)

## Develop

```bash
cd todo-pwa
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. **Root Directory:** `todo-pwa`  
2. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
3. Deploy  

### Install on phone

- **Android (Chrome):** menu → Install app / Add to Home screen  
- **iPhone (Safari):** Share → Add to Home Screen  

## Stack

Next.js · Tailwind · shadcn/ui · recharts · Supabase (`todo_pwa`) · next-pwa  
