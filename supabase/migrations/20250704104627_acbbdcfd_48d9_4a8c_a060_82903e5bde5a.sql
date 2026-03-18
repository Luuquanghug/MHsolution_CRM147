-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_person');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update organizations RLS policies
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can manage organizations" ON public.organizations;

CREATE POLICY "Admins can view all organizations"
ON public.organizations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales persons can view assigned organizations"
ON public.organizations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'sales_person') AND 
  assigned_sales_person_id = auth.uid()
);

CREATE POLICY "Admins can manage all organizations"
ON public.organizations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales persons can update assigned organizations"
ON public.organizations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'sales_person') AND 
  assigned_sales_person_id = auth.uid()
);

-- Update key_personnel RLS policies
DROP POLICY IF EXISTS "Authenticated users can view key personnel" ON public.key_personnel;
DROP POLICY IF EXISTS "Authenticated users can manage key personnel" ON public.key_personnel;

CREATE POLICY "Admins can view all key personnel"
ON public.key_personnel
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales persons can view key personnel from assigned organizations"
ON public.key_personnel
FOR SELECT
USING (
  public.has_role(auth.uid(), 'sales_person') AND 
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE assigned_sales_person_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all key personnel"
ON public.key_personnel
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales persons can insert key personnel from assigned organizations"
ON public.key_personnel
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'sales_person') AND 
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE assigned_sales_person_id = auth.uid()
  )
);

CREATE POLICY "Sales persons can update key personnel from assigned organizations"
ON public.key_personnel
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'sales_person') AND 
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE assigned_sales_person_id = auth.uid()
  )
);

CREATE POLICY "Sales persons can delete key personnel from assigned organizations"
ON public.key_personnel
FOR DELETE
USING (
  public.has_role(auth.uid(), 'sales_person') AND 
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE assigned_sales_person_id = auth.uid()
  )
);

-- Update products and categories RLS policies to admin only
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;

CREATE POLICY "All authenticated users can view products"
ON public.products
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view categories"
ON public.categories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Set hunglm@mhsolution.vn as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'hunglm@mhsolution.vn'
ON CONFLICT (user_id, role) DO NOTHING;

-- Set all other users as sales_person by default
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales_person'::app_role
FROM auth.users
WHERE email != 'hunglm@mhsolution.vn'
ON CONFLICT (user_id, role) DO NOTHING;