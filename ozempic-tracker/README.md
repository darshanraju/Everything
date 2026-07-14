# Ozempic Tracker

Weekly Ozempic check-ins for dose, **weight in kg**, and a scale photo — plus a simple weight-over-time chart.

Mum-friendly UI: large controls, magic-link login (no password), Saturday prompt.

## Database

- **Supabase project:** existing shared project (see root `agents.md`)
- **Schema:** `ozempic_tracker` — **do not** put app tables in `public`
- **Auth:** shared Supabase Auth (`auth.users`); app profile/logs in `ozempic_tracker`
- **Storage bucket:** `ozempic-scale-photos` (private)

### One-time setup

1. Copy env file and fill in your Supabase URL + publishable key:

   ```bash
   cp .env.local.example .env.local
   ```

2. Run the migration SQL in the Supabase SQL Editor:

   - File: [`supabase/migrations/001_ozempic_tracker.sql`](./supabase/migrations/001_ozempic_tracker.sql)

3. **Expose the schema** in Supabase Dashboard:

   - Project Settings → API → **Exposed schemas**
   - Add `ozempic_tracker` (keep `public` for auth helpers if needed)

4. Auth → URL configuration:

   - Site URL: `http://localhost:3000` (or your deploy URL)
   - Redirect URLs: `http://localhost:3000/auth/callback`

5. Enable **Email** magic link / OTP in Auth providers.

## Develop

```bash
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
- Supabase Auth, Postgres schema `ozempic_tracker`, Storage
- recharts for weight history
