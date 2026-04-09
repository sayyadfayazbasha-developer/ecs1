import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { UrgencyChart } from '@/components/dashboard/UrgencyChart';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { WordCloud } from '@/components/dashboard/WordCloud';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { CallsTable } from '@/components/dashboard/CallsTable';
import { ModelMetrics } from '@/components/dashboard/ModelMetrics';
import { emergencyCalls, modelMetrics } from '@/data/sampleData';
import { Phone, AlertTriangle, TrendingDown, Target } from 'lucide-react';

const Index = () => {
  const totalCalls = emergencyCalls.length;
  const criticalCalls = emergencyCalls.filter(c => c.urgency === 'critical').length;
  const avgSentiment = modelMetrics.meanSentiment;
  const accuracy = modelMetrics.accuracy;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Calls Analyzed"
            value={totalCalls}
            subtitle="Emergency transcripts processed"
            icon={Phone}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Critical Urgency"
            value={criticalCalls}
            subtitle="Immediate response required"
            icon={AlertTriangle}
            variant="warning"
            delay={50}
          />
          <StatCard
            title="Avg Sentiment Score"
            value={avgSentiment.toFixed(2)}
            subtitle="Range: -1 to +1"
            icon={TrendingDown}
            variant="default"
            delay={100}
          />
          <StatCard
            title="Model Accuracy"
            value={`${(accuracy * 100).toFixed(1)}%`}
            subtitle="SVM classifier performance"
            icon={Target}
            variant="success"
            delay={150}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <UrgencyChart />
          <SentimentChart />
          <ModelMetrics />
        </div>

        {/* Word Cloud and Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WordCloud />
          <TimelineChart />
        </div>

        {/* Calls Table */}
        <CallsTable />
        
        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            B.Tech Project: Sentiment Analysis in Emergency Calls using MEDLDA & JST Models
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            SVM Classifier with Maximum Entropy Discrimination
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
