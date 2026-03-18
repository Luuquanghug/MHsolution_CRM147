-- Add detailed description field to sales_funnel_stages table
ALTER TABLE public.sales_funnel_stages 
ADD COLUMN stage_description TEXT;