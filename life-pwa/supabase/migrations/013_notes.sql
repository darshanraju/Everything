-- Personal notepad (feature ideas, etc.)

CREATE TABLE IF NOT EXISTS life_hub.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_updated_idx
  ON life_hub.notes (updated_at DESC);

ALTER TABLE life_hub.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_notes_anon ON life_hub.notes;
CREATE POLICY life_hub_notes_anon ON life_hub.notes
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_notes_auth ON life_hub.notes;
CREATE POLICY life_hub_notes_auth ON life_hub.notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.notes TO anon, authenticated, service_role;
