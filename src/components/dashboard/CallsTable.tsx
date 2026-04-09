import { useState } from 'react';
import { emergencyCalls, EmergencyCall } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CallDetailModal } from './CallDetailModal';
import { ChevronRight } from 'lucide-react';

const urgencyColors = {
  critical: 'bg-urgency-critical/20 text-urgency-critical border-urgency-critical/30',
  high: 'bg-urgency-high/20 text-urgency-high border-urgency-high/30',
  medium: 'bg-urgency-medium/20 text-urgency-medium border-urgency-medium/30',
  low: 'bg-urgency-low/20 text-urgency-low border-urgency-low/30',
};

const sentimentColors = {
  negative: 'bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30',
  neutral: 'bg-sentiment-neutral/20 text-sentiment-neutral border-sentiment-neutral/30',
  positive: 'bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30',
};

export function CallsTable() {
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCallClick = (call: EmergencyCall) => {
    setSelectedCall(call);
    setModalOpen(true);
  };

  return (
    <>
      <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '600ms' }}>
        <h3 className="text-lg font-semibold mb-4">Recent Emergency Calls</h3>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {emergencyCalls.map((call, index) => (
              <div 
                key={call.id}
                onClick={() => handleCallClick(call)}
                className="p-4 rounded-lg bg-secondary/50 border border-border/30 hover:bg-secondary/80 hover:border-primary/30 transition-all cursor-pointer group"
                style={{ animationDelay: `${600 + index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm text-foreground line-clamp-2 flex-1">{call.text}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn('text-xs border', urgencyColors[call.urgency])}>
                      {call.urgency}
                    </Badge>
                    <Badge className={cn('text-xs border', sentimentColors[call.sentiment])}>
                      {call.sentiment}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-mono">Score: {call.sentimentScore.toFixed(2)}</span>
                  <span>•</span>
                  <span>Topics: {call.topics.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <CallDetailModal 
        call={selectedCall}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
