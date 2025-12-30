import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCOP, formatPercent, formatNumber } from '@/lib/formatters';

type FormatType = 'currency' | 'percentage' | 'number' | 'ratio' | 'months';
type StatusType = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
type SizeType = 'sm' | 'md' | 'lg';

interface AlertThreshold {
  warning: number;
  critical: number;
  direction: 'above' | 'below';
}

interface KPICardInstitutionalProps {
  title: string;
  value: number | null | undefined;
  format?: FormatType;
  currency?: 'COP' | 'USD';
  previousValue?: number;
  previousPeriod?: string;
  target?: number;
  benchmark?: number;
  benchmarkLabel?: string;
  alertThreshold?: AlertThreshold;
  tooltip?: string;
  size?: SizeType;
  icon?: ReactNode;
  className?: string;
  showTrend?: boolean;
  compact?: boolean;
}

function formatValue(
  value: number | null | undefined, 
  format: FormatType,
  currency: 'COP' | 'USD' = 'COP'
): string {
  if (value === null || value === undefined) return '—';
  
  switch (format) {
    case 'currency':
      if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Math.round(value));
      }
      return formatCOP(value);
    case 'percentage':
      return formatPercent(value, 1);
    case 'ratio':
      return `${value.toFixed(2)}x`;
    case 'months':
      if (value >= 999) return '∞';
      return `${value.toFixed(1)} meses`;
    case 'number':
    default:
      return formatNumber(value);
  }
}

function getStatus(
  value: number | null | undefined,
  threshold?: AlertThreshold,
  benchmark?: number
): StatusType {
  if (value === null || value === undefined) return 'neutral';
  
  if (threshold) {
    const { warning, critical, direction } = threshold;
    if (direction === 'below') {
      if (value <= critical) return 'danger';
      if (value <= warning) return 'warning';
      return 'success';
    } else {
      if (value >= critical) return 'danger';
      if (value >= warning) return 'warning';
      return 'success';
    }
  }
  
  if (benchmark !== undefined) {
    if (value >= benchmark) return 'success';
    if (value >= benchmark * 0.7) return 'warning';
    return 'danger';
  }
  
  return 'neutral';
}

function calculateTrend(current?: number, previous?: number): { 
  value: number; 
  direction: 'up' | 'down' | 'flat';
} | null {
  if (current === undefined || previous === undefined || previous === 0) {
    return null;
  }
  
  const change = ((current - previous) / Math.abs(previous)) * 100;
  
  return {
    value: Math.abs(change),
    direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat'
  };
}

export function KPICardInstitutional({
  title,
  value,
  format = 'number',
  currency = 'COP',
  previousValue,
  previousPeriod = 'mes anterior',
  target,
  benchmark,
  benchmarkLabel,
  alertThreshold,
  tooltip,
  size = 'md',
  icon,
  className,
  showTrend = true,
  compact = false,
}: KPICardInstitutionalProps) {
  const status = getStatus(value, alertThreshold, benchmark);
  const trend = showTrend ? calculateTrend(value ?? undefined, previousValue) : null;
  const progressToTarget = target && value ? Math.min((value / target) * 100, 100) : null;

  const sizeClasses = {
    sm: 'finance-stat-sm',
    md: 'finance-stat-md',
    lg: 'finance-stat-lg',
  };

  const statusBorderClasses = {
    success: 'kpi-status-success',
    warning: 'kpi-status-warning',
    danger: 'kpi-status-danger',
    neutral: 'kpi-status-neutral',
    info: 'kpi-status-info',
  };

  const statusTextClasses = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    neutral: 'text-foreground',
    info: 'text-info',
  };

  const statusBgClasses = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-info/10 text-info',
  };

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColorClass = trend?.direction === 'up' 
    ? 'text-success' 
    : trend?.direction === 'down' 
      ? 'text-destructive' 
      : 'text-muted-foreground';

  return (
    <div 
      className={cn(
        compact ? 'kpi-card-compact' : 'kpi-card',
        statusBorderClasses[status],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title with optional tooltip */}
          <div className="flex items-center gap-1.5 mb-2">
            <p className="finance-label truncate">{title}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Value */}
          <p className={cn(
            sizeClasses[size],
            statusTextClasses[status],
            'font-mono-numbers'
          )}>
            {formatValue(value, format, currency)}
          </p>

          {/* Benchmark comparison */}
          {benchmark !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {benchmarkLabel || 'Benchmark'}: {formatValue(benchmark, format, currency)}
            </p>
          )}

          {/* Progress to target */}
          {progressToTarget !== null && target && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Meta: {formatValue(target, format, currency)}</span>
                <span>{progressToTarget.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progressToTarget >= 100 ? 'bg-success' : 
                    progressToTarget >= 70 ? 'bg-warning' : 'bg-destructive'
                  )}
                  style={{ width: `${progressToTarget}%` }}
                />
              </div>
            </div>
          )}

          {/* Trend indicator */}
          {trend && !compact && (
            <div className="mt-3 flex items-center gap-1.5">
              <TrendIcon className={cn('h-4 w-4', trendColorClass)} />
              <span className={cn('text-sm font-medium', trendColorClass)}>
                {trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs {previousPeriod}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={cn(
            'p-2.5 rounded-lg flex-shrink-0',
            statusBgClasses[status]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience variants
export function KPICurrency(props: Omit<KPICardInstitutionalProps, 'format'>) {
  return <KPICardInstitutional {...props} format="currency" />;
}

export function KPIPercentage(props: Omit<KPICardInstitutionalProps, 'format'>) {
  return <KPICardInstitutional {...props} format="percentage" />;
}

export function KPIRatio(props: Omit<KPICardInstitutionalProps, 'format'>) {
  return <KPICardInstitutional {...props} format="ratio" />;
}

export function KPIRunway(props: Omit<KPICardInstitutionalProps, 'format' | 'alertThreshold'>) {
  return (
    <KPICardInstitutional 
      {...props} 
      format="months"
      alertThreshold={{ warning: 12, critical: 6, direction: 'below' }}
      tooltip="Meses de operación restantes con el burn rate actual"
    />
  );
}
