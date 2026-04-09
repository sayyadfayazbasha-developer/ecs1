-- Allow authenticated users to search profiles by email (for adding contacts)
CREATE POLICY "Authenticated users can search profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);