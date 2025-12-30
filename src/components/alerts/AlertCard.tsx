import { Alerta } from '@/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AlertCardProps {
  alerta: Alerta;
  compact?: boolean;
}

export function AlertCard({ alerta, compact = false }: AlertCardProps) {
  const severityConfig = {
    CRITICA: {
      icon: AlertTriangle,
      bgClass: 'bg-destructive/5 border-destructive/20',
      textClass: 'text-destructive',
      badgeClass: 'bg-destructive text-destructive-foreground',
    },
    ALTA: {
      icon: AlertCircle,
      bgClass: 'bg-warning/5 border-warning/20',
      textClass: 'text-warning',
      badgeClass: 'bg-warning text-warning-foreground',
    },
    MEDIA: {
      icon: Info,
      bgClass: 'bg-accent/5 border-accent/20',
      textClass: 'text-accent',
      badgeClass: 'bg-accent text-accent-foreground',
    },
  };

  const config = severityConfig[alerta.severidad];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        config.bgClass
      )}>
        <Icon className={cn("h-4 w-4 flex-shrink-0", config.textClass)} />
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {alerta.titulo}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all hover:shadow-md",
      config.bgClass
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bgClass)}>
          <Icon className={cn("h-5 w-5", config.textClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-[10px] font-semibold uppercase", config.badgeClass)}>
              {alerta.severidad}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {alerta.categoria}
            </Badge>
          </div>
          
          <h4 className="font-semibold text-foreground mb-1">{alerta.titulo}</h4>
          <p className="text-sm text-muted-foreground mb-3">{alerta.descripcion}</p>
          
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Actual: </span>
              <span className={cn("font-semibold", config.textClass)}>
                {typeof alerta.valor_actual === 'number' 
                  ? alerta.valor_actual.toLocaleString('es-CO') 
                  : alerta.valor_actual}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Benchmark: </span>
              <span className="font-semibold text-foreground">
                {alerta.benchmark.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground">
              💡 {alerta.accion_recomendada}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
