-- Health → Food: macro targets, food library, daily check-offs

CREATE TABLE IF NOT EXISTS life_hub.macro_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calories NUMERIC NOT NULL DEFAULT 2000 CHECK (calories >= 0),
  protein_g NUMERIC NOT NULL DEFAULT 150 CHECK (protein_g >= 0),
  carbs_g NUMERIC NOT NULL DEFAULT 200 CHECK (carbs_g >= 0),
  fat_g NUMERIC NOT NULL DEFAULT 60 CHECK (fat_g >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_hub.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  calories NUMERIC NOT NULL DEFAULT 0 CHECK (calories >= 0),
  protein_g NUMERIC NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g NUMERIC NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g NUMERIC NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  notes TEXT,
  on_plan BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foods_on_plan_idx
  ON life_hub.foods (on_plan, sort_order, name);

CREATE TABLE IF NOT EXISTS life_hub.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES life_hub.foods (id) ON DELETE CASCADE,
  logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (food_id, logged_on)
);

CREATE INDEX IF NOT EXISTS food_logs_day_idx
  ON life_hub.food_logs (logged_on);

-- RLS
ALTER TABLE life_hub.macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_hub.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_hub.food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_macro_targets_anon ON life_hub.macro_targets;
CREATE POLICY life_hub_macro_targets_anon ON life_hub.macro_targets
  FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS life_hub_macro_targets_auth ON life_hub.macro_targets;
CREATE POLICY life_hub_macro_targets_auth ON life_hub.macro_targets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_foods_anon ON life_hub.foods;
CREATE POLICY life_hub_foods_anon ON life_hub.foods
  FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS life_hub_foods_auth ON life_hub.foods;
CREATE POLICY life_hub_foods_auth ON life_hub.foods
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_food_logs_anon ON life_hub.food_logs;
CREATE POLICY life_hub_food_logs_anon ON life_hub.food_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS life_hub_food_logs_auth ON life_hub.food_logs;
CREATE POLICY life_hub_food_logs_auth ON life_hub.food_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.macro_targets TO anon, authenticated, service_role;
GRANT ALL ON life_hub.foods TO anon, authenticated, service_role;
GRANT ALL ON life_hub.food_logs TO anon, authenticated, service_role;
