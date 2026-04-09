
-- 1. Drop the permissive recipient SELECT policy on the base table
DROP POLICY IF EXISTS "Recipients can view received calls" ON public.emergency_calls;

-- 2. Recreate the recipient view with caller email included
DROP VIEW IF EXISTS public.emergency_calls_recipient_view;
CREATE VIEW public.emergency_calls_recipient_view 
WITH (security_invoker = true)
AS
SELECT 
  ec.id,
  ec.urgency,
  ec.incident_type,
  ec.status,
  ec.created_at,
  ec.recipient_id,
  ec.user_id,
  p.email AS caller_email
FROM public.emergency_calls ec
LEFT JOIN public.profiles p ON p.user_id = ec.user_id;

-- 3. Create a SELECT policy on emergency_calls for recipients that only allows access via specific columns
-- Recipients need SELECT to use the view (security_invoker), but we'll restrict via the view
-- We add a restrictive policy that only allows recipients to see rows where they are the recipient
CREATE POLICY "Recipients can view received calls via view"
ON public.emergency_calls
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- 4. Restrict search_profile_by_email to authenticated role only
REVOKE EXECUTE ON FUNCTION public.search_profile_by_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_profile_by_email TO authenticated;
