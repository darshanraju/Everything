-- Manual tasks for the modular Today tab

CREATE TABLE IF NOT EXISTS life_hub.today_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  notes TEXT,
  due_on DATE NOT NULL DEFAULT CURRENT_DATE,
  is_done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS today_tasks_due_idx
  ON life_hub.today_tasks (due_on, is_done, created_at DESC);

ALTER TABLE life_hub.today_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_today_tasks_anon ON life_hub.today_tasks;
CREATE POLICY life_hub_today_tasks_anon ON life_hub.today_tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_today_tasks_auth ON life_hub.today_tasks;
CREATE POLICY life_hub_today_tasks_auth ON life_hub.today_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.today_tasks TO anon, authenticated, service_role;
