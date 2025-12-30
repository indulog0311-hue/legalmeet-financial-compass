import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ejecutarDiagnosticoUnitario,
  DiagnosticoUnitario,
  PasoFlujo
} from '@/lib/calculations/diagnosticoFinanciero';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Calculator,
  FileSearch,
  Zap,
  Shield
} from 'lucide-react';

export default function DiagnosticoFinanciero() {
  const [mixDigital, setMixDigital] = useState(40); // 40% digital, 60% rural
  const [ejecutado, setEjecutado] = useState(false);

  const diagnostico = useMemo(() => {
    if (!ejecutado) return null;
    return ejecutarDiagnosticoUnitario('ING-001', 1, mixDigital / 100);
  }, [mixDigital, ejecutado]);

  const ejecutarAnalisis = () => {
    setEjecutado(true);
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'CRITICA': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'ALTA': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIA': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getTipoIcon = (tipo: PasoFlujo['tipo']) => {
    switch (tipo) {
      case 'entrada': return <ArrowDown className="h-4 w-4 text-green-400" />;
      case 'salida': return <ArrowUp className="h-4 w-4 text-red-400" />;
      case 'impuesto': return <Shield className="h-4 w-4 text-orange-400" />;
      default: return <Calculator className="h-4 w-4 text-blue-400" />;
    }
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileSearch className="h-8 w-8 text-primary" />
              Diagnóstico de Lógica Financiera
            </h1>
            <p className="text-muted-foreground mt-1">
              Prueba del Ácido Unitaria - Auditoría del Flujo de Dinero
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Modo Auditoría
          </Badge>
        </div>

        {/* Panel de Control */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configuración del Escenario de Prueba
            </CardTitle>
            <CardDescription>
              Aislamiento de Variable Maestra: ING-001 (Consulta Legal Estándar = $150,000 COP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU de Prueba</label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="font-mono text-lg">ING-001</span>
                  <p className="text-xs text-muted-foreground">Consulta Legal Estándar</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Volumen de Prueba</label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="font-mono text-lg">1 unidad</span>
                  <p className="text-xs text-muted-foreground">Análisis unitario puro</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Precio de Entrada</label>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="font-mono text-lg text-green-400">$150,000</span>
                  <p className="text-xs text-muted-foreground">Precio Techo de Mercado</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Mix de Medios de Pago
                </label>
                <Badge variant="secondary">
                  {mixDigital}% Urbano (Digital) / {100 - mixDigital}% Rural (Efectivo)
                </Badge>
              </div>

              <Slider
                value={[mixDigital]}
                onValueChange={(v) => {
                  setMixDigital(v[0]);
                  setEjecutado(false);
                }}
                max={100}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100% Rural (Efectivo + SMS)</span>
                <span>100% Urbano (Wompi Digital)</span>
              </div>
            </div>

            <Button
              onClick={ejecutarAnalisis}
              size="lg"
              className="w-full"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Ejecutar Análisis Paso a Paso
            </Button>
          </CardContent>
        </Card>

        {/* Resultados del Diagnóstico */}
        {diagnostico && (
          <>
            {/* Alertas Críticas */}
            {diagnostico.alertas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas Detectadas ({diagnostico.alertas.length})
                </h2>
                {diagnostico.alertas.map((alerta, idx) => (
                  <Alert
                    key={idx}
                    className={getSeveridadColor(alerta.severidad)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                      <Badge variant="outline" className={getSeveridadColor(alerta.severidad)}>
                        {alerta.severidad}
                      </Badge>
                      {alerta.titulo}
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>{alerta.descripcion}</p>
                      <div className="flex gap-4 text-sm">
                        <span>
                          Valor Actual: <strong>
                            {alerta.tipoValor === 'moneda'
                              ? formatMoney(alerta.valorActual)
                              : `${alerta.valorActual.toFixed(2)}%`}
                          </strong>
                        </span>
                        {alerta.valorEsperado !== undefined && (
                          <span>
                            Valor Esperado: <strong>
                              {alerta.tipoValor === 'moneda'
                                ? formatMoney(alerta.valorEsperado)
                                : `${alerta.valorEsperado.toFixed(2)}%`}
                            </strong>
                          </span>
                        )}
                      </div>
                      {alerta.solucionPropuesta && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono">
                          💡 Solución: {alerta.solucionPropuesta}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Flujo Matemático Paso a Paso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Flujo Matemático del Billete de $150,000
                </CardTitle>
                <CardDescription>
                  Trazabilidad completa de la cascada de costos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnostico.flujo.map((paso, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${paso.esError
                        ? 'bg-red-500/10 border-red-500/30'
                        : paso.tipo === 'info'
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card border-border'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            {getTipoIcon(paso.tipo)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{paso.concepto}</span>
                              <Badge variant="outline" className="text-xs font-mono">
                                {paso.codigo}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 font-mono whitespace-pre-line">
                              {paso.formula}
                            </p>
                            {paso.alerta && (
                              <p className="text-sm text-yellow-500 mt-1">
                                {paso.alerta}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-lg ${paso.tipo === 'entrada'
                            ? 'text-green-400'
                            : paso.tipo === 'info'
                              ? 'text-primary'
                              : 'text-red-400'
                            }`}>
                            {paso.tipo === 'entrada' ? '+' : paso.tipo === 'info' ? '' : '-'}
                            {paso.codigo === 'PE'
                              ? `${paso.monto.toLocaleString()} u.`
                              : formatMoney(Math.abs(paso.monto))
                            }
                          </div>
                          {paso.tipo !== 'info' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Acum: {formatMoney(paso.acumulado)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Verificaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resultados del Análisis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Margen de Contribución</span>
                    <span className={`font-mono text-xl ${diagnostico.margenContribucionPct >= 0.05
                      ? 'text-green-400'
                      : diagnostico.margenContribucionPct >= 0
                        ? 'text-yellow-400'
                        : 'text-red-400'
                      }`}>
                      {formatMoney(diagnostico.margenContribucion)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>% sobre Ingreso</span>
                    <span className={`font-mono text-xl ${diagnostico.margenContribucionPct >= 0.05
                      ? 'text-green-400'
                      : diagnostico.margenContribucionPct >= 0
                        ? 'text-yellow-400'
                        : 'text-red-400'
                      }`}>
                      {(diagnostico.margenContribucionPct * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-transparent hover:border-border transition-colors">
                    <span className="text-sm font-medium">Punto de Equilibrio (Break-even)</span>
                    <div className="text-right">
                      <span className="font-mono text-xl block">
                        {diagnostico.puntoEquilibrioUnidades === Infinity
                          ? '∞ (inviable)'
                          : `${diagnostico.puntoEquilibrioUnidades.toLocaleString()} u/mes`
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Para cubrir ${formatMoney(diagnostico.gastosFijos)} de fijos
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-600">Volumen Objetivo (Meta 15%)</span>
                      <span className="text-xs text-blue-400">Nivel mínimo para viabilidad</span>
                    </div>
                    <span className="font-mono text-xl text-blue-600">
                      {diagnostico.volumenObjetivo === Infinity
                        ? 'Inalcanzable'
                        : `${diagnostico.volumenObjetivo.toLocaleString()} u/mes`
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verificaciones de Auditoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(diagnostico.verificaciones).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded">
                        <span className="text-sm">
                          {key === 'grossUpCorrecto' && 'Cálculo Gross-Up correcto'}
                          {key === 'smsSoloRural' && 'SMS aplicado solo a rural'}
                          {key === 'pasarelaSegmentada' && 'Pasarela segmentada por canal'}
                          {key === 'icaSobreIngresos' && 'ICA sobre ingresos brutos'}
                          {key === 'cloudEscalable' && 'Cloud computing escalable'}
                        </span>
                        {value ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ecuación Final */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Ecuación Resumida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm overflow-x-auto p-4 bg-background/50 rounded-lg">
                  <span className="text-green-400">$150,000</span>
                  <span className="text-muted-foreground"> (Ingreso)</span>
                  <span className="text-red-400"> - ${(diagnostico.flujo.find(f => f.codigo === 'C-VAR-06')?.monto || 0) * -1}</span>
                  <span className="text-muted-foreground"> (Pasarela Digital)</span>
                  <span className="text-red-400"> - ${(diagnostico.flujo.find(f => f.codigo === 'C-VAR-07')?.monto || 0) * -1}</span>
                  <span className="text-muted-foreground"> (Efectivo)</span>
                  <span className="text-red-400"> - $100,000</span>
                  <span className="text-muted-foreground"> (Abogado)</span>
                  <span className="text-orange-400"> - ${Math.round((diagnostico.flujo.find(f => f.codigo === 'C-VAR-04')?.monto || 0) * -1)}</span>
                  <span className="text-muted-foreground"> (ReteFuente)</span>
                  <span className="text-orange-400"> - ${Math.round((diagnostico.flujo.find(f => f.codigo === 'C-VAR-05')?.monto || 0) * -1)}</span>
                  <span className="text-muted-foreground"> (GMF)</span>
                  <span className="text-red-400"> - $3,000</span>
                  <span className="text-muted-foreground"> (SAGRILAFT)</span>
                  <span className="text-red-400"> - $250</span>
                  <span className="text-muted-foreground"> (WhatsApp)</span>
                  <span className="mx-2">=</span>
                  <span className={diagnostico.margenContribucion >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatMoney(diagnostico.margenContribucion)}
                  </span>
                  <span className="text-muted-foreground"> (Margen)</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
