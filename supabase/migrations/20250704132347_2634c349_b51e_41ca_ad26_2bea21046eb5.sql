-- Allow sales persons to create sales funnel entries for organizations they can access
DROP POLICY IF EXISTS "Sales persons can manage assigned sales funnel" ON public.sales_funnel;

-- Sales persons can manage sales funnel for organizations they are assigned to
CREATE POLICY "Sales persons can manage assigned sales funnel"
ON public.sales_funnel
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_roles = 'sales_person'
  ) 
  AND EXISTS (
    SELECT 1 FROM organizations 
    WHERE organizations.id = sales_funnel.organization_id 
    AND organizations.assigned_sales_person_id = auth.uid()
  )
);

-- Sales persons can create sales funnel entries for any organization they can access
CREATE POLICY "Sales persons can create sales funnel"
ON public.sales_funnel
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_roles = 'sales_person'
  )
);