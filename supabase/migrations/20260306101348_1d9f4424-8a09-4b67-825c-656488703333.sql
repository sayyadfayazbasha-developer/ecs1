
-- Allow recipients to update status on calls they received
CREATE POLICY "Recipients can update received call status"
ON public.emergency_calls
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
