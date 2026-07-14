# Google sign-in only (Google Cloud + Supabase)

Mum Fitness uses **Google OAuth** as the only login method.  
No magic links, passwords, or passkeys in the UI.

## Overview

```text
App  →  Google account picker  →  Supabase Auth  →  /auth/callback  →  Dashboard
```

You configure:

1. **Google Cloud** — OAuth client (Client ID + Client Secret)  
2. **Supabase** — Google provider + redirect URLs  

No Google secrets go in the Next.js app or Vercel env (only Supabase URL + publishable key).

---

## 1. Google Cloud Console

### 1.1 Project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `ozempic-tracker`)

### 1.2 OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** (unless you use a Workspace org)
3. App name: `Mum Fitness`
4. User support email: your email
5. Developer contact: your email
6. Save
7. **Scopes** → add at least:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
8. **Test users** (while app is in **Testing**):
   - Add mum’s Google email (and yours)
   - Only these accounts can sign in until you publish the app

> Publishing the consent screen for “production” is optional for a family app.  
> Keeping **Testing** + test users is fine.

### 1.3 OAuth Client ID

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Mum Fitness Web`
4. **Authorized JavaScript origins** (your real app hosts, no path):

   ```text
   http://localhost:3000
   https://YOUR-PRODUCTION.vercel.app
   ```

   (Add any other stable production domain you use.)

5. **Authorized redirect URIs** — **must** be Supabase’s callback (not your app URL):

   ```text
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   Find `YOUR_SUPABASE_PROJECT_REF` in Supabase → **Project Settings → API → Project URL**  
   (e.g. `https://abcdefgh.supabase.co` → ref is `abcdefgh`)

6. Create → copy **Client ID** and **Client Secret**

---

## 2. Supabase

### 2.1 Enable Google provider

1. Supabase → **Authentication** → **Providers** → **Google**
2. Enable Google
3. Paste **Client ID** and **Client Secret** from Google Cloud
4. Save

### 2.2 URL configuration

**Authentication** → **URL configuration**

| Field | Value |
|--------|--------|
| **Site URL** | `https://mum-health.vercel.app` |
| **Redirect URLs** | See list below |

Add **all** of these to **Redirect URLs** (exact match required):

```text
http://localhost:3000/auth/callback
https://mum-health.vercel.app/auth/callback
https://mum-health.vercel.app/**
```

If `…/auth/callback` is missing, Supabase sends users to Site URL as `/?code=…`  
(the app now forwards that to `/auth/callback`, but the allow-list should still include the callback).

Always sign in via the **production** URL: `https://mum-health.vercel.app`  
(not `mum-health-xxxxx-….vercel.app` preview links).

### 2.3 Disable other sign-in methods (optional but “Google only”)

**Authentication** → **Providers**

- **Email**: disable if you want zero magic-link / password noise  
- Leave **Google** enabled  

---

## 3. App (already wired)

Login calls:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  },
});
```

Callback route: `app/auth/callback/route.ts`  
→ `exchangeCodeForSession(code)` → redirect to `/dashboard`

Vercel env (unchanged):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## 4. Test checklist

1. Open `http://localhost:3000/login` (or production)
2. **Continue with Google**
3. Pick a **test user** account
4. Land on **Dashboard** signed in
5. Sign out → sign in again works without email

### Common errors

| Error | Fix |
|--------|-----|
| `redirect_uri_mismatch` | Google redirect URI must be exactly `https://REF.supabase.co/auth/v1/callback` |
| Access blocked / app not verified | Add email under OAuth consent **Test users** |
| Lands on `/login?error=auth` | Check Supabase redirect allow-list includes `…/auth/callback`; check Google client secret |
| Works locally, not on Vercel | Add production origin + redirect URL in both Google and Supabase |

---

## 5. Mum’s flow

1. Open the app (Add to Home Screen optional)  
2. Tap **Continue with Google**  
3. Choose her Gmail  
4. Done — stays signed in on that phone  

No Resend, no custom domain for email, no rate limits on magic links.
