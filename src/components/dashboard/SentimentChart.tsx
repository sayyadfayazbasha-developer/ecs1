import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { emergencyCalls, EmergencyCall } from '@/data/sampleData';

interface SentimentChartProps {
  data?: EmergencyCall[];
}

export function SentimentChart({ data = emergencyCalls }: SentimentChartProps) {
  const sentimentData = data.map((call, index) => ({
    id: index + 1,
    score: call.sentimentScore,
    urgency: call.urgency,
  }));

  const getBarColor = (score: number) => {
    if (score > 0.1) return 'hsl(142, 70%, 45%)';
    if (score < -0.5) return 'hsl(0, 72%, 55%)';
    if (score < -0.1) return 'hsl(25, 95%, 55%)';
    return 'hsl(220, 15%, 50%)';
  };

  if (sentimentData.length === 0) {
    return (
      <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold mb-2">Sentiment Scores by Call</h3>
        <p className="text-sm text-muted-foreground mb-4">Score range: -1 (negative) to +1 (positive)</p>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
          No data matches current filters
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-semibold mb-2">Sentiment Scores by Call</h3>
      <p className="text-sm text-muted-foreground mb-4">Score range: -1 (negative) to +1 (positive)</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="id" 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              tickLine={false}
            />
            <YAxis 
              domain={[-1, 1]}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              formatter={(value: number) => [value.toFixed(2), 'Sentiment']}
              labelFormatter={(label) => `Call #${label}`}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} animationDuration={500}>
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
