# Ozempic Tracker

Weekly Ozempic check-ins for dose, **weight in kg**, and a scale photo — plus a simple weight-over-time chart.

Mum-friendly UI: large controls, **fingerprint / Face ID (passkeys)**, magic-link fallback, Saturday prompt.

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

6. **Customise the magic-link email** (so it says Ozempic Tracker, not generic Supabase):

   - Authentication → Email Templates → **Magic Link**
   - Subject + HTML: see [`supabase/email-templates/`](./supabase/email-templates/)
   - Keep `{{ .ConfirmationURL }}` in the body unchanged

7. **Enable passkeys (fingerprint / Face ID)** — required for biometric login:

   - Authentication → **Passkeys** → enable
   - **Relying Party Display Name:** `Ozempic Tracker`
   - **Relying Party ID:** your domain only, e.g. `localhost` for local dev, or `yourdomain.com` in production (no `https://`)
   - **Relying Party Origins:** e.g. `http://localhost:3000` and later `https://yourdomain.com`
   - HTTPS is required on real phones (localhost is OK on a computer)

### Passkeys on iPhone and Android (easy for mum)

| | Apple (iPhone) | Android |
|--|----------------|---------|
| **What she sees** | Face ID / Touch ID / device passcode | Fingerprint / face unlock / screen lock |
| **Browser** | Safari (or Chrome) | Chrome |
| **Where stored** | Often iCloud Keychain | Often Google Password Manager |
| **Setup** | Sign in once with email → Home → **Set up fingerprint / Face ID** | Same |
| **Next visits** | Sign-in screen → **Fingerprint / Face ID** | Same |

**Mum flow**

1. Sign in once with the email magic link (on *her* phone).  
2. On Home, tap **Set up fingerprint / Face ID** and approve the phone prompt.  
3. Later: open the app → **Fingerprint / Face ID** — no email.

No App Store download is required for web passkeys. A future “Add to Home Screen” PWA still uses the same passkeys.

## Deploy (Vercel)

1. **Root Directory** must be `ozempic-tracker` (not the repo root).
   - Project Settings → General → Root Directory → `ozempic-tracker`
2. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Redeploy.

Middleware is self-contained in `middleware.ts` (no `@/` imports) so Vercel Edge can bundle it.

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
- Supabase Auth, Postgres schema `ozempic_tracker`, Storage
- recharts for weight history
