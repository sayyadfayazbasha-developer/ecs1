import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  BarChart3, 
  Brain, 
  ChevronRight, 
  Database, 
  HelpCircle, 
  LogIn, 
  Mail, 
  Phone, 
  ShieldCheck, 
  UserPlus,
  Zap,
  User
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">ECA</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/auth?portal=user">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  User Login
                </Button>
              </Link>
              <Link to="/auth?portal=admin">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-8">
            <Zap className="h-4 w-4" />
            AI-Powered Emergency Analysis
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            <span className="gradient-text">Sentiment Analysis</span>
            <br />
            <span className="text-foreground">for Emergency Calls</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Advanced MEDLDA and JST models combined with SVM classification to analyze 
            emotional distress, urgency levels, and extract actionable insights from 
            emergency communications.
          </p>

          {/* Portal Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
            {/* User Portal Card */}
            <div className="p-8 rounded-2xl glass border border-border/40 hover:border-primary/40 transition-all hover:scale-[1.02] group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">User Portal</h3>
              <p className="text-muted-foreground mb-6">
                Make emergency calls, manage contacts, and track your call history with detailed analysis
              </p>
              <div className="space-y-3">
                <Link to="/auth?portal=user&mode=login">
                  <Button className="w-full" size="lg">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to User Portal
                  </Button>
                </Link>
                <Link to="/auth?portal=user&mode=register">
                  <Button variant="outline" className="w-full" size="lg">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register as User
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="p-8 rounded-2xl glass border border-border/40 hover:border-accent/40 transition-all hover:scale-[1.02] group">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Portal</h3>
              <p className="text-muted-foreground mb-6">
                Access datasets, analytics, user management, and comprehensive system controls
              </p>
              <div className="space-y-3">
                <Link to="/auth?portal=admin&mode=login">
                  <Button variant="secondary" className="w-full" size="lg">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Login as Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '95%', label: 'Model Accuracy' },
              { value: '50+', label: 'Sample Transcripts' },
              { value: '3', label: 'Sentiment Classes' },
              { value: '4', label: 'Urgency Levels' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Details Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div className="rounded-3xl border border-border/40 glass p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
                <Brain className="h-4 w-4" />
                Academic Project Overview
              </div>

              <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">
                Sentiment Analysis in Emergency Calls
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For exploring Natural Language Processing for enhanced calling systems.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/40 bg-background/60 p-5">
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-semibold">Computer Science Engineering</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-5">
                  <p className="text-sm text-muted-foreground mb-1">Academic Year</p>
                  <p className="font-semibold">2026</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 glass p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent mb-6">
                <UserPlus className="h-4 w-4" />
                Project Team
              </div>

              <div className="space-y-4">
                {[
                  { id: '229F1A0549', name: 'Sayyad Fayaz Basha', role: 'Team Leader' },
                  { id: '229F1A0502', name: 'A Saisagar' },
                  { id: '229F1A0557', name: 'Suruvu Naresh Babu' },
                  { id: '229F1A0561', name: 'Uppara Manjunath' },
                  { id: '229F1A0558', name: 'T Manideep Sai' },
                  { id: '229F1A0563', name: 'Veldurthi Sainatha Reddy' }
                ].map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors ${
                      member.role === 'Team Leader'
                        ? 'border-primary/50 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
                        : 'border-border/40 bg-background/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{member.name}</p>
                        {member.role === 'Team Leader' && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                            Team Leader
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.role ?? 'Team Member'}</p>
                    </div>
                    <div className="text-sm font-medium text-primary">{member.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institution Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-border/40 glass p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
              <ShieldCheck className="h-4 w-4" />
              Institution
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Sri Venkateshwara Institute of Technology
            </h2>
            <p className="text-xl font-semibold mb-3">UGC - Autonomous</p>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              N.H 44, Hampapuram, Rapthadu, Andhra Pradesh
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Powerful Analysis Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines state-of-the-art NLP techniques with intuitive visualizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'JST Model',
                description: 'Joint Sentiment-Topic modeling to extract emotional polarity and thematic topics simultaneously'
              },
              {
                icon: Activity,
                title: 'MEDLDA Classification',
                description: 'Maximum Entropy Discrimination LDA with SVM for robust urgency classification'
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Interactive dashboards showing sentiment distribution, urgency metrics, and topic word clouds'
              },
              {
                icon: Database,
                title: 'Synthetic Dataset',
                description: '50 carefully crafted emergency call transcripts with varied emotional tones and incident types'
              },
              {
                icon: ShieldCheck,
                title: 'Role-based Access',
                description: 'Secure admin and user portals with different access levels and capabilities'
              },
              {
                icon: Zap,
                title: 'Fast Processing',
                description: 'Optimized preprocessing pipeline with stemming, stop word removal, and n-gram analysis'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl glass border border-border/40 hover:border-primary/40 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-display font-semibold">Emergency Call Analyzer</span>
              <p className="text-sm text-muted-foreground">© 2026 B.Tech Project - Sentiment Analysis in Emergency Calls</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground md:text-right space-y-1">
            <p className="font-medium text-foreground">SAYYAD FAYAZ BASHA</p>
            <p>fayaz1234basha@gmail.com</p>
            <p>91 9703029115</p>
            <p>
              GitHub: <a href="https://github.com/sayyadfayazbasha-developer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sayyadfayazbasha-developer</a>
            </p>
            <p>
              LinkedIn: <a href="https://www.linkedin.com/in/sayyadfayazbasha-developer/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sayyadfayazbasha-developer</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
