-- Update RLS policies for sales_funnel to be role-based
DROP POLICY IF EXISTS "All authenticated users can view sales funnel" ON public.sales_funnel;
DROP POLICY IF EXISTS "All authenticated users can manage sales funnel" ON public.sales_funnel;

-- Admins can view all sales funnel items
CREATE POLICY "Admins can view all sales funnel"
ON public.sales_funnel
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_roles = 'admin'
  )
);

-- Sales persons can view sales funnel for assigned organizations  
CREATE POLICY "Sales persons can view assigned sales funnel"
ON public.sales_funnel
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_roles = 'sales_person'
  ) AND
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id AND assigned_sales_person_id = auth.uid()
  )
);

-- Admins can manage all sales funnel items
CREATE POLICY "Admins can manage all sales funnel"
ON public.sales_funnel
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_roles = 'admin'
  )
);

-- Sales persons can manage sales funnel for assigned organizations
CREATE POLICY "Sales persons can manage assigned sales funnel"
ON public.sales_funnel
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_roles = 'sales_person'
  ) AND
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id AND assigned_sales_person_id = auth.uid()
  )
);

-- Create sales_funnel_stages table for admin-configurable stages
CREATE TABLE public.sales_funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_key TEXT NOT NULL UNIQUE,
  stage_label TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  stage_color TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_funnel_stages ENABLE ROW LEVEL SECURITY;

-- Everyone can view stages
CREATE POLICY "All authenticated users can view sales funnel stages" 
ON public.sales_funnel_stages 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Only admins can manage stages
CREATE POLICY "Admins can manage sales funnel stages" 
ON public.sales_funnel_stages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_roles = 'admin'
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sales_funnel_stages_updated_at
BEFORE UPDATE ON public.sales_funnel_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stages
INSERT INTO public.sales_funnel_stages (stage_key, stage_label, stage_order, stage_color) VALUES
('prospect', 'Tiềm năng', 1, 'secondary'),
('qualified', 'Đủ điều kiện', 2, 'default'),
('proposal', 'Đề xuất', 3, 'default'),
('negotiation', 'Thương thảo', 4, 'default'),
('closed_won', 'Thành công', 5, 'default'),
('closed_lost', 'Thất bại', 6, 'destructive');