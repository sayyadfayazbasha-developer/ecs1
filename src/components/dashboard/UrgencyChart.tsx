import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { urgencyDistribution } from '@/data/sampleData';

interface UrgencyChartProps {
  data?: { name: string; value: number; color: string }[];
}

export function UrgencyChart({ data = urgencyDistribution }: UrgencyChartProps) {
  // Filter out zero values for better visualization
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold mb-4">Urgency Distribution</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data matches current filters
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold mb-4">Urgency Distribution</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              stroke="transparent"
              animationDuration={500}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              formatter={(value: number) => [`${value} calls`, 'Count']}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
