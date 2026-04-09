-- Add phone column to profiles table for phone-based authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
