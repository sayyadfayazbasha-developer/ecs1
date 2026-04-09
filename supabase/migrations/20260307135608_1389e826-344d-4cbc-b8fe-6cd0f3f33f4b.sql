-- Fix: Set the view to use SECURITY INVOKER (caller's permissions)
DROP VIEW IF EXISTS public.emergency_calls_recipient_view;
CREATE VIEW public.emergency_calls_recipient_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  urgency,
  incident_type,
  status,
  created_at,
  recipient_id,
  user_id
FROM public.emergency_calls;

-- Fix: Add a deny-all policy for otp_codes (only service role bypasses RLS)
CREATE POLICY "No direct access to otp_codes"
ON public.otp_codes FOR ALL TO authenticated
USING (false);