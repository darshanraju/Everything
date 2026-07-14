-- Ozempic Tracker schema (shared Supabase project — not public)
-- Follows agents.md multi-app schema strategy.
-- Run this in the Supabase SQL Editor (or via supabase db push).
-- After running: expose schema `ozempic_tracker` in Project Settings → API → Exposed schemas.

CREATE SCHEMA IF NOT EXISTS ozempic_tracker;

GRANT USAGE ON SCHEMA ozempic_tracker TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ozempic_tracker TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ozempic_tracker TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ozempic_tracker
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ozempic_tracker
  GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- App-specific profile (preferences live with the app, not public)
CREATE TABLE IF NOT EXISTS ozempic_tracker.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  reminder_weekday SMALLINT NOT NULL DEFAULT 6 CHECK (reminder_weekday BETWEEN 0 AND 6), -- 0=Sun … 6=Sat
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ozempic_tracker.weekly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL, -- Saturday that anchors this week (Sat–Fri period)
  took_ozempic BOOLEAN NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  scale_photo_path TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_of)
);

CREATE INDEX IF NOT EXISTS weekly_logs_user_week_idx
  ON ozempic_tracker.weekly_logs (user_id, week_of DESC);

ALTER TABLE ozempic_tracker.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ozempic_tracker.weekly_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: own rows only
DROP POLICY IF EXISTS profiles_select_own ON ozempic_tracker.profiles;
CREATE POLICY profiles_select_own ON ozempic_tracker.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_insert_own ON ozempic_tracker.profiles;
CREATE POLICY profiles_insert_own ON ozempic_tracker.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_update_own ON ozempic_tracker.profiles;
CREATE POLICY profiles_update_own ON ozempic_tracker.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Weekly logs: own rows only
DROP POLICY IF EXISTS logs_select_own ON ozempic_tracker.weekly_logs;
CREATE POLICY logs_select_own ON ozempic_tracker.weekly_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS logs_insert_own ON ozempic_tracker.weekly_logs;
CREATE POLICY logs_insert_own ON ozempic_tracker.weekly_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS logs_update_own ON ozempic_tracker.weekly_logs;
CREATE POLICY logs_update_own ON ozempic_tracker.weekly_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS logs_delete_own ON ozempic_tracker.weekly_logs;
CREATE POLICY logs_delete_own ON ozempic_tracker.weekly_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for scale photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ozempic-scale-photos', 'ozempic-scale-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ozempic scale photos select own" ON storage.objects;
CREATE POLICY "ozempic scale photos select own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ozempic-scale-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "ozempic scale photos insert own" ON storage.objects;
CREATE POLICY "ozempic scale photos insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ozempic-scale-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "ozempic scale photos update own" ON storage.objects;
CREATE POLICY "ozempic scale photos update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ozempic-scale-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "ozempic scale photos delete own" ON storage.objects;
CREATE POLICY "ozempic scale photos delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ozempic-scale-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
