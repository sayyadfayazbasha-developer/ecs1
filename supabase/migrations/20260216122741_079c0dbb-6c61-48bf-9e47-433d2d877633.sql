
-- Remove the still-too-permissive policy
DROP POLICY IF EXISTS "Users can search profiles by email" ON public.profiles;

-- Create a security definer function for searching profiles by exact email
-- This avoids exposing all profiles while allowing emergency contact lookup
CREATE OR REPLACE FUNCTION public.search_profile_by_email(_email text)
RETURNS TABLE (user_id uuid, email text, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.email, p.full_name
  FROM public.profiles p
  WHERE p.email = _email;
$$;
