-- Generalize health protocols beyond peptides (meds, skincare, supplements, etc.)

ALTER TABLE life_hub.peptide_protocols
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'peptide';

-- Constrain categories (drop old check if re-run safely)
DO $$
BEGIN
  ALTER TABLE life_hub.peptide_protocols
    DROP CONSTRAINT IF EXISTS peptide_protocols_category_check;
  ALTER TABLE life_hub.peptide_protocols
    ADD CONSTRAINT peptide_protocols_category_check
    CHECK (category IN ('peptide', 'medicine', 'skincare', 'supplement', 'other'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Allow protocols without a numeric dose (e.g. shampoo "as directed")
ALTER TABLE life_hub.peptide_protocols
  ALTER COLUMN amount DROP NOT NULL;

COMMENT ON COLUMN life_hub.peptide_protocols.category IS
  'peptide | medicine | skincare | supplement | other';
