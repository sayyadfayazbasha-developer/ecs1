
-- Recreate the view with security_invoker = true to enforce RLS
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
