import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useNavigate } from 'react-router-dom';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useConfigValidation() {
  const {
    config,
    volumenes,
    parametrosMacro,
    catalogoIngresos,
    simulacionActiva,
    regenerarVolumenes
  } = useSimuladorStore();

  const issues = useMemo(() => {
    const result: ValidationIssue[] = [];

    // 1. Validar que hay catálogo de ingresos
    if (catalogoIngresos.length === 0) {
      result.push({
        type: 'error',
        category: 'Catálogo',
        message: 'No hay productos/servicios configurados en el catálogo de ingresos.'
      });
    }

    // 2. Validar años de configuración
    if (config.añoFin <= config.añoInicio) {
      result.push({
        type: 'error',
        category: 'Configuración',
        message: 'El año de fin debe ser mayor al año de inicio.'
      });
    }

    // 3. Validar capital inicial
    if (config.capitalInicial <= 0) {
      result.push({
        type: 'warning',
        category: 'Configuración',
        message: 'El capital inicial es $0 o negativo. Esto afectará el flujo de caja.'
      });
    }

    // 4. Validar parámetros macro para todos los años
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const paramAño = parametrosMacro.find(p => p.año === año);
      if (!paramAño) {
        result.push({
          type: 'error',
          category: 'Parámetros Macro',
          message: `Faltan parámetros macroeconómicos para el año ${año}.`
        });
      } else {
        // Validar valores razonables
        if (paramAño.inflacionPct < 0 || paramAño.inflacionPct > 50) {
          result.push({
            type: 'warning',
            category: 'Parámetros Macro',
            message: `La inflación para ${año} (${paramAño.inflacionPct}%) parece fuera de rango.`
          });
        }
        if (paramAño.tasaRentaPct < 0 || paramAño.tasaRentaPct > 50) {
          result.push({
            type: 'warning',
            category: 'Parámetros Macro',
            message: `La tasa de renta para ${año} (${paramAño.tasaRentaPct}%) parece fuera de rango.`
          });
        }
        if (paramAño.tasaIVAPct < 0 || paramAño.tasaIVAPct > 25) {
          result.push({
            type: 'warning',
            category: 'Parámetros Macro',
            message: `La tasa de IVA para ${año} (${paramAño.tasaIVAPct}%) parece fuera de rango.`
          });
        }
      }
    }

    // 5. Validar volúmenes para todos los años
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año];
      
      if (!volAño || Object.keys(volAño).length === 0) {
        result.push({
          type: 'error',
          category: 'Volúmenes',
          message: `No hay volúmenes proyectados para el año ${año}.`,
          action: {
            label: 'Regenerar Volúmenes',
            onClick: regenerarVolumenes
          }
        });
      } else {
        // Verificar que al menos algunos SKUs tienen volumen > 0
        const tieneVolumenes = Object.values(volAño).some(skuVol => 
          Object.values(skuVol).some(v => v > 0)
        );
        
        if (!tieneVolumenes) {
          result.push({
            type: 'warning',
            category: 'Volúmenes',
            message: `Todos los volúmenes para ${año} están en cero. No habrá ingresos proyectados.`,
            action: {
              label: 'Regenerar Volúmenes',
              onClick: regenerarVolumenes
            }
          });
        }
      }
    }

    // 6. Validar consistencia de SKUs entre catálogo y volúmenes
    const skusCatalogo = new Set(catalogoIngresos.map(i => i.codigo));
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año];
      if (volAño) {
        const skusVolumen = new Set(Object.keys(volAño));
        
        // SKUs en catálogo sin volumen
        const skusSinVolumen = [...skusCatalogo].filter(sku => !skusVolumen.has(sku));
        if (skusSinVolumen.length > 0 && skusSinVolumen.length < skusCatalogo.size) {
          result.push({
            type: 'info',
            category: 'Consistencia',
            message: `${skusSinVolumen.length} producto(s) del catálogo no tienen volúmenes configurados para ${año}.`
          });
        }
      }
    }

    // 7. Validar mix de pago digital
    if (config.mixPagoDigital < 0 || config.mixPagoDigital > 1) {
      result.push({
        type: 'error',
        category: 'Configuración',
        message: 'El mix de pago digital debe estar entre 0% y 100%.'
      });
    }

    // 8. Validar tasa de churn
    if (config.tasaChurnMensual < 0 || config.tasaChurnMensual > 1) {
      result.push({
        type: 'warning',
        category: 'Configuración',
        message: 'La tasa de churn mensual parece inusual. Verifique el valor.'
      });
    }

    // 9. Advertencia si simulación no está activa
    if (!simulacionActiva) {
      result.push({
        type: 'info',
        category: 'Estado',
        message: 'La simulación no está activa. Inicie la simulación para ver proyecciones.'
      });
    }

    return result;
  }, [config, volumenes, parametrosMacro, catalogoIngresos, simulacionActiva, regenerarVolumenes]);

  const summary = useMemo(() => ({
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    infos: issues.filter(i => i.type === 'info').length,
    isValid: issues.filter(i => i.type === 'error').length === 0
  }), [issues]);

  return { issues, summary };
}

interface ConfigValidationProps {
  showAll?: boolean;
  compact?: boolean;
}

export function ConfigValidation({ showAll = false, compact = false }: ConfigValidationProps) {
  const { issues, summary } = useConfigValidation();
  const navigate = useNavigate();

  if (issues.length === 0) {
    return (
      <Alert className="border-emerald-500/50 bg-emerald-500/10">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <AlertTitle>Configuración válida</AlertTitle>
        <AlertDescription>
          Todos los parámetros están correctamente configurados.
        </AlertDescription>
      </Alert>
    );
  }

  const displayIssues = showAll ? issues : issues.slice(0, 3);
  const hasMore = issues.length > 3 && !showAll;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {summary.errors > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {summary.errors} error{summary.errors > 1 ? 'es' : ''}
          </Badge>
        )}
        {summary.warnings > 0 && (
          <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-700 border-amber-500/50">
            <AlertTriangle className="h-3 w-3" />
            {summary.warnings} advertencia{summary.warnings > 1 ? 's' : ''}
          </Badge>
        )}
        {summary.infos > 0 && (
          <Badge variant="outline" className="gap-1">
            <Info className="h-3 w-3" />
            {summary.infos} info
          </Badge>
        )}
        {!summary.isValid && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/configuracion')}>
            <Settings className="h-3 w-3 mr-1" />
            Configurar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumen */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        {summary.errors > 0 ? (
          <XCircle className="h-5 w-5 text-destructive" />
        ) : summary.warnings > 0 ? (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        ) : (
          <Info className="h-5 w-5 text-blue-500" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {summary.errors > 0 
              ? `${summary.errors} error${summary.errors > 1 ? 'es' : ''} encontrado${summary.errors > 1 ? 's' : ''}`
              : summary.warnings > 0
              ? `${summary.warnings} advertencia${summary.warnings > 1 ? 's' : ''}`
              : `${summary.infos} nota${summary.infos > 1 ? 's' : ''} informativa${summary.infos > 1 ? 's' : ''}`
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.isValid 
              ? 'La configuración es válida pero hay aspectos a revisar.'
              : 'Corrija los errores antes de generar proyecciones.'
            }
          </p>
        </div>
        {!summary.isValid && (
          <Button variant="outline" size="sm" onClick={() => navigate('/configuracion')}>
            <Settings className="h-4 w-4 mr-2" />
            Ir a Configuración
          </Button>
        )}
      </div>

      {/* Lista de issues */}
      <div className="space-y-2">
        {displayIssues.map((issue, idx) => (
          <Alert 
            key={idx}
            className={
              issue.type === 'error' 
                ? 'border-destructive/50 bg-destructive/10' 
                : issue.type === 'warning'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-blue-500/50 bg-blue-500/10'
            }
          >
            {issue.type === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
            {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {issue.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
            <AlertTitle className="text-sm flex items-center gap-2">
              {issue.category}
              <Badge variant="outline" className="text-xs font-normal">
                {issue.type === 'error' ? 'Error' : issue.type === 'warning' ? 'Advertencia' : 'Info'}
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-sm flex items-center justify-between">
              <span>{issue.message}</span>
              {issue.action && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={issue.action.onClick}
                  className="ml-2 shrink-0"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {issue.action.label}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {hasMore && (
        <p className="text-xs text-muted-foreground text-center">
          +{issues.length - 3} problemas adicionales
        </p>
      )}
    </div>
  );
}

export function ValidationBadge() {
  const { summary } = useConfigValidation();

  if (summary.errors === 0 && summary.warnings === 0) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        OK
      </Badge>
    );
  }

  if (summary.errors > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        {summary.errors} error{summary.errors > 1 ? 'es' : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-700">
      <AlertTriangle className="h-3 w-3" />
      {summary.warnings}
    </Badge>
  );
}
