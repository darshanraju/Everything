-- Add missing seed exercises (if not already present)

INSERT INTO life_hub.exercises (name, muscle_group, is_custom)
SELECT 'Tricep Extension', 'arms', false
WHERE NOT EXISTS (
  SELECT 1 FROM life_hub.exercises e
  WHERE lower(e.name) = lower('Tricep Extension')
);

INSERT INTO life_hub.exercises (name, muscle_group, is_custom)
SELECT 'Dumbbell Chest Fly', 'chest', false
WHERE NOT EXISTS (
  SELECT 1 FROM life_hub.exercises e
  WHERE lower(e.name) = lower('Dumbbell Chest Fly')
);

INSERT INTO life_hub.exercises (name, muscle_group, is_custom)
SELECT 'Dumbbell Chest Press', 'chest', false
WHERE NOT EXISTS (
  SELECT 1 FROM life_hub.exercises e
  WHERE lower(e.name) = lower('Dumbbell Chest Press')
);
