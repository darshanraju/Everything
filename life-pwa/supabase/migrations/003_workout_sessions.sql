-- Live workout logging + history (Phase 1)
-- Schema: life_hub

CREATE TABLE IF NOT EXISTS life_hub.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES life_hub.programs(id) ON DELETE SET NULL,
  name TEXT, -- snapshot label e.g. program name or "Empty workout"
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_sessions_started_idx
  ON life_hub.workout_sessions (started_at DESC);

CREATE TABLE IF NOT EXISTS life_hub.session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES life_hub.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES life_hub.exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL DEFAULT 1,
  weight_kg NUMERIC(6, 2),
  reps INT,
  rpe NUMERIC(3, 1),
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_sets_session_idx
  ON life_hub.session_sets (session_id, exercise_id, set_index);

CREATE INDEX IF NOT EXISTS session_sets_exercise_history_idx
  ON life_hub.session_sets (exercise_id, created_at DESC);

-- RLS open personal (same as other life_hub tables)
ALTER TABLE life_hub.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_hub.session_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_workout_sessions_anon ON life_hub.workout_sessions;
CREATE POLICY life_hub_workout_sessions_anon ON life_hub.workout_sessions
  FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS life_hub_workout_sessions_auth ON life_hub.workout_sessions;
CREATE POLICY life_hub_workout_sessions_auth ON life_hub.workout_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_session_sets_anon ON life_hub.session_sets;
CREATE POLICY life_hub_session_sets_anon ON life_hub.session_sets
  FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS life_hub_session_sets_auth ON life_hub.session_sets;
CREATE POLICY life_hub_session_sets_auth ON life_hub.session_sets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.workout_sessions TO anon, authenticated, service_role;
GRANT ALL ON life_hub.session_sets TO anon, authenticated, service_role;
