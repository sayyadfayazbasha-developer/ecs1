import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EmergencyCall {
  id: string;
  transcript: string;
  urgency: string;
  sentiment: string;
  emotional_tone: string;
  incident_type: string | null;
  location: string | null;
  keywords: string[] | null;
  created_at: string;
}

interface UserCallHistoryProps {
  refreshTrigger?: number;
}

export const UserCallHistory = ({ refreshTrigger }: UserCallHistoryProps) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCalls = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergency_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch your call history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCalls();
  }, [user, refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_calls')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCalls(prev => prev.filter(call => call.id !== id));
      toast.success('Call deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete call');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-urgency-critical text-white';
      case 'high': return 'bg-urgency-high text-white';
      case 'medium': return 'bg-urgency-medium text-background';
      case 'low': return 'bg-urgency-low text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-sentiment-positive text-white';
      case 'negative': return 'bg-sentiment-negative text-white';
      default: return 'bg-sentiment-neutral text-white';
    }
  };

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Your Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Your Call History
          <Badge variant="secondary" className="ml-2">{calls.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No emergency calls recorded yet
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {calls.map((call) => (
                <div 
                  key={call.id} 
                  className="p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getUrgencyColor(call.urgency)}>
                          {call.urgency}
                        </Badge>
                        <Badge className={getSentimentColor(call.sentiment)}>
                          {call.sentiment}
                        </Badge>
                        <Badge variant="outline">{call.emotional_tone}</Badge>
                      </div>
                      
                      <p className="text-sm text-foreground/90 line-clamp-2">
                        {call.transcript}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(call.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                        {call.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {call.location}
                          </span>
                        )}
                        {call.incident_type && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {call.incident_type}
                          </span>
                        )}
                      </div>

                      {call.keywords && call.keywords.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {call.keywords.slice(0, 5).map((keyword, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(call.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
