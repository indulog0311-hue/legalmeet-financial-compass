import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  status = 'neutral',
  className 
}: KPICardProps) {
  const statusStyles = {
    success: 'border-l-success',
    warning: 'border-l-warning',
    danger: 'border-l-destructive',
    neutral: 'border-l-muted-foreground',
  };

  return (
    <div 
      className={cn(
        "kpi-card border-l-4",
        statusStyles[status],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="finance-label">{title}</p>
          <p className={cn(
            "finance-stat",
            status === 'success' && 'text-success',
            status === 'warning' && 'text-warning',
            status === 'danger' && 'text-destructive'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2.5 rounded-lg",
            status === 'success' && 'bg-success/10 text-success',
            status === 'warning' && 'bg-warning/10 text-warning',
            status === 'danger' && 'bg-destructive/10 text-destructive',
            status === 'neutral' && 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
