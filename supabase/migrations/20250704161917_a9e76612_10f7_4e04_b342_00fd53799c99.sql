-- Add logo_url field to organizations table
ALTER TABLE public.organizations 
ADD COLUMN logo_url TEXT;