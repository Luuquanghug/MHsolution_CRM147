-- Add sales_opportunity_id column to contact_history table
ALTER TABLE public.contact_history 
ADD COLUMN sales_opportunity_id uuid REFERENCES public.sales_funnel(id);

-- Create index for better performance
CREATE INDEX idx_contact_history_sales_opportunity_id ON public.contact_history(sales_opportunity_id);