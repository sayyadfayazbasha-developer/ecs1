-- Add status column to emergency_calls table
ALTER TABLE public.emergency_calls 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'acknowledged', 'resolved'));