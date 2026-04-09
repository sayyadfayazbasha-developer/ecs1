import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Phone, MapPin, AlertTriangle, Send, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddEmergencyCallFormProps {
  onCallAdded?: () => void;
}

interface EmergencyContact {
  id: string;
  name: string;
  email: string | null;
  contact_user_id: string | null;
  is_primary: boolean;
}

export const AddEmergencyCallForm = ({ onCallAdded }: AddEmergencyCallFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [formData, setFormData] = useState({
    recipient_id: '',
    transcript: '',
    urgency: 'medium',
    sentiment: 'neutral',
    emotional_tone: 'neutral',
    incident_type: '',
    location: '',
    keywords: ''
  });

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('id, name, email, contact_user_id, is_primary')
        .not('contact_user_id', 'is', null)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      
      // Auto-select primary contact if available
      const primaryContact = data?.find(c => c.is_primary);
      if (primaryContact?.contact_user_id) {
        setFormData(prev => ({ ...prev, recipient_id: primaryContact.contact_user_id! }));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to make emergency calls');
      return;
    }

    if (!formData.recipient_id) {
      toast.error('Please select a contact to call');
      return;
    }

    if (!formData.transcript.trim()) {
      toast.error('Transcript is required');
      return;
    }

    setLoading(true);
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const sentimentScore = formData.sentiment === 'positive' ? 0.7 : 
                            formData.sentiment === 'negative' ? -0.7 : 0;

      const { data: insertedCall, error } = await supabase.from('emergency_calls').insert({
        user_id: user.id,
        recipient_id: formData.recipient_id,
        transcript: formData.transcript.trim(),
        urgency: formData.urgency,
        sentiment: formData.sentiment,
        sentiment_score: sentimentScore,
        emotional_tone: formData.emotional_tone,
        incident_type: formData.incident_type || null,
        location: formData.location || null,
        keywords: keywordsArray.length > 0 ? keywordsArray : null,
        status: 'pending'
      } as any).select().single();

      if (error) throw error;

      toast.success('Emergency call made successfully');

      // Send alerts to emergency contacts
      try {
        const { data: alertData, error: alertError } = await supabase.functions.invoke('send-emergency-alerts', {
          body: {
            userId: user.id,
            callDetails: {
              transcript: formData.transcript.trim(),
              urgency: formData.urgency,
              location: formData.location || null,
              incident_type: formData.incident_type || null,
              created_at: insertedCall.created_at,
            },
          },
        });

        if (alertError) {
          console.error('Alert error:', alertError);
          toast.info('Call made but alerts could not be sent');
        } else {
          const emailSent = alertData?.results?.email?.sent ?? 0;
          const emailFailed = alertData?.results?.email?.failed ?? 0;
          const emailSkipped = alertData?.results?.email?.skipped ?? 0;
          toast.success(`Mail alerts: ${emailSent} sent/${emailFailed} failed/${emailSkipped} skipped`, {
            icon: <Bell className="h-4 w-4" />,
          });
        }
      } catch (alertErr) {
        console.error('Alert error:', alertErr);
      }
      
      setFormData({
        recipient_id: formData.recipient_id, // Keep selected recipient
        transcript: '',
        urgency: 'medium',
        sentiment: 'neutral',
        emotional_tone: 'neutral',
        incident_type: '',
        location: '',
        keywords: ''
      });
      onCallAdded?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to make emergency call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          Make Emergency Call
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Call To *
            </Label>
            <Select 
              value={formData.recipient_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, recipient_id: value }))}
              disabled={loadingContacts}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Select a contact to call"} />
              </SelectTrigger>
              <SelectContent>
                {contacts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No registered contacts available. Add contacts first.
                  </SelectItem>
                ) : (
                  contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.contact_user_id!}>
                      {contact.name} {contact.is_primary && "(Primary)"} - {contact.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {contacts.length === 0 && !loadingContacts && (
              <p className="text-xs text-muted-foreground">
                Add registered users as contacts in the Contacts tab first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript *</Label>
            <Textarea
              id="transcript"
              placeholder="Enter the call transcript..."
              value={formData.transcript}
              onChange={(e) => setFormData(prev => ({ ...prev, transcript: e.target.value }))}
              className="min-h-[100px] bg-background/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select 
                value={formData.urgency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select 
                value={formData.sentiment} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, sentiment: value }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotional_tone">Emotional Tone</Label>
              <Select 
                value={formData.emotional_tone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, emotional_tone: value }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="distressed">Distressed</SelectItem>
                  <SelectItem value="panicked">Panicked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incident_type" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Incident Type
              </Label>
              <Input
                id="incident_type"
                placeholder="e.g., Fire, Medical, Accident"
                value={formData.incident_type}
                onChange={(e) => setFormData(prev => ({ ...prev, incident_type: e.target.value }))}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., 123 Main St, Downtown"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              placeholder="e.g., emergency, fire, help"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              className="bg-background/50"
            />
          </div>

          <Button type="submit" disabled={loading || contacts.length === 0} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Calling...' : 'Make Emergency Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};