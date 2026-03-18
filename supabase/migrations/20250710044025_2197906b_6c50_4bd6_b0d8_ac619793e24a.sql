-- Add organization_chart_url field to organizations table
ALTER TABLE public.organizations
ADD COLUMN organization_chart_url TEXT;

-- Create organization_relationships table for parent-child and linked relationships
CREATE TABLE public.organization_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_organization_id UUID NOT NULL,
  child_organization_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('child', 'linked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_organization_id, child_organization_id, relationship_type)
);

-- Enable Row Level Security
ALTER TABLE public.organization_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_relationships
CREATE POLICY "All authenticated users can view organization relationships" 
ON public.organization_relationships 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can manage organization relationships" 
ON public.organization_relationships 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Add foreign key constraints
ALTER TABLE public.organization_relationships
ADD CONSTRAINT fk_parent_organization
FOREIGN KEY (parent_organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_relationships
ADD CONSTRAINT fk_child_organization
FOREIGN KEY (child_organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organization_relationships_updated_at
BEFORE UPDATE ON public.organization_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();