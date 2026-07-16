-- Cron job run history (definitions live in code under modules/crons/)

CREATE TABLE IF NOT EXISTS life_hub.cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'ok', 'error')),
  summary TEXT,
  detail JSONB,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'schedule')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cron_runs_job_started_idx
  ON life_hub.cron_runs (job_id, started_at DESC);

CREATE INDEX IF NOT EXISTS cron_runs_started_idx
  ON life_hub.cron_runs (started_at DESC);

ALTER TABLE life_hub.cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_cron_runs_anon ON life_hub.cron_runs;
CREATE POLICY life_hub_cron_runs_anon ON life_hub.cron_runs
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_cron_runs_auth ON life_hub.cron_runs;
CREATE POLICY life_hub_cron_runs_auth ON life_hub.cron_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.cron_runs TO anon, authenticated, service_role;
