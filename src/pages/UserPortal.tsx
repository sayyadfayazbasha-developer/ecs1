import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/dashboard/Header';
import { AddEmergencyCallForm } from '@/components/dashboard/AddEmergencyCallForm';
import { UserCallHistory } from '@/components/dashboard/UserCallHistory';
import { EmergencyContacts } from '@/components/dashboard/EmergencyContacts';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import { EmergencyAlertButton } from '@/components/dashboard/EmergencyAlertButton';

import { VoiceUploadAnalyzer } from '@/components/dashboard/VoiceUploadAnalyzer';
import { useEmergencyCallNotifications } from '@/hooks/useEmergencyCallNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Loader2, 
  Users,
  User,
  PlusCircle,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  CheckCheck,
  LayoutDashboard,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  
  Upload,
  HelpCircle,
  Mail
} from 'lucide-react';

interface EmergencyCall {
  id: string;
  transcript: string;
  urgency: string;
  sentiment: string;
  sentiment_score: number;
  emotional_tone: string;
  incident_type: string | null;
  location: string | null;
  keywords: string[] | null;
  created_at: string;
  user_id: string;
  recipient_id: string | null;
  status: string;
  caller_email?: string;
  recipient_email?: string;
}

const UserPortal = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialedCalls, setDialedCalls] = useState<EmergencyCall[]>([]);
  const [receivedCalls, setReceivedCalls] = useState<EmergencyCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Handle tab from URL param
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'dashboard');

  // Update activeTab when URL changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEmergencyCallNotifications(true);

  const handleCallAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchCalls();
  };

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToReceived = () => {
      setActiveTab('received');
      fetchCalls();
    };
    
    window.addEventListener('navigate-to-received', handleNavigateToReceived);
    return () => {
      window.removeEventListener('navigate-to-received', handleNavigateToReceived);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?portal=user');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [user, refreshTrigger]);

  // Real-time subscription for received calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-portal-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_calls',
        },
        (payload) => {
          console.log('Call update received:', payload);
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCalls = useCallback(async () => {
    if (!user) return;
    setLoadingCalls(true);
    try {
      // Fetch user's dialed calls (where user_id = current user)
      const { data: myDialedCalls, error: dialedError } = await supabase
        .from('emergency_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dialedError) throw dialedError;

      // Enrich dialed calls with recipient info
      if (myDialedCalls && myDialedCalls.length > 0) {
        const recipientIds = [...new Set(myDialedCalls.filter(c => c.recipient_id).map(c => c.recipient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', recipientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
        
        const enrichedDialed = myDialedCalls.map(call => ({
          ...call,
          status: (call as any).status || 'pending',
          recipient_email: call.recipient_id ? profileMap.get(call.recipient_id) || 'Unknown' : undefined
        })) as EmergencyCall[];
        
        setDialedCalls(enrichedDialed);
      } else {
        setDialedCalls([]);
      }

      // Fetch calls received by user via the restricted view (only safe columns + caller_email)
      const { data: myReceivedCalls, error: receivedError } = await supabase
        .from('emergency_calls_recipient_view')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      if (myReceivedCalls && myReceivedCalls.length > 0) {
        const enrichedCalls = myReceivedCalls.map(call => ({
          ...call,
          transcript: '',
          sentiment: '',
          emotional_tone: '',
          sentiment_score: 0,
          status: call.status || 'pending',
          caller_email: (call as any).caller_email || 'Unknown'
        })) as EmergencyCall[];
        
        setReceivedCalls(enrichedCalls);
      } else {
        setReceivedCalls([]);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoadingCalls(false);
    }
  }, [user]);

  const handleStatusUpdate = async (callId: string, newStatus: string) => {
    setUpdatingStatus(callId);
    try {
      const { error } = await supabase
        .from('emergency_calls')
        .update({ status: newStatus } as any)
        .eq('id', callId);

      if (error) throw error;

      toast.success(`Call marked as ${newStatus}`);
      fetchCalls();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      low: 'bg-urgency-low/20 text-urgency-low',
      medium: 'bg-urgency-medium/20 text-urgency-medium',
      high: 'bg-urgency-high/20 text-urgency-high',
      critical: 'bg-urgency-critical/20 text-urgency-critical'
    };
    return colors[urgency] || 'bg-muted text-muted-foreground';
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: 'bg-sentiment-positive/20 text-sentiment-positive',
      neutral: 'bg-sentiment-neutral/20 text-sentiment-neutral',
      negative: 'bg-sentiment-negative/20 text-sentiment-negative'
    };
    return colors[sentiment] || 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
      case 'acknowledged':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
      case 'resolved':
        return 'bg-green-500/20 text-green-600 border-green-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate stats
  const totalDialed = dialedCalls.length;
  const totalReceived = receivedCalls.length;
  const totalCalls = totalDialed + totalReceived;
  const pendingReceived = receivedCalls.filter(c => c.status === 'pending').length;
  const acknowledgedReceived = receivedCalls.filter(c => c.status === 'acknowledged').length;
  const resolvedReceived = receivedCalls.filter(c => c.status === 'resolved').length;
  const criticalDialed = dialedCalls.filter(c => c.urgency === 'critical').length;
  const criticalReceived = receivedCalls.filter(c => c.urgency === 'critical').length;
  const highUrgencyDialed = dialedCalls.filter(c => c.urgency === 'high').length;
  const highUrgencyReceived = receivedCalls.filter(c => c.urgency === 'high').length;
  const avgSentiment = dialedCalls.length > 0 
    ? dialedCalls.reduce((sum, c) => sum + c.sentiment_score, 0) / dialedCalls.length 
    : 0;
  const negativeDialed = dialedCalls.filter(c => c.sentiment === 'negative').length;
  const negativeReceived = receivedCalls.filter(c => c.sentiment === 'negative').length;
  
  // Recent calls (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDialed = dialedCalls.filter(c => new Date(c.created_at) > oneDayAgo).length;
  const recentReceived = receivedCalls.filter(c => new Date(c.created_at) > oneDayAgo).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user.email} userRole={userRole} onSignOut={handleSignOut} showNavigation={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portal Title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Portal</h1>
            <p className="text-muted-foreground">Manage your emergency calls, contacts, and view call history</p>
          </div>
          {pendingReceived > 0 && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              {pendingReceived} Pending Call{pendingReceived > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-7xl grid-cols-11">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="my-calls" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              My Calls
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1 relative">
              <PhoneIncoming className="h-4 w-4" />
              Received
              {pendingReceived > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingReceived}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="dialed" className="flex items-center gap-1">
              <PhoneOutgoing className="h-4 w-4" />
              Dialed
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              Help
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass border-border/40 hover:scale-[1.02] transition-transform">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Calls</p>
                      <p className="text-3xl font-bold">{totalCalls}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {recentDialed + recentReceived} in last 24h
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40 hover:scale-[1.02] transition-transform">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dialed</p>
                      <p className="text-3xl font-bold text-blue-500">{totalDialed}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {recentDialed} recent
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <PhoneOutgoing className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40 hover:scale-[1.02] transition-transform">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Received</p>
                      <p className="text-3xl font-bold text-green-500">{totalReceived}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ArrowDownRight className="h-3 w-3" />
                        {recentReceived} recent
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <PhoneIncoming className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`glass border-border/40 hover:scale-[1.02] transition-transform ${pendingReceived > 0 ? 'border-yellow-500/50 shadow-yellow-500/20 shadow-lg' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className={`text-3xl font-bold ${pendingReceived > 0 ? 'text-yellow-500' : ''}`}>{pendingReceived}</p>
                      <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${pendingReceived > 0 ? 'bg-yellow-500/20 animate-pulse' : 'bg-yellow-500/10'}`}>
                      <Clock className={`h-6 w-6 ${pendingReceived > 0 ? 'text-yellow-500' : 'text-yellow-500/50'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Urgency & Status Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Urgency Breakdown */}
              <Card className="glass border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Urgency Overview</CardTitle>
                      <CardDescription>All calls by urgency level</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { level: 'critical', color: 'bg-urgency-critical', count: criticalDialed + criticalReceived },
                    { level: 'high', color: 'bg-urgency-high', count: highUrgencyDialed + highUrgencyReceived },
                    { level: 'medium', color: 'bg-urgency-medium', count: dialedCalls.filter(c => c.urgency === 'medium').length + receivedCalls.filter(c => c.urgency === 'medium').length },
                    { level: 'low', color: 'bg-urgency-low', count: dialedCalls.filter(c => c.urgency === 'low').length + receivedCalls.filter(c => c.urgency === 'low').length },
                  ].map(({ level, color, count }) => {
                    const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0;
                    return (
                      <div key={level} className="flex items-center gap-4">
                        <Badge className={getUrgencyColor(level)} variant="outline">{level}</Badge>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Status Breakdown for Received */}
              <Card className="glass border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Response Status</CardTitle>
                      <CardDescription>Received calls status breakdown</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-4 rounded-xl border text-center ${getStatusColor('pending')}`}>
                      <Clock className="h-5 w-5 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{pendingReceived}</p>
                      <p className="text-xs">Pending</p>
                    </div>
                    <div className={`p-4 rounded-xl border text-center ${getStatusColor('acknowledged')}`}>
                      <CheckCircle className="h-5 w-5 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{acknowledgedReceived}</p>
                      <p className="text-xs">Acknowledged</p>
                    </div>
                    <div className={`p-4 rounded-xl border text-center ${getStatusColor('resolved')}`}>
                      <CheckCheck className="h-5 w-5 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{resolvedReceived}</p>
                      <p className="text-xs">Resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="glass border-border/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                      <CardDescription>Latest emergency calls</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('received')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalls ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {[...dialedCalls, ...receivedCalls]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 10)
                        .map((call) => {
                          const isDialed = call.user_id === user?.id && call.recipient_id !== user?.id;
                          return (
                            <div key={call.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-secondary/50 transition-colors">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDialed ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                                {isDialed ? (
                                  <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <PhoneIncoming className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {isDialed ? `To: ${call.recipient_email || 'N/A'}` : `From: ${call.caller_email || 'Unknown'}`}
                                  </Badge>
                                  <Badge className={getUrgencyColor(call.urgency)} variant="outline">{call.urgency}</Badge>
                                  <Badge className={`${getStatusColor(call.status)}`} variant="outline">
                                    {call.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{call.transcript}</p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(call.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      {dialedCalls.length === 0 && receivedCalls.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No emergency calls yet. Use the "My Calls" tab to create one.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('my-calls')}
              >
                <PlusCircle className="h-5 w-5" />
                <span>New Call</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('contacts')}
              >
                <Users className="h-5 w-5" />
                <span>Contacts</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 flex flex-col gap-2 ${pendingReceived > 0 ? 'border-yellow-500/50 text-yellow-600' : ''}`}
                onClick={() => setActiveTab('received')}
              >
                <PhoneIncoming className="h-5 w-5" />
                <span>Received ({pendingReceived} pending)</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('analysis')}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analysis</span>
              </Button>
            </div>
          </TabsContent>


          {/* Upload Tab - Voice Recording Analysis */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="glass border-border/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Upload Voice Recording</CardTitle>
                    <CardDescription>
                      Upload a pre-recorded audio file for transcription and analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Step 1: Upload</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Select or drag & drop an audio file (MP3, WAV, etc.)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Step 2: Transcribe</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Speech-to-text transcription using AI</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm font-medium">Step 3: Analyze</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Sentiment, urgency, and keyword detection</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <VoiceUploadAnalyzer />
          </TabsContent>

          {/* My Calls Tab */}
          <TabsContent value="my-calls" className="space-y-6">
            {/* Big Emergency Alert Button */}
            <EmergencyAlertButton onAlertSent={handleCallAdded} />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <AddEmergencyCallForm onCallAdded={handleCallAdded} />
              <UserCallHistory refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <EmergencyContacts />
          </TabsContent>

          {/* Received Calls Tab */}
          <TabsContent value="received" className="space-y-6">
            <Card className="glass border-border/40 border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <PhoneIncoming className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Received Emergency Calls</CardTitle>
                    <CardDescription>Emergency calls directed to you - update status to notify callers</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto border-green-500 text-green-500">
                    {receivedCalls.length} call{receivedCalls.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalls ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : receivedCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No emergency calls received yet. Users must add you as a contact first.
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {receivedCalls.map((call) => (
                        <div key={call.id} className={`p-4 rounded-xl bg-background/50 border ${call.status === 'pending' ? 'border-yellow-500/50 shadow-yellow-500/10 shadow-lg' : 'border-border/40'}`}>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              From: {call.caller_email}
                            </Badge>
                            <Badge className={getUrgencyColor(call.urgency)}>{call.urgency}</Badge>
                            <Badge className={getSentimentColor(call.sentiment)}>{call.sentiment}</Badge>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(call.status)}`}>
                              {getStatusIcon(call.status)}
                              {call.status}
                            </Badge>
                            {call.incident_type && (
                              <Badge variant="outline">{call.incident_type.replace(/_/g, ' ')}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(call.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{call.transcript}</p>
                          {call.location && (
                            <p className="text-xs text-muted-foreground mb-3">Location: {call.location}</p>
                          )}
                          
                          {/* Status Update Controls */}
                          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                            <span className="text-sm text-muted-foreground">Update status:</span>
                            <Select
                              value={call.status}
                              onValueChange={(value) => handleStatusUpdate(call.id, value)}
                              disabled={updatingStatus === call.id}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Pending
                                  </span>
                                </SelectItem>
                                <SelectItem value="acknowledged">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3" /> Acknowledged
                                  </span>
                                </SelectItem>
                                <SelectItem value="resolved">
                                  <span className="flex items-center gap-2">
                                    <CheckCheck className="h-3 w-3" /> Resolved
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingStatus === call.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialed Calls Tab */}
          <TabsContent value="dialed" className="space-y-6">
            <Card className="glass border-border/40 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <PhoneOutgoing className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Dialed Emergency Calls</CardTitle>
                    <CardDescription>Emergency calls you have made to your contacts</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto border-blue-500 text-blue-500">
                    {dialedCalls.length} call{dialedCalls.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalls ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : dialedCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    You haven't made any emergency calls yet. Add contacts first, then make a call.
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {dialedCalls.map((call) => (
                        <div key={call.id} className="p-4 rounded-xl bg-background/50 border border-border/40">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {call.recipient_email && (
                              <Badge variant="secondary" className="text-xs">
                                To: {call.recipient_email}
                              </Badge>
                            )}
                            <Badge className={getUrgencyColor(call.urgency)}>{call.urgency}</Badge>
                            <Badge className={getSentimentColor(call.sentiment)}>{call.sentiment}</Badge>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(call.status)}`}>
                              {getStatusIcon(call.status)}
                              {call.status}
                            </Badge>
                            {call.incident_type && (
                              <Badge variant="outline">{call.incident_type.replace(/_/g, ' ')}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(call.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-2">{call.transcript}</p>
                          {call.location && (
                            <p className="text-xs text-muted-foreground">Location: {call.location}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <PhoneOutgoing className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalDialed}</p>
                      <p className="text-sm text-muted-foreground">Dialed Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <PhoneIncoming className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalReceived}</p>
                      <p className="text-sm text-muted-foreground">Received Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{criticalDialed + criticalReceived}</p>
                      <p className="text-sm text-muted-foreground">Critical Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingReceived}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle>Your Dialed Calls Analysis</CardTitle>
                  <CardDescription>Breakdown of your emergency calls by urgency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(level => {
                      const count = dialedCalls.filter(c => c.urgency === level).length;
                      const percentage = totalDialed > 0 ? (count / totalDialed) * 100 : 0;
                      return (
                        <div key={level} className="flex items-center gap-4">
                          <Badge className={getUrgencyColor(level)} variant="outline">{level}</Badge>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${level === 'critical' ? 'bg-urgency-critical' : level === 'high' ? 'bg-urgency-high' : level === 'medium' ? 'bg-urgency-medium' : 'bg-urgency-low'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle>Received Calls Analysis</CardTitle>
                  <CardDescription>Breakdown of received emergency calls by urgency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(level => {
                      const count = receivedCalls.filter(c => c.urgency === level).length;
                      const percentage = totalReceived > 0 ? (count / totalReceived) * 100 : 0;
                      return (
                        <div key={level} className="flex items-center gap-4">
                          <Badge className={getUrgencyColor(level)} variant="outline">{level}</Badge>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${level === 'critical' ? 'bg-urgency-critical' : level === 'high' ? 'bg-urgency-high' : level === 'medium' ? 'bg-urgency-medium' : 'bg-urgency-low'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution */}
            <Card className="glass border-border/40">
              <CardHeader>
                <CardTitle>Call Status Overview</CardTitle>
                <CardDescription>Distribution of received calls by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {['pending', 'acknowledged', 'resolved'].map(status => {
                    const count = receivedCalls.filter(c => c.status === status).length;
                    return (
                      <div key={status} className={`p-4 rounded-xl border ${getStatusColor(status)}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(status)}
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card className="glass border-border/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>How It Works</CardTitle>
                    <CardDescription>Learn how to use the Emergency Call Analyzer</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Data Input', description: 'Upload emergency call transcripts or use our synthetic dataset for analysis' },
                    { step: '02', title: 'AI Processing', description: 'MEDLDA and JST models analyze sentiment, topics, and classify urgency levels' },
                    { step: '03', title: 'Insights', description: 'View comprehensive dashboards with actionable insights and detailed analytics' }
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className="text-8xl font-display font-bold text-primary/10 absolute -top-4 -left-2">{item.step}</div>
                      <div className="relative pt-12">
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="glass border-border/40">
              <CardHeader className="text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">SAYYAD FAYAZ BASHA</CardTitle>
                    <CardDescription>Project Lead — Sentiment Analysis in Emergency Calls</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <a href="mailto:fayaz1234basha@gmail.com" className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="text-sm">fayaz1234basha@gmail.com</span>
                  </a>
                  <a href="tel:+919703029115" className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-sm">+91 9703029115</span>
                  </a>
                  <a href="https://github.com/sayyadfayazbasha-developer" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span className="text-sm">GitHub</span>
                  </a>
                  <a href="https://www.linkedin.com/in/sayyadfayazbasha-developer/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    <span className="text-sm">LinkedIn</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserPortal;