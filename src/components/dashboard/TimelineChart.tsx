import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { timeSeriesData } from '@/data/sampleData';

export function TimelineChart() {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '500ms' }}>
      <h3 className="text-lg font-semibold mb-2">Call Volume & Urgency Timeline</h3>
      <p className="text-sm text-muted-foreground mb-4">Hourly call distribution with average urgency</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(173 80% 50%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(173 80% 50%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUrgency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262 80% 60%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(262 80% 60%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              tickLine={false}
            />
            <YAxis 
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
            />
            <Area 
              type="monotone" 
              dataKey="calls" 
              stroke="hsl(173 80% 50%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCalls)" 
              name="Calls"
            />
            <Area 
              type="monotone" 
              dataKey="avgUrgency" 
              stroke="hsl(262 80% 60%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorUrgency)" 
              name="Avg Urgency"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
