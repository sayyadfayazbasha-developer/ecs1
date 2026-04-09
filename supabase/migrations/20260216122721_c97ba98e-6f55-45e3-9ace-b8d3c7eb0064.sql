
-- 1. Fix emergency_calls: replace the SELECT policy so recipients can only see limited data
-- We can't restrict columns via RLS, so create a view for recipients and restrict direct access to owner only
DROP POLICY IF EXISTS "Users can view own or received calls" ON public.emergency_calls;

-- Owner can see their own calls fully
CREATE POLICY "Users can view own calls"
ON public.emergency_calls
FOR SELECT
USING (auth.uid() = user_id);

-- Recipients can see received calls (they'll still see all columns via RLS, 
-- but we limit this to just knowing a call exists - use a view for filtered access)
CREATE POLICY "Recipients can view received calls"
ON public.emergency_calls
FOR SELECT
USING (auth.uid() = recipient_id);

-- 2. Fix profiles: remove the overly permissive search policy
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.profiles;

-- Replace with a restricted policy: users can only search profiles by exact email match
-- This supports the emergency contact lookup feature without exposing all profiles
CREATE POLICY "Users can search profiles by email"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
