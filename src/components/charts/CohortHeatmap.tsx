import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, TrendingUp, Info } from 'lucide-react';

interface CohortData {
  cohortMonth: string;
  cohortLabel: string;
  initialUsers: number;
  retentionByMonth: number[]; // Percentages 0-100
}

// Generate sample cohort data based on simulation config
function generateCohortData(churnRate: number, months: number = 12): CohortData[] {
  const cohorts: CohortData[] = [];
  const baseRetention = 1 - churnRate;
  
  for (let i = 0; i < Math.min(months, 12); i++) {
    const cohortDate = new Date(2026, i, 1);
    const cohortLabel = cohortDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const initialUsers = Math.floor(100 + Math.random() * 150);
    
    const retentionByMonth: number[] = [];
    let currentRetention = 100;
    
    for (let m = 0; m < months - i; m++) {
      if (m === 0) {
        retentionByMonth.push(100);
      } else {
        // Add some variance to make it realistic
        const variance = (Math.random() - 0.5) * 5;
        currentRetention = Math.max(0, currentRetention * (baseRetention + variance / 100));
        retentionByMonth.push(Math.round(currentRetention * 10) / 10);
      }
    }
    
    cohorts.push({
      cohortMonth: `2026-${String(i + 1).padStart(2, '0')}`,
      cohortLabel,
      initialUsers,
      retentionByMonth,
    });
  }
  
  return cohorts;
}

// Get color based on retention percentage
function getRetentionColor(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-500/90 text-white';
  if (percentage >= 60) return 'bg-emerald-400/80 text-white';
  if (percentage >= 40) return 'bg-amber-400/80 text-foreground';
  if (percentage >= 20) return 'bg-orange-400/80 text-white';
  return 'bg-red-500/80 text-white';
}

function getRetentionBgOpacity(percentage: number): string {
  const opacity = Math.max(0.2, percentage / 100);
  if (percentage >= 80) return `rgba(16, 185, 129, ${opacity})`;
  if (percentage >= 60) return `rgba(52, 211, 153, ${opacity})`;
  if (percentage >= 40) return `rgba(251, 191, 36, ${opacity})`;
  if (percentage >= 20) return `rgba(251, 146, 60, ${opacity})`;
  return `rgba(239, 68, 68, ${opacity})`;
}

interface CohortHeatmapProps {
  className?: string;
  maxMonths?: number;
}

export function CohortHeatmap({ className, maxMonths = 12 }: CohortHeatmapProps) {
  const { config, simulacionActiva } = useSimuladorStore();
  
  const cohortData = useMemo(() => {
    const churnRate = config.tasaChurnMensual || 0.05;
    return generateCohortData(churnRate, maxMonths);
  }, [config.tasaChurnMensual, maxMonths]);
  
  // Calculate column averages (average retention for each month across all cohorts)
  const columnAverages = useMemo(() => {
    const averages: number[] = [];
    for (let month = 0; month < maxMonths; month++) {
      const values = cohortData
        .filter(c => c.retentionByMonth[month] !== undefined)
        .map(c => c.retentionByMonth[month]);
      
      if (values.length > 0) {
        averages.push(Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10);
      }
    }
    return averages;
  }, [cohortData, maxMonths]);
  
  // Calculate row averages (average retention for each cohort)
  const rowAverages = useMemo(() => {
    return cohortData.map(cohort => {
      const values = cohort.retentionByMonth.filter(v => v !== undefined);
      if (values.length === 0) return 0;
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    });
  }, [cohortData]);
  
  // Overall average
  const overallAverage = useMemo(() => {
    if (rowAverages.length === 0) return 0;
    return Math.round((rowAverages.reduce((a, b) => a + b, 0) / rowAverages.length) * 10) / 10;
  }, [rowAverages]);

  if (!simulacionActiva) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            Inicia una simulación para ver el análisis de cohortes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Análisis de Cohortes
            </CardTitle>
            <CardDescription className="mt-1">
              Retención mensual por cohorte de adquisición
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Churn: {((config.tasaChurnMensual || 0.05) * 100).toFixed(1)}%
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-muted">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Cada fila representa una cohorte de usuarios que se adquirieron en un mes específico.
                  Las columnas muestran el % de retención en cada mes posterior.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <span className="text-muted-foreground">Retención:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-emerald-500/90" />
            <span>&gt;80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-emerald-400/80" />
            <span>60-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-400/80" />
            <span>40-60%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-400/80" />
            <span>20-40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500/80" />
            <span>&lt;20%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[100px]">
                  Cohorte
                </th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[60px]">
                  Usuarios
                </th>
                {Array.from({ length: maxMonths }, (_, i) => (
                  <th key={i} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[52px]">
                    M{i}
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground bg-muted/50 min-w-[60px]">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((cohort, rowIndex) => (
                <tr key={cohort.cohortMonth} className="border-t border-border/50">
                  <td className="py-1.5 px-3 font-medium sticky left-0 bg-card z-10">
                    {cohort.cohortLabel}
                  </td>
                  <td className="text-center py-1.5 px-2 text-muted-foreground font-mono text-xs">
                    {cohort.initialUsers}
                  </td>
                  {Array.from({ length: maxMonths }, (_, monthIndex) => {
                    const retention = cohort.retentionByMonth[monthIndex];
                    const hasValue = retention !== undefined;
                    
                    return (
                      <td key={monthIndex} className="text-center py-1 px-1">
                        {hasValue ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "inline-flex items-center justify-center w-full h-8 rounded text-xs font-mono font-medium transition-all hover:scale-105",
                                  getRetentionColor(retention)
                                )}
                              >
                                {retention.toFixed(0)}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                <span className="font-medium">{cohort.cohortLabel}</span> - Mes {monthIndex}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Retención: {retention.toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Usuarios activos: ~{Math.round(cohort.initialUsers * retention / 100)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="w-full h-8 rounded bg-muted/30" />
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 px-2 bg-muted/50">
                    <span className="font-mono text-xs font-medium">
                      {rowAverages[rowIndex].toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Column Averages Row */}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-2 px-3 font-medium sticky left-0 bg-muted/30 z-10">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Promedio
                  </span>
                </td>
                <td className="text-center py-2 px-2 text-muted-foreground font-mono text-xs">
                  —
                </td>
                {columnAverages.map((avg, i) => (
                  <td key={i} className="text-center py-1.5 px-1">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-full h-8 rounded text-xs font-mono font-semibold",
                        getRetentionColor(avg)
                      )}
                    >
                      {avg.toFixed(0)}%
                    </div>
                  </td>
                ))}
                <td className="text-center py-2 px-2 bg-primary/10">
                  <span className="font-mono text-sm font-bold text-primary">
                    {overallAverage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {overallAverage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Retención Promedio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {cohortData.length}
            </p>
            <p className="text-xs text-muted-foreground">Cohortes Analizadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {columnAverages[1]?.toFixed(1) || '—'}%
            </p>
            <p className="text-xs text-muted-foreground">Retención M1</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {columnAverages[6]?.toFixed(1) || '—'}%
            </p>
            <p className="text-xs text-muted-foreground">Retención M6</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard
export function CohortHeatmapMini({ className }: { className?: string }) {
  const { config, simulacionActiva } = useSimuladorStore();
  
  const cohortData = useMemo(() => {
    const churnRate = config.tasaChurnMensual || 0.05;
    return generateCohortData(churnRate, 6).slice(0, 4);
  }, [config.tasaChurnMensual]);

  if (!simulacionActiva) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Cohort Preview</span>
        <span className="text-muted-foreground text-xs">Últimos 4 meses</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Header */}
        <div className="text-[10px] text-muted-foreground">Cohort</div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="text-[10px] text-center text-muted-foreground">M{i}</div>
        ))}
        
        {/* Data */}
        {cohortData.map((cohort) => (
          <React.Fragment key={cohort.cohortMonth}>
            <div className="text-[10px] font-medium truncate">{cohort.cohortLabel}</div>
            {Array.from({ length: 6 }, (_, i) => {
              const retention = cohort.retentionByMonth[i];
              return (
                <div
                  key={i}
                  className={cn(
                    "h-5 rounded-sm text-[9px] flex items-center justify-center font-mono",
                    retention !== undefined ? getRetentionColor(retention) : "bg-muted/30"
                  )}
                >
                  {retention !== undefined ? `${retention.toFixed(0)}` : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default CohortHeatmap;
