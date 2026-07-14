-- Shared links inbox (OS share target + manual add)

CREATE TABLE IF NOT EXISTS life_hub.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL CHECK (char_length(trim(url)) > 0),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  tag TEXT NOT NULL DEFAULT 'other',
  share_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_links_created_idx
  ON life_hub.shared_links (created_at DESC);

CREATE INDEX IF NOT EXISTS shared_links_tag_idx
  ON life_hub.shared_links (tag);

ALTER TABLE life_hub.shared_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_hub_shared_links_anon ON life_hub.shared_links;
CREATE POLICY life_hub_shared_links_anon ON life_hub.shared_links
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS life_hub_shared_links_auth ON life_hub.shared_links;
CREATE POLICY life_hub_shared_links_auth ON life_hub.shared_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON life_hub.shared_links TO anon, authenticated, service_role;
