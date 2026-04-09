import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { UrgencyChart } from '@/components/dashboard/UrgencyChart';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { WordCloud } from '@/components/dashboard/WordCloud';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { CallsTable } from '@/components/dashboard/CallsTable';
import { ModelMetrics } from '@/components/dashboard/ModelMetrics';
import { FilterPanel, FilterState } from '@/components/dashboard/FilterPanel';
import { useFilteredData } from '@/hooks/useFilteredData';
import { modelMetrics } from '@/data/sampleData';
import { syntheticEmergencyCalls } from '@/data/emergencyDatasets';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Phone, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Database, 
  Loader2, 
  Users,
  ShieldCheck,
  User,
  Search,
  RefreshCw,
  BarChart3,
  HelpCircle,
  Mail
} from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  is_primary: boolean;
  created_at: string;
}

const AdminPortal = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    urgency: [],
    sentiment: [],
    emotionalTone: [],
  });

  // User management state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserIsPrimary, setCurrentUserIsPrimary] = useState(false);

  // Get filtered data
  const { 
    filteredEmergencyCalls, 
    filteredSyntheticCalls, 
    filteredStats,
    filteredSyntheticStats 
  } = useFilteredData(filters);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?portal=admin');
    } else if (!loading && userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/auth?portal=admin');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRoleData = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: (userRoleData?.role as 'admin' | 'user') || 'user',
          is_primary: userRoleData?.is_primary || false,
          created_at: profile.created_at,
        };
      });

      const currentUserRole = roles?.find((r) => r.user_id === user?.id);
      setCurrentUserIsPrimary(currentUserRole?.is_primary || false);

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.id);

      if (error) throw error;

      setUsers(users.map((u) => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));

      toast.success(`Role updated to ${newRole} for ${selectedUser.email}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const openRoleDialog = (userToEdit: UserWithRole) => {
    setSelectedUser(userToEdit);
    setNewRole(userToEdit.role);
    setIsDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user.email} userRole={userRole} onSignOut={handleSignOut} showNavigation={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portal Title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground">Manage datasets, view analytics, and control user access</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />

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

            <div className="grid lg:grid-cols-2 gap-6">
              <UrgencyChart data={filteredStats.urgencyDistribution} />
              <SentimentChart data={filteredEmergencyCalls} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <ModelMetrics />
              <div className="lg:col-span-2">
                <WordCloud />
              </div>
            </div>

            <TimelineChart />
            <CallsTable />
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-6">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />

            <Card className="glass border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Our Emergency Call Dataset
                </CardTitle>
                <CardDescription>
                  All dataset records are available here inside the admin panel without external links.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-background/50 text-center">
                    <div className="text-3xl font-bold text-primary">{syntheticEmergencyCalls.length}</div>
                    <div className="text-sm text-muted-foreground">Total Records</div>
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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Low Urgency', value: filteredSyntheticCalls.filter((call) => call.urgencyLevel === 'low').length, className: 'text-urgency-low' },
                    { label: 'Medium Urgency', value: filteredSyntheticCalls.filter((call) => call.urgencyLevel === 'medium').length, className: 'text-urgency-medium' },
                    { label: 'High Urgency', value: filteredSyntheticCalls.filter((call) => call.urgencyLevel === 'high').length, className: 'text-urgency-high' },
                    { label: 'Critical Urgency', value: filteredSyntheticCalls.filter((call) => call.urgencyLevel === 'critical').length, className: 'text-urgency-critical' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/40 bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className={`mt-2 text-2xl font-bold ${item.className}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold mb-4">Dataset Records</h4>
                {filteredSyntheticCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No dataset records match current filters
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{adminCount}</p>
                      <p className="text-sm text-muted-foreground">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userCount}</p>
                      <p className="text-sm text-muted-foreground">Regular Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchUsers}
                disabled={loadingUsers}
              >
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admins Section */}
                <Card className="glass border-border/40 border-l-4 border-l-accent">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-accent">Administrators</CardTitle>
                        <CardDescription>Users with full system access</CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-auto border-accent text-accent">
                        {filteredUsers.filter(u => u.role === 'admin').length} admin{filteredUsers.filter(u => u.role === 'admin').length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredUsers.filter(u => u.role === 'admin').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No administrators found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.filter(u => u.role === 'admin').map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                                    <ShieldCheck className="h-4 w-4 text-accent" />
                                  </div>
                                  {u.full_name || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                {u.is_primary ? (
                                  <Badge className="bg-primary">Primary Admin</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-accent text-accent">Admin</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRoleDialog(u)}
                                  disabled={u.id === user?.id || (u.is_primary && !currentUserIsPrimary)}
                                >
                                  Change Role
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Regular Users Section */}
                <Card className="glass border-border/40 border-l-4 border-l-secondary">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <CardTitle>Regular Users</CardTitle>
                        <CardDescription>Standard users with limited access</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {filteredUsers.filter(u => u.role === 'user').length} user{filteredUsers.filter(u => u.role === 'user').length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredUsers.filter(u => u.role === 'user').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No regular users found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.filter(u => u.role === 'user').map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                    <User className="h-4 w-4 text-secondary-foreground" />
                                  </div>
                                  {u.full_name || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  <User className="h-3 w-3 mr-1" />
                                  User
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRoleDialog(u)}
                                  disabled={u.id === user?.id}
                                >
                                  Change Role
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
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
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>Project contact information for the Emergency Call Analyzer.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Project Contact</p>
                    <h3 className="mt-2 text-2xl font-bold text-primary">SAYYAD FAYAZ BASHA</h3>
                  </div>

                  <a href="mailto:fayaz1234basha@gmail.com" className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-5 py-4 transition-colors hover:border-primary/40">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>fayaz1234basha@gmail.com</span>
                  </a>

                  <a href="tel:+919703029115" className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-5 py-4 transition-colors hover:border-primary/40">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>91 9703029115</span>
                  </a>

                  <a href="https://github.com/sayyadfayazbasha-developer" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border/40 bg-background/50 px-5 py-4 transition-colors hover:border-primary/40">
                    <p className="text-sm text-muted-foreground">GitHub</p>
                    <p className="mt-1 font-medium text-primary break-all">github.com/sayyadfayazbasha-developer</p>
                  </a>

                  <a href="https://www.linkedin.com/in/sayyadfayazbasha-developer/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border/40 bg-background/50 px-5 py-4 transition-colors hover:border-primary/40">
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <p className="mt-1 font-medium text-primary break-all">linkedin.com/in/sayyadfayazbasha-developer</p>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Role Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border/40">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {selectedUser?.role === 'admin' ? (
                  <ShieldCheck className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{selectedUser?.full_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'user')}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPortal;
