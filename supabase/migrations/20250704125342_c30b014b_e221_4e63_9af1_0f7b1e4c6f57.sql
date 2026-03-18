-- Remove price column from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS price;

-- Create sales funnel table to track organization-product relationships
CREATE TABLE public.sales_funnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  product_id UUID NOT NULL,
  stage sales_stage NOT NULL DEFAULT 'prospect',
  negotiated_price NUMERIC,
  notes TEXT,
  assigned_sales_person_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.sales_funnel ENABLE ROW LEVEL SECURITY;

-- Create policies for sales funnel
CREATE POLICY "All authenticated users can view sales funnel" 
ON public.sales_funnel 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can manage sales funnel" 
ON public.sales_funnel 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sales_funnel_updated_at
BEFORE UPDATE ON public.sales_funnel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();