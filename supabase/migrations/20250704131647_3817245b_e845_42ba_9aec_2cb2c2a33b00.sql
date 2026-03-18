-- Remove the unique constraint that prevents multiple sales funnel entries for same organization-product pair
ALTER TABLE public.sales_funnel DROP CONSTRAINT IF EXISTS sales_funnel_organization_id_product_id_key;

-- Add foreign key constraints for better data integrity
ALTER TABLE public.sales_funnel 
ADD CONSTRAINT sales_funnel_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.sales_funnel 
ADD CONSTRAINT sales_funnel_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.sales_funnel 
ADD CONSTRAINT sales_funnel_assigned_sales_person_id_fkey 
FOREIGN KEY (assigned_sales_person_id) REFERENCES public.profiles(id) ON DELETE SET NULL;