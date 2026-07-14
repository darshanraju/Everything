# Ozempic Tracker

Weekly Ozempic check-ins for dose, **weight in kg**, and a scale photo — plus a simple weight-over-time chart.

Mum-friendly UI · **Google sign-in only** · Saturday check-in prompt.

## Auth

**Only Google OAuth** (via Supabase Auth).

Full setup: [`supabase/GOOGLE_AUTH.md`](./supabase/GOOGLE_AUTH.md)

Summary:

1. **Google Cloud** → OAuth consent + Web client  
   - Redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
2. **Supabase** → Authentication → Providers → Google → Client ID + Secret  
3. **Supabase** → Redirect URLs include `https://your-app.vercel.app/auth/callback`  
4. App login: **Continue with Google** → `/auth/callback` → dashboard  

No magic links, passwords, Resend, or passkeys required.

## Database

- **Supabase project:** existing shared project (see root `agents.md`)
- **Schema:** `ozempic_tracker` — **do not** put app tables in `public`
- **Auth:** shared Supabase Auth (`auth.users`); app profile/logs in `ozempic_tracker`
- **Storage bucket:** `ozempic-scale-photos` (private)

### One-time database setup

1. Copy env file and fill in your Supabase URL + publishable key:

   ```bash
   cp .env.local.example .env.local
   ```

2. Run the migration SQL in the Supabase SQL Editor:

   - File: [`supabase/migrations/001_ozempic_tracker.sql`](./supabase/migrations/001_ozempic_tracker.sql)

3. **Expose the schema** in Supabase Dashboard:

   - Project Settings → API → **Exposed schemas**
   - Add `ozempic_tracker`

4. Complete [Google Auth setup](./supabase/GOOGLE_AUTH.md)

## Deploy (Vercel)

1. **Root Directory** must be `ozempic-tracker` (not the repo root).
2. Env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Redeploy after Root Directory is set.

**Auth note:** Route guards live in `proxy.ts` (cookie presence only — Edge-safe).  
Real auth checks run in server pages via `getUser()`. Session refresh runs in the browser (`AuthSession`).

## Develop

```bash
cd ozempic-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Weekly check-in

Each Saturday (timezone default `Europe/London`, stored on profile), the app prompts for:

1. Took Ozempic? (yes/no)
2. Weight that day (**kg only**)
3. Photo of the scale showing the weight

One log per user per week (`week_of` = Saturday that starts Sat–Fri). Late entry is allowed until the next Saturday period starts.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase Auth (Google only), Postgres schema `ozempic_tracker`, Storage
- recharts for weight history
