-- Add is_deleted column to sales_funnel table for soft delete
ALTER TABLE public.sales_funnel 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance when filtering active opportunities
CREATE INDEX idx_sales_funnel_is_deleted ON public.sales_funnel(is_deleted);

-- Update existing RLS policies to exclude deleted opportunities for non-admin users
DROP POLICY IF EXISTS "Sales persons can view assigned sales funnel" ON public.sales_funnel;
DROP POLICY IF EXISTS "Sales persons can manage assigned sales funnel" ON public.sales_funnel;

-- Recreate policies with is_deleted filter for sales persons
CREATE POLICY "Sales persons can view assigned sales funnel" 
ON public.sales_funnel
FOR SELECT
TO authenticated
USING (
  (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_roles = 'sales_person'::app_role)))) 
  AND (EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = sales_funnel.organization_id) AND (organizations.assigned_sales_person_id = auth.uid()))))
  AND is_deleted = false
);

CREATE POLICY "Sales persons can manage assigned sales funnel" 
ON public.sales_funnel
FOR UPDATE
TO authenticated
USING (
  (EXISTS ( SELECT 1
   FROM profiles  
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_roles = 'sales_person'::app_role))))
  AND (EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = sales_funnel.organization_id) AND (organizations.assigned_sales_person_id = auth.uid()))))
  AND is_deleted = false
);

-- Admin can still see and manage all opportunities (including deleted ones)