-- Life app schema (shared Supabase project — not public)
-- Follows agents.md. Expose schema `life_hub` in API settings after running.

CREATE SCHEMA IF NOT EXISTS life_hub;

GRANT USAGE ON SCHEMA life_hub TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA life_hub TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA life_hub TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA life_hub
  GRANT ALL ON TABLES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA life_hub
  GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;

-- ─── Fitness ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS life_hub.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  exercise_kind TEXT NOT NULL DEFAULT 'strength'
    CHECK (exercise_kind IN ('strength', 'cardio')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exercises_name_lower_idx
  ON life_hub.exercises (lower(name));

CREATE TABLE IF NOT EXISTS life_hub.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_hub.program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES life_hub.programs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES life_hub.exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-10',
  target_weight_kg NUMERIC(6, 2)
);

CREATE INDEX IF NOT EXISTS program_exercises_program_idx
  ON life_hub.program_exercises (program_id, sort_order);

-- weekday: 0 = Monday … 6 = Sunday
CREATE TABLE IF NOT EXISTS life_hub.weekly_plan (
  weekday SMALLINT PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  program_id UUID REFERENCES life_hub.programs(id) ON DELETE SET NULL,
  is_rest BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS life_hub.body_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weighed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (weighed_on)
);

-- ─── Health / peptides ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS life_hub.peptide_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC(10, 3) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mcg',
  -- Units to draw on a 1 ml U-100 insulin syringe (1 ml = 100 units)
  syringe_units NUMERIC(6, 2),
  frequency TEXT NOT NULL DEFAULT 'daily',
  frequency_note TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_hub.peptide_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES life_hub.peptide_protocols(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount NUMERIC(10, 3),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS peptide_logs_protocol_idx
  ON life_hub.peptide_logs (protocol_id, taken_at DESC);

-- RLS open for personal single-tenant (same pattern as todo_pwa)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'exercises', 'programs', 'program_exercises', 'weekly_plan',
    'body_weights', 'peptide_protocols', 'peptide_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE life_hub.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS life_hub_%I_anon ON life_hub.%I', t, t);
    EXECUTE format(
      'CREATE POLICY life_hub_%I_anon ON life_hub.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS life_hub_%I_auth ON life_hub.%I', t, t);
    EXECUTE format(
      'CREATE POLICY life_hub_%I_auth ON life_hub.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- Seed default rest week
INSERT INTO life_hub.weekly_plan (weekday, program_id, is_rest)
SELECT g, NULL, true
FROM generate_series(0, 6) AS g
ON CONFLICT (weekday) DO NOTHING;

-- Seed common exercises (skip if name already exists)
INSERT INTO life_hub.exercises (name, muscle_group, is_custom)
SELECT v.name, v.muscle_group, false
FROM (VALUES
  ('Barbell Bench Press', 'chest'),
  ('Dumbbell Chest Press', 'chest'),
  ('Incline Dumbbell Press', 'chest'),
  ('Cable Fly', 'chest'),
  ('Dumbbell Chest Fly', 'chest'),
  ('Push-Up', 'chest'),
  ('Barbell Back Squat', 'legs'),
  ('Front Squat', 'legs'),
  ('Romanian Deadlift', 'legs'),
  ('Leg Press', 'legs'),
  ('Walking Lunge', 'legs'),
  ('Leg Curl', 'legs'),
  ('Leg Extension', 'legs'),
  ('Calf Raise', 'legs'),
  ('Conventional Deadlift', 'back'),
  ('Barbell Row', 'back'),
  ('Lat Pulldown', 'back'),
  ('Pull-Up', 'back'),
  ('Seated Cable Row', 'back'),
  ('Face Pull', 'back'),
  ('Overhead Press', 'shoulders'),
  ('Dumbbell Lateral Raise', 'shoulders'),
  ('Rear Delt Fly', 'shoulders'),
  ('Barbell Curl', 'arms'),
  ('Dumbbell Curl', 'arms'),
  ('Tricep Pushdown', 'arms'),
  ('Tricep Extension', 'arms'),
  ('Skull Crusher', 'arms'),
  ('Close-Grip Bench Press', 'arms'),
  ('Plank', 'core'),
  ('Hanging Leg Raise', 'core'),
  ('Cable Crunch', 'core'),
  ('Hip Thrust', 'legs'),
  ('Bulgarian Split Squat', 'legs'),
  ('Dumbbell Shoulder Press', 'shoulders'),
  ('Chest-Supported Row', 'back'),
  ('Pec Deck', 'chest'),
  ('Hack Squat', 'legs'),
  ('Good Morning', 'legs'),
  ('Farmer Carry', 'full_body'),
  ('Kettlebell Swing', 'full_body'),
  ('Trap Bar Deadlift', 'legs'),
  ('Arnold Press', 'shoulders'),
  ('Running', 'full_body')
) AS v(name, muscle_group)
WHERE NOT EXISTS (
  SELECT 1 FROM life_hub.exercises e WHERE lower(e.name) = lower(v.name)
);

UPDATE life_hub.exercises
SET exercise_kind = 'cardio'
WHERE lower(name) = lower('Running');
