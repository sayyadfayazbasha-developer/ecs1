import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertRequest {
  userId: string;
  callDetails: {
    transcript: string;
    urgency: string;
    location: string | null;
    incident_type: string | null;
    created_at: string;
  };
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  contact_user_id: string | null;
  is_primary: boolean;
}

const resolveContactEmail = async (
  serviceClient: ReturnType<typeof createClient>,
  contact: Contact,
): Promise<string | null> => {
  if (contact.email) return contact.email;
  if (!contact.contact_user_id) return null;

  const { data, error } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("user_id", contact.contact_user_id)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve contact email", error.message);
    return null;
  }

  return data?.email ?? null;
};

const sendSMS = async (to: string, message: string): Promise<boolean> => {
  const apiKey = Deno.env.get("VONAGE_API_KEY");
  const apiSecret = Deno.env.get("VONAGE_API_SECRET");
  const fromName = Deno.env.get("VONAGE_FROM") ?? "Emergency";

  if (!apiKey || !apiSecret) {
    console.log("Vonage SMS credentials not configured");
    return false;
  }

  try {
    const response = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: apiKey,
        api_secret: apiSecret,
        to,
        from: fromName,
        text: message,
      }),
    });

    const data = await response.json();
    const messageStatus = data?.messages?.[0]?.status;
    const ok = response.ok && messageStatus === "0";
    console.log("Vonage SMS sent:", ok ? "success" : "failed");
    return ok;
  } catch (error) {
    console.error("SMS send failed");
    return false;
  }
};

const sendEmail = async (
  to: string,
  name: string,
  callDetails: AlertRequest["callDetails"],
): Promise<boolean> => {
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    console.log("Resend API key not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Emergency Alert <onboarding@resend.dev>",
        to: [to],
        subject: `🚨 EMERGENCY ALERT - ${callDetails.urgency.toUpperCase()} URGENCY`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
            </div>
            <div style="padding: 20px; background-color: #f3f4f6;">
              <p>Dear ${name},</p>
              <p>An emergency call has been reported. Please take immediate action.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Urgency Level:</strong> <span style="color: ${callDetails.urgency === "critical" ? "#dc2626" : callDetails.urgency === "high" ? "#ea580c" : "#eab308"};">${callDetails.urgency.toUpperCase()}</span></p>
                ${callDetails.location ? `<p><strong>Location:</strong> ${callDetails.location}</p>` : ""}
                ${callDetails.incident_type ? `<p><strong>Incident Type:</strong> ${callDetails.incident_type}</p>` : ""}
                <p><strong>Time:</strong> ${new Date(callDetails.created_at).toLocaleString()}</p>
                <p><strong>Details:</strong> ${callDetails.transcript.substring(0, 200)}${callDetails.transcript.length > 200 ? "..." : ""}</p>
              </div>
              
              <p style="color: #dc2626; font-weight: bold;">Please respond immediately if this is a genuine emergency.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Email send failed:", response.status);
      return false;
    }

    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Email send failed");
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Validate the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } =
      await supabaseClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = claims.claims.sub;

    // Use service role client for data operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { userId, callDetails }: AlertRequest = await req.json();

    // Verify the authenticated user matches the userId
    if (authenticatedUserId !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: user mismatch" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Sending alerts for authenticated user");

    // Fetch user's emergency contacts
    const { data: contacts, error: contactsError } = await serviceClient
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", userId);

    if (contactsError) {
      console.error("Error fetching contacts");
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No contacts to alert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const alertMessage = `🚨 EMERGENCY ALERT 🚨\n\nUrgency: ${callDetails.urgency.toUpperCase()}\n${callDetails.location ? `Location: ${callDetails.location}\n` : ""}${callDetails.incident_type ? `Type: ${callDetails.incident_type}\n` : ""}Time: ${new Date(callDetails.created_at).toLocaleString()}\n\nDetails: ${callDetails.transcript.substring(0, 100)}...`;

    const smsConfigured = false;
    const emailConfigured = Boolean(Deno.env.get("RESEND_API_KEY"));

    const results = {
      sms: { sent: 0, failed: 0, skipped: 0 },
      email: { sent: 0, failed: 0, skipped: 0 },
      contacts: { total: contacts.length },
      channels: {
        smsConfigured,
        emailConfigured,
      },
    };

    for (const contact of contacts as Contact[]) {
      if (!smsConfigured || !contact.phone) {
        results.sms.skipped++;
      } else {
        const smsResult = await sendSMS(contact.phone, alertMessage);
        if (smsResult) results.sms.sent++;
        else results.sms.failed++;
      }

      if (!emailConfigured) {
        results.email.skipped++;
      } else {
        const email = await resolveContactEmail(serviceClient, contact);
        if (email) {
          const emailResult = await sendEmail(email, contact.name, callDetails);
          if (emailResult) results.email.sent++;
          else results.email.failed++;
        } else {
          results.email.skipped++;
        }
      }
    }

    console.log("Alert results:", JSON.stringify(results));

    const summary = `Contacts ${results.contacts.total} | Email sent ${results.email.sent}, failed ${results.email.failed}, skipped ${results.email.skipped}`;

    return new Response(JSON.stringify({ success: true, results, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending alerts");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
