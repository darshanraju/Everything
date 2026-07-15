-- Allow logging the same food multiple times per day (e.g. same meal twice)

ALTER TABLE life_hub.food_logs
  DROP CONSTRAINT IF EXISTS food_logs_food_id_logged_on_key;

-- Helpful for "remove one serving" and listing by day
CREATE INDEX IF NOT EXISTS food_logs_food_day_idx
  ON life_hub.food_logs (food_id, logged_on, created_at DESC);
