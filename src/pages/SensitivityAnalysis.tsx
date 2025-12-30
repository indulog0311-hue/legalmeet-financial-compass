/**
 * SENSITIVITY ANALYSIS (TORNADO CHART)
 * Análisis de sensibilidad de 3 drivers críticos
 * Visualización del impacto en EBITDA y Punto de Equilibrio
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCOP, formatPercent } from '@/lib/formatters';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Users, MapPin, AlertTriangle, Target
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell, ReferenceLine,
  LineChart, Line, Legend
} from 'recharts';
import {
  INGRESOS_CATALOG,
  COSTOS_DIRECTOS_CATALOG,
  getOPEXFijoMensual,
  getNominaTotalCalculado,
  RETEFUENTE_ABOGADOS,
  GMF_RATE
} from '@/lib/constants/catalogoMaestro';

// ============ PARÁMETROS BASE ============
const BASE_PARAMS = {
  precioConsulta: 150000,
  costoAbogado: 100000,
  ruralidad: 0.30, // 30% rural
  nominaMensual: getNominaTotalCalculado(),
  opexFijo: getOPEXFijoMensual(),
  volumenMensual: 500,
  mixDigital: 0.70
};

// ============ TIPOS ============
interface SensitivityResult {
  driver: string;
  variacionPct: number;
  ebitdaBase: number;
  ebitdaNuevo: number;
  impacto: number;
  impactoPct: number;
  puntoEquilibrioBase: number;
  puntoEquilibrioNuevo: number;
}

interface TornadoData {
  driver: string;
  impactoPositivo: number;
  impactoNegativo: number;
  label: string;
}

// ============ CÁLCULO DE EBITDA ============
function calcularEBITDA(
  precioConsulta: number,
  costoAbogado: number,
  ruralidad: number,
  nominaMensual: number,
  volumen: number
): { ebitda: number; margenContribucion: number; puntoEquilibrio: number } {
  // Ingresos
  const ingresos = precioConsulta * volumen;
  
  // Costos directos por transacción
  const grossUp = costoAbogado * (RETEFUENTE_ABOGADOS / (1 - RETEFUENTE_ABOGADOS));
  const gmf = (costoAbogado + grossUp) * GMF_RATE;
  const pasarelaDigital = 6500 * (1 - ruralidad);
  const pasarelaRural = 7200 * ruralidad;
  const sms = 150 * ruralidad;
  const compliance = 3000 + 250;
  
  const costoUnitario = costoAbogado + grossUp + gmf + pasarelaDigital + pasarelaRural + sms + compliance;
  const costosDirectos = costoUnitario * volumen;
  
  // Margen de contribución
  const margenContribucion = ingresos - costosDirectos;
  const margenUnitario = precioConsulta - costoUnitario;
  
  // OPEX (nómina + otros)
  const otrosOPEX = BASE_PARAMS.opexFijo - BASE_PARAMS.nominaMensual;
  const opexTotal = nominaMensual + otrosOPEX;
  
  // EBITDA
  const ebitda = margenContribucion - opexTotal;
  
  // Punto de equilibrio
  const puntoEquilibrio = margenUnitario > 0 ? Math.ceil(opexTotal / margenUnitario) : Infinity;
  
  return { ebitda, margenContribucion, puntoEquilibrio };
}

// ============ ANÁLISIS DE SENSIBILIDAD ============
function analizarSensibilidad(variacionPct: number): SensitivityResult[] {
  const base = calcularEBITDA(
    BASE_PARAMS.precioConsulta,
    BASE_PARAMS.costoAbogado,
    BASE_PARAMS.ruralidad,
    BASE_PARAMS.nominaMensual,
    BASE_PARAMS.volumenMensual
  );
  
  const resultados: SensitivityResult[] = [];
  
  // 1. Precio de Consulta
  const precioArriba = BASE_PARAMS.precioConsulta * (1 + variacionPct);
  const precioAbajo = BASE_PARAMS.precioConsulta * (1 - variacionPct);
  
  const ebitdaPrecioArriba = calcularEBITDA(precioArriba, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  const ebitdaPrecioAbajo = calcularEBITDA(precioAbajo, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  
  resultados.push({
    driver: 'Precio Consulta',
    variacionPct: variacionPct * 100,
    ebitdaBase: base.ebitda,
    ebitdaNuevo: ebitdaPrecioArriba.ebitda,
    impacto: ebitdaPrecioArriba.ebitda - base.ebitda,
    impactoPct: base.ebitda !== 0 ? ((ebitdaPrecioArriba.ebitda - base.ebitda) / Math.abs(base.ebitda)) * 100 : 0,
    puntoEquilibrioBase: base.puntoEquilibrio,
    puntoEquilibrioNuevo: ebitdaPrecioArriba.puntoEquilibrio
  });
  
  // 2. Porcentaje de Ruralidad
  const ruralidadArriba = Math.min(BASE_PARAMS.ruralidad * (1 + variacionPct), 0.9);
  const ruralidadAbajo = Math.max(BASE_PARAMS.ruralidad * (1 - variacionPct), 0.1);
  
  const ebitdaRuralArriba = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, ruralidadArriba, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  const ebitdaRuralAbajo = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, ruralidadAbajo, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  
  // Más ruralidad = más costos = menos EBITDA (impacto negativo)
  resultados.push({
    driver: 'Ruralidad',
    variacionPct: variacionPct * 100,
    ebitdaBase: base.ebitda,
    ebitdaNuevo: ebitdaRuralAbajo.ebitda, // Menos rural = mejor
    impacto: ebitdaRuralAbajo.ebitda - base.ebitda,
    impactoPct: base.ebitda !== 0 ? ((ebitdaRuralAbajo.ebitda - base.ebitda) / Math.abs(base.ebitda)) * 100 : 0,
    puntoEquilibrioBase: base.puntoEquilibrio,
    puntoEquilibrioNuevo: ebitdaRuralAbajo.puntoEquilibrio
  });
  
  // 3. Nómina
  const nominaArriba = BASE_PARAMS.nominaMensual * (1 + variacionPct);
  const nominaAbajo = BASE_PARAMS.nominaMensual * (1 - variacionPct);
  
  const ebitdaNominaArriba = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, nominaArriba, BASE_PARAMS.volumenMensual);
  const ebitdaNominaAbajo = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, nominaAbajo, BASE_PARAMS.volumenMensual);
  
  // Menos nómina = mejor EBITDA
  resultados.push({
    driver: 'Nómina',
    variacionPct: variacionPct * 100,
    ebitdaBase: base.ebitda,
    ebitdaNuevo: ebitdaNominaAbajo.ebitda,
    impacto: ebitdaNominaAbajo.ebitda - base.ebitda,
    impactoPct: base.ebitda !== 0 ? ((ebitdaNominaAbajo.ebitda - base.ebitda) / Math.abs(base.ebitda)) * 100 : 0,
    puntoEquilibrioBase: base.puntoEquilibrio,
    puntoEquilibrioNuevo: ebitdaNominaAbajo.puntoEquilibrio
  });
  
  return resultados;
}

// ============ DATOS TORNADO ============
function generarTornadoData(variacionPct: number): TornadoData[] {
  const base = calcularEBITDA(
    BASE_PARAMS.precioConsulta,
    BASE_PARAMS.costoAbogado,
    BASE_PARAMS.ruralidad,
    BASE_PARAMS.nominaMensual,
    BASE_PARAMS.volumenMensual
  );
  
  const data: TornadoData[] = [];
  
  // Precio +/-
  const precioUp = calcularEBITDA(BASE_PARAMS.precioConsulta * (1 + variacionPct), BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  const precioDown = calcularEBITDA(BASE_PARAMS.precioConsulta * (1 - variacionPct), BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  
  data.push({
    driver: 'Precio Consulta',
    impactoPositivo: precioUp.ebitda - base.ebitda,
    impactoNegativo: precioDown.ebitda - base.ebitda,
    label: `±${(variacionPct * 100).toFixed(0)}%`
  });
  
  // Ruralidad (invertido: menos rural = positivo)
  const ruralUp = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, Math.min(BASE_PARAMS.ruralidad * (1 + variacionPct), 0.8), BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  const ruralDown = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, Math.max(BASE_PARAMS.ruralidad * (1 - variacionPct), 0.1), BASE_PARAMS.nominaMensual, BASE_PARAMS.volumenMensual);
  
  data.push({
    driver: 'Ruralidad',
    impactoPositivo: ruralDown.ebitda - base.ebitda, // Menos rural = positivo
    impactoNegativo: ruralUp.ebitda - base.ebitda, // Más rural = negativo
    label: `±${(variacionPct * 100).toFixed(0)}%`
  });
  
  // Nómina (invertido: menos nómina = positivo)
  const nominaUp = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual * (1 + variacionPct), BASE_PARAMS.volumenMensual);
  const nominaDown = calcularEBITDA(BASE_PARAMS.precioConsulta, BASE_PARAMS.costoAbogado, BASE_PARAMS.ruralidad, BASE_PARAMS.nominaMensual * (1 - variacionPct), BASE_PARAMS.volumenMensual);
  
  data.push({
    driver: 'Nómina',
    impactoPositivo: nominaDown.ebitda - base.ebitda, // Menos nómina = positivo
    impactoNegativo: nominaUp.ebitda - base.ebitda, // Más nómina = negativo
    label: `±${(variacionPct * 100).toFixed(0)}%`
  });
  
  // Ordenar por impacto total (más sensible primero)
  return data.sort((a, b) => 
    (Math.abs(a.impactoPositivo) + Math.abs(a.impactoNegativo)) - 
    (Math.abs(b.impactoPositivo) + Math.abs(b.impactoNegativo))
  ).reverse();
}

// ============ CURVAS DE SENSIBILIDAD ============
function generarCurvasSensibilidad(): { x: number; precio: number; ruralidad: number; nomina: number }[] {
  const puntos = [];
  
  for (let pct = -30; pct <= 30; pct += 5) {
    const variacion = pct / 100;
    
    const ebitdaPrecio = calcularEBITDA(
      BASE_PARAMS.precioConsulta * (1 + variacion),
      BASE_PARAMS.costoAbogado,
      BASE_PARAMS.ruralidad,
      BASE_PARAMS.nominaMensual,
      BASE_PARAMS.volumenMensual
    );
    
    const ebitdaRural = calcularEBITDA(
      BASE_PARAMS.precioConsulta,
      BASE_PARAMS.costoAbogado,
      Math.min(Math.max(BASE_PARAMS.ruralidad * (1 + variacion), 0.05), 0.9),
      BASE_PARAMS.nominaMensual,
      BASE_PARAMS.volumenMensual
    );
    
    const ebitdaNomina = calcularEBITDA(
      BASE_PARAMS.precioConsulta,
      BASE_PARAMS.costoAbogado,
      BASE_PARAMS.ruralidad,
      BASE_PARAMS.nominaMensual * (1 + variacion),
      BASE_PARAMS.volumenMensual
    );
    
    puntos.push({
      x: pct,
      precio: ebitdaPrecio.ebitda,
      ruralidad: ebitdaRural.ebitda,
      nomina: ebitdaNomina.ebitda
    });
  }
  
  return puntos;
}

export default function SensitivityAnalysis() {
  const [variacion, setVariacion] = useState(20);
  
  // Cálculos base
  const baseResult = useMemo(() => {
    return calcularEBITDA(
      BASE_PARAMS.precioConsulta,
      BASE_PARAMS.costoAbogado,
      BASE_PARAMS.ruralidad,
      BASE_PARAMS.nominaMensual,
      BASE_PARAMS.volumenMensual
    );
  }, []);
  
  // Análisis de sensibilidad
  const sensibilidad = useMemo(() => {
    return analizarSensibilidad(variacion / 100);
  }, [variacion]);
  
  // Datos Tornado
  const tornadoData = useMemo(() => {
    return generarTornadoData(variacion / 100);
  }, [variacion]);
  
  // Curvas de sensibilidad
  const curvasSensibilidad = useMemo(() => generarCurvasSensibilidad(), []);
  
  // Driver más sensible
  const driverMasSensible = tornadoData[0];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análisis de Sensibilidad</h1>
          <p className="text-muted-foreground mt-1">
            Tornado Chart - Impacto de variables críticas en EBITDA
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          EBITDA Base: {formatCOP(baseResult.ebitda)}
        </Badge>
      </div>
      
      {/* Parámetros Base */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Escenario Base (500 tx/mes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Precio Consulta</p>
              <p className="font-bold">{formatCOP(BASE_PARAMS.precioConsulta)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ruralidad</p>
              <p className="font-bold">{(BASE_PARAMS.ruralidad * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nómina Mensual</p>
              <p className="font-bold">{formatCOP(BASE_PARAMS.nominaMensual)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">EBITDA</p>
              <p className={`font-bold ${baseResult.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCOP(baseResult.ebitda)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Punto Equilibrio</p>
              <p className="font-bold">{baseResult.puntoEquilibrio} tx/mes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Control de Variación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Rango de Variación: ±{variacion}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Slider
            value={[variacion]}
            onValueChange={([v]) => setVariacion(v)}
            min={5}
            max={40}
            step={5}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Simula qué pasa si cada driver cambia entre -{variacion}% y +{variacion}%
          </p>
        </CardContent>
      </Card>
      
      {/* Alerta de Driver Más Sensible */}
      {driverMasSensible && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold">Driver Más Sensible: {driverMasSensible.driver}</p>
                <p className="text-sm text-muted-foreground">
                  Una variación de ±{variacion}% impacta el EBITDA en hasta {formatCOP(Math.max(Math.abs(driverMasSensible.impactoPositivo), Math.abs(driverMasSensible.impactoNegativo)))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tornado Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tornado Chart - Impacto en EBITDA</CardTitle>
          <CardDescription>
            Barras hacia la derecha = mejora EBITDA | Barras hacia la izquierda = reduce EBITDA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={tornadoData}
                margin={{ left: 100, right: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <YAxis 
                  type="category" 
                  dataKey="driver"
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  width={90}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCOP(value), 
                    name === 'impactoPositivo' ? 'Mejora' : 'Reducción'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={2} />
                <Bar dataKey="impactoNegativo" fill="hsl(var(--destructive))" radius={[4, 0, 0, 4]} />
                <Bar dataKey="impactoPositivo" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Curvas de Sensibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Curvas de Sensibilidad (Spider Chart)</CardTitle>
          <CardDescription>
            Cómo cambia el EBITDA al variar cada driver de -30% a +30%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curvasSensibilidad}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="x" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: 'Variación %', position: 'bottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCOP(value), 
                    name === 'precio' ? 'Precio' : name === 'ruralidad' ? 'Ruralidad' : 'Nómina'
                  ]}
                  labelFormatter={(label) => `Variación: ${label}%`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="precio" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Precio Consulta" />
                <Line type="monotone" dataKey="ruralidad" stroke="hsl(280, 100%, 60%)" strokeWidth={2} dot={false} name="Ruralidad" />
                <Line type="monotone" dataKey="nomina" stroke="hsl(45, 100%, 50%)" strokeWidth={2} dot={false} name="Nómina" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabla de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de Impacto por Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Driver</th>
                  <th className="text-right py-2">Variación</th>
                  <th className="text-right py-2">EBITDA Base</th>
                  <th className="text-right py-2">EBITDA Nuevo</th>
                  <th className="text-right py-2">Impacto $</th>
                  <th className="text-right py-2">Impacto %</th>
                  <th className="text-right py-2">PE Base</th>
                  <th className="text-right py-2">PE Nuevo</th>
                </tr>
              </thead>
              <tbody>
                {sensibilidad.map((s, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 font-medium flex items-center gap-2">
                      {s.driver === 'Precio Consulta' && <DollarSign className="h-4 w-4 text-accent" />}
                      {s.driver === 'Ruralidad' && <MapPin className="h-4 w-4 text-purple-500" />}
                      {s.driver === 'Nómina' && <Users className="h-4 w-4 text-yellow-500" />}
                      {s.driver}
                    </td>
                    <td className="text-right py-2 font-mono">±{s.variacionPct.toFixed(0)}%</td>
                    <td className="text-right py-2 font-mono">{formatCOP(s.ebitdaBase)}</td>
                    <td className="text-right py-2 font-mono">{formatCOP(s.ebitdaNuevo)}</td>
                    <td className={`text-right py-2 font-mono ${s.impacto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.impacto >= 0 ? '+' : ''}{formatCOP(s.impacto)}
                    </td>
                    <td className={`text-right py-2 font-mono ${s.impactoPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.impactoPct >= 0 ? '+' : ''}{s.impactoPct.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 font-mono">{s.puntoEquilibrioBase}</td>
                    <td className="text-right py-2 font-mono">{s.puntoEquilibrioNuevo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            PE = Punto de Equilibrio (transacciones/mes)
          </p>
        </CardContent>
      </Card>
      
      {/* Recomendaciones */}
      <Card className="bg-accent/5 border-accent/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recomendaciones Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Precio:</strong> Es el driver de mayor impacto. Un incremento del {variacion}% mejora el EBITDA en {formatCOP(tornadoData.find(t => t.driver === 'Precio Consulta')?.impactoPositivo || 0)}.</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
              <span><strong>Ruralidad:</strong> Reducir la dependencia rural mejora márgenes. Cada punto menos de ruralidad reduce costos de pasarela y SMS.</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 text-yellow-500 mt-0.5" />
              <span><strong>Nómina:</strong> Es costo fijo. Optimizar el equipo tiene impacto directo en punto de equilibrio.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
