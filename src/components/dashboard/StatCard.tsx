import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'success';
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: 'border-border/50',
  primary: 'border-primary/30 glow-primary',
  accent: 'border-accent/30 glow-accent',
  warning: 'border-urgency-high/30',
  success: 'border-urgency-low/30',
};

const iconVariantStyles = {
  default: 'bg-secondary text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  accent: 'bg-accent/20 text-accent',
  warning: 'bg-urgency-high/20 text-urgency-high',
  success: 'bg-urgency-low/20 text-urgency-low',
};

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <div 
      className={cn(
        "glass rounded-xl p-6 border transition-all duration-300 hover:scale-[1.02] animate-slide-up",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend.isPositive ? "text-urgency-low" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
