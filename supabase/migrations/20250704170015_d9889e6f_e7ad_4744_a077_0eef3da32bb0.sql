-- Fix RLS policies for sales_funnel to allow sales persons to see opportunities correctly
DROP POLICY IF EXISTS "Sales persons can view assigned sales funnel" ON public.sales_funnel;
DROP POLICY IF EXISTS "Sales persons can manage assigned sales funnel" ON public.sales_funnel;

-- Sales persons can view sales funnel entries for organizations assigned to them OR entries assigned directly to them
CREATE POLICY "Sales persons can view assigned sales funnel" 
ON public.sales_funnel
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_roles = 'sales_person'
  ) 
  AND (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = sales_funnel.organization_id 
      AND organizations.assigned_sales_person_id = auth.uid()
    )
    OR sales_funnel.assigned_sales_person_id = auth.uid()
  )
  AND is_deleted = false
);

-- Sales persons can update sales funnel entries for organizations assigned to them OR entries assigned directly to them  
CREATE POLICY "Sales persons can manage assigned sales funnel" 
ON public.sales_funnel
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles  
    WHERE profiles.id = auth.uid() 
    AND profiles.user_roles = 'sales_person'
  )
  AND (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = sales_funnel.organization_id 
      AND organizations.assigned_sales_person_id = auth.uid()
    )
    OR sales_funnel.assigned_sales_person_id = auth.uid()
  )
  AND is_deleted = false
);