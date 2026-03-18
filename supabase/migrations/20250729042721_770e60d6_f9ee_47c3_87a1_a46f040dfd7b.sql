-- Add expected implementation and acceptance dates to sales_funnel table
ALTER TABLE public.sales_funnel 
ADD COLUMN expected_implementation_date DATE,
ADD COLUMN expected_acceptance_date DATE;

-- Add corresponding old/new columns to sales_funnel_updates table
ALTER TABLE public.sales_funnel_updates
ADD COLUMN old_expected_implementation_date DATE,
ADD COLUMN new_expected_implementation_date DATE,
ADD COLUMN old_expected_acceptance_date DATE,
ADD COLUMN new_expected_acceptance_date DATE;

-- Update the log_sales_funnel_update function to track changes to the new date fields
CREATE OR REPLACE FUNCTION public.log_sales_funnel_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only log if there are actual changes
  IF OLD.stage != NEW.stage OR
     OLD.negotiated_price IS DISTINCT FROM NEW.negotiated_price OR
     OLD.assigned_sales_person_id IS DISTINCT FROM NEW.assigned_sales_person_id OR
     OLD.notes IS DISTINCT FROM NEW.notes OR
     OLD.expected_implementation_date IS DISTINCT FROM NEW.expected_implementation_date OR
     OLD.expected_acceptance_date IS DISTINCT FROM NEW.expected_acceptance_date THEN
    
    INSERT INTO public.sales_funnel_updates (
      sales_funnel_id,
      updated_by,
      update_reason,
      old_stage,
      new_stage,
      old_negotiated_price,
      new_negotiated_price,
      old_assigned_sales_person_id,
      new_assigned_sales_person_id,
      old_notes,
      new_notes,
      old_expected_implementation_date,
      new_expected_implementation_date,
      old_expected_acceptance_date,
      new_expected_acceptance_date
    ) VALUES (
      NEW.id,
      auth.uid(),
      current_setting('app.update_reason', true),
      OLD.stage,
      NEW.stage,
      OLD.negotiated_price,
      NEW.negotiated_price,
      OLD.assigned_sales_person_id,
      NEW.assigned_sales_person_id,
      OLD.notes,
      NEW.notes,
      OLD.expected_implementation_date,
      NEW.expected_implementation_date,
      OLD.expected_acceptance_date,
      NEW.expected_acceptance_date
    );

    -- Clear the session variable after use
    PERFORM set_config('app.update_reason', '', true);
  END IF;
  
  RETURN NEW;
END;
$function$;