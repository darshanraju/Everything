-- Cardio support: exercise kind + duration/distance on session sets & program targets
-- Adds Running as a seeded exercise.

ALTER TABLE life_hub.exercises
  ADD COLUMN IF NOT EXISTS exercise_kind TEXT NOT NULL DEFAULT 'strength'
  CHECK (exercise_kind IN ('strength', 'cardio'));

ALTER TABLE life_hub.session_sets
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8, 3);

ALTER TABLE life_hub.program_exercises
  ADD COLUMN IF NOT EXISTS target_duration_min NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS target_distance_km NUMERIC(8, 3);

COMMENT ON COLUMN life_hub.exercises.exercise_kind IS 'strength = sets/reps/weight; cardio = duration + distance';
COMMENT ON COLUMN life_hub.session_sets.duration_seconds IS 'Cardio: logged duration in seconds';
COMMENT ON COLUMN life_hub.session_sets.distance_km IS 'Cardio: logged distance in kilometres';

-- Seed Running
INSERT INTO life_hub.exercises (name, muscle_group, is_custom, exercise_kind)
SELECT 'Running', 'full_body', false, 'cardio'
WHERE NOT EXISTS (
  SELECT 1 FROM life_hub.exercises e WHERE lower(e.name) = lower('Running')
);

-- Ensure existing Running row (if any) is cardio
UPDATE life_hub.exercises
SET exercise_kind = 'cardio', muscle_group = COALESCE(muscle_group, 'full_body')
WHERE lower(name) = lower('Running');
