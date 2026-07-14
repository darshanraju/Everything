-- Todo PWA schema (shared Supabase project — not public)
-- Follows agents.md multi-app schema strategy.
-- Run in Supabase SQL Editor, then expose schema `todo_pwa` under
-- Project Settings → API → Exposed schemas.

CREATE SCHEMA IF NOT EXISTS todo_pwa;

GRANT USAGE ON SCHEMA todo_pwa TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA todo_pwa TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA todo_pwa TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA todo_pwa
  GRANT ALL ON TABLES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA todo_pwa
  GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;

CREATE TABLE IF NOT EXISTS todo_pwa.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  notes TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_open_idx
  ON todo_pwa.tasks (is_done, created_at DESC);

CREATE INDEX IF NOT EXISTS tasks_completed_idx
  ON todo_pwa.tasks (completed_at DESC)
  WHERE completed_at IS NOT NULL;

ALTER TABLE todo_pwa.tasks ENABLE ROW LEVEL SECURITY;

-- Personal single-tenant: no auth — anon/authenticated can read/write.
-- Anyone with the deploy URL + publishable key can access these rows.
DROP POLICY IF EXISTS todo_pwa_tasks_all_anon ON todo_pwa.tasks;
CREATE POLICY todo_pwa_tasks_all_anon ON todo_pwa.tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS todo_pwa_tasks_all_auth ON todo_pwa.tasks;
CREATE POLICY todo_pwa_tasks_all_auth ON todo_pwa.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
