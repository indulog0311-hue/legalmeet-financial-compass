import { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import {
  KPICardInstitutional,
  KPICurrency,
  KPIRatio,
  KPIRunway,
  KPIPercentage
} from '@/components/kpis/KPICardInstitutional';
import { AlertCard } from '@/components/alerts/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCOP, formatCompact } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Users, Target,
  AlertTriangle, ArrowRight, Clock,
  Activity, Play, PieChart, Wallet, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Bar, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Alerta } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function Dashboard() {
  const navigate = useNavigate();
  const {
    config,
    volumenes,
    parametrosMacro,
    catalogoIngresos,
    catalogoOPEX,
    simulacionActiva,
    iniciarSimulacion
  } = useSimuladorStore();

  // Generar alertas basadas en datos del simulador
  const alertas = useMemo((): Alerta[] => {
    if (!simulacionActiva) return [];
    const año = config.añoInicio;
    const volAño = volumenes[año] || {};
    const proy = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoIngresos);
    const gen: Alerta[] = [];
    const burnRate = Math.max(0, ((proy.totales.totalCostosDirectos + proy.totales.totalOPEX) - proy.totales.ingresosBrutos) / 12);
    const runway = burnRate > 0 ? config.capitalInicial / burnRate : 999;
    if (runway < 6) gen.push({ id: uuidv4(), severidad: 'CRITICA', categoria: 'Liquidez', titulo: 'Runway Crítico', descripcion: `${runway.toFixed(1)} meses`, valor_actual: runway, benchmark: 6, accion_recomendada: 'Levantar capital', fecha: new Date() });
    if (proy.totales.margenEBITDAPct < 0) gen.push({ id: uuidv4(), severidad: 'CRITICA', categoria: 'Rentabilidad', titulo: 'EBITDA Negativo', descripcion: `${proy.totales.margenEBITDAPct.toFixed(1)}%`, valor_actual: proy.totales.margenEBITDAPct, benchmark: 20, accion_recomendada: 'Reducir costos', fecha: new Date() });
    if (config.tasaChurnMensual > 0.07) gen.push({ id: uuidv4(), severidad: 'ALTA', categoria: 'Eficiencia', titulo: 'Churn Alto', descripcion: `${(config.tasaChurnMensual * 100).toFixed(1)}%`, valor_actual: config.tasaChurnMensual * 100, benchmark: 7, accion_recomendada: 'Mejorar retención', fecha: new Date() });
    return gen;
  }, [config, volumenes, parametrosMacro, catalogoIngresos, simulacionActiva]);

  const alertasCriticas = alertas.filter(a => a.severidad === 'CRITICA');

  const proyecciones = useMemo(() => {
    const result: Record<number, ReturnType<typeof calcularProyeccionAnual>> = {};
    const catalogoEfectivo = catalogoIngresos.length > 0 ? catalogoIngresos : undefined;

    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año] || {};
      result[año] = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoEfectivo);
    }

    return result;
  }, [config, volumenes, parametrosMacro, catalogoIngresos]);

  // GMV vs Net Revenue data for V6 chart
  const revenueData = useMemo(() => {
    return Object.entries(proyecciones).map(([año, proy]) => {
      // GMV = Total dinero que pasa (ingresos brutos + payout abogados)
      // Net Revenue = Ingresos netos (nuestra comisión)
      const gmv = proy.totales.ingresosBrutos * 1.4; // Estimado GMV ~40% más que Net Rev
      const netRevenue = proy.totales.ingresosBrutos;
      const takeRate = (netRevenue / gmv) * 100;

      return {
        periodo: año,
        gmv,
        netRevenue,
        takeRate,
        ebitda: proy.totales.ebitda,
        margenEBITDA: proy.totales.margenEBITDAPct
      };
    });
  }, [proyecciones]);

  // Calcular KPIs reales
  const kpisCalculados = useMemo(() => {
    const primerAño = proyecciones[config.añoInicio];
    const ultimoAño = proyecciones[config.añoFin];
    const añoAnterior = proyecciones[config.añoInicio + 1];

    if (!primerAño || !ultimoAño) return null;

    // GMV y Net Revenue del primer año
    const gmvActual = primerAño.totales.ingresosBrutos * 1.4;
    const netRevenueActual = primerAño.totales.ingresosBrutos;
    const gmvAnterior = añoAnterior ? añoAnterior.totales.ingresosBrutos * 1.4 : undefined;
    const netRevenueAnterior = añoAnterior ? añoAnterior.totales.ingresosBrutos : undefined;

    // EBITDA
    const ebitdaActual = primerAño.totales.ebitda;
    const margenEBITDA = primerAño.totales.margenEBITDAPct;

    // Burn rate mensual promedio (Gross Burn = Lo que gasta la empresa para operar)
    const costosMensualesAnuales = primerAño.totales.totalCostosDirectos + primerAño.totales.totalOPEX;
    const ingresosMensualesAnuales = primerAño.totales.ingresosBrutos;

    // Gross Burn: Gastos totales promedio / 12
    const grossBurnRate = costosMensualesAnuales / 12;

    // Net Burn: (Gastos - Ingresos) / 12
    const netBurnRate = Math.max(0, (costosMensualesAnuales - ingresosMensualesAnuales) / 12);

    // Runway (Se calcula con Net Burn)
    const runway = netBurnRate > 0 ? config.capitalInicial / netBurnRate : 999;

    // LTV/CAC aproximado
    const costoMarketingMensual = primerAño.totales.totalOPEX * 0.15;
    const cacEstimado = costoMarketingMensual * 3;
    const volAño = volumenes[config.añoInicio] || {};
    const usuariosEstimados = Object.values(volAño).reduce((total, skuVol) => {
      const volMes12 = skuVol[12] || 0;
      return total + volMes12;
    }, 0);
    const mrrActual = primerAño.meses[11]?.ingresosBrutos || 0;
    const arpuMensual = mrrActual / Math.max(1, usuariosEstimados);
    const churn = config.tasaChurnMensual;
    const lifespan = churn > 0 ? 1 / churn : 20;
    const ltv = arpuMensual * lifespan;
    const ltvCacRatio = cacEstimado > 0 ? ltv / cacEstimado : 0;

    // Take Rate (Net Revenue / GMV)
    const takeRate = (netRevenueActual / gmvActual) * 100;

    return {
      gmv: gmvActual,
      gmvAnterior,
      netRevenue: netRevenueActual,
      netRevenueAnterior,
      takeRate,
      ebitda: ebitdaActual,
      margenEBITDA,
      burnRate: grossBurnRate, // Mostramos Gross Burn en la tarjeta
      netBurnRate, // Guardamos Net Burn por si se necesita
      runway: Math.min(runway, 999),
      ltvCacRatio,
      ingresosTotales: Object.values(proyecciones).reduce((sum, p) => sum + p.totales.ingresosBrutos, 0),
      utilidadTotal: Object.values(proyecciones).reduce((sum, p) => sum + p.totales.utilidadNeta, 0)
    };
  }, [proyecciones, config, volumenes]);

  if (!simulacionActiva) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Iniciar Simulación Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure los parámetros en la página de Configuración e inicie la simulación para ver las proyecciones financieras {config.añoInicio}-{config.añoFin}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/')}>
                Ir a Configuración
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  iniciarSimulacion();
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar con valores por defecto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="group hover:border-accent/50 transition-colors cursor-pointer"
            onClick={() => navigate('/catalogo')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Catálogo SKU</p>
                  <p className="text-sm text-muted-foreground">{catalogoIngresos.length} productos configurados</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:border-accent/50 transition-colors cursor-pointer"
            onClick={() => navigate('/')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Configuración</p>
                  <p className="text-sm text-muted-foreground">Parámetros y volúmenes</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:border-accent/50 transition-colors cursor-pointer"
            onClick={() => navigate('/costos')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Catálogo Maestro</p>
                  <p className="text-sm text-muted-foreground">Ingresos, Costos, OPEX</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alertas Críticas */}
      {alertasCriticas.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              {alertasCriticas.length} Alerta{alertasCriticas.length > 1 ? 's' : ''} Crítica{alertasCriticas.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertasCriticas.slice(0, 3).map(alerta => (
              <AlertCard key={alerta.id} alerta={alerta} compact />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Executive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-lg">Proyección {config.añoInicio} - {config.añoFin}</p>
            <p className="text-xs text-muted-foreground">
              {(config.añoFin - config.añoInicio + 1) * 12} meses · Modelo V6 Institucional
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono">
            Total: {formatCOP(kpisCalculados?.ingresosTotales || 0)}
          </Badge>
          <Badge variant={kpisCalculados?.utilidadTotal && kpisCalculados.utilidadTotal >= 0 ? 'default' : 'destructive'} className="font-mono">
            Utilidad: {formatCOP(kpisCalculados?.utilidadTotal || 0)}
          </Badge>
        </div>
      </div>

      {/* KPIs Grid - Institutional Style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICurrency
          title="GMV"
          value={kpisCalculados?.gmv}
          previousValue={kpisCalculados?.gmvAnterior}
          previousPeriod="año anterior"
          icon={<Wallet className="h-5 w-5" />}
          tooltip="Gross Merchandise Value - Dinero total procesado incluyendo payout a abogados"
          size="lg"
        />

        <KPICurrency
          title="Net Revenue"
          value={kpisCalculados?.netRevenue}
          previousValue={kpisCalculados?.netRevenueAnterior}
          previousPeriod="año anterior"
          icon={<DollarSign className="h-5 w-5" />}
          tooltip="Ingresos netos - Dinero que es de la empresa (comisiones + suscripciones)"
          size="lg"
        />

        <KPIPercentage
          title="EBITDA %"
          value={kpisCalculados?.margenEBITDA}
          benchmark={20}
          benchmarkLabel="Meta"
          icon={<TrendingUp className="h-5 w-5" />}
          tooltip="Margen EBITDA sobre ingresos netos"
        />

        <KPIRunway
          title="Runway"
          value={kpisCalculados?.runway}
          previousValue={24}
          icon={<Clock className="h-5 w-5" />}
        />

        <KPIRatio
          title="LTV/CAC"
          value={kpisCalculados?.ltvCacRatio}
          benchmark={3}
          benchmarkLabel="Meta ≥3x"
          icon={<Target className="h-5 w-5" />}
          tooltip="Ratio entre Lifetime Value y Costo de Adquisición. Meta: ≥3x"
          alertThreshold={{ warning: 2, critical: 1, direction: 'below' }}
        />
      </div>

      {/* Charts Section - GMV vs Net Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV vs Net Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-accent" />
                GMV vs Net Revenue
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Take Rate: {kpisCalculados?.takeRate?.toFixed(1) || '—'}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="netRevGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${formatCompact(value)}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{label}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-muted-foreground">{entry.name}:</span>
                              <span className="font-mono font-medium">{formatCOP(entry.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px' }}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="gmv"
                    name="GMV"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#gmvGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="netRevenue"
                    name="Net Revenue"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#netRevGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* EBITDA Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Evolución EBITDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${formatCompact(value)}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{label}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-muted-foreground">{entry.name}:</span>
                              <span className="font-mono font-medium">
                                {entry.name === 'Margen %' ? `${entry.value?.toFixed(1)}%` : formatCOP(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px' }}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="ebitda"
                    name="EBITDA"
                    fill="hsl(var(--chart-3))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="margenEBITDA"
                    name="Margen %"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Unit Economics Resumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICardInstitutional
              title="Take Rate"
              value={kpisCalculados?.takeRate}
              format="percentage"
              benchmark={25}
              benchmarkLabel="Objetivo"
              tooltip="Porcentaje de GMV que se convierte en Net Revenue"
              compact
            />
            <KPICardInstitutional
              title="EBITDA"
              value={kpisCalculados?.ebitda}
              format="currency"
              tooltip="Earnings Before Interest, Taxes, Depreciation & Amortization"
              compact
            />
            <KPICardInstitutional
              title="Gross Burn"
              value={kpisCalculados?.burnRate}
              format="currency"
              tooltip="Gastos operativos mensuales promedio (Gross Burn)"
              alertThreshold={{ warning: 50000000, critical: 100000000, direction: 'above' }}
              compact
            />
            <KPICardInstitutional
              title="Churn"
              value={config.tasaChurnMensual * 100}
              format="percentage"
              benchmark={5}
              benchmarkLabel="Meta <5%"
              tooltip="Tasa de cancelación mensual"
              alertThreshold={{ warning: 5, critical: 7, direction: 'above' }}
              compact
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="group hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => navigate('/unit-economics')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Unit Economics</p>
                <p className="text-sm text-muted-foreground">LTV, CAC, Cohortes</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => navigate('/strategy')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#C5A059]">Visión Estratégica</p>
                <p className="text-sm text-muted-foreground">Roadmap & Riesgos</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => navigate('/estados-financieros')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Estados Financieros</p>
                <p className="text-sm text-muted-foreground">P&L, Balance, Flujo</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => navigate('/sensitivity')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Análisis de Riesgo</p>
                <p className="text-sm text-muted-foreground">Sensibilidad, Escenarios</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
