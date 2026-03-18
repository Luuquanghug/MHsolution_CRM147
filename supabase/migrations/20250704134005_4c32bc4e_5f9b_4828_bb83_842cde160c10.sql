-- Update the log_sales_funnel_update function to accept update_reason parameter
-- We need to modify the trigger to accept update_reason from a session variable

-- Create a function to set update reason in session
CREATE OR REPLACE FUNCTION public.set_update_reason(reason TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.update_reason', reason, true);
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to use the session variable
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
      update_reason,
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
      current_setting('app.update_reason', true),
      OLD.stage,
      NEW.stage,
      OLD.negotiated_price,
      NEW.negotiated_price,
      OLD.assigned_sales_person_id,
      NEW.assigned_sales_person_id,
      OLD.notes,
      NEW.notes
    );

    -- Clear the session variable after use
    PERFORM set_config('app.update_reason', '', true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;