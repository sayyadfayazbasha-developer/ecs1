-- Add is_primary flag to user_roles to mark the main/super admin
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Create function to check if user is the primary admin
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
      AND is_primary = true
  )
$$;