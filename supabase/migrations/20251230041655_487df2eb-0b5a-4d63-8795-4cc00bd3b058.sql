-- Add user_id column to emergency_calls to track ownership
ALTER TABLE public.emergency_calls 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to allow users to manage their own calls
DROP POLICY IF EXISTS "Authenticated users can insert emergency calls" ON public.emergency_calls;
DROP POLICY IF EXISTS "Authenticated users can view emergency calls" ON public.emergency_calls;

-- Users can view all emergency calls (for dashboard)
CREATE POLICY "Users can view all emergency calls"
ON public.emergency_calls
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert their own emergency calls
CREATE POLICY "Users can insert own emergency calls"
ON public.emergency_calls
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own emergency calls
CREATE POLICY "Users can update own emergency calls"
ON public.emergency_calls
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own emergency calls
CREATE POLICY "Users can delete own emergency calls"
ON public.emergency_calls
FOR DELETE
USING (auth.uid() = user_id);