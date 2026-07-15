-- One-off meal macros (not food library) for daily totals

CREATE TABLE IF NOT EXISTS life_hub.adhoc_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_label TEXT NOT NULL CHECK (char_length(trim(meal_label)) > 0),
  protein_g NUMERIC NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g NUMERIC NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g NUMERIC NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  calories NUMERIC NOT NULL DEFAULT 0 CHECK (calories >= 0),
  logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adhoc_meals_day_idx
  ON life_hub.adhoc_meals (logged_on, created_at DESC);

ALTER TABLE life_hub.adhoc_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_adhoc_meals_anon ON life_hub.adhoc_meals;
CREATE POLICY life_hub_adhoc_meals_anon ON life_hub.adhoc_meals
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_adhoc_meals_auth ON life_hub.adhoc_meals;
CREATE POLICY life_hub_adhoc_meals_auth ON life_hub.adhoc_meals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.adhoc_meals TO anon, authenticated, service_role;
