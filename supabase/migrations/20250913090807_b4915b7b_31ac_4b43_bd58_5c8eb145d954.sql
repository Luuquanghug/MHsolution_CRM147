-- Create table to store multiple sales persons for each contact history
CREATE TABLE public.contact_history_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_history_id UUID NOT NULL,
  sales_person_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_history_id, sales_person_id)
);

-- Enable RLS
ALTER TABLE public.contact_history_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_history_participants
CREATE POLICY "Authenticated users can view contact history participants" 
ON public.contact_history_participants 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage contact history participants" 
ON public.contact_history_participants 
FOR ALL 
USING (auth.role() = 'authenticated'::text);