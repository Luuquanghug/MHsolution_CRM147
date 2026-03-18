-- Migration to change sales_funnel.stage from enum to text with foreign key reference

-- Step 1: Add temporary stage_key column
ALTER TABLE sales_funnel ADD COLUMN stage_key TEXT;

-- Step 2: Update the new column with existing stage values
UPDATE sales_funnel SET stage_key = stage::text;

-- Step 3: Drop the old enum column
ALTER TABLE sales_funnel DROP COLUMN stage;

-- Step 4: Rename stage_key to stage
ALTER TABLE sales_funnel RENAME COLUMN stage_key TO stage;

-- Step 5: Set NOT NULL constraint and default value
ALTER TABLE sales_funnel ALTER COLUMN stage SET NOT NULL;
ALTER TABLE sales_funnel ALTER COLUMN stage SET DEFAULT 'prospect';

-- Step 6: Add foreign key constraint to sales_funnel_stages
ALTER TABLE sales_funnel 
ADD CONSTRAINT fk_sales_funnel_stage 
FOREIGN KEY (stage) REFERENCES sales_funnel_stages(stage_key);