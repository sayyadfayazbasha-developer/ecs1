import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  type: "email" | "phone";
  destination: string;
  purpose: "reset_password" | "verify";
}

// Input validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

const validateDestination = (type: string, destination: string): string | null => {
  if (!destination || typeof destination !== "string") return "Destination is required";
  if (destination.length > 320) return "Destination too long";
  
  if (type === "email") {
    if (!EMAIL_REGEX.test(destination.trim())) return "Invalid email format";
  } else if (type === "phone") {
    if (!E164_REGEX.test(destination.trim())) return "Invalid phone format. Use E.164 format (e.g., +1234567890)";
  } else {
    return "Type must be 'email' or 'phone'";
  }
  return null;
};

const generateOTP = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 900000 + 100000).toString();
};

const hashValue = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const sendSMSOTP = async (phone: string, otp: string): Promise<boolean> => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !twilioPhone) {
    console.error("Missing Twilio credentials");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhone,
          Body: `Your verification code is: ${otp}. This code expires in 10 minutes.`,
        }),
      }
    );

    const result = await response.json();
    console.log("SMS OTP sent:", result.sid ? "success" : "failed");
    return !!result.sid;
  } catch (error) {
    console.error("Error sending SMS OTP");
    return false;
  }
};

const sendEmailOTP = async (email: string, otp: string): Promise<boolean> => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("Missing Resend API key");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Emergency App <onboarding@resend.dev>",
        to: [email],
        subject: "Your Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
            </div>
            <p style="color: #666;">This code expires in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    const success = !!result.id;
    console.log("Email OTP sent:", success ? "success" : "failed");
    
    if (!success && result.error) {
      console.error("Email send error:", result.error.name || "unknown");
    }
    
    return success;
  } catch (error) {
    console.error("Error sending email OTP");
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, destination, purpose }: OTPRequest = await req.json();

    if (!type || !destination || !purpose) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate purpose
    if (!["reset_password", "verify"].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Invalid purpose" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate destination format
    const validationError = validateDestination(type, destination);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedDestination = destination.trim();

    // Rate limiting: max 3 OTPs per destination per hour
    const destinationHash = await hashValue(sanitizedDestination);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("destination_hash", destinationHash)
      .gte("created_at", oneHourAgo);

    if (count && count >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Clean up expired OTPs
    await supabase.rpc("cleanup_expired_otps");

    // Generate and hash OTP
    const otp = generateOTP();
    const otpHash = await hashValue(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store hashed OTP in database
    const { data: otpRecord, error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        destination_hash: destinationHash,
        otp_hash: otpHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !otpRecord) {
      console.error("Failed to store OTP record");
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP
    let sent = false;
    if (type === "phone") {
      sent = await sendSMSOTP(sanitizedDestination, otp);
    } else {
      sent = await sendEmailOTP(sanitizedDestination, otp);
    }

    if (!sent) {
      await supabase.from("otp_codes").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: `Failed to send OTP via ${type}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`OTP sent via ${type}, purpose: ${purpose}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `OTP sent to ${type}`,
        otpToken: otpRecord.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
