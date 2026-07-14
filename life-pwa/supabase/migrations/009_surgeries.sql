-- Health → Surgery procedures

CREATE TABLE IF NOT EXISTS life_hub.surgeries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'consulting', 'price_found', 'booked', 'completed')),
  cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS surgeries_status_idx
  ON life_hub.surgeries (status);

CREATE INDEX IF NOT EXISTS surgeries_created_idx
  ON life_hub.surgeries (created_at DESC);

ALTER TABLE life_hub.surgeries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_surgeries_anon ON life_hub.surgeries;
CREATE POLICY life_hub_surgeries_anon ON life_hub.surgeries
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_surgeries_auth ON life_hub.surgeries;
CREATE POLICY life_hub_surgeries_auth ON life_hub.surgeries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.surgeries TO anon, authenticated, service_role;
