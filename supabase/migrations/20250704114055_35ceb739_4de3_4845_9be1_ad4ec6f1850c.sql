-- Add user_roles column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_roles app_role DEFAULT 'sales_person'::app_role;

-- Update existing profiles with roles from user_roles table
UPDATE public.profiles 
SET user_roles = ur.role 
FROM public.user_roles ur 
WHERE profiles.id = ur.user_id;

-- Set admin role for hunglm@mhsolution.vn
UPDATE public.profiles 
SET user_roles = 'admin'::app_role 
WHERE email = 'hunglm@mhsolution.vn';

-- Drop the old user_roles table and related functions/policies
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Update RLS policies to use the new user_roles column in profiles
-- Organizations policies
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Sales persons can view assigned organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Sales persons can update assigned organizations" ON public.organizations;

CREATE POLICY "All authenticated users can view organizations"
ON public.organizations
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage organizations"
ON public.organizations
FOR ALL
USING (auth.role() = 'authenticated');

-- Key personnel policies
DROP POLICY IF EXISTS "Admins can view all key personnel" ON public.key_personnel;
DROP POLICY IF EXISTS "Sales persons can view key personnel from assigned organizations" ON public.key_personnel;
DROP POLICY IF EXISTS "Admins can manage all key personnel" ON public.key_personnel;
DROP POLICY IF EXISTS "Sales persons can delete key personnel from assigned organizati" ON public.key_personnel;
DROP POLICY IF EXISTS "Sales persons can insert key personnel for assigned organizatio" ON public.key_personnel;
DROP POLICY IF EXISTS "Sales persons can update key personnel from assigned organizati" ON public.key_personnel;

CREATE POLICY "All authenticated users can view key personnel"
ON public.key_personnel
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage key personnel"
ON public.key_personnel
FOR ALL
USING (auth.role() = 'authenticated');

-- Products policies
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "All authenticated users can manage products"
ON public.products
FOR ALL
USING (auth.role() = 'authenticated');

-- Categories policies  
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "All authenticated users can manage categories"
ON public.categories
FOR ALL
USING (auth.role() = 'authenticated');

-- Update profiles policies to allow viewing all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "All authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage profiles"
ON public.profiles
FOR ALL
USING (auth.role() = 'authenticated');