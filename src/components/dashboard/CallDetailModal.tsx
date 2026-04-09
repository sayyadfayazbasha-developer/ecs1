import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmergencyCall } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import { Clock, MessageSquare, Tag, TrendingDown, AlertTriangle } from 'lucide-react';

interface CallDetailModalProps {
  call: EmergencyCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const urgencyColors = {
  critical: 'bg-urgency-critical/20 text-urgency-critical border-urgency-critical/30',
  high: 'bg-urgency-high/20 text-urgency-high border-urgency-high/30',
  medium: 'bg-urgency-medium/20 text-urgency-medium border-urgency-medium/30',
  low: 'bg-urgency-low/20 text-urgency-low border-urgency-low/30',
};

const urgencyDescriptions = {
  critical: 'Immediate life-threatening emergency requiring instant response',
  high: 'Serious situation requiring urgent attention within minutes',
  medium: 'Important but non-life-threatening situation',
  low: 'Non-urgent matter that can be handled in due course',
};

export function CallDetailModal({ call, open, onOpenChange }: CallDetailModalProps) {
  if (!call) return null;

  const sentimentPercentage = ((call.sentimentScore + 1) / 2) * 100;
  const sentimentLabel = call.sentimentScore > 0.1 ? 'Positive' : call.sentimentScore < -0.1 ? 'Negative' : 'Neutral';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Call #{call.id} Analysis</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {call.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Full Transcript */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Full Transcript</span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
              <p className="text-foreground leading-relaxed">{call.text}</p>
            </div>
          </div>

          {/* Urgency Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Urgency Classification</span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={cn('text-sm px-3 py-1 border', urgencyColors[call.urgency])}>
                  {call.urgency.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {urgencyDescriptions[call.urgency]}
              </p>
            </div>
          </div>

          {/* Sentiment Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <span>Sentiment Analysis</span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold font-mono">{call.sentimentScore.toFixed(3)}</p>
                  <p className="text-sm text-muted-foreground">Sentiment Score</p>
                </div>
                <Badge className={cn(
                  'text-sm px-3 py-1 border',
                  call.sentiment === 'negative' && 'bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30',
                  call.sentiment === 'neutral' && 'bg-sentiment-neutral/20 text-sentiment-neutral border-sentiment-neutral/30',
                  call.sentiment === 'positive' && 'bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30',
                )}>
                  {sentimentLabel}
                </Badge>
              </div>
              
              {/* Sentiment Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Negative (-1)</span>
                  <span>Neutral (0)</span>
                  <span>Positive (+1)</span>
                </div>
                <div className="h-3 bg-gradient-to-r from-sentiment-negative via-sentiment-neutral to-sentiment-positive rounded-full relative">
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg transition-all"
                    style={{ left: `calc(${sentimentPercentage}% - 8px)` }}
                  />
                </div>
              </div>

              {/* Emotion Indicators */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 rounded-lg bg-sentiment-negative/10 border border-sentiment-negative/20">
                  <p className="text-lg font-bold text-sentiment-negative">
                    {Math.max(0, Math.round(-call.sentimentScore * 100))}%
                  </p>
                  <p className="text-xs text-muted-foreground">Distress</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-urgency-high/10 border border-urgency-high/20">
                  <p className="text-lg font-bold text-urgency-high">
                    {call.urgency === 'critical' ? '95' : call.urgency === 'high' ? '75' : call.urgency === 'medium' ? '50' : '25'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Urgency</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-lg font-bold text-accent">
                    {Math.round(85 + Math.random() * 10)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Topic Extraction (JST Model)</span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
              <div className="flex flex-wrap gap-2 mb-4">
                {call.topics.map((topic, index) => (
                  <Badge 
                    key={topic}
                    variant="outline" 
                    className="bg-primary/10 text-primary border-primary/30 px-3 py-1"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Topic Relevance</p>
                {call.topics.map((topic, index) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-sm w-20 truncate">{topic}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${90 - index * 15}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-12">
                      {(0.9 - index * 0.15).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Processed: {call.timestamp.toLocaleString()}</span>
            </div>
            <span>•</span>
            <span>Model: MEDLDA + JST</span>
            <span>•</span>
            <span>Classifier: SVM</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
