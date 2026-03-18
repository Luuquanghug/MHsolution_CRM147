-- Create organization groups table
CREATE TABLE public.organization_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for organization-group relationships
CREATE TABLE public.organization_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  group_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, group_id)
);

-- Enable RLS
ALTER TABLE public.organization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_group_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_groups
CREATE POLICY "All authenticated users can view organization groups"
ON public.organization_groups 
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can manage organization groups"
ON public.organization_groups 
FOR ALL
USING (auth.role() = 'authenticated'::text);

-- Create policies for organization_group_memberships
CREATE POLICY "All authenticated users can view organization group memberships"
ON public.organization_group_memberships 
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can manage organization group memberships"
ON public.organization_group_memberships 
FOR ALL
USING (auth.role() = 'authenticated'::text);

-- Add foreign key constraints
ALTER TABLE public.organization_group_memberships
ADD CONSTRAINT fk_organization_group_memberships_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_group_memberships
ADD CONSTRAINT fk_organization_group_memberships_group_id
FOREIGN KEY (group_id) REFERENCES public.organization_groups(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_organization_groups_updated_at
BEFORE UPDATE ON public.organization_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();