-- Create OTP codes table for secure server-side OTP storage
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_hash text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (only accessed via service role)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create index for fast lookups
CREATE INDEX idx_otp_codes_destination_hash ON public.otp_codes (destination_hash);

-- Create a cleanup function to delete expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.otp_codes WHERE expires_at < now() OR verified = true;
$$;

-- Create a limited view for recipients showing only essential emergency info
CREATE VIEW public.emergency_calls_recipient_view AS
SELECT 
  id,
  urgency,
  incident_type,
  status,
  created_at,
  recipient_id,
  user_id
FROM public.emergency_calls;