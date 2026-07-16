-- Carry stubs: historical incomplete rows left behind when a task rolls to a new day.
-- Stubs count toward SLA for the original due_on but never appear on Today and never roll again.

ALTER TABLE life_hub.today_tasks
  ADD COLUMN IF NOT EXISTS is_carry_stub BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS today_tasks_active_due_idx
  ON life_hub.today_tasks (due_on, is_done, is_carry_stub)
  WHERE is_carry_stub = false;
