-- Weekdays for weekly / custom protocol schedules (0=Mon … 6=Sun)

ALTER TABLE life_hub.peptide_protocols
  ADD COLUMN IF NOT EXISTS schedule_weekdays SMALLINT[] DEFAULT NULL;

COMMENT ON COLUMN life_hub.peptide_protocols.schedule_weekdays IS
  'Weekdays 0=Mon…6=Sun for frequency weekly/custom; null/empty = no day filter (show every day)';
