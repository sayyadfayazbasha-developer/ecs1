import { modelMetrics } from '@/data/sampleData';
import { Progress } from '@/components/ui/progress';

export function ModelMetrics() {
  const metrics = [
    { label: 'Accuracy', value: modelMetrics.accuracy, color: 'bg-primary' },
    { label: 'Precision', value: modelMetrics.precision, color: 'bg-accent' },
    { label: 'Recall', value: modelMetrics.recall, color: 'bg-urgency-medium' },
    { label: 'F1 Score', value: modelMetrics.f1Score, color: 'bg-urgency-low' },
  ];

  return (
    <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-mono font-medium">{(metric.value * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${metric.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${metric.value * 100}%`,
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border/50">
        <h4 className="text-sm font-medium mb-3">Sentiment Distribution</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-sentiment-negative/10 border border-sentiment-negative/20">
            <p className="text-2xl font-bold text-sentiment-negative">{(modelMetrics.negativeRatio * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sentiment-neutral/10 border border-sentiment-neutral/20">
            <p className="text-2xl font-bold text-sentiment-neutral">{(modelMetrics.neutralRatio * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sentiment-positive/10 border border-sentiment-positive/20">
            <p className="text-2xl font-bold text-sentiment-positive">{(modelMetrics.positiveRatio * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
