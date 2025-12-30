/**
 * INVESTOR ONE-PAGER - LegalMeet Colombia
 * Simulación Financiera 2026-2031
 * Escenario: Crecimiento Realista
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCOP } from '@/lib/formatters';
import {
  TrendingUp, DollarSign, Target, Calendar,
  AlertTriangle, CheckCircle2, Wallet, Users,
  ArrowUpRight, ArrowDownRight, Percent
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine
} from 'recharts';
import {
  INGRESOS_CATALOG,
  GASTOS_OPEX_CATALOG,
  getNominaTotalCalculado,
  getOPEXFijoMensual,
  RETEFUENTE_ABOGADOS,
  GMF_RATE,
  TASA_RENTA,
  TASA_ICA_BOGOTA
} from '@/lib/constants/catalogoMaestro';

// ============ PARÁMETROS DE SIMULACIÓN ============
const PARAMS = {
  // Escenario Realista
  volumenInicialMes1: 100, // Consultas/mes en Enero 2026
  crecimientoAño1: 0.10, // 10% mensual
  crecimientoAño2_5: 0.05, // 5% mensual

  // Macro
  inflacion: 0.055, // 5.5%
  incrementoSalarios: 0.08, // 8% anual

  // Mix de productos (distribución del volumen total)
  mixProductos: {
    'ING-001': 0.40, // Consulta Estándar
    'ING-002': 0.15, // SOS Legal
    'ING-003': 0.20, // Flash
    'ING-004': 0.10, // Docs
    'ING-005': 0.08, // Suscripción Abogado
    'ING-006': 0.02, // B2B
    'ING-007': 0.05, // Onboarding
  },

  // Financiero
  capitalInicial: 500000000, // 500M COP
  mixDigital: 0.70,
  churnMensual: 0.05
};

// ============ TIPOS ============
interface ProyeccionMes {
  periodo: string;
  año: number;
  mes: number;
  mesGlobal: number;
  volumenTotal: number;
  ingresosBrutos: number;
  costosDirectos: number;
  margenContribucion: number;
  opex: number;
  ebitda: number;
  impuestos: number;
  utilidadNeta: number;
  flujoCaja: number;
  saldoAcumulado: number;
  saldoOperativo: number; // Nuevo: Acumulado pure sin capital inicial
}

interface ResumenAnual {
  año: number;
  ingresosBrutos: number;
  costosDirectos: number;
  margenBruto: number;
  margenBrutoPct: number;
  opex: number;
  ebitda: number;
  ebitdaPct: number;
  utilidadNeta: number;
  margenNetoPct: number;
  flujoCajaAnual: number;
  saldoFinalAño: number;
}

// ============ MOTOR DE SIMULACIÓN ============
function ejecutarSimulacion(): {
  proyeccionMensual: ProyeccionMes[];
  resumenAnual: ResumenAnual[];
  kpis: {
    necesidadCapital: number;
    mesValleMinimo: string;
    mesBreakeven: string;
    mesesHastaBreakeven: number;
    margenEBITDAEstabilizado: number;
    ltvCacRatio: number;
    ltv: number;
    cac: number;
  };
} {
  const proyeccionMensual: ProyeccionMes[] = [];
  let saldoAcumulado = PARAMS.capitalInicial;
  let saldoOperativo = 0; // Starts at 0 to track pure burn

  // Generar 72 meses (2026-2031)
  for (let mesGlobal = 1; mesGlobal <= 72; mesGlobal++) {
    const año = 2025 + Math.ceil(mesGlobal / 12);
    const mes = ((mesGlobal - 1) % 12) + 1;
    const periodo = `${año}-${mes.toString().padStart(2, '0')}`;

    // Calcular volumen con crecimiento compuesto
    const tasaCrecimiento = año === 2026 ? PARAMS.crecimientoAño1 : PARAMS.crecimientoAño2_5;
    const volumenTotal = Math.round(
      PARAMS.volumenInicialMes1 * Math.pow(1 + tasaCrecimiento, mesGlobal - 1)
    );

    // Calcular ingresos por SKU (aplicando mix)
    let ingresosBrutos = 0;
    let costosDirectos = 0;

    const factorInflacion = Math.pow(1 + PARAMS.inflacion, (año - 2026));

    INGRESOS_CATALOG.forEach(ingreso => {
      const mixSKU = PARAMS.mixProductos[ingreso.codigo as keyof typeof PARAMS.mixProductos] || 0;
      const volumenSKU = Math.round(volumenTotal * mixSKU);
      const precioIndexado = Math.round(ingreso.valorUnitario * factorInflacion);

      ingresosBrutos += precioIndexado * volumenSKU;

      // Costos directos por transacción
      // Costo abogado (solo para ING-001, ING-002, ING-003)
      let costoAbogado = 0;
      if (ingreso.codigo === 'ING-001') costoAbogado = 100000 * factorInflacion * volumenSKU;
      if (ingreso.codigo === 'ING-002') costoAbogado = 120000 * factorInflacion * volumenSKU;
      if (ingreso.codigo === 'ING-003') costoAbogado = 15000 * factorInflacion * volumenSKU;

      // Gross-up ReteFuente (11%)
      const retefuente = costoAbogado > 0 ? costoAbogado * (RETEFUENTE_ABOGADOS / (1 - RETEFUENTE_ABOGADOS)) : 0;

      // GMF sobre dispersión
      const gmf = (costoAbogado + retefuente) * GMF_RATE;

      // Pasarela (mix digital)
      const pasarela = volumenSKU * (PARAMS.mixDigital * 6500 + (1 - PARAMS.mixDigital) * 7200);

      // SMS (solo rural)
      const sms = volumenSKU * (1 - PARAMS.mixDigital) * 150;

      // SAGRILAFT + WhatsApp
      const compliance = volumenSKU * (3000 + 250);

      costosDirectos += costoAbogado + retefuente + gmf + pasarela + sms + compliance;
    });

    const margenContribucion = ingresosBrutos - costosDirectos;

    // OPEX (ajustado por inflación en salarios)
    const factorSalarios = Math.pow(1 + PARAMS.incrementoSalarios, (año - 2026));
    const nominaBase = getNominaTotalCalculado();
    const opexFijo = getOPEXFijoMensual();

    const nomina = Math.round(nominaBase * factorSalarios);
    const otrosOPEX = Math.round((opexFijo - nominaBase) * factorInflacion);
    const cloudVariable = Math.round(volumenTotal * 0.3 * 400); // 30% son usuarios activos
    const marketingVariable = Math.round(volumenTotal * 0.1 * 35000); // 10% son nuevos, CAC $35K

    const opex = nomina + otrosOPEX + cloudVariable + marketingVariable;

    // EBITDA
    const ebitda = margenContribucion - opex;

    // Impuestos (simplificado)
    const ica = ingresosBrutos * TASA_ICA_BOGOTA;
    const renta = ebitda > 0 ? ebitda * TASA_RENTA : 0;
    const impuestos = Math.round(ica + renta);

    // Utilidad Neta
    const utilidadNeta = ebitda - impuestos;

    const flujoCaja = Math.round(utilidadNeta * 0.95); // Aproximación

    saldoAcumulado += flujoCaja;
    saldoOperativo += flujoCaja; // Tracks pure operational cash flow

    proyeccionMensual.push({
      periodo,
      año,
      mes,
      mesGlobal,
      volumenTotal,
      ingresosBrutos: Math.round(ingresosBrutos),
      costosDirectos: Math.round(costosDirectos),
      margenContribucion: Math.round(margenContribucion),
      opex: Math.round(opex),
      ebitda: Math.round(ebitda),
      impuestos,
      utilidadNeta: Math.round(utilidadNeta),
      flujoCaja,
      saldoAcumulado: Math.round(saldoAcumulado),
      saldoOperativo: Math.round(saldoOperativo)
    });
  }

  // Calcular resumen anual
  const resumenAnual: ResumenAnual[] = [];
  for (let año = 2026; año <= 2031; año++) {
    const mesesAño = proyeccionMensual.filter(p => p.año === año);
    const ingresosBrutos = mesesAño.reduce((sum, m) => sum + m.ingresosBrutos, 0);
    const costosDirectos = mesesAño.reduce((sum, m) => sum + m.costosDirectos, 0);
    const margenBruto = ingresosBrutos - costosDirectos;
    const opex = mesesAño.reduce((sum, m) => sum + m.opex, 0);
    const ebitda = mesesAño.reduce((sum, m) => sum + m.ebitda, 0);
    const utilidadNeta = mesesAño.reduce((sum, m) => sum + m.utilidadNeta, 0);
    const flujoCajaAnual = mesesAño.reduce((sum, m) => sum + m.flujoCaja, 0);
    const saldoFinalAño = mesesAño[mesesAño.length - 1]?.saldoAcumulado || 0;

    resumenAnual.push({
      año,
      ingresosBrutos,
      costosDirectos,
      margenBruto,
      margenBrutoPct: ingresosBrutos > 0 ? (margenBruto / ingresosBrutos) * 100 : 0,
      opex,
      ebitda,
      ebitdaPct: ingresosBrutos > 0 ? (ebitda / ingresosBrutos) * 100 : 0,
      utilidadNeta,
      margenNetoPct: ingresosBrutos > 0 ? (utilidadNeta / ingresosBrutos) * 100 : 0,
      flujoCajaAnual,
      saldoFinalAño
    });
  }

  // Calcular KPIs críticos

  // 1. Necesidad de Capital (Valle de la Muerte) - Pure Calculation
  // We want to know the LOWEST point of the Operational Cash Flow accumulator.
  // That lowest point (absolute) represents the funding needed to reach profitability.
  const saldoOperativoMinimo = Math.min(0, ...proyeccionMensual.map(p => p.saldoOperativo));
  const necesidadCapital = Math.abs(saldoOperativoMinimo);
  const mesValleMinimo = proyeccionMensual.find(p => p.saldoOperativo === saldoOperativoMinimo)?.periodo || '-';

  // 2. Fecha de Breakeven (primer mes con flujo positivo sostenido)
  let mesBreakeven = '-';
  let mesesHastaBreakeven = 0;
  for (let i = 0; i < proyeccionMensual.length; i++) {
    if (proyeccionMensual[i].flujoCaja > 0) {
      // Verificar que se mantiene positivo los próximos 3 meses
      const siguientes3 = proyeccionMensual.slice(i, i + 4);
      if (siguientes3.every(m => m.flujoCaja > 0)) {
        mesBreakeven = proyeccionMensual[i].periodo;
        mesesHastaBreakeven = proyeccionMensual[i].mesGlobal;
        break;
      }
    }
  }

  // 3. EBITDA Promedio Estabilizado (Año 3-5)
  const ebitdaEstabilizado = resumenAnual
    .filter(r => r.año >= 2028)
    .reduce((sum, r) => sum + r.ebitdaPct, 0) / 4;

  // 4. LTV/CAC
  // LTV = (ARPU mensual * Margen Contribución %) / Churn
  const ultimoMes = proyeccionMensual[proyeccionMensual.length - 1];
  const arpu = ultimoMes.ingresosBrutos / ultimoMes.volumenTotal;
  const margenPct = ultimoMes.margenContribucion / ultimoMes.ingresosBrutos;
  const ltv = (arpu * margenPct) / PARAMS.churnMensual;
  const cac = 35000; // CAC fijo del modelo
  const ltvCacRatio = ltv / cac;

  return {
    proyeccionMensual,
    resumenAnual,
    kpis: {
      necesidadCapital,
      mesValleMinimo,
      mesBreakeven,
      mesesHastaBreakeven,
      margenEBITDAEstabilizado: ebitdaEstabilizado,
      ltvCacRatio,
      ltv,
      cac
    }
  };
}

export default function InvestorOnePager() {
  const { proyeccionMensual, resumenAnual, kpis } = useMemo(() => ejecutarSimulacion(), []);

  // Preparar datos para gráficos
  const dataFlujoCaja = proyeccionMensual.map(p => ({
    periodo: p.periodo,
    saldo: p.saldoAcumulado,
    flujo: p.flujoCaja
  }));

  const dataEBITDA = resumenAnual.map(r => ({
    año: r.año.toString(),
    ebitda: r.ebitda,
    ebitdaPct: r.ebitdaPct,
    ingresos: r.ingresosBrutos
  }));

  // Determinar estado del negocio
  const esViable = kpis.ltvCacRatio >= 3 && kpis.margenEBITDAEstabilizado >= 20;
  const esRentable = resumenAnual[resumenAnual.length - 1].utilidadNeta > 0;
  const capitalSuficiente = kpis.necesidadCapital <= PARAMS.capitalInicial;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investor One-Pager</h1>
          <p className="text-muted-foreground mt-1">
            Simulación Financiera LegalMeet | Escenario Realista 2026-2031
          </p>
        </div>
        <Badge variant={esViable ? 'default' : 'destructive'} className="text-sm px-3 py-1">
          {esViable ? '✅ NEGOCIO VIABLE' : '⚠️ REVISAR MODELO'}
        </Badge>
      </div>

      {/* Parámetros de Simulación */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge variant="outline">Inicio: 100 consultas/mes</Badge>
            <Badge variant="outline">Año 1: +10% mensual</Badge>
            <Badge variant="outline">Año 2-5: +5% mensual</Badge>
            <Badge variant="outline">Inflación: 5.5%</Badge>
            <Badge variant="outline">Capital: $500M</Badge>
            <Badge variant="outline">OPEX: $32M+/mes</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPIs Críticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Necesidad de Capital */}
        <Card className={!capitalSuficiente ? 'border-destructive/50' : 'border-green-500/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Necesidad de Capital
            </CardTitle>
            <CardDescription className="text-xs">Burn Máximo del Negocio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${!capitalSuficiente ? 'text-destructive' : ''}`}>
              {formatCOP(kpis.necesidadCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valle más profundo: {kpis.mesValleMinimo}
            </p>
            {capitalSuficiente ? (
              <Badge variant="outline" className="mt-2 text-green-600 border-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Cubierto (Capital {formatCOP(PARAMS.capitalInicial)})
              </Badge>
            ) : (
              <Badge variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" /> Déficit: {formatCOP(kpis.necesidadCapital - PARAMS.capitalInicial)}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* 2. Fecha Breakeven */}
        <Card className={kpis.mesesHastaBreakeven <= 24 ? 'border-green-500/50' : 'border-amber-500/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Punto de Equilibrio
            </CardTitle>
            <CardDescription className="text-xs">Breakeven Date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.mesBreakeven}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mes #{kpis.mesesHastaBreakeven} de operación
            </p>
            <Badge
              variant="outline"
              className={`mt-2 ${kpis.mesesHastaBreakeven <= 24 ? 'text-green-600 border-green-500' : 'text-amber-600 border-amber-500'}`}
            >
              {kpis.mesesHastaBreakeven <= 18 ? '🚀 Excelente' :
                kpis.mesesHastaBreakeven <= 24 ? '✅ Dentro de meta' :
                  '⚠️ Tardío'}
            </Badge>
          </CardContent>
        </Card>

        {/* 3. EBITDA Estabilizado */}
        <Card className={kpis.margenEBITDAEstabilizado >= 25 ? 'border-green-500/50' : 'border-amber-500/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              EBITDA Estabilizado
            </CardTitle>
            <CardDescription className="text-xs">Promedio 2028-2031</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.margenEBITDAEstabilizado.toFixed(1)}%
            </div>
            <Progress
              value={Math.min(kpis.margenEBITDAEstabilizado, 50)}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Benchmark SaaS: ≥25%
            </p>
            <Badge
              variant="outline"
              className={`mt-2 ${kpis.margenEBITDAEstabilizado >= 25 ? 'text-green-600 border-green-500' : 'text-amber-600 border-amber-500'}`}
            >
              {kpis.margenEBITDAEstabilizado >= 30 ? '🔥 Premium' :
                kpis.margenEBITDAEstabilizado >= 25 ? '✅ Saludable' :
                  kpis.margenEBITDAEstabilizado >= 20 ? '⚠️ Ajustado' : '❌ Bajo'}
            </Badge>
          </CardContent>
        </Card>

        {/* 4. LTV/CAC */}
        <Card className={kpis.ltvCacRatio >= 3 ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              LTV / CAC
            </CardTitle>
            <CardDescription className="text-xs">Unit Economics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.ltvCacRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              LTV: {formatCOP(kpis.ltv)} | CAC: {formatCOP(kpis.cac)}
            </p>
            <Badge
              variant="outline"
              className={`mt-2 ${kpis.ltvCacRatio >= 3 ? 'text-green-600 border-green-500' : 'text-destructive border-destructive'}`}
            >
              {kpis.ltvCacRatio >= 5 ? '🦄 Excelente' :
                kpis.ltvCacRatio >= 3 ? '✅ Sostenible' : '❌ No viable'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Flujo de Caja Acumulado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Flujo de Caja Acumulado (Valle de la Muerte)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataFlujoCaja.filter((_, i) => i % 3 === 0)}>
                <defs>
                  <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCOP(value), 'Saldo']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                <ReferenceLine y={PARAMS.capitalInicial} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(var(--accent))"
                  fill="url(#saldoGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Proyección Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            Proyección Financiera Anualizada (COP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Concepto</TableHead>
                  {resumenAnual.map(r => (
                    <TableHead key={r.año} className="text-right font-bold">{r.año}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Ingresos Brutos</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className="text-right font-mono">
                      {(r.ingresosBrutos / 1000000).toFixed(0)}M
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Costos Directos</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className="text-right font-mono text-muted-foreground">
                      {(r.costosDirectos / 1000000).toFixed(0)}M
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">Margen Bruto</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className="text-right font-mono">
                      {(r.margenBruto / 1000000).toFixed(0)}M
                      <span className="text-xs text-muted-foreground ml-1">
                        ({r.margenBrutoPct.toFixed(0)}%)
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">(-) OPEX</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className="text-right font-mono text-muted-foreground">
                      {(r.opex / 1000000).toFixed(0)}M
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-accent/10">
                  <TableCell className="font-bold">EBITDA</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className={`text-right font-mono font-bold ${r.ebitda < 0 ? 'text-destructive' : ''}`}>
                      {(r.ebitda / 1000000).toFixed(0)}M
                      <span className="text-xs ml-1">
                        ({r.ebitdaPct.toFixed(0)}%)
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Utilidad Neta</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className={`text-right font-mono ${r.utilidadNeta < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {(r.utilidadNeta / 1000000).toFixed(0)}M
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Saldo Caja (Fin Año)</TableCell>
                  {resumenAnual.map(r => (
                    <TableCell key={r.año} className={`text-right font-mono font-bold ${r.saldoFinalAño < 0 ? 'text-destructive' : ''}`}>
                      {(r.saldoFinalAño / 1000000).toFixed(0)}M
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico EBITDA por Año */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Evolución EBITDA Anual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEBITDA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="año"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCOP(value),
                    name === 'ebitda' ? 'EBITDA' : 'Ingresos'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" />
                <Bar dataKey="ebitda" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Veredicto Final */}
      <Card className={esViable && esRentable ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {esViable && esRentable ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Veredicto de Inversión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Fortalezas</h4>
              <ul className="space-y-1 text-sm">
                {kpis.ltvCacRatio >= 3 && (
                  <li className="flex items-center gap-2 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    Unit Economics sólidos (LTV/CAC {kpis.ltvCacRatio.toFixed(1)}x)
                  </li>
                )}
                {kpis.necesidadCapital === 0 && (
                  <li className="flex items-center gap-2 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    Capital inicial cubre operación hasta breakeven
                  </li>
                )}
                {kpis.mesesHastaBreakeven <= 24 && (
                  <li className="flex items-center gap-2 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    Breakeven en {kpis.mesesHastaBreakeven} meses (meta: 24)
                  </li>
                )}
                {kpis.margenEBITDAEstabilizado >= 20 && (
                  <li className="flex items-center gap-2 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    EBITDA estable al {kpis.margenEBITDAEstabilizado.toFixed(0)}%
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Riesgos</h4>
              <ul className="space-y-1 text-sm">
                {kpis.necesidadCapital > 0 && (
                  <li className="flex items-center gap-2 text-destructive">
                    <ArrowDownRight className="h-4 w-4" />
                    Requiere levantar {formatCOP(kpis.necesidadCapital)}
                  </li>
                )}
                {kpis.mesesHastaBreakeven > 24 && (
                  <li className="flex items-center gap-2 text-amber-600">
                    <ArrowDownRight className="h-4 w-4" />
                    Breakeven tardío ({kpis.mesesHastaBreakeven} meses)
                  </li>
                )}
                <li className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Dependencia de volumen de consultas
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  OPEX de nómina alto ($32M+/mes)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="font-semibold text-lg">
              {esViable && esRentable
                ? '🟢 NEGOCIO VIABLE PARA INVERSIÓN'
                : '🟡 REQUIERE AJUSTES ANTES DE LEVANTAR'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {esViable && esRentable
                ? `Con $${(PARAMS.capitalInicial / 1000000).toFixed(0)}M de capital inicial, el modelo alcanza rentabilidad en el mes ${kpis.mesesHastaBreakeven} y genera EBITDA del ${kpis.margenEBITDAEstabilizado.toFixed(0)}% estabilizado.`
                : 'Revisar estructura de costos o aumentar volumen inicial para mejorar unit economics.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
