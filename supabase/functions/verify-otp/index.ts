import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  otpToken: string;
  otp: string;
  destination: string;
  newPassword?: string;
}

// Input validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OTP_REGEX = /^\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const hashValue = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { otpToken, otp, destination, newPassword }: VerifyOTPRequest = await req.json();

    // Validate required fields
    if (!otpToken || !otp || !destination) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate otpToken is a UUID
    if (!UUID_REGEX.test(otpToken)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP token format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP is exactly 6 digits
    if (!OTP_REGEX.test(otp)) {
      return new Response(
        JSON.stringify({ error: "OTP must be exactly 6 digits" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate destination format
    const trimmedDest = destination.trim();
    const isPhone = E164_REGEX.test(trimmedDest);
    const isEmail = EMAIL_REGEX.test(trimmedDest);
    if (!isPhone && !isEmail) {
      return new Response(
        JSON.stringify({ error: "Invalid destination format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate new password if provided
    if (newPassword !== undefined) {
      if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Look up OTP record by ID
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("id", otpToken)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already verified
    if (otpRecord.verified) {
      return new Response(
        JSON.stringify({ error: "OTP already used" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      await supabase.from("otp_codes").delete().eq("id", otpToken);
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new OTP." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otp_codes").delete().eq("id", otpToken);
      return new Response(
        JSON.stringify({ error: "OTP has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify destination hash matches
    const destinationHash = await hashValue(trimmedDest);
    if (otpRecord.destination_hash !== destinationHash) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify OTP hash
    const otpHash = await hashValue(otp);
    if (otpRecord.otp_hash !== otpHash) {
      await supabase
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpToken);

      return new Response(
        JSON.stringify({ error: "Invalid OTP code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    await supabase.from("otp_codes").update({ verified: true }).eq("id", otpToken);

    // If new password is provided, update the user's password
    if (newPassword) {
      let userId: string | null = null;
      
      if (isPhone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("phone", trimmedDest)
          .single();
        userId = profile?.user_id;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", trimmedDest)
          .single();
        userId = profile?.user_id;
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Password update failed");
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Password updated successfully");
    }

    // Clean up used OTP
    await supabase.from("otp_codes").delete().eq("id", otpToken);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: newPassword ? "Password updated successfully" : "OTP verified successfully",
        verified: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
