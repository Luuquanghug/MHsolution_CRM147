-- Create sales funnel update history table
CREATE TABLE public.sales_funnel_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_funnel_id UUID NOT NULL,
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  update_reason TEXT,
  old_stage TEXT,
  new_stage TEXT,
  old_negotiated_price NUMERIC,
  new_negotiated_price NUMERIC,
  old_assigned_sales_person_id UUID,
  new_assigned_sales_person_id UUID,
  old_notes TEXT,
  new_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales_funnel_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for sales funnel updates
CREATE POLICY "All authenticated users can view sales funnel updates"
ON public.sales_funnel_updates
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can create sales funnel updates"
ON public.sales_funnel_updates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = updated_by);

-- Create function to log sales funnel updates
CREATE OR REPLACE FUNCTION public.log_sales_funnel_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if there are actual changes
  IF OLD.stage != NEW.stage OR
     OLD.negotiated_price IS DISTINCT FROM NEW.negotiated_price OR
     OLD.assigned_sales_person_id IS DISTINCT FROM NEW.assigned_sales_person_id OR
     OLD.notes IS DISTINCT FROM NEW.notes THEN
    
    INSERT INTO public.sales_funnel_updates (
      sales_funnel_id,
      updated_by,
      old_stage,
      new_stage,
      old_negotiated_price,
      new_negotiated_price,
      old_assigned_sales_person_id,
      new_assigned_sales_person_id,
      old_notes,
      new_notes
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.stage,
      NEW.stage,
      OLD.negotiated_price,
      NEW.negotiated_price,
      OLD.assigned_sales_person_id,
      NEW.assigned_sales_person_id,
      OLD.notes,
      NEW.notes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic logging
CREATE TRIGGER log_sales_funnel_update_trigger
  AFTER UPDATE ON public.sales_funnel
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sales_funnel_update();

-- Add foreign key constraints
ALTER TABLE public.sales_funnel_updates
ADD CONSTRAINT sales_funnel_updates_sales_funnel_id_fkey
FOREIGN KEY (sales_funnel_id) REFERENCES public.sales_funnel(id) ON DELETE CASCADE;

ALTER TABLE public.sales_funnel_updates
ADD CONSTRAINT sales_funnel_updates_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES public.profiles(id);

-- Create index for better performance
CREATE INDEX idx_sales_funnel_updates_sales_funnel_id ON public.sales_funnel_updates(sales_funnel_id);
CREATE INDEX idx_sales_funnel_updates_updated_at ON public.sales_funnel_updates(updated_at DESC);