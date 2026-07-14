-- Add syringe draw units for peptide protocols (1 ml / U-100 syringe)
-- Run if you already applied 001_life_hub.sql without this column.

ALTER TABLE life_hub.peptide_protocols
  ADD COLUMN IF NOT EXISTS syringe_units NUMERIC(6, 2);

COMMENT ON COLUMN life_hub.peptide_protocols.syringe_units IS
  'Units to pull on a 1 ml U-100 insulin syringe (100 units = 1 ml)';
