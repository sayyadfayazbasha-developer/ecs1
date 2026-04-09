-- Add recipient_id to emergency_calls to track who the call is directed to
ALTER TABLE public.emergency_calls 
ADD COLUMN recipient_id uuid REFERENCES auth.users(id);

-- Add contact_user_id to emergency_contacts to link contacts to registered users
ALTER TABLE public.emergency_contacts 
ADD COLUMN contact_user_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_emergency_calls_recipient_id ON public.emergency_calls(recipient_id);
CREATE INDEX idx_emergency_contacts_contact_user_id ON public.emergency_contacts(contact_user_id);

-- Update RLS policy to allow users to view calls where they are the recipient
DROP POLICY IF EXISTS "Users can view all emergency calls" ON public.emergency_calls;

CREATE POLICY "Users can view own or received calls" 
ON public.emergency_calls 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = recipient_id);