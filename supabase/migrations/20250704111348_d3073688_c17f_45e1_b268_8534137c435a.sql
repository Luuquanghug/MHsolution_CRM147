-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create simple policies that don't cause recursion
CREATE POLICY "All authenticated users can view user roles"
ON public.user_roles
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'authenticated');