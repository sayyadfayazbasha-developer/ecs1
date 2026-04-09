import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { UrgencyChart } from '@/components/dashboard/UrgencyChart';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { WordCloud } from '@/components/dashboard/WordCloud';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { CallsTable } from '@/components/dashboard/CallsTable';
import { ModelMetrics } from '@/components/dashboard/ModelMetrics';
import { FilterPanel, FilterState } from '@/components/dashboard/FilterPanel';
import { AddEmergencyCallForm } from '@/components/dashboard/AddEmergencyCallForm';
import { UserCallHistory } from '@/components/dashboard/UserCallHistory';
import { EmergencyContacts } from '@/components/dashboard/EmergencyContacts';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useEmergencyCallNotifications } from '@/hooks/useEmergencyCallNotifications';
import { modelMetrics } from '@/data/sampleData';
import { publicDatasets } from '@/data/emergencyDatasets';
import { Phone, AlertTriangle, TrendingUp, Target, Database, Loader2, PlusCircle, Users, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportCallsToCSV, exportCallsToPDF } from '@/utils/exportUtils';
const Dashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    urgency: [],
    sentiment: [],
    emotionalTone: [],
  });

  // Refresh trigger for call history
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleCallAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get filtered data
  const { 
    filteredEmergencyCalls, 
    filteredSyntheticCalls, 
    filteredStats,
    filteredSyntheticStats 
  } = useFilteredData(filters);

  // Enable real-time notifications for new emergency calls
  useEmergencyCallNotifications(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

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

  const toneColors = {
    neutral: 'bg-sentiment-positive/20 text-sentiment-positive',
    distressed: 'bg-sentiment-neutral/20 text-sentiment-neutral',
    panicked: 'bg-sentiment-negative/20 text-sentiment-negative'
  };

  const urgencyColors = {
    low: 'bg-urgency-low/20 text-urgency-low',
    medium: 'bg-urgency-medium/20 text-urgency-medium',
    high: 'bg-urgency-high/20 text-urgency-high',
    critical: 'bg-urgency-critical/20 text-urgency-critical'
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user.email} userRole={userRole} onSignOut={handleSignOut} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard">Analytics</TabsTrigger>
            <TabsTrigger value="my-calls" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              My Calls
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Filter Panel + Export */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    exportCallsToCSV(filteredEmergencyCalls, filteredStats);
                    toast.success(`Exported ${filteredStats.totalCalls} calls as CSV`);
                  }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    exportCallsToPDF(filteredEmergencyCalls, filteredStats);
                    toast.success('PDF report opened for printing');
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats Row - Now reactive to filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Calls Analyzed"
                value={filteredStats.totalCalls}
                subtitle="Emergency transcripts"
                icon={Phone}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                title="Critical Urgency"
                value={filteredStats.criticalCalls}
                subtitle={filteredStats.totalCalls > 0 
                  ? `${((filteredStats.criticalCalls / filteredStats.totalCalls) * 100).toFixed(1)}% of total`
                  : 'No data'}
                icon={AlertTriangle}
                variant="warning"
              />
              <StatCard
                title="Avg. Sentiment Score"
                value={filteredStats.avgSentiment.toFixed(2)}
                subtitle="Distress level (0-1)"
                icon={TrendingUp}
              />
              <StatCard
                title="Model Accuracy"
                value={`${(modelMetrics.accuracy * 100).toFixed(1)}%`}
                subtitle="MEDLDA + SVM"
                icon={Target}
                variant="success"
              />
            </div>

            {/* Charts Row - Now reactive to filters */}
            <div className="grid lg:grid-cols-2 gap-6">
              <UrgencyChart data={filteredStats.urgencyDistribution} />
              <SentimentChart data={filteredEmergencyCalls} />
            </div>

            {/* Second Row */}
            <div className="grid lg:grid-cols-3 gap-6">
              <ModelMetrics />
              <div className="lg:col-span-2">
                <WordCloud />
              </div>
            </div>

            {/* Timeline */}
            <TimelineChart />

            {/* Calls Table */}
            <CallsTable />
          </TabsContent>

          <TabsContent value="my-calls" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AddEmergencyCallForm onCallAdded={handleCallAdded} />
              <UserCallHistory refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <EmergencyContacts />
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            {/* Filter Panel for Datasets */}
            <FilterPanel filters={filters} onFiltersChange={setFilters} />

            {/* Public Datasets */}
            <Card className="glass border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Public NLP Datasets for Emergency Communications
                </CardTitle>
                <CardDescription>
                  Recommended datasets for training and testing emergency call analysis models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {publicDatasets.map((dataset, i) => (
                    <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/40">
                      <h4 className="font-semibold mb-2">{dataset.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{dataset.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">{dataset.format}</Badge>
                      </div>
                      <p className="text-xs text-primary mb-2">{dataset.relevance}</p>
                      <a 
                        href={dataset.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        View Dataset →
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Synthetic Dataset Stats - Now filtered */}
            <Card className="glass border-border/40">
              <CardHeader>
                <CardTitle>Synthetic Emergency Call Dataset</CardTitle>
                <CardDescription>
                  {filteredSyntheticStats.totalCalls} sample transcripts 
                  {filters.urgency.length > 0 || filters.emotionalTone.length > 0 
                    ? ' (filtered)' 
                    : ' with emotional variations for MEDLDA model testing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-background/50 text-center">
                    <div className="text-3xl font-bold text-primary">{filteredSyntheticStats.totalCalls}</div>
                    <div className="text-sm text-muted-foreground">Total Transcripts</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 text-center">
                    <div className="text-3xl font-bold text-sentiment-positive">{filteredSyntheticStats.byEmotionalTone.neutral}</div>
                    <div className="text-sm text-muted-foreground">Neutral Tone</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 text-center">
                    <div className="text-3xl font-bold text-sentiment-neutral">{filteredSyntheticStats.byEmotionalTone.distressed}</div>
                    <div className="text-sm text-muted-foreground">Distressed Tone</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 text-center">
                    <div className="text-3xl font-bold text-sentiment-negative">{filteredSyntheticStats.byEmotionalTone.panicked}</div>
                    <div className="text-sm text-muted-foreground">Panicked Tone</div>
                  </div>
                </div>

                <h4 className="font-semibold mb-4">Sample Transcripts</h4>
                {filteredSyntheticCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No transcripts match current filters
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {filteredSyntheticCalls.map((call) => (
                        <div key={call.id} className="p-4 rounded-xl bg-background/50 border border-border/40">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs text-muted-foreground">#{call.id}</span>
                            <Badge className={toneColors[call.emotionalTone]}>
                              {call.emotionalTone}
                            </Badge>
                            <Badge className={urgencyColors[call.urgencyLevel]}>
                              {call.urgencyLevel}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {call.incidentType.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{call.transcript}</p>
                          <div className="flex flex-wrap gap-1">
                            {call.keywords.map((keyword, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                {keyword}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Location: {call.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Export Button */}
            {userRole === 'admin' && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    const data = JSON.stringify(filteredSyntheticCalls, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'emergency_calls_dataset.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success(`Exported ${filteredSyntheticCalls.length} records!`);
                  }}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Export Dataset (JSON)
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
