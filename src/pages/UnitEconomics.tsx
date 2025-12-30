/**
 * UNIT ECONOMICS & COHORTS ANALYSIS
 * Análisis de retención, LTV, CAC, Payback Period
 * Heatmap de cohortes para VC Due Diligence
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { 
  Users, DollarSign, Target, Clock, TrendingUp, 
  AlertTriangle, CheckCircle2, Percent
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import {
  INGRESOS_CATALOG,
  RETEFUENTE_ABOGADOS,
  GMF_RATE
} from '@/lib/constants/catalogoMaestro';

// ============ PARÁMETROS DEFAULT ============
const DEFAULT_PARAMS = {
  retencionMensual: 0.92, // 92% retención
  churnMensual: 0.05, // 5% churn
  cacBase: 35000, // CAC $35,000
  arpu: 85000, // ARPU promedio
  margenContribucionPct: 0.18, // ~18% después de costos directos
  mesesAnalisis: 12,
  cohortSize: 100 // Usuarios iniciales por cohorte
};

// ============ TIPOS ============
interface CohortData {
  mes: number;
  usuarios: number;
  retencion: number;
  ingresoMes: number;
  ingresoAcumulado: number;
  ltvAcumulado: number;
}

interface MetricasSaaS {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  arpu: number;
  margenContribucion: number;
  netRetentionRate: number;
}

// ============ CÁLCULOS ============
function calcularCohorte(
  cohortSize: number,
  retencionMensual: number,
  arpu: number,
  margenPct: number,
  meses: number
): CohortData[] {
  const data: CohortData[] = [];
  let usuariosActuales = cohortSize;
  let ingresoAcumulado = 0;
  let ltvAcumulado = 0;
  
  for (let mes = 0; mes <= meses; mes++) {
    if (mes > 0) {
      usuariosActuales = Math.round(usuariosActuales * retencionMensual);
    }
    
    const ingresoMes = usuariosActuales * arpu;
    ingresoAcumulado += ingresoMes;
    ltvAcumulado += (ingresoMes * margenPct);
    
    data.push({
      mes,
      usuarios: usuariosActuales,
      retencion: cohortSize > 0 ? (usuariosActuales / cohortSize) * 100 : 0,
      ingresoMes,
      ingresoAcumulado,
      ltvAcumulado
    });
  }
  
  return data;
}

function calcularMetricasSaaS(
  retencionMensual: number,
  arpu: number,
  margenPct: number,
  cac: number
): MetricasSaaS {
  const churn = 1 - retencionMensual;
  const margenContribucion = arpu * margenPct;
  
  // LTV = (ARPU * Margen) / Churn
  const ltv = churn > 0 ? margenContribucion / churn : margenContribucion * 100;
  
  // Ratio LTV:CAC
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  
  // Payback Period = CAC / Margen Mensual
  const paybackPeriod = margenContribucion > 0 ? cac / margenContribucion : 999;
  
  // Net Revenue Retention (simplificado)
  const netRetentionRate = retencionMensual * 100;
  
  return {
    ltv,
    cac,
    ltvCacRatio,
    paybackPeriod,
    arpu,
    margenContribucion,
    netRetentionRate
  };
}

// ============ HEATMAP COLOR ============
function getHeatmapColor(value: number): string {
  if (value >= 90) return 'bg-green-500 text-white';
  if (value >= 80) return 'bg-green-400 text-white';
  if (value >= 70) return 'bg-yellow-400 text-black';
  if (value >= 60) return 'bg-yellow-500 text-black';
  if (value >= 50) return 'bg-orange-400 text-white';
  if (value >= 40) return 'bg-orange-500 text-white';
  if (value >= 30) return 'bg-red-400 text-white';
  return 'bg-red-500 text-white';
}

export default function UnitEconomics() {
  const [retencion, setRetencion] = useState(DEFAULT_PARAMS.retencionMensual * 100);
  const [cac, setCac] = useState(DEFAULT_PARAMS.cacBase);
  const [arpu, setArpu] = useState(DEFAULT_PARAMS.arpu);
  const [margenPct, setMargenPct] = useState(DEFAULT_PARAMS.margenContribucionPct * 100);
  
  // Calcular margen de contribución real desde el catálogo
  const margenRealCalculado = useMemo(() => {
    // ING-001: Consulta Estándar $150,000
    const precioConsulta = 150000;
    const costoAbogado = 100000;
    const grossUp = costoAbogado * (RETEFUENTE_ABOGADOS / (1 - RETEFUENTE_ABOGADOS));
    const gmf = (costoAbogado + grossUp) * GMF_RATE;
    const pasarela = 6500 * 0.7 + 7200 * 0.3; // Mix 70/30
    const sms = 150 * 0.3;
    const compliance = 3000 + 250;
    
    const costoTotal = costoAbogado + grossUp + gmf + pasarela + sms + compliance;
    const margen = precioConsulta - costoTotal;
    
    return {
      precioConsulta,
      costoTotal,
      margen,
      margenPct: (margen / precioConsulta) * 100
    };
  }, []);
  
  // Datos de cohorte
  const cohortData = useMemo(() => {
    return calcularCohorte(
      DEFAULT_PARAMS.cohortSize,
      retencion / 100,
      arpu,
      margenPct / 100,
      12
    );
  }, [retencion, arpu, margenPct]);
  
  // Métricas SaaS
  const metricas = useMemo(() => {
    return calcularMetricasSaaS(
      retencion / 100,
      arpu,
      margenPct / 100,
      cac
    );
  }, [retencion, arpu, margenPct, cac]);
  
  // Generar múltiples cohortes para el heatmap
  const cohortesMultiples = useMemo(() => {
    const cohortes = [];
    for (let i = 0; i < 6; i++) {
      const cohort = calcularCohorte(
        DEFAULT_PARAMS.cohortSize,
        retencion / 100,
        arpu,
        margenPct / 100,
        12 - i
      );
      cohortes.push({
        nombre: `Cohorte ${i + 1}`,
        mes: i + 1,
        data: cohort.map(d => d.retencion)
      });
    }
    return cohortes;
  }, [retencion, arpu, margenPct]);
  
  // Estado de las métricas
  const ltvCacStatus = metricas.ltvCacRatio >= 3 ? 'success' : metricas.ltvCacRatio >= 2 ? 'warning' : 'danger';
  const paybackStatus = metricas.paybackPeriod <= 12 ? 'success' : metricas.paybackPeriod <= 18 ? 'warning' : 'danger';
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Unit Economics & Cohorts</h1>
          <p className="text-muted-foreground mt-1">
            Análisis de retención, LTV/CAC y métricas SaaS para Due Diligence
          </p>
        </div>
        <Badge variant={ltvCacStatus === 'success' ? 'default' : 'destructive'}>
          LTV:CAC {metricas.ltvCacRatio.toFixed(1)}x
        </Badge>
      </div>
      
      {/* Controles de Parámetros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros de Análisis</CardTitle>
          <CardDescription>Ajusta los drivers para simular escenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Retención Mensual: {retencion.toFixed(0)}%</Label>
              <Slider
                value={[retencion]}
                onValueChange={([v]) => setRetencion(v)}
                min={50}
                max={99}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>CAC (COP)</Label>
              <Input
                type="number"
                value={cac}
                onChange={(e) => setCac(parseInt(e.target.value) || 0)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>ARPU Mensual (COP)</Label>
              <Input
                type="number"
                value={arpu}
                onChange={(e) => setArpu(parseInt(e.target.value) || 0)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Margen Contribución: {margenPct.toFixed(0)}%</Label>
              <Slider
                value={[margenPct]}
                onValueChange={([v]) => setMargenPct(v)}
                min={5}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Real calculado: {margenRealCalculado.margenPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LTV */}
        <Card className="border-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lifetime Value (LTV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(metricas.ltv)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Margen acumulado por cliente
            </p>
          </CardContent>
        </Card>
        
        {/* CAC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Customer Acquisition Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(metricas.cac)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Inversión para adquirir 1 cliente
            </p>
          </CardContent>
        </Card>
        
        {/* LTV:CAC Ratio */}
        <Card className={`border-${ltvCacStatus === 'success' ? 'green' : ltvCacStatus === 'warning' ? 'yellow' : 'red'}-500/50`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ratio LTV:CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ltvCacStatus === 'success' ? 'text-green-600' : ltvCacStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
              {metricas.ltvCacRatio.toFixed(1)}x
            </div>
            <div className="flex items-center gap-1 mt-1">
              {ltvCacStatus === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {ltvCacStatus === 'success' ? 'Saludable (≥3x)' : ltvCacStatus === 'warning' ? 'Ajustado (2-3x)' : 'Crítico (<2x)'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Payback Period */}
        <Card className={`border-${paybackStatus === 'success' ? 'green' : paybackStatus === 'warning' ? 'yellow' : 'red'}-500/50`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payback Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${paybackStatus === 'success' ? 'text-green-600' : paybackStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
              {metricas.paybackPeriod.toFixed(1)} meses
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meses para recuperar CAC
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Desglose Margen Real */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Margen de Contribución Real (Catálogo V5.0)
          </CardTitle>
          <CardDescription>
            Cálculo basado en ING-001: Consulta Legal Estándar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Precio Venta</p>
              <p className="font-bold text-green-600">{formatCOP(margenRealCalculado.precioConsulta)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">(-) Costos Directos</p>
              <p className="font-bold text-red-600">{formatCOP(margenRealCalculado.costoTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">= Margen Unit.</p>
              <p className="font-bold">{formatCOP(margenRealCalculado.margen)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">% Margen</p>
              <p className="font-bold">{margenRealCalculado.margenPct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">LTV Real</p>
              <p className="font-bold text-accent">
                {formatCOP(margenRealCalculado.margen / (1 - retencion/100))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Heatmap de Cohortes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Heatmap de Retención por Cohorte
          </CardTitle>
          <CardDescription>
            Cada fila es una cohorte de 100 usuarios. Los colores indican % de retención.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Cohorte</TableHead>
                  {Array.from({ length: 13 }, (_, i) => (
                    <TableHead key={i} className="text-center w-16">
                      M{i}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohortesMultiples.map((cohort, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{cohort.nombre}</TableCell>
                    {cohort.data.map((val, mIdx) => (
                      <TableCell 
                        key={mIdx} 
                        className={`text-center font-mono text-xs ${getHeatmapColor(val)}`}
                      >
                        {val.toFixed(0)}%
                      </TableCell>
                    ))}
                    {/* Celdas vacías para cohortes más recientes */}
                    {Array.from({ length: 13 - cohort.data.length }, (_, i) => (
                      <TableCell key={`empty-${i}`} className="bg-muted/50" />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            🟢 ≥80% | 🟡 60-79% | 🟠 40-59% | 🔴 &lt;40%
          </p>
        </CardContent>
      </Card>
      
      {/* Gráfico de Decaimiento de Cohorte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Curva de Retención (Cohorte 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `M${v}`}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retención']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="retencion" radius={[4, 4, 0, 0]}>
                  {cohortData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.retencion >= 80 ? 'hsl(var(--accent))' : 
                            entry.retencion >= 60 ? 'hsl(45, 100%, 50%)' : 
                            'hsl(var(--destructive))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabla de Proyección de Ingresos por Cohorte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyección de Ingresos por Cohorte</CardTitle>
          <CardDescription>
            Ingresos acumulados y LTV por mes para 100 usuarios iniciales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Usuarios</TableHead>
                  <TableHead className="text-right">Retención</TableHead>
                  <TableHead className="text-right">Ingreso Mes</TableHead>
                  <TableHead className="text-right">Ingreso Acum.</TableHead>
                  <TableHead className="text-right">LTV Acum.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohortData.map((row) => (
                  <TableRow key={row.mes}>
                    <TableCell className="font-medium">Mes {row.mes}</TableCell>
                    <TableCell className="text-right font-mono">{row.usuarios}</TableCell>
                    <TableCell className="text-right font-mono">{row.retencion.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(row.ingresoMes)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCOP(row.ingresoAcumulado)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-accent">
                      {formatCOP(row.ltvAcumulado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
