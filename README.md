# Everything

Personal multi-app workspace. Each app lives in its own folder and uses a dedicated Supabase schema (see [`agents.md`](./agents.md)).

## Apps

| Folder | App |
|--------|-----|
| [`ozempic-tracker/`](./ozempic-tracker/) | Mum’s weekly Ozempic + weight (kg) tracker (Next.js) |

## Deploy Mum Fitness on Vercel

This repo is a **monorepo**. The Next.js app is **not** at the root.

### Required Vercel settings

1. Open the Vercel project → **Settings → General**
2. **Root Directory** → set to:
   ```text
   ozempic-tracker
   ```
   (Enable “Include source files outside of the Root Directory” only if you need it — usually leave off.)
3. **Framework Preset:** Next.js  
4. **Build Command:** `npm run build` (default)  
5. **Output Directory:** leave **empty** / default (do **not** set `.next` or `public`)  
6. **Install Command:** `npm install` (default)
7. **Environment variables** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
8. **Redeploy** → Deployments → ⋯ → Redeploy (clear cache if needed)

### Why you see `404: NOT_FOUND`

If Root Directory is blank, Vercel builds the repo root (only `agents.md` / no Next app) and the deployment has nothing to serve → platform `NOT_FOUND`.

### Supabase URLs (after you have a stable domain)

Use your **production** URL (not a one-off preview hash if it changes every deploy):

- Site URL: `https://YOUR-DOMAIN.vercel.app`
- Redirect: `https://YOUR-DOMAIN.vercel.app/auth/callback`
- Passkey RP ID: `YOUR-DOMAIN.vercel.app` (no `https://`)
- Passkey origin: `https://YOUR-DOMAIN.vercel.app`
