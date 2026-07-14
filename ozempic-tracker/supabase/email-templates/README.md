# Auth email templates (Ozempic Tracker)

Supabase sends magic-link emails using templates on the **shared project**.  
The app cannot change email subject/body from Next.js alone — update them in the dashboard.

## Magic Link (required for friendlier emails)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Authentication** → **Email Templates** → **Magic Link**  
3. Set:

### Subject

```text
Sign in to Ozempic Tracker — your weekly check-in
```

### Body

Paste the full HTML from [`magic-link.html`](./magic-link.html).

Keep `{{ .ConfirmationURL }}` exactly as written — Supabase replaces it with the real sign-in link.

4. Click **Save**.

## Confirm signup (optional)

If email confirmation is enabled for new users, use the same tone:

**Subject:**

```text
Confirm your Ozempic Tracker email
```

**Body:** Same structure as magic-link, with CTA “Confirm and open Ozempic Tracker” and `{{ .ConfirmationURL }}`.

## Note on shared Supabase

Email templates are **project-wide**. If other apps share this Supabase project, a generic subject (e.g. “Sign in to Everything”) may be better later. For now this is tuned for mum’s Ozempic Tracker.
