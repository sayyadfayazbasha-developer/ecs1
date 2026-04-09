-- Create emergency_calls table for real-time notifications
CREATE TABLE public.emergency_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('negative', 'neutral', 'positive')),
  sentiment_score NUMERIC NOT NULL DEFAULT 0,
  emotional_tone TEXT NOT NULL CHECK (emotional_tone IN ('neutral', 'distressed', 'panicked')),
  incident_type TEXT,
  location TEXT,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all emergency calls
CREATE POLICY "Authenticated users can view emergency calls"
ON public.emergency_calls
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert emergency calls
CREATE POLICY "Authenticated users can insert emergency calls"
ON public.emergency_calls
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_calls;