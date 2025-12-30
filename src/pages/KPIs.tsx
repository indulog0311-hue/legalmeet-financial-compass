import { useMemo, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import { KPICard } from '@/components/kpis/KPICard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCOP, formatPercent, formatMonths } from '@/lib/formatters';
import { BENCHMARKS } from '@/lib/constants/benchmarks';
import { 
  Target, TrendingUp, Users, DollarSign, 
  Clock, Activity, Wallet, Calendar,
  AlertCircle
} from 'lucide-react';

export function KPIs() {
  const { 
    config, 
    volumenes, 
    parametrosMacro, 
    catalogoIngresos,
    simulacionActiva
  } = useSimuladorStore();

  const [añoSeleccionado, setAñoSeleccionado] = useState(config.añoInicio);

  // Generar lista de años del periodo
  const añosDisponibles = useMemo(() => {
    const años = [];
    for (let a = config.añoInicio; a <= config.añoFin; a++) {
      años.push(a);
    }
    return años;
  }, [config.añoInicio, config.añoFin]);

  // Calcular proyecciones para todos los años
  const proyecciones = useMemo(() => {
    const result: Record<number, ReturnType<typeof calcularProyeccionAnual>> = {};
    const catalogoEfectivo = catalogoIngresos.length > 0 ? catalogoIngresos : undefined;
    
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año] || {};
      result[año] = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoEfectivo);
    }
    
    return result;
  }, [config, volumenes, parametrosMacro, catalogoIngresos]);

  // KPIs calculados del año seleccionado
  const kpisAño = useMemo(() => {
    const proy = proyecciones[añoSeleccionado];
    if (!proy) return null;

    const totales = proy.totales;
    const meses = proy.meses;
    
    // MRR del último mes del año
    const mrrUltimoMes = meses[11]?.ingresosBrutos || 0;
    const arr = mrrUltimoMes * 12;
    
    // Estimar usuarios del año basado en volúmenes
    const volAño = volumenes[añoSeleccionado] || {};
    const usuariosMes12 = Object.values(volAño).reduce((total, skuVol) => {
      return total + (skuVol[12] || 0);
    }, 0);
    
    // ARPU mensual
    const arpuMensual = usuariosMes12 > 0 ? mrrUltimoMes / usuariosMes12 : 0;
    
    // Churn y Lifespan
    const churnMensual = config.tasaChurnMensual;
    const lifespan = churnMensual > 0 ? 1 / churnMensual : 20;
    
    // LTV
    const ltv = arpuMensual * lifespan;
    
    // CAC estimado (costo marketing anual / usuarios nuevos estimados)
    const costoMarketingAnual = totales.totalOPEX * 0.15; // ~15% OPEX es marketing
    const cacEstimado = usuariosMes12 > 0 ? (costoMarketingAnual / usuariosMes12) * 3 : 0;
    
    // LTV/CAC Ratio
    const ltvCacRatio = cacEstimado > 0 ? ltv / cacEstimado : 0;
    
    // Payback Period
    const paybackMonths = arpuMensual > 0 && cacEstimado > 0 ? cacEstimado / arpuMensual : 0;
    
    // Burn Rate mensual
    const costosMensuales = (totales.totalCostosDirectos + totales.totalOPEX) / 12;
    const ingresosMensuales = totales.ingresosBrutos / 12;
    const burnRate = Math.max(0, costosMensuales - ingresosMensuales);
    
    // Runway
    const runway = burnRate > 0 ? config.capitalInicial / burnRate : 999;
    
    // GMV (Gross Merchandise Volume)
    const gmv = totales.ingresosBrutos;
    
    // Márgenes
    const margenBruto = totales.margenBrutoPct;
    const margenEBITDA = totales.margenEBITDAPct;
    const margenNeto = totales.margenNetoPct;
    
    // Crecimiento YoY
    const proyAnterior = proyecciones[añoSeleccionado - 1];
    const crecimientoYoY = proyAnterior 
      ? ((totales.ingresosBrutos - proyAnterior.totales.ingresosBrutos) / Math.max(1, proyAnterior.totales.ingresosBrutos)) * 100
      : 0;
    
    // Rule of 40
    const ruleOf40 = crecimientoYoY + margenEBITDA;

    return {
      mrr: mrrUltimoMes,
      arr,
      ltv,
      cac: cacEstimado,
      ltvCacRatio,
      paybackMonths,
      churnMensual,
      lifespan,
      burnRate,
      runway: Math.min(runway, 999),
      gmv,
      margenBruto,
      margenEBITDA,
      margenNeto,
      crecimientoYoY,
      ruleOf40,
      ingresosBrutos: totales.ingresosBrutos,
      utilidadBruta: totales.utilidadBruta,
      ebitda: totales.ebitda,
      utilidadNeta: totales.utilidadNeta,
      usuarios: usuariosMes12
    };
  }, [proyecciones, añoSeleccionado, volumenes, config]);

  // KPIs totales del periodo
  const kpisTotales = useMemo(() => {
    const ingresosTotales = Object.values(proyecciones).reduce((sum, p) => sum + p.totales.ingresosBrutos, 0);
    const utilidadTotal = Object.values(proyecciones).reduce((sum, p) => sum + p.totales.utilidadNeta, 0);
    const ebitdaTotal = Object.values(proyecciones).reduce((sum, p) => sum + p.totales.ebitda, 0);
    
    // CAGR
    const primerAño = proyecciones[config.añoInicio];
    const ultimoAño = proyecciones[config.añoFin];
    const años = config.añoFin - config.añoInicio;
    
    let cagr = 0;
    if (primerAño && ultimoAño && años > 0 && primerAño.totales.ingresosBrutos > 0) {
      cagr = (Math.pow(ultimoAño.totales.ingresosBrutos / primerAño.totales.ingresosBrutos, 1 / años) - 1) * 100;
    }

    return {
      ingresosTotales,
      utilidadTotal,
      ebitdaTotal,
      cagr
    };
  }, [proyecciones, config.añoInicio, config.añoFin]);

  if (!simulacionActiva) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Simulación no iniciada</h3>
            <p className="text-muted-foreground">
              Configure los parámetros en la página de Configuración e inicie la simulación para ver los KPIs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con selector de año */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicadores Clave (KPIs)</h1>
          <p className="text-muted-foreground mt-1">
            Periodo {config.añoInicio} - {config.añoFin} • Métricas calculadas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={añoSeleccionado.toString()} 
            onValueChange={(v) => setAñoSeleccionado(parseInt(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {añosDisponibles.map(año => (
                <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen del periodo */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Resumen {config.añoInicio}-{config.añoFin}</p>
                <p className="text-xs text-muted-foreground">Métricas agregadas del periodo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">
                Ingresos: {formatCOP(kpisTotales.ingresosTotales)}
              </Badge>
              <Badge variant="outline">
                EBITDA: {formatCOP(kpisTotales.ebitdaTotal)}
              </Badge>
              <Badge variant={kpisTotales.utilidadTotal >= 0 ? 'default' : 'destructive'}>
                Utilidad: {formatCOP(kpisTotales.utilidadTotal)}
              </Badge>
              <Badge variant="secondary">
                CAGR: {formatPercent(kpisTotales.cagr)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Unit Economics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="CAC"
            value={kpisAño?.cac ? formatCOP(kpisAño.cac) : '—'}
            subtitle={`Benchmark: ≤ ${formatCOP(BENCHMARKS.CAC_MAXIMO)}`}
            icon={<DollarSign className="h-5 w-5" />}
            status={
              kpisAño?.cac
                ? kpisAño.cac <= BENCHMARKS.CAC_MAXIMO ? 'success' : 'danger'
                : 'neutral'
            }
          />
          
          <KPICard
            title="LTV"
            value={kpisAño?.ltv ? formatCOP(kpisAño.ltv) : '—'}
            subtitle="Valor de vida del cliente"
            icon={<Wallet className="h-5 w-5" />}
            status={kpisAño?.ltv && kpisAño.ltv > 0 ? 'success' : 'neutral'}
          />
          
          <KPICard
            title="LTV/CAC Ratio"
            value={kpisAño?.ltvCacRatio ? `${kpisAño.ltvCacRatio.toFixed(2)}x` : '—'}
            subtitle={`Benchmark: ≥ ${BENCHMARKS.LTV_CAC_MINIMO}x`}
            icon={<Target className="h-5 w-5" />}
            status={
              kpisAño?.ltvCacRatio
                ? kpisAño.ltvCacRatio >= BENCHMARKS.LTV_CAC_MINIMO ? 'success' 
                : kpisAño.ltvCacRatio >= 2 ? 'warning'
                : 'danger'
                : 'neutral'
            }
          />
          
          <KPICard
            title="Payback Period"
            value={kpisAño?.paybackMonths ? `${kpisAño.paybackMonths.toFixed(1)} meses` : '—'}
            subtitle="Tiempo para recuperar CAC"
            icon={<Clock className="h-5 w-5" />}
            status={
              kpisAño?.paybackMonths
                ? kpisAño.paybackMonths <= 12 ? 'success' 
                : kpisAño.paybackMonths <= 18 ? 'warning'
                : 'danger'
                : 'neutral'
            }
          />
        </div>
      </div>

      {/* SaaS Metrics Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Métricas SaaS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="MRR"
            value={kpisAño?.mrr ? formatCOP(kpisAño.mrr) : '—'}
            subtitle="Ingreso Mensual Recurrente"
            icon={<DollarSign className="h-5 w-5" />}
            status={kpisAño?.mrr && kpisAño.mrr > 0 ? 'success' : 'neutral'}
          />
          
          <KPICard
            title="ARR"
            value={kpisAño?.arr ? formatCOP(kpisAño.arr) : '—'}
            subtitle="Ingreso Anual Recurrente"
            icon={<DollarSign className="h-5 w-5" />}
            status={kpisAño?.arr && kpisAño.arr > 0 ? 'success' : 'neutral'}
          />
          
          <KPICard
            title="Churn Mensual"
            value={kpisAño?.churnMensual ? formatPercent(kpisAño.churnMensual * 100) : '—'}
            subtitle={`Benchmark: ≤ ${formatPercent(BENCHMARKS.CHURN_MAXIMO * 100)}`}
            icon={<Users className="h-5 w-5" />}
            status={
              kpisAño?.churnMensual
                ? kpisAño.churnMensual <= BENCHMARKS.CHURN_MAXIMO ? 'success' : 'danger'
                : 'neutral'
            }
          />
          
          <KPICard
            title="Lifespan"
            value={kpisAño?.lifespan ? `${kpisAño.lifespan.toFixed(1)} meses` : '—'}
            subtitle="Duración promedio del cliente"
            icon={<Clock className="h-5 w-5" />}
            status={kpisAño?.lifespan && kpisAño.lifespan >= 12 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Liquidity Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Indicadores de Liquidez
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Runway"
            value={kpisAño?.runway ? formatMonths(kpisAño.runway) : '—'}
            subtitle={`Benchmark: ≥ ${BENCHMARKS.RUNWAY_MINIMO_MESES} meses`}
            icon={<Clock className="h-5 w-5" />}
            status={
              kpisAño?.runway
                ? kpisAño.runway >= 12 ? 'success' 
                : kpisAño.runway >= BENCHMARKS.RUNWAY_MINIMO_MESES ? 'warning'
                : 'danger'
                : 'neutral'
            }
          />
          
          <KPICard
            title="Burn Rate"
            value={kpisAño?.burnRate ? formatCOP(kpisAño.burnRate) : '—'}
            subtitle="Consumo mensual de efectivo"
            icon={<Activity className="h-5 w-5" />}
            status={kpisAño?.burnRate && kpisAño.burnRate > 0 ? 'warning' : 'success'}
          />
          
          <KPICard
            title="GMV"
            value={kpisAño?.gmv ? formatCOP(kpisAño.gmv) : '—'}
            subtitle="Volumen bruto de mercancía"
            icon={<DollarSign className="h-5 w-5" />}
            status="neutral"
          />
        </div>
      </div>

      {/* Visual KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LTV/CAC Ratio</CardTitle>
            <CardDescription>
              Objetivo: ≥ 3.0x para unit economics saludables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              {kpisAño?.ltvCacRatio ? (
                <div className="text-center">
                  <p className={`text-5xl font-bold ${
                    kpisAño.ltvCacRatio >= 3 ? 'text-success' :
                    kpisAño.ltvCacRatio >= 2 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {kpisAño.ltvCacRatio.toFixed(2)}x
                  </p>
                  <Badge 
                    className={`mt-2 ${
                      kpisAño.ltvCacRatio >= 3 ? 'bg-success' :
                      kpisAño.ltvCacRatio >= 2 ? 'bg-warning' : 'bg-destructive'
                    }`}
                  >
                    {kpisAño.ltvCacRatio >= 3 ? 'Saludable' :
                     kpisAño.ltvCacRatio >= 2 ? 'Mejorable' : 'Crítico'}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground">Configure volúmenes para calcular</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rule of 40</CardTitle>
            <CardDescription>
              Growth Rate + EBITDA Margin ≥ 40%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-5xl font-bold ${
                  (kpisAño?.ruleOf40 || 0) >= 40 ? 'text-success' :
                  (kpisAño?.ruleOf40 || 0) >= 20 ? 'text-warning' : 'text-destructive'
                }`}>
                  {kpisAño?.ruleOf40?.toFixed(0) || '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crecimiento: {formatPercent(kpisAño?.crecimientoYoY || 0)} + EBITDA: {formatPercent(kpisAño?.margenEBITDA || 0)}
                </p>
                <Badge 
                  className={`mt-2 ${
                    (kpisAño?.ruleOf40 || 0) >= 40 ? 'bg-success' :
                    (kpisAño?.ruleOf40 || 0) >= 20 ? 'bg-warning' : 'bg-destructive'
                  }`}
                >
                  {(kpisAño?.ruleOf40 || 0) >= 40 ? 'Excelente' :
                   (kpisAño?.ruleOf40 || 0) >= 20 ? 'Aceptable' : 'Por mejorar'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmarks Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benchmarks de Referencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="font-semibold">Unit Economics</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>LTV/CAC ≥ {BENCHMARKS.LTV_CAC_MINIMO}x</li>
                <li>CAC ≤ {formatCOP(BENCHMARKS.CAC_MAXIMO)}</li>
                <li>Churn ≤ {formatPercent(BENCHMARKS.CHURN_MAXIMO * 100)}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Liquidez</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>Runway ≥ {BENCHMARKS.RUNWAY_MINIMO_MESES} meses</li>
                <li>Liquidez corriente ≥ 1.0</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Rentabilidad</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>Margen Bruto ≥ {formatPercent(BENCHMARKS.MARGEN_BRUTO_MINIMO * 100)}</li>
                <li>EBITDA ≥ 20%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Crecimiento</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>Growth YoY ≥ 20%</li>
                <li>Rule of 40 ≥ 40</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}