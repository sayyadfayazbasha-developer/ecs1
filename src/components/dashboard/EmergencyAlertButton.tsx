import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Bell, MapPin, MessageSquare, Phone, ShieldAlert, Flame, Heart } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmergencyAlertButtonProps {
  onAlertSent?: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeEmail = (value: string | null | undefined) => String(value ?? "").trim().toLowerCase();

const EMERGENCY_SERVICES = [
  { id: "police", label: "Police", number: "100", icon: ShieldAlert, color: "text-blue-500" },
  { id: "ambulance", label: "Ambulance", number: "108", icon: Heart, color: "text-orange-500" },
  { id: "fire", label: "Fire", number: "101", icon: Flame, color: "text-red-500" },
  { id: "women", label: "Women Helpline", number: "181", icon: Phone, color: "text-purple-500" },
];

export const EmergencyAlertButton = ({ onAlertSent }: EmergencyAlertButtonProps) => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [serviceToggles, setServiceToggles] = useState<Record<string, boolean>>({
    police: true,
    ambulance: true,
    fire: false,
    women: false,
  });

  useEffect(() => {
    if (open) {
      requestLocation();
    } else {
      setCustomMessage("");
      setLocation(null);
      setLocationError(null);
    }
  }, [open]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`,
            { headers: { "User-Agent": "EmergencyAlertApp" } }
          );
          const data = await response.json();
          if (data.display_name) {
            locationData.address = data.display_name;
          }
        } catch (error) {
          console.log("Could not fetch address:", error);
        }

        setLocation(locationData);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Please try again.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Could not get your location.");
        }
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const formatLocationString = (): string => {
    if (!location) return "";
    
    const mapsLink = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    if (location.address) {
      return `${location.address}\n\nGoogle Maps: ${mapsLink}\n\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy)}m)`;
    }
    
    return `Google Maps: ${mapsLink}\n\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy)}m)`;
  };

  const toggleService = (id: string) => {
    setServiceToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendEmergencyAlert = async () => {
    if (!user) {
      toast.error("You must be logged in to send alerts");
      return;
    }

    const messageText = customMessage.trim() || "EMERGENCY ALERT - Immediate assistance required!";
    const locationString = formatLocationString();
    const fullTranscript = locationString 
      ? `${messageText}\n\n📍 LOCATION:\n${locationString}`
      : messageText;

    // Get enabled services for the alert
    const enabledServices = EMERGENCY_SERVICES.filter((s) => serviceToggles[s.id]);

    setSending(true);
    try {
      // Create an emergency call record
      const emergencyCall = {
        user_id: user.id,
        transcript: fullTranscript,
        urgency: "critical",
        sentiment: "negative",
        sentiment_score: -1,
        emotional_tone: "panicked",
        incident_type: "emergency_alert",
        location: location?.address || (location ? `${location.latitude}, ${location.longitude}` : null),
        keywords: ["emergency", "alert", "help", "urgent", ...enabledServices.map((s) => s.id)],
        status: "pending",
      };

      const { error: callError } = await supabase
        .from("emergency_calls")
        .insert(emergencyCall)
        .select()
        .single();

      if (callError) throw callError;

      // Fetch user's contacts
      const { data: contacts, error: contactsError } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id);

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        toast.warning("No emergency contacts configured. Please add contacts first.");
        setOpen(false);
        setSending(false);
        return;
      }

      // Find primary contact for phone call
      const primaryContact = contacts.find((c) => c.is_primary);

      // Create calls for registered contacts (those with contact_user_id)
      const registeredContacts = contacts.filter((c) => c.contact_user_id);
      if (registeredContacts.length > 0) {
        const recipientCalls = registeredContacts.map((contact) => ({
          user_id: user.id,
          recipient_id: contact.contact_user_id,
          transcript: fullTranscript,
          urgency: "critical",
          sentiment: "negative",
          sentiment_score: -1,
          emotional_tone: "panicked",
          incident_type: "emergency_alert",
          location: location?.address || (location ? `${location.latitude}, ${location.longitude}` : null),
          keywords: ["emergency", "alert", "help", "urgent"],
          status: "pending",
        }));

        await supabase.from("emergency_calls").insert(recipientCalls);
      }

      // Collect emails from direct contact emails + linked profile emails.
      const directEmails = contacts
        .map((contact) => normalizeEmail(contact.email))
        .filter((email) => isValidEmail(email));

      const linkedUserIds = Array.from(
        new Set(contacts.map((contact) => contact.contact_user_id).filter(Boolean))
      );

      let linkedProfileEmails: string[] = [];
      if (linkedUserIds.length > 0) {
        const { data: linkedProfiles, error: linkedProfilesError } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", linkedUserIds);

        if (linkedProfilesError) {
          console.error("Failed to load linked contact profile emails:", linkedProfilesError);
        } else {
          linkedProfileEmails = (linkedProfiles || [])
            .map((profile) => normalizeEmail(profile.email))
            .filter((email) => isValidEmail(email));
        }
      }

      const uniqueContactEmails = Array.from(new Set([...directEmails, ...linkedProfileEmails]));

      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        toast.warning("Email alerts skipped: EmailJS is not configured");
      } else if (uniqueContactEmails.length === 0) {
        toast.warning("No contact emails available for alert notifications");
      } else {
        const emailResults = await Promise.allSettled(
          uniqueContactEmails.map((toEmail) =>
            fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: {
                  to_email: toEmail,
                  email: toEmail,
                  recipient_email: toEmail,
                  to_name: "Emergency Contact",
                  recipient_name: "Emergency Contact",
                  from_email: user.email || "",
                  from_name: user.email || "Emergency Alert",
                  message: messageText,
                  transcript: fullTranscript,
                  urgency: emergencyCall.urgency,
                  incident_type: emergencyCall.incident_type,
                  location: emergencyCall.location || "Location unavailable",
                  maps_url: location
                    ? `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`
                    : "",
                  alert_time: new Date().toLocaleString(),
                },
              }),
            }).then(async (res) => {
              if (!res.ok) {
                const bodyText = await res.text();
                throw new Error(`EmailJS request failed for ${toEmail}: ${res.status} ${bodyText}`);
              }
            })
          )
        );

        const emailSent = emailResults.filter((r) => r.status === "fulfilled").length;
        const emailFailed = emailResults.length - emailSent;
        const firstFailure = emailResults.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;

        if (emailFailed > 0) {
          toast.warning(
            firstFailure?.reason?.message
              ? `Mail alerts: ${emailSent} sent/${emailFailed} failed (${firstFailure.reason.message})`
              : `Mail alerts: ${emailSent} sent/${emailFailed} failed`
          );
        } else {
          toast.success(`Mail alerts: ${emailSent} sent`);
        }
      }

      // Auto-call primary contact
      if (primaryContact && primaryContact.phone) {
        toast.info(`Calling primary contact: ${primaryContact.name}`);
        setTimeout(() => {
          window.location.href = `tel:${primaryContact.phone}`;
        }, 500);
      }

      // Dial enabled emergency services
      if (enabledServices.length > 0) {
        const serviceNames = enabledServices.map((s) => `${s.label} (${s.number})`).join(", ");
        toast.info(`Emergency services notified: ${serviceNames}`);
      }

      setOpen(false);
      onAlertSent?.();
    } catch (error: any) {
      console.error("Emergency alert error:", error);
      toast.error(error.message || "Failed to send emergency alert");
    } finally {
      setSending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          variant="destructive"
          className="w-full h-32 text-2xl font-bold gap-4 shadow-2xl shadow-destructive/50 hover:shadow-destructive/70 hover:scale-[1.02] transition-all duration-300 animate-pulse hover:animate-none bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-2 border-red-400"
        >
          <AlertTriangle className="h-12 w-12" />
          <div className="flex flex-col items-start">
            <span>EMERGENCY ALERT</span>
            <span className="text-sm font-normal opacity-90">Send alert to all contacts</span>
          </div>
          <Bell className="h-10 w-10 ml-auto animate-bounce" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-destructive/50 bg-background max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
            <AlertTriangle className="h-6 w-6" />
            Send Emergency Alert
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              {/* Emergency Services Toggles */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <Phone className="h-4 w-4" />
                  Emergency Services
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_SERVICES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          serviceToggles[service.id]
                            ? "border-primary/50 bg-primary/5"
                            : "border-muted bg-muted/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${service.color}`} />
                          <div className="text-xs">
                            <p className="font-medium text-foreground">{service.label}</p>
                            <p className="text-muted-foreground">{service.number}</p>
                          </div>
                        </div>
                        <Switch
                          checked={serviceToggles[service.id]}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggled-on services will receive alerts. Primary contact will be called directly.
                </p>
              </div>

              {/* Custom Message Input */}
              <div className="space-y-2">
                <Label htmlFor="emergency-message" className="flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Emergency Message
                </Label>
                <Textarea
                  id="emergency-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, 500))}
                  placeholder="Describe your emergency situation... (optional)"
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{customMessage.length}/500</p>
              </div>

              {/* Location Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4" />
                  Your Location
                </Label>
                <div className="p-3 rounded-lg border bg-muted/50">
                  {locationLoading ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting your location...
                    </div>
                  ) : locationError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{locationError}</p>
                      <Button size="sm" variant="outline" onClick={requestLocation}>
                        Try Again
                      </Button>
                    </div>
                  ) : location ? (
                    <div className="space-y-1">
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location captured
                      </p>
                      {location.address && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} (±{Math.round(location.accuracy)}m)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Location not available</p>
                  )}
                </div>
              </div>

              {/* Alert Methods */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">On alert:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>📞 <strong>Primary contact</strong> will be called directly</li>
                  <li>✉️ All contact emails receive EmailJS alerts</li>
                  <li>🚨 Toggled-on services are notified</li>
                </ul>
              </div>

              <p className="text-destructive font-medium text-sm">
                ⚠️ Only use this in genuine emergencies!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSendEmergencyAlert();
            }}
            disabled={sending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Alerts...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Emergency Alert
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
