-- Remove next_contact_date and next_contact_objective columns from key_personnel table
ALTER TABLE public.key_personnel 
DROP COLUMN IF EXISTS next_contact_date,
DROP COLUMN IF EXISTS next_contact_objective;