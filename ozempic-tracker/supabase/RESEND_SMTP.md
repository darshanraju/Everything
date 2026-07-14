# Resend SMTP for magic-link emails

Supabase’s default mailer is heavily rate-limited. Route Auth emails (magic links) through **Resend** instead.

> The Resend API key goes into **Supabase SMTP settings only**.  
> It does **not** need to be in the Next.js app or Vercel env for magic links.  
> **Never commit the key** to git.

## 1. Resend account

1. Sign up at [resend.com](https://resend.com)
2. Create an API key: [API Keys](https://resend.com/api-keys) → **Add API Key**  
   - Permission: **Sending access** is enough
3. Copy the key (`re_...`) — you’ll paste it once into Supabase

### Sender address

**Option A — quick test (no domain)**  
Use Resend’s onboarding sender while testing:

- Often: `onboarding@resend.com`  
- Or whatever Resend shows under [Domains](https://resend.com/domains) for testing  
- Test emails may only go to **your** account email until a domain is verified

**Option B — production (recommended)**  
1. Add your domain in Resend → **Domains**  
2. Add the DNS records they show  
3. Wait until status is **Verified**  
4. Send from e.g. `login@yourdomain.com` or `ozempic@yourdomain.com`

## 2. Supabase custom SMTP

1. Supabase Dashboard → your project  
2. **Project Settings** → **Authentication** (or **Authentication** → **SMTP**)  
   Direct: [Auth SMTP](https://supabase.com/dashboard/project/_/auth/smtp)  
3. Enable **Custom SMTP**  
4. Fill in:

| Field | Value |
|--------|--------|
| **Sender email** | Your verified address (e.g. `login@yourdomain.com` or Resend test sender) |
| **Sender name** | `Mum Fitness` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` (SSL) — if that fails try `587` |
| **Username** | `resend` |
| **Password** | Your Resend API key (`re_...`) |

5. **Save**

Official Resend guide: [Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)

### Alternative: one-click integration

Resend → **Settings → Integrations → Supabase** can wire SMTP for you. Still confirm **Enable custom SMTP** is on in Supabase afterward.

## 3. Raise Supabase email rate limits (optional)

Even with custom SMTP, Supabase may keep a project rate limit.

- **Authentication** → **Rate Limits** (or Auth settings)  
- Increase **email** / **OTP** limits if you still see rate limit errors  
- Defaults with custom SMTP are much higher than the built-in mailer, but not infinite

## 4. Confirm redirect URLs still match

**Authentication** → **URL configuration**

- **Site URL:** your production app, e.g. `https://your-app.vercel.app`  
- **Redirect URLs:**  
  - `https://your-app.vercel.app/auth/callback`  
  - `http://localhost:3000/auth/callback` (local)

## 5. Magic-link email content (optional)

**Authentication** → **Email Templates** → **Magic Link**  
Use subject + HTML from [`email-templates/`](./email-templates/).

## 6. Test

1. Wait a few minutes after saving SMTP if emails don’t send immediately  
2. Open the app → **Email me a sign-in link** once  
3. Check inbox **and spam**  
4. In Resend → **Emails** / **Logs**, confirm the message was accepted  
5. If it fails: wrong sender domain, DNS not verified, or typo in API key

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Still “rate limit exceeded” | Custom SMTP not enabled/saved; or raise Auth rate limits |
| No email arrives | Resend logs; sender domain verified; spam folder |
| “Invalid sender” | From address must be on a verified Resend domain |
| Works in Resend test but not Supabase | Username must be exactly `resend`; password = full API key |

## Security

- Treat `re_...` like a password  
- Prefer a **sending-only** API key  
- Rotate the key if it was ever committed or pasted into chat  
- Do not put `RESEND_API_KEY` in the frontend (`NEXT_PUBLIC_*`)
