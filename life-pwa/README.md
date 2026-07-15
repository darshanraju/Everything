# Life (PWA)

Modular personal app: **Fitness** · **Health** · **Today** · **Shared** (link inbox).  
Dark mode · installable · shared Supabase schema `life_hub` · **no auth**.

## Modules

Tabs are driven by `modules/registry.ts`. Add a new module by:

1. Adding a key to `ModuleKey` + entry in `MODULES`  
2. Creating `modules/<key>/` + routes under `app/<key>/`  
3. Optional tables in `life_hub` (or a new schema if isolated)

| Key | Tab | Features (MVP) |
|-----|-----|----------------|
| `today` | Today | Modular daily feed + **SLA stats** (`/today/stats`): per-module + overall keep-up % |
| `fitness` | Fitness | Exercises, programs, weekly plan, **live workouts**, **history**, ghost sets, body weight (kg) |
| `health` | Health | **Routine** · **Surgery** · **Food** (macro targets, food library, daily check-offs + SLA) |
| `shared` | Shared | Link inbox: OS share → Life, or paste; title + tag (learning / fun / work / …) |
| `notes` | Notes | Simple notepad for feature ideas |

**Extending Today / SLA:** add `modules/<key>/today.ts` with `getItems` + optional `getDayScores`, then register in `modules/today/contributors.ts`. Overall SLA and charts pick up new sources automatically.

**Shared / share target:** PWA manifest `share_target` → `/shared/new?title&text&url`. After deploy, reinstall the home-screen app so the manifest updates. Android Chrome is most reliable; on iOS use **Add** and paste.

## Database

- **Schema:** `life_hub` (not `public`)  
- **Security:** open anon RLS (personal URL only)

### Setup

1. ```bash
   cp .env.local.example .env.local
   ```
   Same Supabase URL + publishable key as other apps.

2. Run migrations in SQL Editor (in order):

   - [`supabase/migrations/001_life_hub.sql`](./supabase/migrations/001_life_hub.sql)
   - [`supabase/migrations/002_peptide_syringe_units.sql`](./supabase/migrations/002_peptide_syringe_units.sql) (if needed)
   - [`supabase/migrations/003_workout_sessions.sql`](./supabase/migrations/003_workout_sessions.sql) — live logging + history
   - [`supabase/migrations/005_cardio_running.sql`](./supabase/migrations/005_cardio_running.sql) — Running / cardio
   - [`supabase/migrations/006_health_protocol_categories.sql`](./supabase/migrations/006_health_protocol_categories.sql) — meds/skincare categories
   - [`supabase/migrations/007_today_tasks.sql`](./supabase/migrations/007_today_tasks.sql) — manual Today tasks
   - [`supabase/migrations/008_shared_links.sql`](./supabase/migrations/008_shared_links.sql) — Shared links inbox
   - [`supabase/migrations/009_surgeries.sql`](./supabase/migrations/009_surgeries.sql) — Surgery procedures
   - [`supabase/migrations/010_food_macros.sql`](./supabase/migrations/010_food_macros.sql) — Food macros + logs
   - [`supabase/migrations/011_protocol_schedule_weekdays.sql`](./supabase/migrations/011_protocol_schedule_weekdays.sql) — Weekly/custom protocol days
   - [`supabase/migrations/012_food_logs_multi_serving.sql`](./supabase/migrations/012_food_logs_multi_serving.sql) — Multiple food servings per day
   - [`supabase/migrations/013_notes.sql`](./supabase/migrations/013_notes.sql) — Notes notepad

3. Expose schema **`life_hub`**: Project Settings → API → Exposed schemas.

## Develop

```bash
cd life-pwa
npm install
npm run dev
```

## Deploy (Vercel)

- Root Directory: `life-pwa`  
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
- Build uses webpack for PWA (`npm run build`)

## Roadmap

- **MVP:** programs, week plan, weight, peptides  
- **Phase 1 (shipped):** live workouts, history, ghost (previous) sets  
- **Phase 2:** rest timer, PRs, progress charts per exercise, more modules  
